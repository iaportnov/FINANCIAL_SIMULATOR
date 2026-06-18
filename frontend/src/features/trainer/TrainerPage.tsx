import {
  Badge,
  Button,
  Center,
  Flex,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
  TypographyStylesProvider,
} from "@mantine/core";
import ReactMarkdown from "react-markdown";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { type ProgressSummary, fetchProgress } from "../progression/api";
import { TrainerIcon } from "../../shared/ui/icons";
import { useReward } from "../../shared/ui/reward";
import { type CellModel, fetchTask, type TrainerResult, submitTask } from "./api";
import { SpreadsheetTrainer, type SpreadsheetTrainerHandle } from "./SpreadsheetTrainer";
import { TrainerAssistant } from "./TrainerAssistant";

export function TrainerPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const id = Number(taskId);
  const queryClient = useQueryClient();
  const celebrate = useReward();
  const { data: task, isLoading } = useQuery({ queryKey: ["task", taskId], queryFn: () => fetchTask(id) });
  const [result, setResult] = useState<TrainerResult | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const trainerRef = useRef<SpreadsheetTrainerHandle>(null);

  const submit = useMutation({
    mutationFn: (cells: CellModel) => submitTask(id, cells),
    onSuccess: async (r) => {
      setResult(r);
      if (!r.passed) return;
      const prev = queryClient.getQueryData<ProgressSummary>(["progress"]);
      const fresh = await fetchProgress();
      queryClient.setQueryData(["progress"], fresh);
      queryClient.invalidateQueries({ queryKey: ["map"] });
      celebrate({
        kind: "task",
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
  if (!task) return null;

  const wrong = result?.results.filter((c) => !c.correct) ?? [];

  return (
    <Flex
      gap="md"
      align="stretch"
      style={{ height: "calc(100vh - 66px - 2 * var(--mantine-spacing-lg))" }}
    >
      <ScrollArea w={360} type="auto" style={{ flexShrink: 0 }}>
        <Paper withBorder p="lg" mr="sm">
          <Stack gap="md">
            <Group justify="space-between">
              <Badge
                variant="light"
                color="azure"
                leftSection={<TrainerIcon size={13} />}
                styles={{ label: { display: "flex", alignItems: "center", gap: 4 } }}
              >
                Практика
              </Badge>
              <Button variant="subtle" size="compact-sm" onClick={() => setAssistantOpen((v) => !v)}>
                {assistantOpen ? "Скрыть наставника" : "ИИ-наставник"}
              </Button>
            </Group>

            <Title order={3}>{task.title}</Title>

            <TypographyStylesProvider className="vtb-prose" style={{ fontSize: 14 }}>
              <ReactMarkdown>{task.instructions_md}</ReactMarkdown>
            </TypographyStylesProvider>

            {result && !result.passed && (
              <Paper withBorder p="sm" style={{ borderColor: "#ffd2d2", background: "#fff6f6" }}>
                <Text fw={700} c="red" fz="sm" mb={6}>
                  Пока неверно — проверьте ячейки.
                </Text>
                {wrong.length > 0 && (
                  <Group gap={6}>
                    {wrong.map((c) => (
                      <Badge key={c.cell} color="red" variant="light" size="sm">
                        {c.cell}
                      </Badge>
                    ))}
                  </Group>
                )}
              </Paper>
            )}

            {result?.passed && (
              <Paper withBorder p="sm" style={{ borderColor: "#cdeede", background: "#f3fcf8" }}>
                <Text fw={700} c="teal" mb={6}>
                  Задача решена!
                </Text>
                <Button color="teal" variant="light" onClick={() => navigate("/")} fullWidth>
                  К карте
                </Button>
              </Paper>
            )}
          </Stack>
        </Paper>
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
