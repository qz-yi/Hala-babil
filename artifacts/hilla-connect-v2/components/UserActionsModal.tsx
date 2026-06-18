import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import type { User } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

interface UserActionsModalProps {
  visible: boolean;
  targetUser: User | null;
  roomId: string;
  isRoomOwner: boolean;
  mutedUsers: string[];
  onClose: () => void;
}

export default function UserActionsModal({
  visible,
  targetUser,
  roomId,
  isRoomOwner,
  mutedUsers,
  onClose,
}: UserActionsModalProps) {
  const { kickFromRoom, banFromRoom, muteUserInRoom, t } = useApp();
  const { showToast } = useToast();
  const colors = useColors();

  if (!targetUser) return null;

  const isMuted = mutedUsers.includes(targetUser.id);
  const userColor = ACCENT_COLORS[targetUser.name.length % ACCENT_COLORS.length];

  const handleMute = () => {
    muteUserInRoom(roomId, targetUser.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showToast(isMuted ? "تم رفع الكتم عن المستخدم" : "تم كتم المستخدم", "info");
    onClose();
  };

  const handleKick = () => {
    kickFromRoom(roomId, targetUser.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showToast("تم طرد المستخدم من الغرفة", "info");
    onClose();
  };

  const handleBan = () => {
    banFromRoom(roomId, targetUser.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    showToast("تم حظر المستخدم من الغرفة", "error");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.handle} />

        <View style={styles.userHeader}>
          <View style={[styles.avatar, { backgroundColor: `${userColor}33` }]}>
            <Text style={[styles.avatarText, { color: userColor }]}>
              {targetUser.name[0]?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {targetUser.name}
            </Text>
          </View>
        </View>

        {isRoomOwner && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionRow} onPress={handleMute} activeOpacity={0.6}>
              <View style={[styles.actionIconSlot]}>
                <Ionicons name={isMuted ? "mic-outline" : "mic-off-outline"} size={21} color={userColor} />
              </View>
              <Text style={[styles.actionText, { color: userColor }]}>
                {isMuted ? "رفع الكتم" : "كتم"}
              </Text>
              <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.actionRow} onPress={handleKick} activeOpacity={0.6}>
              <View style={styles.actionIconSlot}>
                <Ionicons name="exit-outline" size={21} color="#F59E0B" />
              </View>
              <Text style={[styles.actionText, { color: "#F59E0B" }]}>{t("kickFromRoom")}</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.actionRow} onPress={handleBan} activeOpacity={0.6}>
              <View style={styles.actionIconSlot}>
                <Ionicons name="ban-outline" size={21} color={colors.danger} />
              </View>
              <Text style={[styles.actionText, { color: colors.danger }]}>حظر</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.cancelBtn, { backgroundColor: colors.backgroundTertiary }]}
          onPress={onClose}
        >
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(128,128,128,0.3)",
    alignSelf: "center",
    marginBottom: 20,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  actions: {
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 4,
    minHeight: 52,
  },
  actionIconSlot: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 54,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
});
