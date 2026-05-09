import { useThemeStore } from "@/store/themeStore";
import type { ThemeTokens } from "@/theme/tokens";

/**
 * Returns the active ThemeTokens from the centralized ThemeStore.
 * All 33 screens use this hook — changing the store theme updates every
 * screen automatically with zero per-screen changes.
 *
 * The `creator` overlay boosts text contrast for production work.
 */
export function useColors(): ThemeTokens {
  const { tokens, overlays } = useThemeStore();
  if (overlays.creator) {
    return {
      ...tokens,
      text: tokens.isDark ? "#FFFFFF" : "#000000",
      textSecondary: tokens.isDark ? "#CCCCCC" : "#333333",
      border: tokens.isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
    };
  }
  return tokens;
}
