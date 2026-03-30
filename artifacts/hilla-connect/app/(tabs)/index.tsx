import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
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
import type { Post, PostComment, Story, User } from "@/context/AppContext";

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
          <View
            style={[
              styles.storyAvatar,
              {
                backgroundColor: `${accentColor}44`,
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            <Text style={[styles.storyInitial, { color: accentColor }]}>
              {user.name[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        {isMe && (
          <View style={[styles.storyAddBtn, { backgroundColor: colors.tint }]}>
            <Text style={{ color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" }}>+</Text>
          </View>
        )}
      </View>
      <Text style={[styles.storyName, { color: colors.text }]} numberOfLines={1}>
        {isMe ? "قصتي" : user.name.split(" ")[0]}
      </Text>
    </TouchableOpacity>
  );
}

// ───── Comment Bottom Sheet ─────
function CommentSheet({
  postId,
  visible,
  onClose,
  colors,
}: {
  postId: string;
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const { getPostComments, addPostComment, users } = useApp();
  const [text, setText] = useState("");
  const comments = getPostComments(postId);

  const handleSend = () => {
    if (!text.trim()) return;
    addPostComment(postId, text.trim());
    setText("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={[styles.commentSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.sheetTitle, { color: colors.text }]}>التعليقات</Text>
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          style={{ maxHeight: 320 }}
          ListEmptyComponent={
            <Text style={[styles.emptyComments, { color: colors.textSecondary }]}>
              لا توجد تعليقات بعد — كن أول من يعلق!
            </Text>
          }
          renderItem={({ item }: { item: PostComment }) => {
            const commenter = users.find((u) => u.id === item.userId);
            const color = ACCENT_COLORS[(item.userId.length) % ACCENT_COLORS.length];
            return (
              <View style={styles.commentItem}>
                <View style={[styles.commentAvatar, { backgroundColor: `${color}33` }]}>
                  {commenter?.avatar ? (
                    <Image source={{ uri: commenter.avatar }} style={styles.commentAvatarImg} />
                  ) : (
                    <Text style={[styles.commentAvatarText, { color }]}>
                      {item.userName[0]?.toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.commentBody}>
                  <Text style={[styles.commentUser, { color: colors.tint }]}>{item.userName}</Text>
                  <Text style={[styles.commentText, { color: colors.text }]}>{item.content}</Text>
                </View>
              </View>
            );
          }}
        />
        <View
          style={[
            styles.commentInput,
            { backgroundColor: colors.inputBackground, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.commentInputField, { color: colors.text, fontFamily: "Inter_400Regular" }]}
            value={text}
            onChangeText={setText}
            placeholder="أضف تعليقاً..."
            placeholderTextColor={colors.textSecondary}
            textAlign="right"
            multiline
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendCommentBtn}>
            <Text style={{ fontSize: 20, color: colors.tint }}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ───── Share Post Sheet ─────
function SharePostSheet({
  post,
  visible,
  onClose,
  colors,
}: {
  post: Post;
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const { users, currentUser, getConversation, sendPrivateMessage } = useApp();
  const others = users.filter((u) => u.id !== currentUser?.id);

  const handleShare = (user: User) => {
    const convo = getConversation(user.id);
    const snippet = post.content
      ? post.content.substring(0, 50)
      : post.mediaType !== "none"
      ? "وسائط"
      : "منشور";
    sendPrivateMessage(convo.id, user.id, `📸 شارك منشوراً: "${snippet}"`, "text");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={[styles.commentSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.sheetTitle, { color: colors.text }]}>مشاركة مع</Text>
        <FlatList
          data={others}
          keyExtractor={(u) => u.id}
          style={{ maxHeight: 320 }}
          ListEmptyComponent={
            <Text style={[styles.emptyComments, { color: colors.textSecondary }]}>
              لا يوجد أصدقاء للمشاركة معهم
            </Text>
          }
          renderItem={({ item }: { item: User }) => {
            const color = ACCENT_COLORS[(item.name?.length ?? 0) % ACCENT_COLORS.length];
            return (
              <TouchableOpacity style={styles.shareUser} onPress={() => handleShare(item)}>
                <View style={[styles.commentAvatar, { backgroundColor: `${color}33` }]}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.commentAvatarImg} />
                  ) : (
                    <Text style={[styles.commentAvatarText, { color }]}>
                      {item.name[0]?.toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.commentUser, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.commentText, { color: colors.textSecondary, fontSize: 12 }]}>
                    {item.phone}
                  </Text>
                </View>
                <Text style={{ fontSize: 18, color: colors.tint }}>↗</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

// ───── Post Card ─────
function PostCard({ post, colors, theme }: { post: Post; colors: any; theme: string }) {
  const { users, currentUser, isPostLiked, likePost, getPostLikesCount, getPostComments, t } =
    useApp();
  const creator = users.find((u) => u.id === post.creatorId);
  const liked = isPostLiked(post.id);
  const likesCount = getPostLikesCount(post.id);
  const commentsCount = getPostComments(post.id).length;
  const accentColor = ACCENT_COLORS[(creator?.name?.length ?? 0) % ACCENT_COLORS.length];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Double tap heart
  const lastTapRef = useRef(0);
  const heartAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0.4)).current;

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) likePost(post.id);
      heartAnim.setValue(1);
      heartScale.setValue(0.4);
      Animated.parallel([
        Animated.spring(heartScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 4,
        }),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(heartAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    }
    lastTapRef.current = now;
  };

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
            <Text style={[styles.postAvatarText, { color: accentColor }]}>
              {creator.name[0]?.toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.postCreatorName, { color: colors.text }]}>{creator.name}</Text>
          <Text style={[styles.postTime, { color: colors.textSecondary }]}>
            {formatTime(post.createdAt)}
          </Text>
        </View>
        <Text style={{ fontSize: 18, color: colors.textSecondary }}>⋯</Text>
      </TouchableOpacity>

      {/* Media with double tap */}
      {post.mediaUrl && post.mediaType === "image" && (
        <Pressable onPress={handleDoubleTap} style={{ position: "relative" }}>
          <Image source={{ uri: post.mediaUrl }} style={styles.postMedia} resizeMode="cover" />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.heartOverlay,
              { opacity: heartAnim, transform: [{ scale: heartScale }] },
            ]}
          >
            <Text style={{ fontSize: 90 }}>❤️</Text>
          </Animated.View>
        </Pressable>
      )}

      {/* Caption */}
      {post.content ? (
        <Text style={[styles.postCaption, { color: colors.text }]}>{post.content}</Text>
      ) : null}

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postActionBtn} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Text style={{ fontSize: 24, color: liked ? "#E1306C" : colors.textSecondary }}>
              {liked ? "❤️" : "🤍"}
            </Text>
          </Animated.View>
          {likesCount > 0 && (
            <Text style={[styles.postActionCount, { color: colors.textSecondary }]}>
              {likesCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.postActionBtn}
          onPress={() => setShowComments(true)}
        >
          <Text style={{ fontSize: 22, color: colors.textSecondary }}>💬</Text>
          {commentsCount > 0 && (
            <Text style={[styles.postActionCount, { color: colors.textSecondary }]}>
              {commentsCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.postActionBtn} onPress={() => setShowShare(true)}>
          <Text style={{ fontSize: 22, color: colors.textSecondary }}>📤</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <CommentSheet
        postId={post.id}
        visible={showComments}
        onClose={() => setShowComments(false)}
        colors={colors}
      />
      <SharePostSheet
        post={post}
        visible={showShare}
        onClose={() => setShowShare(false)}
        colors={colors}
      />
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
    t,
    theme,
  } = useApp();

  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const feedPosts = getFeedPosts();
  const activeStories = getActiveStories();

  const storyUsers: User[] = [];
  const seenIds = new Set<string>();
  if (currentUser) {
    storyUsers.push(currentUser);
    seenIds.add(currentUser.id);
  }
  activeStories.forEach((s) => {
    if (!seenIds.has(s.creatorId)) {
      const u = users.find((u) => u.id === s.creatorId);
      if (u) {
        storyUsers.push(u);
        seenIds.add(u.id);
      }
    }
  });

  const unreadNotifs = getUnreadNotificationsCount();
  const unreadMessages = conversations.filter(
    (c) =>
      c.participants.includes(currentUser?.id || "") &&
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
        colors={
          theme === "dark"
            ? ["rgba(79,70,229,0.18)", "transparent"]
            : ["rgba(79,70,229,0.07)", "transparent"]
        }
        style={[styles.headerGrad, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.headerLogo, { color: colors.text }]}>هلا بابل</Text>
          <View style={styles.headerIcons}>
            {/* Create Post FAB in header */}
            <TouchableOpacity
              style={[
                styles.headerIconBtn,
                { backgroundColor: colors.tint },
              ]}
              onPress={() => router.push("/create-post")}
            >
              <Text style={{ color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" }}>+</Text>
            </TouchableOpacity>
            {/* Messages */}
            <TouchableOpacity
              style={[
                styles.headerIconBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push("/(tabs)/messages" as any)}
            >
              <Text style={{ fontSize: 20 }}>💬</Text>
              {unreadMessages > 0 && (
                <View style={[styles.badge, { backgroundColor: "#3B82F6" }]}>
                  <Text style={styles.badgeText}>{unreadMessages}</Text>
                </View>
              )}
            </TouchableOpacity>
            {/* Notifications */}
            <TouchableOpacity
              style={[
                styles.headerIconBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push("/notifications")}
            >
              <Text style={{ fontSize: 20 }}>🔔</Text>
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
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyFeed}>
            <Text style={{ fontSize: 56 }}>👥</Text>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              لا توجد منشورات
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              تابع أشخاصاً لترى منشوراتهم هنا
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/create-post")}
              style={[styles.createFirstPost, { backgroundColor: colors.tint }]}
            >
              <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
                + أنشئ أول منشور
              </Text>
            </TouchableOpacity>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  headerLogo: { fontSize: 22, fontFamily: "Inter_700Bold" },
  headerIcons: { flexDirection: "row", gap: 8 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  storiesContainer: { borderBottomWidth: 1 },
  storiesBar: { paddingHorizontal: 12, paddingVertical: 14, gap: 16 },
  storyItem: { alignItems: "center", gap: 6, width: 68 },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 2.5,
    padding: 2,
    position: "relative",
  },
  storyAvatar: { width: "100%", height: "100%", borderRadius: 19, overflow: "hidden" },
  storyInitial: { fontSize: 22, fontFamily: "Inter_700Bold" },
  storyAddBtn: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  storyName: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center", width: 68 },
  postCard: {
    marginHorizontal: 12,
    marginBottom: 14,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  postAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  postAvatarText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  postCreatorName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  postTime: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  postMedia: { width: "100%", aspectRatio: 1 },
  heartOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  postCaption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 20,
  },
  postActionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  postActionCount: { fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyFeed: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  createFirstPost: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  // Comment Sheet
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  commentSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyComments: { textAlign: "center", fontFamily: "Inter_400Regular", padding: 24 },
  commentItem: { flexDirection: "row", gap: 10, paddingVertical: 8, alignItems: "flex-start" },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  commentAvatarImg: { width: "100%", height: "100%" },
  commentAvatarText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  commentBody: { flex: 1 },
  commentUser: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 2 },
  commentText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  commentInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 48,
    gap: 10,
  },
  commentInputField: { flex: 1, fontSize: 15, maxHeight: 80 },
  sendCommentBtn: { padding: 4 },
  shareUser: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
});
