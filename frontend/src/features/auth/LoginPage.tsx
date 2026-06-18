import { Anchor, Button, Paper, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../shared/auth/store";
import { AuthLayout } from "./AuthLayout";
import { fetchMe, login } from "./api";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { access_token } = await login(email, password);
      setAccessToken(access_token); // so fetchMe is authorized
      const me = await fetchMe();
      setSession(access_token, me);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthLayout>
      <Paper withBorder p="xl">
        <form onSubmit={onSubmit}>
          <Stack>
            <div>
              <Title order={3}>С возвращением</Title>
              <Text c="dimmed" fz="sm" mt={2}>
                Войдите, чтобы продолжить обучение.
              </Text>
            </div>
            <TextInput label="Email" placeholder="you@company.ru" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
            <PasswordInput label="Пароль" value={password} onChange={(e) => setPassword(e.currentTarget.value)} required />
            {error && <Text c="red" size="sm">{error}</Text>}
            <Button type="submit" size="md" mt={4}>
              Войти
            </Button>
            <Text size="sm" ta="center" c="dimmed">
              Нет аккаунта? <Anchor component={Link} to="/register">Регистрация</Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </AuthLayout>
  );
}
