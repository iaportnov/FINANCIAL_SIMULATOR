import { Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { fetchMap, type StepNode, type StepStatus } from "./api";

const STATUS_COLOR: Record<StepStatus, string> = {
  completed: "green",
  unlocked: "blue",
  locked: "gray",
};

function activityHref(step: StepNode): string {
  switch (step.activity_type) {
    case "lesson":
      return `/lessons/${step.activity_id}?step=${step.id}`;
    case "quiz":
      return `/quizzes/${step.activity_id}`;
    case "trainer_task":
      return `/trainer/${step.activity_id}`;
  }
}

export function MapPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["map"], queryFn: fetchMap });

  if (isLoading) return <Text>Загрузка карты…</Text>;
  if (error) return <Text c="red">Не удалось загрузить карту. Войдите в аккаунт.</Text>;
  if (!data) return null;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Карта заданий</Title>
        <Badge size="lg" variant="filled">
          Уровень {data.level} · {data.total_xp} XP
        </Badge>
      </Group>

      {data.courses.map((course) => (
        <Card key={course.id} withBorder>
          <Title order={4} mb="sm">{course.title}</Title>
          <Stack gap="md">
            {course.blocks.map((block) => (
              <div key={block.id}>
                <Group gap="xs" mb="xs">
                  <Text fw={600}>{block.title}</Text>
                  <Badge variant="light">+{block.xp_reward} XP</Badge>
                </Group>
                <Stack gap="xs">
                  {block.steps.map((step) => (
                    <Group key={step.id} justify="space-between">
                      <Group gap="sm">
                        <Badge color={STATUS_COLOR[step.status]} variant="light">
                          {step.activity_type}
                        </Badge>
                        <Text>{step.title}</Text>
                      </Group>
                      {step.status === "locked" ? (
                        <Button size="xs" variant="default" disabled>Закрыто</Button>
                      ) : (
                        <Button size="xs" component={Link} to={activityHref(step)}>
                          {step.status === "completed" ? "Повторить" : "Начать"}
                        </Button>
                      )}
                    </Group>
                  ))}
                </Stack>
              </div>
            ))}
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
