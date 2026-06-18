"""Adapter boundary for the LLM vendor.

The rest of the app talks to the neutral `TutorClient` protocol (system prompt +
chat turns in, text out). The Anthropic SDK is isolated here, so swapping the
provider later means rewriting only this file (cf. the trainer engine adapter,
ADR-0006/0009).
"""

from typing import Protocol, runtime_checkable

from app.core.config import settings


@runtime_checkable
class TutorClient(Protocol):
    async def complete(self, system: str, messages: list[dict]) -> str: ...


class AnthropicTutorClient:
    def __init__(self, api_key: str, model: str, max_tokens: int) -> None:
        self._api_key = api_key
        self._model = model
        self._max_tokens = max_tokens

    async def complete(self, system: str, messages: list[dict]) -> str:
        # Lazy import keeps `anthropic` an optional runtime dependency: the app
        # boots (and unrelated tests run) without the package installed.
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=self._api_key)
        response = await client.messages.create(
            model=self._model,
            max_tokens=self._max_tokens,
            system=system,
            messages=messages,
            thinking={"type": "adaptive"},
        )
        parts = [
            block.text
            for block in response.content
            if getattr(block, "type", None) == "text"
        ]
        return "\n".join(p for p in parts if p).strip()


def default_tutor_client() -> AnthropicTutorClient:
    return AnthropicTutorClient(
        api_key=settings.anthropic_api_key,
        model=settings.tutor_model,
        max_tokens=settings.tutor_max_tokens,
    )
