import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
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
import { useToast } from "@/components/Toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = (SCREEN_WIDTH - 3) / 3;

type GridTab = "posts" | "reels";

function GridPostItem({ post, colors }: { post: any; colors: any }) {
  const hasMultiple = post.mediaUrls && post.mediaUrls.length > 1;
  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => router.push(`/post/${post.id}`)}
      activeOpacity={0.85}
    >
      {post.mediaUrl && post.mediaType === "image" ? (
        <>
          <Image source={{ uri: post.mediaUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
          {hasMultiple && (
            <View style={{ position: "absolute", top: 6, right: 6 }}>
              <Ionicons name="copy-outline" size={16} color="#fff" />
            </View>
          )}
        </>
      ) : post.mediaUrl && post.mediaType === "video" ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
          <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.8)" />
        </View>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backgroundTertiary, alignItems: "center", justifyContent: "center", padding: 8 }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" }} numberOfLines={3}>
            {post.content}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function GridReelItem({ reelId }: { reelId: string }) {
  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => router.push("/(tabs)/reels" as any)}
      activeOpacity={0.85}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.8)" />
      </View>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="play" size={18} color="rgba(255,255,255,0.9)" />
      </View>
    </TouchableOpacity>
  );
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    users, reels, posts, currentUser, getConversation,
    getFollowersCount, getFollowingCount, getFollowStatus,
    followUser, unfollowUser, isFollowing,
    getPostLikesCount, getReelLikesCount, getReelComments, getPostComments,
    hasUnseenStory, getUserStories,
    theme, t,
  } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [gridTab, setGridTab] = useState<GridTab>("posts");

  const user = users.find((u) => u.id === id);

  if (!user) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: `${colors.card}cc` }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Ionicons name="person-outline" size={64} color={colors.border} />
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>المستخدم غير موجود</Text>
      </View>
    );
  }

  const userReels = reels.filter((r) => r.creatorId === id);
  const userPosts = posts.filter((p) => p.creatorId === id);
  const accentColor = ACCENT_COLORS[(user.name?.length ?? 0) % ACCENT_COLORS.length];
  const isMe = currentUser?.id === id;
  const followStatus = getFollowStatus(id);
  const followersCount = getFollowersCount(id);
  const followingCount = getFollowingCount(id);
  const hasStory = hasUnseenStory(id);

  const canViewContent =
    user.accountType === "public" || isMe || followStatus === "following";

  const handleFollow = () => {
    if (followStatus === "none") {
      followUser(id);
      showToast(user.accountType === "private" ? "تم إرسال طلب المتابعة" : "تم المتابعة بنجاح", "success");
    } else if (followStatus === "following") {
      unfollowUser(id);
      showToast("تم إلغاء المتابعة", "info");
    }
  };

  const handleMessage = () => {
    if (!currentUser || isMe) return;
    const convo = getConversation(user.id);
    router.push(`/chat/${convo.id}`);
  };

  const gridData = gridTab === "posts" ? userPosts : userReels;

  const joinedDate = new Date(user.createdAt).toLocaleDateString("ar-IQ", { year: "numeric", month: "long" });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={(canViewContent ? gridData : []) as any[]}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={{ gap: 1.5 }}
        ItemSeparatorComponent={() => <View style={{ height: 1.5 }} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <LinearGradient
              colors={[`${accentColor}33`, "transparent"]}
              style={[styles.header, { paddingTop: insets.top + 8 }]}
            >
              {/* Back */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backBtn, { backgroundColor: `${colors.card}cc` }]}
              >
                <Ionicons name="arrow-back" size={22} color={colors.text} />
              </TouchableOpacity>

              {/* Avatar + Story ring */}
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  onPress={() => hasStory && router.push(`/story/${user.id}`)}
                  style={[styles.avatarRing, { borderColor: hasStory ? "#E1306C" : `${accentColor}66` }]}
                >
                  {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: `${accentColor}33` }]}>
                      <Text style={[styles.avatarInitial, { color: accentColor }]}>{user.name[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                {user.bio ? (
                  <Text style={[styles.userBio, { color: colors.textSecondary }]}>{user.bio}</Text>
                ) : null}
                {user.accountType === "private" && (
                  <View style={[styles.privateBadge, { backgroundColor: `${colors.tint}22` }]}>
                    <Ionicons name="lock-closed" size={12} color={colors.tint} />
                    <Text style={[styles.privateBadgeText, { color: colors.tint }]}>حساب خاص</Text>
                  </View>
                )}
                <Text style={[styles.joinedAt, { color: colors.textSecondary }]}>انضم في {joinedDate}</Text>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                {[
                  { label: t("posts"), value: userPosts.length },
                  { label: t("followers"), value: followersCount },
                  { label: t("followingCount"), value: followingCount },
                ].map((stat, i) => (
                  <View key={i} style={styles.statItem}>
                    <Text style={[styles.statNum, { color: colors.text }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              {!isMe && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={handleFollow}
                    style={{ flex: 1 }}
                  >
                    {followStatus === "following" ? (
                      <View style={[styles.followingBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
                        <Ionicons name="checkmark" size={16} color={colors.text} />
                        <Text style={[styles.followingBtnText, { color: colors.text }]}>{t("following")}</Text>
                      </View>
                    ) : followStatus === "pending" ? (
                      <View style={[styles.followingBtn, { borderColor: colors.tint, backgroundColor: `${colors.tint}22` }]}>
                        <Ionicons name="time-outline" size={16} color={colors.tint} />
                        <Text style={[styles.followingBtnText, { color: colors.tint }]}>{t("pendingRequest")}</Text>
                      </View>
                    ) : (
                      <LinearGradient colors={["#7C3AED", "#4F46E5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.followBtn}>
                        <Ionicons name="person-add-outline" size={16} color="#fff" />
                        <Text style={styles.followBtnText}>{t("follow")}</Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleMessage}
                    style={[styles.messageBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color={colors.text} />
                    <Text style={[styles.messageBtnText, { color: colors.text }]}>{t("sendMessage")}</Text>
                  </TouchableOpacity>
                  {/* Bell */}
                  {followStatus === "following" && (
                    <TouchableOpacity style={[styles.bellBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <Ionicons name="notifications-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </LinearGradient>

            {/* Grid Tabs */}
            <View style={[styles.gridTabs, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setGridTab("posts")} style={[styles.gridTab, gridTab === "posts" && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}>
                <Ionicons name="grid-outline" size={22} color={gridTab === "posts" ? colors.tint : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setGridTab("reels")} style={[styles.gridTab, gridTab === "reels" && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}>
                <Ionicons name="film-outline" size={22} color={gridTab === "reels" ? colors.tint : colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Private Account Lock */}
            {!canViewContent && (
              <View style={styles.privateContent}>
                <Ionicons name="lock-closed-outline" size={52} color={colors.border} />
                <Text style={[styles.privateTitle, { color: colors.text }]}>هذا الحساب خاص</Text>
                <Text style={[styles.privateDesc, { color: colors.textSecondary }]}>
                  تابع هذا الحساب لترى منشوراته
                </Text>
              </View>
            )}

            {canViewContent && gridData.length === 0 && (
              <View style={styles.emptyContent}>
                <Ionicons name="images-outline" size={48} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>لا توجد محتويات بعد</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) =>
          gridTab === "posts" ? (
            <GridPostItem post={item} colors={colors} />
          ) : (
            <GridReelItem reelId={item.id} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  notFoundText: { fontFamily: "Inter_400Regular", fontSize: 16 },
  header: { paddingBottom: 24, gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", marginHorizontal: 16, marginBottom: 4 },
  avatarSection: { alignItems: "center", gap: 8, paddingHorizontal: 20 },
  avatarRing: { width: 100, height: 100, borderRadius: 32, borderWidth: 3, padding: 3, overflow: "hidden" },
  avatar: { width: "100%", height: "100%", borderRadius: 28, overflow: "hidden" },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 36, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  userBio: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  privateBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  privateBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  joinedAt: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", gap: 32, justifyContent: "center" },
  statItem: { alignItems: "center", gap: 3 },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actionRow: { flexDirection: "row", gap: 10, marginHorizontal: 20 },
  followBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 44, borderRadius: 14, shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  followBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  followingBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 44, borderRadius: 14, borderWidth: 1.5 },
  followingBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  messageBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 44, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16 },
  messageBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  bellBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  gridTabs: { flexDirection: "row", borderBottomWidth: 1 },
  gridTab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, backgroundColor: "#111", overflow: "hidden" },
  privateContent: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 14 },
  privateTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  privateDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyContent: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
});
