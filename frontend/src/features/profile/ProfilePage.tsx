import { Button, Container, Group, Paper, RingProgress, SimpleGrid, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { useAuthStore } from "../../shared/auth/store";
import { fetchMap, fetchProgress } from "../progression/api";
import { SparkIcon } from "../../shared/ui/icons";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    enabled: Boolean(user),
  });
  const { data: map } = useQuery({ queryKey: ["map"], queryFn: fetchMap, enabled: Boolean(user) });

  if (!user)
    return (
      <Container size="xs" mt="xl" ta="center">
        <Text mb="md">Войдите, чтобы увидеть профиль.</Text>
        <Button component={Link} to="/login">
          Войти
        </Button>
      </Container>
    );

  const steps = map?.courses.flatMap((c) => c.blocks.flatMap((b) => b.steps)) ?? [];
  const done = steps.filter((s) => s.status === "completed").length;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;

  return (
    <Container size="sm" px={0}>
      <Paper withBorder p={0} className="vtb-rise" style={{ overflow: "hidden" }}>
        <div style={{ background: "var(--vtb-gradient)", height: 96 }} />
        <div style={{ padding: "0 28px 28px" }}>
          <Group align="flex-start" gap="lg" wrap="nowrap">
            <div
              style={{
                marginTop: -44,
                width: 88,
                height: 88,
                borderRadius: 24,
                background: "#fff",
                border: "4px solid #fff",
                boxShadow: "var(--mantine-shadow-md)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 20,
                  background: "var(--vtb-gradient-soft)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 30,
                }}
              >
                {initials(user.display_name)}
              </div>
            </div>
            <div style={{ paddingTop: 8 }}>
              <Text fz={22} fw={800}>
                {user.display_name}
              </Text>
              <Text c="dimmed" fz="sm">
                {user.email}
              </Text>
            </div>
          </Group>

          <SimpleGrid cols={3} mt="xl" spacing="md">
            <StatTile
              top={
                <RingProgress
                  size={72}
                  thickness={7}
                  roundCaps
                  sections={[{ value: pct, color: "azure" }]}
                  label={
                    <Text ta="center" fw={800} fz={16}>
                      {progress?.level ?? "—"}
                    </Text>
                  }
                />
              }
              label="Уровень"
            />
            <StatTile
              top={
                <Group gap={6} h={72} align="center">
                  <SparkIcon size={22} color="#ffb547" />
                  <Text fz={28} fw={800}>
                    {progress?.total_xp ?? 0}
                  </Text>
                </Group>
              }
              label="Опыт (XP)"
            />
            <StatTile
              top={
                <Group h={72} align="center">
                  <Text fz={28} fw={800}>
                    {done}
                    <Text span c="dimmed" fz={18} fw={700}>
                      /{steps.length}
                    </Text>
                  </Text>
                </Group>
              }
              label="Заданий пройдено"
            />
          </SimpleGrid>

          <Button mt="xl" component={Link} to="/" fullWidth variant="light">
            К карте обучения
          </Button>
        </div>
      </Paper>
    </Container>
  );
}

function StatTile({ top, label }: { top: React.ReactNode; label: string }) {
  return (
    <Paper withBorder p="md" radius="lg" style={{ textAlign: "center" }}>
      <Group justify="center">{top}</Group>
      <Text c="dimmed" fz="sm" mt={6} fw={600}>
        {label}
      </Text>
    </Paper>
  );
}
