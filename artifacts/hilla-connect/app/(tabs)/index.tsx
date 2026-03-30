import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useRef } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { Post, Story, User } from "@/context/AppContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ───── Story Avatar ─────
function StoryAvatar({
  user,
  stories,
  hasUnseen,
  onPress,
  colors,
  isMe,
}: {
  user: User;
  stories: Story[];
  hasUnseen: boolean;
  onPress: () => void;
  colors: any;
  isMe?: boolean;
}) {
  const accentColor = ACCENT_COLORS[(user.name?.length ?? 0) % ACCENT_COLORS.length];
  const ringColor = hasUnseen ? "#E1306C" : colors.border;

  return (
    <TouchableOpacity onPress={onPress} style={styles.storyItem} activeOpacity={0.8}>
      <View style={[styles.storyRing, { borderColor: ringColor }]}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.storyAvatar} />
        ) : (
          <View style={[styles.storyAvatar, { backgroundColor: `${accentColor}44`, alignItems: "center", justifyContent: "center" }]}>
            <Text style={[styles.storyInitial, { color: accentColor }]}>{user.name[0]?.toUpperCase()}</Text>
          </View>
        )}
        {isMe && (
          <View style={[styles.storyAddBtn, { backgroundColor: colors.tint }]}>
            <Ionicons name="add" size={12} color="#fff" />
          </View>
        )}
      </View>
      <Text style={[styles.storyName, { color: colors.text }]} numberOfLines={1}>
        {isMe ? "قصتي" : user.name.split(" ")[0]}
      </Text>
    </TouchableOpacity>
  );
}

// ───── Post Card ─────
function PostCard({ post, colors, theme }: { post: Post; colors: any; theme: string }) {
  const { users, currentUser, isPostLiked, likePost, getPostLikesCount, getPostComments, t } = useApp();
  const creator = users.find((u) => u.id === post.creatorId);
  const liked = isPostLiked(post.id);
  const likesCount = getPostLikesCount(post.id);
  const commentsCount = getPostComments(post.id).length;
  const accentColor = ACCENT_COLORS[(creator?.name?.length ?? 0) % ACCENT_COLORS.length];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    likePost(post.id);
  };

  if (!creator) return null;

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `${mins}د`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}س`;
    return `${Math.floor(hrs / 24)}ي`;
  };

  return (
    <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.postHeader}
        onPress={() => router.push(`/profile/${creator.id}`)}
        activeOpacity={0.8}
      >
        <View style={[styles.postAvatar, { backgroundColor: `${accentColor}33` }]}>
          {creator.avatar ? (
            <Image source={{ uri: creator.avatar }} style={StyleSheet.absoluteFill as any} />
          ) : (
            <Text style={[styles.postAvatarText, { color: accentColor }]}>{creator.name[0]?.toUpperCase()}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.postCreatorName, { color: colors.text }]}>{creator.name}</Text>
          <Text style={[styles.postTime, { color: colors.textSecondary }]}>{formatTime(post.createdAt)}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Media */}
      {post.mediaUrl && post.mediaType === "image" && (
        <Image source={{ uri: post.mediaUrl }} style={styles.postMedia} resizeMode="cover" />
      )}

      {/* Caption */}
      {post.content ? (
        <Text style={[styles.postCaption, { color: colors.text }]}>{post.content}</Text>
      ) : null}

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postActionBtn} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={26}
              color={liked ? "#E1306C" : colors.textSecondary}
            />
          </Animated.View>
          {likesCount > 0 && (
            <Text style={[styles.postActionCount, { color: colors.textSecondary }]}>{likesCount}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.postActionBtn}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
          {commentsCount > 0 && (
            <Text style={[styles.postActionCount, { color: colors.textSecondary }]}>{commentsCount}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.postActionBtn}>
          <Ionicons name="paper-plane-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ───── Main Feed Screen ─────
export default function HomeScreen() {
  const {
    currentUser,
    users,
    getFeedPosts,
    getActiveStories,
    getUserStories,
    hasUnseenStory,
    getUnreadNotificationsCount,
    conversations,
    getConversation,
    t,
    theme,
  } = useApp();

  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const feedPosts = getFeedPosts();
  const activeStories = getActiveStories();

  // بناء قائمة Stories - أنا أولاً ثم المستخدمون الذين لديهم ستوري
  const storyUsers: User[] = [];
  const seenIds = new Set<string>();
  if (currentUser) { storyUsers.push(currentUser); seenIds.add(currentUser.id); }
  activeStories.forEach((s) => {
    if (!seenIds.has(s.creatorId)) {
      const u = users.find((u) => u.id === s.creatorId);
      if (u) { storyUsers.push(u); seenIds.add(u.id); }
    }
  });

  const unreadNotifs = getUnreadNotificationsCount();
  const unreadMessages = conversations.filter(
    (c) => c.participants.includes(currentUser?.id || "") &&
      c.messages?.some((m) => m.receiverId === currentUser?.id && !m.read)
  ).length;

  const handleStoryPress = (user: User) => {
    if (user.id === currentUser?.id) {
      router.push("/create-story");
    } else {
      router.push(`/story/${user.id}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={theme === "dark" ? ["rgba(79,70,229,0.18)", "transparent"] : ["rgba(79,70,229,0.07)", "transparent"]}
        style={[styles.headerGrad, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.headerLogo, { color: colors.text }]}>هلا بابل</Text>
          <View style={styles.headerIcons}>
            {/* Messages */}
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/messages" as any)}
            >
              <Ionicons name="chatbubbles-outline" size={22} color={colors.text} />
              {unreadMessages > 0 && (
                <View style={[styles.badge, { backgroundColor: "#3B82F6" }]}>
                  <Text style={styles.badgeText}>{unreadMessages}</Text>
                </View>
              )}
            </TouchableOpacity>
            {/* Notifications */}
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {unreadNotifs > 0 && (
                <View style={[styles.badge, { backgroundColor: "#E1306C" }]}>
                  <Text style={styles.badgeText}>{unreadNotifs > 9 ? "9+" : unreadNotifs}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={feedPosts}
        keyExtractor={(p) => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        ListHeaderComponent={
          <View>
            {/* ── Stories Bar ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesBar}
              style={[styles.storiesContainer, { borderBottomColor: colors.border }]}
            >
              {storyUsers.map((user) => (
                <StoryAvatar
                  key={user.id}
                  user={user}
                  stories={getUserStories(user.id)}
                  hasUnseen={hasUnseenStory(user.id)}
                  onPress={() => handleStoryPress(user)}
                  colors={colors}
                  isMe={user.id === currentUser?.id}
                />
              ))}
              {storyUsers.length === 0 && (
                <StoryAvatar
                  key="me-placeholder"
                  user={currentUser!}
                  stories={[]}
                  hasUnseen={false}
                  onPress={() => router.push("/create-story")}
                  colors={colors}
                  isMe
                />
              )}
            </ScrollView>

            {/* ── Create Post Button ── */}
            <TouchableOpacity
              style={[styles.createPostBar, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/create-post")}
              activeOpacity={0.85}
            >
              {currentUser?.avatar ? (
                <Image source={{ uri: currentUser.avatar }} style={styles.createPostAvatar} />
              ) : (
                <View style={[styles.createPostAvatar, { backgroundColor: colors.backgroundTertiary, alignItems: "center", justifyContent: "center" }]}>
                  <Text style={{ color: colors.tint, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
                    {currentUser?.name[0]?.toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={[styles.createPostInput, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                  ماذا يدور في ذهنك؟
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/create-post")}
                style={[styles.createPostMediaBtn, { backgroundColor: `${colors.tint}22` }]}
              >
                <Ionicons name="image-outline" size={20} color={colors.tint} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyFeed}>
            <Ionicons name="people-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>لا توجد منشورات</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              تابع أشخاصاً لترى منشوراتهم هنا
            </Text>
          </View>
        }
        renderItem={({ item }) => <PostCard post={item} colors={colors} theme={theme} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  headerLogo: { fontSize: 22, fontFamily: "Inter_700Bold" },
  headerIcons: { flexDirection: "row", gap: 10 },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
    position: "relative",
  },
  badge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  storiesContainer: { borderBottomWidth: 1 },
  storiesBar: { paddingHorizontal: 12, paddingVertical: 14, gap: 16 },
  storyItem: { alignItems: "center", gap: 6, width: 68 },
  storyRing: {
    width: 64, height: 64, borderRadius: 22,
    borderWidth: 2.5, padding: 2,
    position: "relative",
  },
  storyAvatar: { width: "100%", height: "100%", borderRadius: 19, overflow: "hidden" },
  storyInitial: { fontSize: 22, fontFamily: "Inter_700Bold" },
  storyAddBtn: {
    position: "absolute", bottom: -2, right: -2,
    width: 20, height: 20, borderRadius: 6,
    alignItems: "center", justifyContent: "center",
  },
  storyName: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center", width: 68 },
  createPostBar: {
    flexDirection: "row", alignItems: "center",
    margin: 12, borderRadius: 18, borderWidth: 1,
    padding: 12, gap: 10,
  },
  createPostAvatar: { width: 40, height: 40, borderRadius: 13, overflow: "hidden" },
  createPostInput: { flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  createPostMediaBtn: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  postCard: {
    marginHorizontal: 12, marginBottom: 14,
    borderRadius: 20, borderWidth: 1, overflow: "hidden",
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  postAvatar: { width: 42, height: 42, borderRadius: 14, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  postAvatarText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  postCreatorName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  postTime: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  postMedia: { width: "100%", aspectRatio: 1 },
  postCaption: { paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  postActions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 12, gap: 20 },
  postActionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  postActionCount: { fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyFeed: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 16, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  // Messages tab redirect
  messages: {},
});
