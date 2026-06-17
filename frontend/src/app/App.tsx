import { AppShell, Group, Title } from "@mantine/core";
import { Link } from "react-router-dom";

import { useAuthStore } from "../shared/auth/store";
import { AppRouter } from "./router";

export function App() {
  const user = useAuthStore((s) => s.user);

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Title order={4}>Financial Simulator</Title>
          </Link>
          <Group>
            <Link to="/">Карта</Link>
            <Link to="/courses">Курсы</Link>
            {user ? <Link to="/profile">{user.display_name}</Link> : <Link to="/login">Войти</Link>}
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <AppRouter />
      </AppShell.Main>
    </AppShell>
  );
}
