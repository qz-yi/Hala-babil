import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
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
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import type { GroupMessage } from "@/context/AppContext";
import { useThemeStore } from "@/store/themeStore";

const TINT = "#3D91F4";
const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function MsgContextMenu({
  visible,
  msg,
  isMe,
  canDeleteAll,
  onClose,
  onDeleteForMe,
  onDeleteForAll,
  onReply,
  onReact,
}: {
  visible: boolean;
  msg: GroupMessage | null;
  isMe: boolean;
  canDeleteAll: boolean;
  onClose: () => void;
  onDeleteForMe: () => void;
  onDeleteForAll: () => void;
  onReply: () => void;
  onReact: (emoji: string) => void;
}) {
  const c = useThemeStore((s) => s.tokens);
  if (!visible || !msg) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={ctx.backdrop} onPress={onClose} />
      <View style={[ctx.sheet, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={[ctx.handle, { backgroundColor: c.border }]} />
        <View style={ctx.emojiRow}>
          {QUICK_EMOJIS.map((e) => (
            <TouchableOpacity key={e} onPress={() => { onReact(e); onClose(); }} style={ctx.emojiBtn}>
              <Text style={ctx.emoji}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[ctx.sep, { backgroundColor: c.border }]} />
        <TouchableOpacity style={ctx.row} onPress={() => { onReply(); onClose(); }}>
          <View style={[ctx.icon, { backgroundColor: `${c.accent}22` }]}>
            <Feather name="corner-up-left" size={17} color={c.accent} strokeWidth={1.5} />
          </View>
          <Text style={[ctx.label, { color: c.text }]}>رد</Text>
        </TouchableOpacity>
        {(isMe || canDeleteAll) && (
          <TouchableOpacity style={ctx.row} onPress={() => { onDeleteForAll(); onClose(); }}>
            <View style={[ctx.icon, { backgroundColor: "#EF444422" }]}>
              <Feather name="trash" size={17} color="#EF4444" strokeWidth={1.5} />
            </View>
            <Text style={[ctx.label, { color: "#EF4444" }]}>حذف عند الجميع</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={ctx.row} onPress={() => { onDeleteForMe(); onClose(); }}>
          <View style={[ctx.icon, { backgroundColor: "#EF444422" }]}>
            <Feather name="trash-2" size={17} color="#EF4444" strokeWidth={1.5} />
          </View>
          <Text style={[ctx.label, { color: "#EF4444" }]}>حذف عندي</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const ctx = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, gap: 4, borderWidth: 1,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  emojiRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 8 },
  emojiBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  emoji: { fontSize: 26 },
  sep: { height: 1, marginVertical: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 4 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 15, fontFamily: "Inter_500Medium" },
});

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    groups, currentUser, sendGroupMessage, deleteGroupMessage, getGroupMemberRole,
    isGroupMuted, addGroupReaction, users, theme,
  } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const flatRef = useRef<FlatList>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
  const [contextMsg, setContextMsg] = useState<GroupMessage | null>(null);
  const [showContext, setShowContext] = useState(false);

  const group = groups.find((g) => g.id === id);
  const myRole = group ? getGroupMemberRole(id, currentUser?.id || "") : null;
  const muted = group ? isGroupMuted(id) : false;
  const canDeleteAll = myRole === "owner" || myRole === "admin";

  const messages = (group?.messages || []).filter((m) => !m.deletedForAll);
  const reversedMessages = [...messages].reverse();

  useEffect(() => {
    if (!group) return;
    flatRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [group?.messages.length]);

  const handleSend = useCallback(() => {
    if (!text.trim() || muted) return;
    sendGroupMessage(id, text.trim(), "text", undefined, replyTo?.id);
    setText("");
    setReplyTo(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    flatRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [text, muted, id, sendGroupMessage, replyTo]);

  const handlePickImage = async () => {
    if (Platform.OS === "web") { Alert.alert("", "رفع الصور غير مدعوم على الويب"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      sendGroupMessage(id, "", "image", result.assets[0].uri, undefined);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  if (!group) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: colors.textSecondary }}>المجموعة غير موجودة</Text>
      </View>
    );
  }

  const isMember = group.members.some((m) => m.userId === currentUser?.id);

  const renderItem = ({ item: msg }: { item: GroupMessage }) => {
    const isMe = msg.senderId === currentUser?.id;
    const senderUser = users.find((u) => u.id === msg.senderId);
    const accentColor = ACCENT_COLORS[(msg.senderName?.length || 0) % ACCENT_COLORS.length];
    const replyOrig = msg.replyToId ? messages.find((m) => m.id === msg.replyToId) : null;

    return (
      <View style={[s.msgRow, isMe ? s.msgRowRight : s.msgRowLeft]}>
        {!isMe && (
          <View style={[s.msgAvatar, { backgroundColor: `${accentColor}25` }]}>
            {senderUser?.avatar ? (
              <Image source={{ uri: senderUser.avatar }} style={s.msgAvatarImg} />
            ) : (
              <Text style={[s.msgAvatarText, { color: accentColor }]}>
                {(msg.senderName?.[0] || "?").toUpperCase()}
              </Text>
            )}
          </View>
        )}
        <View style={s.msgBubbleCol}>
          {!isMe && (
            <Text style={[s.senderName, { color: accentColor }]}>{msg.senderName}</Text>
          )}
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setContextMsg(msg);
              setShowContext(true);
            }}
            delayLongPress={350}
          >
            <View
              style={[
                s.bubble,
                {
                  backgroundColor: isMe ? colors.tint : colors.card,
                  borderColor: isMe ? "transparent" : colors.border,
                },
              ]}
            >
              {replyOrig && (
                <View style={[s.replyBubble, { borderLeftColor: isMe ? "rgba(255,255,255,0.5)" : colors.tint, backgroundColor: isMe ? "rgba(255,255,255,0.1)" : `${colors.tint}15` }]}>
                  <Text style={[s.replyText, { color: isMe ? "rgba(255,255,255,0.75)" : colors.textSecondary }]} numberOfLines={1}>
                    {replyOrig.type === "image" ? "📷 صورة" : replyOrig.content}
                  </Text>
                </View>
              )}

              {msg.type === "image" && msg.mediaUrl ? (
                <View style={s.msgImageWrap}>
                  <Image source={{ uri: msg.mediaUrl }} style={s.msgImage} resizeMode="cover" />
                </View>
              ) : msg.type === "system" ? (
                <Text style={[s.systemText, { color: colors.textSecondary }]}>{msg.content}</Text>
              ) : (
                msg.content ? (
                  <Text style={[s.bubbleText, { color: isMe ? "#fff" : colors.text }]}>{msg.content}</Text>
                ) : null
              )}

              <Text style={[s.bubbleTime, { color: isMe ? "rgba(255,255,255,0.6)" : colors.textSecondary }]}>
                {formatTime(msg.timestamp)}
              </Text>
            </View>
            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
              <View style={[s.reactRow, isMe ? { justifyContent: "flex-end" } : {}]}>
                {Object.entries(msg.reactions).map(([emoji, uids]) => (
                  <View key={emoji} style={[s.reactChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={s.reactEmoji}>{emoji}</Text>
                    {(uids as string[]).length > 1 && <Text style={[s.reactCount, { color: colors.textSecondary }]}>{(uids as string[]).length}</Text>}
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { borderColor: colors.border }]} activeOpacity={0.8}>
          <Feather name="arrow-right" size={20} color={colors.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/group/info/${id}` as any)}
          style={s.headerCenter}
          activeOpacity={0.8}
        >
          <View style={[s.headerAvatar, { backgroundColor: `${colors.tint}25` }]}>
            {group.photo ? (
              <Image source={{ uri: group.photo }} style={s.headerAvatarImg} />
            ) : (
              <Feather name="users" size={20} color={colors.tint} strokeWidth={1.5} />
            )}
          </View>
          <View style={s.headerInfo}>
            <Text style={[s.headerName, { color: colors.text }]} numberOfLines={1}>{group.name}</Text>
            <Text style={[s.headerSub, { color: colors.textSecondary }]} numberOfLines={1}>
              {group.members.length} عضو • {group.privacy === "public" ? "عامة" : "خاصة"}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/group/info/${id}` as any)}
          style={[s.infoBtn, { borderColor: colors.border }]}
          activeOpacity={0.8}
        >
          <Feather name="info" size={18} color={colors.text} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={reversedMessages}
        keyExtractor={(m) => m.id}
        inverted
        contentContainerStyle={[s.msgList, { paddingBottom: 8 }]}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={s.emptyChat}>
            <Feather name="message-circle" size={44} color={colors.border} strokeWidth={1} />
            <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 12 }]}>
              لا توجد رسائل بعد
            </Text>
          </View>
        }
      />

      {/* Input */}
      {isMember ? (
        <View style={{ borderTopWidth: 0.5, borderTopColor: colors.border }}>
          {replyTo && (
            <View style={[s.replyPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.replyPreviewBar} />
              <View style={{ flex: 1 }}>
                <Text style={[s.replyPreviewName, { color: colors.tint }]}>{replyTo.senderName}</Text>
                <Text style={[s.replyPreviewText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {replyTo.type === "image" ? "📷 صورة" : replyTo.content}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyTo(null)} style={{ padding: 4 }}>
                <Feather name="x" size={16} color={colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          )}
          {muted ? (
            <View style={[s.mutedBar, { backgroundColor: colors.card }]}>
              <Feather name="mic-off" size={16} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={[s.mutedText, { color: colors.textSecondary }]}>أنت مكتوم في هذه المجموعة</Text>
            </View>
          ) : (
            <View style={[s.inputBar, { paddingBottom: botPad + 8 }]}>
              <TouchableOpacity
                onPress={handlePickImage}
                style={[s.attachBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <Feather name="image" size={20} color={colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>
              <View style={[s.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[s.input, { color: colors.text }]}
                  placeholder="اكتب رسالة..."
                  placeholderTextColor={colors.textSecondary}
                  value={text}
                  onChangeText={setText}
                  multiline
                  maxLength={2000}
                  textAlign="right"
                />
              </View>
              <TouchableOpacity
                onPress={handleSend}
                style={[s.sendBtn, { backgroundColor: text.trim() ? colors.tint : colors.card, opacity: text.trim() ? 1 : 0.5 }]}
                activeOpacity={0.85}
                disabled={!text.trim()}
              >
                <Feather name="send" size={20} color={text.trim() ? "#fff" : colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={[s.nonMemberBar, { backgroundColor: colors.card, paddingBottom: botPad + 8 }]}>
          <Text style={[s.nonMemberText, { color: c.textSecondary }]}>لستَ عضواً في هذه المجموعة</Text>
        </View>
      )}

      <MsgContextMenu
        visible={showContext}
        msg={contextMsg}
        isMe={contextMsg?.senderId === currentUser?.id}
        canDeleteAll={canDeleteAll}
        onClose={() => setShowContext(false)}
        onDeleteForMe={() => {
          if (!contextMsg) return;
          deleteGroupMessage(id, contextMsg.id, false);
        }}
        onDeleteForAll={() => {
          if (!contextMsg) return;
          deleteGroupMessage(id, contextMsg.id, true);
        }}
        onReply={() => {
          if (!contextMsg) return;
          setReplyTo(contextMsg);
        }}
        onReact={(emoji) => {
          if (!contextMsg) return;
          addGroupReaction(id, contextMsg.id, emoji);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  headerAvatarImg: { width: "100%", height: "100%", borderRadius: 14 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  infoBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  msgList: { padding: 12, gap: 6 },
  msgRow: { marginBottom: 4, flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowLeft: { alignSelf: "flex-start", maxWidth: "85%" },
  msgRowRight: { alignSelf: "flex-end", maxWidth: "80%", justifyContent: "flex-end" },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, alignSelf: "flex-end" },
  msgAvatarImg: { width: "100%", height: "100%", borderRadius: 15 },
  msgAvatarText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  msgBubbleCol: { flexShrink: 1 },
  senderName: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 3, paddingLeft: 4 },
  bubble: { borderRadius: 18, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, gap: 4 },
  replyBubble: { borderLeftWidth: 2.5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 4 },
  replyText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  bubbleTime: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right" },
  systemText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", fontStyle: "italic" },
  msgImageWrap: { width: 200, height: 200, borderRadius: 12, overflow: "hidden" },
  msgImage: { width: "100%", height: "100%" },
  reactRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4, marginHorizontal: 4 },
  reactChip: {
    flexDirection: "row", alignItems: "center", gap: 2,
    borderRadius: 12, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1,
  },
  reactEmoji: { fontSize: 14 },
  reactCount: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 },

  replyPreview: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 0.5,
  },
  replyPreviewBar: { width: 3, height: 36, borderRadius: 2, backgroundColor: "#3D91F4" },
  replyPreviewName: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  replyPreviewText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    paddingHorizontal: 12, paddingTop: 10,
  },
  attachBtn: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  inputWrapper: {
    flex: 1, borderRadius: 18, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, maxHeight: 120,
  },
  input: { fontSize: 15, lineHeight: 22 },
  sendBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },

  mutedBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  mutedText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  nonMemberBar: { alignItems: "center", justifyContent: "center", padding: 16 },
  nonMemberText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
