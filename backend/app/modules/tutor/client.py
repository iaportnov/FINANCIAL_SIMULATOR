"""Adapter boundary for the LLM vendor.

The rest of the app talks to the neutral `TutorClient` protocol (system prompt +
chat turns in, text out). The OpenAI SDK is isolated here, so swapping the
provider later means rewriting only this file (cf. the trainer engine adapter,
ADR-0006/0009).
"""

from typing import Protocol, runtime_checkable

from app.core.config import settings


@runtime_checkable
class TutorClient(Protocol):
    async def complete(self, system: str, messages: list[dict]) -> str: ...


class OpenAITutorClient:
    def __init__(self, api_key: str, model: str, max_tokens: int) -> None:
        self._api_key = api_key
        self._model = model
        self._max_tokens = max_tokens

    async def complete(self, system: str, messages: list[dict]) -> str:
        # Lazy import keeps `openai` an optional runtime dependency
        import openai

        client = openai.AsyncOpenAI(
            api_key=self._api_key,
            base_url="https://api.vsellm.ru/v1"
        )
        
        # OpenAI expects the system prompt as the first message
        openai_messages = [{"role": "system", "content": system}] + messages
        
        response = await client.chat.completions.create(
            model=self._model,
            max_tokens=self._max_tokens,
            messages=openai_messages,
        )
        return response.choices[0].message.content or ""


def default_tutor_client() -> OpenAITutorClient:
    return OpenAITutorClient(
        api_key=settings.openai_api_key,
        model=settings.tutor_model,
        max_tokens=settings.tutor_max_tokens,
    )
