"""Unit tests for the AI tutor: prompt grounding + the no-secret guardrail.

The tutor must build its context from the public task projection and the
learner's cells only. These tests pin that behaviour without a real LLM or DB.
"""

from types import SimpleNamespace

import pytest

from app.core.errors import ValidationError
from app.modules.trainer.schemas import TrainerTaskPublic
from app.modules.tutor.prompts import build_system_prompt
from app.modules.tutor.schemas import AssistantRequest, ChatMessage
from app.modules.tutor.service import TutorService

PUBLIC_TASK = TrainerTaskPublic(
    id=1,
    slug="lease",
    title="IFRS 16: первоначальный расчет аренды",
    instructions_md="Заполните B9 как приведённую стоимость будущих платежей.",
    sheet={"cells": {"B1": {"value": 1200000}, "B9": {"value": None}}},
    editable=["B9"],
)


def test_system_prompt_grounds_in_public_task_and_learner_state():
    prompt = build_system_prompt(PUBLIC_TASK, {"B9": {"value": 999.0, "formula": "=PV(B3,B2,-B1)"}})

    assert "IFRS 16" in prompt  # title
    assert "Заполните B9" in prompt  # instructions
    assert "1200000" in prompt  # initial sheet data
    assert "=PV(B3,B2,-B1)" in prompt  # learner's current formula
    assert "не называй итоговое" in prompt.lower()  # guardrail persona


def test_system_prompt_handles_empty_learner_state():
    prompt = build_system_prompt(PUBLIC_TASK, {})
    assert "Учащийся пока ничего не ввёл" in prompt


def test_assistant_request_requires_user_to_speak_last():
    with pytest.raises(ValueError):
        AssistantRequest(messages=[ChatMessage(role="assistant", content="hi")])


# --- service-level: never touches grading -----------------------------------


class _FakeClient:
    def __init__(self) -> None:
        self.system: str | None = None
        self.messages: list[dict] | None = None

    async def complete(self, system: str, messages: list[dict]) -> str:
        self.system = system
        self.messages = messages
        return "Подумайте о ставке дисконтирования и сроке аренды."


class _FakeSession:
    """Only supports `get` — if the tutor ever queried grading (via `execute`),
    this would raise, proving grading is never loaded."""

    def __init__(self, task: object) -> None:
        self._task = task

    async def get(self, _model, _pk):
        return self._task


def _fake_task() -> SimpleNamespace:
    return SimpleNamespace(
        id=1,
        slug=PUBLIC_TASK.slug,
        title=PUBLIC_TASK.title,
        instructions_md=PUBLIC_TASK.instructions_md,
        sheet=PUBLIC_TASK.sheet,
        editable=PUBLIC_TASK.editable,
    )


async def test_service_grounds_request_without_loading_grading():
    client = _FakeClient()
    service = TutorService(_FakeSession(_fake_task()), client=client)

    reply = await service.answer(
        1,
        [ChatMessage(role="user", content="С чего начать в B9?")],
        {"B9": {"value": None, "formula": None}},
    )

    assert reply.reply.startswith("Подумайте")
    assert "Заполните B9" in client.system
    assert client.messages == [{"role": "user", "content": "С чего начать в B9?"}]


async def test_service_rejects_when_assistant_not_configured(monkeypatch):
    from app.modules.tutor import service as service_module

    monkeypatch.setattr(service_module.settings, "anthropic_api_key", "")
    service = TutorService(_FakeSession(_fake_task()))  # no client injected

    with pytest.raises(ValidationError):
        await service.answer(1, [ChatMessage(role="user", content="?")], {})
