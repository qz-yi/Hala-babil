import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { Story } from "@/context/AppContext";

const STORY_DURATION = 5000; // 5 ثوانٍ لكل قصة

export default function StoryViewerScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { users, getUserStories, viewStory, currentUser, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const user = users.find((u) => u.id === userId);
  const stories = getUserStories(userId || "");

  const [currentIndex, setCurrentIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const currentStory: Story | undefined = stories[currentIndex];
  const accentColor = ACCENT_COLORS[(user?.name?.length ?? 0) % ACCENT_COLORS.length];

  useEffect(() => {
    if (!currentStory) return;
    viewStory(currentStory.id);
    progressAnim.setValue(0);
    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished) handleNext();
    });
    return () => { animRef.current?.stop(); };
  }, [currentIndex, currentStory?.id]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      router.back();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  if (!user || stories.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: "#000", justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.4)" />
        <Text style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", marginTop: 12 }}>
          لا توجد قصص لعرضها
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 14 }}>
          <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>عودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hrs = Math.floor(mins / 60);
    return `منذ ${hrs} ساعة`;
  };

  return (
    <View style={styles.container}>
      {currentStory.mediaUrl ? (
        <Image source={{ uri: currentStory.mediaUrl }} style={styles.storyMedia} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[accentColor, "#0A0A14"]} style={styles.storyMedia} />
      )}

      {/* Gradient overlays */}
      <LinearGradient colors={["rgba(0,0,0,0.7)", "transparent"]} style={styles.topGrad} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={styles.bottomGrad} />

      {/* Progress bars */}
      <View style={[styles.progressRow, { top: topPad + 12 }]}>
        {stories.map((_, i) => (
          <View key={i} style={[styles.progressBar, { backgroundColor: "rgba(255,255,255,0.3)" }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: "#fff",
                  width: i < currentIndex
                    ? "100%"
                    : i === currentIndex
                    ? progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] })
                    : "0%",
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* User info */}
      <View style={[styles.userRow, { top: topPad + 36 }]}>
        <View style={styles.userInfo}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.userAvatar, { backgroundColor: `${accentColor}55`, alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: accentColor, fontSize: 16, fontFamily: "Inter_700Bold" }}>{user.name[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.storyTime}>{formatTime(currentStory.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {currentStory.caption ? (
        <View style={styles.captionWrap}>
          <Text style={styles.captionText}>{currentStory.caption}</Text>
        </View>
      ) : null}

      {/* Views count */}
      <View style={styles.viewsWrap}>
        <Ionicons name="eye-outline" size={16} color="rgba(255,255,255,0.8)" />
        <Text style={styles.viewsText}>{currentStory.viewerIds.length} مشاهدة</Text>
      </View>

      {/* Tap areas for navigation */}
      <Pressable style={styles.tapLeft} onPress={handlePrev} />
      <Pressable style={styles.tapRight} onPress={handleNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  storyMedia: { ...StyleSheet.absoluteFillObject },
  topGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 200 },
  bottomGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 200 },
  progressRow: { position: "absolute", left: 12, right: 12, flexDirection: "row", gap: 4 },
  progressBar: { flex: 1, height: 2.5, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  userRow: {
    position: "absolute", left: 16, right: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  userAvatar: { width: 40, height: 40, borderRadius: 13, overflow: "hidden", borderWidth: 2, borderColor: "rgba(255,255,255,0.7)" },
  userName: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  storyTime: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", fontSize: 12 },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  captionWrap: { position: "absolute", bottom: 80, left: 20, right: 20 },
  captionText: { color: "#fff", fontFamily: "Inter_500Medium", fontSize: 16, textAlign: "center", textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 8 },
  viewsWrap: { position: "absolute", bottom: 50, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  viewsText: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", fontSize: 13 },
  tapLeft: { position: "absolute", left: 0, top: 0, bottom: 0, width: "40%" },
  tapRight: { position: "absolute", right: 0, top: 0, bottom: 0, width: "60%" },
});
