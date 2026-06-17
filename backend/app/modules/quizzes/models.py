from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base

QUESTION_TYPES = ("single_choice", "multiple_choice", "numeric")


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    pass_threshold: Mapped[float] = mapped_column(Float, default=0.7)

    questions: Mapped[list["Question"]] = relationship(
        back_populates="quiz",
        order_by="Question.order_index",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


class Question(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"), index=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    type: Mapped[str] = mapped_column(String(20))  # one of QUESTION_TYPES
    prompt: Mapped[str] = mapped_column(Text)
    # Public: [{ "id": int, "text": str }] for choice questions; null for numeric.
    options: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # SECRET — never serialized to the client. e.g. {"option_ids": [..]} or
    # {"value": 11122.22, "tolerance": {"type": "relative", "value": 0.01}}
    correct: Mapped[dict] = mapped_column(JSON)
    explanation: Mapped[str] = mapped_column(Text, default="")

    quiz: Mapped[Quiz] = relationship(back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)  # -> users.id (no cross-module FK)
    quiz_id: Mapped[int] = mapped_column(Integer, index=True)
    score: Mapped[float] = mapped_column(Float)
    passed: Mapped[bool] = mapped_column(Boolean)
    answers: Mapped[list] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
