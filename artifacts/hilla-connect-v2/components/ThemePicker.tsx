import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/themeStore";
import {
  THEME_ORDER,
  THEMES,
  ThemeName,
  OVERLAY_META,
  OverlayMode,
} from "@/theme/tokens";

const THEME_ICONS: Record<ThemeName, string> = {
  neon: "⚡",
  blueOcean: "🌊",
  goldLuxury: "✨",
  purpleNight: "🌙",
  redHacker: "💀",
  classicDark: "🌑",
  classicLight: "☀️",
};

export function ThemePicker() {
  const colors = useColors();
  const { activeTheme, setTheme, overlays, toggleOverlay } = useThemeStore();

  const handleThemeSelect = (name: ThemeName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTheme(name);
  };

  const handleOverlay = (mode: OverlayMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleOverlay(mode);
  };

  return (
    <View>
      {/* Themes */}
      <Text style={[st.sectionTitle, { color: colors.textSecondary }]}>
        THEMES
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={st.themeRow}
      >
        {THEME_ORDER.map((name) => {
          const t = THEMES[name];
          const isActive = activeTheme === name;
          return (
            <TouchableOpacity
              key={name}
              onPress={() => handleThemeSelect(name)}
              activeOpacity={0.8}
              style={[
                st.themeCard,
                {
                  borderColor: isActive ? t.accent : "transparent",
                  borderWidth: isActive ? 2 : 1.5,
                  backgroundColor: t.background,
                },
                isActive && {
                  shadowColor: t.glow,
                  shadowOpacity: 0.7,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 8,
                },
              ]}
            >
              <LinearGradient
                colors={[t.gradientStart, t.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={st.gradientChip}
              />
              <View style={st.themeSwatches}>
                <View style={[st.swatch, { backgroundColor: t.background }]} />
                <View style={[st.swatch, { backgroundColor: t.card }]} />
                <View style={[st.swatch, { backgroundColor: t.accent }]} />
              </View>
              <Text style={[st.themeEmoji]}>{THEME_ICONS[name]}</Text>
              <Text
                style={[
                  st.themeName,
                  {
                    color: isActive ? t.accent : t.text,
                    fontFamily:
                      name === "redHacker" ? "monospace" : "Inter_600SemiBold",
                  },
                ]}
              >
                {t.displayName}
              </Text>
              {isActive && (
                <View style={[st.activeDot, { backgroundColor: t.accent }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Overlays */}
      <Text style={[st.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>
        OVERLAYS
      </Text>

      <View style={st.overlayGrid}>
        {(Object.keys(OVERLAY_META) as OverlayMode[]).map((mode) => {
          const meta = OVERLAY_META[mode];
          const isOn = overlays[mode];
          return (
            <TouchableOpacity
              key={mode}
              onPress={() => handleOverlay(mode)}
              activeOpacity={0.75}
              style={[
                st.overlayCard,
                {
                  backgroundColor: isOn
                    ? colors.glowSoft
                    : colors.backgroundSecondary,
                  borderColor: isOn ? colors.accent : colors.border,
                  borderWidth: isOn ? 1.5 : 0.5,
                },
                isOn && {
                  shadowColor: colors.glow,
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
            >
              <Text style={st.overlayIcon}>
                {mode === "glass"
                  ? "🔲"
                  : mode === "cinematic"
                  ? "🎬"
                  : mode === "motion"
                  ? "⚡"
                  : "🎨"}
              </Text>
              <Text
                style={[
                  st.overlayLabel,
                  { color: isOn ? colors.accent : colors.text },
                ]}
              >
                {meta.label}
              </Text>
              <Text
                style={[st.overlayDesc, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {meta.description}
              </Text>
              <View
                style={[
                  st.overlayToggle,
                  {
                    backgroundColor: isOn ? colors.accent : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    st.overlayThumb,
                    {
                      backgroundColor: "#FFFFFF",
                      transform: [{ translateX: isOn ? 16 : 2 }],
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4,
    marginBottom: 12,
    marginTop: 4,
  },
  themeRow: {
    gap: 12,
    paddingRight: 8,
    paddingBottom: 4,
  },
  themeCard: {
    width: 100,
    borderRadius: 18,
    padding: 12,
    gap: 6,
    alignItems: "flex-start",
    position: "relative",
  },
  gradientChip: {
    width: 36,
    height: 6,
    borderRadius: 3,
  },
  themeSwatches: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  themeEmoji: {
    fontSize: 20,
    marginTop: 4,
  },
  themeName: {
    fontSize: 11,
    marginTop: 2,
  },
  activeDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  overlayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  overlayCard: {
    width: "47%",
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  overlayIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  overlayLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  overlayDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
  },
  overlayToggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    marginTop: 8,
    justifyContent: "center",
  },
  overlayThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: "absolute",
  },
});
