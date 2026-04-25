import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  Keyboard,
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

const IMAGE_STORY_DURATION = 10000;

// ─── Purple rotating frame ───
function CloseFriendsFrame({ size = 68, children }: { size: number; children: React.ReactNode }) {
  const rotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotAnim, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true })
    );
    anim.start();
    return () => { anim.stop(); };
  }, []);

  const rotate = rotAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ rotate }],
        }}
      >
        <LinearGradient
          colors={["#8B5CF6", "#EC4899", "#6D28D9", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      </Animated.View>
      <View style={{ width: size - 6, height: size - 6, borderRadius: (size - 6) / 2, overflow: "hidden", backgroundColor: "#000" }}>
        {children}
      </View>
    </View>
  );
}

// ─── Video Player for Stories ───
function StoryVideoPlayer({
  uri,
  paused,
  onEnd,
}: {
  uri: string;
  paused: boolean;
  onEnd: () => void;
}) {
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    if (paused) player.pause();
    else player.play();
  }, [paused, player]);

  useEffect(() => {
    const sub = player.addListener("playToEnd", () => onEndRef.current());
    return () => sub.remove();
  }, [player]);

  return (
    <VideoView
      player={player}
      style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
      contentFit="cover"
      nativeControls={false}
      allowsFullscreen={false}
      allowsPictureInPicture={false}
    />
  );
}

function MentionCaption({ text, users }: { text: string; users: any[] }) {
  const parts: React.ReactNode[] = [];
  const regex = /@([\w\u0600-\u06FF]+)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const handle = match[1].toLowerCase();
    const mentioned = users.find((u) =>
      u.username?.toLowerCase() === handle ||
      u.name?.toLowerCase().replace(/\s+/g, "_") === handle ||
      u.email?.toLowerCase() === handle
    );
    parts.push(
      <Text
        key={`${match.index}-${match[0]}`}
        style={styles.captionMention}
        onPress={() => mentioned && router.push(`/profile/${mentioned.id}` as any)}
      >
        {match[0]}
      </Text>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <Text style={styles.captionText}>{parts}</Text>;
}

// ─── Share Story Modal ───
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
                  <Text style={[ss.userPhone, { color: colors.textSecondary }]}>@{item.username || item.email}</Text>
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
  const { userId, storyId: deepLinkStoryId } = useLocalSearchParams<{ userId: string; storyId?: string }>();
  const {
    users, getUserStories, viewStory, currentUser, theme,
    likeStory, replyToStory, deleteStory,
    shareContentToStory,
    isStoryEditorOpen,
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [addedToStory, setAddedToStory] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => { setKeyboardHeight(e.endCoordinates.height); });
    const hideSub = Keyboard.addListener(hideEvent, () => { setKeyboardHeight(0); });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const heartScale = useRef(new Animated.Value(1)).current;
  const elapsedRef = useRef(0);
  const pauseStartRef = useRef(0);

  const currentStory: Story | undefined = stories[currentIndex];
  const accentColor = ACCENT_COLORS[(user?.name?.length ?? 0) % ACCENT_COLORS.length];
  const isMyStory = currentUser?.id === userId;
  const isCloseFriends = !!currentStory?.isCloseFriends;

  // Users with active stories visible to the current user for safe auto-advance
  const usersWithStories = users.filter((u) => {
    const userStories = getUserStories(u.id);
    return userStories.length > 0;
  });
  const currentUserIndex = usersWithStories.findIndex((u) => u.id === userId);

  const storyDuration = currentStory?.mediaType === "video" ? 60000 : IMAGE_STORY_DURATION;

  // ─ pauseStoryTimer: stops the Animated timer SYNCHRONOUSLY before setting
  // paused state. This closes the race window where the completion callback
  // could fire handleNext() between setPaused(true) and the re-render.
  const pauseStoryTimer = useCallback(() => {
    animRef.current?.stop();
    setPaused(true);
  }, []);

  // ─ Deep link: jump to a specific story when navigated with ?storyId=
  useEffect(() => {
    if (!deepLinkStoryId || stories.length === 0) return;
    const idx = stories.findIndex((s) => s.id === deepLinkStoryId);
    if (idx >= 0 && idx !== currentIndex) {
      setCurrentIndex(idx);
    }
    // Only run when the param or story list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkStoryId, stories.length]);

  useEffect(() => { elapsedRef.current = 0; }, [currentIndex, currentStory?.id]);

  // Effective pause: local pause OR the story editor is open on top.
  // The editor flag is set by create-story while the user composes a repost
  // — without this, the underlying viewer's timer keeps running and the
  // story silently auto-advances or closes behind the editor.
  const effectivePaused = paused || isStoryEditorOpen;

  useEffect(() => {
    if (!currentStory) return;

    if (effectivePaused) {
      animRef.current?.stop();
      pauseStartRef.current = Date.now();
      return;
    }

    const remaining = storyDuration - elapsedRef.current;
    if (remaining <= 0) { handleNext(); return; }

    const startFraction = elapsedRef.current / storyDuration;
    progressAnim.setValue(startFraction);

    const startTime = Date.now();

    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: remaining,
      useNativeDriver: false,
    });

    animRef.current.start(({ finished }) => {
      if (finished) { elapsedRef.current = storyDuration; handleNext(); }
    });

    return () => {
      animRef.current?.stop();
      const segmentElapsed = Date.now() - startTime;
      elapsedRef.current = Math.min(storyDuration, elapsedRef.current + segmentElapsed);
    };
  }, [currentIndex, currentStory?.id, effectivePaused]);

  useEffect(() => {
    setReplySent(false);
    setReplyText("");
    setLiked(false);
    setAddedToStory(false);
    // Reset loading state per story so the spinner shows for each new image
    if (currentStory?.mediaType === "image" && currentStory.mediaUrl) {
      setMediaLoading(true);
    } else {
      setMediaLoading(false);
    }
  }, [currentIndex, currentStory?.id]);

  useEffect(() => {
    if (currentStory) viewStory(currentStory.id);
  }, [currentStory?.id]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      const nextUserIndex = currentUserIndex + 1;
      if (nextUserIndex < usersWithStories.length) {
        router.replace(`/story/${usersWithStories[nextUserIndex].id}` as any);
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

  const handleAddToMyStory = () => {
    if (!currentStory) return;
    // Stop animation immediately (synchronous) before the async state update,
    // preventing a race where the completion callback fires and triggers navigation
    // while the editor screen is opening on top of the viewer.
    animRef.current?.stop();
    setPaused(true);
    // Bug fix: chain originalStoryId so reposts of reposts still resolve to the
    // original story. If the current story is itself a repost, prefer its
    // originalStoryId; otherwise use the current story's id.
    const chainedOriginalStoryId =
      currentStory.sharedPost?.originalStoryId || currentStory.id;
    router.push({
      pathname: "/create-story",
      params: {
        sharedType: "story",
        sharedId: currentStory.id,
        originalStoryId: chainedOriginalStoryId,
        sharedMediaUrl: currentStory.mediaUrl,
        sharedCaption: currentStory.caption || "",
        sharedCreatorName: user?.username || user?.name || "",
        sharedCreatorId: userId,
        sharedCreatorAvatar: user?.avatar || "",
      },
    } as any);
  };

  const handleSharedPostPress = () => {
    if (!currentStory?.sharedPost) return;
    const sp = currentStory.sharedPost;
    const targetId = sp.originalStoryId || sp.id;
    if (sp.type === "story") {
      router.push(`/story/${sp.creatorId || userId}?storyId=${targetId}` as any);
      return;
    }
    if (sp.type === "reel") {
      router.push(`/(tabs)/reels?reelId=${sp.id}` as any);
    } else {
      router.push(`/post/${targetId}` as any);
    }
  };

  if (!user || stories.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: "#000", justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.4)" />
        <Text style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", marginTop: 12 }}>لا توجد قصص لعرضها</Text>
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

  const mentionedUsers = (currentStory.mentions || [])
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  const iAmMentioned = currentStory.mentions?.includes(currentUser?.id || "");

  return (
    <View style={styles.container}>
      {/* Background media — with explicit loading state so the screen never
          shows pure black while a remote image is decoding. */}
      {currentStory.mediaUrl ? (
        currentStory.mediaType === "video" ? (
          <StoryVideoPlayer uri={currentStory.mediaUrl} paused={effectivePaused} onEnd={handleNext} />
        ) : (
          <View style={styles.storyMedia}>
            {/* Soft accent gradient sits BEHIND the image so if the image is
                still loading or fails, the user sees a colored backdrop
                instead of a black void. */}
            <LinearGradient
              colors={[accentColor, "#0A0A14"]}
              style={StyleSheet.absoluteFill}
            />
            <Image
              source={{ uri: currentStory.mediaUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onLoadStart={() => setMediaLoading(true)}
              onLoadEnd={() => setMediaLoading(false)}
              onError={() => setMediaLoading(false)}
            />
            {mediaLoading && (
              <View style={styles.mediaLoadingOverlay}>
                <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
              </View>
            )}
            {currentStory.filter && currentStory.filter !== "none" && (() => {
              const filterOverlays: Record<string, string> = {
                warm: "rgba(255,140,0,0.25)",
                cool: "rgba(0,120,255,0.22)",
                vintage: "rgba(160,100,40,0.28)",
                grayscale: "rgba(0,0,0,0)",
              };
              const overlay = filterOverlays[currentStory.filter];
              return overlay ? (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: overlay, ...(currentStory.filter === "grayscale" && Platform.OS === "web" ? ({ filter: "grayscale(100%)" } as any) : {}) }]} />
              ) : null;
            })()}
          </View>
        )
      ) : (
        <LinearGradient colors={[accentColor, "#0A0A14"]} style={styles.storyMedia} />
      )}

      {/* Gradients */}
      <LinearGradient colors={["rgba(0,0,0,0.7)", "transparent"]} style={styles.topGrad} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.bottomGrad} />

      {/* Close Friends badge — absolutely positioned, never affects layout */}
      {isCloseFriends && (
        <View style={[styles.cfBadge, { top: topPad + 10 }]}>
          <Ionicons name="star" size={11} color="#8B5CF6" />
          <Text style={styles.cfBadgeText}>أصدقاء مقربون</Text>
        </View>
      )}

      {/* Progress bars — fixed Y position, never jumps */}
      <View style={[styles.progressRow, { top: topPad + 42 }]}>
        {stories.map((_, i) => (
          <View key={i} style={[styles.progressBar, { backgroundColor: "rgba(255,255,255,0.3)" }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: isCloseFriends ? "#8B5CF6" : "#fff",
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

      {/* User info row — fixed Y position, never jumps */}
      <View style={[styles.userRow, { top: topPad + 58 }]}>
        <TouchableOpacity
          onPress={() => { if (!isMyStory) router.push(`/profile/${userId}` as any); }}
          activeOpacity={isMyStory ? 1 : 0.85}
          style={styles.userInfoTouchable}
        >
          {isCloseFriends ? (
            <CloseFriendsFrame size={44}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: "100%", height: "100%", borderRadius: 20 }} />
              ) : (
                <View style={{ flex: 1, backgroundColor: `${accentColor}55`, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: accentColor, fontSize: 16, fontFamily: "Inter_700Bold" }}>{user.name[0]?.toUpperCase()}</Text>
                </View>
              )}
            </CloseFriendsFrame>
          ) : user.avatar ? (
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
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Shared post sticker */}
      {currentStory.sharedPost && (
        <TouchableOpacity style={styles.sharedSticker} onPress={handleSharedPostPress} activeOpacity={0.85}>
          <View style={styles.sharedStickerInner}>
            {currentStory.sharedPost.mediaUrl ? (
              <Image source={{ uri: currentStory.sharedPost.mediaUrl }} style={styles.sharedStickerThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.sharedStickerThumb, { backgroundColor: "#8B5CF644", alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name={currentStory.sharedPost.type === "reel" ? "film-outline" : "image-outline"} size={18} color="#8B5CF6" />
              </View>
            )}
            <View>
              <Text style={styles.sharedStickerLabel}>
                {currentStory.sharedPost.type === "story" ? "قصة" : currentStory.sharedPost.type === "reel" ? "مقطع" : "منشور"} • {currentStory.sharedPost.creatorName}
              </Text>
              <Text style={styles.sharedStickerTap}>اضغط للعرض</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
          </View>
        </TouchableOpacity>
      )}

      {/* Unbaked overlays (videos on native). Render at the EXACT position
          the user dragged them to in the editor. Older stored stories don't
          have x/y so they fall back to a centered stack below the user row. */}
      {currentStory.overlays?.map((overlay, index) => {
        const hasPosition =
          typeof overlay.x === "number" && typeof overlay.y === "number";
        const transforms: any[] = [];
        if (hasPosition) {
          transforms.push({ translateX: overlay.x as number });
          transforms.push({ translateY: overlay.y as number });
        }
        if (overlay.scale && overlay.scale !== 1) transforms.push({ scale: overlay.scale });
        if (overlay.rotation) transforms.push({ rotate: `${overlay.rotation}rad` });

        if (hasPosition) {
          return (
            <View
              key={`${overlay.text}-${index}`}
              pointerEvents="none"
              style={[
                styles.viewerOverlayPositioned,
                { transform: transforms },
              ]}
            >
              <Text style={styles.viewerOverlayText}>{overlay.text}</Text>
            </View>
          );
        }
        // Legacy fallback for older stories without position metadata
        return (
          <View
            key={`${overlay.text}-${index}`}
            style={[styles.viewerOverlayLabel, { top: `${34 + index * 9}%` as any }]}
          >
            <Text style={styles.viewerOverlayText}>{overlay.text}</Text>
          </View>
        );
      })}

      {/* Caption removed — text exists only as interactive overlays on media */}

      {/* Mentions display */}
      {mentionedUsers.length > 0 && !isMyStory && (
        <View style={[styles.mentionsRow, { bottom: isMyStory ? 60 : (iAmMentioned ? 155 : 90) }]}>
          {mentionedUsers.map((u) => u && (
            <TouchableOpacity
              key={u.id}
              style={styles.mentionChip}
              onPress={() => router.push(`/profile/${u.id}` as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="at" size={11} color="#8B5CF6" />
              <Text style={styles.mentionChipText}>{u.username || u.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* "Add to my Story" for mentioned user */}
      {iAmMentioned && !isMyStory && (
        <View style={[styles.addToStoryRow, { bottom: botPad + 130 }]}>
          <TouchableOpacity
            style={[styles.addToStoryBtn, addedToStory && styles.addToStoryBtnDone]}
            onPress={!addedToStory ? handleAddToMyStory : undefined}
            activeOpacity={0.85}
          >
            {addedToStory ? (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={[styles.addToStoryText, { color: "#10B981" }]}>تمت الإضافة</Text>
              </>
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={16} color="#fff" />
                <Text style={styles.addToStoryText}>مشاركة إلى قصتك</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom bar for non-owner */}
      {!isMyStory && (
        <View style={[styles.bottomBar, { paddingBottom: keyboardHeight > 0 ? 12 : botPad + 8, bottom: keyboardHeight }]}>
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
                  onFocus={() => pauseStoryTimer()}
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
                  <Ionicons name={liked ? "heart" : "heart-outline"} size={26} color={liked ? "#E1306C" : "#fff"} />
                </Animated.View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { pauseStoryTimer(); setShowShare(true); }}
                style={styles.reactionBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="paper-plane-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* My story: views + add more + delete */}
      {isMyStory && (
        <View style={[styles.myStoryBottom, { bottom: botPad + 16 }]}>
          <TouchableOpacity
            style={styles.viewsBadge}
            onPress={() => { pauseStoryTimer(); setShowViewers(true); }}
            activeOpacity={0.85}
          >
            <Ionicons name="eye-outline" size={15} color="rgba(255,255,255,0.85)" />
            <Text style={styles.viewsText}>{currentStory.viewerIds.length} مشاهدة</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/create-story")} style={styles.addMoreBtn}>
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
                      setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : 0);
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

      {/* Viewers Modal */}
      <Modal
        visible={showViewers}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowViewers(false); setPaused(false); }}
      >
        <Pressable style={ss.backdrop} onPress={() => { setShowViewers(false); setPaused(false); }} />
        <View style={[ss.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[ss.handle, { backgroundColor: colors.border }]} />
          <Text style={[ss.sheetTitle, { color: colors.text }]}>المشاهدون ({currentStory.viewerIds.length})</Text>
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
                    onPress={() => { setShowViewers(false); setPaused(false); router.push(`/profile/${viewer.id}` as any); }}
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
                      <Text style={[ss.userPhone, { color: colors.textSecondary }]}>@{viewer.username || viewer.email}</Text>
                    </View>
                    <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>

      {/* Tap areas */}
      <Pressable
        style={styles.tapLeft}
        onPress={handlePrev}
        onPressIn={() => pauseStoryTimer()}
        onPressOut={() => setPaused(false)}
        delayLongPress={150}
      />
      <Pressable
        style={styles.tapRight}
        onPress={handleNext}
        onPressIn={() => pauseStoryTimer()}
        onPressOut={() => setPaused(false)}
        delayLongPress={150}
      />

      <ShareStoryModal
        visible={showShare}
        onClose={() => { setShowShare(false); setPaused(false); }}
        storyId={currentStory.id}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  storyMedia: { ...StyleSheet.absoluteFillObject },
  topGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 200 },
  bottomGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 320 },
  cfBadge: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(139,92,246,0.25)",
    borderWidth: 1,
    borderColor: "#8B5CF6",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 12,
  },
  cfBadgeText: { color: "#8B5CF6", fontFamily: "Inter_600SemiBold", fontSize: 11 },
  progressRow: { position: "absolute", left: 12, right: 12, flexDirection: "row", gap: 4, zIndex: 10 },
  progressBar: { flex: 1, height: 2.5, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  pauseIndicator: {
    position: "absolute", top: "45%", alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 40, padding: 14, zIndex: 20,
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

  sharedSticker: {
    position: "absolute",
    bottom: 200,
    left: 20,
    right: 20,
    zIndex: 9,
  },
  sharedStickerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "#8B5CF655",
  },
  sharedStickerThumb: { width: 44, height: 44, borderRadius: 10, overflow: "hidden" },
  sharedStickerLabel: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 },
  sharedStickerTap: { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },

  captionWrap: { position: "absolute", left: 20, right: 20 },
  captionText: {
    color: "#fff", fontFamily: "Inter_500Medium", fontSize: 16, textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 8,
  },
  captionMention: { color: "#3D91F4", fontFamily: "Inter_700Bold" },
  viewerOverlayLabel: { position: "absolute", alignSelf: "center", backgroundColor: "rgba(0,0,0,0.42)", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(61,145,244,0.55)" },
  // Positioned overlays use the editor's pixel-space coords. Placing them at
  // 50%/50% then translating keeps the math identical to DraggableText where
  // x/y are pre-translation offsets relative to the canvas center.
  viewerOverlayPositioned: {
    position: "absolute",
    left: "50%",
    top: "50%",
    backgroundColor: "rgba(0,0,0,0.42)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(61,145,244,0.55)",
  },
  viewerOverlayText: { color: "#fff", fontFamily: "Inter_800ExtraBold", fontSize: 22, textAlign: "center", textShadowColor: "rgba(0,0,0,0.75)", textShadowRadius: 8 },
  mediaLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  mentionsRow: {
    position: "absolute", left: 20, right: 20,
    flexDirection: "row", flexWrap: "wrap", gap: 8, zIndex: 8,
  },
  mentionChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(139,92,246,0.3)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "#8B5CF655",
  },
  mentionChipText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 },

  addToStoryRow: {
    position: "absolute", left: 20, right: 20, zIndex: 9, alignItems: "center",
  },
  addToStoryBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(139,92,246,0.8)", borderRadius: 30,
    paddingHorizontal: 20, paddingVertical: 12,
    borderWidth: 1, borderColor: "#8B5CF6",
  },
  addToStoryBtnDone: { backgroundColor: "rgba(16,185,129,0.3)", borderColor: "#10B981" },
  addToStoryText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },

  bottomBar: { position: "absolute", left: 0, right: 0 },
  replyRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10 },
  replySentRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", paddingVertical: 12 },
  replySentText: { color: "#10B981", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  replyInput: {
    flex: 1, color: "#fff", fontFamily: "Inter_400Regular", fontSize: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
  },
  replySendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center",
  },
  actionsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 8,
  },
  viewsBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  viewsText: { color: "rgba(255,255,255,0.85)", fontFamily: "Inter_400Regular", fontSize: 13 },
  reactionBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  reactionBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  myStoryBottom: {
    position: "absolute", left: 16, right: 16,
    flexDirection: "row", alignItems: "center", gap: 12, justifyContent: "space-between",
  },
  addMoreBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  addMoreText: { color: "#fff", fontFamily: "Inter_500Medium", fontSize: 13 },
  deleteStoryBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  tapLeft: { position: "absolute", left: 0, top: 100, bottom: 160, width: "40%", zIndex: 5 },
  tapRight: { position: "absolute", right: 0, top: 100, bottom: 160, width: "60%", zIndex: 5 },
});

const ss = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 0.5,
    padding: 16, paddingBottom: 36, gap: 4,
  },
  handle: { width: 36, height: 3, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 16, textAlign: "center", marginBottom: 8 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  miniAvatar: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  miniAvatarText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  userPhone: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  emptyText: { textAlign: "center", fontFamily: "Inter_400Regular", paddingVertical: 20 },
});
