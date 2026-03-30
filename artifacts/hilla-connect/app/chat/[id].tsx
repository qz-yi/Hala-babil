import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
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

function MessageBubble({ msg, isMe, accentColor, colors }: { msg: PrivateMessage; isMe: boolean; accentColor: string; colors: any }) {
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
        {/* Image message */}
        {msg.type === "image" && msg.mediaUrl ? (
          <View style={styles.msgImageWrap}>
            <Image source={{ uri: msg.mediaUrl }} style={styles.msgImage} resizeMode="cover" />
          </View>
        ) : msg.type === "video" && msg.mediaUrl ? (
          <View style={styles.msgVideoWrap}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000", alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name="play-circle" size={44} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
        ) : msg.type === "audio" ? (
          <View style={styles.audioMsg}>
            <Ionicons name="mic" size={18} color={isMe ? "rgba(255,255,255,0.9)" : colors.tint} />
            <View style={styles.audioWave}>
              {[4, 8, 12, 6, 10, 4, 8, 14, 6, 4].map((h, i) => (
                <View
                  key={i}
                  style={[styles.audioBar, {
                    height: h,
                    backgroundColor: isMe ? "rgba(255,255,255,0.6)" : `${colors.tint}88`,
                  }]}
                />
              ))}
            </View>
            {msg.duration ? (
              <Text style={[styles.audioDuration, { color: isMe ? "rgba(255,255,255,0.8)" : colors.textSecondary }]}>
                {Math.floor(msg.duration / 60)}:{(msg.duration % 60).toString().padStart(2, "0")}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Text content */}
        {msg.content ? (
          <Text style={[styles.bubbleText, { color: isMe ? "#fff" : colors.text }]}>{msg.content}</Text>
        ) : null}

        <Text style={[styles.bubbleTime, { color: isMe ? "rgba(255,255,255,0.6)" : colors.textSecondary }]}>
          {formatTime(msg.timestamp)}
          {isMe && (
            <Text> {msg.read ? "✓✓" : "✓"}</Text>
          )}
        </Text>
      </View>
    </View>
  );
}

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
    if (Platform.OS === "web") { Alert.alert("", "رفع الصور غير مدعوم على الويب"); return; }
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
    if (Platform.OS === "web") { Alert.alert("", "رفع الفيديو غير مدعوم على الويب"); return; }
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

  const handleSendAudio = () => {
    setShowAttach(false);
    if (!otherUser) return;
    // Simulated audio message (real mic requires expo-av)
    sendPrivateMessage(id, otherUser.id, "🎤 رسالة صوتية", "audio", undefined, 15);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
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
              <Ionicons name="call" size={18} color={accentColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: `${accentColor}22` }]}
              onPress={() => Alert.alert(t("videoCall"), "قريباً")}
            >
              <Ionicons name="videocam" size={18} color={accentColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOptions} style={[styles.callBtn, { backgroundColor: colors.backgroundTertiary }]}>
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
              <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 8 }]}>
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
            />
          )}
        />

        {/* Attachment Menu */}
        {showAttach && (
          <View style={[styles.attachMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity onPress={handlePickImage} style={[styles.attachItem, { backgroundColor: `${colors.tint}18` }]}>
              <Ionicons name="image-outline" size={22} color={colors.tint} />
              <Text style={[styles.attachLabel, { color: colors.tint }]}>صورة</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePickVideo} style={[styles.attachItem, { backgroundColor: "#E1306C18" }]}>
              <Ionicons name="videocam-outline" size={22} color="#E1306C" />
              <Text style={[styles.attachLabel, { color: "#E1306C" }]}>فيديو</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSendAudio} style={[styles.attachItem, { backgroundColor: "#10B98118" }]}>
              <Ionicons name="mic-outline" size={22} color="#10B981" />
              <Text style={[styles.attachLabel, { color: "#10B981" }]}>صوتي</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputBar, { paddingBottom: botPad + 8, backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border }]}>
          {/* Attach button */}
          <TouchableOpacity
            onPress={() => setShowAttach((v) => !v)}
            style={[styles.attachBtn, { backgroundColor: showAttach ? `${colors.tint}22` : colors.backgroundTertiary }]}
          >
            <Ionicons name={showAttach ? "close" : "attach"} size={22} color={showAttach ? colors.tint : colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
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
              onPress={handleSendAudio}
              style={[styles.sendBtn, { backgroundColor: colors.backgroundTertiary }]}
            >
              <Ionicons name="mic-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  headerAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  headerAvatarText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerAvatarImg: { width: "100%", height: "100%", borderRadius: 14, resizeMode: "cover" },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#10B981" },
  onlineText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  callBtns: { flexDirection: "row", gap: 6 },
  callBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  msgList: { padding: 16, gap: 8 },
  msgRow: { marginBottom: 4 },
  msgRowLeft: { alignSelf: "flex-start", maxWidth: "78%" },
  msgRowRight: { alignSelf: "flex-end", maxWidth: "78%" },
  bubble: { borderRadius: 18, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, gap: 4 },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  bubbleTime: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "left" },
  msgImageWrap: { width: 200, height: 200, borderRadius: 12, overflow: "hidden" },
  msgImage: { width: "100%", height: "100%" },
  msgVideoWrap: { width: 200, height: 150, borderRadius: 12, overflow: "hidden", backgroundColor: "#111" },
  audioMsg: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  audioWave: { flexDirection: "row", alignItems: "center", gap: 2, height: 20 },
  audioBar: { width: 3, borderRadius: 2 },
  audioDuration: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  attachMenu: {
    flexDirection: "row", gap: 12, padding: 14,
    borderTopWidth: 1,
  },
  attachItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 48, borderRadius: 14 },
  attachLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1,
  },
  attachBtn: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  inputWrapper: {
    flex: 1, borderRadius: 18, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    minHeight: 44, maxHeight: 120,
  },
  input: { fontSize: 15, lineHeight: 22 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
});
