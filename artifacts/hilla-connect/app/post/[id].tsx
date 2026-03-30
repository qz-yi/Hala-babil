import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { PostComment } from "@/context/AppContext";

// ───── Share Sheet ─────
function SharePostSheet({
  postId,
  postContent,
  visible,
  onClose,
  colors,
}: {
  postId: string;
  postContent?: string;
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const { users, currentUser, getConversation, sendPrivateMessage } = useApp();
  const others = users.filter((u) => u.id !== currentUser?.id);

  const handleShare = (userId: string) => {
    const convo = getConversation(userId);
    const snippet = postContent ? postContent.substring(0, 50) : "منشور";
    sendPrivateMessage(convo.id, userId, `شارك منشوراً: "${snippet}"`, "text");
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
          style={{ maxHeight: 300 }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لا يوجد أصدقاء للمشاركة
            </Text>
          }
          renderItem={({ item }) => {
            const color = ACCENT_COLORS[(item.name?.length ?? 0) % ACCENT_COLORS.length];
            return (
              <TouchableOpacity
                style={styles.shareUser}
                onPress={() => handleShare(item.id)}
              >
                <View style={[styles.miniAvatar, { backgroundColor: `${color}33` }]}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={StyleSheet.absoluteFill as any} />
                  ) : (
                    <Text style={[styles.miniAvatarText, { color }]}>
                      {item.name[0]?.toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.shareUserName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.shareUserPhone, { color: colors.textSecondary }]}>
                    {item.phone}
                  </Text>
                </View>
                <Ionicons name="paper-plane-outline" size={18} color={colors.tint} />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

// ───── Single Post View ─────
export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    posts,
    users,
    currentUser,
    isPostLiked,
    likePost,
    getPostLikesCount,
    getPostComments,
    addPostComment,
    theme,
  } = useApp();

  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const post = posts.find((p) => p.id === id);
  const [commentText, setCommentText] = useState("");
  const [showShare, setShowShare] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0.4)).current;
  const lastTapRef = useRef(0);

  if (!post) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.border} />
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>المنشور غير موجود</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn2, { backgroundColor: colors.tint }]}>
          <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const creator = users.find((u) => u.id === post.creatorId);
  const liked = isPostLiked(post.id);
  const likesCount = getPostLikesCount(post.id);
  const comments = getPostComments(post.id);
  const accentColor = ACCENT_COLORS[(creator?.name?.length ?? 0) % ACCENT_COLORS.length];

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `${mins} دقيقة`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ساعة`;
    return `${Math.floor(hrs / 24)} يوم`;
  };

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    likePost(post.id);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) likePost(post.id);
      heartAnim.setValue(1);
      heartScale.setValue(0.4);
      Animated.parallel([
        Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(heartAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    }
    lastTapRef.current = now;
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addPostComment(post.id, commentText.trim());
    setCommentText("");
  };

  const header = (
    <View>
      {/* ── Top Bar ── */}
      <LinearGradient
        colors={[`${accentColor}18`, "transparent"]}
        style={[styles.topBar, { paddingTop: topPad + 8 }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>المنشور</Text>
        <TouchableOpacity
          onPress={() => setShowShare(true)}
          style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="paper-plane-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Post Card ── */}
      <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.postHeader}
          onPress={() => creator && router.push(`/profile/${creator.id}`)}
          activeOpacity={0.8}
        >
          <View style={[styles.avatar, { backgroundColor: `${accentColor}33` }]}>
            {creator?.avatar ? (
              <Image source={{ uri: creator.avatar }} style={StyleSheet.absoluteFill as any} />
            ) : (
              <Text style={[styles.avatarText, { color: accentColor }]}>
                {creator?.name[0]?.toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.creatorName, { color: colors.text }]}>{creator?.name}</Text>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {formatTime(post.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Media with double-tap */}
        {post.mediaUrl && post.mediaType === "image" && (
          <Pressable onPress={handleDoubleTap} style={{ position: "relative" }}>
            <Image source={{ uri: post.mediaUrl }} style={styles.postMedia} resizeMode="cover" />
            <Animated.View
              pointerEvents="none"
              style={[styles.heartOverlay, { opacity: heartAnim, transform: [{ scale: heartScale }] }]}
            >
              <Ionicons name="heart" size={90} color="#E1306C" />
            </Animated.View>
          </Pressable>
        )}

        {/* Caption */}
        {post.content ? (
          <Text style={[styles.caption, { color: colors.text }]}>{post.content}</Text>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={26}
                color={liked ? "#E1306C" : colors.textSecondary}
              />
            </Animated.View>
            <Text style={[styles.actionCount, { color: colors.textSecondary }]}>{likesCount}</Text>
          </TouchableOpacity>

          <View style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
            <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
              {comments.length}
            </Text>
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowShare(true)}>
            <Ionicons name="paper-plane-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Header */}
      <Text style={[styles.commentsHeader, { color: colors.text, borderBottomColor: colors.border }]}>
        التعليقات ({comments.length})
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 80 }}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.emptyComments}>
            <Ionicons name="chatbubble-outline" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لا توجد تعليقات بعد — كن أول من يعلق!
            </Text>
          </View>
        }
        renderItem={({ item }: { item: PostComment }) => {
          const commenter = users.find((u) => u.id === item.userId);
          const color = ACCENT_COLORS[(item.userId.length) % ACCENT_COLORS.length];
          return (
            <View
              style={[
                styles.commentItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={[styles.miniAvatar, { backgroundColor: `${color}33` }]}>
                {commenter?.avatar ? (
                  <Image source={{ uri: commenter.avatar }} style={StyleSheet.absoluteFill as any} />
                ) : (
                  <Text style={[styles.miniAvatarText, { color }]}>
                    {item.userName[0]?.toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.commentUser, { color: colors.tint }]}>{item.userName}</Text>
                <Text style={[styles.commentContent, { color: colors.text }]}>{item.content}</Text>
                <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Comment Input */}
      <View
        style={[
          styles.inputBar,
          {
            paddingBottom: botPad + 8,
            backgroundColor: colors.backgroundSecondary,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.inputWrap,
            { backgroundColor: colors.inputBackground, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="أضف تعليقاً..."
            placeholderTextColor={colors.textSecondary}
            textAlign="right"
            multiline
          />
        </View>
        <TouchableOpacity
          onPress={handleSendComment}
          style={[styles.sendBtn, { backgroundColor: colors.tint }]}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Share Sheet */}
      <SharePostSheet
        postId={post.id}
        postContent={post.content}
        visible={showShare}
        onClose={() => setShowShare(false)}
        colors={colors}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  notFoundText: { fontSize: 18, fontFamily: "Inter_400Regular" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topBarTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  backBtn2: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14,
  },
  shareBtn: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  postCard: {
    margin: 12, borderRadius: 20, borderWidth: 1, overflow: "hidden",
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    overflow: "hidden", alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  creatorName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  timeText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  postMedia: { width: "100%", aspectRatio: 1 },
  heartOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  caption: {
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24,
  },
  actions: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingBottom: 12, gap: 22,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontSize: 14, fontFamily: "Inter_500Medium" },
  commentsHeader: {
    fontSize: 16, fontFamily: "Inter_700Bold",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  commentItem: {
    flexDirection: "row", gap: 12, padding: 14,
    marginHorizontal: 12, marginBottom: 8,
    borderRadius: 16, borderWidth: 1,
  },
  miniAvatar: {
    width: 38, height: 38, borderRadius: 12,
    overflow: "hidden", alignItems: "center", justifyContent: "center",
  },
  miniAvatarText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  commentUser: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  commentContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  commentTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  emptyComments: {
    alignItems: "center", justifyContent: "center",
    padding: 40, gap: 12,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    gap: 10, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1,
  },
  inputWrap: {
    flex: 1, borderRadius: 18, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    minHeight: 44, maxHeight: 100,
  },
  input: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  // Share sheet
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  commentSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, padding: 20, paddingBottom: 32, gap: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 4,
  },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  shareUser: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  shareUserName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  shareUserPhone: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
