import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";

import { useThemeStore } from "@/store/themeStore";
import { useColors } from "@/hooks/useColors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  borderRadius?: number;
}

/**
 * A context-aware card that renders as a frosted-glass BlurView when the
 * "glass" overlay is active, and as a standard View otherwise.
 */
export function GlassCard({
  children,
  style,
  intensity = 60,
  borderRadius = 20,
}: GlassCardProps) {
  const { overlays } = useThemeStore();
  const colors = useColors();

  if (overlays.glass && Platform.OS !== "web") {
    return (
      <BlurView
        intensity={intensity}
        tint={colors.isDark ? "dark" : "light"}
        style={[
          st.base,
          {
            borderRadius,
            borderColor: colors.border,
            borderWidth: 0.6,
            overflow: "hidden",
          },
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        st.base,
        {
          borderRadius,
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 0.5,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const st = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
