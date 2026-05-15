import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/themeStore";
import { useApp, isUserVerified } from "@/context/AppContext";
import type {
  MessageLocation,
  PrivateMessage,
  SharedContent,
  User,
} from "@/context/AppContext";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { AudioBubble } from "@/components/AudioBubble";



const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

// ───── Video Modal Player ─────
function VideoModalPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: "100%" }}
      contentFit="contain"
      nativeControls
    />
  );
}

function MediaFullscreenModal({
  visible,
  uri,
  type,
  onClose,
}: {
  visible: boolean;
  uri: string;
  type: "image" | "video";
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={mediaStyles.overlay}>
        <TouchableOpacity style={mediaStyles.closeBtn} onPress={onClose}>
          <Feather name="x" size={20} color="#fff" strokeWidth={1.5} />
        </TouchableOpacity>
        {type === "image" ? (
          <Image source={{ uri }} style={mediaStyles.fullImage} resizeMode="contain" />
        ) : (
          <View style={mediaStyles.videoWrap}>
            <VideoModalPlayer uri={uri} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const mediaStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.97)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 52,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  fullImage: { width: "100%", height: "80%" },
  videoWrap: { width: "100%", height: "80%", backgroundColor: "#000" },
});

// ───── Shared Content Preview — Full Bleed Card ─────
function SharedContentPreview({
  sharedContent,
  isMe,
}: {
  sharedContent: SharedContent;
  isMe: boolean;
}) {
  const { stories } = useApp();

  const LABELS: Record<string, string> = {
    post: "منشور",
    reel: "مقطع فيديو",
    story: "قصة",
  };

  const handleTap = () => {
    // Use router.navigate (NOT push) so tapping a shared post/reel/story
    // unwinds back to its existing screen if one is already in the stack
    // instead of layering a duplicate "new copy" on top. For reels this
    // reuses the reels tab and just updates the deep-link param.
    if (sharedContent.type === "post") {
      // Deep link to the home feed and scroll to the original post in place
      // instead of opening a separate /post/X screen. This matches the user's
      // expectation that tapping a shared post in chat focuses it inside the
      // existing feed (Instagram/TikTok behavior).
      router.navigate(`/(tabs)/?postId=${sharedContent.id}` as any);
    } else if (sharedContent.type === "reel") {
      // Deep link directly to the specific reel so the screen scrolls to it
      router.navigate(`/(tabs)/reels?reelId=${sharedContent.id}` as any);
    } else if (sharedContent.type === "story") {
      const story = stories.find((s) => s.id === sharedContent.id);
      if (story && story.expiresAt > Date.now()) {
        router.navigate(`/story/${story.creatorId}?storyId=${story.id}` as any);
      }
    }
  };

  // Only show image thumbnail for posts and stories — reel mediaUrl is a video file
  // which cannot be rendered as a static image, so we show a branded gradient instead.
  const showImage = sharedContent.mediaUrl && sharedContent.type !== "reel";
  const isReel = sharedContent.type === "reel";

  return (
    <TouchableOpacity
      onPress={handleTap}
      activeOpacity={0.88}
      style={sharedStyles.card}
    >
      {/* Full-bleed media area */}
      <View style={sharedStyles.mediaArea}>
        {showImage ? (
          <Image
            source={{ uri: sharedContent.mediaUrl! }}
            style={StyleSheet.absoluteFill as any}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={isReel ? ["#1a0533", "#4c1d95"] : ["#0d0d1a", "#1e1b4b"]}
            style={StyleSheet.absoluteFill as any}
          />
        )}
        {/* Icon overlay — centered play button for reels, image icon for others without media */}
        {(isReel || !showImage) && (
          <View style={sharedStyles.mediaIconOverlay}>
            <View style={sharedStyles.playBtnCircle}>
              <Feather
                name={isReel ? "play" : "image"}
                size={isReel ? 20 : 18}
                color="#fff"
                strokeWidth={2}
              />
            </View>
          </View>
        )}
        {/* Subtle dark gradient at bottom for text legibility */}
        {showImage && (
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            style={sharedStyles.mediaGradient}
          />
        )}
      </View>

      {/* Info strip */}
      <View style={[sharedStyles.infoStrip, { backgroundColor: isMe ? "rgba(255,255,255,0.12)" : useThemeStore.getState().tokens.card }]}>
        <Text style={[sharedStyles.typeChip, { color: isMe ? "rgba(255,255,255,0.55)" : useThemeStore.getState().tokens.textSecondary }]}>
          {LABELS[sharedContent.type]}
        </Text>
        {sharedContent.creatorName ? (
          <Text style={[sharedStyles.creatorName, { color: isMe ? "rgba(255,255,255,0.9)" : useThemeStore.getState().tokens.text }]} numberOfLines={1}>
            {sharedContent.creatorName}
          </Text>
        ) : null}
        {sharedContent.title ? (
          <Text style={[sharedStyles.caption, { color: isMe ? "rgba(255,255,255,0.6)" : useThemeStore.getState().tokens.textSecondary }]} numberOfLines={1}>
            {sharedContent.title}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const sharedStyles = StyleSheet.create({
  card: {
    width: 220,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 4,
  },
  mediaArea: {
    width: "100%",
    height: 155,
    backgroundColor: "#111",
    position: "relative",
  },
  mediaIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
  },
  infoStrip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  typeChip: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  creatorName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  caption: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

// ───── Story Reply Reference ─────
function StoryReplyRef({ storyId, isMe }: { storyId: string; isMe: boolean }) {
  const { stories } = useApp();
  const story = stories.find((s) => s.id === storyId);
  if (!story) return null;
  return (
    <TouchableOpacity
      onPress={() => router.push(`/story/${story.creatorId}` as any)}
      style={[storyRefStyles.wrap, { borderColor: isMe ? "rgba(255,255,255,0.3)" : useThemeStore.getState().tokens.border }]}
      activeOpacity={0.8}
    >
      <View style={storyRefStyles.thumb}>
        {story.mediaUrl ? (
          <Image source={{ uri: story.mediaUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill as any, { backgroundColor: "#7C3AED88" }]} />
        )}
      </View>
      <Text style={[storyRefStyles.label, { color: isMe ? "rgba(255,255,255,0.75)" : useThemeStore.getState().tokens.textSecondary }]}>
        رد على قصة
      </Text>
    </TouchableOpacity>
  );
}

const storyRefStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, borderWidth: 1, overflow: "hidden",
    marginBottom: 4, borderLeftWidth: 3, borderLeftColor: "#EC4899",
  },
  thumb: { width: 36, height: 36, overflow: "hidden" },
  label: { fontSize: 11, fontFamily: "Inter_500Medium", flex: 1 },
});

// ───── Reply Preview inside bubble ─────
function ReplyBubbleRef({
  replyToId,
  messages,
  isMe,
  onPress,
}: {
  replyToId: string;
  messages: PrivateMessage[];
  isMe: boolean;
  onPress: () => void;
}) {
  const original = messages.find((m) => m.id === replyToId);
  if (!original) return null;
  const preview =
    original.type === "image"
      ? "📷 صورة"
      : original.type === "video"
      ? "🎥 فيديو"
      : original.type === "audio"
      ? "🎙 رسالة صوتية"
      : original.type === "location"
      ? "📍 موقع"
      : original.content || "رسالة";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        replyRefStyles.wrap,
        {
          backgroundColor: isMe ? "rgba(255,255,255,0.08)" : "rgba(61,145,244,0.08)",
          borderLeftColor: isMe ? "rgba(255,255,255,0.5)" : useThemeStore.getState().tokens.accent ?? "#3D91F4",
        },
      ]}
    >
      <View style={replyRefStyles.accentBar} />
      <Text
        style={[replyRefStyles.text, { color: isMe ? "rgba(255,255,255,0.75)" : useThemeStore.getState().tokens.textSecondary }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {preview}
      </Text>
    </TouchableOpacity>
  );
}

const replyRefStyles = StyleSheet.create({
  wrap: {
    borderLeftWidth: 2.5, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    marginBottom: 4, maxHeight: 36, overflow: "hidden",
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  accentBar: { width: 2, height: 14, borderRadius: 1, backgroundColor: "transparent" },
  text: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
});

// ───── Location Bubble ─────
function LocationBubble({ location, isMe }: { location: MessageLocation; isMe: boolean }) {
  const openMap = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${location.latitude},${location.longitude}`,
      android: `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}`,
      default: `https://maps.google.com/?q=${location.latitude},${location.longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <TouchableOpacity onPress={openMap} activeOpacity={0.85} style={locStyles.wrap}>
      <View style={[locStyles.map, { backgroundColor: isMe ? "rgba(255,255,255,0.15)" : "#1C1C1E" }]}>
        <View style={locStyles.mapInner}>
          <View style={locStyles.gridH} />
          <View style={locStyles.gridV} />
          <View style={locStyles.pin}>
            <Feather name="map-pin" size={24} color="#FF3B5C" />
          </View>
        </View>
      </View>
      <View style={locStyles.footer}>
        <Feather name="map-pin" size={13} color={isMe ? "rgba(255,255,255,0.8)" : "#3D91F4"} />
        <Text style={[locStyles.label, { color: isMe ? "rgba(255,255,255,0.8)" : "#3D91F4" }]}>
          افتح الموقع
        </Text>
        <Text style={[locStyles.coords, { color: isMe ? "rgba(255,255,255,0.5)" : useThemeStore.getState().tokens.textSecondary }]}>
          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const locStyles = StyleSheet.create({
  wrap: { borderRadius: 14, overflow: "hidden", minWidth: 200 },
  map: { height: 110, alignItems: "center", justifyContent: "center" },
  mapInner: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  gridH: { position: "absolute", width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.08)", top: "50%" },
  gridV: { position: "absolute", height: "100%", width: 1, backgroundColor: "rgba(255,255,255,0.08)", left: "50%" },
  pin: { alignItems: "center", justifyContent: "center" },
  footer: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  coords: { fontSize: 10, fontFamily: "Inter_400Regular" },
});

// ───── Reaction Bar Modal ─────
function ReactionModal({
  visible,
  onClose,
  onReact,
}: {
  visible: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const ALL_EMOJIS = [
    "❤️","😂","😮","😢","😡","👍","🔥","🎉","😍","🥺",
    "😭","🤣","😊","😎","🤔","😏","😤","🥳","😘","👏",
    "💪","🙏","🤝","💯","✨","🌟","💔","😴","🫡","🫶",
  ];
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={reactStyles.backdrop} onPress={onClose} />
      <View style={reactStyles.sheet}>
        {showAll ? (
          <View style={reactStyles.allGrid}>
            {ALL_EMOJIS.map((e) => (
              <TouchableOpacity key={e} onPress={() => { onReact(e); onClose(); setShowAll(false); }} style={reactStyles.emojiBtn}>
                <Text style={reactStyles.emoji}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={reactStyles.quickRow}>
            {QUICK_EMOJIS.map((e) => (
              <TouchableOpacity key={e} onPress={() => { onReact(e); onClose(); }} style={reactStyles.emojiBtn}>
                <Text style={reactStyles.emoji}>{e}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowAll(true)}
              style={[reactStyles.emojiBtn, { backgroundColor: "#2C2C2E" }]}
            >
              <Feather name="plus" size={18} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const reactStyles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    position: "absolute",
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  quickRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  allGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 4 },
  emojiBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  emoji: { fontSize: 24 },
});

// ───── Long Press Context Menu ─────
function MessageContextMenu({
  visible,
  msg,
  isMe,
  onClose,
  onDeleteForMe,
  onDeleteForBoth,
  onReply,
  onPin,
  onForward,
}: {
  visible: boolean;
  msg: PrivateMessage | null;
  isMe: boolean;
  onClose: () => void;
  onDeleteForMe: () => void;
  onDeleteForBoth: () => void;
  onReply: () => void;
  onPin: () => void;
  onForward: () => void;
}) {
  if (!visible || !msg) return null;
  const isPinned = msg.isPinned;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={ctxStyles.backdrop} onPress={onClose} />
      <View style={ctxStyles.sheet}>
        <View style={ctxStyles.handle} />

        <TouchableOpacity style={ctxStyles.item} onPress={() => { onReply(); onClose(); }}>
          <View style={[ctxStyles.icon, { backgroundColor: "#3D91F422" }]}>
            <Feather name="corner-up-left" size={17} color="#3D91F4" strokeWidth={1.5} />
          </View>
          <Text style={ctxStyles.label}>رد</Text>
        </TouchableOpacity>

        <TouchableOpacity style={ctxStyles.item} onPress={() => { onPin(); onClose(); }}>
          <View style={[ctxStyles.icon, { backgroundColor: "#F59E0B22" }]}>
            <Feather name="bookmark" size={17} color="#F59E0B" strokeWidth={1.5} />
          </View>
          <Text style={ctxStyles.label}>{isPinned ? "إلغاء التثبيت" : "تثبيت"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={ctxStyles.item} onPress={() => { onForward(); onClose(); }}>
          <View style={[ctxStyles.icon, { backgroundColor: "#10B98122" }]}>
            <Feather name="share" size={17} color="#10B981" strokeWidth={1.5} />
          </View>
          <Text style={ctxStyles.label}>مشاركة / تحويل</Text>
        </TouchableOpacity>

        <View style={ctxStyles.sep} />

        <TouchableOpacity style={ctxStyles.item} onPress={() => { onDeleteForMe(); onClose(); }}>
          <View style={[ctxStyles.icon, { backgroundColor: "#EF444422" }]}>
            <Feather name="trash-2" size={17} color="#EF4444" strokeWidth={1.5} />
          </View>
          <Text style={[ctxStyles.label, { color: "#EF4444" }]}>حذف عندي</Text>
        </TouchableOpacity>

        {isMe && (
          <TouchableOpacity style={ctxStyles.item} onPress={() => { onDeleteForBoth(); onClose(); }}>
            <View style={[ctxStyles.icon, { backgroundColor: "#EF444422" }]}>
              <Feather name="trash" size={17} color="#EF4444" strokeWidth={1.5} />
            </View>
            <Text style={[ctxStyles.label, { color: "#EF4444" }]}>حذف عند الطرفين</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const ctxStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#121212",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 4,
    borderWidth: 1,
    borderColor: "#262626",
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#262626", alignSelf: "center", marginBottom: 12 },
  item: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 4 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#FFFFFF" },
  sep: { height: 1, backgroundColor: "#262626", marginVertical: 4 },
});

// ───── Forward Message Picker ─────
function ForwardPicker({
  visible,
  conversations,
  currentUserId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  conversations: any[];
  currentUserId: string;
  onSelect: (convoId: string, receiverId: string) => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)" }} onPress={onClose} />
      <View style={fwdStyles.sheet}>
        <View style={fwdStyles.handle} />
        <Text style={fwdStyles.title}>تحويل إلى</Text>
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          style={{ maxHeight: 320 }}
          renderItem={({ item }) => {
            const other = item.participantUsers?.find((u: User) => u.id !== currentUserId);
            if (!other) return null;
            return (
              <TouchableOpacity
                style={fwdStyles.row}
                onPress={() => { onSelect(item.id, other.id); onClose(); }}
              >
                <View style={fwdStyles.avatar}>
                  {other.avatar ? (
                    <Image source={{ uri: other.avatar }} style={{ width: "100%", height: "100%", borderRadius: 20 }} />
                  ) : (
                    <Text style={{ color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" }}>
                      {other.name?.[0]?.toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={fwdStyles.name}>{other.name}</Text>
                <Feather name="chevron-right" size={16} color="#8E8E93" />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const fwdStyles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: "#121212",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
    borderWidth: 1, borderColor: "#262626",
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#262626", alignSelf: "center", marginBottom: 12 },
  title: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#2C2C2E", alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  name: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: "#FFFFFF" },
});

// ───── Recording Indicator ─────
function RecordingIndicator({ duration }: { duration: number }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={[recStyles.container, { backgroundColor: "#1C1C1C" }]}>
      <Animated.View style={[recStyles.dot, { transform: [{ scale: pulseAnim }] }]} />
      <Text style={[recStyles.text, { color: "#FFFFFF" }]}>
        جاري التسجيل... {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
      </Text>
      <Text style={[recStyles.hint, { color: "#8E8E93" }]}>أفلت للإرسال</Text>
    </View>
  );
}

const recStyles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderRadius: 18, minHeight: 44 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E1306C" },
  text: { fontFamily: "Inter_500Medium", fontSize: 14 },
  hint: { fontFamily: "Inter_400Regular", fontSize: 12, marginLeft: "auto" },
});

// ───── Swipeable Message Row ─────
function SwipeableMessage({
  children,
  onSwipe,
  isMe,
}: {
  children: React.ReactNode;
  onSwipe: () => void;
  isMe: boolean;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const swipedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx > 0 && g.dx < 80) {
          translateX.setValue(g.dx);
          if (g.dx > 50 && !swipedRef.current) {
            swipedRef.current = true;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 50) onSwipe();
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        swipedRef.current = false;
      },
    })
  ).current;

  return (
    <Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
}

// ───── Message Bubble ─────
function MessageBubble({
  msg,
  isMe,
  accentColor,
  allMessages,
  onMediaPress,
  onLongPress,
  onTap,
  onReplyScrollTo,
  senderUser,
}: {
  msg: PrivateMessage;
  isMe: boolean;
  accentColor: string;
  allMessages: PrivateMessage[];
  onMediaPress: (uri: string, type: "image" | "video") => void;
  onLongPress: (msg: PrivateMessage) => void;
  onTap: (msg: PrivateMessage) => void;
  onReplyScrollTo: (msgId: string) => void;
  senderUser?: User;
}) {
  const c = useThemeStore((s) => s.tokens);
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;

  return (
    <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
      {!isMe && (
        <View style={[styles.msgAvatar, { backgroundColor: `${accentColor}25` }]}>
          {senderUser?.avatar ? (
            <Image source={{ uri: senderUser.avatar }} style={styles.msgAvatarImg} />
          ) : (
            <Text style={[styles.msgAvatarText, { color: accentColor }]}>
              {(senderUser?.name?.[0] ?? "?").toUpperCase()}
            </Text>
          )}
        </View>
      )}
      <View style={styles.msgBubbleCol}>
        {!isMe && senderUser && (
          <Text style={[styles.msgSenderName, { color: accentColor }]}>{senderUser.name}</Text>
        )}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onTap(msg)}
          onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onLongPress(msg); }}
          delayLongPress={350}
        >
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: isMe ? accentColor : c.card,
                borderColor: isMe ? "transparent" : c.border,
              },
            ]}
          >
            {msg.storyRef && <StoryReplyRef storyId={msg.storyRef} isMe={isMe} />}
            {msg.replyToId && (
              <ReplyBubbleRef
                replyToId={msg.replyToId}
                messages={allMessages}
                isMe={isMe}
                onPress={() => onReplyScrollTo(msg.replyToId!)}
              />
            )}

            {msg.type === "shared" && msg.sharedContent ? (
              <SharedContentPreview sharedContent={msg.sharedContent} isMe={isMe} />
            ) : msg.type === "location" && msg.location ? (
              <LocationBubble location={msg.location} isMe={isMe} />
            ) : msg.type === "image" && msg.mediaUrl ? (
              <TouchableOpacity
                style={styles.msgImageWrap}
                onPress={() => onMediaPress(msg.mediaUrl!, "image")}
                activeOpacity={0.9}
              >
                <Image source={{ uri: msg.mediaUrl }} style={styles.msgImage} resizeMode="cover" />
                <View style={styles.mediaExpandIcon}>
                  <Feather name="maximize" size={12} color="#fff" strokeWidth={1.5} />
                </View>
              </TouchableOpacity>
            ) : msg.type === "video" && msg.mediaUrl ? (
              <TouchableOpacity
                style={styles.msgVideoWrap}
                onPress={() => onMediaPress(msg.mediaUrl!, "video")}
                activeOpacity={0.9}
              >
                <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000", alignItems: "center", justifyContent: "center" }]}>
                  <Feather name="play" size={40} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
                </View>
                <View style={styles.mediaExpandIcon}>
                  <Feather name="maximize" size={12} color="#fff" strokeWidth={1.5} />
                </View>
              </TouchableOpacity>
            ) : msg.type === "audio" ? (
              <AudioBubble msg={msg} isMe={isMe} />
            ) : null}

            {msg.content ? (
              <Text style={[styles.bubbleText, { color: isMe ? "#fff" : c.text }]}>{msg.content}</Text>
            ) : null}

            <Text style={[styles.bubbleTime, { color: isMe ? "rgba(255,255,255,0.6)" : c.textSecondary }]}>
              {formatTime(msg.timestamp)}
              {isMe && <DeliveryStatus msg={msg} onLightBg={!isMe} />}
            </Text>
          </View>

          {hasReactions && (
            <View style={[styles.reactionsRow, isMe ? { justifyContent: "flex-end" } : {}]}>
              {Object.entries(msg.reactions!).map(([emoji, users]) => (
                <View key={emoji} style={[styles.reactionChip, { borderColor: c.border }]}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  {users.length > 1 && <Text style={[styles.reactionCount, { color: c.textSecondary }]}>{users.length}</Text>}
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * DeliveryStatus
 * ──────────────
 * Renders the WhatsApp-style delivery indicator next to the timestamp on
 * outgoing messages:
 *   • spinner — message just sent (<1.5s old) and not yet acknowledged
 *   • single grey ✓ — delivered, not yet read
 *   • double green ✓✓ — read by the recipient
 * Re-renders every 500ms while the spinner is showing so the transition
 * happens even if no new context update arrives.
 */
function DeliveryStatus({ msg, onLightBg }: { msg: PrivateMessage; onLightBg: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  const sending = !msg.read && (now - msg.timestamp < 1500);
  useEffect(() => {
    if (!sending) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [sending]);

  if (sending) {
    return (
      <Text> <ActivityIndicator size="small" color={onLightBg ? "#8E8E93" : "rgba(255,255,255,0.7)"} /></Text>
    );
  }
  if (msg.read) {
    return <Text style={{ color: "#34D399" }}> ✓✓</Text>;
  }
  return <Text style={{ color: onLightBg ? "#8E8E93" : "rgba(255,255,255,0.6)" }}> ✓</Text>;
}

// ───── Chat Screen ─────
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    conversations, currentUser, sendPrivateMessage,
    blockUser, unblockUser, isBlocked, t, theme,
    deleteMessage, pinMessage, addReaction,
    deleteConversation, markConversationRead,
    archiveConversation, unarchiveConversation, setConversationTheme,
  } = useApp();
  const colors = useColors();
  const c = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [mediaModal, setMediaModal] = useState<{ uri: string; type: "image" | "video" } | null>(null);

  // Recording
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Long press context menu
  const [contextMsg, setContextMsg] = useState<PrivateMessage | null>(null);
  const [showContext, setShowContext] = useState(false);

  // Reaction modal
  const [reactionMsg, setReactionMsg] = useState<PrivateMessage | null>(null);
  const [showReaction, setShowReaction] = useState(false);

  // Reply state
  const [replyTo, setReplyTo] = useState<PrivateMessage | null>(null);

  // Forward picker
  const [showForward, setShowForward] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<PrivateMessage | null>(null);

  // Three-dots overflow menu (replaces the old block-only modal). Holds the
  // sub-modal state for the destructive confirmations as well.
  const [showMenu, setShowMenu] = useState(false);
  const [menuConfirm, setMenuConfirm] = useState<null | "block" | "delete">(null);
  const [showThemePicker, setShowThemePicker] = useState(false);

  // GPS loading
  const [locLoading, setLocLoading] = useState(false);

  // Mark this conversation as read whenever the screen gains focus AND on
  // every incoming-message arrival while focused. The double trigger handles
  // the WhatsApp-style "open chat → unread badge clears immediately" UX even
  // for messages that stream in via WebSocket while the screen is open.
  useFocusEffect(
    useCallback(() => {
      if (id) markConversationRead(id);
      return () => {
        if (recordingRef.current) {
          recordingRef.current.stopAndUnloadAsync().catch(() => {});
          recordingRef.current = null;
        }
        if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
        setIsRecording(false);
        setRecordingDuration(0);
        Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
      };
    }, [id, markConversationRead])
  );

  const convo = conversations.find((c) => c.id === id) as any;
  const allMessages: PrivateMessage[] = convo?.messages || [];
  const otherUser: User | undefined = convo?.participantUsers?.find(
    (u: User) => u.id !== currentUser?.id
  );
  // The user's per-conversation override (set via the menu sheet) takes
  // priority; fall back to a stable color derived from the other user's name.
  const accentColor =
    convo?.themeColor ?? ACCENT_COLORS[(otherUser?.name?.length || 0) % ACCENT_COLORS.length];

  // Re-mark as read whenever an unread incoming message appears while the
  // screen is mounted (covers messages streamed in over the WebSocket while
  // the user is already viewing the chat).
  const lastIncomingTs = allMessages.reduce<number>((acc, m) => {
    if (m.senderId !== currentUser?.id && !m.read && m.timestamp > acc) return m.timestamp;
    return acc;
  }, 0);
  useEffect(() => {
    if (id && lastIncomingTs > 0) markConversationRead(id);
  }, [id, lastIncomingTs, markConversationRead]);

  // Filter out deleted messages
  const messages = allMessages.filter((m) => {
    if (m.deletedFor?.includes("ALL")) return false;
    if (m.deletedFor?.includes(currentUser?.id || "")) return false;
    return true;
  });

  const pinnedMsg = messages.find((m) => m.isPinned);

  const scrollToPinned = () => {
    if (!pinnedMsg) return;
    const reversedMessages = [...messages].reverse();
    const idx = reversedMessages.findIndex((m) => m.id === pinnedMsg.id);
    if (idx >= 0) {
      flatRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
  };

  const scrollToMessage = (msgId: string) => {
    const reversedMessages = [...messages].reverse();
    const idx = reversedMessages.findIndex((m) => m.id === msgId);
    if (idx >= 0) {
      flatRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
  };

  const handleSend = () => {
    if (!message.trim() || !otherUser) return;
    sendPrivateMessage(
      id, otherUser.id, message.trim(), "text",
      undefined, undefined, undefined, undefined,
      replyTo?.id
    );
    setMessage("");
    setReplyTo(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePickImage = async () => {
    setShowAttach(false);
    if (Platform.OS === "web") { Alert.alert("", "رفع الصور غير مدعوم على الويب"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, quality: 0.6,
    });
    if (!result.canceled && result.assets[0] && otherUser) {
      sendPrivateMessage(id, otherUser.id, "", "image", result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePickVideo = async () => {
    setShowAttach(false);
    if (Platform.OS === "web") { Alert.alert("", "رفع الفيديو غير مدعوم على الويب"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false, quality: 0.5,
    });
    if (!result.canceled && result.assets[0] && otherUser) {
      sendPrivateMessage(id, otherUser.id, "", "video", result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleSendLocation = async () => {
    setShowAttach(false);
    if (Platform.OS === "web") { Alert.alert("", "مشاركة الموقع غير مدعومة على الويب"); return; }
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("", "يرجى السماح بالوصول للموقع"); return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (otherUser) {
        sendPrivateMessage(
          id, otherUser.id, "", "location",
          undefined, undefined, undefined, undefined, undefined,
          { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("", "تعذر الحصول على موقعك الحالي");
    } finally {
      setLocLoading(false);
    }
  };

  const handleStartRecording = async () => {
    if (Platform.OS === "web") { Alert.alert("", "التسجيل الصوتي غير مدعوم على الويب"); return; }
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") { Alert.alert("", "يرجى السماح باستخدام الميكروفون"); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      recordTimerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { Alert.alert("", "تعذر بدء التسجيل الصوتي"); }
  };

  const handleStopRecording = async () => {
    if (!recordingRef.current) return;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    const duration = recordingDuration;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      if (uri && otherUser && duration > 0) {
        sendPrivateMessage(id, otherUser.id, "", "audio", uri, duration);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch { recordingRef.current = null; }
    setRecordingDuration(0);
  };

  // Long press handlers
  const handleLongPress = (msg: PrivateMessage) => {
    setContextMsg(msg);
    setShowContext(true);
  };

  const handleTap = (msg: PrivateMessage) => {
    setReactionMsg(msg);
    setShowReaction(true);
  };

  const handleDeleteForMe = () => {
    if (!contextMsg) return;
    deleteMessage(id, contextMsg.id, false);
  };

  const handleDeleteForBoth = () => {
    if (!contextMsg) return;
    Alert.alert("حذف عند الطرفين", "هل أنت متأكد؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => deleteMessage(id, contextMsg.id, true) },
    ]);
  };

  const handleReply = () => {
    if (!contextMsg) return;
    setReplyTo(contextMsg);
  };

  const handlePin = () => {
    if (!contextMsg) return;
    pinMessage(id, contextMsg.id);
  };

  const handleForwardOpen = () => {
    if (!contextMsg) return;
    setForwardMsg(contextMsg);
    setShowForward(true);
  };

  const handleForwardSend = (convoId: string, receiverId: string) => {
    if (!forwardMsg) return;
    sendPrivateMessage(convoId, receiverId, forwardMsg.content, forwardMsg.type as any, forwardMsg.mediaUrl, forwardMsg.duration, forwardMsg.sharedContent);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleReact = (emoji: string) => {
    if (!reactionMsg) return;
    addReaction(id, reactionMsg.id, emoji);
  };

  if (!convo) {
    return (
      <View style={[styles.container, { backgroundColor: c.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: c.textSecondary }}>المحادثة غير موجودة</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: useThemeStore.getState().tokens.accent, marginTop: 12 }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[`${accentColor}20`, "transparent"]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <Feather name="arrow-left" size={20} color={c.text} strokeWidth={1.5} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => otherUser && router.push(`/profile/${otherUser.id}`)}>
            <View style={[styles.headerAvatar, { backgroundColor: `${accentColor}33` }]}>
              {otherUser?.avatar ? (
                <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatarImg} />
              ) : (
                <Text style={[styles.headerAvatarText, { color: accentColor }]}>
                  {otherUser?.name[0]?.toUpperCase()}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerInfo}
            onPress={() => otherUser && router.push(`/chat/info/${id}` as any)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={[styles.headerName, { color: c.text }]}>{otherUser?.name}</Text>
              {isUserVerified(otherUser) && <VerifiedBadge size={14} />}
            </View>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={[styles.onlineText, { color: c.textSecondary }]}>{t("online")}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.callBtns}>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: `${accentColor}22` }]}
              onPress={() => {
                if (!otherUser) return;
                router.push({
                  pathname: "/call/[id]",
                  params: {
                    id: otherUser.id,
                    type: "audio",
                    name: encodeURIComponent(otherUser.name || ""),
                    avatar: encodeURIComponent(otherUser.avatar || ""),
                  },
                } as any);
              }}
            >
              <Feather name="phone" size={18} color={accentColor} strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: `${accentColor}22` }]}
              onPress={() => {
                if (!otherUser) return;
                router.push({
                  pathname: "/call/[id]",
                  params: {
                    id: otherUser.id,
                    type: "video",
                    name: encodeURIComponent(otherUser.name || ""),
                    avatar: encodeURIComponent(otherUser.avatar || ""),
                  },
                } as any);
              }}
            >
              <Feather name="video" size={18} color={accentColor} strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowMenu(true)}
              style={[styles.callBtn, { backgroundColor: c.backgroundTertiary }]}
            >
              <Feather name="more-vertical" size={18} color={c.textSecondary} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Pinned Message Banner */}
      {pinnedMsg && (
        <TouchableOpacity
          style={pinStyles.banner}
          onPress={scrollToPinned}
          activeOpacity={0.85}
        >
          <Feather name="bookmark" size={14} color="#F59E0B" strokeWidth={1.5} />
          <View style={{ flex: 1 }}>
            <Text style={pinStyles.pinLabel}>رسالة مثبتة</Text>
            <Text style={[pinStyles.pinText, { color: c.textSecondary }]} numberOfLines={1}>
              {pinnedMsg.type === "image" ? "📷 صورة" :
               pinnedMsg.type === "video" ? "🎥 فيديو" :
               pinnedMsg.type === "audio" ? "🎙 رسالة صوتية" :
               pinnedMsg.type === "location" ? "📍 موقع" :
               pinnedMsg.content}
            </Text>
          </View>
          <Feather name="chevron-down" size={14} color={c.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatRef}
          data={[...messages].reverse()}
          keyExtractor={(m) => m.id}
          inverted
          contentContainerStyle={[styles.msgList, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={() => {}}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Feather name="message-circle" size={40} color={c.border} strokeWidth={1} />
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", marginTop: 8 }}>
                ابدأ المحادثة
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <SwipeableMessage
              onSwipe={() => setReplyTo(item)}
              isMe={item.senderId === currentUser?.id}
            >
              <MessageBubble
                msg={item}
                isMe={item.senderId === currentUser?.id}
                accentColor={accentColor}
                allMessages={messages}
                onMediaPress={(uri, type) => setMediaModal({ uri, type })}
                onLongPress={handleLongPress}
                onTap={handleTap}
                onReplyScrollTo={scrollToMessage}
                senderUser={item.senderId === currentUser?.id ? undefined : otherUser}
              />
            </SwipeableMessage>
          )}
        />

        {/* Reply Preview Bar */}
        {replyTo && (
          <View style={replyBarStyles.bar}>
            <Feather name="corner-up-left" size={14} color={useThemeStore.getState().tokens.accent} />
            <View style={{ flex: 1 }}>
              <Text style={replyBarStyles.label}>رد على</Text>
              <Text style={[replyBarStyles.preview, { color: c.textSecondary }]} numberOfLines={1}>
                {replyTo.type === "image" ? "📷 صورة" :
                 replyTo.type === "video" ? "🎥 فيديو" :
                 replyTo.type === "audio" ? "🎙 رسالة صوتية" :
                 replyTo.type === "location" ? "📍 موقع" :
                 replyTo.content}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Feather name="x" size={18} color={c.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Attachment Menu */}
        {showAttach && !isRecording && (
          <View style={[styles.attachMenu, { backgroundColor: c.card, borderColor: c.border }]}>
            <TouchableOpacity
              onPress={handlePickImage}
              style={[styles.attachItem, { backgroundColor: `${useThemeStore.getState().tokens.accent}18` }]}
            >
              <Feather name="image" size={22} color={useThemeStore.getState().tokens.accent} strokeWidth={1.5} />
              <Text style={[styles.attachLabel, { color: useThemeStore.getState().tokens.accent }]}>صورة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickVideo}
              style={[styles.attachItem, { backgroundColor: "#E1306C18" }]}
            >
              <Feather name="video" size={22} color="#E1306C" strokeWidth={1.5} />
              <Text style={[styles.attachLabel, { color: "#E1306C" }]}>فيديو</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSendLocation}
              style={[styles.attachItem, { backgroundColor: `${useThemeStore.getState().tokens.success}18` }]}
            >
              {locLoading ? (
                <Feather name="loader" size={22} color={useThemeStore.getState().tokens.success} strokeWidth={1.5} />
              ) : (
                <Feather name="map-pin" size={22} color={useThemeStore.getState().tokens.success} strokeWidth={1.5} />
              )}
              <Text style={[styles.attachLabel, { color: useThemeStore.getState().tokens.success }]}>موقعي</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Bar */}
        <View
          style={[
            styles.inputBar,
            { paddingBottom: botPad + 8, backgroundColor: c.card, borderTopColor: c.border },
          ]}
        >
          {!isRecording ? (
            <>
              <TouchableOpacity
                onPress={() => setShowAttach((v) => !v)}
                style={[styles.attachBtn, { backgroundColor: showAttach ? `${c.accent}22` : c.card }]}
              >
                <Feather
                  name={showAttach ? "x" : "paperclip"}
                  size={20}
                  color={showAttach ? c.accent : c.textSecondary}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>

              <View style={[styles.inputWrapper, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}>
                <TextInput
                  style={[styles.input, { color: c.text, fontFamily: "Inter_400Regular" }]}
                  placeholder={t("typeMessage")}
                  placeholderTextColor={c.textSecondary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  textAlign="right"
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
              </View>

              {message.trim() ? (
                <TouchableOpacity onPress={handleSend} style={[styles.sendBtn, { backgroundColor: accentColor }]}>
                  <Feather name="send" size={18} color="#fff" strokeWidth={1.5} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onLongPress={handleStartRecording}
                  delayLongPress={200}
                  style={[styles.sendBtn, { backgroundColor: c.backgroundTertiary }]}
                >
                  <Feather name="mic" size={22} color={c.textSecondary} strokeWidth={1.5} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <RecordingIndicator duration={recordingDuration} />
              <TouchableOpacity onPress={handleStopRecording} style={[styles.sendBtn, { backgroundColor: "#E1306C" }]}>
                <Feather name="stop-circle" size={22} color="#fff" strokeWidth={1.5} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Media Fullscreen */}
      {mediaModal && (
        <MediaFullscreenModal
          visible={!!mediaModal}
          uri={mediaModal.uri}
          type={mediaModal.type}
          onClose={() => setMediaModal(null)}
        />
      )}

      {/* Long Press Context Menu */}
      <MessageContextMenu
        visible={showContext}
        msg={contextMsg}
        isMe={contextMsg?.senderId === currentUser?.id}
        onClose={() => setShowContext(false)}
        onDeleteForMe={handleDeleteForMe}
        onDeleteForBoth={handleDeleteForBoth}
        onReply={handleReply}
        onPin={handlePin}
        onForward={handleForwardOpen}
      />

      {/* Reaction Modal */}
      <ReactionModal
        visible={showReaction}
        onClose={() => setShowReaction(false)}
        onReact={handleReact}
      />

      {/* Forward Picker */}
      <ForwardPicker
        visible={showForward}
        conversations={conversations}
        currentUserId={currentUser?.id || ""}
        onSelect={handleForwardSend}
        onClose={() => setShowForward(false)}
      />

      {/* ───── Overflow Menu (three-dots) ───── */}
      {/* The single sheet now hosts: chat-color picker entry, archive toggle,
          delete chat, block / unblock. Destructive actions hand off to a
          separate confirmation modal so the user can't fat-finger them. */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={blockModalStyles.backdrop} onPress={() => setShowMenu(false)} />
        <View style={[menuStyles.sheet, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[blockModalStyles.handle, { backgroundColor: c.border }]} />
          <Text style={[menuStyles.heading, { color: c.text }]}>{otherUser?.name}</Text>

          <TouchableOpacity
            style={menuStyles.row}
            onPress={() => { setShowMenu(false); setShowThemePicker(true); }}
            activeOpacity={0.7}
          >
            <View style={[menuStyles.iconWrap, { backgroundColor: `${accentColor}22` }]}>
              <Feather name="droplet" size={18} color={accentColor} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[menuStyles.rowTitle, { color: c.text }]}>لون المحادثة</Text>
              <Text style={[menuStyles.rowSub, { color: c.textSecondary }]}>اختر لون مميز للخلفية</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={menuStyles.row}
            onPress={() => {
              setShowMenu(false);
              if (!convo) return;
              if (convo.archived) unarchiveConversation(id);
              else archiveConversation(id);
            }}
            activeOpacity={0.7}
          >
            <View style={[menuStyles.iconWrap, { backgroundColor: "#F59E0B22" }]}>
              <Feather name="archive" size={18} color="#F59E0B" strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[menuStyles.rowTitle, { color: c.text }]}>
                {convo?.archived ? "إلغاء الأرشفة" : "أرشفة المحادثة"}
              </Text>
              <Text style={[menuStyles.rowSub, { color: c.textSecondary }]}>
                {convo?.archived ? "إعادة المحادثة إلى القائمة الرئيسية" : "إخفاء المحادثة من القائمة الرئيسية"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={menuStyles.row}
            onPress={() => { setShowMenu(false); setMenuConfirm("delete"); }}
            activeOpacity={0.7}
          >
            <View style={[menuStyles.iconWrap, { backgroundColor: "#FF3B5C22" }]}>
              <Feather name="trash-2" size={18} color="#FF3B5C" strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[menuStyles.rowTitle, { color: c.text }]}>حذف المحادثة</Text>
              <Text style={[menuStyles.rowSub, { color: c.textSecondary }]}>سيتم حذف الرسائل لديك فقط</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={menuStyles.row}
            onPress={() => { setShowMenu(false); setMenuConfirm("block"); }}
            activeOpacity={0.7}
          >
            <View style={[menuStyles.iconWrap, { backgroundColor: otherUser && isBlocked(otherUser.id) ? "#10B98122" : "#FF3B5C22" }]}>
              <Feather
                name={otherUser && isBlocked(otherUser.id) ? "user-check" : "slash"}
                size={18}
                color={otherUser && isBlocked(otherUser.id) ? "#10B981" : "#FF3B5C"}
                strokeWidth={1.5}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[menuStyles.rowTitle, { color: c.text }]}>
                {otherUser && isBlocked(otherUser.id) ? "إلغاء حظر المستخدم" : "حظر المستخدم"}
              </Text>
              <Text style={[menuStyles.rowSub, { color: c.textSecondary }]}>
                {otherUser && isBlocked(otherUser.id) ? "السماح بالرسائل مرة أخرى" : "لن تتلقى رسائل أو مكالمات منه"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowMenu(false)}
            style={[blockModalStyles.cancelBtn, { backgroundColor: c.backgroundTertiary, marginTop: 8 }]}
          >
            <Text style={[blockModalStyles.cancelText, { color: c.textSecondary }]}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ───── Theme color picker ───── */}
      <Modal visible={showThemePicker} transparent animationType="fade" onRequestClose={() => setShowThemePicker(false)}>
        <Pressable style={blockModalStyles.backdrop} onPress={() => setShowThemePicker(false)} />
        <View style={[menuStyles.sheet, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[blockModalStyles.handle, { backgroundColor: c.border }]} />
          <Text style={[menuStyles.heading, { color: c.text }]}>اختر لون المحادثة</Text>
          <View style={menuStyles.swatchGrid}>
            {ACCENT_COLORS.map((col) => (
              <TouchableOpacity
                key={col}
                onPress={() => { setConversationTheme(id, col); setShowThemePicker(false); }}
                style={[
                  menuStyles.swatch,
                  { backgroundColor: col, borderColor: convo?.themeColor === col ? "#fff" : "transparent" },
                ]}
              />
            ))}
            <TouchableOpacity
              onPress={() => { setConversationTheme(id, undefined); setShowThemePicker(false); }}
              style={[
                menuStyles.swatch,
                { backgroundColor: "#2C2C2E", borderColor: !convo?.themeColor ? "#fff" : "transparent",
                  alignItems: "center", justifyContent: "center" },
              ]}
            >
              <Feather name="x" size={18} color={c.textSecondary} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => setShowThemePicker(false)}
            style={[blockModalStyles.cancelBtn, { backgroundColor: c.backgroundTertiary, marginTop: 8 }]}
          >
            <Text style={[blockModalStyles.cancelText, { color: c.textSecondary }]}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ───── Destructive confirm (block / delete) ───── */}
      <Modal
        visible={menuConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuConfirm(null)}
      >
        <Pressable style={blockModalStyles.backdrop} onPress={() => setMenuConfirm(null)} />
        <View style={[blockModalStyles.sheet, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[blockModalStyles.handle, { backgroundColor: c.border }]} />
          {menuConfirm === "delete" ? (
            <>
              <View style={blockModalStyles.iconWrap}>
                <Feather name="trash-2" size={36} color="#FF3B5C" strokeWidth={1.5} />
              </View>
              <Text style={[blockModalStyles.title, { color: c.text }]}>حذف المحادثة</Text>
              <Text style={[blockModalStyles.subtitle, { color: c.textSecondary }]}>
                هل أنت متأكد من حذف المحادثة مع {otherUser?.name}؟ لا يمكن التراجع.
              </Text>
              <TouchableOpacity
                onPress={() => { setMenuConfirm(null); deleteConversation(id); router.back(); }}
                style={blockModalStyles.blockBtn}
              >
                <Text style={blockModalStyles.blockBtnText}>نعم، احذف المحادثة</Text>
              </TouchableOpacity>
            </>
          ) : otherUser && isBlocked(otherUser.id) ? (
            <>
              <View style={[blockModalStyles.iconWrap, { backgroundColor: "#10B98122" }]}>
                <Feather name="user-check" size={36} color="#10B981" strokeWidth={1.5} />
              </View>
              <Text style={[blockModalStyles.title, { color: c.text }]}>إلغاء الحظر</Text>
              <Text style={[blockModalStyles.subtitle, { color: c.textSecondary }]}>
                {otherUser?.name} محظور حالياً. هل تريد إلغاء الحظر؟
              </Text>
              <TouchableOpacity
                onPress={() => { setMenuConfirm(null); if (otherUser) unblockUser(otherUser.id); }}
                style={[blockModalStyles.blockBtn, { backgroundColor: "#10B981" }]}
              >
                <Text style={blockModalStyles.blockBtnText}>نعم، إلغاء الحظر</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={blockModalStyles.iconWrap}>
                <Feather name="slash" size={36} color="#FF3B5C" strokeWidth={1.5} />
              </View>
              <Text style={[blockModalStyles.title, { color: c.text }]}>حظر المستخدم</Text>
              <Text style={[blockModalStyles.subtitle, { color: c.textSecondary }]}>
                هل تريد حظر {otherUser?.name}؟
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setMenuConfirm(null);
                  if (otherUser) blockUser(otherUser.id);
                  router.back();
                }}
                style={blockModalStyles.blockBtn}
              >
                <Text style={blockModalStyles.blockBtnText}>نعم، احظر المستخدم</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={() => setMenuConfirm(null)}
            style={[blockModalStyles.cancelBtn, { backgroundColor: c.backgroundTertiary }]}
          >
            <Text style={[blockModalStyles.cancelText, { color: c.textSecondary }]}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const pinStyles = StyleSheet.create({
  banner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: "#1C1811", borderBottomWidth: 1, borderBottomColor: "#F59E0B33",
  },
  pinLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#F59E0B" },
  pinText: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 1 },
});

const replyBarStyles = StyleSheet.create({
  bar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: "#0D1520", borderTopWidth: 1, borderTopColor: "#3D91F433",
  },
  label: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#3D91F4" },
  preview: { fontSize: 13, fontFamily: "Inter_400Regular" },
});

const blockModalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, padding: 20, paddingBottom: 40, gap: 12, alignItems: "center",
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#FF3B5C22",
    alignItems: "center", justifyContent: "center", marginVertical: 8,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, paddingHorizontal: 10 },
  blockBtn: { width: "100%", backgroundColor: "#FF3B5C", borderRadius: 20, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  blockBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  cancelBtn: { width: "100%", borderRadius: 20, paddingVertical: 16, alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

// Overflow / theme picker sheet — uses a denser layout with action rows and
// a leading icon, distinct from the centered destructive `blockModalStyles`.
const menuStyles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32,
  },
  heading: {
    fontSize: 16, fontFamily: "Inter_700Bold",
    textAlign: "center", marginBottom: 12, marginTop: 4,
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 12, paddingHorizontal: 4,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  rowTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  swatchGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 12,
    justifyContent: "center", paddingVertical: 8,
  },
  swatch: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 2,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  headerAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  headerAvatarText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerAvatarImg: { width: "100%", height: "100%", borderRadius: 14 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#10B981" },
  onlineText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  callBtns: { flexDirection: "row", gap: 6 },
  callBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  msgList: { padding: 16, gap: 8 },
  msgRow: { marginBottom: 4, flexDirection: "row", alignItems: "flex-end", gap: 6 },
  msgRowLeft: { alignSelf: "flex-start", maxWidth: "85%" },
  msgRowRight: { alignSelf: "flex-end", maxWidth: "80%", justifyContent: "flex-end" },
  msgAvatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", flexShrink: 0, alignSelf: "flex-end",
  },
  msgAvatarImg: { width: "100%", height: "100%", borderRadius: 15 },
  msgAvatarText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  msgBubbleCol: { flexShrink: 1 },
  msgSenderName: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 3, paddingLeft: 2 },
  bubble: { borderRadius: 18, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, gap: 4 },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  bubbleTime: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "left" },
  msgImageWrap: { width: 200, height: 200, borderRadius: 12, overflow: "hidden" },
  msgImage: { width: "100%", height: "100%" },
  msgVideoWrap: { width: 200, height: 150, borderRadius: 12, overflow: "hidden", backgroundColor: "#111" },
  mediaExpandIcon: {
    position: "absolute", bottom: 6, right: 6, width: 24, height: 24,
    borderRadius: 8, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
  audioMsg: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4, minWidth: 160 },
  audioPlayBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  audioWave: { flex: 1, flexDirection: "row", alignItems: "center", gap: 2, height: 24 },
  audioBar: { width: 3, borderRadius: 2 },
  audioDuration: { fontSize: 12, fontFamily: "Inter_500Medium" },
  emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  attachMenu: { flexDirection: "row", gap: 12, padding: 14, borderTopWidth: 1 },
  attachItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 48, borderRadius: 14 },
  attachLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1 },
  attachBtn: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  inputWrapper: { flex: 1, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, maxHeight: 120 },
  input: { fontSize: 15, lineHeight: 22 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center",
    shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  reactionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4, marginHorizontal: 4 },
  reactionChip: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: "#1C1C1E", borderRadius: 12, paddingHorizontal: 6, paddingVertical: 3,
    borderWidth: 1,
  },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
