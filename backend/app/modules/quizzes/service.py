from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.core.grading import within_tolerance
from app.modules.progression import service as progression_service
from app.modules.quizzes.models import Question, QuizAttempt
from app.modules.quizzes.repository import QuizRepository
from app.modules.quizzes.schemas import (
    AnswerInput,
    QuestionPublic,
    QuestionResult,
    QuizPublic,
    QuizResult,
)


class QuizService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = QuizRepository(session)

    async def get_quiz_public(self, quiz_id: int) -> QuizPublic:
        quiz = await self.repo.get_quiz(quiz_id)
        if not quiz:
            raise NotFoundError("Quiz not found")
        return QuizPublic(
            id=quiz.id,
            slug=quiz.slug,
            title=quiz.title,
            pass_threshold=quiz.pass_threshold,
            questions=[
                QuestionPublic(
                    id=q.id, 
                    type=q.type, 
                    prompt=q.prompt, 
                    options=q.options,
                    correct=q.correct
                )
                for q in quiz.questions
            ],
        )

    async def grade(self, quiz_id: int, answers: list[AnswerInput], user_id: int) -> QuizResult:
        quiz = await self.repo.get_quiz(quiz_id)
        if not quiz:
            raise NotFoundError("Quiz not found")

        by_qid = {a.question_id: a for a in answers}
        results: list[QuestionResult] = []
        correct_count = 0
        for q in quiz.questions:
            ok = self._check(q, by_qid.get(q.id))
            correct_count += int(ok)
            results.append(
                QuestionResult(question_id=q.id, correct=ok, explanation=q.explanation or None)
            )

        total = len(quiz.questions)
        score = correct_count / total if total else 0.0
        passed = score >= quiz.pass_threshold

        await self.repo.add_attempt(
            QuizAttempt(
                user_id=user_id,
                quiz_id=quiz_id,
                score=score,
                passed=passed,
                answers=[a.model_dump() for a in answers],
            )
        )

        # Report completion "upward" to progression (one-way dependency).
        if passed:
            await progression_service.record_completion(self.session, user_id, "quiz", quiz_id)

        return QuizResult(score=score, passed=passed, results=results)

    @staticmethod
    def _check(question: Question, answer: AnswerInput | None) -> bool:
        if answer is None:
            return False
        if question.type in ("single_choice", "multiple_choice"):
            correct_ids = set(question.correct.get("option_ids", []))
            given = set(answer.option_ids or [])
            return given == correct_ids
        if question.type == "numeric":
            return within_tolerance(
                answer.value, question.correct.get("value"), question.correct.get("tolerance")
            )
        return False
