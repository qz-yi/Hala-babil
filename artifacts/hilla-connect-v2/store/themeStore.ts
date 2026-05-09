import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { THEMES, ThemeName, OverlayMode, ThemeTokens } from "@/theme/tokens";

export interface ThemeState {
  activeTheme: ThemeName;
  overlays: Record<OverlayMode, boolean>;
  tokens: ThemeTokens;

  setTheme: (name: ThemeName) => void;
  toggleOverlay: (mode: OverlayMode) => void;
  isOverlayActive: (mode: OverlayMode) => boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      activeTheme: "classicDark",
      overlays: {
        glass: false,
        cinematic: false,
        motion: false,
        creator: false,
      },
      tokens: THEMES["classicDark"],

      setTheme: (name) => {
        set({ activeTheme: name, tokens: THEMES[name] });
      },

      toggleOverlay: (mode) => {
        const current = get().overlays;
        set({ overlays: { ...current, [mode]: !current[mode] } });
      },

      isOverlayActive: (mode) => get().overlays[mode],
    }),
    {
      name: "zentram-theme-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.tokens = THEMES[state.activeTheme];
        }
      },
    }
  )
);

export function getTokens(): ThemeTokens {
  return useThemeStore.getState().tokens;
}
