import { Button, Stack, Text, Title } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

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
      {/* TODO: render Markdown via react-markdown; raw text for the skeleton. */}
      <Text style={{ whiteSpace: "pre-wrap" }}>{lesson.content_md}</Text>
      {Boolean(stepId) && (
        <Button onClick={() => complete.mutate()} loading={complete.isPending}>
          Пометить пройденным
        </Button>
      )}
    </Stack>
  );
}
