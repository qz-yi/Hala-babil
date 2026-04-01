import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { User } from "@/context/AppContext";

const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";

function UserPickerModal({ users, currentUser, onSelect, onClose, t }: any) {
  const others = users.filter((u: User) => u.id !== currentUser?.id);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>{t("startChat")}</Text>
        <FlatList
          data={others}
          keyExtractor={(u) => u.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 0, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const color = ACCENT_COLORS[item.name.length % ACCENT_COLORS.length];
            return (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(item);
                }}
                style={styles.userItem}
                activeOpacity={0.7}
              >
                <View style={[styles.userAvatar, { backgroundColor: `${color}33` }]}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.userAvatarImg} />
                  ) : (
                    <Text style={[styles.userAvatarText, { color }]}>{item.name[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userPhone}>{item.phone}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={TEXT2} strokeWidth={1.5} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyPicker}>
              <Feather name="users" size={36} color={BORDER} strokeWidth={1} />
              <Text style={styles.emptyText}>لا يوجد مستخدمون آخرون</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

export default function MessagesScreen() {
  const { conversations, users, currentUser, getConversation, t } = useApp();
  const insets = useSafeAreaInsets();
  const [showPicker, setShowPicker] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const myConvos = conversations.filter((c) => c.participants.includes(currentUser?.id || ""));

  const handleSelectUser = (user: User) => {
    const convo = getConversation(user.id);
    setShowPicker(false);
    router.push(`/chat/${convo.id}`);
  };

  const getOtherUser = (convo: any) =>
    convo.participantUsers.find((u: User) => u.id !== currentUser?.id);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={styles.headerTitle}>{t("messages")}</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowPicker(true);
          }}
          style={styles.newChatBtn}
        >
          <Feather name="edit" size={20} color={TEXT} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {myConvos.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="message-circle" size={56} color={BORDER} strokeWidth={1} />
          <Text style={styles.emptyTitle}>{t("noMessages")}</Text>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={styles.emptyBtn}
          >
            <Text style={styles.emptyBtnText}>{t("startChat")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={[...myConvos].sort((a, b) => b.updatedAt - a.updatedAt)}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 90, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const other = getOtherUser(item);
            if (!other) return null;
            const color = ACCENT_COLORS[other.name.length % ACCENT_COLORS.length];
            const hasUnread = item.messages?.some(
              (m: any) => m.receiverId === currentUser?.id && !m.read
            );
            return (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/chat/${item.id}`);
                }}
                style={styles.convoItem}
                activeOpacity={0.7}
              >
                <View style={[styles.convoAvatar, { backgroundColor: `${color}33` }]}>
                  {other.avatar ? (
                    <Image source={{ uri: other.avatar }} style={styles.convoAvatarImg} />
                  ) : (
                    <Text style={[styles.convoAvatarText, { color }]}>{other.name[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <View style={styles.convoInfo}>
                  <View style={styles.convoTopRow}>
                    <Text style={[styles.convoName, hasUnread && { color: TEXT }]}>{other.name}</Text>
                    {item.lastMessage && (
                      <Text style={styles.convoTime}>{formatTime(item.lastMessage.timestamp)}</Text>
                    )}
                  </View>
                  <View style={styles.convoBottomRow}>
                    <Text style={[styles.convoLastMsg, hasUnread && { color: TEXT, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                      {item.lastMessage?.type === "shared"
                        ? "📎 محتوى مشارك"
                        : item.lastMessage?.type === "image"
                        ? "📷 صورة"
                        : item.lastMessage?.type === "video"
                        ? "🎥 فيديو"
                        : item.lastMessage?.type === "audio"
                        ? "🎤 رسالة صوتية"
                        : item.lastMessage?.content || t("startChat")}
                    </Text>
                    {hasUnread && <View style={styles.unreadDot} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {showPicker && (
        <UserPickerModal
          users={users}
          currentUser={currentUser}
          onSelect={handleSelectUser}
          onClose={() => setShowPicker(false)}
          t={t}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: TEXT },
  newChatBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  convoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  convoAvatar: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  convoAvatarImg: { width: "100%", height: "100%", borderRadius: 27 },
  convoAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  convoInfo: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingBottom: 12 },
  convoTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convoBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 3 },
  convoName: { fontSize: 16, fontFamily: "Inter_500Medium", color: TEXT },
  convoTime: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2 },
  convoLastMsg: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT2, flex: 1 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#3D91F4", marginLeft: 8 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_500Medium", color: TEXT2 },
  emptyBtn: {
    backgroundColor: TEXT,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 100,
    marginTop: 8,
  },
  emptyBtnText: { color: BG, fontSize: 15, fontFamily: "Inter_600SemiBold" },

  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CARD,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 0.5,
    borderColor: BORDER,
    padding: 24,
    paddingBottom: 44,
    maxHeight: "80%",
  },
  modalHandle: { width: 36, height: 3, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: TEXT, marginBottom: 16, textAlign: "center" },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  userAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  userAvatarImg: { width: "100%", height: "100%", borderRadius: 23 },
  userAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 16, fontFamily: "Inter_500Medium", color: TEXT },
  userPhone: { fontSize: 13, fontFamily: "Inter_400Regular", color: TEXT2, marginTop: 2 },
  emptyPicker: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { color: TEXT2, fontFamily: "Inter_400Regular" },
});
