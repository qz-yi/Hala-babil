import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { Conversation, User } from "@/context/AppContext";

function UserPickerModal({ users, currentUser, onSelect, onClose, t, colors }: any) {
  const others = users.filter((u: User) => u.id !== currentUser?.id);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.modalBg]} onPress={onClose} />
      <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.modalTitle, { color: colors.text }]}>{t("startChat")}</Text>
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
                style={[styles.userItem, { borderBottomColor: colors.border }]}
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
                  <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.userPhone, { color: colors.textSecondary }]}>@{item.username || item.email}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyPicker}>
              <Feather name="users" size={36} color={colors.border} strokeWidth={1} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>لا يوجد مستخدمون آخرون</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

function DeleteConvoModal({
  visible,
  onConfirm,
  onCancel,
  colors,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  colors: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.deleteBg} onPress={onCancel} />
      <View style={[styles.deleteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.deleteIconWrap]}>
          <Feather name="trash-2" size={32} color="#FF3B5C" strokeWidth={1.5} />
        </View>
        <Text style={[styles.deleteTitle, { color: colors.text }]}>حذف المحادثة</Text>
        <Text style={[styles.deleteDesc, { color: colors.textSecondary }]}>
          هل أنت متأكد من حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء.
        </Text>
        <TouchableOpacity onPress={onConfirm} style={styles.deleteConfirm} activeOpacity={0.85}>
          <Text style={styles.deleteConfirmText}>حذف المحادثة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCancel}
          style={[styles.deleteCancel, { backgroundColor: colors.backgroundTertiary ?? colors.card }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.deleteCancelText, { color: colors.textSecondary }]}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function MessagesScreen() {
  const { conversations, users, currentUser, getConversation, deleteConversation, t, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [showPicker, setShowPicker] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
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

  const handleLongPress = (convo: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeleteTarget(convo);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteConversation(deleteTarget.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDeleteTarget(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("messages")}</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowPicker(true);
          }}
          style={styles.newChatBtn}
        >
          <Feather name="edit" size={20} color={colors.text} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {myConvos.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="message-circle" size={56} color={colors.border} strokeWidth={1} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t("noMessages")}</Text>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={[styles.emptyBtn, { backgroundColor: colors.tint }]}
          >
            <Text style={[styles.emptyBtnText, { color: colors.background }]}>{t("startChat")}</Text>
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
                onLongPress={() => handleLongPress(item)}
                delayLongPress={400}
                style={[styles.convoItem]}
                activeOpacity={0.7}
              >
                <View style={[styles.convoAvatar, { backgroundColor: `${color}33` }]}>
                  {other.avatar ? (
                    <Image source={{ uri: other.avatar }} style={styles.convoAvatarImg} />
                  ) : (
                    <Text style={[styles.convoAvatarText, { color }]}>{other.name[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <View style={[styles.convoInfo, { borderBottomColor: colors.border }]}>
                  <View style={styles.convoTopRow}>
                    <Text style={[styles.convoName, { color: hasUnread ? colors.text : colors.textSecondary }]}>{other.name}</Text>
                    {item.lastMessage && (
                      <Text style={[styles.convoTime, { color: colors.textSecondary }]}>{formatTime(item.lastMessage.timestamp)}</Text>
                    )}
                  </View>
                  <View style={styles.convoBottomRow}>
                    <Text
                      style={[
                        styles.convoLastMsg,
                        { color: hasUnread ? colors.text : colors.textSecondary },
                        hasUnread && { fontFamily: "Inter_500Medium" },
                      ]}
                      numberOfLines={1}
                    >
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
          colors={colors}
        />
      )}

      <DeleteConvoModal
        visible={!!deleteTarget}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
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
  convoInfo: { flex: 1, borderBottomWidth: 0.5, paddingBottom: 12 },
  convoTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convoBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 3 },
  convoName: { fontSize: 16, fontFamily: "Inter_500Medium" },
  convoTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  convoLastMsg: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#3D91F4", marginLeft: 8 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_500Medium" },
  emptyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 100,
    marginTop: 8,
  },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 0.5,
    padding: 24,
    paddingBottom: 44,
    maxHeight: "80%",
  },
  modalHandle: { width: 36, height: 3, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 16, textAlign: "center" },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  userAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  userAvatarImg: { width: "100%", height: "100%", borderRadius: 23 },
  userAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 16, fontFamily: "Inter_500Medium" },
  userPhone: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  emptyPicker: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular" },

  // Delete modal
  deleteBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  deleteCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 24,
    paddingBottom: 44,
    alignItems: "center",
    gap: 10,
  },
  deleteIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#FF3B5C22",
    alignItems: "center", justifyContent: "center",
    marginVertical: 8,
  },
  deleteTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  deleteDesc: {
    fontSize: 14, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 20,
    paddingHorizontal: 10, marginBottom: 8,
  },
  deleteConfirm: {
    width: "100%", backgroundColor: "#FF3B5C",
    borderRadius: 20, paddingVertical: 16, alignItems: "center", marginTop: 4,
  },
  deleteConfirmText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  deleteCancel: {
    width: "100%", borderRadius: 20, paddingVertical: 16, alignItems: "center",
  },
  deleteCancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
