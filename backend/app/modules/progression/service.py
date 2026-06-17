from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError, ValidationError
from app.modules.courses.models import Block, Step
from app.modules.courses.service import CoursesService
from app.modules.progression.models import (
    ActivityCompletion,
    BlockCompletion,
    UserProgress,
)
from app.modules.progression.repository import ProgressionRepository
from app.modules.progression.schemas import (
    BlockNode,
    CourseNode,
    MapResponse,
    StepNode,
)


class ProgressionService:
    """Owns per-user progress. Reads structure from `courses`; receives
    completion reports from content modules (one-way dependency)."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ProgressionRepository(session)
        self.courses = CoursesService(session)

    async def get_or_create_progress(self, user_id: int) -> UserProgress:
        return await self.repo.get_or_create_progress(user_id)

    async def record_completion(
        self, user_id: int, activity_type: str, activity_id: int
    ) -> None:
        if not await self.repo.completion_exists(user_id, activity_type, activity_id):
            await self.repo.add_completion(
                ActivityCompletion(
                    user_id=user_id,
                    activity_type=activity_type,
                    activity_id=activity_id,
                )
            )

        # Any block that just became fully completed earns its XP (once).
        for step in await self.courses.find_steps_by_activity(activity_type, activity_id):
            block = await self.courses.get_block(step.block_id)
            if block is None:
                continue
            block_steps = await self.courses.get_steps_for_block(block.id)
            if await self._all_completed(user_id, block_steps):
                await self._award_block(user_id, block)

        await self._recompute_level(user_id)

    async def complete_lesson(self, user_id: int, step_id: int) -> UserProgress:
        """Lessons have no grading, so progression self-handles their completion."""
        step = await self.courses.get_step(step_id)
        if step is None:
            raise NotFoundError("Step not found")
        if step.activity_type != "lesson":
            raise ValidationError("Step is not a self-completable lesson")
        await self.record_completion(user_id, "lesson", step.activity_id)
        return await self.get_or_create_progress(user_id)

    async def get_map(self, user_id: int) -> MapResponse:
        curriculum = await self.courses.get_curriculum()
        completed = await self.repo.completed_set(user_id)
        progress = await self.get_or_create_progress(user_id)

        course_nodes: list[CourseNode] = []
        unlocked_used = False  # strictly linear gating: first incomplete step is unlocked
        for course, blocks in curriculum:
            block_nodes: list[BlockNode] = []
            for block, steps in blocks:
                step_nodes: list[StepNode] = []
                for step in steps:
                    key = (step.activity_type, step.activity_id)
                    if key in completed:
                        status = "completed"
                    elif not unlocked_used:
                        status = "unlocked"
                        unlocked_used = True
                    else:
                        status = "locked"
                    step_nodes.append(
                        StepNode(
                            id=step.id,
                            title=step.title,
                            activity_type=step.activity_type,
                            activity_id=step.activity_id,
                            status=status,
                        )
                    )
                block_nodes.append(
                    BlockNode(
                        id=block.id,
                        title=block.title,
                        xp_reward=block.xp_reward,
                        steps=step_nodes,
                    )
                )
            course_nodes.append(
                CourseNode(
                    id=course.id, slug=course.slug, title=course.title, blocks=block_nodes
                )
            )

        return MapResponse(
            level=progress.level, total_xp=progress.total_xp, courses=course_nodes
        )

    # --- internals --------------------------------------------------------
    async def _all_completed(self, user_id: int, steps: list[Step]) -> bool:
        completed = await self.repo.completed_set(user_id)
        return all((s.activity_type, s.activity_id) in completed for s in steps)

    async def _award_block(self, user_id: int, block: Block) -> None:
        if await self.repo.block_completion_exists(user_id, block.id):
            return
        await self.repo.add_block_completion(
            BlockCompletion(user_id=user_id, block_id=block.id, xp_awarded=block.xp_reward)
        )
        progress = await self.get_or_create_progress(user_id)
        progress.total_xp += block.xp_reward

    async def _recompute_level(self, user_id: int) -> None:
        progress = await self.get_or_create_progress(user_id)
        level = 1
        for threshold in await self.repo.list_thresholds():
            if progress.total_xp >= threshold.required_xp:
                level = threshold.level
        progress.level = level


# --- Public cross-module interface ------------------------------------------
async def record_completion(
    session: AsyncSession, user_id: int, activity_type: str, activity_id: int
) -> None:
    """Called by content modules (quizzes, trainer) when an activity is done."""
    await ProgressionService(session).record_completion(user_id, activity_type, activity_id)
