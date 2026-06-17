from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.modules.trainer.schemas import SubmitTrainerRequest, TrainerResult, TrainerTaskPublic
from app.modules.trainer.service import TrainerService
from app.modules.users.deps import CurrentUser

router = APIRouter(tags=["trainer"])


def get_trainer_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TrainerService:
    return TrainerService(session)


ServiceDep = Annotated[TrainerService, Depends(get_trainer_service)]


@router.get("/trainer/{task_id}", response_model=TrainerTaskPublic)
async def get_task(task_id: int, service: ServiceDep) -> TrainerTaskPublic:
    return await service.get_task_public(task_id)


@router.post("/trainer/{task_id}/submit", response_model=TrainerResult)
async def submit_task(
    task_id: int,
    body: SubmitTrainerRequest,
    current_user: CurrentUser,
    service: ServiceDep,
) -> TrainerResult:
    return await service.grade(task_id, body.cells, current_user.id)
