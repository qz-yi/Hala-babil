import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/themeStore";
import {
  THEME_ORDER,
  THEMES,
  ThemeName,
  OVERLAY_META,
  OverlayMode,
} from "@/theme/tokens";

const { width: SW } = Dimensions.get("window");
const CARD_W = (SW - 48 - 12) / 2;

const THEME_ICONS: Record<ThemeName, string> = {
  neon: "⚡",
  blueOcean: "🌊",
  goldLuxury: "✨",
  purpleNight: "🌙",
  redHacker: "💀",
  classicDark: "🌑",
  classicLight: "☀️",
};

const OVERLAY_ICONS: Record<OverlayMode, string> = {
  glass: "◻",
  cinematic: "▶",
  motion: "⚡",
  creator: "✏",
};

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <View style={st.sectionRow}>
      <View style={[st.sectionLine, { backgroundColor: colors.border }]} />
      <Text style={[st.sectionLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[st.sectionLine, { backgroundColor: colors.border }]} />
    </View>
  );
}

function ThemeCard({
  name,
  isActive,
  onPress,
}: {
  name: ThemeName;
  isActive: boolean;
  onPress: () => void;
}) {
  const t = THEMES[name];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        st.themeCard,
        { width: CARD_W, backgroundColor: t.background },
        isActive
          ? { borderColor: t.accent, borderWidth: 2 }
          : { borderColor: t.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", borderWidth: 1 },
        isActive && {
          shadowColor: t.glow,
          shadowOpacity: 0.55,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 0 },
          elevation: 10,
        },
      ]}
    >
      {/* Gradient header band */}
      <LinearGradient
        colors={[t.gradientStart, t.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={st.gradientBand}
      />

      {/* Mini mockup */}
      <View style={[st.mockup, { backgroundColor: t.backgroundSecondary }]}>
        {/* Header row */}
        <View style={st.mockupHeader}>
          <View style={[st.mockupDot, { backgroundColor: t.accent }]} />
          <View style={[st.mockupBar, { backgroundColor: t.border, flex: 1 }]} />
        </View>
        {/* Content rows */}
        <View style={[st.mockupRow, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={[st.mockupAvatar, { backgroundColor: t.accent }]} />
          <View style={st.mockupLines}>
            <View style={[st.mockupLine, { backgroundColor: t.text, width: "70%" }]} />
            <View style={[st.mockupLine, { backgroundColor: t.textSecondary, width: "45%" }]} />
          </View>
        </View>
        <View style={[st.mockupRow, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={[st.mockupAvatar, { backgroundColor: t.gradientEnd }]} />
          <View style={st.mockupLines}>
            <View style={[st.mockupLine, { backgroundColor: t.text, width: "55%" }]} />
            <View style={[st.mockupLine, { backgroundColor: t.textSecondary, width: "35%" }]} />
          </View>
        </View>
      </View>

      {/* Colour swatches */}
      <View style={st.swatchRow}>
        <View style={[st.swatch, { backgroundColor: t.background }]} />
        <View style={[st.swatch, { backgroundColor: t.card }]} />
        <View style={[st.swatch, { backgroundColor: t.accent }]} />
        <View style={[st.swatch, { backgroundColor: t.text }]} />
      </View>

      {/* Name + emoji */}
      <View style={st.themeFooter}>
        <Text style={st.themeEmoji}>{THEME_ICONS[name]}</Text>
        <Text
          style={[
            st.themeName,
            {
              color: isActive ? t.accent : t.text,
              fontFamily: name === "redHacker" ? "monospace" : "Inter_600SemiBold",
            },
          ]}
          numberOfLines={1}
        >
          {t.displayName}
        </Text>
      </View>

      {/* Active checkmark */}
      {isActive && (
        <View style={[st.checkBadge, { backgroundColor: t.accent }]}>
          <Feather name="check" size={10} color="#fff" strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function OverlayCard({
  mode,
  isOn,
  onPress,
  colors,
}: {
  mode: OverlayMode;
  isOn: boolean;
  onPress: () => void;
  colors: any;
}) {
  const meta = OVERLAY_META[mode];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        st.overlayCard,
        {
          backgroundColor: isOn ? `${colors.accent}15` : colors.backgroundSecondary,
          borderColor: isOn ? colors.accent : colors.border,
          borderWidth: isOn ? 1.5 : 0.5,
        },
        isOn && {
          shadowColor: colors.glow,
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    >
      {/* Icon circle */}
      <View
        style={[
          st.overlayIconWrap,
          { backgroundColor: isOn ? `${colors.accent}25` : colors.backgroundTertiary },
        ]}
      >
        <Text style={[st.overlayIconText, { color: isOn ? colors.accent : colors.textSecondary }]}>
          {OVERLAY_ICONS[mode]}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[st.overlayLabel, { color: isOn ? colors.accent : colors.text }]}>
          {meta.label}
        </Text>
        <Text style={[st.overlayDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {meta.description}
        </Text>
      </View>

      {/* Toggle pill */}
      <View style={[st.toggleTrack, { backgroundColor: isOn ? colors.accent : colors.border }]}>
        <View style={[st.toggleThumb, { transform: [{ translateX: isOn ? 16 : 2 }] }]} />
      </View>
    </TouchableOpacity>
  );
}

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
    <View style={st.root}>
      {/* ── Themes ── */}
      <SectionLabel label="اختر الثيم" colors={colors} />

      <View style={st.themeGrid}>
        {THEME_ORDER.map((name) => (
          <ThemeCard
            key={name}
            name={name}
            isActive={activeTheme === name}
            onPress={() => handleThemeSelect(name)}
          />
        ))}
      </View>

      {/* ── Active theme info bar ── */}
      <View
        style={[
          st.activeBar,
          {
            backgroundColor: colors.glowSoft,
            borderColor: colors.accent,
          },
        ]}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={st.activeBarAccent}
        />
        <Text style={[st.activeBarText, { color: colors.accent }]}>
          {THEME_ICONS[activeTheme]}{"  "}{THEMES[activeTheme].displayName}
        </Text>
        <Text style={[st.activeBarSub, { color: colors.textSecondary }]}>
          {colors.isDark ? "ثيم داكن" : "ثيم فاتح"}
        </Text>
      </View>

      {/* ── Overlays ── */}
      <SectionLabel label="التأثيرات البصرية" colors={colors} />

      <View style={st.overlayList}>
        {(Object.keys(OVERLAY_META) as OverlayMode[]).map((mode) => (
          <OverlayCard
            key={mode}
            mode={mode}
            isOn={overlays[mode]}
            onPress={() => handleOverlay(mode)}
            colors={colors}
          />
        ))}
      </View>

      {/* bottom breathing room */}
      <View style={{ height: 24 }} />
    </View>
  );
}

const st = StyleSheet.create({
  root: { gap: 14 },

  /* Section divider */
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  sectionLine: { flex: 1, height: 0.5 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  /* Theme grid */
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  themeCard: {
    borderRadius: 20,
    overflow: "hidden",
    gap: 8,
    paddingBottom: 10,
    position: "relative",
  },

  gradientBand: { height: 5, width: "100%" },

  mockup: {
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 8,
    gap: 5,
  },
  mockupHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 },
  mockupDot: { width: 8, height: 8, borderRadius: 4 },
  mockupBar: { height: 4, borderRadius: 2 },
  mockupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 6,
    padding: 5,
    borderWidth: 0.5,
  },
  mockupAvatar: { width: 18, height: 18, borderRadius: 9 },
  mockupLines: { flex: 1, gap: 3 },
  mockupLine: { height: 3, borderRadius: 2 },

  swatchRow: { flexDirection: "row", gap: 4, paddingHorizontal: 10 },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
  },

  themeFooter: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10 },
  themeEmoji: { fontSize: 14 },
  themeName: { fontSize: 11, flexShrink: 1 },

  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Active bar */
  activeBar: {
    borderRadius: 14,
    borderWidth: 0.8,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    position: "relative",
  },
  activeBarAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  activeBarText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  activeBarSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  /* Overlay cards */
  overlayList: { gap: 8 },
  overlayCard: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  overlayIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayIconText: { fontSize: 18 },
  overlayLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  overlayDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
  },
  toggleTrack: {
    width: 38,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    position: "absolute",
  },
});
