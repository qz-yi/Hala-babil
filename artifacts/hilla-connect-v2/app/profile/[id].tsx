import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
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
import { useToast } from "@/components/Toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = (SCREEN_WIDTH - 3) / 3;

type GridTab = "posts" | "reels";

function GridPostItem({ post, colors }: { post: any; colors: any }) {
  const hasMultiple = post.mediaUrls && post.mediaUrls.length > 1;
  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => router.push(`/user-posts/${post.creatorId}?startId=${post.id}` as any)}
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
    blockUser, unblockUser, isBlocked,
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

  const userIsBlocked = isBlocked(id);

  const canViewContent =
    !userIsBlocked && (user.accountType === "public" || isMe || followStatus === "following");

  const [showBlockModal, setShowBlockModal] = useState(false);

  const handleBlock = () => {
    setShowBlockModal(true);
  };

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
            {/* Cover Photo */}
            <View style={[styles.coverSection, { height: 160 + insets.top }]}>
              {user.coverUrl ? (
                <Image source={{ uri: user.coverUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
              ) : (
                <LinearGradient
                  colors={[`${accentColor}55`, `${accentColor}11`, colors.background]}
                  style={StyleSheet.absoluteFill as any}
                />
              )}
              <View style={[StyleSheet.absoluteFill as any, { backgroundColor: "rgba(0,0,0,0.25)" }]} />
              {/* Back button */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backBtn, { top: insets.top + 8, left: 16 }]}
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={[styles.header, { backgroundColor: colors.background }]}>
              {/* Avatar row overlapping cover */}
              <View style={[styles.avatarSectionRow, { marginTop: -48 }]}>
                <TouchableOpacity
                  onPress={() => hasStory && router.push(`/story/${user.id}`)}
                  style={[styles.avatarRing, { borderColor: hasStory ? "#E1306C" : `${accentColor}66`, borderWidth: hasStory ? 3 : 2 }]}
                >
                  {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: `${accentColor}33` }]}>
                      <Text style={[styles.avatarInitial, { color: accentColor }]}>{user.name[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Name / Bio */}
              <View style={styles.avatarSection}>
                <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                {user.username ? (
                  <Text style={{ color: colors.tint, fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                    @{user.username}
                  </Text>
                ) : null}
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
                  {userIsBlocked ? (
                    <View style={[styles.blockedBanner, { backgroundColor: "#FF3B5C18", borderColor: "#FF3B5C33" }]}>
                      <Ionicons name="ban-outline" size={18} color="#FF3B5C" />
                      <Text style={styles.blockedBannerText}>تم حظر هذا الحساب</Text>
                    </View>
                  ) : (
                    <>
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
                    </>
                  )}
                  {/* Block / Unblock button */}
                  <TouchableOpacity
                    onPress={handleBlock}
                    style={[styles.bellBtn, {
                      borderColor: userIsBlocked ? "#FF3B5C55" : colors.border,
                      backgroundColor: userIsBlocked ? "#FF3B5C18" : colors.card,
                    }]}
                  >
                    <Ionicons name={userIsBlocked ? "ban" : "ban-outline"} size={20} color={userIsBlocked ? "#FF3B5C" : colors.textSecondary} />
                  </TouchableOpacity>
                  {/* Bell */}
                  {!userIsBlocked && followStatus === "following" && (
                    <TouchableOpacity style={[styles.bellBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <Ionicons name="notifications-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

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

      {/* Custom Dark Block/Unblock Confirmation Modal */}
      <Modal
        visible={showBlockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", alignItems: "center", padding: 32 }}
          onPress={() => setShowBlockModal(false)}
        >
          <Pressable
            style={{ backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 28, width: "100%", alignItems: "center", gap: 14 }}
            onPress={() => {}}
          >
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: userIsBlocked ? "#10B98122" : "#FF3B5C22", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="ban" size={28} color={userIsBlocked ? "#10B981" : "#FF3B5C"} />
            </View>
            <Text style={{ color: colors.text, fontFamily: "Inter_700Bold", fontSize: 18 }}>
              {userIsBlocked ? "إلغاء الحظر" : "حظر المستخدم"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" }}>
              {userIsBlocked
                ? `هل تريد إلغاء حظر ${user.name}؟`
                : `هل تريد حظر ${user.name}؟ لن يتمكن من رؤية منشوراتك.`}
            </Text>
            <View style={{ flexDirection: "row", gap: 12, width: "100%", marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => setShowBlockModal(false)}
                style={{ flex: 1, height: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 15 }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowBlockModal(false);
                  if (userIsBlocked) {
                    unblockUser(id);
                    showToast("تم إلغاء الحظر", "success");
                  } else {
                    blockUser(id);
                    showToast("تم الحظر", "info");
                  }
                }}
                style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: userIsBlocked ? "#10B981" : "#FF3B5C", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 }}>
                  {userIsBlocked ? "إلغاء الحظر" : "حظر"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  notFoundText: { fontFamily: "Inter_400Regular", fontSize: 16 },
  coverSection: { position: "relative", overflow: "hidden" },
  header: { paddingBottom: 24, gap: 14 },
  backBtn: { position: "absolute", width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  avatarSectionRow: { paddingHorizontal: 20 },
  avatarSection: { alignItems: "center", gap: 8, paddingHorizontal: 20 },
  avatarRing: { width: 100, height: 100, borderRadius: 32, borderWidth: 3, padding: 3, overflow: "hidden", backgroundColor: "transparent" },
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
  blockedBanner: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  blockedBannerText: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#FF3B5C" },
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
