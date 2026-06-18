import { createTheme, type MantineColorsTuple } from "@mantine/core";

/**
 * ВТБ-derived brand theme.
 *
 * The identity is built on two blues from the ВТБ rebrand: a deep royal/navy
 * "ВТБ синий" for trust and surfaces-of-emphasis, and a bright azure ("крыло"/
 * horizon accent) for highlights and progress. Everything stays calm, flat and
 * high-contrast — the brand is "строгий, внушающий доверие".
 */

// Deep royal blue — primary actions, the brand voice.
const vtb: MantineColorsTuple = [
  "#eaf0ff",
  "#d3e0ff",
  "#a6bdff",
  "#7798ff",
  "#5179fb",
  "#3a66f8",
  "#1f54e6", // 6 — primary filled
  "#1444c4",
  "#0f399f",
  "#0a2d80",
];

// Bright azure — the "wing"/horizon accent, progress and success-of-motion.
const azure: MantineColorsTuple = [
  "#e2f7ff",
  "#c5ecff",
  "#8ad8ff",
  "#4ac4ff",
  "#1cb3f7",
  "#03a6e8", // 5 ≈ ВТБ небесно-голубой
  "#0098d8",
  "#0079ad",
  "#006490",
  "#004d70",
];

export const theme = createTheme({
  primaryColor: "vtb",
  primaryShade: { light: 6, dark: 5 },
  colors: { vtb, azure },
  defaultRadius: "md",
  white: "#ffffff",
  black: "#0b1733",
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  headings: {
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight: "700",
    sizes: {
      h1: { fontSize: "2rem", lineHeight: "1.15" },
      h2: { fontSize: "1.6rem", lineHeight: "1.2" },
      h3: { fontSize: "1.3rem", lineHeight: "1.25" },
      h4: { fontSize: "1.08rem", lineHeight: "1.3" },
    },
  },
  radius: {
    xs: "6px",
    sm: "10px",
    md: "14px",
    lg: "20px",
    xl: "28px",
  },
  shadows: {
    sm: "0 1px 2px rgba(10, 45, 128, 0.06), 0 4px 14px rgba(10, 45, 128, 0.06)",
    md: "0 6px 24px rgba(10, 45, 128, 0.10)",
    lg: "0 18px 50px rgba(10, 45, 128, 0.16)",
  },
  components: {
    Button: {
      defaultProps: { radius: "md" },
      styles: { root: { fontWeight: 600 } },
    },
    Card: {
      defaultProps: { radius: "lg", shadow: "sm" },
    },
    Paper: {
      defaultProps: { radius: "lg" },
    },
    Badge: {
      defaultProps: { radius: "sm" },
      styles: { root: { fontWeight: 600, textTransform: "none" } },
    },
    TextInput: { defaultProps: { radius: "md", size: "md" } },
    PasswordInput: { defaultProps: { radius: "md", size: "md" } },
    NumberInput: { defaultProps: { radius: "md" } },
  },
});
