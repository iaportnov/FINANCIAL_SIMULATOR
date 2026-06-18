import re

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError, ValidationError
from app.core.grading import coerce_number, within_tolerance
from app.modules.progression import service as progression_service
from app.modules.trainer.models import TrainerSubmission
from app.modules.trainer.repository import TrainerRepository
from app.modules.trainer.schemas import CellResult, TrainerResult, TrainerTaskPublic

CELL_REF_RE = re.compile(r"(?<![A-Z0-9_])\$?[A-Z]{1,3}\$?\d+(?![A-Z0-9_])", re.IGNORECASE)
FUNCTION_CALL_RE = re.compile(r"(?<![A-Z0-9_])[_A-Z][._A-Z0-9]*\s*\(", re.IGNORECASE)
PLAIN_NUMBER_RE = re.compile(r"^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$")


class TrainerService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = TrainerRepository(session)

    async def get_task_public(self, task_id: int) -> TrainerTaskPublic:
        task = await self.repo.get_task(task_id)
        if not task:
            raise NotFoundError("Trainer task not found")
        grading = await self.repo.get_grading(task_id)
        return TrainerTaskPublic(
            id=task.id,
            slug=task.slug,
            title=task.title,
            instructions_md=task.instructions_md,
            sheet=task.sheet,
            editable=task.editable,
            grading_rules=grading.rules if grading else [],
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
        if rule.get("must_be_formula") and not TrainerService._looks_like_formula(formula):
            return False
        required = rule.get("must_use_function")
        if required:
            for fn in required:
                if not TrainerService._uses_function(formula, str(fn)):
                    return False
        return True

    @staticmethod
    def _looks_like_formula(formula: str) -> bool:
        text = formula.strip()
        if not text:
            return False
        if text.startswith("="):
            return len(text) > 1
        if TrainerService._is_plain_number_text(text):
            return False
        return bool(
            CELL_REF_RE.search(text)
            or FUNCTION_CALL_RE.search(text)
            or any(operator in text for operator in ("+", "-", "*", "/", "^"))
        )

    @staticmethod
    def _uses_function(formula: str, function_name: str) -> bool:
        text = formula.upper().replace(";", ",")
        escaped = re.escape(function_name.upper())
        return re.search(rf"(?<![A-Z0-9_]){escaped}\s*\(", text) is not None

    @staticmethod
    def _is_plain_number_text(text: str) -> bool:
        normalized = (
            text.strip()
            .replace("\u00a0", "")
            .replace("\u202f", "")
            .replace(" ", "")
            .replace("_", "")
        )
        normalized = re.sub(r"[$€₽¥£]", "", normalized)
        return PLAIN_NUMBER_RE.fullmatch(normalized) is not None and coerce_number(normalized) is not None
