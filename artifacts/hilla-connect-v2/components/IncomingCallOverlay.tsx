import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Vibration,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallStore } from "@/store/callStore";
import { acceptCallSignal, declineCallSignal } from "@/hooks/useSocket";
import { useApp } from "@/context/AppContext";
import { useCallAudio } from "@/hooks/useCallAudio";

function PulseRing({ delay, color }: { delay: number; color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withRepeat(
        withTiming(2.4, { duration: 1600, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
      opacity.value = withRepeat(
        withTiming(0, { duration: 1600, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { borderColor: color, borderWidth: 2 },
        animStyle,
      ]}
    />
  );
}

export function IncomingCallOverlay() {
  const insets = useSafeAreaInsets();
  const { incomingCall, setIncomingCall } = useCallStore();
  const { currentUser } = useApp();
  const { startRinging, stopAll } = useCallAudio();

  const slideY = useSharedValue(80);
  const overlayOpacity = useSharedValue(0);

  // Animate in when incoming call appears
  useEffect(() => {
    if (incomingCall) {
      slideY.value = withSpring(0, { damping: 18, stiffness: 220 });
      overlayOpacity.value = withTiming(1, { duration: 250 });
      startRinging();

      if (Platform.OS !== "web") {
        Vibration.vibrate([300, 200, 300, 200, 300, 1000], true);
      }
    } else {
      slideY.value = withTiming(80, { duration: 200 });
      overlayOpacity.value = withTiming(0, { duration: 200 });
      stopAll();
      if (Platform.OS !== "web") Vibration.cancel();
    }

    return () => {
      if (Platform.OS !== "web") Vibration.cancel();
    };
  }, [!!incomingCall]);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const handleAccept = useCallback(() => {
    if (!incomingCall || !currentUser) return;

    acceptCallSignal({
      callRoomId: incomingCall.callRoomId,
      fromUserId: incomingCall.fromUserId,
      calleeUserId: currentUser.id,
    });

    stopAll();
    if (Platform.OS !== "web") Vibration.cancel();
    setIncomingCall(null);

    router.push({
      pathname: "/call/[id]",
      params: {
        id: incomingCall.fromUserId,
        type: incomingCall.callType,
        name: encodeURIComponent(incomingCall.fromUserName || ""),
        avatar: encodeURIComponent(incomingCall.fromUserAvatar || ""),
        callee: "1",
      },
    } as any);
  }, [incomingCall, currentUser, stopAll, setIncomingCall]);

  const handleDecline = useCallback(() => {
    if (!incomingCall || !currentUser) return;

    declineCallSignal({
      callRoomId: incomingCall.callRoomId,
      fromUserId: incomingCall.fromUserId,
      calleeUserId: currentUser.id,
    });

    stopAll();
    if (Platform.OS !== "web") Vibration.cancel();
    setIncomingCall(null);
  }, [incomingCall, currentUser, stopAll, setIncomingCall]);

  if (!incomingCall) return null;

  const ringColor = incomingCall.callType === "video" ? "#4f9cff" : "#4ade80";
  const typeLabel = incomingCall.callType === "video" ? "مكالمة مرئية واردة" : "مكالمة صوتية واردة";

  return (
    <Animated.View style={[styles.backdrop, bgStyle]} pointerEvents="box-none">
      <Animated.View
        style={[styles.card, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }, cardStyle]}
        pointerEvents="auto"
      >
        {/* ── Caller avatar + pulse rings ───────────────────────────────── */}
        <View style={styles.avatarContainer}>
          <PulseRing delay={0} color={ringColor} />
          <PulseRing delay={500} color={ringColor} />
          <PulseRing delay={1000} color={ringColor} />

          {incomingCall.fromUserAvatar ? (
            <Image source={{ uri: incomingCall.fromUserAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {(incomingCall.fromUserName || "?")[0]}
              </Text>
            </View>
          )}
        </View>

        {/* ── Caller info ────────────────────────────────────────────────── */}
        <Text style={styles.callerName}>{incomingCall.fromUserName || "مستخدم"}</Text>
        <View style={styles.typeBadge}>
          <Feather
            name={incomingCall.callType === "video" ? "video" : "phone"}
            size={13}
            color={ringColor}
          />
          <Text style={[styles.typeLabel, { color: ringColor }]}>{typeLabel}</Text>
        </View>

        {/* ── Accept / Decline buttons ──────────────────────────────────── */}
        <View style={styles.btnRow}>
          {/* Decline */}
          <View style={styles.btnWrap}>
            <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={handleDecline} activeOpacity={0.85}>
              <Feather name="phone-off" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>رفض</Text>
          </View>

          {/* Accept */}
          <View style={styles.btnWrap}>
            <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={handleAccept} activeOpacity={0.85}>
              <Feather name="phone" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>قبول</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const AVATAR_SIZE = 108;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.82)",
    zIndex: 999998,
    elevation: 999998,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },

  // ── Avatar + pulse ───────────────────────────────────────────────────────
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  pulseRing: {
    position: "absolute",
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.22)",
  },
  avatarFallback: {
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "white",
    fontSize: 42,
    fontWeight: "700",
  },

  // ── Caller info ───────────────────────────────────────────────────────────
  callerName: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Buttons ────────────────────────────────────────────────────────────────
  btnRow: {
    flexDirection: "row",
    gap: 72,
    marginTop: 40,
  },
  btnWrap: {
    alignItems: "center",
    gap: 10,
  },
  actionBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 12,
  },
  acceptBtn: {
    backgroundColor: "#22c55e",
    shadowColor: "#22c55e",
  },
  declineBtn: {
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444",
  },
  btnLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "600",
  },
});
