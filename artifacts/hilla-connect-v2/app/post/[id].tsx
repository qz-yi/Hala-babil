import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useRef, useState } from "react";
import {
  Alert,
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
import type { PostComment, PostFilter } from "@/context/AppContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Video Post Component ─────
function PostVideo({ uri, style }: { uri: string; style?: any }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={[style, { backgroundColor: "#000" }]}
      contentFit="contain"
      allowsFullscreen
      allowsPictureInPicture={false}
    />
  );
}

// ─── Filter overlay ───
const FILTER_OVERLAY: Record<string, string> = {
  none: "transparent",
  warm: "rgba(255,140,0,0.22)",
  cool: "rgba(0,120,255,0.20)",
  vintage: "rgba(160,100,40,0.28)",
  grayscale: "transparent",
};

function FilteredImage({ uri, filter, style }: { uri: string; filter?: string; style?: any }) {
  const overlay = FILTER_OVERLAY[filter ?? "none"] ?? "transparent";
  return (
    <View style={[style, { overflow: "hidden" }]}>
      <Image
        source={{ uri }}
        style={[StyleSheet.absoluteFill, filter === "grayscale" && Platform.OS === "web" ? ({ filter: "grayscale(100%)" } as any) : {}]}
        resizeMode="cover"
      />
      {overlay !== "transparent" && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlay }]} />
      )}
    </View>
  );
}

// ─── Share Sheet ─────
function SharePostSheet({
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
  const { users, currentUser, sharePostToDM } = useApp();
  const others = users.filter((u) => u.id !== currentUser?.id);
  const [sent, setSent] = useState<string[]>([]);

  const handleShare = (userId: string) => {
    sharePostToDM(postId, userId);
    setSent((p) => [...p, userId]);
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
            const isSent = sent.includes(item.id);
            return (
              <TouchableOpacity
                style={styles.shareUser}
                onPress={() => !isSent && handleShare(item.id)}
              >
                <View style={[styles.miniAvatar, { backgroundColor: `${color}33` }]}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={StyleSheet.absoluteFill as any} />
                  ) : (
                    <Text style={[styles.miniAvatarText, { color }]}>{item.name[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.shareUserName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.shareUserPhone, { color: colors.textSecondary }]}>{item.phone}</Text>
                </View>
                {isSent ? (
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                ) : (
                  <Ionicons name="paper-plane-outline" size={18} color={colors.tint} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

// ─── Comments Bottom Sheet ─────
function CommentsSheet({
  postId,
  postCreatorId,
  visible,
  onClose,
  colors,
}: {
  postId: string;
  postCreatorId: string;
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const {
    users, currentUser, getPostComments, addPostComment,
    deletePostComment, likePostComment, isPostCommentLiked, pinPostComment, t,
  } = useApp();
  const [commentText, setCommentText] = useState("");
  const comments = getPostComments(postId);
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const isPostOwner = currentUser?.id === postCreatorId;

  const handleSend = () => {
    if (!commentText.trim()) return;
    addPostComment(postId, commentText.trim());
    setCommentText("");
  };

  const handleCommentOptions = (comment: PostComment) => {
    const isOwner = currentUser?.id === comment.userId;
    const options: { text: string; onPress: () => void; style?: "destructive" | "cancel" }[] = [];

    if (isPostOwner) {
      options.push({
        text: comment.isPinned ? t("unpinComment") : t("pinComment"),
        onPress: () => pinPostComment(comment.id),
      });
    }
    if (isOwner || isPostOwner) {
      options.push({
        text: t("deleteComment"),
        style: "destructive",
        onPress: () =>
          Alert.alert("حذف التعليق", "هل تريد حذف هذا التعليق؟", [
            { text: t("cancel"), style: "cancel" },
            { text: "حذف", style: "destructive", onPress: () => deletePostComment(comment.id) },
          ]),
      });
    }

    if (options.length === 0) return;
    Alert.alert("خيارات", "", [
      ...options,
      { text: t("cancel"), style: "cancel", onPress: () => {} },
    ]);
  };

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
        style={[styles.commentsSheetContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {/* Handle */}
        <View style={[styles.sheetHandle, { backgroundColor: colors.border, alignSelf: "center", marginTop: 10 }]} />

        {/* Header */}
        <View style={styles.commentsSheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            التعليقات ({comments.length})
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Comments list */}
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 8 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", padding: 40, gap: 12 }}>
              <Ionicons name="chatbubble-outline" size={40} color={colors.border} />
              <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>
                لا توجد تعليقات — كن أول من يعلق!
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const commenter = users.find((u) => u.id === item.userId);
            const color = ACCENT_COLORS[(item.userId.length) % ACCENT_COLORS.length];
            const liked = isPostCommentLiked(item.id);
            const likesCount = item.likedBy.length;
            const canOptions = currentUser?.id === item.userId || isPostOwner;

            return (
              <View
                style={[
                  styles.commentItem,
                  {
                    backgroundColor: item.isPinned ? `${colors.tint}12` : colors.backgroundSecondary,
                    borderColor: item.isPinned ? colors.tint : colors.border,
                  },
                ]}
              >
                {item.isPinned && (
                  <View style={styles.pinnedBadge}>
                    <Ionicons name="pin" size={10} color={colors.tint} />
                    <Text style={[styles.pinnedText, { color: colors.tint }]}>مثبّت</Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => commenter && router.push(`/profile/${commenter.id}`)}
                  style={[styles.miniAvatar, { backgroundColor: `${color}33` }]}
                  activeOpacity={0.8}
                >
                  {commenter?.avatar ? (
                    <Image source={{ uri: commenter.avatar }} style={StyleSheet.absoluteFill as any} />
                  ) : (
                    <Text style={[styles.miniAvatarText, { color }]}>{item.userName[0]?.toUpperCase()}</Text>
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => commenter && router.push(`/profile/${commenter.id}`)} activeOpacity={0.8}>
                    <Text style={[styles.commentUser, { color: colors.tint }]}>{item.userName}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.commentContent, { color: colors.text }]}>{item.content}</Text>
                  <Text style={[styles.commentTime, { color: colors.textSecondary }]}>{formatTime(item.createdAt)}</Text>
                </View>
                <View style={styles.commentActions}>
                  <TouchableOpacity
                    onPress={() => likePostComment(item.id)}
                    style={styles.commentLikeBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={liked ? "heart" : "heart-outline"}
                      size={16}
                      color={liked ? "#E1306C" : colors.textSecondary}
                    />
                    {likesCount > 0 && (
                      <Text style={[styles.commentLikeCount, { color: liked ? "#E1306C" : colors.textSecondary }]}>
                        {likesCount}
                      </Text>
                    )}
                  </TouchableOpacity>
                  {canOptions && (
                    <TouchableOpacity onPress={() => handleCommentOptions(item)} style={styles.commentMoreBtn}>
                      <Ionicons name="ellipsis-horizontal" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />

        {/* Input */}
        <View
          style={[
            styles.commentInputBar,
            { paddingBottom: botPad + 8, backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border },
          ]}
        >
          <View style={[styles.commentInputWrap, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <TextInput
              style={[styles.commentInput, { color: colors.text }]}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="أضف تعليقاً..."
              placeholderTextColor={colors.textSecondary}
              textAlign="right"
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendBtn, { backgroundColor: commentText.trim() ? colors.tint : colors.backgroundTertiary }]}
          >
            <Ionicons name="send" size={18} color={commentText.trim() ? "#fff" : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Custom Post Options Modal ─────
function PostOptionsModal({
  visible,
  onClose,
  isHidden,
  onHide,
  onDelete,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  isHidden: boolean;
  onHide: () => void;
  onDelete: () => void;
  colors: any;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={modalStyles.backdrop} onPress={handleClose} />
      <View style={[modalStyles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />

        {!confirmDelete ? (
          <>
            <Text style={[modalStyles.title, { color: colors.text }]}>خيارات المنشور</Text>

            <TouchableOpacity
              onPress={() => { onHide(); handleClose(); }}
              style={[modalStyles.optionBtn, { backgroundColor: `${colors.tint}12`, borderColor: `${colors.tint}22` }]}
            >
              <Ionicons name={isHidden ? "eye-outline" : "eye-off-outline"} size={20} color={colors.tint} />
              <Text style={[modalStyles.optionText, { color: colors.tint }]}>
                {isHidden ? "إظهار المنشور" : "إخفاء المنشور"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setConfirmDelete(true)}
              style={[modalStyles.optionBtn, { backgroundColor: "#FF3B5C18", borderColor: "#FF3B5C33" }]}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B5C" />
              <Text style={[modalStyles.optionText, { color: "#FF3B5C" }]}>حذف المنشور</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleClose} style={[modalStyles.cancelBtn, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[modalStyles.cancelText, { color: colors.textSecondary }]}>إلغاء</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={modalStyles.confirmIcon}>
              <Ionicons name="trash" size={36} color="#FF3B5C" />
            </View>
            <Text style={[modalStyles.title, { color: colors.text }]}>حذف المنشور</Text>
            <Text style={[modalStyles.confirmSubtitle, { color: colors.textSecondary }]}>
              هل أنت متأكد؟ لا يمكن التراجع عن هذه العملية.
            </Text>
            <TouchableOpacity
              onPress={() => { onDelete(); handleClose(); }}
              style={modalStyles.deleteBtn}
            >
              <Text style={modalStyles.deleteBtnText}>نعم، احذف المنشور</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setConfirmDelete(false)} style={[modalStyles.cancelBtn, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[modalStyles.cancelText, { color: colors.textSecondary }]}>رجوع</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, padding: 20, paddingBottom: 36, gap: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 4 },
  confirmSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 8 },
  confirmIcon: { alignItems: "center", marginBottom: 4 },
  optionBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 20, borderWidth: 1,
  },
  optionText: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1 },
  deleteBtn: {
    backgroundColor: "#FF3B5C", borderRadius: 20,
    paddingVertical: 16, alignItems: "center",
  },
  deleteBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  cancelBtn: { borderRadius: 20, paddingVertical: 16, alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

// ─── Single Post View ─────
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
    deletePost,
    hidePost,
    isPostSaved,
    savePost,
    unsavePost,
    theme,
    t,
  } = useApp();

  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const post = posts.find((p) => p.id === id);
  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

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
  const isMyPost = currentUser?.id === post.creatorId;

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

  const handlePostOptions = () => {
    if (!isMyPost) return;
    setShowOptions(true);
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
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowShare(true)}
            style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="paper-plane-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {isMyPost && (
            <TouchableOpacity
              onPress={handlePostOptions}
              style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ── Post Card ── */}
      <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Hidden badge */}
        {post.isHidden && isMyPost && (
          <View style={[styles.hiddenBadge, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="eye-off-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.hiddenBadgeText, { color: colors.textSecondary }]}>مخفي عن الآخرين</Text>
          </View>
        )}

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

        {/* Media with filter + double-tap — single or multi-image carousel */}
        {post.mediaType === "image" && post.mediaUrls && post.mediaUrls.length > 1 ? (
          <View>
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
                <Pressable key={idx} onPress={handleDoubleTap} style={{ width: SCREEN_WIDTH }}>
                  <FilteredImage uri={uri} filter={post.filter} style={[styles.postMedia, { width: SCREEN_WIDTH }]} />
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.carouselDots}>
              {post.mediaUrls.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.carouselDot,
                    { backgroundColor: idx === carouselIndex ? "#fff" : "rgba(255,255,255,0.4)" },
                  ]}
                />
              ))}
            </View>
            <Animated.View
              pointerEvents="none"
              style={[styles.heartOverlay, { opacity: heartAnim, transform: [{ scale: heartScale }] }]}
            >
              <Ionicons name="heart" size={90} color="#E1306C" />
            </Animated.View>
          </View>
        ) : post.mediaUrl && post.mediaType === "image" ? (
          <Pressable onPress={handleDoubleTap} style={{ position: "relative" }}>
            <FilteredImage
              uri={post.mediaUrl}
              filter={post.filter}
              style={styles.postMedia}
            />
            <Animated.View
              pointerEvents="none"
              style={[styles.heartOverlay, { opacity: heartAnim, transform: [{ scale: heartScale }] }]}
            >
              <Ionicons name="heart" size={90} color="#E1306C" />
            </Animated.View>
          </Pressable>
        ) : post.mediaUrl && post.mediaType === "video" ? (
          <PostVideo uri={post.mediaUrl} style={styles.postMedia} />
        ) : null}

        {/* Caption */}
        {post.content ? (
          <Text style={[styles.caption, { color: colors.text }]}>{post.content}</Text>
        ) : null}

        {/* Actions */}
        <View style={[styles.actions, { justifyContent: "space-between" }]}>
          <View style={{ flexDirection: "row", gap: 4 }}>
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

            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(true)}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
              <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
                {comments.length}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowShare(true)}>
              <Ionicons name="paper-plane-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              if (isPostSaved(post.id)) unsavePost(post.id);
              else savePost(post.id);
            }}
          >
            <Ionicons
              name={isPostSaved(post.id) ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isPostSaved(post.id) ? colors.tint : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Open comments hint */}
      <TouchableOpacity
        onPress={() => setShowComments(true)}
        style={[styles.openCommentsBtn, { borderBottomColor: colors.border }]}
      >
        <Ionicons name="chatbubble-outline" size={18} color={colors.tint} />
        <Text style={[styles.openCommentsBtnText, { color: colors.tint }]}>
          عرض التعليقات ({comments.length})
        </Text>
        <Ionicons name="chevron-up" size={16} color={colors.tint} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}

      {/* Share Sheet */}
      <SharePostSheet
        postId={post.id}
        visible={showShare}
        onClose={() => setShowShare(false)}
        colors={colors}
      />

      {/* Comments Bottom Sheet */}
      <CommentsSheet
        postId={post.id}
        postCreatorId={post.creatorId}
        visible={showComments}
        onClose={() => setShowComments(false)}
        colors={colors}
      />

      {/* Custom Post Options Modal */}
      <PostOptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        isHidden={post.isHidden ?? false}
        onHide={() => { hidePost(post.id); router.back(); }}
        onDelete={() => { deletePost(post.id); router.back(); }}
        colors={colors}
      />
    </View>
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
  topBarTitle: { fontSize: 18, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  backBtn2: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  shareBtn: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  postCard: {
    margin: 12, borderRadius: 20, borderWidth: 1, overflow: "hidden",
  },
  hiddenBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  hiddenBadgeText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    overflow: "hidden", alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  creatorName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  timeText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  postMedia: { width: "100%", aspectRatio: 1 },
  carouselDots: {
    position: "absolute", bottom: 8, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 5, zIndex: 2,
  },
  carouselDot: { width: 7, height: 7, borderRadius: 4 },
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
  openCommentsBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  openCommentsBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
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
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 20 },
  // Comments Sheet
  commentsSheetContainer: {
    height: "80%",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, overflow: "hidden",
  },
  commentsSheetHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8,
  },
  sheetCloseBtn: { padding: 6 },
  commentItem: {
    flexDirection: "row", gap: 10, padding: 12,
    borderRadius: 16, borderWidth: 1, position: "relative",
  },
  pinnedBadge: {
    position: "absolute", top: -1, right: 10,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(124,58,237,0.2)", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  pinnedText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  miniAvatar: {
    width: 38, height: 38, borderRadius: 12,
    overflow: "hidden", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  miniAvatarText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  commentUser: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  commentContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  commentTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  commentActions: { flexDirection: "column", alignItems: "center", gap: 4 },
  commentLikeBtn: { alignItems: "center", gap: 2 },
  commentLikeCount: { fontSize: 11, fontFamily: "Inter_500Medium" },
  commentMoreBtn: { padding: 4 },
  commentInputBar: {
    flexDirection: "row", alignItems: "flex-end",
    gap: 10, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1,
  },
  commentInputWrap: {
    flex: 1, borderRadius: 18, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    minHeight: 44, maxHeight: 100,
  },
  commentInput: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
});
