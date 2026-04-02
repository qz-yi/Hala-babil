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
  const { kickFromRoom, banFromRoom, muteUserInRoom, t, theme } = useApp();
  const { showToast } = useToast();
  const colors = Colors[theme];

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
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: `${userColor}15`, borderColor: `${userColor}33` }]}
              onPress={handleMute}
            >
              <Ionicons
                name={isMuted ? "mic-outline" : "mic-off-outline"}
                size={20}
                color={userColor}
              />
              <Text style={[styles.actionText, { color: userColor }]}>
                {isMuted ? "رفع الكتم" : "كتم"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#F59E0B15", borderColor: "#F59E0B33" }]}
              onPress={handleKick}
            >
              <Ionicons name="exit-outline" size={20} color="#F59E0B" />
              <Text style={[styles.actionText, { color: "#F59E0B" }]}>
                {t("kickFromRoom")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: `${colors.danger}15`, borderColor: `${colors.danger}33` }]}
              onPress={handleBan}
            >
              <Ionicons name="ban-outline" size={20} color={colors.danger} />
              <Text style={[styles.actionText, { color: colors.danger }]}>
                حظر
              </Text>
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
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionText: {
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
