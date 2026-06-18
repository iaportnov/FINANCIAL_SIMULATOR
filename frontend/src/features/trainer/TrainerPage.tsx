import { Button, Flex, ScrollArea, Stack, Text, Title, TypographyStylesProvider } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { type CellModel, fetchTask, type TrainerResult, submitTask } from "./api";
import { SpreadsheetTrainer, type SpreadsheetTrainerHandle } from "./SpreadsheetTrainer";
import { TrainerAssistant } from "./TrainerAssistant";

export function TrainerPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const id = Number(taskId);
  const queryClient = useQueryClient();
  const { data: task, isLoading } = useQuery({ queryKey: ["task", taskId], queryFn: () => fetchTask(id) });
  const [result, setResult] = useState<TrainerResult | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const trainerRef = useRef<SpreadsheetTrainerHandle>(null);

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
    <Flex
      gap="md"
      align="stretch"
      style={{ height: "calc(100vh - 56px - 2 * var(--mantine-spacing-md))" }}
    >
      <ScrollArea w={340} type="auto" style={{ flexShrink: 0 }}>
        <Stack pr="sm">
          <Title order={2}>{task.title}</Title>
          <Button variant="light" size="xs" onClick={() => setAssistantOpen((v) => !v)}>
            {assistantOpen ? "Скрыть наставника" : "Спросить ИИ-наставника"}
          </Button>
          <TypographyStylesProvider>
            <ReactMarkdown>{task.instructions_md}</ReactMarkdown>
          </TypographyStylesProvider>
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
      </ScrollArea>
      <div style={{ flex: 1, minWidth: 0 }}>
        <SpreadsheetTrainer
          ref={trainerRef}
          sheet={task.sheet}
          editable={task.editable}
          onSubmit={(c) => submit.mutate(c)}
          hideSubmit={result?.passed}
        />
      </div>
      {assistantOpen && (
        <div style={{ width: 360, flexShrink: 0 }}>
          <TrainerAssistant taskId={id} getCells={() => trainerRef.current?.getCells() ?? {}} />
        </div>
      )}
    </Flex>
  );
}
