import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
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
import type { PrivateMessage, User } from "@/context/AppContext";

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
          <Ionicons name="close" size={20} color="#fff" />
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
          { backgroundColor: isMe ? "rgba(255,255,255,0.25)" : `${colors.tint}22` },
        ]}
      >
        <Ionicons
          name={playing ? "pause" : "play"}
          size={14}
          color={isMe ? "#fff" : colors.tint}
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
                      : colors.tint
                    : isMe
                    ? "rgba(255,255,255,0.4)"
                    : `${colors.tint}55`,
              },
            ]}
          />
        ))}
      </View>
      {msg.duration != null ? (
        <Text
          style={[styles.audioDuration, { color: isMe ? "rgba(255,255,255,0.8)" : colors.textSecondary }]}
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
            backgroundColor: isMe ? accentColor : colors.card,
            borderColor: isMe ? "transparent" : colors.border,
          },
        ]}
      >
        {msg.type === "image" && msg.mediaUrl ? (
          <TouchableOpacity
            style={styles.msgImageWrap}
            onPress={() => onMediaPress(msg.mediaUrl!, "image")}
            activeOpacity={0.9}
          >
            <Image source={{ uri: msg.mediaUrl }} style={styles.msgImage} resizeMode="cover" />
            <View style={styles.mediaExpandIcon}>
              <Ionicons name="expand-outline" size={14} color="#fff" />
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
              <Ionicons name="play" size={44} color="rgba(255,255,255,0.9)" />
            </View>
            <View style={styles.mediaExpandIcon}>
              <Ionicons name="expand-outline" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        ) : msg.type === "audio" ? (
          <AudioBubble msg={msg} isMe={isMe} colors={colors} />
        ) : null}

        {msg.content ? (
          <Text style={[styles.bubbleText, { color: isMe ? "#fff" : colors.text }]}>
            {msg.content}
          </Text>
        ) : null}

        <Text
          style={[styles.bubbleTime, { color: isMe ? "rgba(255,255,255,0.6)" : colors.textSecondary }]}
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
    <View style={[recStyles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <Animated.View style={[recStyles.dot, { transform: [{ scale: pulseAnim }] }]} />
      <Text style={[recStyles.text, { color: colors.text }]}>
        جاري التسجيل... {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
      </Text>
      <Text style={[recStyles.hint, { color: colors.textSecondary }]}>أفلت للإرسال</Text>
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

  const handleOptions = () => {
    Alert.alert(otherUser?.name || "", "خيارات", [
      {
        text: t("block"),
        style: "destructive",
        onPress: () => {
          if (otherUser) blockUser(otherUser.id);
          router.back();
        },
      },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  if (!convo) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.textSecondary }}>المحادثة غير موجودة</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.tint, marginTop: 12 }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[`${accentColor}20`, "transparent"]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
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
            <Text style={[styles.headerName, { color: colors.text }]}>{otherUser?.name}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={[styles.onlineText, { color: colors.textSecondary }]}>{t("online")}</Text>
            </View>
          </View>

          <View style={styles.callBtns}>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: `${accentColor}22` }]}
              onPress={() => Alert.alert(t("voiceCall"), "قريباً")}
            >
              <Ionicons name="call-outline" size={18} color={accentColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: `${accentColor}22` }]}
              onPress={() => Alert.alert(t("videoCall"), "قريباً")}
            >
              <Ionicons name="videocam-outline" size={18} color={accentColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOptions}
              style={[styles.callBtn, { backgroundColor: colors.backgroundTertiary }]}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
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
              <Ionicons name="chatbubble-outline" size={40} color={colors.border} />
              <Text
                style={[
                  { color: colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 8 },
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
            style={[styles.attachMenu, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <TouchableOpacity
              onPress={handlePickImage}
              style={[styles.attachItem, { backgroundColor: `${colors.tint}18` }]}
            >
              <Ionicons name="image-outline" size={22} color={colors.tint} />
              <Text style={[styles.attachLabel, { color: colors.tint }]}>صورة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickVideo}
              style={[styles.attachItem, { backgroundColor: "#E1306C18" }]}
            >
              <Ionicons name="videocam-outline" size={22} color="#E1306C" />
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
              backgroundColor: colors.backgroundSecondary,
              borderTopColor: colors.border,
            },
          ]}
        >
          {!isRecording ? (
            <>
              <TouchableOpacity
                onPress={() => setShowAttach((v) => !v)}
                style={[
                  styles.attachBtn,
                  { backgroundColor: showAttach ? `${colors.tint}22` : colors.backgroundTertiary },
                ]}
              >
                <Ionicons
                  name={showAttach ? "close" : "attach"}
                  size={22}
                  color={showAttach ? colors.tint : colors.textSecondary}
                />
              </TouchableOpacity>

              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                  placeholder={t("typeMessage")}
                  placeholderTextColor={colors.textSecondary}
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
                  <Ionicons name="send" size={18} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onLongPress={handleStartRecording}
                  delayLongPress={200}
                  style={[styles.sendBtn, { backgroundColor: colors.backgroundTertiary }]}
                >
                  <Ionicons name="mic-outline" size={22} color={colors.textSecondary} />
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
                <Ionicons name="stop-circle" size={22} color="#fff" />
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
    </View>
  );
}

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
