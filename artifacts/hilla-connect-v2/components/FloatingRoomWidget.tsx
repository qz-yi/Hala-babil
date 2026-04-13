import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useApp } from "@/context/AppContext";

const { width: SW, height: SH } = Dimensions.get("window");
const BTN_SIZE = 60;
const WIDGET_W = 90;
const WIDGET_H = 110;

export function FloatingRoomWidget() {
  const { isRoomMinimized, minimizedRoomId, minimizedRoomName, minimizedRoomImage, expandRoom } = useApp();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const START_X = SW - WIDGET_W - 12;
  const START_Y = SH - 220;

  const posX = useRef(new Animated.Value(START_X)).current;
  const posY = useRef(new Animated.Value(START_Y)).current;
  const lastPos = useRef({ x: START_X, y: START_Y });
  const isDragging = useRef(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    expandRoom();
    router.push(`/room/${minimizedRoomId}` as any);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDragging.current = false;
        posX.setOffset(lastPos.current.x);
        posY.setOffset(lastPos.current.y);
        posX.setValue(0);
        posY.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5) isDragging.current = true;
        posX.setValue(g.dx);
        posY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        posX.flattenOffset();
        posY.flattenOffset();
        const rawX = lastPos.current.x + g.dx;
        const rawY = lastPos.current.y + g.dy;
        const clampedX = Math.max(8, Math.min(SW - WIDGET_W - 8, rawX));
        const clampedY = Math.max(60, Math.min(SH - WIDGET_H - 60, rawY));
        lastPos.current = { x: clampedX, y: clampedY };
        posX.setValue(clampedX);
        posY.setValue(clampedY);
        if (!isDragging.current) handlePress();
      },
    })
  ).current;

  useEffect(() => {
    if (isRoomMinimized) {
      lastPos.current = { x: START_X, y: START_Y };
      posX.setValue(START_X);
      posY.setValue(START_Y);

      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      pulse.start();

      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      );
      glow.start();

      return () => {
        pulse.stop();
        glow.stop();
      };
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isRoomMinimized]);

  if (!isRoomMinimized || !minimizedRoomId) return null;

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          left: posX,
          top: posY,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.glowRing,
          { opacity: glowOpacity, transform: [{ scale: pulseAnim }] },
        ]}
      />

      <Animated.View style={[styles.btn, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={["#6366F1", "#4F46E5"]}
          style={styles.btnGradient}
        >
          {minimizedRoomImage ? (
            <Image source={{ uri: minimizedRoomImage }} style={styles.roomImg} />
          ) : (
            <Text style={styles.micIcon}>🎙️</Text>
          )}
        </LinearGradient>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>مباشر</Text>
        </View>
      </Animated.View>

      <View style={styles.tooltip}>
        <Ionicons name="mic" size={10} color="#6366F1" />
        <Text style={styles.tooltipText} numberOfLines={1}>
          {minimizedRoomName || "الغرفة"}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 9999,
    elevation: 9999,
    alignItems: "center",
  },
  glowRing: {
    position: "absolute",
    width: BTN_SIZE + 20,
    height: BTN_SIZE + 20,
    borderRadius: (BTN_SIZE + 20) / 2,
    backgroundColor: "#6366F155",
    top: -10,
    left: -10,
  },
  btn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    overflow: "visible",
    position: "relative",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  btnGradient: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  roomImg: {
    width: BTN_SIZE - 6,
    height: BTN_SIZE - 6,
    borderRadius: (BTN_SIZE - 6) / 2,
  },
  micIcon: { fontSize: 24 },
  liveBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FF3B5C",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: "#0f0f1a",
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  liveText: {
    fontSize: 8,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  tooltip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15,15,26,0.92)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 120,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.4)",
  },
  tooltipText: {
    fontSize: 11,
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    maxWidth: 90,
  },
});
