import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import type { PrivateMessage, SharedContent, User } from "@/context/AppContext";

const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";

// ───── Media Fullscreen Modal ─────
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
  closeText: { color: "#fff", fontSize: 18, fontFamily: "Inter_600SemiBold" },
  fullImage: { width: "100%", height: "80%" },
  videoWrap: { width: "100%", height: "80%", backgroundColor: "#000" },
});

// ───── Shared Content Preview ─────
function SharedContentPreview({
  sharedContent,
  isMe,
  colors,
}: {
  sharedContent: SharedContent;
  isMe: boolean;
  colors: any;
}) {
  const { stories } = useApp();
  const ICONS: Record<string, string> = {
    post: "image",
    reel: "play-circle",
    story: "circle",
  };
  const LABELS: Record<string, string> = {
    post: "منشور",
    reel: "مقطع فيديو",
    story: "قصة",
  };
  const iconColor = isMe ? "rgba(255,255,255,0.9)" : "#3D91F4";
  const handleTap = () => {
    if (sharedContent.type === "post") {
      router.push(`/post/${sharedContent.id}` as any);
    } else if (sharedContent.type === "reel") {
      router.push("/(tabs)/reels" as any);
    } else if (sharedContent.type === "story") {
      const story = stories.find((s) => s.id === sharedContent.id);
      if (story && story.expiresAt > Date.now()) {
        router.push(`/story/${story.creatorId}` as any);
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={handleTap}
      activeOpacity={0.8}
      style={[
        sharedStyles.card,
        {
          backgroundColor: isMe ? "rgba(255,255,255,0.18)" : "#1C1C1C",
          borderColor: isMe ? "rgba(255,255,255,0.3)" : BORDER,
        },
      ]}
    >
      {/* Thumbnail */}
      <View
        style={[sharedStyles.thumb, { backgroundColor: isMe ? "rgba(255,255,255,0.12)" : `${"#3D91F4"}22` }]}
      >
        {sharedContent.mediaUrl ? (
          <Image source={{ uri: sharedContent.mediaUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
        ) : null}
        <View style={sharedStyles.thumbOverlay}>
          <Feather name={ICONS[sharedContent.type] as any} size={22} color={iconColor} strokeWidth={1.5} />
        </View>
      </View>
      {/* Info */}
      <View style={sharedStyles.info}>
        <Text style={[sharedStyles.typeLabel, { color: isMe ? "rgba(255,255,255,0.7)" : TEXT2 }]}>
          {LABELS[sharedContent.type]}
        </Text>
        {sharedContent.title ? (
          <Text style={[sharedStyles.title, { color: isMe ? "#fff" : TEXT }]} numberOfLines={2}>
            {sharedContent.title}
          </Text>
        ) : null}
        {sharedContent.creatorName ? (
          <Text style={[sharedStyles.creator, { color: isMe ? "rgba(255,255,255,0.65)" : TEXT2 }]}>
            {sharedContent.creatorName}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={14} color={isMe ? "rgba(255,255,255,0.5)" : TEXT2} strokeWidth={1.5} />
    </TouchableOpacity>
  );
}

const sharedStyles = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, borderWidth: 1, overflow: "hidden", minWidth: 200,
    marginBottom: 4,
  },
  thumb: { width: 64, height: 64, position: "relative", overflow: "hidden" },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  info: { flex: 1, gap: 2, paddingVertical: 10 },
  typeLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  title: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  creator: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

// ───── Story Reply Reference ─────
function StoryReplyRef({ storyId, colors, isMe }: { storyId: string; colors: any; isMe: boolean }) {
  const { stories } = useApp();
  const story = stories.find((s) => s.id === storyId);
  if (!story) return null;
  return (
    <TouchableOpacity
      onPress={() => router.push(`/story/${story.creatorId}` as any)}
      style={[storyRefStyles.wrap, { borderColor: isMe ? "rgba(255,255,255,0.3)" : BORDER }]}
      activeOpacity={0.8}
    >
      <View style={storyRefStyles.thumb}>
        {story.mediaUrl ? (
          <Image source={{ uri: story.mediaUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill as any, { backgroundColor: "#7C3AED88" }]} />
        )}
      </View>
      <Text style={[storyRefStyles.label, { color: isMe ? "rgba(255,255,255,0.75)" : TEXT2 }]}>
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

// ───── Audio Bubble with Playback ─────
function AudioBubble({ msg, isMe, colors }: { msg: PrivateMessage; isMe: boolean; colors: any }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  const handleTogglePlay = async () => {
    if (!msg.mediaUrl) {
      Alert.alert("", "ملف الصوت غير متاح");
      return;
    }
    if (playing) {
      await sound?.pauseAsync();
      setPlaying(false);
      return;
    }
    if (sound) {
      await sound.playAsync();
      setPlaying(true);
      return;
    }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: msg.mediaUrl });
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          const prog = status.durationMillis ? status.positionMillis / status.durationMillis : 0;
          setProgress(prog);
          if (status.didJustFinish) {
            setPlaying(false);
            setProgress(0);
          }
        }
      });
      await newSound.playAsync();
      setPlaying(true);
    } catch {
      Alert.alert("", "تعذر تشغيل الرسالة الصوتية");
    }
  };

  const waveHeights = [4, 8, 12, 6, 14, 8, 10, 5, 12, 7, 9, 4, 11, 6, 8];

  return (
    <TouchableOpacity style={styles.audioMsg} onPress={handleTogglePlay} activeOpacity={0.8}>
      <View
        style={[
          styles.audioPlayBtn,
          { backgroundColor: isMe ? "rgba(255,255,255,0.25)" : `${"#3D91F4"}22` },
        ]}
      >
        <Feather
          name={playing ? "pause" : "play"}
          size={13}
          color={isMe ? "#fff" : "#3D91F4"}
          strokeWidth={1.5}
        />
      </View>
      <View style={styles.audioWave}>
        {waveHeights.map((h, i) => (
          <View
            key={i}
            style={[
              styles.audioBar,
              {
                height: h,
                backgroundColor:
                  progress > i / waveHeights.length
                    ? isMe
                      ? "#fff"
                      : "#3D91F4"
                    : isMe
                    ? "rgba(255,255,255,0.4)"
                    : `${"#3D91F4"}55`,
              },
            ]}
          />
        ))}
      </View>
      {msg.duration != null ? (
        <Text
          style={[styles.audioDuration, { color: isMe ? "rgba(255,255,255,0.8)" : TEXT2 }]}
        >
          {Math.floor(msg.duration / 60)}:{(msg.duration % 60).toString().padStart(2, "0")}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ───── Message Bubble ─────
function MessageBubble({
  msg,
  isMe,
  accentColor,
  colors,
  onMediaPress,
}: {
  msg: PrivateMessage;
  isMe: boolean;
  accentColor: string;
  colors: any;
  onMediaPress: (uri: string, type: "image" | "video") => void;
}) {
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isMe ? accentColor : CARD,
            borderColor: isMe ? "transparent" : BORDER,
          },
        ]}
      >
        {/* Story reply reference */}
        {msg.storyRef && (
          <StoryReplyRef storyId={msg.storyRef} colors={colors} isMe={isMe} />
        )}

        {/* Shared content card */}
        {msg.type === "shared" && msg.sharedContent ? (
          <SharedContentPreview sharedContent={msg.sharedContent} isMe={isMe} colors={colors} />
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
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
              ]}
            >
              <Feather name="play" size={40} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
            </View>
            <View style={styles.mediaExpandIcon}>
              <Feather name="maximize" size={12} color="#fff" strokeWidth={1.5} />
            </View>
          </TouchableOpacity>
        ) : msg.type === "audio" ? (
          <AudioBubble msg={msg} isMe={isMe} colors={colors} />
        ) : null}

        {msg.content ? (
          <Text style={[styles.bubbleText, { color: isMe ? "#fff" : TEXT }]}>
            {msg.content}
          </Text>
        ) : null}

        <Text
          style={[styles.bubbleTime, { color: isMe ? "rgba(255,255,255,0.6)" : TEXT2 }]}
        >
          {formatTime(msg.timestamp)}
          {isMe && <Text> {msg.read ? "✓✓" : "✓"}</Text>}
        </Text>
      </View>
    </View>
  );
}

// ───── Recording Indicator ─────
function RecordingIndicator({ duration, colors }: { duration: number; colors: any }) {
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
      <Text style={[recStyles.text, { color: TEXT }]}>
        جاري التسجيل... {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
      </Text>
      <Text style={[recStyles.hint, { color: TEXT2 }]}>أفلت للإرسال</Text>
    </View>
  );
}

const recStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    minHeight: 44,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E1306C" },
  text: { fontFamily: "Inter_500Medium", fontSize: 14 },
  hint: { fontFamily: "Inter_400Regular", fontSize: 12, marginLeft: "auto" },
});

// ───── Chat Screen ─────
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { conversations, currentUser, sendPrivateMessage, blockUser, t, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Media fullscreen
  const [mediaModal, setMediaModal] = useState<{ uri: string; type: "image" | "video" } | null>(
    null
  );

  // Recording
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop recording & audio when navigating away
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Stop recording if active
        if (recordingRef.current) {
          recordingRef.current.stopAndUnloadAsync().catch(() => {});
          recordingRef.current = null;
        }
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        setIsRecording(false);
        setRecordingDuration(0);
        // Stop any playing audio via Audio API
        Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
      };
    }, [])
  );

  const convo = conversations.find((c) => c.id === id) as any;
  const messages: PrivateMessage[] = convo?.messages || [];
  const otherUser: User | undefined = convo?.participantUsers?.find(
    (u: User) => u.id !== currentUser?.id
  );
  const accentColor = ACCENT_COLORS[(otherUser?.name?.length || 0) % ACCENT_COLORS.length];

  const handleSend = () => {
    if (!message.trim() || !otherUser) return;
    sendPrivateMessage(id, otherUser.id, message.trim(), "text");
    setMessage("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePickImage = async () => {
    setShowAttach(false);
    if (Platform.OS === "web") {
      Alert.alert("", "رفع الصور غير مدعوم على الويب");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0] && otherUser) {
      sendPrivateMessage(id, otherUser.id, "", "image", result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePickVideo = async () => {
    setShowAttach(false);
    if (Platform.OS === "web") {
      Alert.alert("", "رفع الفيديو غير مدعوم على الويب");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0] && otherUser) {
      sendPrivateMessage(id, otherUser.id, "", "video", result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleStartRecording = async () => {
    if (Platform.OS === "web") {
      Alert.alert("", "التسجيل الصوتي غير مدعوم على الويب");
      return;
    }
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("", "يرجى السماح باستخدام الميكروفون");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Alert.alert("", "تعذر بدء التسجيل الصوتي");
    }
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
    } catch {
      recordingRef.current = null;
    }
    setRecordingDuration(0);
  };

  const [showBlockModal, setShowBlockModal] = useState(false);

  const handleOptions = () => {
    setShowBlockModal(true);
  };

  if (!convo) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: BG, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: TEXT2 }}>المحادثة غير موجودة</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#3D91F4", marginTop: 12 }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: BG }]}>
      {/* Header */}
      <LinearGradient
        colors={[`${accentColor}20`, "transparent"]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: CARD, borderColor: BORDER }]}
          >
            <Feather name="arrow-left" size={20} color={TEXT} strokeWidth={1.5} />
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

          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: TEXT }]}>{otherUser?.name}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={[styles.onlineText, { color: TEXT2 }]}>{t("online")}</Text>
            </View>
          </View>

          <View style={styles.callBtns}>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: `${accentColor}22` }]}
              onPress={() => Alert.alert(t("voiceCall"), "قريباً")}
            >
              <Feather name="phone" size={18} color={accentColor} strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: `${accentColor}22` }]}
              onPress={() => Alert.alert(t("videoCall"), "قريباً")}
            >
              <Feather name="video" size={18} color={accentColor} strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOptions}
              style={[styles.callBtn, { backgroundColor: "#1C1C1C" }]}
            >
              <Feather name="more-vertical" size={18} color={TEXT2} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatRef}
          data={[...messages].reverse()}
          keyExtractor={(m) => m.id}
          inverted
          contentContainerStyle={[styles.msgList, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Feather name="message-circle" size={40} color={BORDER} strokeWidth={1} />
              <Text
                style={[
                  { color: TEXT2, fontFamily: "Inter_400Regular", marginTop: 8 },
                ]}
              >
                ابدأ المحادثة
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <MessageBubble
              msg={item}
              isMe={item.senderId === currentUser?.id}
              accentColor={accentColor}
              colors={colors}
              onMediaPress={(uri, type) => setMediaModal({ uri, type })}
            />
          )}
        />

        {/* Attachment Menu */}
        {showAttach && !isRecording && (
          <View
            style={[styles.attachMenu, { backgroundColor: CARD, borderColor: BORDER }]}
          >
            <TouchableOpacity
              onPress={handlePickImage}
              style={[styles.attachItem, { backgroundColor: `${"#3D91F4"}18` }]}
            >
              <Feather name="image" size={22} color="#3D91F4" strokeWidth={1.5} />
              <Text style={[styles.attachLabel, { color: "#3D91F4" }]}>صورة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickVideo}
              style={[styles.attachItem, { backgroundColor: "#E1306C18" }]}
            >
              <Feather name="video" size={22} color="#E1306C" strokeWidth={1.5} />
              <Text style={[styles.attachLabel, { color: "#E1306C" }]}>فيديو</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Bar */}
        <View
          style={[
            styles.inputBar,
            {
              paddingBottom: botPad + 8,
              backgroundColor: "#1C1C1C",
              borderTopColor: BORDER,
            },
          ]}
        >
          {!isRecording ? (
            <>
              <TouchableOpacity
                onPress={() => setShowAttach((v) => !v)}
                style={[
                  styles.attachBtn,
                  { backgroundColor: showAttach ? "#3D91F422" : "#1C1C1C" },
                ]}
              >
                <Feather
                  name={showAttach ? "x" : "paperclip"}
                  size={20}
                  color={showAttach ? "#3D91F4" : TEXT2}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>

              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: "#1C1C1C", borderColor: BORDER },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: TEXT, fontFamily: "Inter_400Regular" }]}
                  placeholder={t("typeMessage")}
                  placeholderTextColor={TEXT2}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  textAlign="right"
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
              </View>

              {message.trim() ? (
                <TouchableOpacity
                  onPress={handleSend}
                  style={[styles.sendBtn, { backgroundColor: accentColor }]}
                >
                  <Feather name="send" size={18} color="#fff" strokeWidth={1.5} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onLongPress={handleStartRecording}
                  delayLongPress={200}
                  style={[styles.sendBtn, { backgroundColor: "#1C1C1C" }]}
                >
                  <Feather name="mic" size={22} color={TEXT2} strokeWidth={1.5} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <RecordingIndicator duration={recordingDuration} colors={colors} />
              <TouchableOpacity
                onPress={handleStopRecording}
                style={[styles.sendBtn, { backgroundColor: "#E1306C" }]}
              >
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

      {/* Custom Block Modal */}
      <Modal visible={showBlockModal} transparent animationType="fade" onRequestClose={() => setShowBlockModal(false)}>
        <Pressable style={blockModalStyles.backdrop} onPress={() => setShowBlockModal(false)} />
        <View style={[blockModalStyles.sheet, { backgroundColor: CARD, borderColor: BORDER }]}>
          <View style={[blockModalStyles.handle, { backgroundColor: BORDER }]} />
          <View style={blockModalStyles.iconWrap}>
            <Feather name="slash" size={36} color="#FF3B5C" strokeWidth={1.5} />
          </View>
          <Text style={[blockModalStyles.title, { color: TEXT }]}>حظر المستخدم</Text>
          <Text style={[blockModalStyles.subtitle, { color: TEXT2 }]}>
            هل تريد حظر {otherUser?.name}؟ لن تتلقى منه رسائل أو تفاعلات بعد الآن.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowBlockModal(false);
              if (otherUser) blockUser(otherUser.id);
              router.back();
            }}
            style={blockModalStyles.blockBtn}
          >
            <Text style={blockModalStyles.blockBtnText}>نعم، احظر المستخدم</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowBlockModal(false)}
            style={[blockModalStyles.cancelBtn, { backgroundColor: "#1C1C1C" }]}
          >
            <Text style={[blockModalStyles.cancelText, { color: TEXT2 }]}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

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
    alignItems: "center", justifyContent: "center",
    marginVertical: 8,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, paddingHorizontal: 10 },
  blockBtn: {
    width: "100%", backgroundColor: "#FF3B5C",
    borderRadius: 20, paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  blockBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  cancelBtn: { width: "100%", borderRadius: 20, paddingVertical: 16, alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerAvatarText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerAvatarImg: { width: "100%", height: "100%", borderRadius: 14 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#10B981" },
  onlineText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  callBtns: { flexDirection: "row", gap: 6 },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  msgList: { padding: 16, gap: 8 },
  msgRow: { marginBottom: 4 },
  msgRowLeft: { alignSelf: "flex-start", maxWidth: "78%" },
  msgRowRight: { alignSelf: "flex-end", maxWidth: "78%" },
  bubble: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  bubbleTime: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "left" },
  msgImageWrap: { width: 200, height: 200, borderRadius: 12, overflow: "hidden" },
  msgImage: { width: "100%", height: "100%" },
  msgVideoWrap: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  mediaExpandIcon: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  audioMsg: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4, minWidth: 160 },
  audioPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  audioWave: { flex: 1, flexDirection: "row", alignItems: "center", gap: 2, height: 24 },
  audioBar: { width: 3, borderRadius: 2 },
  audioDuration: { fontSize: 12, fontFamily: "Inter_500Medium" },
  emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  attachMenu: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderTopWidth: 1,
  },
  attachItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: 14,
  },
  attachLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
  },
  input: { fontSize: 15, lineHeight: 22 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
