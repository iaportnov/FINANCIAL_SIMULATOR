from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.progression.models import (
    ActivityCompletion,
    BlockCompletion,
    LevelThreshold,
    UserProgress,
)


class ProgressionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def completion_exists(self, user_id: int, activity_type: str, activity_id: int) -> bool:
        res = await self.session.execute(
            select(ActivityCompletion.id).where(
                ActivityCompletion.user_id == user_id,
                ActivityCompletion.activity_type == activity_type,
                ActivityCompletion.activity_id == activity_id,
            )
        )
        return res.first() is not None

    async def add_completion(self, completion: ActivityCompletion) -> None:
        self.session.add(completion)
        await self.session.flush()

    async def completed_set(self, user_id: int) -> set[tuple[str, int]]:
        res = await self.session.execute(
            select(ActivityCompletion.activity_type, ActivityCompletion.activity_id).where(
                ActivityCompletion.user_id == user_id
            )
        )
        return {(row[0], row[1]) for row in res.all()}

    async def block_completion_exists(self, user_id: int, block_id: int) -> bool:
        res = await self.session.execute(
            select(BlockCompletion.id).where(
                BlockCompletion.user_id == user_id,
                BlockCompletion.block_id == block_id,
            )
        )
        return res.first() is not None

    async def add_block_completion(self, completion: BlockCompletion) -> None:
        self.session.add(completion)
        await self.session.flush()

    async def get_or_create_progress(self, user_id: int) -> UserProgress:
        progress = await self.session.get(UserProgress, user_id)
        if progress is None:
            progress = UserProgress(user_id=user_id, total_xp=0, level=1)
            self.session.add(progress)
            await self.session.flush()
        return progress

    async def list_thresholds(self) -> list[LevelThreshold]:
        res = await self.session.execute(
            select(LevelThreshold).order_by(LevelThreshold.level)
        )
        return list(res.scalars().all())
