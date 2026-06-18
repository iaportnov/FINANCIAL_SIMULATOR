import type { JSX } from "react";

import { LessonIcon, QuizIcon, TrainerIcon } from "./icons";

export type ActivityType = "lesson" | "quiz" | "trainer_task";

interface ActivityMeta {
  label: string;
  Icon: (props: { size?: number; color?: string }) => JSX.Element;
}

const META: Record<ActivityType, ActivityMeta> = {
  lesson: { label: "Урок", Icon: LessonIcon },
  quiz: { label: "Тест", Icon: QuizIcon },
  trainer_task: { label: "Практика", Icon: TrainerIcon },
};

export function activityMeta(type: ActivityType): ActivityMeta {
  return META[type] ?? META.lesson;
}
