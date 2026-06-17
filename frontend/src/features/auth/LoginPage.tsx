import { Anchor, Button, Card, Container, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../shared/auth/store";
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
    <Container size="xs" mt="xl">
      <Card withBorder padding="lg">
        <form onSubmit={onSubmit}>
          <Stack>
            <Title order={3}>Вход</Title>
            <TextInput label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
            <PasswordInput label="Пароль" value={password} onChange={(e) => setPassword(e.currentTarget.value)} required />
            {error && <Text c="red" size="sm">{error}</Text>}
            <Button type="submit">Войти</Button>
            <Text size="sm">
              Нет аккаунта? <Anchor component={Link} to="/register">Регистрация</Anchor>
            </Text>
          </Stack>
        </form>
      </Card>
    </Container>
  );
}
