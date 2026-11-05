from fastapi import APIRouter
from ..database import get_db
from ..config import settings

router = APIRouter(prefix="/api/v1", tags=["Health & Diagnostics"])

@router.get("/health")
def health_check():
    """Service liveness probe."""
    return {
        "status": "healthy",
        "service": "drishtiflow-api",
        "version": "3.0.0",
        "environment": settings.APP_ENV
    }

@router.get("/ready")
def readiness_check():
    """Service readiness probe checking database and providers."""
    db_ok = False
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        db_ok = True
        conn.close()
    except Exception:
        db_ok = False

    return {
        "status": "ready" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "vision_provider": settings.VISION_PROVIDER,
        "compiler_provider": settings.WORKFLOW_COMPILER_PROVIDER
    }

