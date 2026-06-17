import { Badge, Button, Card, Checkbox, NumberInput, Radio, Stack, Text, Title } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { type AnswerInput, fetchQuiz, type QuizResult, submitQuiz } from "./api";

export function QuizPage() {
  const { quizId } = useParams();
  const id = Number(quizId);
  const queryClient = useQueryClient();
  const { data: quiz, isLoading } = useQuery({ queryKey: ["quiz", quizId], queryFn: () => fetchQuiz(id) });
  const [answers, setAnswers] = useState<Record<number, AnswerInput>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const submit = useMutation({
    mutationFn: () => submitQuiz(id, Object.values(answers)),
    onSuccess: (r) => {
      setResult(r);
      if (r.passed) queryClient.invalidateQueries({ queryKey: ["map"] });
    },
  });

  if (isLoading) return <Text>Загрузка…</Text>;
  if (!quiz) return null;

  const setAnswer = (qid: number, patch: Partial<AnswerInput>) =>
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], ...patch, question_id: qid } }));

  const resultFor = (qid: number) => result?.results.find((r) => r.question_id === qid);

  return (
    <Stack maw={760}>
      <Title order={2}>{quiz.title}</Title>
      {quiz.questions.map((q) => (
        <Card key={q.id} withBorder>
          <Text fw={600} mb="sm">{q.prompt}</Text>

          {q.type === "single_choice" && q.options && (
            <Radio.Group onChange={(v) => setAnswer(q.id, { option_ids: [Number(v)], value: undefined })}>
              <Stack gap="xs">
                {q.options.map((o) => <Radio key={o.id} value={String(o.id)} label={o.text} />)}
              </Stack>
            </Radio.Group>
          )}

          {q.type === "multiple_choice" && q.options && (
            <Checkbox.Group onChange={(vals) => setAnswer(q.id, { option_ids: vals.map(Number), value: undefined })}>
              <Stack gap="xs">
                {q.options.map((o) => <Checkbox key={o.id} value={String(o.id)} label={o.text} />)}
              </Stack>
            </Checkbox.Group>
          )}

          {q.type === "numeric" && (
            <NumberInput
              onChange={(v) => setAnswer(q.id, { value: typeof v === "number" ? v : Number(v), option_ids: undefined })}
            />
          )}

          {resultFor(q.id) && (
            <Stack gap={4} mt="sm">
              <Badge color={resultFor(q.id)!.correct ? "green" : "red"}>
                {resultFor(q.id)!.correct ? "Верно" : "Неверно"}
              </Badge>
              {resultFor(q.id)!.explanation && (
                <Text size="sm" c="dimmed">{resultFor(q.id)!.explanation}</Text>
              )}
            </Stack>
          )}
        </Card>
      ))}

      <Button onClick={() => submit.mutate()} loading={submit.isPending}>Проверить</Button>

      {result && (
        <Text fw={700} c={result.passed ? "green" : "red"}>
          Результат: {Math.round(result.score * 100)}% — {result.passed ? "сдано" : "не сдано"}
        </Text>
      )}
    </Stack>
  );
}
