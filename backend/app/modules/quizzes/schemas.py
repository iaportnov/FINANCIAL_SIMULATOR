from pydantic import BaseModel


class QuestionPublic(BaseModel):
    id: int
    type: str
    prompt: str
    options: list[dict] | None = None  # choice options; no correct answers exposed


class QuizPublic(BaseModel):
    id: int
    slug: str
    title: str
    pass_threshold: float
    questions: list[QuestionPublic]


class AnswerInput(BaseModel):
    question_id: int
    option_ids: list[int] | None = None  # for single/multiple choice
    value: float | None = None  # for numeric


class SubmitQuizRequest(BaseModel):
    answers: list[AnswerInput]


class QuestionResult(BaseModel):
    question_id: int
    correct: bool
    explanation: str | None = None


class QuizResult(BaseModel):
    score: float
    passed: bool
    results: list[QuestionResult]
