import os

class Settings:
    APP_ENV: str = os.getenv("APP_ENV", "development")
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./drishtiflow.db")

    # AI Providers
    WORKFLOW_COMPILER_PROVIDER: str = os.getenv("WORKFLOW_COMPILER_PROVIDER", "gemini")
    WORKFLOW_COMPILER_API_KEY: str = os.getenv("WORKFLOW_COMPILER_API_KEY", "")
    VISION_PROVIDER: str = os.getenv("VISION_PROVIDER", "mock") # default to 'mock' for safe demo
    VISION_API_KEY: str = os.getenv("VISION_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # Notification Providers
    VAPI_API_KEY: str = os.getenv("VAPI_API_KEY", "")
    VAPI_PHONE_NUMBER_ID: str = os.getenv("VAPI_PHONE_NUMBER_ID", "")
    VAPI_DESTINATION_PHONE_NUMBER: str = os.getenv("VAPI_DESTINATION_PHONE_NUMBER", "+919999999999")

    WHATSAPP_ACCESS_TOKEN: str = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    WHATSAPP_RECIPIENT_PHONE_NUMBER: str = os.getenv("WHATSAPP_RECIPIENT_PHONE_NUMBER", "+919999999999")

settings = Settings()
