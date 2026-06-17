from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError, ValidationError
from app.core.grading import within_tolerance
from app.modules.progression import service as progression_service
from app.modules.trainer.models import TrainerSubmission
from app.modules.trainer.repository import TrainerRepository
from app.modules.trainer.schemas import CellResult, TrainerResult, TrainerTaskPublic


class TrainerService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = TrainerRepository(session)

    async def get_task_public(self, task_id: int) -> TrainerTaskPublic:
        task = await self.repo.get_task(task_id)
        if not task:
            raise NotFoundError("Trainer task not found")
        return TrainerTaskPublic(
            id=task.id,
            slug=task.slug,
            title=task.title,
            instructions_md=task.instructions_md,
            sheet=task.sheet,
            editable=task.editable,
        )

    async def grade(self, task_id: int, cells: dict[str, dict], user_id: int) -> TrainerResult:
        task = await self.repo.get_task(task_id)
        if not task:
            raise NotFoundError("Trainer task not found")
        grading = await self.repo.get_grading(task_id)
        if not grading:
            raise ValidationError("Trainer task has no grading rules")

        results: list[CellResult] = []
        all_ok = True
        for rule in grading.rules:
            ok = self._check_rule(rule, cells.get(rule["cell"], {}))
            all_ok = all_ok and ok
            results.append(CellResult(cell=rule["cell"], correct=ok))

        passed = all_ok
        await self.repo.add_submission(
            TrainerSubmission(
                user_id=user_id,
                task_id=task_id,
                cells=cells,
                passed=passed,
                per_cell_result=[r.model_dump() for r in results],
            )
        )

        if passed:
            await progression_service.record_completion(
                self.session, user_id, "trainer_task", task_id
            )

        return TrainerResult(passed=passed, results=results)

    @staticmethod
    def _check_rule(rule: dict, submitted: dict) -> bool:
        value = submitted.get("value")
        formula = str(submitted.get("formula") or "")

        if not within_tolerance(value, rule.get("expected"), rule.get("tolerance")):
            return False
        if rule.get("must_be_formula") and not formula.strip().startswith("="):
            return False
        required = rule.get("must_use_function")
        if required:
            normalized = formula.upper().replace(" ", "")
            for fn in required:
                if f"{fn.upper()}(" not in normalized:
                    return False
        return True
