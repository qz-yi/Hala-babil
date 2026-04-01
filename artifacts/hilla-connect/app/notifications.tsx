import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { AppNotification } from "@/context/AppContext";

const NOTIF_ICONS: Record<string, { name: string; color: string }> = {
  follow_request: { name: "person-add-outline", color: "#7C3AED" },
  follow_accept: { name: "person-add", color: "#10B981" },
  like: { name: "heart", color: "#E1306C" },
  comment: { name: "chatbubble-outline", color: "#3B82F6" },
  post: { name: "images-outline", color: "#F59E0B" },
  story: { name: "radio-button-on-outline", color: "#EC4899" },
  story_like: { name: "heart", color: "#EC4899" },
  story_reply: { name: "chatbubble-ellipses-outline", color: "#EC4899" },
  message: { name: "chatbubbles-outline", color: "#06B6D4" },
};

function NotifItem({ notif, colors, onPress }: { notif: AppNotification; colors: any; onPress: () => void }) {
  const accentColor = ACCENT_COLORS[(notif.senderName?.length ?? 0) % ACCENT_COLORS.length];
  const icon = NOTIF_ICONS[notif.type] ?? { name: "notifications-outline", color: colors.tint };
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
      onPress={onPress}
      style={[
        styles.notifItem,
        {
          backgroundColor: notif.isRead ? colors.card : `${colors.tint}12`,
          borderColor: notif.isRead ? colors.border : `${colors.tint}30`,
        },
      ]}
      activeOpacity={0.8}
    >
      {/* Sender Avatar */}
      <View style={styles.notifAvatarWrap}>
        {notif.senderAvatar ? (
          <Image source={{ uri: notif.senderAvatar }} style={styles.notifAvatar} />
        ) : (
          <View style={[styles.notifAvatar, { backgroundColor: `${accentColor}33`, alignItems: "center", justifyContent: "center" }]}>
            <Text style={[styles.notifAvatarText, { color: accentColor }]}>{notif.senderName?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.notifTypeBadge, { backgroundColor: icon.color }]}>
          <Ionicons name={icon.name as any} size={11} color="#fff" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.notifContent}>
        <Text style={[styles.notifMessage, { color: colors.text }]} numberOfLines={2}>
          <Text style={{ fontFamily: "Inter_600SemiBold" }}>{notif.senderName}</Text>
          {"  "}{notif.message.replace(notif.senderName, "").trim()}
        </Text>
        <Text style={[styles.notifTime, { color: colors.textSecondary }]}>{formatTime(notif.createdAt)}</Text>
      </View>

      {/* Unread dot */}
      {!notif.isRead && (
        <View style={[styles.unreadDot, { backgroundColor: colors.tint }]} />
      )}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const {
    notifications, currentUser, markNotificationRead, markAllNotificationsRead,
    getUnreadNotificationsCount, conversations, theme, t,
  } = useApp();
  const colors = Colors[theme];
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
    } else if (notif.type === "like" || notif.type === "comment") {
      // Navigate directly to the referenced post
      if (notif.referenceId) {
        router.push(`/post/${notif.referenceId}`);
      } else {
        router.push(`/profile/${notif.senderId}`);
      }
    } else if (notif.type === "post") {
      // Notification about a new post
      if (notif.referenceId) {
        router.push(`/post/${notif.referenceId}`);
      } else {
        router.push(`/profile/${notif.senderId}`);
      }
    } else if (notif.type === "story" || notif.type === "story_like" || notif.type === "story_reply") {
      // Navigate to that user's story
      router.push(`/story/${notif.senderId}`);
    } else if (notif.type === "message") {
      // Find conversation with this user and navigate to it
      const convo = conversations.find(
        (c) =>
          c.participants.includes(currentUser?.id ?? "") &&
          c.participants.includes(notif.senderId)
      );
      if (convo) {
        router.push(`/chat/${convo.id}`);
      } else {
        router.push("/(tabs)/messages" as any);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={theme === "dark" ? ["rgba(124,58,237,0.15)", "transparent"] : ["rgba(124,58,237,0.06)", "transparent"]}
        style={[styles.headerGrad, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t("notifications")}</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllNotificationsRead} style={[styles.markAllBtn, { backgroundColor: `${colors.tint}22` }]}>
              <Text style={[styles.markAllText, { color: colors.tint }]}>قراءة الكل</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {myNotifs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: `${colors.tint}15` }]}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.tint} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("noNotifications")}</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>ستظهر هنا إشعاراتك حين تصلك</Text>
        </View>
      ) : (
        <FlatList
          data={myNotifs}
          keyExtractor={(n) => n.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NotifItem notif={item} colors={colors} onPress={() => handleNotifPress(item)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  headerTitle: { flex: 1, fontSize: 24, fontFamily: "Inter_700Bold" },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  markAllText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  list: { padding: 14, gap: 10 },
  notifItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 18, borderWidth: 1, padding: 14,
  },
  notifAvatarWrap: { position: "relative", width: 48, height: 48 },
  notifAvatar: { width: 48, height: 48, borderRadius: 16, overflow: "hidden" },
  notifAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  notifTypeBadge: {
    position: "absolute", bottom: -3, right: -3,
    width: 20, height: 20, borderRadius: 6,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#fff",
  },
  notifContent: { flex: 1, gap: 4 },
  notifMessage: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  notifTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 40 },
  emptyIcon: { width: 90, height: 90, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
