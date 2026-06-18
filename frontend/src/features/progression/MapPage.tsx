import { Button, Center, Container, Group, Loader, Progress, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { activityMeta, type ActivityType } from "../../shared/ui/activity";
import { BrandMark, CheckIcon, LockIcon, SparkIcon } from "../../shared/ui/icons";
import {
  type BlockNode,
  fetchMap,
  type StepNode,
  type StepStatus,
} from "./api";

function activityHref(step: StepNode): string {
  switch (step.activity_type) {
    case "lesson":
      return `/lessons/${step.activity_id}?step=${step.id}`;
    case "quiz":
      return `/quizzes/${step.activity_id}`;
    case "trainer_task":
      return `/trainer/${step.activity_id}`;
  }
}

const NODE_CLASS: Record<StepStatus, string> = {
  completed: "vtb-node--done",
  unlocked: "vtb-node--current",
  locked: "vtb-node--locked",
};

type Row =
  | { kind: "block"; block: BlockNode; first: boolean; last: boolean }
  | { kind: "step"; step: StepNode; first: boolean; last: boolean };

/** Flatten a course's blocks+steps into a single vertical column of graph rows. */
function courseRows(blocks: BlockNode[]): Row[] {
  const rows: Row[] = [];
  for (const block of blocks) {
    rows.push({ kind: "block", block, first: false, last: false });
    for (const step of block.steps) rows.push({ kind: "step", step, first: false, last: false });
  }
  if (rows.length) {
    rows[0].first = true;
    rows[rows.length - 1].last = true;
  }
  return rows;
}

export function MapPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["map"], queryFn: fetchMap });

  if (isLoading)
    return (
      <Center mih="60vh">
        <Loader />
      </Center>
    );
  if (error)
    return (
      <Container size="sm" mt="xl">
        <Text c="red" ta="center">
          Не удалось загрузить карту. Войдите в аккаунт, чтобы продолжить обучение.
        </Text>
        <Center mt="md">
          <Button component={Link} to="/login">
            Войти
          </Button>
        </Center>
      </Container>
    );
  if (!data) return null;

  const allSteps = data.courses.flatMap((c) => c.blocks.flatMap((b) => b.steps));
  const done = allSteps.filter((s) => s.status === "completed").length;
  const pct = allSteps.length ? Math.round((done / allSteps.length) * 100) : 0;

  return (
    <Container size="md" px={0}>
      <section className="vtb-hero vtb-rise" style={{ marginBottom: 28 }}>
        <BrandMark size={120} style={{ position: "absolute", right: 12, bottom: -18, opacity: 0.28 }} />
        <Text fz={13} fw={700} style={{ letterSpacing: "0.16em", opacity: 0.8 }}>
          ТРАЕКТОРИЯ ОБУЧЕНИЯ
        </Text>
        <Text fz={30} fw={800} mt={4} mb={6} style={{ position: "relative", maxWidth: 520 }}>
          Карта компетенций МСФО
        </Text>
        <Text fz={15} style={{ opacity: 0.88, maxWidth: 460 }}>
          От базовых стандартов к практике аудитора. Открывайте задания шаг за шагом и
          закрепляйте навык в тренажёре.
        </Text>

        <Group mt="lg" gap={28} style={{ position: "relative" }}>
          <Stat label="Уровень" value={String(data.level)} />
          <Stat label="Опыт" value={`${data.total_xp} XP`} icon />
          <Stat label="Пройдено" value={`${done} / ${allSteps.length}`} />
        </Group>

        <div style={{ position: "relative", marginTop: 18, maxWidth: 460 }}>
          <Progress
            value={pct}
            color="azure"
            size="md"
            radius="xl"
            styles={{ root: { background: "rgba(255,255,255,0.22)" } }}
          />
          <Text fz={12} mt={6} style={{ opacity: 0.85 }}>
            Прогресс трека · {pct}%
          </Text>
        </div>
      </section>

      <div className="vtb-graph vtb-stagger">
        {data.courses.map((course, ci) => (
          <div className="vtb-course" key={course.id}>
            <div className="vtb-course__head">
              <div className="vtb-course__index">{ci + 1}</div>
              <div>
                <Text fw={800} fz={19}>
                  {course.title}
                </Text>
                <Text fz={13} c="dimmed">
                  {course.blocks.length} модулей ·{" "}
                  {course.blocks.reduce((n, b) => n + b.steps.length, 0)} заданий
                </Text>
              </div>
            </div>

            {courseRows(course.blocks).map((row) =>
              row.kind === "block" ? (
                <BlockRow key={`b${row.block.id}`} row={row} />
              ) : (
                <StepRow key={`s${row.step.id}`} row={row} />
              ),
            )}
          </div>
        ))}
      </div>
    </Container>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <div>
      <Text fz={11} fw={700} style={{ letterSpacing: "0.1em", opacity: 0.72 }}>
        {label.toUpperCase()}
      </Text>
      <Group gap={6} align="center">
        {icon && <SparkIcon size={16} color="#ffb547" />}
        <Text fz={22} fw={800}>
          {value}
        </Text>
      </Group>
    </div>
  );
}

function BlockRow({ row }: { row: Extract<Row, { kind: "block" }> }) {
  const { block, first, last } = row;
  const done = block.steps.filter((s) => s.status === "completed").length;
  return (
    <div className="vtb-block">
      <div
        className="vtb-block__spine"
        style={{ ...(first && { paddingTop: 8 }), ...(last && { paddingBottom: 8 }) }}
      >
        <div className="vtb-block__diamond" />
      </div>
      <div className="vtb-block__label">
        <Text fw={750} fz={15}>
          {block.title}
        </Text>
        <span className="vtb-kind" style={{ color: "var(--vtb-blue)" }}>
          <SparkIcon size={13} /> +{block.xp_reward} XP
        </span>
        <Text fz={12} c="dimmed">
          {done}/{block.steps.length}
        </Text>
      </div>
    </div>
  );
}

function StepRow({ row }: { row: Extract<Row, { kind: "step" }> }) {
  const { step, first, last } = row;
  const meta = activityMeta(step.activity_type as ActivityType);
  const cls = ["vtb-node", NODE_CLASS[step.status], first && "vtb-node--first", last && "vtb-node--last"]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls}>
      <div className="vtb-node__spine">
        <div className="vtb-node__dot">
          {step.status === "completed" ? (
            <CheckIcon size={26} color="#fff" />
          ) : step.status === "locked" ? (
            <LockIcon size={22} color="#93a1bf" />
          ) : (
            <meta.Icon size={24} color="#fff" />
          )}
        </div>
      </div>

      <div className="vtb-step">
        <div style={{ minWidth: 0 }}>
          <div className="vtb-step__title">{step.title}</div>
          <div className="vtb-step__meta">
            <span className="vtb-kind">
              <meta.Icon size={14} color="currentColor" /> {meta.label}
            </span>
            {step.status === "completed" && (
              <span className="vtb-kind" style={{ color: "var(--vtb-success)" }}>
                · Пройдено
              </span>
            )}
          </div>
        </div>

        {step.status === "locked" ? (
          <Button size="xs" variant="default" leftSection={<LockIcon size={14} />} disabled>
            Закрыто
          </Button>
        ) : (
          <Button
            size="xs"
            component={Link}
            to={activityHref(step)}
            variant={step.status === "completed" ? "light" : "filled"}
          >
            {step.status === "completed" ? "Повторить" : "Начать"}
          </Button>
        )}
      </div>
    </div>
  );
}
