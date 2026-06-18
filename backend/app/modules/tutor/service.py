from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import NotFoundError, ValidationError
from app.modules.trainer.repository import TrainerRepository
from app.modules.trainer.schemas import TrainerTaskPublic
from app.modules.tutor.client import TutorClient, default_tutor_client
from app.modules.tutor.prompts import build_system_prompt
from app.modules.tutor.schemas import AssistantReply, ChatMessage

_EMPTY_REPLY_FALLBACK = (
    "Не удалось сформировать ответ. Попробуйте переформулировать вопрос."
)


class TutorService:
    """Grounded AI tutor for trainer tasks.

    Reads only the *public* projection of a task (instructions, sheet, editable
    cells) plus the learner's current cell state — never the secret grading
    rules — and asks the LLM to coach the learner toward the solution.
    """

    def __init__(self, session: AsyncSession, client: TutorClient | None = None) -> None:
        self.repo = TrainerRepository(session)
        self._client = client

    async def answer(
        self,
        task_id: int,
        messages: list[ChatMessage],
        cells: dict[str, dict],
    ) -> AssistantReply:
        task = await self.repo.get_task(task_id)
        if not task:
            raise NotFoundError("Trainer task not found")

        client = self._client or self._require_client()
        public = TrainerTaskPublic(
            id=task.id,
            slug=task.slug,
            title=task.title,
            instructions_md=task.instructions_md,
            sheet=task.sheet,
            editable=task.editable,
        )
        system = build_system_prompt(public, cells)
        conversation = [{"role": m.role, "content": m.content} for m in messages]

        reply = await client.complete(system, conversation)
        return AssistantReply(reply=reply or _EMPTY_REPLY_FALLBACK)

    @staticmethod
    def _require_client() -> TutorClient:
        if not settings.tutor_enabled:
            raise ValidationError("AI assistant is not configured")
        return default_tutor_client()
