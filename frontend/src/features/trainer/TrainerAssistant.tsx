import {
  Box,
  Button,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  TypographyStylesProvider,
} from "@mantine/core";
import ReactMarkdown from "react-markdown";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { type AssistantMessage, askAssistant, type CellModel } from "./api";

interface Props {
  taskId: number;
  /** Reads the learner's current spreadsheet state at send time. */
  getCells: () => CellModel;
}

const GREETING =
  "Привет! Я помогу разобраться с задачей. Спросите про логику расчёта, нужный " +
  "стандарт МСФО или какие ячейки связать — но решение мы найдём вместе, итог я не подскажу.";

export function TrainerAssistant({ taskId, getCells }: Props) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const viewport = useRef<HTMLDivElement>(null);

  const ask = useMutation({
    mutationFn: (history: AssistantMessage[]) => askAssistant(taskId, history, getCells()),
    onSuccess: (r) => setMessages((prev) => [...prev, { role: "assistant", content: r.reply }]),
  });

  useEffect(() => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: "smooth" });
  }, [messages, ask.isPending]);

  const send = () => {
    const text = input.trim();
    if (!text || ask.isPending) return;
    const history: AssistantMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    ask.mutate(history);
  };

  return (
    <Paper withBorder radius="md" p="sm" h="100%" style={{ display: "flex", flexDirection: "column" }}>
      <Text fw={700} mb="xs">
        ИИ-наставник
      </Text>

      <ScrollArea viewportRef={viewport} style={{ flex: 1 }} type="auto">
        <Stack gap="xs" pr="xs">
          <Text size="sm" c="dimmed">
            {GREETING}
          </Text>

          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}

          {ask.isPending && (
            <Group gap="xs" c="dimmed">
              <Loader size="xs" />
              <Text size="sm">Думаю…</Text>
            </Group>
          )}

          {ask.isError && (
            <Text size="sm" c="red">
              Не удалось получить ответ. Попробуйте ещё раз.
            </Text>
          )}
        </Stack>
      </ScrollArea>

      <Textarea
        mt="xs"
        autosize
        minRows={2}
        maxRows={5}
        placeholder="Спросите наставника…"
        value={input}
        onChange={(e) => setInput(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />
      <Button mt="xs" onClick={send} loading={ask.isPending} disabled={!input.trim()}>
        Отправить
      </Button>
    </Paper>
  );
}

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";
  return (
    <Box
      style={{ alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: "92%" }}
    >
      <Paper
        radius="md"
        p="xs"
        bg={isUser ? "blue.0" : "gray.0"}
      >
        {isUser ? (
          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
            {message.content}
          </Text>
        ) : (
          <TypographyStylesProvider style={{ fontSize: "var(--mantine-font-size-sm)" }}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </TypographyStylesProvider>
        )}
      </Paper>
    </Box>
  );
}
