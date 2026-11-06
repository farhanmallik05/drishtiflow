from pathlib import Path


_original_exists = Path.exists


def _exists_without_invalid_mount_errors(self: Path) -> bool:
    try:
        return _original_exists(self)
    except OSError as exc:
        if getattr(exc, "winerror", None) == 1337:
            return False
        raise


Path.exists = _exists_without_invalid_mount_errors
