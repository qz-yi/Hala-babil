// ─────────────────────────────────────────────────────────────────────────────
// ThemePicker — bottom sheet that lets the user pick from the theme presets
// declared in `constants/colors.ts`. Replaces the old binary dark/light Switch.
// ─────────────────────────────────────────────────────────────────────────────
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors, {
  THEME_DESCRIPTIONS_AR,
  THEME_ICONS,
  THEME_IDS,
  THEME_LABELS_AR,
  ThemeId,
} from "@/constants/colors";

interface Props {
  visible: boolean;
  activeTheme: ThemeId;
  onSelect: (id: ThemeId) => void;
  onClose: () => void;
}

// Each card preview shows three swatches sampled from the theme — enough
// to communicate the vibe without pulling in a heavy dependency.
function previewSwatches(id: ThemeId): string[] {
  const p = Colors[id];
  return [p.background, p.accent, p.text];
}

function ThemeCard({
  id,
  active,
  onPress,
}: {
  id: ThemeId;
  active: boolean;
  onPress: (id: ThemeId) => void;
}) {
  const palette = Colors[id];
  const swatches = previewSwatches(id);
  const label = THEME_LABELS_AR[id];
  const desc = THEME_DESCRIPTIONS_AR[id];
  const iconName = THEME_ICONS[id] as keyof typeof Feather.glyphMap;

  return (
    <Pressable
      onPress={() => onPress(id)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.card,
          borderColor: active ? palette.accent : palette.border,
          opacity: pressed ? 0.85 : 1,
          shadowColor: active ? palette.accent : "#000",
          shadowOpacity: active ? 0.35 : 0.15,
        },
      ]}
    >
      {/* Swatch strip — three vertical bars showing background / accent / text */}
      <View style={styles.swatchRow}>
        {swatches.map((c, i) => (
          <View
            key={i}
            style={[
              styles.swatch,
              {
                backgroundColor: c,
                borderColor: palette.border,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconBubble,
              { backgroundColor: `${palette.accent}22` },
            ]}
          >
            <Feather name={iconName} size={16} color={palette.accent} />
          </View>
          <Text
            style={[styles.cardTitle, { color: palette.text }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {active && (
            <View
              style={[
                styles.activeDot,
                { backgroundColor: palette.accent },
              ]}
            >
              <Feather name="check" size={11} color={palette.background} />
            </View>
          )}
        </View>
        <Text
          style={[styles.cardDesc, { color: palette.textSecondary }]}
          numberOfLines={2}
        >
          {desc}
        </Text>
      </View>
    </Pressable>
  );
}

const MemoCard = memo(ThemeCard);

function ThemePickerImpl({ visible, activeTheme, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const sheetPalette = Colors[activeTheme] ?? Colors.dark;

  const handlePress = useCallback(
    (id: ThemeId) => {
      // Haptic only on native — Expo Go on web throws.
      if (Platform.OS !== "web") {
        Haptics.selectionAsync().catch(() => {});
      }
      onSelect(id);
    },
    [onSelect],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          // Block backdrop dismiss when tapping inside the sheet.
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.sheet,
            {
              backgroundColor: sheetPalette.background,
              borderColor: sheetPalette.border,
              paddingBottom: insets.bottom + 18,
            },
          ]}
        >
          {/* Drag handle */}
          <View
            style={[
              styles.handle,
              { backgroundColor: sheetPalette.textSecondary },
            ]}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: sheetPalette.text }]}>
                المظهر
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: sheetPalette.textSecondary },
                ]}
              >
                اختر نمط الألوان المفضّل لديك
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: sheetPalette.backgroundSecondary },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={18} color={sheetPalette.text} />
            </TouchableOpacity>
          </View>

          {/* Grid */}
          <FlatList
            data={THEME_IDS}
            keyExtractor={(id) => id}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ gap: 10, paddingTop: 6 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <MemoCard
                  id={item}
                  active={item === activeTheme}
                  onPress={handlePress}
                />
              </View>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const ThemePicker = memo(ThemePickerImpl);
export default ThemePicker;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: "82%",
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    opacity: 0.45,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "right",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "right",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
    minHeight: 132,
  },
  swatchRow: {
    flexDirection: "row",
    height: 38,
  },
  swatch: {
    flex: 1,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  cardBody: {
    padding: 10,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  activeDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDesc: {
    fontSize: 11,
    textAlign: "right",
    lineHeight: 15,
  },
});
