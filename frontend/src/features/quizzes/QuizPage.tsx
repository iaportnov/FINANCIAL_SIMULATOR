import {
  Badge,
  Button,
  Card,
  Center,
  Checkbox,
  Container,
  Group,
  Loader,
  NumberInput,
  Paper,
  Progress,
  Radio,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { type ProgressSummary, fetchProgress } from "../progression/api";
import { QuizIcon } from "../../shared/ui/icons";
import { useReward } from "../../shared/ui/reward";
import { type AnswerInput, fetchQuiz, type QuizResult, submitQuiz } from "./api";

export function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const id = Number(quizId);
  const queryClient = useQueryClient();
  const celebrate = useReward();
  const { data: quiz, isLoading } = useQuery({ queryKey: ["quiz", quizId], queryFn: () => fetchQuiz(id) });
  const [answers, setAnswers] = useState<Record<number, AnswerInput>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const submit = useMutation({
    mutationFn: () => submitQuiz(id, Object.values(answers)),
    onSuccess: async (r) => {
      setResult(r);
      if (!r.passed) return;
      const prev = queryClient.getQueryData<ProgressSummary>(["progress"]);
      const fresh = await fetchProgress();
      queryClient.setQueryData(["progress"], fresh);
      queryClient.invalidateQueries({ queryKey: ["map"] });
      celebrate({
        kind: "quiz",
        xpGained: prev ? fresh.total_xp - prev.total_xp : undefined,
        level: fresh.level,
        leveledUp: prev ? fresh.level > prev.level : false,
        onDone: () => navigate("/"),
      });
    },
  });

  if (isLoading)
    return (
      <Center mih="60vh">
        <Loader />
      </Center>
    );
  if (!quiz) return null;

  const setAnswer = (qid: number, patch: Partial<AnswerInput>) =>
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], ...patch, question_id: qid } }));

  const resultFor = (qid: number) => result?.results.find((r) => r.question_id === qid);

  return (
    <Container size="sm" px={0}>
      <Paper withBorder p="lg" mb="lg" className="vtb-rise">
        <Badge
          variant="light"
          color="azure"
          leftSection={<QuizIcon size={13} />}
          styles={{ label: { display: "flex", alignItems: "center", gap: 4 } }}
        >
          Тест
        </Badge>
        <Title order={2} mt="sm">
          {quiz.title}
        </Title>
        <Text c="dimmed" fz="sm" mt={4}>
          Ответьте на все вопросы и нажмите «Проверить».
        </Text>
      </Paper>

      <Stack className="vtb-stagger">
        {quiz.questions.map((q, i) => {
          const res = resultFor(q.id);
          return (
            <Card
              key={q.id}
              withBorder
              style={res ? { borderColor: res.correct ? "#cdeede" : "#ffd2d2" } : undefined}
            >
              <Group gap="sm" mb="sm" align="flex-start" wrap="nowrap">
                <Badge size="lg" circle variant="light" color="gray">
                  {i + 1}
                </Badge>
                <Text fw={650}>{q.prompt}</Text>
              </Group>

              {q.type === "single_choice" && q.options && (
                <Radio.Group onChange={(v) => setAnswer(q.id, { option_ids: [Number(v)], value: undefined })}>
                  <Stack gap="xs" pl={42}>
                    {q.options.map((o) => <Radio key={o.id} value={String(o.id)} label={o.text} />)}
                  </Stack>
                </Radio.Group>
              )}

              {q.type === "multiple_choice" && q.options && (
                <Checkbox.Group onChange={(vals) => setAnswer(q.id, { option_ids: vals.map(Number), value: undefined })}>
                  <Stack gap="xs" pl={42}>
                    {q.options.map((o) => <Checkbox key={o.id} value={String(o.id)} label={o.text} />)}
                  </Stack>
                </Checkbox.Group>
              )}

              {q.type === "numeric" && (
                <NumberInput
                  pl={42}
                  placeholder="Ваш ответ"
                  onChange={(v) => setAnswer(q.id, { value: typeof v === "number" ? v : Number(v), option_ids: undefined })}
                />
              )}

              {res && (
                <Stack gap={4} mt="sm" pl={42}>
                  <Badge color={res.correct ? "teal" : "red"} variant="light">
                    {res.correct ? "Верно" : "Неверно"}
                  </Badge>
                  {res.explanation && (
                    <Text size="sm" c="dimmed">
                      {res.explanation}
                    </Text>
                  )}
                </Stack>
              )}
            </Card>
          );
        })}

        {!result?.passed && (
          <Button size="md" onClick={() => submit.mutate()} loading={submit.isPending}>
            Проверить
          </Button>
        )}

        {result && (
          <Paper
            withBorder
            p="md"
            style={{ borderColor: result.passed ? "#cdeede" : "#ffd2d2" }}
          >
            <Group justify="space-between" mb={6}>
              <Text fw={700} c={result.passed ? "teal" : "red"}>
                {result.passed ? "Тест сдан" : "Пока не сдан"}
              </Text>
              <Text fw={700}>{Math.round(result.score * 100)}%</Text>
            </Group>
            <Progress value={result.score * 100} color={result.passed ? "teal" : "red"} radius="xl" />
            {result.passed && (
              <Button mt="md" variant="light" onClick={() => navigate("/")} fullWidth>
                К карте
              </Button>
            )}
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
