/**
 * CreationHub — Premium animated bottom-sheet for picking Story / Post / Reel.
 * Fully theme-adaptive: reads tokens from useThemeStore in real time.
 *
 * Design system:
 * • iOS:     BlurView backdrop + frosted-glass sheet
 * • Android: Semi-transparent backdrop + elevated card sheet
 * • Animations: spring slide-up + staggered card entry + scale press
 * • Haptics:  impactMedium on open, impactLight on each card, notificationSuccess on select
 */

import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

import { useThemeStore } from "@/store/themeStore";

const { height: SH } = Dimensions.get("window");
const SHEET_HEIGHT = Math.min(SH * 0.56, 440);
const CARD_STAGGER = 70;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectStory: () => void;
  onSelectPost: () => void;
  onSelectReel: () => void;
}

interface CardDef {
  key: "story" | "post" | "reel";
  labelAr: string;
  labelEn: string;
  desc: string;
  iconFamily: "feather" | "ionicons";
  iconName: string;
  onPress: () => void;
}

export default function CreationHub({
  visible,
  onClose,
  onSelectStory,
  onSelectPost,
  onSelectReel,
}: Props) {
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const cardAnims = useRef([0, 1, 2].map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(28),
    scale: new Animated.Value(0.88),
  }))).current;
  const pressScales = useRef([0, 1, 2].map(() => new Animated.Value(1))).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: tokens.animationDuration + 80, useNativeDriver: true }),
        Animated.spring(sheetY, { toValue: 0, damping: 22, stiffness: 280, mass: 0.9, useNativeDriver: true }),
      ]).start();
      cardAnims.forEach((anim, i) => {
        const delay = i * CARD_STAGGER + 60;
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 1, duration: tokens.animationDuration + 60, delay, useNativeDriver: true }),
          Animated.spring(anim.translateY, { toValue: 0, damping: 18, stiffness: 260, delay, useNativeDriver: true }),
          Animated.spring(anim.scale, { toValue: 1, damping: 18, stiffness: 260, delay, useNativeDriver: true }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: tokens.animationDuration, useNativeDriver: true }),
        Animated.timing(sheetY, { toValue: SHEET_HEIGHT, duration: tokens.animationDuration + 20, useNativeDriver: true }),
      ]).start();
      cardAnims.forEach((anim) => {
        anim.opacity.setValue(0);
        anim.translateY.setValue(28);
        anim.scale.setValue(0.88);
      });
    }
  }, [visible, tokens.animationDuration]);

  const handlePressIn = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pressScales[idx], { toValue: 0.94, damping: 14, stiffness: 300, useNativeDriver: true }).start();
  };

  const handlePressOut = (idx: number) => {
    Animated.spring(pressScales[idx], { toValue: 1, damping: 14, stiffness: 300, useNativeDriver: true }).start();
  };

  const handleSelect = (cb: () => void, idx: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handlePressOut(idx);
    setTimeout(() => {
      onClose();
      setTimeout(cb, 60);
    }, 80);
  };

  const cards: CardDef[] = [
    {
      key: "story",
      labelAr: "قصة",
      labelEn: "Story",
      desc: "شارك لحظاتك تختفي بعد 24 ساعة",
      iconFamily: "ionicons",
      iconName: "camera-outline",
      onPress: () => handleSelect(onSelectStory, 0),
    },
    {
      key: "post",
      labelAr: "منشور",
      labelEn: "Post",
      desc: "صورة أو فيديو أو نص في ملفك",
      iconFamily: "feather",
      iconName: "image",
      onPress: () => handleSelect(onSelectPost, 1),
    },
    {
      key: "reel",
      labelAr: "ريل",
      labelEn: "Reel",
      desc: "مقطع فيديو قصير للجمهور",
      iconFamily: "feather",
      iconName: "film",
      onPress: () => handleSelect(onSelectReel, 2),
    },
  ];

  const getCardGradient = (key: CardDef["key"]): [string, string] => {
    const s = tokens.gradientStart;
    const e = tokens.gradientEnd;
    const g = tokens.glow;
    const a = tokens.accent;
    switch (key) {
      case "story":
        return [`${s}28`, `${e}0A`];
      case "post":
        return [`${a}20`, `${e}0A`];
      case "reel":
        return [`${g}22`, `${s}0A`];
    }
  };

  const getCardAccent = (key: CardDef["key"]): string => {
    switch (key) {
      case "story": return tokens.accent;
      case "post":  return tokens.tint;
      case "reel":  return tokens.glow;
    }
  };

  const r = tokens.radius;
  const isDark = tokens.isDark;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={20}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.72)" }]} />
          )}
        </Animated.View>
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: isDark
              ? tokens.backgroundSecondary
              : tokens.card,
            borderTopLeftRadius: Math.max(r + 8, 24),
            borderTopRightRadius: Math.max(r + 8, 24),
            borderTopWidth: 0.5,
            borderLeftWidth: 0.5,
            borderRightWidth: 0.5,
            borderColor: tokens.border,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY: sheetY }],
            shadowColor: tokens.glow,
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.22,
            shadowRadius: 24,
            elevation: 20,
          },
        ]}
      >
        {/* Glow line at top edge */}
        <LinearGradient
          colors={[tokens.accent + "55", tokens.glow + "22", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.glowLine,
            {
              borderTopLeftRadius: Math.max(r + 8, 24),
              borderTopRightRadius: Math.max(r + 8, 24),
            },
          ]}
          pointerEvents="none"
        />

        {/* Drag handle */}
        <View style={styles.handleWrap}>
          <View style={[styles.handle, { backgroundColor: tokens.border }]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                color: tokens.text,
                fontFamily: tokens.fontFamily ?? "Inter_700Bold",
              },
            ]}
          >
            ابدأ الإنشاء
          </Text>
          <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>
            اختر نوع المحتوى
          </Text>
        </View>

        {/* Cards */}
        <View style={styles.cardsRow}>
          {cards.map((card, idx) => {
            const accent = getCardAccent(card.key);
            const gradColors = getCardGradient(card.key);
            const anim = cardAnims[idx];
            return (
              <Animated.View
                key={card.key}
                style={{
                  flex: 1,
                  opacity: anim.opacity,
                  transform: [
                    { translateY: anim.translateY },
                    { scale: Animated.multiply(anim.scale, pressScales[idx]) },
                  ],
                }}
              >
                <Pressable
                  onPressIn={() => handlePressIn(idx)}
                  onPressOut={() => handlePressOut(idx)}
                  onPress={card.onPress}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      borderRadius: Math.max(r, 18),
                      borderColor: accent + "45",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={gradColors as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      StyleSheet.absoluteFill,
                      { borderRadius: Math.max(r, 18) },
                    ]}
                  />

                  {/* Icon container */}
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: accent + "18",
                        borderRadius: Math.max(r - 2, 14),
                        borderWidth: 1,
                        borderColor: accent + "35",
                        shadowColor: accent,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 8,
                      },
                    ]}
                  >
                    {card.iconFamily === "ionicons" ? (
                      <Ionicons name={card.iconName as any} size={28} color={accent} />
                    ) : (
                      <Feather name={card.iconName as any} size={26} color={accent} />
                    )}
                  </View>

                  {/* Labels */}
                  <Text
                    style={[
                      styles.cardLabel,
                      {
                        color: tokens.text,
                        fontFamily: tokens.fontFamily ?? "Inter_700Bold",
                      },
                    ]}
                  >
                    {card.labelAr}
                  </Text>
                  <Text
                    style={[
                      styles.cardSub,
                      { color: accent + "CC" },
                    ]}
                  >
                    {card.labelEn}
                  </Text>
                  <Text
                    style={[
                      styles.cardDesc,
                      { color: tokens.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {card.desc}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Cancel */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}
          activeOpacity={0.7}
          style={[
            styles.cancelBtn,
            {
              backgroundColor: tokens.inputBackground,
              borderRadius: Math.max(r, 14),
              borderWidth: 0.5,
              borderColor: tokens.border,
            },
          ]}
        >
          <Text
            style={[
              styles.cancelText,
              {
                color: tokens.textSecondary,
                fontFamily: tokens.fontFamily ?? "Inter_500Medium",
              },
            ]}
          >
            إلغاء
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: SHEET_HEIGHT,
    paddingTop: 0,
  },
  glowLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 6,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    opacity: 0.45,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 18,
    gap: 3,
  },
  title: {
    fontSize: 22,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  cardsRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 14,
  },
  card: {
    flex: 1,
    paddingVertical: 22,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    minHeight: 170,
  },
  iconWrap: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 15,
    letterSpacing: 0.1,
  },
  cardSub: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: -4,
  },
  cardDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 15,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  cancelBtn: {
    marginHorizontal: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    letterSpacing: 0.1,
  },
});
