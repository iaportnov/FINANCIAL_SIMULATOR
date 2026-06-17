from datetime import datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class ActivityCompletion(Base):
    __tablename__ = "activity_completions"
    __table_args__ = (
        UniqueConstraint("user_id", "activity_type", "activity_id", name="uq_completion"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    activity_type: Mapped[str] = mapped_column(String(20))
    activity_id: Mapped[int] = mapped_column(Integer)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class BlockCompletion(Base):
    """Ensures a block's XP is awarded at most once per user."""

    __tablename__ = "block_completions"
    __table_args__ = (UniqueConstraint("user_id", "block_id", name="uq_block_completion"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    block_id: Mapped[int] = mapped_column(Integer, index=True)
    xp_awarded: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class UserProgress(Base):
    __tablename__ = "user_progress"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)


class LevelThreshold(Base):
    """Seeded table: level -> cumulative XP required to reach it."""

    __tablename__ = "level_thresholds"

    level: Mapped[int] = mapped_column(Integer, primary_key=True)
    required_xp: Mapped[int] = mapped_column(Integer)
