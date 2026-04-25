import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors, { ACCENT_COLORS, STORY_GRADIENT_COLORS } from "@/constants/colors";
import { useApp, isUserVerified } from "@/context/AppContext";
import type { Post, PostComment, Story, User } from "@/context/AppContext";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import MentionInput from "@/components/MentionInput";
import MentionText from "@/components/MentionText";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ───── Gradient Story Ring ─────
function GradientStoryRing({
  size = 68,
  hasUnseen,
  isCloseFriends = false,
  children,
  bgColor,
}: {
  size?: number;
  hasUnseen: boolean;
  isCloseFriends?: boolean;
  children: React.ReactNode;
  bgColor: string;
}) {
  const rotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isCloseFriends || !hasUnseen) return;
    const anim = Animated.loop(
      Animated.timing(rotAnim, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true })
    );
    anim.start();
    return () => { anim.stop(); rotAnim.setValue(0); };
  }, [isCloseFriends, hasUnseen]);

  const rotate = rotAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  if (!hasUnseen) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: "rgba(150,150,150,0.3)",
          padding: 2,
          backgroundColor: bgColor,
        }}
      >
        {children}
      </View>
    );
  }

  if (isCloseFriends) {
    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ rotate }],
          }}
        >
          <LinearGradient
            colors={["#8B5CF6", "#EC4899", "#6D28D9", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        </Animated.View>
        <View
          style={{
            width: size - 6,
            height: size - 6,
            borderRadius: (size - 6) / 2,
            overflow: "hidden",
            backgroundColor: bgColor,
            padding: 2,
          }}
        >
          {children}
        </View>
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
          backgroundColor: bgColor,
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
  isCloseFriends = false,
  onPress,
  isMe,
  colors,
}: {
  user: User;
  stories: Story[];
  hasUnseen: boolean;
  isCloseFriends?: boolean;
  onPress: () => void;
  colors: any;
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
      <GradientStoryRing size={68} hasUnseen={hasUnseen} isCloseFriends={isCloseFriends} bgColor={colors.background}>
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
        <View style={[styles.storyAddBtn, { borderColor: colors.background }]}>
          <Feather name="plus" size={10} color="#fff" strokeWidth={2.5} />
        </View>
      )}
      <Text style={[styles.storyName, { color: colors.text }]} numberOfLines={1}>
        {isMe ? "قصتي" : user.name.split(" ")[0]}
      </Text>
    </TouchableOpacity>
  );
}

// ───── Custom Delete Confirm Modal ─────
function DeleteConfirmModal({
  visible,
  onConfirm,
  onCancel,
  colors,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  colors: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.deleteBackdrop} onPress={onCancel} />
      <View style={[styles.deleteModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.deleteIconWrap}>
          <Feather name="trash-2" size={32} color="#FF3B5C" strokeWidth={1.5} />
        </View>
        <Text style={[styles.deleteTitle, { color: colors.text }]}>حذف المنشور</Text>
        <Text style={[styles.deleteSubtitle, { color: colors.textSecondary }]}>
          هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.
        </Text>
        <TouchableOpacity onPress={onConfirm} style={styles.deleteConfirmBtn} activeOpacity={0.85}>
          <Text style={styles.deleteConfirmText}>حذف المنشور</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCancel}
          style={[styles.deleteCancelBtn, { backgroundColor: colors.backgroundTertiary ?? colors.card }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.deleteCancelText, { color: colors.textSecondary }]}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ───── Themed Comment Options Modal (replaces Alert.alert) ─────
function CommentOptionsModal({
  visible,
  options,
  onClose,
  colors,
}: {
  visible: boolean;
  options: { text: string; style?: string; onPress: () => void }[];
  onClose: () => void;
  colors: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={[styles.optionsSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
        {options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => { onClose(); opt.onPress(); }}
            style={[
              styles.optionItem,
              { borderBottomColor: colors.border },
              idx < options.length - 1 && { borderBottomWidth: 0.5 },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionText,
                opt.style === "destructive" ? { color: "#FF3B5C" } : { color: colors.text },
              ]}
            >
              {opt.text}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={onClose}
          style={[styles.optionCancelBtn, { backgroundColor: colors.backgroundSecondary }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.optionCancelText, { color: colors.textSecondary }]}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ───── Comment Bottom Sheet ─────
function CommentSheet({
  postId,
  postOwnerId,
  visible,
  onClose,
  colors,
}: {
  postId: string;
  postOwnerId: string;
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const {
    getPostComments, addPostComment, deletePostComment, users, currentUser,
    likePostComment, isPostCommentLiked, pinPostComment, getPostCommentLikers,
    banUser, t,
  } = useApp();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === "web" ? 16 : insets.bottom;
  const [text, setText] = useState("");
  const [likersCommentId, setLikersCommentId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuOptions, setMenuOptions] = useState<{ text: string; style?: string; onPress: () => void }[]>([]);
  const comments = getPostComments(postId);
  const isPostOwner = currentUser?.id === postOwnerId;

  const handleSend = () => {
    if (!text.trim()) return;
    addPostComment(postId, text.trim());
    setText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNavigateToProfile = (userId: string) => {
    onClose();
    router.push(`/profile/${userId}` as any);
  };

  const handleLongPressComment = (item: PostComment) => {
    const isOwner = currentUser?.id === item.userId;
    if (!isOwner && !isPostOwner) return;

    const options: { text: string; style?: string; onPress: () => void }[] = [];
    if (isPostOwner) {
      options.push({
        text: item.isPinned ? t("unpinComment") : t("pinComment"),
        onPress: () => pinPostComment(item.id),
      });
    }
    if (isOwner || isPostOwner) {
      options.push({
        text: t("deleteComment"),
        style: "destructive",
        onPress: () => deletePostComment(item.id),
      });
    }
    if (isPostOwner && currentUser?.id !== item.userId) {
      options.push({
        text: t("banUser"),
        style: "destructive",
        onPress: () => banUser(item.userId),
      });
    }
    if (options.length === 0) return;
    setMenuOptions(options);
    setMenuVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const likers = likersCommentId ? getPostCommentLikers(likersCommentId) : [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
        style={[styles.commentSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.sheetTitle, { color: colors.text }]}>التعليقات ({comments.length})</Text>
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
            const liked = isPostCommentLiked(item.id);
            const likesCount = item.likedBy?.length ?? 0;

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={() => handleLongPressComment(item)}
                style={[
                  styles.commentItem,
                  item.isPinned && {
                    backgroundColor: "rgba(61,145,244,0.07)",
                    borderRadius: 12,
                    borderWidth: 0.5,
                    borderColor: "#3D91F444",
                  },
                ]}
              >
                {item.isPinned && (
                  <View style={styles.pinnedBadge}>
                    <Feather name="bookmark" size={9} color="#3D91F4" strokeWidth={2} />
                    <Text style={styles.pinnedText}>مثبّت</Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => handleNavigateToProfile(item.userId)}
                  activeOpacity={0.8}
                  style={[styles.commentAvatar, { backgroundColor: `${color}33` }]}
                >
                  {commenter?.avatar ? (
                    <Image source={{ uri: commenter.avatar }} style={styles.commentAvatarImg} />
                  ) : (
                    <Text style={[styles.commentAvatarText, { color }]}>
                      {item.userName[0]?.toUpperCase()}
                    </Text>
                  )}
                </TouchableOpacity>
                <View style={styles.commentBody}>
                  <TouchableOpacity onPress={() => handleNavigateToProfile(item.userId)} activeOpacity={0.8} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={[styles.commentUser, { color: "#3D91F4" }]}>
                      {commenter?.username || item.userName}
                    </Text>
                    {isUserVerified(commenter) && <VerifiedBadge size={13} />}
                  </TouchableOpacity>
                  <MentionText
                    text={item.content}
                    users={users}
                    style={[styles.commentText, { color: colors.text }]}
                    mentionStyle={{ color: "#3D91F4", fontFamily: "Inter_600SemiBold" }}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => likePostComment(item.id)}
                  onLongPress={() => likesCount > 0 && setLikersCommentId(item.id)}
                  style={styles.commentLikeBtn}
                >
                  <Feather
                    name="heart"
                    size={15}
                    color={liked ? "#FF3B5C" : colors.textSecondary}
                    strokeWidth={liked ? 0 : 1.5}
                  />
                  {likesCount > 0 && (
                    <Text style={[styles.commentLikeCount, { color: liked ? "#FF3B5C" : colors.textSecondary }]}>
                      {likesCount}
                    </Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
        <View style={[styles.commentInputRow, { backgroundColor: colors.inputBackground ?? colors.backgroundSecondary, borderColor: colors.border, marginBottom: botPad > 0 ? botPad : 12 }]}>
          <MentionInput
            value={text}
            onChangeText={setText}
            users={users}
            placeholder="أضف تعليقاً... (@username للإشارة)"
            colors={colors}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            containerStyle={{ flex: 1 }}
            style={{ borderWidth: 0, backgroundColor: "transparent", paddingHorizontal: 0, paddingVertical: 0 }}
          />
          <TouchableOpacity onPress={handleSend} style={[styles.sendBtn, { backgroundColor: text.trim() ? "#3D91F422" : "transparent" }]}>
            <Feather name="send" size={18} color={text.trim() ? "#3D91F4" : colors.textSecondary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CommentOptionsModal
        visible={menuVisible}
        options={menuOptions}
        onClose={() => setMenuVisible(false)}
        colors={colors}
      />

      {/* Likers Modal */}
      <Modal
        visible={!!likersCommentId}
        transparent
        animationType="fade"
        onRequestClose={() => setLikersCommentId(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setLikersCommentId(null)} />
        <View style={[styles.likersSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.text }]}>أعجب بالتعليق</Text>
          {likers.length === 0 ? (
            <Text style={[styles.emptyComments, { color: colors.textSecondary }]}>لا يوجد إعجابات</Text>
          ) : (
            <FlatList
              data={likers}
              keyExtractor={(u) => u.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => {
                const color = ACCENT_COLORS[(item.name?.length ?? 0) % ACCENT_COLORS.length];
                return (
                  <TouchableOpacity
                    style={styles.likerRow}
                    onPress={() => { setLikersCommentId(null); onClose(); router.push(`/profile/${item.id}` as any); }}
                  >
                    <View style={[styles.commentAvatar, { backgroundColor: `${color}33` }]}>
                      {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.commentAvatarImg} />
                      ) : (
                        <Text style={[styles.commentAvatarText, { color }]}>{item.name[0]?.toUpperCase()}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.commentUser, { color: colors.text }]}>{item.name}</Text>
                      {item.username && <Text style={{ color: colors.textSecondary, fontSize: 12 }}>@{item.username}</Text>}
                    </View>
                    <Feather name="heart" size={14} color="#FF3B5C" strokeWidth={0} />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
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
  const { users, currentUser, sharePostToDM, shareContentToStory, isRoomMinimized, minimizedRoomId, minimizedRoomName, sendRoomMessage } = useApp();
  const others = users.filter((u) => u.id !== currentUser?.id);
  const [sent, setSent] = useState<string[]>([]);
  const [addedToStory, setAddedToStory] = useState(false);
  const [sentToRoom, setSentToRoom] = useState(false);

  const handleShare = (userId: string) => {
    sharePostToDM(post.id, userId);
    setSent((p) => [...p, userId]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShareToRoom = () => {
    if (!minimizedRoomId) return;
    const creator = users.find((u) => u.id === post.creatorId);
    sendRoomMessage(
      minimizedRoomId,
      "",
      "shared",
      undefined,
      undefined, undefined, undefined,
      {
        id: post.id,
        type: "post",
        mediaUrl: post.mediaUrl || (post.mediaUrls && post.mediaUrls[0]),
        title: post.content?.slice(0, 80),
        creatorName: creator?.name,
      },
    );
    setSentToRoom(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddToStory = () => {
    const creator = users.find((u) => u.id === post.creatorId);
    const mt: "image" | "video" = post.mediaType === "video" ? "video" : "image";
    shareContentToStory(
      "post",
      post.id,
      post.mediaUrl || (post.mediaUrls && post.mediaUrls[0]),
      post.content,
      creator?.name,
      post.creatorId,
      mt,
    );
    onClose();
    // Note: no toast or success state here — the editor screen confirms success on actual publish.
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={[styles.commentSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.sheetTitle, { color: colors.text }]}>مشاركة</Text>

        {/* Add to Story button */}
        <TouchableOpacity
          style={[
            styles.addToStorySheetBtn,
            { borderColor: addedToStory ? "#10B981" : "#8B5CF6", backgroundColor: addedToStory ? "#10B98122" : "#8B5CF622" },
          ]}
          onPress={!addedToStory ? handleAddToStory : undefined}
          activeOpacity={0.85}
        >
          <Ionicons name={addedToStory ? "checkmark-circle" : "add-circle-outline"} size={22} color={addedToStory ? "#10B981" : "#8B5CF6"} />
          <View>
            <Text style={[styles.addToStorySheetTitle, { color: addedToStory ? "#10B981" : "#8B5CF6" }]}>
              {addedToStory ? "تمت الإضافة للقصة" : "إضافة إلى قصتي"}
            </Text>
            {!addedToStory && (
              <Text style={[styles.addToStorySheetSub, { color: colors.textSecondary }]}>مشاركة المنشور في قصتك</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Contextual Room Share — shown only when user is in an active room */}
        {isRoomMinimized && minimizedRoomId && (
          <TouchableOpacity
            style={[
              styles.addToStorySheetBtn,
              { borderColor: sentToRoom ? "#10B981" : "#7C3AED", backgroundColor: sentToRoom ? "#10B98122" : "#7C3AED22", marginBottom: 8 },
            ]}
            onPress={!sentToRoom ? handleShareToRoom : undefined}
            activeOpacity={0.85}
          >
            <Ionicons name={sentToRoom ? "checkmark-circle" : "mic-outline"} size={22} color={sentToRoom ? "#10B981" : "#7C3AED"} />
            <View>
              <Text style={[styles.addToStorySheetTitle, { color: sentToRoom ? "#10B981" : "#7C3AED" }]}>
                {sentToRoom ? "تمت المشاركة في الغرفة" : `مشاركة في ${minimizedRoomName}`}
              </Text>
              {!sentToRoom && (
                <Text style={[styles.addToStorySheetSub, { color: colors.textSecondary }]}>إرسال المنشور للغرفة الحالية</Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        <Text style={[styles.shareSectionLabel, { color: colors.textSecondary }]}>إرسال لشخص</Text>

        <FlatList
          data={others}
          keyExtractor={(u) => u.id}
          style={{ maxHeight: 280 }}
          ListEmptyComponent={
            <Text style={[styles.emptyComments, { color: colors.textSecondary }]}>
              لا يوجد أصدقاء للمشاركة معهم
            </Text>
          }
          renderItem={({ item }: { item: User }) => {
            const color = ACCENT_COLORS[(item.name?.length ?? 0) % ACCENT_COLORS.length];
            const isSent = sent.includes(item.id);
            return (
              <TouchableOpacity style={styles.shareUser} onPress={() => !isSent && handleShare(item.id)} activeOpacity={isSent ? 1 : 0.7}>
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
                </View>
                {isSent ? (
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                ) : (
                  <Feather name="send" size={16} color={colors.textSecondary} strokeWidth={1.5} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

// ───── Post Video Player ─────
function PostVideoPlayer({ uri }: { uri: string }) {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [barWidth, setBarWidth] = useState(SCREEN_WIDTH - 24);
  const seekingRef = useRef(false);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
  });

  // Pause when leaving the tab
  useFocusEffect(
    useCallback(() => {
      return () => {
        player.pause();
        setPlaying(false);
      };
    }, [player])
  );

  // Subscribe to playback time + duration. We avoid polling — expo-video v3
  // emits `timeUpdate` (gated by timeUpdateEventInterval), `playingChange`,
  // and surfaces `duration` once the asset's metadata is loaded.
  useEffect(() => {
    const subTime = player.addListener("timeUpdate", (payload: any) => {
      if (seekingRef.current) return;
      const t = typeof payload?.currentTime === "number" ? payload.currentTime : player.currentTime;
      if (typeof t === "number" && Number.isFinite(t)) setCurrentTime(t);
      const d = player.duration;
      if (typeof d === "number" && Number.isFinite(d) && d > 0) setDuration(d);
    });
    const subPlaying = player.addListener("playingChange", (payload: any) => {
      const isPlaying = typeof payload?.isPlaying === "boolean" ? payload.isPlaying : payload;
      if (typeof isPlaying === "boolean") setPlaying(isPlaying);
    });
    return () => {
      subTime?.remove?.();
      subPlaying?.remove?.();
    };
  }, [player]);

  const toggle = () => {
    if (playing) player.pause();
    else player.play();
  };

  const seekTo = (clientX: number) => {
    if (!duration || barWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, clientX / barWidth));
    const target = ratio * duration;
    setCurrentTime(target);
    try {
      player.currentTime = target;
    } catch {
      /* ignore */
    }
  };

  const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const fmt = (s: number) => {
    if (!Number.isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <View style={{ position: "relative" }}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.95}>
        <VideoView
          player={player}
          style={{ width: SCREEN_WIDTH, aspectRatio: 16 / 9, backgroundColor: "#000" }}
          contentFit="contain"
          nativeControls={false}
        />
        {!playing && (
          <View style={styles.videoPlayOverlay} pointerEvents="none">
            <View style={styles.videoPlayBtn}>
              <Ionicons name="play" size={32} color="#fff" />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Fullscreen toggle (tap to open modal w/ native controls) */}
      <TouchableOpacity
        onPress={() => setShowFullscreen(true)}
        style={styles.fsBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="expand-outline" size={18} color="#fff" />
      </TouchableOpacity>

      {/* Seek bar */}
      <View style={styles.seekRow} pointerEvents="box-none">
        <Text style={styles.seekTime}>{fmt(currentTime)}</Text>
        <Pressable
          style={styles.seekTrack}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
          onPressIn={(e) => {
            seekingRef.current = true;
            seekTo(e.nativeEvent.locationX);
          }}
          onPressOut={() => {
            seekingRef.current = false;
          }}
          onTouchMove={(e) => {
            if (!seekingRef.current) return;
            seekTo(e.nativeEvent.locationX);
          }}
        >
          <View style={styles.seekFill} />
          <View style={[styles.seekProgress, { width: `${progressRatio * 100}%` }]} />
          <View style={[styles.seekKnob, { left: `${progressRatio * 100}%` }]} />
        </Pressable>
        <Text style={styles.seekTime}>{fmt(duration)}</Text>
      </View>

      {/* Fullscreen modal — mounts a separate VideoView with native controls
          on the SAME player instance so playback position is shared. */}
      <Modal
        visible={showFullscreen}
        animationType="fade"
        onRequestClose={() => setShowFullscreen(false)}
        supportedOrientations={["portrait", "landscape"]}
      >
        <View style={styles.fsModal}>
          <VideoView
            player={player}
            style={{ flex: 1, backgroundColor: "#000" }}
            contentFit="contain"
            nativeControls
            allowsFullscreen
          />
          <TouchableOpacity
            onPress={() => setShowFullscreen(false)}
            style={styles.fsCloseBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ───── Post Card (Instagram-style) ─────
function PostCard({ post, colors, highlighted }: { post: Post; colors: any; highlighted?: boolean }) {
  const { users, currentUser, isPostLiked, likePost, getPostLikesCount, getPostComments, deletePost, isPostSaved, savePost, unsavePost } = useApp();
  const creator = users.find((u) => u.id === post.creatorId);
  const liked = isPostLiked(post.id);
  const likesCount = getPostLikesCount(post.id);
  const commentsCount = getPostComments(post.id).length;
  const accentColor = ACCENT_COLORS[(creator?.name?.length ?? 0) % ACCENT_COLORS.length];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const bookmarked = isPostSaved(post.id);

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

  const handleConfirmDelete = () => {
    deletePost(post.id);
    setShowDeleteModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    <View
      style={[
        styles.postCard,
        { backgroundColor: colors.background },
        highlighted && {
          backgroundColor: "rgba(94,26,140,0.12)",
          borderLeftWidth: 3,
          borderLeftColor: "#5e1a8c",
        },
      ]}
    >
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={[styles.postCreatorName, { color: colors.text }]}>{creator.name}</Text>
            {isUserVerified(creator) && <VerifiedBadge size={13} />}
          </View>
          <Text style={[styles.postTime, { color: colors.textSecondary }]}>{formatTime(post.createdAt)}</Text>
        </View>
        {currentUser?.id === post.creatorId && (
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setShowDeleteModal(true)}
          >
            <Feather name="more-horizontal" size={20} color={colors.textSecondary} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* ── Media ── */}
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
              <Pressable key={idx} onPress={handleDoubleTap} style={{ width: SCREEN_WIDTH }}>
                <Image source={{ uri }} style={[styles.postMedia, { width: SCREEN_WIDTH }]} resizeMode="cover" />
              </Pressable>
            ))}
          </ScrollView>
          {/* Pagination dots */}
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
          {/* Multi-image badge */}
          <View style={styles.multiImageBadge}>
            <Ionicons name="copy-outline" size={14} color="#fff" />
          </View>
          <Animated.View
            pointerEvents="none"
            style={[styles.heartOverlay, { opacity: heartAnim, transform: [{ scale: heartScale }] }]}
          >
            <Feather name="heart" size={90} color="#FF3B5C" strokeWidth={0} />
          </Animated.View>
        </View>
      ) : post.mediaUrl && post.mediaType === "image" ? (
        <Pressable onPress={handleDoubleTap} style={{ position: "relative" }}>
          <Image source={{ uri: post.mediaUrl }} style={styles.postMedia} resizeMode="cover" />
          <Animated.View
            pointerEvents="none"
            style={[styles.heartOverlay, { opacity: heartAnim, transform: [{ scale: heartScale }] }]}
          >
            <Feather name="heart" size={90} color="#FF3B5C" strokeWidth={0} />
          </Animated.View>
        </Pressable>
      ) : post.mediaUrl && post.mediaType === "video" ? (
        <PostVideoPlayer uri={post.mediaUrl} />
      ) : null}

      {/* ── Caption ── */}
      {post.content ? (
        <Text style={[styles.postCaption, { color: colors.text }]}>{post.content}</Text>
      ) : null}

      {/* ── Actions ── */}
      <View style={[styles.postActions, { borderTopColor: colors.border }]}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity
            style={styles.postActionBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleLike}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Feather
                name="heart"
                size={24}
                color={liked ? "#FF3B5C" : colors.text}
                strokeWidth={liked ? 0 : 1.5}
              />
            </Animated.View>
            {likesCount > 0 && (
              <Text style={[styles.postActionCount, { color: colors.text }]}>{likesCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.postActionBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowComments(true);
            }}
          >
            <Feather name="message-circle" size={24} color={colors.text} strokeWidth={1.5} />
            {commentsCount > 0 && (
              <Text style={[styles.postActionCount, { color: colors.text }]}>{commentsCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.postActionBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowShare(true);
            }}
          >
            <Feather name="send" size={22} color={colors.text} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
        postOwnerId={post.creatorId}
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
      <DeleteConfirmModal
        visible={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
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
    theme,
  } = useApp();

  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const feedPosts = getFeedPosts();

  // ── Deep link to a specific post ────────────────────────────────────────
  // When the user taps a shared post card in chat (or any other "navigate
  // to original" entry point), we navigate to /(tabs)/?postId=X instead of
  // pushing a new isolated /post/X screen. This effect resolves the post in
  // the current feed and scrolls the FlatList to it. The post is also
  // briefly highlighted to confirm the jump.
  const { postId: deepLinkPostId } = useLocalSearchParams<{ postId?: string }>();
  const feedListRef = useRef<FlatList<Post>>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!deepLinkPostId) return;
    const idx = feedPosts.findIndex((p) => p.id === deepLinkPostId);
    if (idx < 0) return;
    setHighlightedPostId(deepLinkPostId);
    // Defer to next frame so the FlatList has rendered enough rows; on
    // failure (e.g. row not yet measured) FlatList will snap to the closest
    // offset thanks to onScrollToIndexFailed below.
    requestAnimationFrame(() => {
      try {
        feedListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.1 });
      } catch {
        /* swallowed — handled by onScrollToIndexFailed */
      }
    });
    const t = setTimeout(() => setHighlightedPostId(null), 1800);
    return () => clearTimeout(t);
  }, [deepLinkPostId, feedPosts.length]);
  const activeStories = getActiveStories();

  // Build story tray users list:
  // activeStories is already sorted: admin first, then by recency (from getActiveStories)
  const storyUsers: User[] = [];
  const seenIds = new Set<string>();

  // 1. Current user always first (own story / add-story button)
  if (currentUser) {
    storyUsers.push(currentUser);
    seenIds.add(String(currentUser.id));
  }

  // 2. Iterate activeStories (pre-sorted: admin → recent) and deduplicate by creator
  activeStories.forEach((s) => {
    const cid = String(s.creatorId);
    if (!seenIds.has(cid)) {
      const u = users.find((u2) => String(u2.id) === cid);
      if (u) {
        storyUsers.push(u);
        seenIds.add(cid);
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
      const myStories = getUserStories(currentUser.id);
      const hasActive = myStories.some((s) => s.expiresAt > Date.now());
      if (hasActive) {
        router.push(`/story/${currentUser.id}` as any);
      } else {
        router.push("/create-story");
      }
    } else {
      router.push(`/story/${user.id}` as any);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header with Blur ── */}
      <View style={[styles.headerWrap, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        {Platform.OS === "ios" && (
          <BlurView
            intensity={60}
            tint={theme === "dark" ? "dark" : "light"}
            style={[StyleSheet.absoluteFill, { backgroundColor: theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)" }]}
          />
        )}
        {Platform.OS !== "ios" && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: theme === "dark" ? "rgba(0,0,0,0.92)" : "rgba(255,255,255,0.95)" }]} />
        )}
        <View style={styles.headerRow}>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/create-post");
              }}
            >
              <Feather name="plus-square" size={24} color={colors.text} strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/messages" as any);
              }}
            >
              <Feather name="send" size={22} color={colors.text} strokeWidth={1.5} />
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
              <Feather name="bell" size={22} color={colors.text} strokeWidth={1.5} />
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
        ref={feedListRef}
        data={feedPosts}
        keyExtractor={(p) => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: topPad + 40 }}
        onScrollToIndexFailed={(info) => {
          // Row hasn't been measured yet — fall back to a rough offset and
          // retry the precise scroll once Android/iOS finishes layout.
          feedListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: false,
          });
          setTimeout(() => {
            try {
              feedListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.1 });
            } catch {
              /* give up silently */
            }
          }, 100);
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
            colors={["#7C3AED"]}
            progressViewOffset={topPad + 56}
          />
        }
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesBar}
            style={[styles.storiesContainer, { borderBottomColor: colors.border }]}
          >
            {storyUsers.length === 0 && currentUser ? (
              <StoryAvatar
                key="me-placeholder"
                user={currentUser}
                stories={[]}
                hasUnseen={false}
                onPress={() => router.push("/create-story")}
                isMe
                colors={colors}
              />
            ) : (
              storyUsers.map((user) => {
                const userStories = getUserStories(user.id);
                const hasUnseenCF = userStories.some((s) => s.isCloseFriends && !s.viewerIds.includes(currentUser?.id || ""));
                return (
                  <StoryAvatar
                    key={user.id}
                    user={user}
                    stories={userStories}
                    hasUnseen={hasUnseenStory(user.id)}
                    isCloseFriends={hasUnseenCF}
                    onPress={() => handleStoryPress(user)}
                    isMe={user.id === currentUser?.id}
                    colors={colors}
                  />
                );
              })
            )}
          </ScrollView>
        }
        ListEmptyComponent={
          <View style={styles.emptyFeed}>
            <Feather name="users" size={56} color={colors.border} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>لا توجد منشورات</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              تابع أشخاصاً لترى منشوراتهم هنا
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/create-post")}
              style={[styles.createFirstPost, { backgroundColor: colors.tint }]}
            >
              <Text style={[styles.createFirstPostText, { color: colors.background }]}>
                أنشئ أول منشور
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            colors={colors}
            highlighted={highlightedPostId === item.id}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 0.5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 6,
    paddingTop: 4,
  },
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
  storiesContainer: { borderBottomWidth: 0.5 },
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
  },
  storyName: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", width: 72 },

  // Posts (Instagram style)
  postCard: { marginBottom: 2 },
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
  postCreatorName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  postTime: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  postMedia: { width: SCREEN_WIDTH, aspectRatio: 1 },
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
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  multiImageBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    padding: 5,
  },
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
  postActionBtn: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, minWidth: 44, paddingHorizontal: 4 },
  postActionCount: { fontSize: 14, fontFamily: "Inter_500Medium" },

  // Comment Sheet
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  commentSheet: {
    height: "70%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 0.5,
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  sheetHandle: { width: 36, height: 3, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyComments: { textAlign: "center", fontFamily: "Inter_400Regular", paddingVertical: 24 },
  commentItem: { flexDirection: "row", gap: 10, paddingVertical: 8, paddingHorizontal: 6, alignItems: "flex-start" },
  pinnedBadge: { flexDirection: "row", alignItems: "center", gap: 3, position: "absolute", top: 4, right: 4 },
  pinnedText: { fontSize: 9, color: "#3D91F4", fontFamily: "Inter_600SemiBold" },
  commentLikeBtn: { alignItems: "center", justifyContent: "center", gap: 2, minWidth: 28, paddingTop: 4 },
  commentLikeCount: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  likersSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 0.5, padding: 16, paddingBottom: 32,
  },
  likerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 8 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  commentAvatarImg: { width: "100%", height: "100%", borderRadius: 16 },
  commentAvatarText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  commentBody: { flex: 1 },
  commentUser: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  commentText: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 24,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  commentInputField: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, maxHeight: 80 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  shareUser: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  addToStorySheetBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, borderWidth: 1.5, padding: 12, marginBottom: 4,
  },
  addToStorySheetTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  addToStorySheetSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  shareSectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 0.5, marginTop: 4 },

  // Comment Options Modal (themed, replaces Alert.alert)
  optionsSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 0.5,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 34,
  },
  optionItem: {
    paddingVertical: 16, paddingHorizontal: 8,
  },
  optionText: {
    fontSize: 16, fontFamily: "Inter_500Medium", textAlign: "center",
  },
  optionCancelBtn: {
    borderRadius: 16, paddingVertical: 14, alignItems: "center", marginTop: 10,
  },
  optionCancelText: {
    fontSize: 15, fontFamily: "Inter_600SemiBold",
  },

  // Delete Confirm Modal
  deleteBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  deleteModal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 44,
    alignItems: "center",
    gap: 10,
  },
  deleteIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#FF3B5C22",
    alignItems: "center", justifyContent: "center",
    marginVertical: 8,
  },
  deleteTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  deleteSubtitle: {
    fontSize: 14, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 20,
    paddingHorizontal: 10, marginBottom: 8,
  },
  deleteConfirmBtn: {
    width: "100%", backgroundColor: "#FF3B5C",
    borderRadius: 20, paddingVertical: 16, alignItems: "center", marginTop: 4,
  },
  deleteConfirmText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  deleteCancelBtn: {
    width: "100%", borderRadius: 20, paddingVertical: 16, alignItems: "center",
  },
  deleteCancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  // Empty
  emptyFeed: { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 16, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  createFirstPost: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    marginTop: 8,
  },
  createFirstPostText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },

  // Video Player
  videoPlayOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  videoPlayBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
  fsBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  seekRow: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  seekTime: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    minWidth: 32,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seekTrack: {
    flex: 1,
    height: 18,
    justifyContent: "center",
  },
  seekFill: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  seekProgress: {
    position: "absolute",
    left: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  seekKnob: {
    position: "absolute",
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    marginLeft: -5,
  },
  fsModal: {
    flex: 1,
    backgroundColor: "#000",
  },
  fsCloseBtn: {
    position: "absolute",
    top: 40,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
