import { useThemeStore } from "@/store/themeStore";
import type { ThemeTokens } from "@/theme/tokens";

export interface ExtendedTokens extends ThemeTokens {
  /**
   * True when the Glass overlay is active.
   * Screens/components that want glassmorphism should conditionally render
   * expo-blur <BlurView> instead of plain <View> for card surfaces.
   */
  isGlassMode: boolean;
  /**
   * Card background to use when isGlassMode = true.
   * For dark themes this is a translucent white; for light themes a
   * translucent white with higher opacity.
   */
  glassCard: string;
  /**
   * Border color to use when isGlassMode = true.
   */
  glassBorder: string;
  /**
   * Blur tint: "dark" | "light" — passed directly to BlurView's tint prop.
   */
  glassTint: "dark" | "light" | "default";
}

/**
 * Returns the active ThemeTokens from the centralized ThemeStore.
 * Applies overlay modifiers:
 *  - creator  → boosted text contrast for production work
 *  - glass    → glassmorphism tokens (use isGlassMode to switch to BlurView)
 *  - cinematic→ slightly deeper overlay/shadow values
 */
export function useColors(): ExtendedTokens {
  const { tokens, overlays } = useThemeStore();

  let base: ThemeTokens = tokens;

  // ── creator overlay ──────────────────────────────────────────────────────
  if (overlays.creator) {
    base = {
      ...base,
      text: base.isDark ? "#FFFFFF" : "#000000",
      textSecondary: base.isDark ? "#CCCCCC" : "#333333",
      border: base.isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
    };
  }

  // ── cinematic overlay ────────────────────────────────────────────────────
  if (overlays.cinematic) {
    base = {
      ...base,
      overlay: base.isDark ? "rgba(0,0,0,0.92)" : "rgba(0,0,0,0.6)",
      shadow: base.isDark
        ? `${base.glow}33`
        : "rgba(0,0,0,0.35)",
    };
  }

  // ── glass overlay ────────────────────────────────────────────────────────
  const isGlassMode = overlays.glass;
  const glassCard = base.isDark
    ? "rgba(255,255,255,0.07)"
    : "rgba(255,255,255,0.72)";
  const glassBorder = base.isDark
    ? "rgba(255,255,255,0.16)"
    : "rgba(255,255,255,0.5)";
  const glassTint: "dark" | "light" = base.isDark ? "dark" : "light";

  // When glass is active, swap card + border so non-blur-aware components
  // at least look translucent even without a BlurView.
  const finalBase: ThemeTokens = isGlassMode
    ? { ...base, card: glassCard, border: glassBorder }
    : base;

  return {
    ...finalBase,
    isGlassMode,
    glassCard,
    glassBorder,
    glassTint,
  };
}
