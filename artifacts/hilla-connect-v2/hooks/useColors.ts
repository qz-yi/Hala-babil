import { useThemeStore } from "@/store/themeStore";
import type { ThemeTokens } from "@/theme/tokens";

export interface ExtendedTokens extends ThemeTokens {
  /**
   * True when the Glass engine is active.
   * Render expo-blur <BlurView> for card surfaces instead of plain <View>.
   */
  isGlassMode: boolean;
  /** Card background for glass surfaces (translucent). */
  glassCard: string;
  /** Border colour for glass surfaces. */
  glassBorder: string;
  /** BlurView tint: "dark" | "light" — pass directly to BlurView.tint. */
  glassTint: "dark" | "light" | "default";
}

/**
 * useColors()
 *
 * Returns the active ThemeTokens from the ThemeStore, with engine-specific
 * overrides applied in this priority order:
 *
 *   1. Creator engine  → full monochromatic palette override (Obsidian + White)
 *   2. Cinematic engine → deep-dark focus tokens
 *   3. Glass engine    → translucent card + border tokens
 *   4. Motion engine   → no token changes (physics handled in EngineContext)
 */
export function useColors(): ExtendedTokens {
  const tokens = useThemeStore((s) => s.tokens);
  const activeOverlay = useThemeStore((s) => s.activeOverlay);

  let base: ThemeTokens = tokens;

  // ── 1. Creator engine: Pro-Studio monochrome override ─────────────────────
  if (activeOverlay === "creator") {
    base = {
      ...base,
      isDark: true,
      background: "#050505",
      backgroundSecondary: "#0A0A0A",
      backgroundTertiary: "#0F0F0F",
      card: "#0F0F0F",
      text: "#FFFFFF",
      textSecondary: "#5A5A5A",
      border: "rgba(255,255,255,0.08)",
      tint: "#FFFFFF",
      accent: "#FFFFFF",
      glow: "#FFFFFF",
      glowSoft: "rgba(255,255,255,0.05)",
      gradientStart: "#1C1C1C",
      gradientEnd: "#050505",
      tabIconDefault: "#2E2E2E",
      tabIconSelected: "#FFFFFF",
      inputBackground: "#0A0A0A",
      shadow: "rgba(255,255,255,0.04)",
      overlay: "rgba(0,0,0,0.96)",
      // Geometry: ultra-sharp with hairline borders
      radius: 0,
      animationDuration: 80,
      iconWeight: "light",
    };
  }

  // ── 2. Cinematic engine: Deep-Focus dark-cinema tokens ────────────────────
  if (activeOverlay === "cinematic") {
    base = {
      ...base,
      isDark: true,
      background: "#000000",
      backgroundSecondary: "#030303",
      backgroundTertiary: "#070707",
      card: "#080808",
      text: "#F0F0F0",
      textSecondary: "rgba(240,240,240,0.45)",
      border: `${base.glow}22`,
      overlay: "rgba(0,0,0,0.94)",
      shadow: `${base.glow}44`,
      // Slow, dramatic animations
      animationDuration: 420,
    };
  }

  // ── 3. Glass engine: translucent surfaces ─────────────────────────────────
  const isGlassMode = activeOverlay === "glass";
  const glassCard = base.isDark
    ? "rgba(255,255,255,0.07)"
    : "rgba(255,255,255,0.75)";
  const glassBorder = base.isDark
    ? "rgba(255,255,255,0.18)"
    : "rgba(255,255,255,0.55)";
  const glassTint: "dark" | "light" = base.isDark ? "dark" : "light";

  const finalBase: ThemeTokens = isGlassMode
    ? {
        ...base,
        card: glassCard,
        border: glassBorder,
        backgroundSecondary: base.isDark
          ? "rgba(255,255,255,0.04)"
          : "rgba(255,255,255,0.65)",
      }
    : base;

  return {
    ...finalBase,
    isGlassMode,
    glassCard,
    glassBorder,
    glassTint,
  };
}
