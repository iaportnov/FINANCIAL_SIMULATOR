import { Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "../../shared/auth/store";
import { fetchProgress } from "../progression/api";

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    enabled: Boolean(user),
  });

  if (!user) return <Text>Войдите, чтобы увидеть профиль.</Text>;

  return (
    <Card withBorder maw={480}>
      <Stack>
        <Title order={3}>{user.display_name}</Title>
        <Text c="dimmed">{user.email}</Text>
        <Group>
          <Badge size="lg">Уровень {progress?.level ?? "—"}</Badge>
          <Badge size="lg" variant="light">{progress?.total_xp ?? 0} XP</Badge>
        </Group>
      </Stack>
    </Card>
  );
}
