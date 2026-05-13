export type ThemeName =
  | "neon"
  | "blueOcean"
  | "goldLuxury"
  | "purpleNight"
  | "redHacker"
  | "classicDark"
  | "classicLight";

export type OverlayMode = "cinematic" | "glass" | "motion" | "creator";

export interface ThemeTokens {
  name: ThemeName;
  displayName: string;
  isDark: boolean;
  // Base surfaces
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  card: string;
  // Text
  text: string;
  textSecondary: string;
  // Borders & decorations
  border: string;
  tint: string;
  // Interaction
  accent: string;
  inputBackground: string;
  // Status
  danger: string;
  success: string;
  warning: string;
  // Special
  superAdmin: string;
  superAdminGlow: string;
  overlay: string;
  shadow: string;
  // Tab bar
  tabIconDefault: string;
  tabIconSelected: string;
  // Theme-specific visual flourishes
  glow: string;
  glowSoft: string;
  gradientStart: string;
  gradientEnd: string;
  // ── DEEP IMMERSION ──────────────────────────────────────────────────────────
  // Layout: per-theme border radius (0 = sharp, 20 = very rounded)
  radius: number;
  // Animation: transition duration in ms (80 = brutal snappy, 400 = cinematic)
  animationDuration: number;
  // Icons: weight hint for icon sets (light / regular / bold)
  iconWeight: "light" | "regular" | "bold";
  // Font hint (Red Hacker uses monospace terminal font)
  fontFamily?: string;
}

const SHARED = {
  danger: "#FF3B5C",
  success: "#34D399",
  warning: "#FBBF24",
  superAdmin: "#FFD700",
  superAdminGlow: "rgba(255,215,0,0.25)",
  // These are overridden per-theme below for full immersion
  radius: 14,
  animationDuration: 200,
  iconWeight: "regular" as const,
};

export const THEMES: Record<ThemeName, ThemeTokens> = {
  neon: {
    ...SHARED,
    name: "neon",
    displayName: "Neon",
    isDark: true,
    background: "#000000",
    backgroundSecondary: "#080808",
    backgroundTertiary: "#0D0D0D",
    card: "#0C0C0C",
    text: "#FFFFFF",
    textSecondary: "#6EE7B7",
    border: "rgba(0,255,136,0.18)",
    tint: "#00FF88",
    accent: "#00FF88",
    inputBackground: "#0D1A14",
    overlay: "rgba(0,0,0,0.82)",
    shadow: "rgba(0,255,136,0.15)",
    tabIconDefault: "#2D6B50",
    tabIconSelected: "#00FF88",
    glow: "#00FF88",
    glowSoft: "rgba(0,255,136,0.12)",
    gradientStart: "#00FF88",
    gradientEnd: "#00CC6A",
    // Deep immersion
    radius: 8,
    animationDuration: 150,
    iconWeight: "regular",
  },

  blueOcean: {
    ...SHARED,
    name: "blueOcean",
    displayName: "Blue Ocean",
    isDark: true,
    background: "#070D1A",
    backgroundSecondary: "#0C1526",
    backgroundTertiary: "#111D32",
    card: "#0C1526",
    text: "#EAF4FF",
    textSecondary: "#7FA8CC",
    border: "rgba(79,172,254,0.18)",
    tint: "#4FACFE",
    accent: "#4FACFE",
    inputBackground: "#0C1B30",
    overlay: "rgba(7,13,26,0.85)",
    shadow: "rgba(79,172,254,0.15)",
    tabIconDefault: "#2B4E70",
    tabIconSelected: "#4FACFE",
    glow: "#4FACFE",
    glowSoft: "rgba(79,172,254,0.12)",
    gradientStart: "#4FACFE",
    gradientEnd: "#00F2FE",
    // Deep immersion
    radius: 20,
    animationDuration: 400,
    iconWeight: "light",
  },

  goldLuxury: {
    ...SHARED,
    name: "goldLuxury",
    displayName: "Gold Luxury",
    isDark: true,
    background: "#0A0902",
    backgroundSecondary: "#111008",
    backgroundTertiary: "#1A180A",
    card: "#111008",
    text: "#F5E6C8",
    textSecondary: "#A89060",
    border: "rgba(201,168,76,0.22)",
    tint: "#C9A84C",
    accent: "#C9A84C",
    inputBackground: "#18160A",
    overlay: "rgba(10,9,2,0.85)",
    shadow: "rgba(201,168,76,0.18)",
    tabIconDefault: "#5A4820",
    tabIconSelected: "#C9A84C",
    glow: "#FFD700",
    glowSoft: "rgba(255,215,0,0.12)",
    gradientStart: "#C9A84C",
    gradientEnd: "#FFD700",
    superAdmin: "#FFD700",
    superAdminGlow: "rgba(255,215,0,0.35)",
    // Deep immersion
    radius: 14,
    animationDuration: 300,
    iconWeight: "regular",
  },

  purpleNight: {
    ...SHARED,
    name: "purpleNight",
    displayName: "Purple Night",
    isDark: true,
    background: "#08061A",
    backgroundSecondary: "#0E0A26",
    backgroundTertiary: "#150E32",
    card: "#0E0A26",
    text: "#E8E0FF",
    textSecondary: "#9B8CB8",
    border: "rgba(155,89,182,0.22)",
    tint: "#B44FE8",
    accent: "#B44FE8",
    inputBackground: "#130C2E",
    overlay: "rgba(8,6,26,0.85)",
    shadow: "rgba(180,79,232,0.15)",
    tabIconDefault: "#4A3670",
    tabIconSelected: "#B44FE8",
    glow: "#B44FE8",
    glowSoft: "rgba(180,79,232,0.12)",
    gradientStart: "#9B59B6",
    gradientEnd: "#B44FE8",
    // Deep immersion
    radius: 18,
    animationDuration: 250,
    iconWeight: "light",
  },

  redHacker: {
    ...SHARED,
    name: "redHacker",
    displayName: "Red Hacker",
    isDark: true,
    background: "#000000",
    backgroundSecondary: "#0A0000",
    backgroundTertiary: "#100000",
    card: "#0A0000",
    text: "#FF4444",
    textSecondary: "#882222",
    border: "rgba(255,0,0,0.22)",
    tint: "#FF0000",
    accent: "#FF0000",
    inputBackground: "#100000",
    overlay: "rgba(0,0,0,0.88)",
    shadow: "rgba(255,0,0,0.18)",
    tabIconDefault: "#550000",
    tabIconSelected: "#FF0000",
    glow: "#FF0000",
    glowSoft: "rgba(255,0,0,0.12)",
    gradientStart: "#FF0000",
    gradientEnd: "#CC0000",
    danger: "#FF0000",
    fontFamily: "monospace",
    // Deep immersion — sharp 0px edges, brutal speed
    radius: 0,
    animationDuration: 80,
    iconWeight: "bold",
  },

  classicDark: {
    ...SHARED,
    name: "classicDark",
    displayName: "Classic Dark",
    isDark: true,
    background: "#000000",
    backgroundSecondary: "#121212",
    backgroundTertiary: "#1C1C1C",
    card: "#121212",
    text: "#FFFFFF",
    textSecondary: "#8E8E93",
    border: "#262626",
    tint: "#FFFFFF",
    accent: "#3D91F4",
    inputBackground: "#1C1C1C",
    overlay: "rgba(0,0,0,0.75)",
    shadow: "rgba(0,0,0,0.5)",
    tabIconDefault: "#636366",
    tabIconSelected: "#FFFFFF",
    glow: "#3D91F4",
    glowSoft: "rgba(61,145,244,0.12)",
    gradientStart: "#3D91F4",
    gradientEnd: "#1A6CD4",
    // Deep immersion
    radius: 14,
    animationDuration: 200,
    iconWeight: "regular",
  },

  classicLight: {
    ...SHARED,
    name: "classicLight",
    displayName: "Classic Light",
    isDark: false,
    background: "#FFFFFF",
    backgroundSecondary: "#F5F5F5",
    backgroundTertiary: "#EFEFEF",
    card: "#FFFFFF",
    text: "#0F0F0F",
    textSecondary: "#6B7280",
    border: "#E5E5E5",
    tint: "#000000",
    accent: "#3D91F4",
    inputBackground: "#F0F0F0",
    overlay: "rgba(0,0,0,0.5)",
    shadow: "rgba(0,0,0,0.08)",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#000000",
    glow: "#3D91F4",
    glowSoft: "rgba(61,145,244,0.1)",
    gradientStart: "#3D91F4",
    gradientEnd: "#1A6CD4",
    // Deep immersion
    radius: 14,
    animationDuration: 220,
    iconWeight: "regular",
  },
};

export const THEME_ORDER: ThemeName[] = [
  "neon",
  "blueOcean",
  "goldLuxury",
  "purpleNight",
  "redHacker",
  "classicDark",
  "classicLight",
];

export const OVERLAY_META: Record<
  OverlayMode,
  { label: string; icon: string; description: string }
> = {
  glass: {
    label: "Glass",
    icon: "aperture",
    description: "Glassmorphism on cards & modals",
  },
  cinematic: {
    label: "Cinematic",
    icon: "film",
    description: "Blur backgrounds & deep shadows",
  },
  motion: {
    label: "Motion",
    icon: "zap",
    description: "Micro-interactions & parallax",
  },
  creator: {
    label: "Creator",
    icon: "edit-3",
    description: "High-contrast minimal workspace",
  },
};
