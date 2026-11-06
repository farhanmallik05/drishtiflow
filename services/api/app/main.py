from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db
from .routers import health, workflows, cameras, events, incidents, actions, shoplifting, fall_monitoring

# Initialize database tables on startup
init_db()

app = FastAPI(
    title="DrishtiFlow API",
    description="Event-Aware Vision Intelligence Platform for Bharat Sites — Build with Bharat 5.0",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware allowing web frontend integration
# Frontend runs on Vite ports 5173-5176 (auto-incremented if port in use)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router)
app.include_router(workflows.router)
app.include_router(cameras.router)
app.include_router(events.router)
app.include_router(incidents.router)
app.include_router(actions.router)
app.include_router(shoplifting.router)
app.include_router(fall_monitoring.router)

@app.get("/")
def root():
    return {
        "product": "DrishtiFlow (दृष्टि-फ़्लो)",
        "status": "operational",
        "documentation": "/docs",
        "health": "/api/v1/health"
    }

@app.get("/health")
def health_root():
    """Root-level health alias for /api/v1/health."""
    from .routers.health import health_check
    return health_check()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.api.app.main:app", host="0.0.0.0", port=8000, reload=True)

