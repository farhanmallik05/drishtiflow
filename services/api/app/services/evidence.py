import base64
from datetime import datetime, timedelta, timezone
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from ..config import settings

EVIDENCE_PREFIX = "enc:v1:"


class EvidenceConfigurationError(RuntimeError):
    """Raised when protected evidence is requested without a configured key."""


class EvidenceDecryptionError(ValueError):
    """Raised when encrypted evidence cannot be authenticated or decoded."""


def _fernet() -> Fernet:
    key = settings.EVIDENCE_ENCRYPTION_KEY.strip()
    if not key:
        raise EvidenceConfigurationError(
            "EVIDENCE_ENCRYPTION_KEY must be configured before storing evidence."
        )
    try:
        return Fernet(key.encode("ascii"))
    except (ValueError, UnicodeEncodeError) as exc:
        raise EvidenceConfigurationError(
            "EVIDENCE_ENCRYPTION_KEY must be a valid Fernet key."
        ) from exc


def encrypt_evidence(evidence_base64: Optional[str]) -> Optional[str]:
    if not evidence_base64:
        return evidence_base64
    ciphertext = _fernet().encrypt(evidence_base64.encode("utf-8"))
    return EVIDENCE_PREFIX + base64.urlsafe_b64encode(ciphertext).decode("ascii")


def decrypt_evidence(stored_value: Optional[str]) -> Optional[str]:
    if not stored_value or not stored_value.startswith(EVIDENCE_PREFIX):
        # Compatibility path for rows created before encrypted evidence storage.
        return stored_value

    encoded_ciphertext = stored_value[len(EVIDENCE_PREFIX):]
    try:
        ciphertext = base64.urlsafe_b64decode(encoded_ciphertext.encode("ascii"))
        return _fernet().decrypt(ciphertext).decode("utf-8")
    except (ValueError, UnicodeEncodeError, InvalidToken) as exc:
        raise EvidenceDecryptionError("Stored evidence failed authentication.") from exc


def purge_expired_evidence(conn, now: Optional[datetime] = None) -> int:
    retention_days = settings.EVIDENCE_RETENTION_DAYS
    if retention_days <= 0:
        return 0

    current_time = now or datetime.now(timezone.utc)
    cutoff = (current_time - timedelta(days=retention_days)).isoformat()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE incidents
        SET evidence_frame_base64 = NULL, evidence_url = NULL
        WHERE created_at < ?
          AND (evidence_frame_base64 IS NOT NULL OR evidence_url IS NOT NULL)
        """,
        (cutoff,),
    )
    return cursor.rowcount
