from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base

# Activity types a Step may reference (polymorphic ref: activity_type + activity_id).
ACTIVITY_LESSON = "lesson"
ACTIVITY_QUIZ = "quiz"
ACTIVITY_TRAINER = "trainer_task"


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    # Reserved for future free-topic selection; "linear" on MVP.
    gating: Mapped[str] = mapped_column(String(20), default="linear")


class Block(Base):
    __tablename__ = "blocks"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True
    )
    slug: Mapped[str] = mapped_column(String(120), index=True)
    title: Mapped[str] = mapped_column(String(200))
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    xp_reward: Mapped[int] = mapped_column(Integer, default=20)


class Step(Base):
    __tablename__ = "steps"

    id: Mapped[int] = mapped_column(primary_key=True)
    block_id: Mapped[int] = mapped_column(
        ForeignKey("blocks.id", ondelete="CASCADE"), index=True
    )
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    # Polymorphic reference into the owning content module (no cross-module FK).
    activity_type: Mapped[str] = mapped_column(String(20))
    activity_id: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(200))


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    content_md: Mapped[str] = mapped_column(Text, default="")
