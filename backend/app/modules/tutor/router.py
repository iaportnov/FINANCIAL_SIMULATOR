from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.modules.tutor.schemas import AssistantReply, AssistantRequest
from app.modules.tutor.service import TutorService
from app.modules.users.deps import CurrentUser

router = APIRouter(tags=["tutor"])


def get_tutor_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TutorService:
    return TutorService(session)


ServiceDep = Annotated[TutorService, Depends(get_tutor_service)]


@router.post("/trainer/{task_id}/assistant", response_model=AssistantReply)
async def ask_assistant(
    task_id: int,
    body: AssistantRequest,
    current_user: CurrentUser,
    service: ServiceDep,
) -> AssistantReply:
    return await service.answer(task_id, body.messages, body.cells)
