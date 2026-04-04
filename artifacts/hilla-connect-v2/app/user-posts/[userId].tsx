import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
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
import type { Post, PostComment } from "@/context/AppContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Inline Video Player ───
function VideoPlayer({ uri }: { uri: string }) {
  const [playing, setPlaying] = useState(false);
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  const toggle = () => {
    if (playing) {
      player.pause();
    } else {
      player.play();
    }
    setPlaying((v) => !v);
  };

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.95} style={{ position: "relative" }}>
      <VideoView
        player={player}
        style={{ width: SCREEN_WIDTH, aspectRatio: 16 / 9, backgroundColor: "#000" }}
        contentFit="contain"
        nativeControls={false}
      />
      {!playing && (
        <View style={styles.videoOverlay}>
          <View style={styles.videoPlayBtn}>
            <Ionicons name="play" size={32} color="#fff" />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Comment Sheet ───
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
        style={[styles.commentSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.sheetTitle, { color: colors.text }]}>التعليقات</Text>
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          style={{ flex: 1 }}
          ListEmptyComponent={
            <Text style={[styles.emptyComments, { color: colors.textSecondary }]}>
              لا توجد تعليقات بعد — كن أول من يعلق!
            </Text>
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
                  <Text style={[styles.commentText, { color: colors.text }]}>{item.content}</Text>
                </View>
              </View>
            );
          }}
        />
        <View style={[styles.inputRow, { backgroundColor: colors.inputBackground ?? colors.backgroundSecondary, borderColor: colors.border }]}>
          <TextInput
            style={[styles.inputField, { color: colors.text }]}
            value={text}
            onChangeText={setText}
            placeholder="أضف تعليقاً..."
            placeholderTextColor={colors.textSecondary}
            textAlign="right"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
            <Feather name="send" size={18} color="#3D91F4" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Post Card (contain mode) ───
function PostCard({ post, colors }: { post: Post; colors: any }) {
  const {
    users, currentUser,
    isPostLiked, likePost, getPostLikesCount,
    getPostComments,
    isPostSaved, savePost, unsavePost,
  } = useApp();

  const creator = users.find((u) => u.id === post.creatorId);
  const liked = isPostLiked(post.id);
  const likesCount = getPostLikesCount(post.id);
  const commentsCount = getPostComments(post.id).length;
  const accentColor = ACCENT_COLORS[(creator?.name?.length ?? 0) % ACCENT_COLORS.length];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bookmarked = isPostSaved(post.id);
  const [showComments, setShowComments] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

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
    <View style={[styles.card, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => router.push(`/profile/${creator.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={[styles.avatar, { backgroundColor: `${accentColor}33` }]}>
          {creator.avatar ? (
            <Image source={{ uri: creator.avatar }} style={StyleSheet.absoluteFill as any} />
          ) : (
            <Text style={[styles.avatarText, { color: accentColor }]}>
              {creator.name[0]?.toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.creatorName, { color: colors.text }]}>{creator.name}</Text>
          <Text style={[styles.postTime, { color: colors.textSecondary }]}>{formatTime(post.createdAt)}</Text>
        </View>
      </TouchableOpacity>

      {/* Media */}
      {post.mediaType === "image" && post.mediaUrls && post.mediaUrls.length > 1 ? (
        <View style={{ position: "relative" }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCarouselIndex(idx);
            }}
            scrollEventThrottle={16}
          >
            {post.mediaUrls.map((uri, idx) => (
              <View key={idx} style={{ width: SCREEN_WIDTH }}>
                <Image
                  source={{ uri }}
                  style={{ width: SCREEN_WIDTH, aspectRatio: 1 }}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
          <View style={styles.carouselDots}>
            {post.mediaUrls.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.carouselDot,
                  { backgroundColor: idx === carouselIndex ? colors.tint : `${colors.tint}44` },
                ]}
              />
            ))}
          </View>
          <View style={styles.multiImgBadge}>
            <Ionicons name="copy-outline" size={14} color="#fff" />
          </View>
        </View>
      ) : post.mediaUrl && post.mediaType === "image" ? (
        <Image
          source={{ uri: post.mediaUrl }}
          style={{ width: SCREEN_WIDTH, aspectRatio: 1 }}
          resizeMode="contain"
        />
      ) : post.mediaUrl && post.mediaType === "video" ? (
        <VideoPlayer uri={post.mediaUrl} />
      ) : null}

      {/* Caption */}
      {post.content ? (
        <Text style={[styles.caption, { color: colors.text }]}>{post.content}</Text>
      ) : null}

      {/* Spacer between media and actions */}
      <View style={{ height: 8 }} />

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Feather
                name="heart"
                size={24}
                color={liked ? "#FF3B5C" : colors.text}
                strokeWidth={liked ? 0 : 1.5}
              />
            </Animated.View>
            {likesCount > 0 && (
              <Text style={[styles.actionCount, { color: colors.text }]}>{likesCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowComments(true);
            }}
          >
            <Feather name="message-circle" size={24} color={colors.text} strokeWidth={1.5} />
            {commentsCount > 0 && (
              <Text style={[styles.actionCount, { color: colors.text }]}>{commentsCount}</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (bookmarked) unsavePost(post.id);
            else savePost(post.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Feather
            name="bookmark"
            size={22}
            color={bookmarked ? colors.tint : colors.text}
            strokeWidth={bookmarked ? 0 : 1.5}
          />
        </TouchableOpacity>
      </View>

      <CommentSheet
        postId={post.id}
        visible={showComments}
        onClose={() => setShowComments(false)}
        colors={colors}
      />
    </View>
  );
}

// ─── Main Screen ───
export default function UserPostsFeedScreen() {
  const { userId, startId } = useLocalSearchParams<{ userId: string; startId: string }>();
  const { getUserPosts, users, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);

  const targetUser = users.find((u) => u.id === userId);
  const posts = getUserPosts(userId ?? "");

  const startIndex = startId ? posts.findIndex((p) => p.id === startId) : 0;

  const scrolledRef = useRef(false);

  const handleScrollReady = useCallback(() => {
    if (scrolledRef.current) return;
    if (startIndex > 0 && flatRef.current) {
      flatRef.current.scrollToIndex({ index: startIndex, animated: false });
      scrolledRef.current = true;
    }
  }, [startIndex]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "ios" ? insets.top : insets.top + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {targetUser?.name ?? "المنشورات"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatRef}
        data={posts}
        keyExtractor={(p) => p.id}
        showsVerticalScrollIndicator={false}
        onLayout={handleScrollReady}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((resolve) => setTimeout(resolve, 200));
          wait.then(() => {
            flatRef.current?.scrollToIndex({ index: info.index, animated: false });
          });
        }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="image" size={48} color={colors.border} strokeWidth={1} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>لا توجد منشورات</Text>
          </View>
        }
        renderItem={({ item }) => <PostCard post={item} colors={colors} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    zIndex: 10,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontFamily: "Inter_600SemiBold" },

  // Post Card
  card: {
    marginBottom: 8,
    borderBottomWidth: 0.5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  creatorName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  postTime: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },

  caption: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  actionsLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontSize: 14, fontFamily: "Inter_500Medium" },

  // Carousel
  carouselDots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  carouselDot: { width: 6, height: 6, borderRadius: 3 },
  multiImgBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    padding: 5,
  },

  // Video
  videoOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  videoPlayBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },

  // Comment Sheet
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  commentSheet: {
    maxHeight: "78%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 0.5,
    padding: 20,
    paddingBottom: 20,
    gap: 12,
  },
  sheetHandle: { width: 36, height: 3, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyComments: { textAlign: "center", fontFamily: "Inter_400Regular", paddingVertical: 24 },
  commentItem: { flexDirection: "row", gap: 10, paddingVertical: 8, alignItems: "flex-start" },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  commentAvatarImg: { width: "100%", height: "100%", borderRadius: 16 },
  commentAvatarText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  commentBody: { flex: 1 },
  commentUser: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  commentText: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 24,
    borderWidth: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  inputField: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, maxHeight: 80 },
  sendBtn: { padding: 4 },

  // Empty state
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 16 },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular" },
});
