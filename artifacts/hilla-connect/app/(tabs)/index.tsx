import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
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

import Colors, { ACCENT_COLORS, STORY_GRADIENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { Post, PostComment, Story, User } from "@/context/AppContext";
import { PostSkeleton, StorySkeleton } from "@/components/SkeletonLoader";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";

// ───── Gradient Story Ring ─────
function GradientStoryRing({
  size = 68,
  hasUnseen,
  children,
}: {
  size?: number;
  hasUnseen: boolean;
  children: React.ReactNode;
}) {
  if (!hasUnseen) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: BORDER,
          padding: 2,
          backgroundColor: BG,
        }}
      >
        {children}
      </View>
    );
  }
  return (
    <LinearGradient
      colors={STORY_GRADIENT_COLORS}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={{ width: size, height: size, borderRadius: size / 2, padding: 2.5 }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: size / 2,
          overflow: "hidden",
          backgroundColor: BG,
          padding: 2,
        }}
      >
        {children}
      </View>
    </LinearGradient>
  );
}

// ───── Story Avatar ─────
function StoryAvatar({
  user,
  hasUnseen,
  onPress,
  isMe,
}: {
  user: User;
  stories: Story[];
  hasUnseen: boolean;
  onPress: () => void;
  colors?: any;
  isMe?: boolean;
}) {
  const accentColor = ACCENT_COLORS[(user.name?.length ?? 0) % ACCENT_COLORS.length];

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={styles.storyItem}
      activeOpacity={0.85}
    >
      <GradientStoryRing size={68} hasUnseen={hasUnseen}>
        {user.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={{ width: "100%", height: "100%", borderRadius: 34 }}
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 34,
              backgroundColor: `${accentColor}33`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: accentColor }}>
              {user.name[0]?.toUpperCase()}
            </Text>
          </View>
        )}
      </GradientStoryRing>
      {isMe && (
        <View style={styles.storyAddBtn}>
          <Feather name="plus" size={10} color="#fff" strokeWidth={2.5} />
        </View>
      )}
      <Text style={styles.storyName} numberOfLines={1}>
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
}: {
  postId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { getPostComments, addPostComment, users } = useApp();
  const [text, setText] = useState("");
  const comments = getPostComments(postId);

  const handleSend = () => {
    if (!text.trim()) return;
    addPostComment(postId, text.trim());
    setText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.commentSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>التعليقات</Text>
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          style={{ maxHeight: 320 }}
          ListEmptyComponent={
            <Text style={styles.emptyComments}>لا توجد تعليقات بعد — كن أول من يعلق!</Text>
          }
          renderItem={({ item }: { item: PostComment }) => {
            const commenter = users.find((u) => u.id === item.userId);
            const color = ACCENT_COLORS[item.userId.length % ACCENT_COLORS.length];
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
                  <Text style={[styles.commentUser, { color: "#3D91F4" }]}>{item.userName}</Text>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
              </View>
            );
          }}
        />
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInputField}
            value={text}
            onChangeText={setText}
            placeholder="أضف تعليقاً..."
            placeholderTextColor={TEXT2}
            textAlign="right"
            multiline
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
            <Feather name="send" size={18} color="#3D91F4" strokeWidth={1.5} />
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
}: {
  post: Post;
  visible: boolean;
  onClose: () => void;
}) {
  const { users, currentUser, getConversation, sendPrivateMessage } = useApp();
  const others = users.filter((u) => u.id !== currentUser?.id);

  const handleShare = (user: User) => {
    const convo = getConversation(user.id);
    const snippet = post.content ? post.content.substring(0, 50) : "منشور";
    sendPrivateMessage(convo.id, user.id, `📸 شارك منشوراً: "${snippet}"`, "text");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.commentSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>مشاركة مع</Text>
        <FlatList
          data={others}
          keyExtractor={(u) => u.id}
          style={{ maxHeight: 320 }}
          ListEmptyComponent={
            <Text style={styles.emptyComments}>لا يوجد أصدقاء للمشاركة معهم</Text>
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
                  <Text style={styles.commentUser}>{item.name}</Text>
                </View>
                <Feather name="send" size={16} color={TEXT2} strokeWidth={1.5} />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

// ───── Post Card (Instagram-style) ─────
function PostCard({ post }: { post: Post }) {
  const { users, isPostLiked, likePost, getPostLikesCount, getPostComments } = useApp();
  const creator = users.find((u) => u.id === post.creatorId);
  const liked = isPostLiked(post.id);
  const likesCount = getPostLikesCount(post.id);
  const commentsCount = getPostComments(post.id).length;
  const accentColor = ACCENT_COLORS[(creator?.name?.length ?? 0) % ACCENT_COLORS.length];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

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
        Animated.spring(heartScale, { toValue: 1.1, useNativeDriver: true, friction: 4 }),
        Animated.sequence([
          Animated.delay(700),
          Animated.timing(heartAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    lastTapRef.current = now;
  };

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.35, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    likePost(post.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    <View style={styles.postCard}>
      {/* ── Header ── */}
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
          <Text style={styles.postCreatorName}>{creator.name}</Text>
          <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
        </View>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="more-horizontal" size={20} color={TEXT2} strokeWidth={1.5} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* ── Media ── */}
      {post.mediaUrl && post.mediaType === "image" && (
        <Pressable onPress={handleDoubleTap} style={{ position: "relative" }}>
          <Image source={{ uri: post.mediaUrl }} style={styles.postMedia} resizeMode="cover" />
          <Animated.View
            pointerEvents="none"
            style={[styles.heartOverlay, { opacity: heartAnim, transform: [{ scale: heartScale }] }]}
          >
            <Feather name="heart" size={90} color="#FF3B5C" strokeWidth={0} />
          </Animated.View>
        </Pressable>
      )}

      {/* ── Caption ── */}
      {post.content ? <Text style={styles.postCaption}>{post.content}</Text> : null}

      {/* ── Actions ── */}
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity style={styles.postActionBtn} onPress={handleLike}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Feather
                name="heart"
                size={24}
                color={liked ? "#FF3B5C" : TEXT}
                strokeWidth={liked ? 0 : 1.5}
              />
            </Animated.View>
            {likesCount > 0 && <Text style={styles.postActionCount}>{likesCount}</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.postActionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowComments(true);
            }}
          >
            <Feather name="message-circle" size={24} color={TEXT} strokeWidth={1.5} />
            {commentsCount > 0 && <Text style={styles.postActionCount}>{commentsCount}</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.postActionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowShare(true);
            }}
          >
            <Feather name="send" size={22} color={TEXT} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            setBookmarked(!bookmarked);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Feather
            name="bookmark"
            size={22}
            color={bookmarked ? TEXT : TEXT}
            strokeWidth={bookmarked ? 0 : 1.5}
          />
        </TouchableOpacity>
      </View>

      <CommentSheet postId={post.id} visible={showComments} onClose={() => setShowComments(false)} />
      <SharePostSheet post={post} visible={showShare} onClose={() => setShowShare(false)} />
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
    theme,
  } = useApp();

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
    <View style={styles.container}>
      {/* ── Header with Blur ── */}
      <View style={[styles.headerWrap, { paddingTop: topPad }]}>
        {Platform.OS === "ios" && (
          <BlurView
            intensity={60}
            tint="dark"
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          />
        )}
        {Platform.OS !== "ios" && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.92)" }]} />
        )}
        <View style={styles.headerRow}>
          <Text style={styles.headerLogo}>هلا بابل</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/create-post");
              }}
            >
              <Feather name="plus-square" size={24} color={TEXT} strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/messages" as any);
              }}
            >
              <Feather name="send" size={22} color={TEXT} strokeWidth={1.5} />
              {unreadMessages > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadMessages}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/notifications");
              }}
            >
              <Feather name="bell" size={22} color={TEXT} strokeWidth={1.5} />
              {unreadNotifs > 0 && (
                <View style={[styles.badge, { backgroundColor: "#FF3B5C" }]}>
                  <Text style={styles.badgeText}>{unreadNotifs > 9 ? "9+" : unreadNotifs}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={feedPosts}
        keyExtractor={(p) => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: topPad + 52 }}
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesBar}
            style={styles.storiesContainer}
          >
            {storyUsers.length === 0 && currentUser ? (
              <StoryAvatar
                key="me-placeholder"
                user={currentUser}
                stories={[]}
                hasUnseen={false}
                onPress={() => router.push("/create-story")}
                isMe
              />
            ) : (
              storyUsers.map((user) => (
                <StoryAvatar
                  key={user.id}
                  user={user}
                  stories={getUserStories(user.id)}
                  hasUnseen={hasUnseenStory(user.id)}
                  onPress={() => handleStoryPress(user)}
                  isMe={user.id === currentUser?.id}
                />
              ))
            )}
          </ScrollView>
        }
        ListEmptyComponent={
          <View style={styles.emptyFeed}>
            <Feather name="users" size={56} color={BORDER} strokeWidth={1} />
            <Text style={styles.emptyTitle}>لا توجد منشورات</Text>
            <Text style={styles.emptyDesc}>تابع أشخاصاً لترى منشوراتهم هنا</Text>
            <TouchableOpacity
              onPress={() => router.push("/create-post")}
              style={styles.createFirstPost}
            >
              <Text style={styles.createFirstPostText}>أنشئ أول منشور</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => <PostCard post={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
  },
  headerLogo: { fontSize: 22, fontFamily: "Inter_700Bold", color: TEXT, letterSpacing: -0.5 },
  headerIcons: { flexDirection: "row", gap: 8, alignItems: "center" },
  headerIconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", position: "relative" },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#3D91F4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" },

  // Stories
  storiesContainer: { borderBottomWidth: 0.5, borderBottomColor: BORDER },
  storiesBar: { paddingHorizontal: 16, paddingVertical: 12, gap: 16 },
  storyItem: { alignItems: "center", gap: 6, width: 72, position: "relative" },
  storyAddBtn: {
    position: "absolute",
    bottom: 24,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3D91F4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: BG,
  },
  storyName: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXT, textAlign: "center", width: 72 },

  // Posts (Instagram style - borderless)
  postCard: { backgroundColor: BG, marginBottom: 2 },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  postAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  postAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  postCreatorName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: TEXT },
  postTime: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2, marginTop: 1 },
  postMedia: { width: SCREEN_WIDTH, aspectRatio: 1 },
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: TEXT,
    lineHeight: 22,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  postActionsLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
  postActionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  postActionCount: { fontSize: 14, fontFamily: "Inter_500Medium", color: TEXT },

  // Comment Sheet
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  commentSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 0.5,
    borderColor: BORDER,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  sheetHandle: { width: 36, height: 3, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 4 },
  sheetTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: TEXT, textAlign: "center" },
  emptyComments: { color: TEXT2, textAlign: "center", fontFamily: "Inter_400Regular", paddingVertical: 24 },
  commentItem: { flexDirection: "row", gap: 10, paddingVertical: 8, alignItems: "flex-start" },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  commentAvatarImg: { width: "100%", height: "100%", borderRadius: 16 },
  commentAvatarText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  commentBody: { flex: 1 },
  commentUser: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: TEXT },
  commentText: { fontSize: 13, fontFamily: "Inter_400Regular", color: TEXT, marginTop: 2 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1C1C1C",
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  commentInputField: { flex: 1, color: TEXT, fontFamily: "Inter_400Regular", fontSize: 14, maxHeight: 80 },
  sendBtn: { padding: 4 },
  shareUser: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },

  // Empty
  emptyFeed: { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 16, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", color: TEXT2, textAlign: "center" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT2, textAlign: "center", lineHeight: 22 },
  createFirstPost: {
    backgroundColor: TEXT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    marginTop: 8,
  },
  createFirstPostText: { color: BG, fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
