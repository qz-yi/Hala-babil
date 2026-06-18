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
    textSecondary: "rgba(255,255,255,0.55)",
    border: "rgba(0,255,136,0.18)",
    tint: "#00FF88",
    accent: "#00FF88",
    inputBackground: "#0A0A0A",
    overlay: "rgba(0,0,0,0.88)",
    shadow: "rgba(0,255,136,0.2)",
    tabIconDefault: "rgba(255,255,255,0.35)",
    tabIconSelected: "#00FF88",
    glow: "#00FF88",
    glowSoft: "rgba(0,255,136,0.12)",
    gradientStart: "#00FF88",
    gradientEnd: "#00CC6A",
    radius: 12,
    animationDuration: 160,
    iconWeight: "regular",
  },

  blueOcean: {
    ...SHARED,
    name: "blueOcean",
    displayName: "Blue Ocean",
    isDark: true,
    background: "#020D1F",
    backgroundSecondary: "#061428",
    backgroundTertiary: "#0A1C34",
    card: "#0D2040",
    text: "#E8F4FF",
    textSecondary: "rgba(232,244,255,0.55)",
    border: "rgba(56,189,248,0.2)",
    tint: "#38BDF8",
    accent: "#38BDF8",
    inputBackground: "#061428",
    overlay: "rgba(2,13,31,0.9)",
    shadow: "rgba(56,189,248,0.2)",
    tabIconDefault: "rgba(232,244,255,0.3)",
    tabIconSelected: "#38BDF8",
    glow: "#38BDF8",
    glowSoft: "rgba(56,189,248,0.1)",
    gradientStart: "#38BDF8",
    gradientEnd: "#0284C7",
    radius: 18,
    animationDuration: 240,
    iconWeight: "regular",
  },

  goldLuxury: {
    ...SHARED,
    name: "goldLuxury",
    displayName: "Gold Luxury",
    isDark: true,
    background: "#0C0A06",
    backgroundSecondary: "#141008",
    backgroundTertiary: "#1C160A",
    card: "#1A1408",
    text: "#F5E6C8",
    textSecondary: "rgba(245,230,200,0.5)",
    border: "rgba(212,175,55,0.22)",
    tint: "#D4AF37",
    accent: "#D4AF37",
    inputBackground: "#141008",
    overlay: "rgba(12,10,6,0.92)",
    shadow: "rgba(212,175,55,0.18)",
    tabIconDefault: "rgba(245,230,200,0.3)",
    tabIconSelected: "#D4AF37",
    glow: "#D4AF37",
    glowSoft: "rgba(212,175,55,0.1)",
    gradientStart: "#D4AF37",
    gradientEnd: "#9A7D1F",
    radius: 16,
    animationDuration: 280,
    iconWeight: "light",
  },

  purpleNight: {
    ...SHARED,
    name: "purpleNight",
    displayName: "Purple Night",
    isDark: true,
    background: "#0A0614",
    backgroundSecondary: "#100820",
    backgroundTertiary: "#160C2A",
    card: "#160C2A",
    text: "#EDE8FF",
    textSecondary: "rgba(237,232,255,0.52)",
    border: "rgba(167,139,250,0.2)",
    tint: "#A78BFA",
    accent: "#A78BFA",
    inputBackground: "#100820",
    overlay: "rgba(10,6,20,0.9)",
    shadow: "rgba(167,139,250,0.2)",
    tabIconDefault: "rgba(237,232,255,0.3)",
    tabIconSelected: "#A78BFA",
    glow: "#A78BFA",
    glowSoft: "rgba(167,139,250,0.1)",
    gradientStart: "#A78BFA",
    gradientEnd: "#7C3AED",
    radius: 20,
    animationDuration: 260,
    iconWeight: "regular",
  },

  redHacker: {
    ...SHARED,
    name: "redHacker",
    displayName: "Red Hacker",
    isDark: true,
    background: "#000000",
    backgroundSecondary: "#060000",
    backgroundTertiary: "#0D0000",
    card: "#0A0000",
    text: "#FF3333",
    textSecondary: "rgba(255,51,51,0.55)",
    border: "rgba(255,0,0,0.22)",
    tint: "#FF0000",
    accent: "#FF0000",
    inputBackground: "#060000",
    overlay: "rgba(0,0,0,0.95)",
    shadow: "rgba(255,0,0,0.2)",
    tabIconDefault: "rgba(255,51,51,0.35)",
    tabIconSelected: "#FF0000",
    glow: "#FF0000",
    glowSoft: "rgba(255,0,0,0.1)",
    gradientStart: "#FF0000",
    gradientEnd: "#8B0000",
    radius: 0,
    animationDuration: 80,
    iconWeight: "bold",
    fontFamily: "monospace",
  },

  classicDark: {
    ...SHARED,
    name: "classicDark",
    displayName: "Classic Dark",
    isDark: true,
    background: "#000000",
    backgroundSecondary: "#0A0A0A",
    backgroundTertiary: "#111111",
    card: "#111111",
    text: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.55)",
    border: "rgba(255,255,255,0.1)",
    tint: "#FFFFFF",
    accent: "#8B5CF6",
    inputBackground: "#0A0A0A",
    overlay: "rgba(0,0,0,0.88)",
    shadow: "rgba(0,0,0,0.4)",
    tabIconDefault: "rgba(255,255,255,0.35)",
    tabIconSelected: "#8B5CF6",
    glow: "#8B5CF6",
    glowSoft: "rgba(139,92,246,0.12)",
    gradientStart: "#8B5CF6",
    gradientEnd: "#6D28D9",
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
    backgroundTertiary: "#EBEBEB",
    card: "#FFFFFF",
    text: "#000000",
    textSecondary: "rgba(0,0,0,0.5)",
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
  { label: string; icon: string; description: string; longDescription: string; emoji: string }
> = {
  glass: {
    label: "Glass",
    icon: "aperture",
    emoji: "🪟",
    description: "Frosted glass surfaces",
    longDescription: "Replaces all solid backgrounds with dynamic frosted-glass layers. Cards, modals, and nav bars get backdrop blur + light-refraction shading.",
  },
  cinematic: {
    label: "Cinematic",
    icon: "film",
    emoji: "🎬",
    description: "Deep-focus dark cinema",
    longDescription: "Dark-Cinema experience with extreme depth-of-field. Background elements blur as you scroll. Soft rim lighting emphasises every interactive component.",
  },
  motion: {
    label: "Motion",
    icon: "zap",
    emoji: "🌀",
    description: "Spring physics + parallax",
    longDescription: "Every interaction triggers spring physics. The background layer moves with your device's gyroscope creating a living parallax depth effect.",
  },
  creator: {
    label: "Creator",
    icon: "edit-3",
    emoji: "⬛",
    description: "Pro-Studio monochrome workspace",
    longDescription: "Full UI strip-down. Deep-Obsidian black + Pure White only. Ultra-thin geometric lines. Zero borders or shadows — pure typography and data.",
  },
};
