import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { useApp } from "@/context/AppContext";

const { width: SW, height: SH } = Dimensions.get("window");
const BTN_SIZE = 60;
const WIDGET_W = 90;
const WIDGET_H = 110;

// Margins keep the widget away from edges/header/tab bar so it never overlaps
// system UI when we clamp on release.
const EDGE_MARGIN_X = 8;
const EDGE_MARGIN_TOP = 60;
const EDGE_MARGIN_BOTTOM = 60;

export function FloatingRoomWidget() {
  const {
    isRoomMinimized,
    minimizedRoomId,
    minimizedRoomName,
    minimizedRoomImage,
    expandRoom,
    floatingRoomPos,
    setFloatingRoomPos,
  } = useApp();

  const pathname = usePathname();

  const START_X = SW - WIDGET_W - 12;
  const START_Y = SH - 220;

  const initialX = floatingRoomPos?.x ?? START_X;
  const initialY = floatingRoomPos?.y ?? START_Y;

  // ── REANIMATED SHARED VALUES (live on UI thread, no JS bridge per frame) ──
  // x/y track the current widget position. start{X,Y} snapshot the position
  // at gesture begin so onUpdate can write absolute positions cheaply. The
  // dragging flag distinguishes a tap from a pan inside the gesture worklet.
  const x = useSharedValue(initialX);
  const y = useSharedValue(initialY);
  const startX = useSharedValue(initialX);
  const startY = useSharedValue(initialY);
  const dragging = useSharedValue(false);

  const scale = useSharedValue(0);
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0);

  // Refs that the gesture worklet calls into via runOnJS — kept fresh by
  // useEffect so the worklet always sees the latest functions / room id.
  const persistPosRef = useRef(setFloatingRoomPos);
  const roomIdRef = useRef<string | null>(minimizedRoomId);
  const expandRoomRef = useRef(expandRoom);
  useEffect(() => { persistPosRef.current = setFloatingRoomPos; }, [setFloatingRoomPos]);
  useEffect(() => { roomIdRef.current = minimizedRoomId; }, [minimizedRoomId]);
  useEffect(() => { expandRoomRef.current = expandRoom; }, [expandRoom]);

  // JS-thread helpers invoked from worklets via runOnJS.
  const persistPos = (nx: number, ny: number) => {
    persistPosRef.current({ x: nx, y: ny });
  };
  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const targetRoomId = roomIdRef.current;
    if (!targetRoomId) return;
    expandRoomRef.current();
    router.push(`/room/${targetRoomId}` as any);
  };

  // ── GESTURES (worklets — run entirely on the UI thread) ──
  // Pan: 1:1 finger tracking. We write absolute positions to x/y so the
  // animated style picks them up directly without any layout pass on the JS
  // side. On release we clamp inside the screen and persist.
  const pan = Gesture.Pan()
    .minDistance(2)
    .onStart(() => {
      'worklet';
      startX.value = x.value;
      startY.value = y.value;
      dragging.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      x.value = startX.value + e.translationX;
      y.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      'worklet';
      const clampedX = Math.max(EDGE_MARGIN_X, Math.min(SW - WIDGET_W - EDGE_MARGIN_X, x.value));
      const clampedY = Math.max(EDGE_MARGIN_TOP, Math.min(SH - WIDGET_H - EDGE_MARGIN_BOTTOM, y.value));
      // Spring snap to the clamped final position for a polished feel.
      x.value = withSpring(clampedX, { damping: 18, stiffness: 220, mass: 0.7 });
      y.value = withSpring(clampedY, { damping: 18, stiffness: 220, mass: 0.7 });
      dragging.value = false;
      runOnJS(persistPos)(clampedX, clampedY);
    });

  // Tap: only fires when not dragging. Race with pan so the first one wins.
  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((_e, success) => {
      'worklet';
      if (success && !dragging.value) {
        runOnJS(handleTap)();
      }
    });

  const composed = Gesture.Race(tap, pan);

  // ── Animated styles (read shared values directly on UI thread) ──
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + glow.value * 0.5,
    transform: [{ scale: pulse.value }],
  }));

  // ── Lifecycle: drive entrance/exit + pulse/glow loops via worklets ──
  useEffect(() => {
    if (isRoomMinimized) {
      scale.value = withSpring(1, { damping: 14, stiffness: 180 });
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else {
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [isRoomMinimized]);

  // Visibility rules
  const isOnRoomScreen = minimizedRoomId
    ? pathname === `/room/${minimizedRoomId}`
    : false;

  if (!isRoomMinimized || !minimizedRoomId || isOnRoomScreen) return null;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.glowRing, glowStyle]} />

        <Animated.View style={[styles.btn, pulseStyle]}>
          <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.btnGradient}>
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
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
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
