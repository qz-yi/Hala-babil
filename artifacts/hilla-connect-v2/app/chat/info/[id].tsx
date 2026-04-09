import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { PrivateMessage, User } from "@/context/AppContext";

const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";

type Tab = "media" | "audio" | "reels";

function VideoThumb({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  return (
    <View style={{ width: "100%", height: "100%" }}>
      <VideoView player={player} style={{ width: "100%", height: "100%" }} contentFit="cover" nativeControls={false} />
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.3)" }]}>
        <Feather name="play" size={22} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
      </View>
    </View>
  );
}

function MediaFullscreenModal({
  visible,
  uri,
  type,
  onClose,
}: {
  visible: boolean;
  uri: string;
  type: "image" | "video";
  onClose: () => void;
}) {
  const player = useVideoPlayer(type === "video" ? uri : "", (p) => { p.loop = false; if (type === "video") p.play(); });
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={fsStyles.overlay}>
        <TouchableOpacity style={fsStyles.closeBtn} onPress={onClose}>
          <Feather name="x" size={20} color="#fff" strokeWidth={1.5} />
        </TouchableOpacity>
        {type === "image" ? (
          <Image source={{ uri }} style={fsStyles.fullImage} resizeMode="contain" />
        ) : (
          <View style={fsStyles.videoWrap}>
            <VideoView player={player} style={{ width: "100%", height: "100%" }} contentFit="contain" nativeControls />
          </View>
        )}
      </View>
    </Modal>
  );
}

const fsStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.97)", alignItems: "center", justifyContent: "center" },
  closeBtn: {
    position: "absolute", top: 52, right: 20,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", zIndex: 10,
  },
  fullImage: { width: "100%", height: "80%" },
  videoWrap: { width: "100%", height: "80%", backgroundColor: "#000" },
});

export default function ChatInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { conversations, currentUser, reels } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [activeTab, setActiveTab] = useState<Tab>("media");
  const [fullscreen, setFullscreen] = useState<{ uri: string; type: "image" | "video" } | null>(null);

  const convo = conversations.find((c) => c.id === id) as any;
  const otherUser: User | undefined = convo?.participantUsers?.find(
    (u: User) => u.id !== currentUser?.id
  );
  const accentColor = ACCENT_COLORS[(otherUser?.name?.length || 0) % ACCENT_COLORS.length];

  const messages: PrivateMessage[] = (convo?.messages || []).filter((m: PrivateMessage) => {
    if (m.deletedFor?.includes("ALL")) return false;
    if (m.deletedFor?.includes(currentUser?.id || "")) return false;
    return true;
  });

  // Shared images & videos
  const sharedImages = messages.filter((m) => m.type === "image" && m.mediaUrl);
  const sharedVideos = messages.filter((m) => m.type === "video" && m.mediaUrl);
  const mediaItems = [...sharedImages, ...sharedVideos].sort((a, b) => b.timestamp - a.timestamp);

  // Shared audio
  const audioItems = messages.filter((m) => m.type === "audio").sort((a, b) => b.timestamp - a.timestamp);

  // Shared reels (shared content of type reel)
  const reelItems = messages
    .filter((m) => m.type === "shared" && m.sharedContent?.type === "reel")
    .map((m) => {
      const reel = reels.find((r) => r.id === m.sharedContent?.id);
      return { msg: m, reel };
    })
    .filter((x) => x.reel)
    .sort((a, b) => b.msg.timestamp - a.msg.timestamp);

  if (!convo || !otherUser) {
    return (
      <View style={[s.container, { backgroundColor: BG, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: TEXT2 }}>المحادثة غير موجودة</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#3D91F4", marginTop: 12 }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tabs: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: "media", label: "الوسائط", icon: "image", count: mediaItems.length },
    { key: "audio", label: "الصوتيات", icon: "mic", count: audioItems.length },
    { key: "reels", label: "الريلز", icon: "play-circle", count: reelItems.length },
  ];

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  return (
    <View style={[s.container, { backgroundColor: BG }]}>
      {/* Header */}
      <LinearGradient
        colors={[`${accentColor}20`, "transparent"]}
        style={[s.header, { paddingTop: topPad + 8 }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[s.backBtn, { backgroundColor: CARD, borderColor: BORDER }]}
        >
          <Feather name="arrow-left" size={20} color={TEXT} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: TEXT }]}>معلومات المحادثة</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={s.profileCard}>
          <View style={[s.avatar, { backgroundColor: `${accentColor}33` }]}>
            {otherUser.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={s.avatarImg} />
            ) : (
              <Text style={[s.avatarText, { color: accentColor }]}>
                {otherUser.name[0]?.toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={[s.profileName, { color: TEXT }]}>{otherUser.name}</Text>
          {otherUser.username ? (
            <Text style={[s.profileUsername, { color: TEXT2 }]}>@{otherUser.username}</Text>
          ) : null}
          {otherUser.bio ? (
            <Text style={[s.profileBio, { color: TEXT2 }]}>{otherUser.bio}</Text>
          ) : null}

          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={[s.statNum, { color: accentColor }]}>{messages.length}</Text>
              <Text style={[s.statLabel, { color: TEXT2 }]}>رسالة</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={[s.statNum, { color: accentColor }]}>{mediaItems.length}</Text>
              <Text style={[s.statLabel, { color: TEXT2 }]}>وسائط</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={[s.statNum, { color: accentColor }]}>{audioItems.length}</Text>
              <Text style={[s.statLabel, { color: TEXT2 }]}>صوتيات</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.viewProfileBtn, { borderColor: accentColor }]}
            onPress={() => router.push(`/profile/${otherUser.id}` as any)}
          >
            <Feather name="user" size={14} color={accentColor} strokeWidth={1.5} />
            <Text style={[s.viewProfileLabel, { color: accentColor }]}>عرض الملف الشخصي</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[s.tabRow, { borderBottomColor: BORDER }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && { borderBottomColor: accentColor, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Feather
                name={tab.icon as any}
                size={15}
                color={activeTab === tab.key ? accentColor : TEXT2}
                strokeWidth={1.5}
              />
              <Text style={[s.tabLabel, { color: activeTab === tab.key ? accentColor : TEXT2 }]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[s.tabBadge, { backgroundColor: `${accentColor}22` }]}>
                  <Text style={[s.tabBadgeText, { color: accentColor }]}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Media Grid */}
        {activeTab === "media" && (
          <View style={s.gridSection}>
            {mediaItems.length === 0 ? (
              <View style={s.empty}>
                <Feather name="image" size={36} color={BORDER} strokeWidth={1} />
                <Text style={[s.emptyText, { color: TEXT2 }]}>لا توجد وسائط مشتركة</Text>
              </View>
            ) : (
              <View style={s.grid}>
                {mediaItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={s.gridItem}
                    onPress={() => setFullscreen({ uri: item.mediaUrl!, type: item.type as "image" | "video" })}
                    activeOpacity={0.85}
                  >
                    {item.type === "image" ? (
                      <Image source={{ uri: item.mediaUrl }} style={s.gridImage} resizeMode="cover" />
                    ) : (
                      <VideoThumb uri={item.mediaUrl!} />
                    )}
                    {item.type === "video" && (
                      <View style={s.videoTag}>
                        <Feather name="video" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Audio List */}
        {activeTab === "audio" && (
          <View style={s.listSection}>
            {audioItems.length === 0 ? (
              <View style={s.empty}>
                <Feather name="mic" size={36} color={BORDER} strokeWidth={1} />
                <Text style={[s.emptyText, { color: TEXT2 }]}>لا توجد رسائل صوتية مشتركة</Text>
              </View>
            ) : (
              audioItems.map((item) => {
                const isMine = item.senderId === currentUser?.id;
                return (
                  <View key={item.id} style={[s.audioRow, { borderBottomColor: BORDER }]}>
                    <View style={[s.audioIcon, { backgroundColor: `${accentColor}22` }]}>
                      <Feather name="mic" size={18} color={accentColor} strokeWidth={1.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.audioSender, { color: TEXT }]}>
                        {isMine ? "أنت" : otherUser.name}
                      </Text>
                      {item.duration != null && (
                        <Text style={[s.audioDur, { color: TEXT2 }]}>
                          {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, "0")} ث
                        </Text>
                      )}
                    </View>
                    <Text style={[s.audioDate, { color: TEXT2 }]}>{formatTime(item.timestamp)}</Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Reels List */}
        {activeTab === "reels" && (
          <View style={s.listSection}>
            {reelItems.length === 0 ? (
              <View style={s.empty}>
                <Feather name="play-circle" size={36} color={BORDER} strokeWidth={1} />
                <Text style={[s.emptyText, { color: TEXT2 }]}>لا توجد ريلز مشتركة</Text>
              </View>
            ) : (
              reelItems.map(({ msg, reel }) => (
                <View key={msg.id} style={[s.reelRow, { borderBottomColor: BORDER }]}>
                  <View style={s.reelThumb}>
                    {reel?.videoUrl ? (
                      <VideoThumb uri={reel.videoUrl} />
                    ) : (
                      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <Feather name="play" size={20} color={TEXT2} />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[s.reelTitle, { color: TEXT }]} numberOfLines={2}>
                      {reel?.title || "ريل"}
                    </Text>
                    <Text style={[s.reelDate, { color: TEXT2 }]}>{formatTime(msg.timestamp)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push("/(tabs)/reels" as any)}>
                    <Feather name="external-link" size={16} color={TEXT2} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {fullscreen && (
        <MediaFullscreenModal
          visible={!!fullscreen}
          uri={fullscreen.uri}
          type={fullscreen.type}
          onClose={() => setFullscreen(null)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },

  profileCard: { alignItems: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20, gap: 8 },
  avatar: { width: 90, height: 90, borderRadius: 28, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 4 },
  avatarImg: { width: "100%", height: "100%", borderRadius: 28 },
  avatarText: { fontSize: 36, fontFamily: "Inter_700Bold" },
  profileName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  profileUsername: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: -4 },
  profileBio: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 0, backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, marginTop: 8, overflow: "hidden" },
  stat: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: BORDER },
  viewProfileBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9, marginTop: 4,
  },
  viewProfileLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  tabRow: { flexDirection: "row", borderBottomWidth: 1, marginTop: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 14 },
  tabLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  tabBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },

  gridSection: { paddingHorizontal: 2, paddingTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridItem: { width: "33.33%", aspectRatio: 1, padding: 1.5, overflow: "hidden" },
  gridImage: { width: "100%", height: "100%" },
  videoTag: {
    position: "absolute", top: 6, right: 6,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 6, padding: 3,
  },

  listSection: { paddingHorizontal: 16, paddingTop: 8 },
  audioRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  audioIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  audioSender: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  audioDur: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  audioDate: { fontSize: 11, fontFamily: "Inter_400Regular" },

  reelRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  reelThumb: { width: 56, height: 56, borderRadius: 12, overflow: "hidden", backgroundColor: CARD },
  reelTitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
  reelDate: { fontSize: 11, fontFamily: "Inter_400Regular" },

  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
