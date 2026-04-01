const STORY_GRADIENT = ["#fdf497", "#d6249f", "#285AEB"] as const;
const ACCENT = "#FFFFFF";
const DANGER = "#FF3B5C";
const SUCCESS = "#34D399";
const WARNING = "#FBBF24";
const GOLD = "#FFD700";

export const STORY_GRADIENT_COLORS = STORY_GRADIENT;

export const ACCENT_COLORS = [
  "#E91E8C",
  "#3D91F4",
  "#9B59B6",
  "#00C853",
  "#FF6D00",
  "#FF3B5C",
  "#00BCD4",
];

export default {
  light: {
    text: "#0F0F0F",
    textSecondary: "#6B7280",
    background: "#F8F8F8",
    backgroundSecondary: "#FFFFFF",
    backgroundTertiary: "#F0F0F0",
    card: "#FFFFFF",
    border: "#E5E5E5",
    tint: "#000000",
    accent: "#3D91F4",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#000000",
    danger: DANGER,
    success: SUCCESS,
    warning: WARNING,
    superAdmin: GOLD,
    superAdminGlow: "rgba(255,215,0,0.3)",
    overlay: "rgba(0,0,0,0.5)",
    inputBackground: "#F0F0F0",
    shadow: "rgba(0,0,0,0.08)",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#8E8E93",
    background: "#000000",
    backgroundSecondary: "#121212",
    backgroundTertiary: "#1C1C1C",
    card: "#121212",
    border: "#262626",
    tint: "#FFFFFF",
    accent: "#3D91F4",
    tabIconDefault: "#636366",
    tabIconSelected: "#FFFFFF",
    danger: DANGER,
    success: SUCCESS,
    warning: WARNING,
    superAdmin: GOLD,
    superAdminGlow: "rgba(255,215,0,0.2)",
    overlay: "rgba(0,0,0,0.75)",
    inputBackground: "#1C1C1C",
    shadow: "rgba(0,0,0,0.5)",
  },
};
