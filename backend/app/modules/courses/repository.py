from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.courses.models import Block, Course, Lesson, Step


class CoursesRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # --- courses ----------------------------------------------------------
    async def list_courses(self, limit: int, offset: int) -> tuple[list[Course], int]:
        total = await self.session.scalar(select(func.count()).select_from(Course))
        res = await self.session.execute(
            select(Course).order_by(Course.order_index, Course.id).limit(limit).offset(offset)
        )
        return list(res.scalars().all()), int(total or 0)

    async def all_courses_ordered(self) -> list[Course]:
        res = await self.session.execute(
            select(Course).order_by(Course.order_index, Course.id)
        )
        return list(res.scalars().all())

    async def get_course(self, course_id: int) -> Course | None:
        return await self.session.get(Course, course_id)

    # --- blocks / steps ---------------------------------------------------
    async def get_block(self, block_id: int) -> Block | None:
        return await self.session.get(Block, block_id)

    async def get_blocks_for_course(self, course_id: int) -> list[Block]:
        res = await self.session.execute(
            select(Block)
            .where(Block.course_id == course_id)
            .order_by(Block.order_index, Block.id)
        )
        return list(res.scalars().all())

    async def get_step(self, step_id: int) -> Step | None:
        return await self.session.get(Step, step_id)

    async def get_steps_for_block(self, block_id: int) -> list[Step]:
        res = await self.session.execute(
            select(Step)
            .where(Step.block_id == block_id)
            .order_by(Step.order_index, Step.id)
        )
        return list(res.scalars().all())

    async def find_steps_by_activity(self, activity_type: str, activity_id: int) -> list[Step]:
        res = await self.session.execute(
            select(Step).where(
                Step.activity_type == activity_type,
                Step.activity_id == activity_id,
            )
        )
        return list(res.scalars().all())

    # --- lessons ----------------------------------------------------------
    async def get_lesson(self, lesson_id: int) -> Lesson | None:
        return await self.session.get(Lesson, lesson_id)

    async def get_lesson_by_slug(self, slug: str) -> Lesson | None:
        res = await self.session.execute(select(Lesson).where(Lesson.slug == slug))
        return res.scalar_one_or_none()
