import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { AppNotification } from "@/context/AppContext";

const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";

const NOTIF_ICONS: Record<string, { name: string; color: string }> = {
  follow_request: { name: "user-plus", color: "#9B59B6" },
  follow_accept: { name: "user-check", color: "#34D399" },
  like: { name: "heart", color: "#FF3B5C" },
  comment: { name: "message-circle", color: "#3D91F4" },
  post: { name: "image", color: "#FBBF24" },
  story: { name: "circle", color: "#EC4899" },
  story_like: { name: "heart", color: "#EC4899" },
  story_reply: { name: "message-square", color: "#EC4899" },
  message: { name: "message-circle", color: "#00BCD4" },
};

function NotifItem({
  notif,
  onPress,
}: {
  notif: AppNotification;
  onPress: () => void;
}) {
  const accentColor = ACCENT_COLORS[(notif.senderName?.length ?? 0) % ACCENT_COLORS.length];
  const icon = NOTIF_ICONS[notif.type] ?? { name: "bell", color: "#FFFFFF" };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `${mins} دقيقة`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ساعة`;
    return `${Math.floor(hrs / 24)} يوم`;
  };

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.notifItem,
        !notif.isRead && { backgroundColor: "rgba(61,145,244,0.06)" },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.notifAvatarWrap}>
        {notif.senderAvatar ? (
          <Image source={{ uri: notif.senderAvatar }} style={styles.notifAvatar} />
        ) : (
          <View
            style={[styles.notifAvatar, { backgroundColor: `${accentColor}33`, alignItems: "center", justifyContent: "center" }]}
          >
            <Text style={[styles.notifAvatarText, { color: accentColor }]}>
              {notif.senderName?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[styles.notifTypeBadge, { backgroundColor: icon.color }]}>
          <Feather name={icon.name as any} size={9} color="#fff" strokeWidth={2} />
        </View>
      </View>

      <View style={styles.notifContent}>
        <Text style={styles.notifMessage} numberOfLines={2}>
          <Text style={styles.notifSenderName}>{notif.senderName}</Text>
          {"  "}
          {notif.message.replace(notif.senderName, "").trim()}
        </Text>
        <Text style={styles.notifTime}>{formatTime(notif.createdAt)}</Text>
      </View>

      {!notif.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const {
    notifications,
    currentUser,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadNotificationsCount,
    conversations,
    t,
  } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const myNotifs = notifications
    .filter((n) => n.recipientId === currentUser?.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  const unreadCount = getUnreadNotificationsCount();

  const handleNotifPress = (notif: AppNotification) => {
    markNotificationRead(notif.id);
    if (notif.type === "follow_request" || notif.type === "follow_accept") {
      router.push(`/profile/${notif.senderId}`);
    } else if (notif.type === "like" || notif.type === "comment" || notif.type === "post") {
      if (notif.referenceId) router.push(`/post/${notif.referenceId}`);
      else router.push(`/profile/${notif.senderId}`);
    } else if (notif.type === "story" || notif.type === "story_like") {
      router.push(`/story/${notif.senderId}`);
    } else if (notif.type === "story_reply") {
      const convo = conversations.find(
        (c) =>
          c.participants.includes(currentUser?.id ?? "") &&
          c.participants.includes(notif.senderId)
      );
      if (convo) router.push(`/chat/${convo.id}`);
      else router.push("/(tabs)/messages" as any);
    } else if (notif.type === "message") {
      const convo = conversations.find(
        (c) =>
          c.participants.includes(currentUser?.id ?? "") &&
          c.participants.includes(notif.senderId)
      );
      if (convo) router.push(`/chat/${convo.id}`);
      else router.push("/(tabs)/messages" as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={TEXT} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("notifications")}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              markAllNotificationsRead();
            }}
            style={styles.markAllBtn}
          >
            <Text style={styles.markAllText}>قراءة الكل</Text>
          </TouchableOpacity>
        )}
      </View>

      {myNotifs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="bell-off" size={40} color={TEXT2} strokeWidth={1} />
          </View>
          <Text style={styles.emptyTitle}>{t("noNotifications")}</Text>
          <Text style={styles.emptyDesc}>ستظهر هنا إشعاراتك حين تصلك</Text>
        </View>
      ) : (
        <FlatList
          data={myNotifs}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NotifItem notif={item} onPress={() => handleNotifPress(item)} />
          )}
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
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", color: TEXT },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, backgroundColor: "#1C1C1C" },
  markAllText: { fontSize: 13, fontFamily: "Inter_500Medium", color: TEXT2 },

  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  notifAvatarWrap: { position: "relative", width: 48, height: 48 },
  notifAvatar: { width: 48, height: 48, borderRadius: 24, overflow: "hidden" },
  notifAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  notifTypeBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: BG,
  },
  notifContent: { flex: 1, gap: 3 },
  notifMessage: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT, lineHeight: 20 },
  notifSenderName: { fontFamily: "Inter_600SemiBold" },
  notifTime: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3D91F4" },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 40 },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#1C1C1C",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: TEXT },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT2, textAlign: "center" },
});
