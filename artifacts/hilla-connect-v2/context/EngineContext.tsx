/**
 * EngineContext — Global UI Engine Pipeline
 *
 * Manages the active visual engine's runtime state:
 *  - Glass   → blur intensity + glass opacity values
 *  - Cinematic → vignette depth + rim-glow colour
 *  - Motion  → Animated parallax offsets (from Accelerometer) + spring config
 *  - Creator → monochrome flag (token changes handled in useColors)
 *
 * Only ONE engine is active at a time (radio-button logic in themeStore).
 * The entire pipeline updates instantly on engine swap — no restart needed.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { Animated, Platform } from "react-native";

import { useThemeStore } from "@/store/themeStore";
import type { OverlayMode } from "@/theme/tokens";

// ─── Spring config exposed to interactive components ─────────────────────────
export interface SpringConfig {
  tension: number;
  friction: number;
  useNativeDriver: boolean;
}

// ─── Context shape ────────────────────────────────────────────────────────────
export interface EngineContextValue {
  activeOverlay: OverlayMode | null;

  // ── Glass Engine ──────────────────────────────────────────────────────────
  /** BlurView intensity (0-100). 0 when Glass engine is off. */
  glassIntensity: number;
  /** Alpha multiplier for glass card surfaces. */
  glassOpacity: number;

  // ── Cinematic Engine ─────────────────────────────────────────────────────
  /** RGBA rim-glow colour for interactive elements (e.g. cards). */
  rimGlow: string;
  /** Vignette opacity 0..1. 0 when Cinematic is off. */
  cinematicVignette: number;

  // ── Motion Engine ────────────────────────────────────────────────────────
  /** Background parallax X offset driven by accelerometer. */
  parallaxX: Animated.Value;
  /** Background parallax Y offset driven by accelerometer. */
  parallaxY: Animated.Value;
  /**
   * Spring config for press interactions.
   * Motion engine uses a tight, bouncy config; others use a neutral config.
   */
  springConfig: SpringConfig;

  // ── Creator Engine ────────────────────────────────────────────────────────
  /** True when Creator engine is active — tokens already overridden in useColors. */
  isCreatorMode: boolean;
}

// ─── Defaults (no engine active) ─────────────────────────────────────────────
const _parallaxX = new Animated.Value(0);
const _parallaxY = new Animated.Value(0);

const NEUTRAL_SPRING: SpringConfig = {
  tension: 120,
  friction: 14,
  useNativeDriver: true,
};
const MOTION_SPRING: SpringConfig = {
  tension: 240,
  friction: 10,
  useNativeDriver: true,
};

const DEFAULT_VALUE: EngineContextValue = {
  activeOverlay: null,
  glassIntensity: 0,
  glassOpacity: 1,
  rimGlow: "transparent",
  cinematicVignette: 0,
  parallaxX: _parallaxX,
  parallaxY: _parallaxY,
  springConfig: NEUTRAL_SPRING,
  isCreatorMode: false,
};

const EngineContext = createContext<EngineContextValue>(DEFAULT_VALUE);

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useEngine(): EngineContextValue {
  return useContext(EngineContext);
}

/**
 * useMotionPress
 *
 * Returns Animated.Value + handlers for a spring press effect.
 * When Motion engine is active the scale animates; otherwise it is a no-op.
 *
 * Usage:
 *   const { scale, onPressIn, onPressOut } = useMotionPress();
 *   <Animated.View style={{ transform: [{ scale }] }}>
 *     <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut} ...>
 */
export function useMotionPress(scaleDown = 0.95) {
  const { activeOverlay, springConfig } = useEngine();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (activeOverlay !== "motion") return;
    Animated.spring(scale, { toValue: scaleDown, ...springConfig }).start();
  };
  const onPressOut = () => {
    if (activeOverlay !== "motion") return;
    Animated.spring(scale, { toValue: 1, ...springConfig }).start();
  };

  return { scale, onPressIn, onPressOut };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function EngineProvider({ children }: { children: React.ReactNode }) {
  const activeOverlay = useThemeStore((s) => s.activeOverlay);
  const tokens = useThemeStore((s) => s.tokens);

  const parallaxX = useRef(new Animated.Value(0)).current;
  const parallaxY = useRef(new Animated.Value(0)).current;

  // ── Motion engine: accelerometer → parallax ─────────────────────────────
  useEffect(() => {
    if (activeOverlay !== "motion" || Platform.OS === "web") {
      // Reset parallax when engine deactivated
      Animated.spring(parallaxX, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }).start();
      Animated.spring(parallaxY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }).start();
      return;
    }

    let subscription: { remove: () => void } | null = null;

    const setupAccelerometer = async () => {
      try {
        const { Accelerometer } = await import("expo-sensors");
        Accelerometer.setUpdateInterval(50); // 20fps — smooth but battery-friendly
        subscription = Accelerometer.addListener(({ x, y }) => {
          Animated.spring(parallaxX, {
            toValue: x * 22,
            tension: 35,
            friction: 7,
            useNativeDriver: true,
          }).start();
          Animated.spring(parallaxY, {
            toValue: -y * 22,
            tension: 35,
            friction: 7,
            useNativeDriver: true,
          }).start();
        });
      } catch {
        // expo-sensors not available (web or simulator) — parallax silently disabled
      }
    };

    setupAccelerometer();

    return () => {
      subscription?.remove();
    };
  }, [activeOverlay]);

  const value = useMemo<EngineContextValue>(() => ({
    activeOverlay,

    // Glass
    glassIntensity: activeOverlay === "glass" ? 65 : 0,
    glassOpacity: activeOverlay === "glass" ? 0.7 : 1,

    // Cinematic
    rimGlow: activeOverlay === "cinematic"
      ? `${tokens.glow}55`
      : "transparent",
    cinematicVignette: activeOverlay === "cinematic" ? 0.72 : 0,

    // Motion
    parallaxX,
    parallaxY,
    springConfig: activeOverlay === "motion" ? MOTION_SPRING : NEUTRAL_SPRING,

    // Creator
    isCreatorMode: activeOverlay === "creator",
  }), [activeOverlay, tokens.glow]);

  return (
    <EngineContext.Provider value={value}>
      {children}
    </EngineContext.Provider>
  );
}
