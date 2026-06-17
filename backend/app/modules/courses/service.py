from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.modules.courses.models import Block, Course, Lesson, Step
from app.modules.courses.repository import CoursesRepository

# Curriculum shape consumed by progression: list of (Course, [(Block, [Step])]).
Curriculum = list[tuple[Course, list[tuple[Block, list[Step]]]]]


class CoursesService:
    """Owns the static curriculum. Depends on no other module."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = CoursesRepository(session)

    async def list_courses(self, limit: int, offset: int) -> tuple[list[Course], int]:
        return await self.repo.list_courses(limit, offset)

    async def get_lesson(self, lesson_id: int) -> Lesson:
        lesson = await self.repo.get_lesson(lesson_id)
        if not lesson:
            raise NotFoundError("Lesson not found")
        return lesson

    # --- interface used by progression -----------------------------------
    async def get_step(self, step_id: int) -> Step | None:
        return await self.repo.get_step(step_id)

    async def get_block(self, block_id: int) -> Block | None:
        return await self.repo.get_block(block_id)

    async def get_steps_for_block(self, block_id: int) -> list[Step]:
        return await self.repo.get_steps_for_block(block_id)

    async def find_steps_by_activity(self, activity_type: str, activity_id: int) -> list[Step]:
        return await self.repo.find_steps_by_activity(activity_type, activity_id)

    async def get_curriculum(self) -> Curriculum:
        """Fully-loaded ordered curriculum tree (no async lazy-loading)."""
        result: Curriculum = []
        for course in await self.repo.all_courses_ordered():
            blocks: list[tuple[Block, list[Step]]] = []
            for block in await self.repo.get_blocks_for_course(course.id):
                steps = await self.repo.get_steps_for_block(block.id)
                blocks.append((block, steps))
            result.append((course, blocks))
        return result
