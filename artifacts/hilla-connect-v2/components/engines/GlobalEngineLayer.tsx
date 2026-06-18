/**
 * GlobalEngineLayer
 *
 * Renders the engine's VISUAL layer as an absolute-fill overlay on top of the
 * entire app root. This is purely presentational — it does NOT capture pointer
 * events (pointerEvents="none") so the UI below remains fully interactive.
 *
 * Engine → Layer mapping
 *  Glass     → subtle full-screen BlurView (cards handle their own deeper blur)
 *  Cinematic → four-sided vignette gradient creating the "dark-cinema" frame
 *  Motion    → gyroscope-driven parallax gradient background (behind content)
 *  Creator   → no layer (pure token override in useColors)
 *  null      → renders nothing
 */
import React from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useThemeStore } from "@/store/themeStore";
import { useEngine } from "@/context/EngineContext";

// ─── Glass Engine Layer ───────────────────────────────────────────────────────
function GlassLayer() {
  const { tokens } = useThemeStore.getState
    ? { tokens: useThemeStore((s) => s.tokens) }
    : { tokens: useThemeStore.getState().tokens };

  const tint = tokens.isDark ? "dark" : "light";

  // Native: expo-blur; web: semi-transparent colour overlay
  if (Platform.OS !== "web") {
    try {
      const { BlurView } = require("expo-blur");
      return (
        <BlurView
          intensity={10}
          tint={tint}
          style={[StyleSheet.absoluteFill, styles.engineLayer]}
          pointerEvents="none"
        />
      );
    } catch { /* fall through to web fallback */ }
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.engineLayer,
        { backgroundColor: tokens.isDark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.22)" },
      ]}
      pointerEvents="none"
    />
  );
}

// ─── Cinematic Engine Layer ───────────────────────────────────────────────────
function CinematicLayer() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.engineLayer]} pointerEvents="none">
      {/* Top vignette */}
      <LinearGradient
        colors={["rgba(0,0,0,0.72)", "rgba(0,0,0,0.0)"]}
        style={styles.vignetteTop}
      />
      {/* Bottom vignette */}
      <LinearGradient
        colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.72)"]}
        style={styles.vignetteBottom}
      />
      {/* Left vignette */}
      <LinearGradient
        colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.0)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.vignetteLeft}
      />
      {/* Right vignette */}
      <LinearGradient
        colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.45)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.vignetteRight}
      />
    </View>
  );
}

// ─── Motion Engine Layer ─────────────────────────────────────────────────────
function MotionLayer() {
  const { parallaxX, parallaxY } = useEngine();
  const tokens = useThemeStore((s) => s.tokens);

  return (
    <Animated.View
      style={[
        styles.motionBase,
        {
          transform: [
            { translateX: parallaxX },
            { translateY: parallaxY },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[
          tokens.gradientStart + "30",
          tokens.glow + "18",
          "transparent",
          tokens.gradientEnd + "14",
        ]}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────
export function GlobalEngineLayer() {
  const activeOverlay = useThemeStore((s) => s.activeOverlay);

  if (!activeOverlay) return null;

  if (activeOverlay === "glass") return <GlassLayer />;
  if (activeOverlay === "cinematic") return <CinematicLayer />;
  if (activeOverlay === "motion") return <MotionLayer />;

  // creator → pure token change in useColors; no visual overlay needed
  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  engineLayer: {
    zIndex: 9998,
  },

  // Vignette slices
  vignetteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "28%",
  },
  vignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "28%",
  },
  vignetteLeft: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "18%",
  },
  vignetteRight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "18%",
  },

  // Motion parallax: oversized so it never reveals a hard edge when tilting
  motionBase: {
    position: "absolute",
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
    zIndex: -1,
  },
});
