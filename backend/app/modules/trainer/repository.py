from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.trainer.models import TrainerGrading, TrainerSubmission, TrainerTask


class TrainerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_task(self, task_id: int) -> TrainerTask | None:
        return await self.session.get(TrainerTask, task_id)

    async def get_grading(self, task_id: int) -> TrainerGrading | None:
        res = await self.session.execute(
            select(TrainerGrading).where(TrainerGrading.task_id == task_id)
        )
        return res.scalar_one_or_none()

    async def add_submission(self, submission: TrainerSubmission) -> TrainerSubmission:
        self.session.add(submission)
        await self.session.flush()
        return submission
