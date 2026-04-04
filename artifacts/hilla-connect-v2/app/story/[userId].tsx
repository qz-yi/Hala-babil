import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { Story } from "@/context/AppContext";

const STORY_DURATION = 5000;

// ─── مكوّن مشاركة القصة ───
function ShareStoryModal({
  visible,
  onClose,
  storyId,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  storyId: string;
  colors: any;
}) {
  const { users, currentUser, shareStoryToDM } = useApp();
  const others = users.filter((u) => u.id !== currentUser?.id);
  const [sent, setSent] = useState<string[]>([]);

  const handleSend = (userId: string) => {
    shareStoryToDM(storyId, userId);
    setSent((prev) => [...prev, userId]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ss.backdrop} onPress={onClose} />
      <View style={[ss.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[ss.handle, { backgroundColor: colors.border }]} />
        <Text style={[ss.sheetTitle, { color: colors.text }]}>مشاركة القصة مع</Text>
        <FlatList
          data={others}
          keyExtractor={(u) => u.id}
          style={{ maxHeight: 320 }}
          ListEmptyComponent={
            <Text style={[ss.emptyText, { color: colors.textSecondary }]}>لا يوجد أصدقاء</Text>
          }
          renderItem={({ item }) => {
            const color = ACCENT_COLORS[(item.name?.length ?? 0) % ACCENT_COLORS.length];
            const isSent = sent.includes(item.id);
            return (
              <TouchableOpacity
                style={ss.userRow}
                onPress={() => !isSent && handleSend(item.id)}
                activeOpacity={0.7}
              >
                <View style={[ss.miniAvatar, { backgroundColor: `${color}33` }]}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={StyleSheet.absoluteFill as any} />
                  ) : (
                    <Text style={[ss.miniAvatarText, { color }]}>{item.name[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[ss.userName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[ss.userPhone, { color: colors.textSecondary }]}>{item.phone}</Text>
                </View>
                {isSent ? (
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                ) : (
                  <Ionicons name="paper-plane-outline" size={20} color={colors.tint} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

export default function StoryViewerScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const {
    users, getUserStories, viewStory, currentUser, theme,
    likeStory, replyToStory, deleteStory, stories: allStories,
  } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const user = users.find((u) => u.id === userId);
  const stories = getUserStories(userId || "");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);

  // Progress animation — properly handles pause/resume
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const heartScale = useRef(new Animated.Value(1)).current;

  // Track elapsed ms for proper resume-without-reset
  const elapsedRef = useRef(0);
  const pauseStartRef = useRef(0);

  const currentStory: Story | undefined = stories[currentIndex];
  const accentColor = ACCENT_COLORS[(user?.name?.length ?? 0) % ACCENT_COLORS.length];
  const isMyStory = currentUser?.id === userId;

  // Users with active stories for auto-advance
  const usersWithStories = users.filter((u) => {
    const now = Date.now();
    return allStories.some((s) => s.creatorId === u.id && s.expiresAt > now);
  });
  const currentUserIndex = usersWithStories.findIndex((u) => u.id === userId);

  // Reset elapsed when story changes
  useEffect(() => {
    elapsedRef.current = 0;
  }, [currentIndex, currentStory?.id]);

  useEffect(() => {
    if (!currentStory) return;

    if (paused) {
      // Pause: stop the animation, record when we paused
      animRef.current?.stop();
      pauseStartRef.current = Date.now();
      return;
    }

    // If we're resuming after a pause, don't add extra elapsed
    // (elapsedRef was already updated in stop cleanup)
    const remaining = STORY_DURATION - elapsedRef.current;
    if (remaining <= 0) {
      handleNext();
      return;
    }

    // Set progress bar to current position
    const startFraction = elapsedRef.current / STORY_DURATION;
    progressAnim.setValue(startFraction);

    const startTime = Date.now();

    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: remaining,
      useNativeDriver: false,
    });

    animRef.current.start(({ finished }) => {
      if (finished) {
        elapsedRef.current = STORY_DURATION;
        handleNext();
      }
    });

    return () => {
      animRef.current?.stop();
      // Update elapsed with how much time passed since we started this segment
      const timeNow = Date.now();
      const segmentElapsed = timeNow - startTime;
      elapsedRef.current = Math.min(STORY_DURATION, elapsedRef.current + segmentElapsed);
    };
  }, [currentIndex, currentStory?.id, paused]);

  useEffect(() => {
    setReplySent(false);
    setReplyText("");
    setLiked(false);
  }, [currentIndex]);

  useEffect(() => {
    if (currentStory) viewStory(currentStory.id);
  }, [currentStory?.id]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      const nextUserIndex = currentUserIndex + 1;
      if (nextUserIndex < usersWithStories.length) {
        const nextUser = usersWithStories[nextUserIndex];
        router.replace(`/story/${nextUser.id}` as any);
      } else {
        router.back();
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      elapsedRef.current = 0;
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleLike = () => {
    if (isMyStory || liked) return;
    setLiked(true);
    likeStory(currentStory.id);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.5, useNativeDriver: true, friction: 3 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 3 }),
    ]).start();
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !currentStory || isMyStory) return;
    replyToStory(currentStory.id, userId!, replyText.trim());
    setReplySent(true);
    setReplyText("");
    setPaused(false);
  };

  // Long press = pause, release = resume
  const handlePressIn = () => {
    setPaused(true);
  };

  const handlePressOut = () => {
    setPaused(false);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {currentStory.mediaUrl ? (
        <View style={styles.storyMedia}>
          <Image source={{ uri: currentStory.mediaUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          {/* Filter overlay */}
          {currentStory.filter && currentStory.filter !== "none" && (() => {
            const filterOverlays: Record<string, string> = {
              warm: "rgba(255,140,0,0.25)",
              cool: "rgba(0,120,255,0.22)",
              vintage: "rgba(160,100,40,0.28)",
              grayscale: "rgba(0,0,0,0)",
            };
            const overlay = filterOverlays[currentStory.filter];
            return overlay ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: overlay,
                    ...(currentStory.filter === "grayscale" && Platform.OS === "web"
                      ? ({ filter: "grayscale(100%)" } as any)
                      : {}),
                  },
                ]}
              />
            ) : null;
          })()}
        </View>
      ) : (
        <LinearGradient colors={[accentColor, "#0A0A14"]} style={styles.storyMedia} />
      )}

      {/* Gradients */}
      <LinearGradient colors={["rgba(0,0,0,0.7)", "transparent"]} style={styles.topGrad} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.bottomGrad} />

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

      {/* Pause indicator */}
      {paused && (
        <View style={styles.pauseIndicator}>
          <Ionicons name="pause" size={28} color="rgba(255,255,255,0.9)" />
        </View>
      )}

      {/* User info row */}
      <View style={[styles.userRow, { top: topPad + 36 }]}>
        <TouchableOpacity
          onPress={() => {
            if (!isMyStory) router.push(`/profile/${userId}` as any);
          }}
          activeOpacity={isMyStory ? 1 : 0.85}
          style={styles.userInfoTouchable}
        >
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.userAvatar, { backgroundColor: `${accentColor}55`, alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: accentColor, fontSize: 16, fontFamily: "Inter_700Bold" }}>
                {user.name[0]?.toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.storyTime}>{formatTime(currentStory.createdAt)}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {currentStory.caption ? (
        <View style={[styles.captionWrap, { bottom: isMyStory ? 60 : 130 }]}>
          <Text style={styles.captionText}>{currentStory.caption}</Text>
        </View>
      ) : null}

      {/* Bottom bar for non-owner */}
      {!isMyStory && (
        <View style={[styles.bottomBar, { paddingBottom: botPad + 8 }]}>
          <View style={styles.replyRow}>
            {replySent ? (
              <View style={styles.replySentRow}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.replySentText}>تم إرسال ردّك</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.replyInput}
                  placeholder="رد على القصة..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={replyText}
                  onChangeText={setReplyText}
                  onFocus={() => setPaused(true)}
                  onBlur={() => { if (!replyText.trim()) setPaused(false); }}
                  textAlign="right"
                  returnKeyType="send"
                  onSubmitEditing={handleSendReply}
                />
                {replyText.trim().length > 0 && (
                  <TouchableOpacity onPress={handleSendReply} style={styles.replySendBtn}>
                    <Ionicons name="send" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <View style={styles.actionsRow}>
            <View style={styles.viewsBadge}>
              <Ionicons name="eye-outline" size={15} color="rgba(255,255,255,0.85)" />
              <Text style={styles.viewsText}>{currentStory.viewerIds.length}</Text>
            </View>

            <View style={styles.reactionBtns}>
              <TouchableOpacity onPress={handleLike} style={styles.reactionBtn} activeOpacity={0.8}>
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={26}
                    color={liked ? "#E1306C" : "#fff"}
                  />
                </Animated.View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setPaused(true); setShowShare(true); }}
                style={styles.reactionBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="paper-plane-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* My story: show views + "add more" button + delete */}
      {isMyStory && (
        <View style={[styles.myStoryBottom, { bottom: botPad + 16 }]}>
          <TouchableOpacity
            style={styles.viewsBadge}
            onPress={() => { setPaused(true); setShowViewers(true); }}
            activeOpacity={0.85}
          >
            <Ionicons name="eye-outline" size={15} color="rgba(255,255,255,0.85)" />
            <Text style={styles.viewsText}>{currentStory.viewerIds.length} مشاهدة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/create-story")}
            style={styles.addMoreBtn}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.addMoreText}>أضف قصة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteStoryBtn}
            activeOpacity={0.85}
            onPress={() => {
              Alert.alert("حذف القصة", "هل تريد حذف هذه القصة؟", [
                { text: "إلغاء", style: "cancel" },
                {
                  text: "حذف",
                  style: "destructive",
                  onPress: () => {
                    deleteStory(currentStory.id);
                    const remaining = stories.filter(
                      (s) => s.creatorId === userId && s.expiresAt > Date.now() && s.id !== currentStory.id
                    );
                    if (remaining.length > 0) {
                      const nextIdx = currentIndex > 0 ? currentIndex - 1 : 0;
                      setCurrentIndex(nextIdx);
                    } else {
                      router.back();
                    }
                  },
                },
              ]);
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B5C" />
          </TouchableOpacity>
        </View>
      )}

      {/* Viewers Modal — visible only for story owner */}
      <Modal
        visible={showViewers}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowViewers(false); setPaused(false); }}
      >
        <Pressable
          style={ss.backdrop}
          onPress={() => { setShowViewers(false); setPaused(false); }}
        />
        <View style={[ss.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[ss.handle, { backgroundColor: colors.border }]} />
          <Text style={[ss.sheetTitle, { color: colors.text }]}>
            المشاهدون ({currentStory.viewerIds.length})
          </Text>
          {currentStory.viewerIds.length === 0 ? (
            <Text style={[ss.emptyText, { color: colors.textSecondary }]}>لا أحد شاهد هذه القصة بعد</Text>
          ) : (
            <FlatList
              data={currentStory.viewerIds}
              keyExtractor={(id) => id}
              style={{ maxHeight: 360 }}
              renderItem={({ item: viewerId }) => {
                const viewer = users.find((u) => u.id === viewerId);
                if (!viewer) return null;
                const vColor = ACCENT_COLORS[(viewer.name?.length ?? 0) % ACCENT_COLORS.length];
                return (
                  <TouchableOpacity
                    style={ss.userRow}
                    onPress={() => {
                      setShowViewers(false);
                      setPaused(false);
                      router.push(`/profile/${viewer.id}` as any);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[ss.miniAvatar, { backgroundColor: `${vColor}33` }]}>
                      {viewer.avatar ? (
                        <Image source={{ uri: viewer.avatar }} style={StyleSheet.absoluteFill as any} />
                      ) : (
                        <Text style={[ss.miniAvatarText, { color: vColor }]}>{viewer.name[0]?.toUpperCase()}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[ss.userName, { color: colors.text }]}>{viewer.name}</Text>
                      <Text style={[ss.userPhone, { color: colors.textSecondary }]}>{viewer.phone}</Text>
                    </View>
                    <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>

      {/* Tap areas — long press to pause */}
      <Pressable
        style={styles.tapLeft}
        onPress={handlePrev}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={150}
      />
      <Pressable
        style={styles.tapRight}
        onPress={handleNext}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={150}
      />

      <ShareStoryModal
        visible={showShare}
        onClose={() => { setShowShare(false); setPaused(false); }}
        storyId={currentStory.id}
        colors={colors}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  storyMedia: { ...StyleSheet.absoluteFillObject },
  topGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 200 },
  bottomGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 320 },
  progressRow: { position: "absolute", left: 12, right: 12, flexDirection: "row", gap: 4, zIndex: 10 },
  progressBar: { flex: 1, height: 2.5, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  pauseIndicator: {
    position: "absolute",
    top: "45%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 40,
    padding: 14,
    zIndex: 20,
  },
  userRow: {
    position: "absolute", left: 16, right: 16, zIndex: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  userInfoTouchable: { flexDirection: "row", alignItems: "center", gap: 10 },
  userAvatar: {
    width: 40, height: 40, borderRadius: 13, overflow: "hidden",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.7)",
  },
  userName: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  storyTime: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", fontSize: 12 },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  captionWrap: { position: "absolute", left: 20, right: 20 },
  captionText: {
    color: "#fff", fontFamily: "Inter_500Medium", fontSize: 16,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 8,
  },
  tapLeft: { position: "absolute", left: 0, top: 100, bottom: 160, width: "40%", zIndex: 5 },
  tapRight: { position: "absolute", right: 0, top: 100, bottom: 160, width: "60%", zIndex: 5 },

  // Bottom bar (non-owner)
  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 10,
    paddingHorizontal: 16, paddingTop: 8, gap: 8,
  },
  replyRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  replyInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
    color: "#fff", fontFamily: "Inter_400Regular", fontSize: 15,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
    minHeight: 44,
  },
  replySendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center",
  },
  replySentRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  replySentText: { color: "#10B981", fontFamily: "Inter_600SemiBold", fontSize: 14 },

  actionsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 4, paddingVertical: 4,
  },
  viewsBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  viewsText: { color: "rgba(255,255,255,0.9)", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  reactionBtns: { flexDirection: "row", gap: 8 },
  reactionBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center", justifyContent: "center",
  },

  // My story bottom
  myStoryBottom: {
    position: "absolute", left: 16, right: 16, zIndex: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  addMoreBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  addMoreText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  deleteStoryBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,59,92,0.2)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(255,59,92,0.5)",
  },
});

// Share modal styles
const ss = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, padding: 20, paddingBottom: 36, gap: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  miniAvatar: { width: 42, height: 42, borderRadius: 13, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  miniAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  userPhone: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 20 },
});
