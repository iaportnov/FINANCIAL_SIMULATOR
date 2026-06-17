from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.modules.quizzes.schemas import QuizPublic, QuizResult, SubmitQuizRequest
from app.modules.quizzes.service import QuizService
from app.modules.users.deps import CurrentUser

router = APIRouter(tags=["quizzes"])


def get_quiz_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> QuizService:
    return QuizService(session)


ServiceDep = Annotated[QuizService, Depends(get_quiz_service)]


@router.get("/quizzes/{quiz_id}", response_model=QuizPublic)
async def get_quiz(quiz_id: int, service: ServiceDep) -> QuizPublic:
    return await service.get_quiz_public(quiz_id)


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizResult)
async def submit_quiz(
    quiz_id: int,
    body: SubmitQuizRequest,
    current_user: CurrentUser,
    service: ServiceDep,
) -> QuizResult:
    return await service.grade(quiz_id, body.answers, current_user.id)
