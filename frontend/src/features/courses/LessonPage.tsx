import { Button, Stack, Text, Title, TypographyStylesProvider } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

import { completeStep } from "../progression/api";
import { fetchLesson } from "./api";

export function LessonPage() {
  const { lessonId } = useParams();
  const [params] = useSearchParams();
  const stepId = Number(params.get("step"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLesson(Number(lessonId)),
  });

  const complete = useMutation({
    mutationFn: () => completeStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["map"] });
      navigate("/");
    },
  });

  if (isLoading) return <Text>Загрузка…</Text>;
  if (!lesson) return null;

  return (
    <Stack maw={760}>
      <Title order={2}>{lesson.title}</Title>
      <TypographyStylesProvider>
        <ReactMarkdown>{lesson.content_md}</ReactMarkdown>
      </TypographyStylesProvider>
      {Boolean(stepId) && (
        <Button onClick={() => complete.mutate()} loading={complete.isPending}>
          Пометить пройденным
        </Button>
      )}
    </Stack>
  );
}
