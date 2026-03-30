import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
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
import { useToast } from "@/components/Toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = (SCREEN_WIDTH - 3) / 3;

function ReelThumb({ reel, onPress }: { reel: any; onPress: () => void }) {
  const player = useVideoPlayer(reel.videoUrl, (p) => {
    p.loop = false;
  });
  return (
    <Pressable onPress={onPress} style={styles.gridItem}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />
      <View style={styles.gridOverlay}>
        <Ionicons name="play" size={20} color="rgba(255,255,255,0.9)" />
      </View>
    </Pressable>
  );
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    users,
    reels,
    currentUser,
    getConversation,
    isReelLiked,
    getReelLikesCount,
    getReelComments,
    theme,
    t,
  } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [selectedReel, setSelectedReel] = useState<string | null>(null);

  const user = users.find((u) => u.id === id);

  if (!user) {
    return (
      <View
        style={[
          styles.notFound,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Ionicons name="person-outline" size={64} color={colors.border} />
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
          المستخدم غير موجود
        </Text>
      </View>
    );
  }

  const userReels = reels.filter((r) => r.creatorId === id);
  const accentColor =
    ACCENT_COLORS[(user.name?.length ?? 0) % ACCENT_COLORS.length];
  const isMe = currentUser?.id === id;

  const handleMessage = () => {
    if (!currentUser || isMe) return;
    const convo = getConversation(user.id);
    router.push(`/chat/${convo.id}`);
  };

  const joinedDate = new Date(user.createdAt).toLocaleDateString("ar-IQ", {
    year: "numeric",
    month: "long",
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={userReels}
        keyExtractor={(r) => r.id}
        numColumns={3}
        ListHeaderComponent={
          <View>
            <LinearGradient
              colors={[`${accentColor}33`, "transparent"]}
              style={[styles.header, { paddingTop: insets.top + 8 }]}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={[
                  styles.backBtn,
                  { backgroundColor: `${colors.card}cc` },
                ]}
              >
                <Ionicons name="arrow-back" size={22} color={colors.text} />
              </TouchableOpacity>

              <View style={styles.avatarSection}>
                {user.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    style={[styles.avatar, { borderColor: accentColor }]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      styles.avatarFallback,
                      {
                        backgroundColor: `${accentColor}33`,
                        borderColor: accentColor,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.avatarInitial, { color: accentColor }]}
                    >
                      {user.name[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}

                <Text style={[styles.userName, { color: colors.text }]}>
                  {user.name}
                </Text>
                <Text
                  style={[styles.userPhone, { color: colors.textSecondary }]}
                >
                  {user.phone}
                </Text>
                <Text
                  style={[styles.joinedAt, { color: colors.textSecondary }]}
                >
                  انضم في {joinedDate}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: colors.text }]}>
                    {userReels.length}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    مقاطع
                  </Text>
                </View>
                <View
                  style={[styles.statDivider, { backgroundColor: colors.border }]}
                />
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: colors.text }]}>
                    {userReels.reduce(
                      (sum, r) => sum + getReelLikesCount(r.id),
                      0
                    )}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    إعجاب
                  </Text>
                </View>
                <View
                  style={[styles.statDivider, { backgroundColor: colors.border }]}
                />
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: colors.text }]}>
                    {userReels.reduce(
                      (sum, r) => sum + getReelComments(r.id).length,
                      0
                    )}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    تعليق
                  </Text>
                </View>
              </View>

              {!isMe && (
                <TouchableOpacity onPress={handleMessage} style={{ alignSelf: "stretch", marginHorizontal: 20 }}>
                  <LinearGradient
                    colors={["#7C3AED", "#4F46E5"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.messageBtn}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                    <Text style={styles.messageBtnText}>مراسلة</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </LinearGradient>

            <View style={[styles.reelsHeader, { borderColor: colors.border }]}>
              <Ionicons name="film-outline" size={18} color={colors.tint} />
              <Text style={[styles.reelsHeaderText, { color: colors.text }]}>
                المقاطع ({userReels.length})
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyReels}>
            <Ionicons name="film-outline" size={48} color={colors.border} />
            <Text
              style={[styles.emptyText, { color: colors.textSecondary }]}
            >
              لم ينشر هذا المستخدم أي مقاطع بعد
            </Text>
          </View>
        }
        columnWrapperStyle={{ gap: 1.5 }}
        ItemSeparatorComponent={() => <View style={{ height: 1.5 }} />}
        renderItem={({ item }) => (
          <ReelThumb
            reel={item}
            onPress={() => setSelectedReel(item.id)}
          />
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  notFoundText: { fontFamily: "Inter_400Regular", fontSize: 16 },
  header: { paddingBottom: 24, gap: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 4,
  },
  avatarSection: { alignItems: "center", gap: 8 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 28,
    borderWidth: 2.5,
    overflow: "hidden",
  },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 36, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  userPhone: { fontSize: 14, fontFamily: "Inter_400Regular" },
  joinedAt: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginHorizontal: 20,
  },
  statItem: { alignItems: "center", gap: 2 },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statDivider: { width: 1, height: 32, borderRadius: 1 },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  messageBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  reelsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  reelsHeaderText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    backgroundColor: "#111",
    overflow: "hidden",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyReels: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
});
