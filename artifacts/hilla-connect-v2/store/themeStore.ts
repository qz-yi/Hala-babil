import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { THEMES, ThemeName, OverlayMode, ThemeTokens } from "@/theme/tokens";

export interface ThemeState {
  activeTheme: ThemeName;
  /** Radio-button: only ONE engine can run at a time. null = all off. */
  activeOverlay: OverlayMode | null;
  tokens: ThemeTokens;

  setTheme: (name: ThemeName) => void;
  /** Activates an engine. Calling with the same engine that's already active
   *  turns it OFF (toggle-off). Calling with a different engine switches to it
   *  instantly, deactivating the previous one. */
  setOverlay: (mode: OverlayMode | null) => void;
  isOverlayActive: (mode: OverlayMode) => boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      activeTheme: "classicDark",
      activeOverlay: null,
      tokens: THEMES["classicDark"],

      setTheme: (name) => {
        set({ activeTheme: name, tokens: THEMES[name] });
      },

      setOverlay: (mode) => {
        const current = get().activeOverlay;
        // Toggle-off if same engine tapped again, otherwise switch to new engine
        set({ activeOverlay: current === mode ? null : mode });
      },

      isOverlayActive: (mode) => get().activeOverlay === mode,
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
