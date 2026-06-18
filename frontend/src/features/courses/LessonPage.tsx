import { Button, Image, Stack, Text, Title, TypographyStylesProvider } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

import { completeStep } from "../progression/api";
import { fetchLesson } from "./api";

const LESSON_HERO_IMAGES: Record<string, string> = {
  "budgeting-basics": "/lesson-images/ifrs-16-lease-hero.png",
  "saving-basics": "/lesson-images/ifrs-15-revenue-hero.png",
};

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

  const heroImage = LESSON_HERO_IMAGES[lesson.slug];

  return (
    <Stack maw={760}>
      {heroImage && (
        <Image
          src={heroImage}
          alt=""
          radius="md"
          h={{ base: 180, sm: 300 }}
          fit="cover"
        />
      )}
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
