"""Idempotent content seeder.

Reads authored content from the /content directory and upserts it into the DB
by stable slug, so running it repeatedly updates rather than duplicates.

Run with:  python -m app.seed
"""

from pathlib import Path

import yaml
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import SessionLocal
from app.modules.courses.models import Block, Course, Lesson, Step
from app.modules.progression.models import LevelThreshold
from app.modules.quizzes.models import Question, Quiz
from app.modules.trainer.models import TrainerGrading, TrainerTask


def _content_root() -> Path:
    return Path(settings.content_dir)


def _read_yaml(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def _parse_front_matter(text: str) -> tuple[dict, str]:
    """Split optional `--- yaml --- body` front matter from a Markdown file."""
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            return yaml.safe_load(parts[1]) or {}, parts[2].lstrip("\n")
    return {}, text


async def _upsert_lessons(session: AsyncSession, root: Path) -> dict[str, int]:
    mapping: dict[str, int] = {}
    directory = root / "lessons"
    if not directory.exists():
        return mapping
    for path in sorted(directory.glob("*.md")):
        meta, body = _parse_front_matter(path.read_text(encoding="utf-8"))
        slug = meta.get("slug") or path.stem
        lesson = (
            await session.execute(select(Lesson).where(Lesson.slug == slug))
        ).scalar_one_or_none()
        if lesson is None:
            lesson = Lesson(slug=slug)
            session.add(lesson)
        lesson.title = meta.get("title", slug)
        lesson.content_md = body
        await session.flush()
        mapping[slug] = lesson.id
    return mapping


async def _upsert_quizzes(session: AsyncSession, root: Path) -> dict[str, int]:
    mapping: dict[str, int] = {}
    directory = root / "quizzes"
    if not directory.exists():
        return mapping
    for path in sorted(directory.glob("*.yaml")):
        data = _read_yaml(path)
        slug = data["slug"]
        quiz = (
            await session.execute(select(Quiz).where(Quiz.slug == slug))
        ).scalar_one_or_none()
        if quiz is None:
            quiz = Quiz(slug=slug)
            session.add(quiz)
        quiz.title = data["title"]
        quiz.pass_threshold = float(data.get("pass_threshold", 0.7))
        await session.flush()

        # Replace questions wholesale (simple, idempotent).
        await session.execute(delete(Question).where(Question.quiz_id == quiz.id))
        for i, q in enumerate(data.get("questions", [])):
            session.add(
                Question(
                    quiz_id=quiz.id,
                    order_index=i,
                    type=q["type"],
                    prompt=q["prompt"],
                    options=q.get("options"),
                    correct=q["correct"],
                    explanation=q.get("explanation", ""),
                )
            )
        await session.flush()
        mapping[slug] = quiz.id
    return mapping


async def _upsert_trainer_tasks(session: AsyncSession, root: Path) -> dict[str, int]:
    mapping: dict[str, int] = {}
    directory = root / "trainer"
    if not directory.exists():
        return mapping
    for path in sorted(directory.glob("*.yaml")):
        data = _read_yaml(path)
        slug = data["slug"]
        task = (
            await session.execute(select(TrainerTask).where(TrainerTask.slug == slug))
        ).scalar_one_or_none()
        if task is None:
            task = TrainerTask(slug=slug)
            session.add(task)
        task.title = data["title"]
        task.instructions_md = data.get("instructions", "")
        task.solution_notes = data.get("solution_notes", "")
        task.sheet = data.get("sheet", {})
        task.editable = data.get("editable", [])
        await session.flush()

        grading_data = data.get("grading", {})
        grading = (
            await session.execute(
                select(TrainerGrading).where(TrainerGrading.task_id == task.id)
            )
        ).scalar_one_or_none()
        if grading is None:
            grading = TrainerGrading(task_id=task.id)
            session.add(grading)
        grading.rules = grading_data.get("rules", [])
        grading.xp = int(grading_data.get("xp", 20))
        await session.flush()
        mapping[slug] = task.id
    return mapping


async def _upsert_levels(session: AsyncSession, root: Path) -> None:
    path = root / "levels.yaml"
    if not path.exists():
        return
    for t in _read_yaml(path).get("thresholds", []):
        threshold = await session.get(LevelThreshold, t["level"])
        if threshold is None:
            threshold = LevelThreshold(level=t["level"])
            session.add(threshold)
        threshold.required_xp = int(t["required_xp"])
    await session.flush()


async def _upsert_curriculum(
    session: AsyncSession,
    root: Path,
    refs: dict[str, dict[str, int]],
) -> None:
    path = root / "curriculum.yaml"
    if not path.exists():
        return
    data = _read_yaml(path)
    for ci, c in enumerate(data.get("courses", [])):
        course = (
            await session.execute(select(Course).where(Course.slug == c["slug"]))
        ).scalar_one_or_none()
        if course is None:
            course = Course(slug=c["slug"])
            session.add(course)
        course.title = c["title"]
        course.description = c.get("description", "")
        course.order_index = c.get("order", ci)
        await session.flush()

        for bi, b in enumerate(c.get("blocks", [])):
            block = (
                await session.execute(
                    select(Block).where(Block.course_id == course.id, Block.slug == b["slug"])
                )
            ).scalar_one_or_none()
            if block is None:
                block = Block(course_id=course.id, slug=b["slug"])
                session.add(block)
            block.title = b["title"]
            block.order_index = b.get("order", bi)
            block.xp_reward = int(b.get("xp", 20))
            await session.flush()

            await session.execute(delete(Step).where(Step.block_id == block.id))
            for si, s in enumerate(b.get("steps", [])):
                activity_type = s["type"]
                ref = s["ref"]
                activity_id = refs.get(activity_type, {}).get(ref)
                if activity_id is None:
                    raise ValueError(f"Curriculum references unknown {activity_type}: {ref!r}")
                session.add(
                    Step(
                        block_id=block.id,
                        order_index=si,
                        activity_type=activity_type,
                        activity_id=activity_id,
                        title=s.get("title", ref),
                    )
                )
            await session.flush()


async def seed() -> None:
    root = _content_root()
    async with SessionLocal() as session:
        lessons = await _upsert_lessons(session, root)
        quizzes = await _upsert_quizzes(session, root)
        tasks = await _upsert_trainer_tasks(session, root)
        await _upsert_levels(session, root)
        await _upsert_curriculum(
            session,
            root,
            {"lesson": lessons, "quiz": quizzes, "trainer_task": tasks},
        )
        await session.commit()
    print(
        f"Seed complete from {root}: "
        f"{len(lessons)} lessons, {len(quizzes)} quizzes, {len(tasks)} trainer tasks."
    )
