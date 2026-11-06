import os
from dotenv import load_dotenv

# Load .env file from project root or current working directory
load_dotenv()

class Settings:
    APP_ENV: str = os.getenv("APP_ENV", "development")
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./drishtiflow.db")
    EVIDENCE_ENCRYPTION_KEY: str = os.getenv("EVIDENCE_ENCRYPTION_KEY", "")
    EVIDENCE_RETENTION_DAYS: int = int(os.getenv("EVIDENCE_RETENTION_DAYS", "30"))

    # AI Providers (Google Gemini / Groq / xAI)
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    WORKFLOW_COMPILER_PROVIDER: str = os.getenv("WORKFLOW_COMPILER_PROVIDER", "groq" if os.getenv("GROQ_API_KEY") else "gemini")
    WORKFLOW_COMPILER_API_KEY: str = os.getenv("WORKFLOW_COMPILER_API_KEY") or os.getenv("GROQ_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    # Default to the live provider; absent credentials then fail closed in verifier.py.
    # Offline demo behavior requires an explicit VISION_PROVIDER=mock setting.
    VISION_PROVIDER: str = os.getenv("VISION_PROVIDER", "gemini")
    VISION_API_KEY: str = os.getenv("VISION_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    XAI_API_KEY: str = os.getenv("XAI_API_KEY", "")

    # Notification Providers
    VAPI_API_KEY: str = os.getenv("VAPI_API_KEY", "")
    VAPI_PHONE_NUMBER_ID: str = os.getenv("VAPI_PHONE_NUMBER_ID", "")
    VAPI_DESTINATION_PHONE_NUMBER: str = os.getenv("VAPI_DESTINATION_PHONE_NUMBER", "+919999999999")

    WHATSAPP_ACCESS_TOKEN: str = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    WHATSAPP_RECIPIENT_PHONE_NUMBER: str = os.getenv("WHATSAPP_RECIPIENT_PHONE_NUMBER", "+919999999999")

    def get_ai_status(self) -> dict:
        """Safe configuration diagnostic avoiding credential leakage."""
        return {
            "groq_configured": bool(self.GROQ_API_KEY or (self.WORKFLOW_COMPILER_PROVIDER == "groq" and self.WORKFLOW_COMPILER_API_KEY)),
            "groq_model": self.GROQ_MODEL,
            "gemini_configured": bool(self.GOOGLE_API_KEY or self.VISION_API_KEY),
            "gemini_model": self.GEMINI_MODEL,
            "compiler_provider": self.WORKFLOW_COMPILER_PROVIDER,
            "vision_provider": self.VISION_PROVIDER
        }

settings = Settings()
