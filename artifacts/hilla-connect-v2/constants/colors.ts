// ─────────────────────────────────────────────────────────────────────────────
// THEME ENGINE — palette definitions
// ─────────────────────────────────────────────────────────────────────────────
// Every theme MUST expose the exact same set of keys so that any consumer
// doing `Colors[theme].card` keeps working regardless of which theme the user
// picks. New themes can be added at the bottom of the default export — the
// AppContext `THEME_IDS` array auto-derives `ThemeId` from this object's keys.
//
// Visual identities (kept faithful to the brief in the request):
//   light        فاتح          – classic white/black
//   dark         داكن          – classic OLED-friendly dark (default)
//   neon         نيون          – pure black OLED + cyan/pink glow
//   blueOcean    محيط أزرق     – deep navy gradient + icy whites
//   goldLuxury   ذهبي فاخر     – matte black + golden accents
//   purpleNight  ليل بنفسجي    – deep violet + lavender neon
//   redHacker    هاكر أحمر     – terminal black + matrix green + red CTAs
//   cinematic    سينمائي       – film-grade charcoals + warm highlights
//   glass        زجاجي         – translucent surfaces (header/tab use blur)
//   motion       حركي          – dark base tuned for parallax/motion accents
//   creator      مبدع          – ultra-high contrast for media creators
// ─────────────────────────────────────────────────────────────────────────────

const STORY_GRADIENT = ["#fdf497", "#d6249f", "#285AEB"] as const;
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

// Shape that every theme palette must satisfy.
export interface ThemePalette {
  text: string;
  textSecondary: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  card: string;
  border: string;
  tint: string;
  accent: string;
  tabIconDefault: string;
  tabIconSelected: string;
  danger: string;
  success: string;
  warning: string;
  superAdmin: string;
  superAdminGlow: string;
  overlay: string;
  inputBackground: string;
  shadow: string;
}

const themes = {
  // ── CLASSIC ────────────────────────────────────────────────────────────────
  light: {
    text: "#0F0F0F",
    textSecondary: "#6B7280",
    background: "#FFFFFF",
    backgroundSecondary: "#F5F5F5",
    backgroundTertiary: "#EFEFEF",
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

  // ── NEON ───────────────────────────────────────────────────────────────────
  neon: {
    text: "#E0F7FF",
    textSecondary: "#7AB7C9",
    background: "#000000",
    backgroundSecondary: "#050008",
    backgroundTertiary: "#0A0014",
    card: "#08020E",
    border: "#1A0033",
    tint: "#00E5FF",
    accent: "#FF00C8",
    tabIconDefault: "#3A2A55",
    tabIconSelected: "#00E5FF",
    danger: "#FF1744",
    success: "#00E676",
    warning: "#FFEA00",
    superAdmin: "#FFD600",
    superAdminGlow: "rgba(255,214,0,0.4)",
    overlay: "rgba(0,0,0,0.85)",
    inputBackground: "#0A0014",
    shadow: "rgba(0,229,255,0.35)",
  },

  // ── BLUE OCEAN ─────────────────────────────────────────────────────────────
  blueOcean: {
    text: "#EAF6FF",
    textSecondary: "#9DC4E0",
    background: "#020A1A",
    backgroundSecondary: "#06142E",
    backgroundTertiary: "#0A1F44",
    card: "#0B1E3A",
    border: "#173A66",
    tint: "#7CC6FF",
    accent: "#3D91F4",
    tabIconDefault: "#4F7AA8",
    tabIconSelected: "#9FD3FF",
    danger: "#FF5577",
    success: "#3DDC97",
    warning: "#FFC857",
    superAdmin: GOLD,
    superAdminGlow: "rgba(255,215,0,0.25)",
    overlay: "rgba(2,10,26,0.78)",
    inputBackground: "#0A1B36",
    shadow: "rgba(7,30,70,0.55)",
  },

  // ── GOLD LUXURY ────────────────────────────────────────────────────────────
  goldLuxury: {
    text: "#F4E5BF",
    textSecondary: "#A8895A",
    background: "#0A0805",
    backgroundSecondary: "#13100A",
    backgroundTertiary: "#1B1610",
    card: "#13100A",
    border: "#3A2E15",
    tint: "#FFD86B",
    accent: "#D4AF37",
    tabIconDefault: "#6B5A30",
    tabIconSelected: "#FFD86B",
    danger: "#E5524A",
    success: "#9CCB52",
    warning: "#FFC857",
    superAdmin: "#FFD86B",
    superAdminGlow: "rgba(255,216,107,0.35)",
    overlay: "rgba(10,8,5,0.8)",
    inputBackground: "#1B1610",
    shadow: "rgba(212,175,55,0.25)",
  },

  // ── PURPLE NIGHT ───────────────────────────────────────────────────────────
  purpleNight: {
    text: "#F0E8FF",
    textSecondary: "#A593C8",
    background: "#0A0418",
    backgroundSecondary: "#140828",
    backgroundTertiary: "#1F0F38",
    card: "#170A2C",
    border: "#3A1E66",
    tint: "#C9A8FF",
    accent: "#A855F7",
    tabIconDefault: "#5C3F87",
    tabIconSelected: "#D8B4FE",
    danger: "#FF5577",
    success: "#3DDC97",
    warning: "#FFC857",
    superAdmin: "#FFD86B",
    superAdminGlow: "rgba(168,85,247,0.4)",
    overlay: "rgba(10,4,24,0.82)",
    inputBackground: "#1F0F38",
    shadow: "rgba(168,85,247,0.35)",
  },

  // ── RED HACKER ─────────────────────────────────────────────────────────────
  redHacker: {
    text: "#33FF66",
    textSecondary: "#1E8C3D",
    background: "#000000",
    backgroundSecondary: "#050505",
    backgroundTertiary: "#0A0A0A",
    card: "#070707",
    border: "#1A2A1A",
    tint: "#33FF66",
    accent: "#FF1744",
    tabIconDefault: "#1E5C2E",
    tabIconSelected: "#33FF66",
    danger: "#FF1744",
    success: "#33FF66",
    warning: "#FFEA00",
    superAdmin: "#FF1744",
    superAdminGlow: "rgba(255,23,68,0.4)",
    overlay: "rgba(0,0,0,0.88)",
    inputBackground: "#0A0A0A",
    shadow: "rgba(255,23,68,0.3)",
  },

  // ── CINEMATIC ──────────────────────────────────────────────────────────────
  cinematic: {
    text: "#F5F0E6",
    textSecondary: "#9A938A",
    background: "#08080A",
    backgroundSecondary: "#101013",
    backgroundTertiary: "#18181C",
    card: "#101013",
    border: "#26262C",
    tint: "#E8C77B",
    accent: "#E8C77B",
    tabIconDefault: "#5A554E",
    tabIconSelected: "#F5F0E6",
    danger: DANGER,
    success: SUCCESS,
    warning: WARNING,
    superAdmin: GOLD,
    superAdminGlow: "rgba(232,199,123,0.3)",
    overlay: "rgba(8,8,10,0.88)",
    inputBackground: "#18181C",
    shadow: "rgba(0,0,0,0.7)",
  },

  // ── GLASS ──────────────────────────────────────────────────────────────────
  // Translucent base. Header/Tab bar should layer BlurView on top — surface
  // colors here ship with alpha so they look right whether or not BlurView is
  // active (e.g. on web fallback).
  glass: {
    text: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.65)",
    background: "#0B0B12",
    backgroundSecondary: "rgba(255,255,255,0.06)",
    backgroundTertiary: "rgba(255,255,255,0.10)",
    card: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.18)",
    tint: "#FFFFFF",
    accent: "#7DD3FC",
    tabIconDefault: "rgba(255,255,255,0.45)",
    tabIconSelected: "#FFFFFF",
    danger: DANGER,
    success: SUCCESS,
    warning: WARNING,
    superAdmin: GOLD,
    superAdminGlow: "rgba(255,215,0,0.25)",
    overlay: "rgba(11,11,18,0.55)",
    inputBackground: "rgba(255,255,255,0.08)",
    shadow: "rgba(0,0,0,0.45)",
  },

  // ── MOTION ─────────────────────────────────────────────────────────────────
  motion: {
    text: "#FFFFFF",
    textSecondary: "#9AA0AB",
    background: "#06070B",
    backgroundSecondary: "#0E1118",
    backgroundTertiary: "#161A24",
    card: "#0E1118",
    border: "#222838",
    tint: "#FFFFFF",
    accent: "#22D3EE",
    tabIconDefault: "#5A6175",
    tabIconSelected: "#22D3EE",
    danger: DANGER,
    success: SUCCESS,
    warning: WARNING,
    superAdmin: GOLD,
    superAdminGlow: "rgba(255,215,0,0.25)",
    overlay: "rgba(6,7,11,0.78)",
    inputBackground: "#161A24",
    shadow: "rgba(34,211,238,0.25)",
  },

  // ── CREATOR ────────────────────────────────────────────────────────────────
  // High contrast for content creators — minimal chrome, max focus on media.
  creator: {
    text: "#FFFFFF",
    textSecondary: "#C4C4C4",
    background: "#000000",
    backgroundSecondary: "#0A0A0A",
    backgroundTertiary: "#141414",
    card: "#0A0A0A",
    border: "#2E2E2E",
    tint: "#FFFFFF",
    accent: "#FF2E63",
    tabIconDefault: "#7A7A7A",
    tabIconSelected: "#FFFFFF",
    danger: DANGER,
    success: SUCCESS,
    warning: WARNING,
    superAdmin: GOLD,
    superAdminGlow: "rgba(255,215,0,0.25)",
    overlay: "rgba(0,0,0,0.82)",
    inputBackground: "#141414",
    shadow: "rgba(0,0,0,0.6)",
  },
} satisfies Record<string, ThemePalette>;

export type ThemeId = keyof typeof themes;

// Arabic display names for the picker UI.
export const THEME_LABELS_AR: Record<ThemeId, string> = {
  light: "فاتح",
  dark: "داكن",
  neon: "نيون",
  blueOcean: "محيط أزرق",
  goldLuxury: "ذهبي فاخر",
  purpleNight: "ليل بنفسجي",
  redHacker: "هاكر أحمر",
  cinematic: "سينمائي",
  glass: "زجاجي",
  motion: "حركي",
  creator: "مبدع",
};

// Short one-line descriptions shown under each picker card.
export const THEME_DESCRIPTIONS_AR: Record<ThemeId, string> = {
  light: "خلفية بيضاء كلاسيكية",
  dark: "خلفية سوداء OLED",
  neon: "أسود حاد مع توهج سماوي ووردي",
  blueOcean: "تدرجات بحرية عميقة",
  goldLuxury: "أسود مطفي مع لمسات ذهبية",
  purpleNight: "ليل بنفسجي مع نيون لافندر",
  redHacker: "وضع المطوّر بنصوص خضراء",
  cinematic: "ظلال عميقة بأسلوب سينمائي",
  glass: "أسطح زجاجية شفافة",
  motion: "ألوان مهيأة للحركة والتفاعل",
  creator: "تباين عالٍ لصنّاع المحتوى",
};

// Icons (Feather) per theme — used in the picker card header.
export const THEME_ICONS: Record<ThemeId, string> = {
  light: "sun",
  dark: "moon",
  neon: "zap",
  blueOcean: "droplet",
  goldLuxury: "award",
  purpleNight: "star",
  redHacker: "terminal",
  cinematic: "film",
  glass: "layers",
  motion: "wind",
  creator: "camera",
};

// Ordered list used to render the picker grid.
export const THEME_IDS: ThemeId[] = [
  "light",
  "dark",
  "neon",
  "blueOcean",
  "goldLuxury",
  "purpleNight",
  "redHacker",
  "cinematic",
  "glass",
  "motion",
  "creator",
];

export default themes;
