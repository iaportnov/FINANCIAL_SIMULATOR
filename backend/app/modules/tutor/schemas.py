from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class AssistantRequest(BaseModel):
    # Full conversation so far; the backend stays stateless (no chat persistence on MVP).
    messages: list[ChatMessage] = Field(min_length=1, max_length=24)
    # Learner's current cell model: { "B9": { "value": ..., "formula": ... } }.
    # Optional — lets the tutor reason about what the learner has already entered.
    cells: dict[str, dict] = Field(default_factory=dict)

    @model_validator(mode="after")
    def _last_turn_is_user(self) -> "AssistantRequest":
        if self.messages[-1].role != "user":
            raise ValueError("The last message must come from the user")
        return self


class AssistantReply(BaseModel):
    reply: str
