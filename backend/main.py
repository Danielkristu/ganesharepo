"""
Ganesha Repository — FastAPI entry point.

Mounts all routers, configures CORS, and exposes a health check.
Run with: uvicorn main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import repository, webinar, auth
from routers.analytics import router as analytics_router
from routers.admin import router as admin_router
from routers.quiz import router as quiz_router

app = FastAPI(
    title="Ganesha Repository API",
    description="Academic repository and webinar backend service.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(repository.router, prefix="/api/v1")
app.include_router(webinar.router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(quiz_router, prefix="/api/v1")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": "ganesha-repository-api"}
