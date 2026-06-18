import { Button, Stack, Text, Title, TypographyStylesProvider } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { type CellModel, fetchTask, type TrainerResult, submitTask } from "./api";
import { SpreadsheetTrainer } from "./SpreadsheetTrainer";

export function TrainerPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const id = Number(taskId);
  const queryClient = useQueryClient();
  const { data: task, isLoading } = useQuery({ queryKey: ["task", taskId], queryFn: () => fetchTask(id) });
  const [result, setResult] = useState<TrainerResult | null>(null);

  const submit = useMutation({
    mutationFn: (cells: CellModel) => submitTask(id, cells),
    onSuccess: (r) => {
      setResult(r);
      if (r.passed) queryClient.invalidateQueries({ queryKey: ["map"] });
    },
  });

  if (isLoading) return <Text>Загрузка…</Text>;
  if (!task) return null;

  return (
    <Stack>
      <Title order={2}>{task.title}</Title>
      <TypographyStylesProvider>
        <ReactMarkdown>{task.instructions_md}</ReactMarkdown>
      </TypographyStylesProvider>
      <SpreadsheetTrainer sheet={task.sheet} editable={task.editable} onSubmit={(c) => submit.mutate(c)} />
      {result && (
        <Text fw={700} c={result.passed ? "green" : "red"}>
          {result.passed ? "Задача решена!" : "Пока неверно — попробуйте ещё раз."}
        </Text>
      )}
      {result?.passed && (
        <Button onClick={() => navigate("/")} color="green">
          К карте
        </Button>
      )}
    </Stack>
  );
}
