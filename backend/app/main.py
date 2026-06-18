from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.errors import register_error_handlers
from app.modules.courses.router import router as courses_router
from app.modules.progression.router import router as progression_router
from app.modules.quizzes.router import router as quizzes_router
from app.modules.trainer.router import router as trainer_router
from app.modules.tutor.router import router as tutor_router
from app.modules.users.router import router as users_router

API_PREFIX = "/api/v1"

app = FastAPI(title="Financial Simulator API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)


@app.get("/health", tags=["meta"])
async def health() -> dict:
    return {"status": "ok"}


for module_router in (
    users_router,
    courses_router,
    quizzes_router,
    trainer_router,
    tutor_router,
    progression_router,
):
    app.include_router(module_router, prefix=API_PREFIX)
