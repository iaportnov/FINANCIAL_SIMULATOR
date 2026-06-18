import { apiFetch } from "../../shared/api/client";

export interface QuestionOption {
  id: number;
  text: string;
}

export interface QuestionPublic {
  id: number;
  type: "single_choice" | "multiple_choice" | "numeric";
  prompt: string;
  options: QuestionOption[] | null;
  correct?: any;
}

export interface QuizPublic {
  id: number;
  slug: string;
  title: string;
  pass_threshold: number;
  questions: QuestionPublic[];
}

export interface AnswerInput {
  question_id: number;
  option_ids?: number[];
  value?: number;
}

export interface QuestionResult {
  question_id: number;
  correct: boolean;
  explanation: string | null;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  results: QuestionResult[];
}

export const fetchQuiz = (quizId: number) => apiFetch<QuizPublic>(`/quizzes/${quizId}`);

export const submitQuiz = (quizId: number, answers: AnswerInput[]) =>
  apiFetch<QuizResult>(`/quizzes/${quizId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
