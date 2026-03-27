import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { User } from "@/context/AppContext";

function UserPickerModal({ users, currentUser, onSelect, onClose, colors, t }: any) {
  const others = users.filter((u: User) => u.id !== currentUser?.id);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.modalBg, { backgroundColor: colors.overlay }]} onPress={onClose} />
      <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.modalHandle} />
        <Text style={[styles.modalTitle, { color: colors.text }]}>
          {t("startChat")}
        </Text>
        <FlatList
          data={others}
          keyExtractor={(u) => u.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const color = ACCENT_COLORS[item.name.length % ACCENT_COLORS.length];
            return (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                style={[styles.userItem, { borderColor: colors.border }]}
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
                  <Text style={[styles.userPhone, { color: colors.textSecondary }]}>{item.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyPicker}>
              <Ionicons name="people-outline" size={40} color={colors.border} />
              <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 8 }]}>
                لا يوجد مستخدمون آخرون
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

export default function MessagesScreen() {
  const { conversations, users, currentUser, getConversation, t, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [showPicker, setShowPicker] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const myConvos = conversations.filter((c) => c.participants.includes(currentUser?.id || ""));

  const handleSelectUser = (user: User) => {
    const convo = getConversation(user.id);
    setShowPicker(false);
    router.push(`/chat/${convo.id}`);
  };

  const getOtherUser = (convo: any) => {
    return convo.participantUsers.find((u: User) => u.id !== currentUser?.id);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          theme === "dark"
            ? ["rgba(59,130,246,0.15)", "transparent"]
            : ["rgba(59,130,246,0.07)", "transparent"]
        }
        style={[styles.headerGrad, { paddingTop: topPad }]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t("messages")}</Text>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={[styles.newChatBtn, { backgroundColor: "#3B82F6" }]}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {myConvos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t("noMessages")}</Text>
          <TouchableOpacity onPress={() => setShowPicker(true)}>
            <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>{t("startChat")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={[...myConvos].sort((a, b) => b.updatedAt - a.updatedAt)}
          keyExtractor={(c) => c.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const other = getOtherUser(item);
            if (!other) return null;
            const color = ACCENT_COLORS[other.name.length % ACCENT_COLORS.length];
            return (
              <TouchableOpacity
                onPress={() => router.push(`/chat/${item.id}`)}
                style={[styles.convoItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
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
                    <Text style={[styles.convoName, { color: colors.text }]}>{other.name}</Text>
                    {item.lastMessage && (
                      <Text style={[styles.convoTime, { color: colors.textSecondary }]}>
                        {formatTime(item.lastMessage.timestamp)}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.convoLastMsg, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.lastMessage?.content || t("startChat")}
                  </Text>
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
          colors={colors}
          t={t}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  newChatBtn: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  list: { padding: 16, gap: 10 },
  convoItem: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 18, borderWidth: 1,
    padding: 14, gap: 12,
  },
  convoAvatar: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  convoAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  convoAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    resizeMode: "cover",
  },
  convoInfo: { flex: 1 },
  convoTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convoName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  convoTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  convoLastMsg: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_500Medium" },
  emptyBtn: {
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16,
    shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  emptyBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  modalBg: { ...StyleSheet.absoluteFillObject },
  modalSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 24, paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#ccc", alignSelf: "center", marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 16, textAlign: "center" },
  userItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderBottomWidth: 1, paddingVertical: 12,
  },
  userAvatar: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  userAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  userAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    resizeMode: "cover",
  },
  userName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  userPhone: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  emptyPicker: { alignItems: "center", paddingVertical: 40 },
});
