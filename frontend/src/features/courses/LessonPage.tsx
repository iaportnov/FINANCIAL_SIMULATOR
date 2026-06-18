import {
  Badge,
  Button,
  Center,
  Container,
  Group,
  Image,
  Loader,
  Paper,
  Text,
  Title,
  TypographyStylesProvider,
} from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

import { type ProgressSummary, completeStep, fetchProgress } from "../progression/api";
import { LessonIcon } from "../../shared/ui/icons";
import { useReward } from "../../shared/ui/reward";
import { fetchLesson } from "./api";

const LESSON_HERO_IMAGES: Record<string, string> = {
  "budgeting-basics": "/lesson-images/ifrs-16-lease-hero.png",
  "saving-basics": "/lesson-images/ifrs-15-revenue-hero.png",
  "ifrs-16-leases": "/lesson-images/ifrs-16-lease-hero.png",
  "ias-12-deferred-tax": "/lesson-images/ias-12-tax-hero.png",
  "ifrs-10-consolidation": "/lesson-images/ifrs-10-consolidation-hero.png",
  "ias-36-impairment": "/lesson-images/ias-36-impairment-hero.png",
  "ifrs-15-revenue": "/lesson-images/ifrs-15-revenue-hero.png",
};

export function LessonPage() {
  const { lessonId } = useParams();
  const [params] = useSearchParams();
  const stepId = Number(params.get("step"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const celebrate = useReward();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLesson(Number(lessonId)),
  });

  const complete = useMutation({
    mutationFn: () => completeStep(stepId),
    onSuccess: (summary) => {
      const prev = queryClient.getQueryData<ProgressSummary>(["progress"]);
      celebrate({
        kind: "lesson",
        xpGained: prev ? summary.total_xp - prev.total_xp : undefined,
        level: summary.level,
        leveledUp: prev ? summary.level > prev.level : false,
        onDone: () => navigate("/"),
      });
      queryClient.invalidateQueries({ queryKey: ["map"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });

  if (isLoading)
    return (
      <Center mih="60vh">
        <Loader />
      </Center>
    );
  if (!lesson) return null;

  const heroImage = LESSON_HERO_IMAGES[lesson.slug];

  return (
    <Container size="sm" px={0}>
      <Paper withBorder p={0} className="vtb-rise" style={{ overflow: "hidden" }}>
        {heroImage ? (
          <Image src={heroImage} alt="" h={{ base: 180, sm: 280 }} fit="cover" />
        ) : (
          <div style={{ height: 120, background: "var(--vtb-gradient)" }} />
        )}
        <div style={{ padding: "24px 28px 30px" }}>
          <Group gap="xs" mb="sm">
            <Badge
              variant="light"
              color="vtb"
              leftSection={<LessonIcon size={13} />}
              styles={{ label: { display: "flex", alignItems: "center", gap: 4 } }}
            >
              Урок
            </Badge>
          </Group>
          <Title order={2} mb="lg">
            {lesson.title}
          </Title>
          <TypographyStylesProvider className="vtb-prose">
            <ReactMarkdown>{lesson.content_md}</ReactMarkdown>
          </TypographyStylesProvider>

          {Boolean(stepId) && (
            <Button
              mt="xl"
              size="md"
              onClick={() => complete.mutate()}
              loading={complete.isPending}
            >
              Пометить пройденным
            </Button>
          )}
        </div>
      </Paper>
    </Container>
  );
}
