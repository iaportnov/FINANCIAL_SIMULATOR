from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.modules.progression.schemas import MapResponse, ProgressSummary
from app.modules.progression.service import ProgressionService
from app.modules.users.deps import CurrentUser

router = APIRouter(tags=["progression"])


def get_progression_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ProgressionService:
    return ProgressionService(session)


ServiceDep = Annotated[ProgressionService, Depends(get_progression_service)]


@router.get("/progression/map", response_model=MapResponse)
async def get_map(current_user: CurrentUser, service: ServiceDep) -> MapResponse:
    return await service.get_map(current_user.id)


@router.get("/progression/me", response_model=ProgressSummary)
async def get_progress(current_user: CurrentUser, service: ServiceDep) -> ProgressSummary:
    progress = await service.get_or_create_progress(current_user.id)
    return ProgressSummary(level=progress.level, total_xp=progress.total_xp)


@router.post("/progression/steps/{step_id}/complete", response_model=ProgressSummary)
async def complete_lesson_step(
    step_id: int, current_user: CurrentUser, service: ServiceDep
) -> ProgressSummary:
    progress = await service.complete_lesson(current_user.id, step_id)
    return ProgressSummary(level=progress.level, total_xp=progress.total_xp)
