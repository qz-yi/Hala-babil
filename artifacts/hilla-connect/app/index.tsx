import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

export default function SplashIndexScreen() {
  const { isAuthenticated, t, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(btnAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 8,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [isAuthenticated]);

  const topPad = Platform.OS === "web" ? 30 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#0A0A14", "#1A0A2E", "#0D1A3A", "#0A0A14"]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View
        style={[
          styles.circle,
          {
            width: width * 1.2,
            height: width * 1.2,
            borderRadius: width * 0.6,
            top: -width * 0.4,
            left: -width * 0.1,
            backgroundColor: "rgba(79,70,229,0.07)",
          },
        ]}
      />
      <View
        style={[
          styles.circle,
          {
            width: width * 0.8,
            height: width * 0.8,
            borderRadius: width * 0.4,
            bottom: -width * 0.2,
            right: -width * 0.2,
            backgroundColor: "rgba(124,58,237,0.06)",
          },
        ]}
      />

      <View
        style={[
          styles.content,
          {
            paddingTop: topPad + 40,
            paddingBottom: botPad + 20,
          },
        ]}
      >
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
                { translateY: floatAnim },
              ],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={["#7C3AED", "#4F46E5", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Text style={styles.logoEmoji}>🌐</Text>
          </LinearGradient>
          <View style={styles.logoGlow} />
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={{
            opacity: opacityAnim,
            transform: [
              {
                translateY: opacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          }}
        >
          <Text style={styles.appName}>{t("hillaConnect")}</Text>
          <Text style={styles.tagline}>
            {t("language") === "Language"
              ? "Connect. Chat. Explore."
              : "تواصل • دردش • اكتشف"}
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View
          style={[
            styles.featuresRow,
            {
              opacity: subtitleAnim,
              transform: [
                {
                  translateY: subtitleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {["🎙️", "💬", "🍽️"].map((emoji, i) => (
            <View key={i} style={styles.featureBadge}>
              <Text style={styles.featureEmoji}>{emoji}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={[
            styles.btnContainer,
            {
              opacity: Platform.OS === "web" ? 1 : btnAnim,
              transform: [
                {
                  translateY: Platform.OS === "web" ? 0 : btnAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/login")}
          >
            <LinearGradient
              colors={["#7C3AED", "#4F46E5", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>{t("login")}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.secondaryBtnText}>{t("register")}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Color dots */}
        <View style={styles.colorDots}>
          {ACCENT_COLORS.slice(0, 5).map((c, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: c }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  circle: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 28,
  },
  logoContainer: {
    position: "relative",
    marginBottom: 8,
  },
  logoGradient: {
    width: 110,
    height: 110,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  logoGlow: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: "rgba(124,58,237,0.25)",
    transform: [{ scale: 1.3 }],
  },
  logoEmoji: {
    fontSize: 52,
  },
  appName: {
    fontSize: 38,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  featuresRow: {
    flexDirection: "row",
    gap: 16,
  },
  featureBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureEmoji: {
    fontSize: 26,
  },
  btnContainer: {
    width: "100%",
    gap: 14,
    marginTop: 8,
  },
  primaryBtn: {
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  secondaryBtnText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  colorDots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
