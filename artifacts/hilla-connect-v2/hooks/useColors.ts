import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

/**
 * Returns the design tokens for the currently active theme.
 *
 * The active theme is sourced from the central `AppContext` (which
 * persists the user's choice in AsyncStorage), so this hook stays in sync
 * with the in-app ThemePicker — it does NOT fall back to the device's
 * system color scheme.
 */
export function useColors() {
  const { theme } = useApp();
  // Fallback to "dark" if a stored theme id ever falls outside the current
  // palette set (e.g. a palette was renamed/removed across versions).
  return Colors[theme] ?? Colors.dark;
}
