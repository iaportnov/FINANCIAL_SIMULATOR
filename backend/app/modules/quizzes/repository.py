from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.quizzes.models import Quiz, QuizAttempt


class QuizRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_quiz(self, quiz_id: int) -> Quiz | None:
        return await self.session.get(Quiz, quiz_id)

    async def get_quiz_by_slug(self, slug: str) -> Quiz | None:
        res = await self.session.execute(select(Quiz).where(Quiz.slug == slug))
        return res.scalar_one_or_none()

    async def add_attempt(self, attempt: QuizAttempt) -> QuizAttempt:
        self.session.add(attempt)
        await self.session.flush()
        return attempt
