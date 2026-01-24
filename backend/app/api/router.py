from fastapi import APIRouter

from app.api.routes import health, metrics, skills

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(metrics.router)
api_router.include_router(skills.router)
