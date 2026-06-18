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

// ─── Section divider ──────────────────────────────────────────────────────────
function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <View style={st.sectionRow}>
      <View style={[st.sectionLine, { backgroundColor: colors.border }]} />
      <Text style={[st.sectionLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[st.sectionLine, { backgroundColor: colors.border }]} />
    </View>
  );
}

// ─── Theme card ───────────────────────────────────────────────────────────────
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
      <LinearGradient
        colors={[t.gradientStart, t.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={st.gradientBand}
      />
      <View style={[st.mockup, { backgroundColor: t.backgroundSecondary }]}>
        <View style={st.mockupHeader}>
          <View style={[st.mockupDot, { backgroundColor: t.accent }]} />
          <View style={[st.mockupBar, { backgroundColor: t.border, flex: 1 }]} />
        </View>
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
      <View style={st.swatchRow}>
        <View style={[st.swatch, { backgroundColor: t.background }]} />
        <View style={[st.swatch, { backgroundColor: t.card }]} />
        <View style={[st.swatch, { backgroundColor: t.accent }]} />
        <View style={[st.swatch, { backgroundColor: t.text }]} />
      </View>
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
      {isActive && (
        <View style={[st.checkBadge, { backgroundColor: t.accent }]}>
          <Feather name="check" size={10} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Engine card (radio button) ───────────────────────────────────────────────
function EngineCard({
  mode,
  isActive,
  onPress,
  colors,
}: {
  mode: OverlayMode;
  isActive: boolean;
  onPress: () => void;
  colors: any;
}) {
  const meta = OVERLAY_META[mode];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        st.engineCard,
        {
          backgroundColor: isActive ? `${colors.accent}12` : colors.backgroundSecondary,
          borderColor: isActive ? colors.accent : colors.border,
          borderWidth: isActive ? 1.5 : 0.5,
          borderRadius: colors.radius,
        },
        isActive && {
          shadowColor: colors.glow,
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        },
      ]}
    >
      {/* Emoji icon */}
      <View
        style={[
          st.engineIconWrap,
          {
            backgroundColor: isActive ? `${colors.accent}22` : colors.backgroundTertiary,
            borderRadius: colors.radius > 0 ? colors.radius : 10,
          },
        ]}
      >
        <Text style={st.engineEmoji}>{meta.emoji}</Text>
      </View>

      {/* Text block */}
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[st.engineLabel, { color: isActive ? colors.accent : colors.text }]}>
            {meta.label}
          </Text>
          {/* "ACTIVE" pill */}
          {isActive && (
            <View style={[st.activePill, { backgroundColor: `${colors.accent}22`, borderColor: `${colors.accent}44` }]}>
              <Text style={[st.activePillText, { color: colors.accent }]}>ACTIVE</Text>
            </View>
          )}
        </View>
        <Text style={[st.engineDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {meta.longDescription}
        </Text>
      </View>

      {/* Radio dot */}
      <View
        style={[
          st.radioDot,
          {
            borderColor: isActive ? colors.accent : colors.border,
            backgroundColor: isActive ? colors.accent : "transparent",
          },
        ]}
      >
        {isActive && <View style={st.radioDotInner} />}
      </View>
    </TouchableOpacity>
  );
}

// ─── None / Reset card ────────────────────────────────────────────────────────
function NoneCard({
  isActive,
  onPress,
  colors,
}: {
  isActive: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        st.noneCard,
        {
          backgroundColor: isActive ? `${colors.accent}12` : colors.backgroundSecondary,
          borderColor: isActive ? colors.accent : colors.border,
          borderWidth: isActive ? 1.5 : 0.5,
          borderRadius: colors.radius,
        },
      ]}
    >
      <Text style={[st.noneEmoji]}>✕</Text>
      <Text style={[st.noneLabel, { color: isActive ? colors.accent : colors.textSecondary }]}>
        بدون محرّك
      </Text>
      <View
        style={[
          st.radioDot,
          {
            borderColor: isActive ? colors.accent : colors.border,
            backgroundColor: isActive ? colors.accent : "transparent",
          },
        ]}
      >
        {isActive && <View style={st.radioDotInner} />}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ThemePicker() {
  const colors = useColors();
  const { activeTheme, setTheme, activeOverlay, setOverlay } = useThemeStore();

  const handleThemeSelect = (name: ThemeName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTheme(name);
  };

  const handleEngine = (mode: OverlayMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOverlay(mode); // radio button: toggles off if same
  };

  const handleNone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOverlay(null);
  };

  return (
    <View style={st.root}>
      {/* ── Themes ───────────────────────────────────────────────────────── */}
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

      {/* Active theme info bar */}
      <View
        style={[
          st.activeBar,
          { backgroundColor: colors.glowSoft, borderColor: colors.accent, borderRadius: colors.radius },
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

      {/* ── Visual Engines (radio buttons) ───────────────────────────────── */}
      <SectionLabel label="محرّك المظهر البصري" colors={colors} />

      {/* Explainer note */}
      <View style={[st.infoNote, { backgroundColor: `${colors.accent}0D`, borderColor: `${colors.accent}33`, borderRadius: colors.radius }]}>
        <Feather name="info" size={12} color={colors.textSecondary} />
        <Text style={[st.infoNoteText, { color: colors.textSecondary }]}>
          محرّك واحد فقط يعمل في آن واحد — اختيار محرّك جديد يوقف السابق تلقائياً.
        </Text>
      </View>

      <View style={st.engineList}>
        {/* None option */}
        <NoneCard
          isActive={activeOverlay === null}
          onPress={handleNone}
          colors={colors}
        />

        {/* Engine options */}
        {(Object.keys(OVERLAY_META) as OverlayMode[]).map((mode) => (
          <EngineCard
            key={mode}
            mode={mode}
            isActive={activeOverlay === mode}
            onPress={() => handleEngine(mode)}
            colors={colors}
          />
        ))}
      </View>

      {/* Active engine status pill */}
      {activeOverlay !== null && (
        <View style={[st.engineStatusBar, { backgroundColor: `${colors.glow}15`, borderColor: `${colors.glow}33`, borderRadius: colors.radius }]}>
          <View style={[st.engineStatusDot, { backgroundColor: colors.accent }]} />
          <Text style={[st.engineStatusText, { color: colors.accent }]}>
            {OVERLAY_META[activeOverlay].emoji}{"  "}
            {OVERLAY_META[activeOverlay].label} Engine — نشط
          </Text>
        </View>
      )}

      <View style={{ height: 24 }} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { gap: 14 },

  sectionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  sectionLine: { flex: 1, height: 0.5 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  /* Theme grid */
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  themeCard: { borderRadius: 20, overflow: "hidden", gap: 8, paddingBottom: 10, position: "relative" },
  gradientBand: { height: 5, width: "100%" },
  mockup: { marginHorizontal: 10, borderRadius: 10, padding: 8, gap: 5 },
  mockupHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 },
  mockupDot: { width: 8, height: 8, borderRadius: 4 },
  mockupBar: { height: 4, borderRadius: 2 },
  mockupRow: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 6, padding: 5, borderWidth: 0.5 },
  mockupAvatar: { width: 18, height: 18, borderRadius: 9 },
  mockupLines: { flex: 1, gap: 3 },
  mockupLine: { height: 3, borderRadius: 2 },
  swatchRow: { flexDirection: "row", gap: 4, paddingHorizontal: 10 },
  swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.12)" },
  themeFooter: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10 },
  themeEmoji: { fontSize: 14 },
  themeName: { fontSize: 11, flexShrink: 1 },
  checkBadge: {
    position: "absolute", top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },

  /* Active theme bar */
  activeBar: {
    borderWidth: 0.8, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
    overflow: "hidden", position: "relative",
  },
  activeBarAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  activeBarText: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  activeBarSub: { fontSize: 11, fontFamily: "Inter_400Regular" },

  /* Info note */
  infoNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 7,
    padding: 10, borderWidth: 0.5,
  },
  infoNoteText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },

  /* Engine list (radio buttons) */
  engineList: { gap: 10 },

  engineCard: {
    padding: 14, flexDirection: "row", alignItems: "center", gap: 12,
  },
  engineIconWrap: {
    width: 44, height: 44, alignItems: "center", justifyContent: "center",
  },
  engineEmoji: { fontSize: 20 },
  engineLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  engineDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },

  activePill: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, borderWidth: 0.5,
  },
  activePillText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },

  /* Radio dot */
  radioDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  radioDotInner: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#fff" },

  /* None card */
  noneCard: {
    padding: 12, flexDirection: "row", alignItems: "center", gap: 12,
  },
  noneEmoji: { fontSize: 16, width: 44, textAlign: "center", color: "#555" },
  noneLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },

  /* Active engine status bar */
  engineStatusBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderWidth: 0.5,
  },
  engineStatusDot: { width: 7, height: 7, borderRadius: 3.5 },
  engineStatusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
