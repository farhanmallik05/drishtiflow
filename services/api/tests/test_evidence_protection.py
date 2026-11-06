from datetime import datetime, timedelta, timezone

from cryptography.fernet import Fernet

from services.api.app.config import settings
from services.api.app.services.evidence import (
    EVIDENCE_PREFIX,
    EvidenceDecryptionError,
    decrypt_evidence,
    encrypt_evidence,
    purge_expired_evidence,
)


def test_evidence_round_trip_is_authenticated(monkeypatch):
    monkeypatch.setattr(settings, "EVIDENCE_ENCRYPTION_KEY", Fernet.generate_key().decode())
    original = "aGVsbG8="

    encrypted = encrypt_evidence(original)

    assert encrypted.startswith(EVIDENCE_PREFIX)
    assert encrypted != original
    assert decrypt_evidence(encrypted) == original


def test_tampered_evidence_fails_closed(monkeypatch):
    monkeypatch.setattr(settings, "EVIDENCE_ENCRYPTION_KEY", Fernet.generate_key().decode())
    encrypted = encrypt_evidence("aGVsbG8=")
    tampered = encrypted[:-1] + ("A" if encrypted[-1] != "A" else "B")

    try:
        decrypt_evidence(tampered)
    except EvidenceDecryptionError:
        pass
    else:
        raise AssertionError("Tampered evidence must not decrypt successfully")


def test_legacy_plaintext_evidence_remains_readable(monkeypatch):
    monkeypatch.setattr(settings, "EVIDENCE_ENCRYPTION_KEY", "")

    assert decrypt_evidence("legacy-base64") == "legacy-base64"


def test_retention_purges_old_evidence_without_deleting_incident():
    class Cursor:
        rowcount = 1

        def execute(self, query, params):
            assert "evidence_frame_base64 = NULL" in query
            assert params[0].startswith("2026-01-01")

    class Connection:
        def cursor(self):
            return Cursor()

    old_now = datetime(2026, 2, 1, tzinfo=timezone.utc)
    original_days = settings.EVIDENCE_RETENTION_DAYS
    settings.EVIDENCE_RETENTION_DAYS = 31
    try:
        assert purge_expired_evidence(
            Connection(), now=old_now
        ) == 1
    finally:
        settings.EVIDENCE_RETENTION_DAYS = original_days
