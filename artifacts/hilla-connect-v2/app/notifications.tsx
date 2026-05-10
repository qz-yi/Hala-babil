import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
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
import { useThemeStore } from "@/store/themeStore";

const NOTIF_ICONS: Record<string, { name: string; color: string }> = {
  follow_request: { name: "user-plus", color: "#9B59B6" },
  follow_accept: { name: "user-check", color: "#34D399" },
  like: { name: "heart", color: "#FF3B5C" },
  comment: { name: "message-circle", color: "#3D91F4" },
  post: { name: "image", color: "#FBBF24" },
  story: { name: "circle", color: "#EC4899" },
  story_like: { name: "heart", color: "#EC4899" },
  story_reply: { name: "message-square", color: "#EC4899" },
  story_mention: { name: "at-sign", color: "#EC4899" },
  message: { name: "message-circle", color: "#00BCD4" },
  mention: { name: "at-sign", color: "#F59E0B" },
};

function NotifItem({ notif, onPress }: { notif: AppNotification; onPress: () => void }) {
  const c = useThemeStore((s) => s.tokens);
  const accentColor = ACCENT_COLORS[(notif.senderName?.length ?? 0) % ACCENT_COLORS.length];
  const icon = NOTIF_ICONS[notif.type] ?? { name: "bell", color: c.accent };

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
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={[
        s.notifItem,
        { borderBottomColor: c.border },
        !notif.isRead && { backgroundColor: `${c.accent}0f` },
      ]}
      activeOpacity={0.7}
    >
      <View style={s.notifAvatarWrap}>
        {notif.senderAvatar ? (
          <Image source={{ uri: notif.senderAvatar }} style={s.notifAvatar} />
        ) : (
          <View style={[s.notifAvatar, { backgroundColor: `${accentColor}33`, alignItems: "center", justifyContent: "center" }]}>
            <Text style={[s.notifAvatarText, { color: accentColor }]}>
              {notif.senderName?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[s.notifTypeBadge, { backgroundColor: icon.color, borderColor: c.background }]}>
          <Feather name={icon.name as any} size={9} color="#fff" strokeWidth={2} />
        </View>
      </View>

      <View style={s.notifContent}>
        <Text style={[s.notifMessage, { color: c.text }]} numberOfLines={2}>
          <Text style={s.notifSenderName}>{notif.senderName}</Text>
          {"  "}
          {notif.message.replace(notif.senderName, "").trim()}
        </Text>
        <Text style={[s.notifTime, { color: c.textSecondary }]}>{formatTime(notif.createdAt)}</Text>
      </View>

      {!notif.isRead && <View style={[s.unreadDot, { backgroundColor: c.accent }]} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const c = useThemeStore((s) => s.tokens);
  const {
    notifications, currentUser, markNotificationRead,
    markAllNotificationsRead, getUnreadNotificationsCount, conversations, t,
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
    } else if (["like", "comment", "post", "mention"].includes(notif.type)) {
      if (notif.referenceId) router.push(`/post/${notif.referenceId}` as any);
      else router.push(`/profile/${notif.senderId}` as any);
    } else if (["story_mention", "story", "story_like"].includes(notif.type)) {
      router.push(`/story/${notif.senderId}` as any);
    } else if (["story_reply", "message"].includes(notif.type)) {
      const convo = conversations.find(
        (cv) => cv.participants.includes(currentUser?.id ?? "") && cv.participants.includes(notif.senderId)
      );
      if (convo) router.push(`/chat/${convo.id}`);
      else router.push("/(tabs)/messages" as any);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <View style={[s.header, { paddingTop: topPad, borderBottomColor: c.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={c.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: c.text }]}>{t("notifications")}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); markAllNotificationsRead(); }}
            style={[s.markAllBtn, { backgroundColor: c.backgroundTertiary }]}
          >
            <Text style={[s.markAllText, { color: c.textSecondary }]}>قراءة الكل</Text>
          </TouchableOpacity>
        )}
      </View>

      {myNotifs.length === 0 ? (
        <View style={s.emptyState}>
          <View style={[s.emptyIcon, { backgroundColor: c.backgroundTertiary }]}>
            <Feather name="bell-off" size={40} color={c.textSecondary} strokeWidth={1} />
          </View>
          <Text style={[s.emptyTitle, { color: c.text }]}>{t("noNotifications")}</Text>
          <Text style={[s.emptyDesc, { color: c.textSecondary }]}>ستظهر هنا إشعاراتك حين تصلك</Text>
        </View>
      ) : (
        <FlatList
          data={myNotifs}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <NotifItem notif={item} onPress={() => handleNotifPress(item)} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 0.5,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold" },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100 },
  markAllText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  notifItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  notifAvatarWrap: { position: "relative", width: 48, height: 48 },
  notifAvatar: { width: 48, height: 48, borderRadius: 24, overflow: "hidden" },
  notifAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  notifTypeBadge: {
    position: "absolute", bottom: -2, right: -2,
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
  },
  notifContent: { flex: 1, gap: 3 },
  notifMessage: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  notifSenderName: { fontFamily: "Inter_600SemiBold" },
  notifTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 40 },
  emptyIcon: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
