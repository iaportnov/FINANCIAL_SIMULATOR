from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class TrainerTask(Base):
    __tablename__ = "trainer_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    instructions_md: Mapped[str] = mapped_column(Text, default="")
    # Tutor-facing method notes. They are not part of the public task response.
    solution_notes: Mapped[str] = mapped_column(Text, default="")
    # Public initial spreadsheet state: { "cells": { "A1": {"value": ...}, ... } }
    sheet: Mapped[dict] = mapped_column(JSON)
    # Public list of editable cells (A1 notation); everything else is locked.
    editable: Mapped[list] = mapped_column(JSON)


class TrainerGrading(Base):
    """SECRET grading rules — never serialized to the client."""

    __tablename__ = "trainer_gradings"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("trainer_tasks.id", ondelete="CASCADE"), unique=True, index=True
    )
    # [{ "cell": "B5", "expected": 11122.22, "tolerance": {...},
    #    "must_be_formula": true, "must_use_function": ["PMT"] }]
    rules: Mapped[list] = mapped_column(JSON)
    xp: Mapped[int] = mapped_column(Integer, default=20)


class TrainerSubmission(Base):
    __tablename__ = "trainer_submissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)  # -> users.id (no cross-module FK)
    task_id: Mapped[int] = mapped_column(Integer, index=True)
    cells: Mapped[dict] = mapped_column(JSON)
    passed: Mapped[bool] = mapped_column(Boolean)
    per_cell_result: Mapped[list] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
