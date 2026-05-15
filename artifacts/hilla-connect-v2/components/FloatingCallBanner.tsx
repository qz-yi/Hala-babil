import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router, usePathname } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useCallStore } from "@/store/callStore";

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function FloatingCallBanner() {
  const activeCall = useCallStore((s) => s.activeCall);
  const pathname = usePathname();
  const [elapsed, setElapsed] = useState(0);
  const translateY = useSharedValue(-80);

  const isOnCallScreen = pathname.startsWith("/call/");

  // Tick elapsed time from call start
  useEffect(() => {
    if (!activeCall) {
      setElapsed(0);
      return;
    }
    const update = () => setElapsed(Math.floor((Date.now() - activeCall.startedAt) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeCall]);

  // Animate in/out
  useEffect(() => {
    const show = !!activeCall && !isOnCallScreen;
    translateY.value = withSpring(show ? 0 : -80, { damping: 16, stiffness: 200 });
  }, [activeCall, isOnCallScreen]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!activeCall) return null;

  const handleTap = () => {
    router.push({
      pathname: "/call/[id]",
      params: {
        id: activeCall.otherUserId,
        type: activeCall.callType,
        name: encodeURIComponent(activeCall.otherUserName),
        avatar: encodeURIComponent(activeCall.otherUserAvatar),
        resume: "1",
      },
    } as any);
  };

  return (
    <Animated.View style={[styles.container, animStyle]} pointerEvents="box-none">
      <TouchableOpacity style={styles.banner} onPress={handleTap} activeOpacity={0.9}>
        {/* Pulse dot */}
        <View style={styles.pulseDot} />

        <Feather
          name={activeCall.callType === "video" ? "video" : "phone"}
          size={16}
          color="#fff"
          style={{ marginRight: 8 }}
        />

        <View style={styles.textWrap}>
          <Text style={styles.label} numberOfLines={1}>
            مكالمة جارية • {activeCall.otherUserName}
          </Text>
        </View>

        <Text style={styles.timer}>{formatDuration(elapsed)}</Text>

        <View style={styles.returnPill}>
          <Text style={styles.returnText}>رجوع</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 99999,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a7a3a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ade80",
    marginRight: 6,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  timer: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "700",
    marginHorizontal: 8,
    fontVariant: ["tabular-nums"],
  },
  returnPill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  returnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
