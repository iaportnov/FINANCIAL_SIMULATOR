import { Button } from "@mantine/core";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { SparkIcon } from "./icons";

export type RewardKind = "lesson" | "quiz" | "task";

export interface CelebrateOptions {
  kind: RewardKind;
  /** XP earned for this activity (shown as +N XP). */
  xpGained?: number;
  /** Level reached after this activity. */
  level: number;
  /** Whether this activity pushed the learner to a new level. */
  leveledUp?: boolean;
  /** Called once the learner dismisses the celebration. */
  onDone?: () => void;
}

const ACTIVITY_COPY: Record<RewardKind, { title: string; subtitle: string }> = {
  lesson: { title: "Урок пройден!", subtitle: "Отличная работа — двигаемся дальше." },
  quiz: { title: "Тест сдан!", subtitle: "Материал закреплён." },
  task: { title: "Задача решена!", subtitle: "Расчёт сошёлся с эталоном." },
};

const CONFETTI_COLORS = ["#1f54e6", "#03a6e8", "#4ac4ff", "#ffb547", "#18b27a", "#ffffff"];

type Phase = "activity" | "level";

const RewardContext = createContext<(o: CelebrateOptions) => void>(() => {});

export function useReward() {
  return useContext(RewardContext);
}

export function RewardProvider({ children }: { children: ReactNode }) {
  const [reward, setReward] = useState<CelebrateOptions | null>(null);
  const [phase, setPhase] = useState<Phase>("activity");

  const celebrate = useCallback((options: CelebrateOptions) => {
    setPhase("activity");
    setReward(options);
  }, []);

  const close = useCallback(() => {
    const done = reward?.onDone;
    setReward(null);
    done?.();
  }, [reward]);

  const next = useCallback(() => {
    if (reward?.leveledUp && phase === "activity") setPhase("level");
    else close();
  }, [reward, phase, close]);

  return (
    <RewardContext.Provider value={celebrate}>
      {children}
      {reward && (
        <RewardOverlay reward={reward} phase={phase} onNext={next} />
      )}
    </RewardContext.Provider>
  );
}

function RewardOverlay({
  reward,
  phase,
  onNext,
}: {
  reward: CelebrateOptions;
  phase: Phase;
  onNext: () => void;
}) {
  const isLevel = phase === "level";
  const confetti = useMemo(() => makeConfetti(isLevel ? 46 : 28), [isLevel]);
  const copy = ACTIVITY_COPY[reward.kind];

  return (
    <div className="vtb-reward-backdrop" onClick={onNext}>
      <div
        className={`vtb-reward-card${isLevel ? " vtb-reward-card--level" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vtb-confetti" aria-hidden>
          {confetti.map((c, i) => (
            <i key={i} style={c} />
          ))}
        </div>

        {isLevel ? (
          <>
            <div className="vtb-level-badge">
              <img className="vtb-level-badge__medal" src="/brand/level-medal.png" alt="" />
              <svg viewBox="0 0 132 132" width="132" height="132">
                <circle className="vtb-level-ring-bg" cx="66" cy="66" r="58" />
                <circle className="vtb-level-ring" cx="66" cy="66" r="58" />
              </svg>
              <div className="vtb-level-badge__num">{reward.level}</div>
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 24 }}>Новый уровень!</h2>
            <p style={{ margin: 0, opacity: 0.85 }}>
              Вы достигли уровня {reward.level}. Новые задания открыты.
            </p>
            <Button mt="lg" size="md" variant="white" color="vtb" onClick={onNext} fullWidth>
              Отлично
            </Button>
          </>
        ) : (
          <>
            <div className="vtb-seal">
              <svg viewBox="0 0 56 56" aria-hidden>
                <path className="vtb-seal__check" d="M14 29.5 24 39 43 18" />
              </svg>
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 24 }}>{copy.title}</h2>
            <p style={{ margin: 0, color: "var(--vtb-dim)" }}>{copy.subtitle}</p>
            {reward.xpGained ? (
              <div className="vtb-xp">
                <SparkIcon size={15} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                +{reward.xpGained} XP
              </div>
            ) : null}
            <Button mt="lg" size="md" onClick={onNext} fullWidth>
              {reward.leveledUp ? "Дальше" : "Продолжить"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function makeConfetti(count: number) {
  return Array.from({ length: count }, () => ({
    left: `${Math.random() * 100}%`,
    background: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    animationDuration: `${2.2 + Math.random() * 1.6}s`,
    animationDelay: `${Math.random() * 0.5}s`,
    transform: `rotate(${Math.random() * 360}deg)`,
  }));
}
