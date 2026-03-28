import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Image,
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
  roomId?: string;
  isRoomOwner?: boolean;
  onClose: () => void;
}

export default function UserActionsModal({
  visible,
  targetUser,
  roomId,
  isRoomOwner,
  onClose,
}: UserActionsModalProps) {
  const { currentUser, isSuperAdmin, getConversation, blockUser, kickFromRoom, t, theme } = useApp();
  const { showToast } = useToast();
  const colors = Colors[theme];

  if (!targetUser) return null;

  const isMe = targetUser.id === currentUser?.id;
  if (isMe) return null;

  const uColor = ACCENT_COLORS[targetUser.name.length % ACCENT_COLORS.length];
  const canKick = (isRoomOwner || isSuperAdmin) && !!roomId;

  const handleMessage = () => {
    onClose();
    const convo = getConversation(targetUser.id);
    router.push(`/chat/${convo.id}`);
  };

  const handleBlock = () => {
    onClose();
    blockUser(targetUser.id);
    showToast(`تم حظر ${targetUser.name}`, "error");
  };

  const handleKick = () => {
    if (!roomId) return;
    onClose();
    kickFromRoom(roomId, targetUser.id);
    showToast(`تم طرد ${targetUser.name} من الغرفة`, "info");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <View style={styles.userRow}>
            <View style={[styles.avatar, { backgroundColor: `${uColor}33` }]}>
              {targetUser.avatar ? (
                <Image source={{ uri: targetUser.avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={[styles.avatarText, { color: uColor }]}>
                  {targetUser.name[0]?.toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: colors.text }]}>{targetUser.name}</Text>
              <Text style={[styles.userPhone, { color: colors.textSecondary }]}>{targetUser.phone}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#3B82F618", borderColor: "#3B82F633" }]}
            onPress={handleMessage}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: "#3B82F622" }]}>
              <Ionicons name="chatbubble-outline" size={18} color="#3B82F6" />
            </View>
            <Text style={[styles.actionLabel, { color: "#3B82F6" }]}>{t("sendMessage")}</Text>
            <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: `${colors.danger}12`, borderColor: `${colors.danger}30` }]}
            onPress={handleBlock}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: `${colors.danger}18` }]}>
              <Ionicons name="ban-outline" size={18} color={colors.danger} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.danger }]}>{t("block")}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.danger} />
          </TouchableOpacity>

          {canKick && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}30` }]}
              onPress={handleKick}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: `${colors.warning}18` }]}>
                <Ionicons name="exit-outline" size={18} color={colors.warning} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.warning }]}>{t("kickFromRoom")}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.warning} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 15 }}>
              {t("cancel")}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", borderRadius: 16 },
  avatarText: { fontSize: 22, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  userPhone: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  divider: { height: 1, backgroundColor: "rgba(128,128,128,0.15)", marginVertical: 2 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  actionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  cancelBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
});
