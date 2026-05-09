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
import { useColors } from "@/hooks/useColors";
import { useApp, isUserVerified } from "@/context/AppContext";
import type { Conversation, User } from "@/context/AppContext";
import { VerifiedBadge } from "@/components/VerifiedBadge";

const TINT = "#3D91F4";

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

function NewChatPicker({ visible, onClose, onNewChat, onNewGroup, colors }: {
  visible: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  colors: any;
}) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.deleteBg} onPress={onClose} />
      <View style={[styles.actionSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.modalTitle, { color: colors.text }]}>محادثة جديدة</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => { onClose(); onNewChat(); }}
          activeOpacity={0.75}
        >
          <View style={[styles.actionIcon, { backgroundColor: `${TINT}22` }]}>
            <Feather name="message-circle" size={22} color={TINT} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionLabel, { color: colors.text }]}>محادثة خاصة</Text>
            <Text style={[{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.textSecondary, marginTop: 2 }]}>
              تحدث مع شخص واحد
            </Text>
          </View>
          <Feather name="chevron-left" size={16} color={colors.textSecondary} strokeWidth={1.5} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => { onClose(); onNewGroup(); }}
          activeOpacity={0.75}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#10B98122" }]}>
            <Feather name="users" size={22} color="#10B981" strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionLabel, { color: colors.text }]}>مجموعة جديدة</Text>
            <Text style={[{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.textSecondary, marginTop: 2 }]}>
              أنشئ مجموعة مع عدة أشخاص
            </Text>
          </View>
          <Feather name="chevron-left" size={16} color={colors.textSecondary} strokeWidth={1.5} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClose}
          style={[styles.deleteCancel, { backgroundColor: colors.backgroundTertiary ?? colors.card, marginTop: 8 }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.deleteCancelText, { color: colors.textSecondary }]}>إلغاء</Text>
        </TouchableOpacity>
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
  const {
    conversations, users, currentUser, getConversation, deleteConversation,
    archiveConversation, unarchiveConversation, t, theme,
    groups, getMyGroups,
  } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showNewChatPicker, setShowNewChatPicker] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const myConvos = conversations.filter((c) => c.participants.includes(currentUser?.id || ""));
  const activeConvos = myConvos.filter((c) => !(c as any).archived);
  const archivedConvos = myConvos.filter((c) => (c as any).archived);
  const myGroups = getMyGroups();

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

  const [actionTarget, setActionTarget] = useState<Conversation | null>(null);
  const handleLongPress = (convo: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionTarget(convo);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteConversation(deleteTarget.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDeleteTarget(null);
    }
  };

  const visibleConvos = showArchived ? archivedConvos : activeConvos;
  const archivedUnread = archivedConvos.reduce(
    (acc, c) => acc + (c.messages?.filter((m: any) => m.receiverId === currentUser?.id && !m.read).length || 0),
    0,
  );

  // Combine DMs and Groups into one unified list sorted by updatedAt
  type ListItem =
    | { kind: "dm"; data: Conversation }
    | { kind: "group"; data: typeof myGroups[0] };

  const dmItems: ListItem[] = (showArchived ? archivedConvos : activeConvos).map((c) => ({ kind: "dm", data: c }));
  const groupItems: ListItem[] = myGroups.map((g) => ({ kind: "group", data: g }));
  const allItems: ListItem[] = [...dmItems, ...groupItems].sort(
    (a, b) => (b.data.updatedAt ?? 0) - (a.data.updatedAt ?? 0)
  );

  const hasAnyContent = myConvos.length > 0 || myGroups.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: colors.border }]}
          activeOpacity={0.8}
        >
          <Feather name="arrow-right" size={20} color={colors.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("messages")}</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowNewChatPicker(true);
          }}
          style={styles.newChatBtn}
        >
          <Feather name="edit" size={20} color={colors.text} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {!hasAnyContent ? (
        <View style={styles.emptyState}>
          <Feather name="message-circle" size={56} color={colors.border} strokeWidth={1} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t("noMessages")}</Text>
          <TouchableOpacity
            onPress={() => setShowNewChatPicker(true)}
            style={[styles.emptyBtn, { backgroundColor: colors.tint }]}
          >
            <Text style={[styles.emptyBtnText, { color: colors.background }]}>{t("startChat")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={showArchived ? dmItems : allItems}
          ListHeaderComponent={
            <>
              {showArchived ? (
                <TouchableOpacity
                  style={[styles.archivedHeader, { borderBottomColor: colors.border }]}
                  onPress={() => setShowArchived(false)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.archivedIcon, { backgroundColor: "#F59E0B22" }]}>
                    <Feather name="arrow-right" size={18} color="#F59E0B" strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.archivedTitle, { color: colors.text }]}>المحادثات المؤرشفة</Text>
                    <Text style={[styles.archivedSub, { color: colors.textSecondary }]}>
                      {archivedConvos.length} محادثة
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : archivedConvos.length > 0 ? (
                <TouchableOpacity
                  style={[styles.archivedHeader, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowArchived(true);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.archivedIcon, { backgroundColor: "#F59E0B22" }]}>
                    <Feather name="archive" size={18} color="#F59E0B" strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.archivedTitle, { color: colors.text, flex: 1 }]}>
                    مؤرشف
                  </Text>
                  {archivedUnread > 0 && (
                    <View style={styles.archivedBadge}>
                      <Text style={styles.archivedBadgeText}>{archivedUnread}</Text>
                    </View>
                  )}
                  <Feather name="chevron-left" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </>
          }
          ListEmptyComponent={
            showArchived ? (
              <View style={styles.emptyState}>
                <Feather name="archive" size={48} color={colors.border} strokeWidth={1} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>لا توجد محادثات مؤرشفة</Text>
              </View>
            ) : null
          }
          keyExtractor={(item) => `${item.kind}-${item.data.id}`}
          contentContainerStyle={{ paddingBottom: insets.bottom + 90, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.kind === "group") {
              const group = item.data;
              const color = TINT;
              const lastMsg = group.lastMessage;
              return (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/group/${group.id}` as any);
                  }}
                  style={[styles.convoItem]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.convoAvatar, { backgroundColor: `${color}22` }]}>
                    {group.photo ? (
                      <Image source={{ uri: group.photo }} style={styles.convoAvatarImg} />
                    ) : (
                      <Feather name="users" size={22} color={color} strokeWidth={1.5} />
                    )}
                    <View style={styles.groupBadge}>
                      <Feather name="users" size={9} color="#fff" strokeWidth={2} />
                    </View>
                  </View>
                  <View style={[styles.convoInfo, { borderBottomColor: colors.border }]}>
                    <View style={styles.convoTopRow}>
                      <Text style={[styles.convoName, { color: colors.text }]} numberOfLines={1}>
                        {group.name}
                      </Text>
                      {lastMsg && (
                        <Text style={[styles.convoTime, { color: colors.textSecondary }]}>
                          {formatTime(lastMsg.timestamp)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.convoBottomRow}>
                      <Text style={[styles.convoLastMsg, { color: colors.textSecondary }]} numberOfLines={1}>
                        {lastMsg
                          ? lastMsg.type === "image"
                            ? "📷 صورة"
                            : lastMsg.type === "system"
                            ? lastMsg.content
                            : `${lastMsg.senderName}: ${lastMsg.content}`
                          : `${group.members.length} عضو`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }

            // DM conversation
            const convo = item.data as Conversation;
            const other = getOtherUser(convo);
            if (!other) return null;
            const color = ACCENT_COLORS[other.name.length % ACCENT_COLORS.length];
            const hasUnread = convo.messages?.some(
              (m: any) => m.receiverId === currentUser?.id && !m.read
            );
            return (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/chat/${convo.id}`);
                }}
                onLongPress={() => handleLongPress(convo)}
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
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1 }}>
                      <Text style={[styles.convoName, { color: hasUnread ? colors.text : colors.textSecondary }]}>{other.name}</Text>
                      {isUserVerified(other) && <VerifiedBadge size={12} />}
                    </View>
                    {convo.lastMessage && (
                      <Text style={[styles.convoTime, { color: colors.textSecondary }]}>{formatTime(convo.lastMessage.timestamp)}</Text>
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
                      {convo.lastMessage?.type === "shared"
                        ? "📎 محتوى مشارك"
                        : convo.lastMessage?.type === "image"
                        ? "📷 صورة"
                        : convo.lastMessage?.type === "video"
                        ? "🎥 فيديو"
                        : convo.lastMessage?.type === "audio"
                        ? "🎤 رسالة صوتية"
                        : convo.lastMessage?.content || t("startChat")}
                    </Text>
                    {hasUnread && <View style={styles.unreadDot} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* New chat type picker */}
      <NewChatPicker
        visible={showNewChatPicker}
        onClose={() => setShowNewChatPicker(false)}
        onNewChat={() => setShowPicker(true)}
        onNewGroup={() => router.push("/group/create" as any)}
        colors={colors}
      />

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

      {/* Long-press action sheet for DMs */}
      <Modal
        visible={!!actionTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setActionTarget(null)}
      >
        <Pressable style={styles.deleteBg} onPress={() => setActionTarget(null)} />
        <View style={[styles.actionSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              if (!actionTarget) return;
              const target = actionTarget;
              setActionTarget(null);
              if ((target as any).archived) unarchiveConversation(target.id);
              else archiveConversation(target.id);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#F59E0B22" }]}>
              <Feather name="archive" size={18} color="#F59E0B" strokeWidth={1.5} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>
              {actionTarget && (actionTarget as any).archived ? "إلغاء الأرشفة" : "أرشفة"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => { const t = actionTarget; setActionTarget(null); setDeleteTarget(t); }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#FF3B5C22" }]}>
              <Feather name="trash-2" size={18} color="#FF3B5C" strokeWidth={1.5} />
            </View>
            <Text style={[styles.actionLabel, { color: "#FF3B5C" }]}>حذف المحادثة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActionTarget(null)}
            style={[styles.deleteCancel, { backgroundColor: colors.backgroundTertiary ?? colors.card, marginTop: 8 }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.deleteCancelText, { color: colors.textSecondary }]}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
    gap: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 13, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  newChatBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  convoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  convoAvatar: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
  convoAvatarImg: { width: "100%", height: "100%", borderRadius: 27 },
  convoAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  groupBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 18, height: 18, borderRadius: 9, backgroundColor: "#10B981",
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#000",
  },
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

  deleteBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  deleteCard: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, padding: 24, paddingBottom: 44,
    alignItems: "center", gap: 10,
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

  archivedHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  archivedIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  archivedTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  archivedSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  archivedBadge: {
    minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11,
    backgroundColor: "#3D91F4", alignItems: "center", justifyContent: "center",
    marginRight: 6,
  },
  archivedBadgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },

  actionSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32,
  },
  actionRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 14, paddingHorizontal: 4,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
