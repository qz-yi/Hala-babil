import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
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
import { useApp } from "@/context/AppContext";
import type { GroupMember } from "@/context/AppContext";


export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    groups, currentUser, users, kickGroupMember, banGroupMember,
    muteGroupMember, unmuteGroupMember, promoteToAdmin, demoteAdmin,
    leaveGroup, editGroup, theme,
  } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPrivacy, setEditPrivacy] = useState<"public" | "private">("public");
  const [editPhoto, setEditPhoto] = useState<string | undefined>();
  const [memberAction, setMemberAction] = useState<GroupMember | null>(null);

  const group = groups.find((g) => g.id === id);

  if (!group) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: colors.textSecondary }}>المجموعة غير موجودة</Text>
      </View>
    );
  }

  const myRole = group.members.find((m) => m.userId === currentUser?.id)?.role;
  const isOwnerOrAdmin = myRole === "owner" || myRole === "admin";
  const isMember = !!myRole;

  const membersWithUsers = group.members.map((m) => ({
    member: m,
    user: users.find((u) => u.id === m.userId),
  }));

  const handleOpenEdit = () => {
    setEditName(group.name);
    setEditPrivacy(group.privacy);
    setEditPhoto(group.photo);
    setShowEditModal(true);
  };

  const handlePickPhoto = async () => {
    if (Platform.OS === "web") return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setEditPhoto(result.assets[0].uri);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    editGroup(id, editName.trim(), editPhoto, editPrivacy);
    setShowEditModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLeave = () => {
    if (myRole === "owner") {
      Alert.alert("لا يمكنك المغادرة", "أنت مالك المجموعة. يجب نقل الملكية أو حذف المجموعة أولاً.");
      return;
    }
    Alert.alert("مغادرة المجموعة", "هل أنت متأكد أنك تريد مغادرة المجموعة؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "مغادرة", style: "destructive", onPress: () => {
          leaveGroup(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace("/(tabs)/messages" as any);
        },
      },
    ]);
  };

  const handleMemberAction = (action: string) => {
    if (!memberAction) return;
    const uid = memberAction.userId;
    setMemberAction(null);
    switch (action) {
      case "kick":
        Alert.alert("إخراج العضو", "هل تريد إخراج هذا العضو؟", [
          { text: "إلغاء", style: "cancel" },
          { text: "إخراج", style: "destructive", onPress: () => { kickGroupMember(id, uid); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
        ]);
        break;
      case "ban":
        Alert.alert("حظر العضو", "هل تريد حظر هذا العضو؟ لن يتمكن من الانضمام مجدداً.", [
          { text: "إلغاء", style: "cancel" },
          { text: "حظر", style: "destructive", onPress: () => { banGroupMember(id, uid); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
        ]);
        break;
      case "mute":
        muteGroupMember(id, uid);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "unmute":
        unmuteGroupMember(id, uid);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "promote":
        promoteToAdmin(id, uid);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "demote":
        demoteAdmin(id, uid);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  };

  const actionMemberUser = memberAction ? users.find((u) => u.id === memberAction.userId) : null;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { borderColor: colors.border }]} activeOpacity={0.8}>
          <Feather name="arrow-right" size={20} color={colors.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>معلومات المجموعة</Text>
        {isOwnerOrAdmin && (
          <TouchableOpacity onPress={handleOpenEdit} style={[s.editBtn, { borderColor: colors.border }]} activeOpacity={0.8}>
            <Feather name="edit-2" size={18} color={colors.tint} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: botPad + 40 }} showsVerticalScrollIndicator={false}>
        {/* Group Avatar + Info */}
        <View style={s.topSection}>
          <View style={[s.groupAvatar, { backgroundColor: `${colors.tint}25` }]}>
            {group.photo ? (
              <Image source={{ uri: group.photo }} style={s.groupAvatarImg} />
            ) : (
              <Feather name="users" size={36} color={colors.tint} strokeWidth={1.5} />
            )}
          </View>
          <Text style={[s.groupName, { color: colors.text }]}>{group.name}</Text>
          <View style={s.groupMeta}>
            <View style={[s.badge, { backgroundColor: `${colors.tint}22` }]}>
              <Feather name={group.privacy === "public" ? "globe" : "lock"} size={12} color={colors.tint} strokeWidth={1.5} />
              <Text style={[s.badgeText, { color: colors.tint }]}>{group.privacy === "public" ? "عامة" : "خاصة"}</Text>
            </View>
            <Text style={[s.groupIdText, { color: colors.textSecondary }]}>@{group.groupId}</Text>
          </View>
          <Text style={[s.memberCount, { color: colors.textSecondary }]}>{group.members.length} عضو</Text>
        </View>

        {/* Members List */}
        <View style={[s.section, { borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>الأعضاء</Text>
          {membersWithUsers.map(({ member, user }) => {
            const isCurrentUser = member.userId === currentUser?.id;
            const color = ACCENT_COLORS[(user?.name || "?").length % ACCENT_COLORS.length];
            const roleBadge = member.role === "owner" ? "👑 مالك" : member.role === "admin" ? "⚡ مشرف" : null;
            return (
              <TouchableOpacity
                key={member.userId}
                onPress={() => {
                  if (!isCurrentUser && isOwnerOrAdmin && member.role !== "owner") {
                    setMemberAction(member);
                  } else if (!isCurrentUser && !isOwnerOrAdmin) {
                    router.push(`/profile/${member.userId}` as any);
                  }
                }}
                style={[s.memberRow, { borderBottomColor: colors.border }]}
                activeOpacity={0.75}
              >
                <View style={[s.memberAvatar, { backgroundColor: `${color}33` }]}>
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={s.memberAvatarImg} />
                  ) : (
                    <Text style={[s.memberAvatarText, { color }]}>{(user?.name || "?")[0].toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[s.memberName, { color: colors.text }]}>{user?.name || "مجهول"}</Text>
                    {isCurrentUser && <Text style={[s.youBadge, { color: colors.tint }]}>(أنت)</Text>}
                  </View>
                  {user?.username && (
                    <Text style={[s.memberUsername, { color: colors.textSecondary }]}>@{user.username}</Text>
                  )}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {member.isMuted && <Feather name="mic-off" size={14} color={colors.textSecondary} strokeWidth={1.5} />}
                  {roleBadge && (
                    <View style={[s.roleBadge, { backgroundColor: member.role === "owner" ? "#F59E0B22" : `${colors.tint}22` }]}>
                      <Text style={[s.roleBadgeText, { color: member.role === "owner" ? "#F59E0B" : colors.tint }]}>{roleBadge}</Text>
                    </View>
                  )}
                  {!isCurrentUser && isOwnerOrAdmin && member.role !== "owner" && (
                    <Feather name="more-vertical" size={16} color={colors.textSecondary} strokeWidth={1.5} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Leave Group */}
        {isMember && (
          <TouchableOpacity
            onPress={handleLeave}
            style={[s.leaveBtn, { borderColor: "#FF3B5C33", backgroundColor: "#FF3B5C11" }]}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={18} color="#FF3B5C" strokeWidth={1.5} />
            <Text style={s.leaveBtnText}>مغادرة المجموعة</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Edit Group Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <Pressable style={s.modalBg} onPress={() => setShowEditModal(false)} />
        <View style={[s.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[s.modalTitle, { color: colors.text }]}>تعديل المجموعة</Text>

          <TouchableOpacity onPress={handlePickPhoto} style={s.editPhotoWrap} activeOpacity={0.85}>
            <View style={[s.editPhoto, { backgroundColor: `${colors.tint}22` }]}>
              {editPhoto ? (
                <Image source={{ uri: editPhoto }} style={s.editPhotoImg} />
              ) : group.photo ? (
                <Image source={{ uri: group.photo }} style={s.editPhotoImg} />
              ) : (
                <Feather name="camera" size={24} color={colors.tint} strokeWidth={1.5} />
              )}
            </View>
            <Text style={[s.editPhotoLabel, { color: colors.tint }]}>تغيير الصورة</Text>
          </TouchableOpacity>

          <View style={[s.editInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[s.editInputText, { color: colors.text }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="اسم المجموعة"
              placeholderTextColor={colors.textSecondary}
              textAlign="right"
              maxLength={50}
            />
          </View>

          <View style={s.privacyRow}>
            {(["public", "private"] as const).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setEditPrivacy(p)}
                style={[
                  s.privacyBtn,
                  { borderColor: editPrivacy === p ? colors.tint : colors.border, backgroundColor: editPrivacy === p ? `${colors.tint}22` : "transparent" },
                ]}
                activeOpacity={0.8}
              >
                <Feather name={p === "public" ? "globe" : "lock"} size={16} color={editPrivacy === p ? colors.tint : colors.textSecondary} strokeWidth={1.5} />
                <Text style={[s.privacyLabel, { color: editPrivacy === p ? colors.tint : colors.textSecondary }]}>
                  {p === "public" ? "عامة" : "خاصة"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleSaveEdit} style={[s.saveBtn, { backgroundColor: colors.tint }]} activeOpacity={0.85}>
            <Text style={s.saveBtnText}>حفظ التغييرات</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Member Action Sheet */}
      <Modal
        visible={!!memberAction}
        transparent
        animationType="slide"
        onRequestClose={() => setMemberAction(null)}
      >
        <Pressable style={s.modalBg} onPress={() => setMemberAction(null)} />
        <View style={[s.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
          {actionMemberUser && (
            <Text style={[s.modalTitle, { color: colors.text }]}>{actionMemberUser.name}</Text>
          )}

          {myRole === "owner" && memberAction?.role === "member" && (
            <TouchableOpacity style={s.actionRow} onPress={() => handleMemberAction("promote")} activeOpacity={0.8}>
              <View style={[s.actionIcon, { backgroundColor: `${colors.tint}22` }]}>
                <Feather name="shield" size={18} color={colors.tint} strokeWidth={1.5} />
              </View>
              <Text style={[s.actionLabel, { color: colors.text }]}>ترقية لمشرف</Text>
            </TouchableOpacity>
          )}

          {myRole === "owner" && memberAction?.role === "admin" && (
            <TouchableOpacity style={s.actionRow} onPress={() => handleMemberAction("demote")} activeOpacity={0.8}>
              <View style={[s.actionIcon, { backgroundColor: "#F59E0B22" }]}>
                <Feather name="shield-off" size={18} color="#F59E0B" strokeWidth={1.5} />
              </View>
              <Text style={[s.actionLabel, { color: colors.text }]}>إزالة صلاحية المشرف</Text>
            </TouchableOpacity>
          )}

          {memberAction?.isMuted ? (
            <TouchableOpacity style={s.actionRow} onPress={() => handleMemberAction("unmute")} activeOpacity={0.8}>
              <View style={[s.actionIcon, { backgroundColor: "#10B98122" }]}>
                <Feather name="mic" size={18} color="#10B981" strokeWidth={1.5} />
              </View>
              <Text style={[s.actionLabel, { color: colors.text }]}>إلغاء الكتم</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.actionRow} onPress={() => handleMemberAction("mute")} activeOpacity={0.8}>
              <View style={[s.actionIcon, { backgroundColor: "#F59E0B22" }]}>
                <Feather name="mic-off" size={18} color="#F59E0B" strokeWidth={1.5} />
              </View>
              <Text style={[s.actionLabel, { color: colors.text }]}>كتم</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={s.actionRow} onPress={() => handleMemberAction("kick")} activeOpacity={0.8}>
            <View style={[s.actionIcon, { backgroundColor: "#FF3B5C22" }]}>
              <Feather name="user-x" size={18} color="#FF3B5C" strokeWidth={1.5} />
            </View>
            <Text style={[s.actionLabel, { color: "#FF3B5C" }]}>إخراج من المجموعة</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionRow} onPress={() => handleMemberAction("ban")} activeOpacity={0.8}>
            <View style={[s.actionIcon, { backgroundColor: "#FF3B5C22" }]}>
              <Feather name="slash" size={18} color="#FF3B5C" strokeWidth={1.5} />
            </View>
            <Text style={[s.actionLabel, { color: "#FF3B5C" }]}>حظر</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMemberAction(null)}
            style={[s.cancelBtn, { borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Text style={[s.cancelBtnText, { color: colors.textSecondary }]}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 0.5,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  editBtn: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  topSection: { alignItems: "center", padding: 28, gap: 8 },
  groupAvatar: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  groupAvatarImg: { width: "100%", height: "100%", borderRadius: 48 },
  groupName: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center", marginTop: 4 },
  groupMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  groupIdText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  memberCount: { fontSize: 14, fontFamily: "Inter_400Regular" },

  section: { marginHorizontal: 16, borderWidth: 1, borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", padding: 12, paddingBottom: 8, textAlign: "right" },
  memberRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 0.5,
  },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  memberAvatarImg: { width: "100%", height: "100%", borderRadius: 22 },
  memberAvatarText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  memberName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  memberUsername: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  youBadge: { fontSize: 12, fontFamily: "Inter_400Regular" },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  roleBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  leaveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    marginHorizontal: 16, marginTop: 8, borderRadius: 16, borderWidth: 1, paddingVertical: 14,
  },
  leaveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FF3B5C" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  modalSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, padding: 20, paddingBottom: 40,
  },
  modalHandle: { width: 36, height: 3, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 16 },

  editPhotoWrap: { alignItems: "center", gap: 8, marginBottom: 16 },
  editPhoto: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  editPhotoImg: { width: "100%", height: "100%", borderRadius: 36 },
  editPhotoLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },

  editInput: {
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
  },
  editInputText: { fontSize: 15, fontFamily: "Inter_400Regular" },

  privacyRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  privacyBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14, borderWidth: 1.5, paddingVertical: 12 },
  privacyLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  saveBtn: { borderRadius: 20, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },

  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 4 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },

  cancelBtn: { borderRadius: 16, borderWidth: 1, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
