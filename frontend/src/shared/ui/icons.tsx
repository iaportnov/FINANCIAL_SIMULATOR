import type { CSSProperties } from "react";

interface IconProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

const base = (size: number, style?: CSSProperties) => ({
  width: size,
  height: size,
  display: "block" as const,
  ...style,
});

/** Abstract ВТБ-style "wing / horizon" mark. */
export function BrandMark({ size = 34, style }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" style={base(size, style)} aria-hidden>
      <defs>
        <linearGradient id="vtb-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fdcff" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <path
        d="M6 30c10 2 18-2 24-10 2 9-3 18-12 21C11 43 6 37 6 30Z"
        fill="url(#vtb-mark)"
        opacity="0.95"
      />
      <path
        d="M16 12c10-2 20 1 26 9-9 1-16 5-21 12-3-8-3-15-5-21Z"
        fill="#ffffff"
        opacity="0.85"
      />
    </svg>
  );
}

export function LessonIcon({ size = 24, color = "currentColor", style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={base(size, style)} fill="none" aria-hidden>
      <path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5v-12Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 0 1.5-1.5v-12Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function QuizIcon({ size = 24, color = "currentColor", style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={base(size, style)} fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" stroke={color} strokeWidth="1.8" />
      <path
        d="m7.5 12 2.2 2.2L16 8.5"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrainerIcon({ size = 24, color = "currentColor", style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={base(size, style)} fill="none" aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke={color} strokeWidth="1.8" />
      <path d="M3.5 9.5h17M9 9.5v10M3.5 14.5h17" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

export function LockIcon({ size = 22, color = "currentColor", style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={base(size, style)} fill="none" aria-hidden>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" stroke={color} strokeWidth="1.8" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ size = 22, color = "currentColor", style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={base(size, style)} fill="none" aria-hidden>
      <path
        d="m5 12.5 4.2 4.2L19 7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SparkIcon({ size = 18, color = "currentColor", style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={base(size, style)} fill={color} aria-hidden>
      <path d="M12 2.5 14 9l6.5 2-6.5 2L12 19.5 10 13l-6.5-2L10 9 12 2.5Z" />
    </svg>
  );
}
