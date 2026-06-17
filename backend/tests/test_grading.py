"""Pure unit tests for grading logic (no DB). These are the TDD core targets."""

from app.core.grading import within_tolerance
from app.modules.quizzes.models import Question
from app.modules.quizzes.schemas import AnswerInput
from app.modules.quizzes.service import QuizService
from app.modules.trainer.service import TrainerService


# --- within_tolerance -------------------------------------------------------

def test_within_tolerance_exact():
    assert within_tolerance(10, 10)
    assert not within_tolerance(10, 11)


def test_within_tolerance_absolute():
    assert within_tolerance(10.4, 10, {"type": "absolute", "value": 0.5})
    assert not within_tolerance(10.6, 10, {"type": "absolute", "value": 0.5})


def test_within_tolerance_relative():
    assert within_tolerance(101, 100, {"type": "relative", "value": 0.01})
    assert not within_tolerance(102, 100, {"type": "relative", "value": 0.01})


def test_within_tolerance_rejects_none():
    assert not within_tolerance(None, 10, {"type": "absolute", "value": 1})


# --- trainer rule checking --------------------------------------------------

def test_trainer_rule_requires_formula_and_function():
    rule = {
        "cell": "B5",
        "expected": 11122.22,
        "tolerance": {"type": "relative", "value": 0.01},
        "must_be_formula": True,
        "must_use_function": ["PMT"],
    }
    # correct value via a PMT formula → ok
    assert TrainerService._check_rule(rule, {"value": 11120, "formula": "=PMT(0.01,12,-100000)"})
    # right value but hardcoded (no formula) → fails must_be_formula
    assert not TrainerService._check_rule(rule, {"value": 11122.22, "formula": ""})
    # formula present but wrong function → fails must_use_function
    assert not TrainerService._check_rule(rule, {"value": 11122.22, "formula": "=SUM(A1:A2)"})


def test_trainer_rule_value_only():
    rule = {"cell": "B5", "expected": 5000, "tolerance": {"type": "absolute", "value": 1}}
    assert TrainerService._check_rule(rule, {"value": 5000.5})
    assert not TrainerService._check_rule(rule, {"value": 5010})


# --- quiz answer checking ---------------------------------------------------

def test_quiz_check_single_choice():
    q = Question(type="single_choice", prompt="", options=[], correct={"option_ids": [2]})
    assert QuizService._check(q, AnswerInput(question_id=1, option_ids=[2]))
    assert not QuizService._check(q, AnswerInput(question_id=1, option_ids=[1]))


def test_quiz_check_multiple_choice_requires_exact_set():
    q = Question(type="multiple_choice", prompt="", options=[], correct={"option_ids": [1, 3]})
    assert QuizService._check(q, AnswerInput(question_id=1, option_ids=[3, 1]))
    assert not QuizService._check(q, AnswerInput(question_id=1, option_ids=[1]))


def test_quiz_check_numeric():
    q = Question(
        type="numeric",
        prompt="",
        correct={"value": 5000, "tolerance": {"type": "absolute", "value": 1}},
    )
    assert QuizService._check(q, AnswerInput(question_id=1, value=5000.5))
    assert not QuizService._check(q, AnswerInput(question_id=1, value=5010))
