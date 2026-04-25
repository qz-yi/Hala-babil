import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
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
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ACCENT_COLORS } from "@/constants/colors";
import { useApp, type Reel, type ReelFilter, isUserVerified } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import MentionInput from "@/components/MentionInput";
import MentionText from "@/components/MentionText";

const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const REEL_HEIGHT = Platform.OS === "web" ? Math.min(SCREEN_HEIGHT, 700) : SCREEN_HEIGHT;

const FILTERS: { key: ReelFilter; label: string; overlay: string }[] = [
  { key: "none", label: "بدون", overlay: "transparent" },
  { key: "grayscale", label: "أبيض وأسود", overlay: "rgba(200,200,200,0.35)" },
  { key: "warm", label: "دافئ", overlay: "rgba(255,140,0,0.22)" },
  { key: "cool", label: "بارد", overlay: "rgba(0,120,255,0.20)" },
  { key: "vintage", label: "كلاسيكي", overlay: "rgba(120,60,0,0.28)" },
];

function getFilterOverlay(filter: ReelFilter): string {
  return FILTERS.find((f) => f.key === filter)?.overlay ?? "transparent";
}

function CommentStoryAvatar({
  avatar,
  fallbackName,
  color,
  hasStory,
  hasUnseen,
  onPress,
}: {
  avatar?: string;
  fallbackName: string;
  color: string;
  hasStory: boolean;
  hasUnseen: boolean;
  onPress: () => void;
}) {
  const inner = (
    <View style={[styles.commentAvatar, { backgroundColor: color }]}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.commentAvatarImg} />
      ) : (
        <Text style={styles.commentAvatarText}>{fallbackName[0]?.toUpperCase()}</Text>
      )}
    </View>
  );
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {hasStory ? (
        <LinearGradient
          colors={hasUnseen ? ["#00C853", "#3D91F4", "#D6249F"] : ["#555", "#333"]}
          style={styles.commentStoryRing}
        >
          {inner}
        </LinearGradient>
      ) : inner}
    </TouchableOpacity>
  );
}

// ───── Reel Player ─────
function ReelPlayerItem({
  reel,
  isActive,
  onLike,
  onComment,
  onShare,
  onDelete,
  isLiked,
  likesCount,
  commentsCount,
  isOwner,
  creatorName,
  creatorAvatar,
  isCreatorVerified,
  insets,
}: {
  reel: Reel;
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onDelete: () => void;
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  isOwner: boolean;
  creatorName: string;
  creatorAvatar?: string;
  isCreatorVerified?: boolean;
  insets: any;
}) {
  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [seekBarWidth, setSeekBarWidth] = useState(1);
  const seekingRef = useRef(false);

  const player = useVideoPlayer(reel.videoUrl, (p) => {
    p.loop = true;
    p.timeUpdateEventInterval = 0.25;
    if (isActive) p.play();
  });

  React.useEffect(() => {
    if (isActive && !paused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, paused]);

  // Track playback position + duration for the seek bar.
  React.useEffect(() => {
    const subTime = player.addListener("timeUpdate", (payload: any) => {
      if (seekingRef.current) return;
      const t = typeof payload?.currentTime === "number" ? payload.currentTime : player.currentTime;
      if (typeof t === "number" && Number.isFinite(t)) setCurrentTime(t);
      const d = player.duration;
      if (typeof d === "number" && Number.isFinite(d) && d > 0) setDuration(d);
    });
    return () => {
      subTime?.remove?.();
    };
  }, [player]);

  const overlay = getFilterOverlay(reel.filter);
  const accentColor = ACCENT_COLORS[reel.id.length % ACCENT_COLORS.length];

  const togglePause = () => {
    setPaused((p) => !p);
  };

  const seekTo = (clientX: number) => {
    if (!duration || seekBarWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, clientX / seekBarWidth));
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
    <View style={[styles.reelItem, { height: REEL_HEIGHT }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Tap to pause/play - behind everything */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={togglePause}
      />

      {/* Filter overlay */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: overlay }]}
        pointerEvents="none"
      />

      {/* Pause indicator */}
      {paused && (
        <View
          style={styles.pauseOverlay}
          pointerEvents="none"
        >
          <View style={styles.pauseIcon}>
            <Feather name="play" size={32} color="#fff" strokeWidth={1.5} />
          </View>
        </View>
      )}

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        style={styles.reelGradient}
        pointerEvents="none"
      />

      {/* Fullscreen toggle (top-right). Sits above all overlays. */}
      <TouchableOpacity
        onPress={() => setShowFullscreen(true)}
        style={[styles.reelFsBtn, { top: insets.top + 12 }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="expand-outline" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Seek bar — sits just above the bottom meta/actions row. */}
      <View
        style={[styles.reelSeekRow, { bottom: insets.bottom + 78 }]}
        pointerEvents="box-none"
      >
        <Text style={styles.reelSeekTime}>{fmt(currentTime)}</Text>
        <Pressable
          style={styles.reelSeekTrack}
          onLayout={(e) => setSeekBarWidth(e.nativeEvent.layout.width)}
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
          <View style={styles.reelSeekFill} />
          <View style={[styles.reelSeekProgress, { width: `${progressRatio * 100}%` }]} />
          <View style={[styles.reelSeekKnob, { left: `${progressRatio * 100}%` }]} />
        </Pressable>
        <Text style={styles.reelSeekTime}>{fmt(duration)}</Text>
      </View>

      {/* Fullscreen modal — same player instance keeps position synced. */}
      <Modal
        visible={showFullscreen}
        animationType="fade"
        onRequestClose={() => setShowFullscreen(false)}
        supportedOrientations={["portrait", "landscape"]}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <VideoView
            player={player}
            style={{ flex: 1, backgroundColor: "#000" }}
            contentFit="contain"
            nativeControls
            allowsFullscreen
          />
          <TouchableOpacity
            onPress={() => setShowFullscreen(false)}
            style={[styles.reelFsCloseBtn, { top: insets.top + 12 }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={[styles.reelMeta, { paddingBottom: insets.bottom + 80 }]}>
        <TouchableOpacity
          onPress={() => router.push(`/profile/${reel.creatorId}`)}
          style={styles.creatorRow}
        >
          {creatorAvatar ? (
            <Image source={{ uri: creatorAvatar }} style={styles.creatorAvatar} />
          ) : (
            <View style={[styles.creatorAvatarFallback, { backgroundColor: accentColor }]}>
              <Text style={styles.creatorAvatarText}>{creatorName[0]?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.creatorName}>{creatorName}</Text>
          {isCreatorVerified && <VerifiedBadge size={14} />}
        </TouchableOpacity>
        {!!reel.title && (
          <Text style={styles.reelTitle} numberOfLines={2}>
            {reel.title}
          </Text>
        )}
      </View>

      {/* Action buttons - must be on top, so use onPress to stop propagation */}
      <View style={[styles.reelActions, { paddingBottom: insets.bottom + 90 }]}>
        <TouchableOpacity
          style={styles.actionBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onLike(); }}
        >
          <Feather name="heart" size={28} color={isLiked ? "#FF3B5C" : "#fff"} strokeWidth={isLiked ? 0 : 1.5} />
          <Text style={styles.actionCount}>{likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onComment(); }}
        >
          <Feather name="message-circle" size={26} color="#fff" strokeWidth={1.5} />
          <Text style={styles.actionCount}>{commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onShare(); }}
        >
          <Feather name="send" size={26} color="#fff" strokeWidth={1.5} />
          <Text style={styles.actionCount}>مشاركة</Text>
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity
            style={styles.actionBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(); }}
          >
            <Feather name="trash-2" size={22} color="#FF3B5C" strokeWidth={1.5} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ───── Comment Sheet ─────
function ReelCommentOptionsModal({
  visible,
  options,
  onClose,
}: {
  visible: boolean;
  options: { text: string; style?: string; onPress: () => void }[];
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={[styles.optionsSheet, { backgroundColor: CARD, borderColor: BORDER }]}>
        <View style={[styles.sheetHandle, { backgroundColor: BORDER }]} />
        {options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => { onClose(); opt.onPress(); }}
            style={[
              styles.optionItem,
              { borderBottomColor: BORDER },
              idx < options.length - 1 && { borderBottomWidth: 0.5 },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionText,
                opt.style === "destructive" ? { color: "#FF3B5C" } : { color: TEXT },
              ]}
            >
              {opt.text}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={onClose}
          style={[styles.optionCancelBtn, { backgroundColor: "#1C1C1C" }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.optionCancelText, { color: TEXT2 }]}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function CommentSheet({
  reelId,
  reelOwnerId,
  visible,
  onClose,
}: {
  reelId: string;
  reelOwnerId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const {
    getReelComments, addReelComment, deleteReelComment, users, currentUser,
    likeReelComment, isReelCommentLiked, pinReelComment, getReelCommentLikers,
    banUser, t,
    getUserStories, hasUnseenStory,
  } = useApp();
  const [text, setText] = useState("");
  const [likersCommentId, setLikersCommentId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuOptions, setMenuOptions] = useState<{ text: string; style?: string; onPress: () => void }[]>([]);
  const comments = getReelComments(reelId);
  const isReelOwner = currentUser?.id === reelOwnerId;

  const handleSend = () => {
    if (!text.trim()) return;
    addReelComment(reelId, text.trim());
    setText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNavigateToProfile = (userId: string) => {
    onClose();
    router.push(`/profile/${userId}` as any);
  };

  const handleNavigateToStoryOrProfile = (userId: string, hasStory: boolean) => {
    onClose();
    router.push(hasStory ? `/story/${userId}` as any : `/profile/${userId}` as any);
  };

  const handleLongPressComment = (item: any) => {
    const isOwner = currentUser?.id === item.userId;
    if (!isOwner && !isReelOwner) return;

    const options: { text: string; style?: string; onPress: () => void }[] = [];

    if (isReelOwner) {
      options.push({
        text: item.isPinned ? t("unpinComment") : t("pinComment"),
        onPress: () => pinReelComment(item.id),
      });
    }
    if (isOwner || isReelOwner) {
      options.push({
        text: t("deleteComment"),
        style: "destructive",
        onPress: () => deleteReelComment(item.id),
      });
    }
    if (isReelOwner && currentUser?.id !== item.userId) {
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

  const likers = likersCommentId ? getReelCommentLikers(likersCommentId) : [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
        style={[styles.commentSheet, { backgroundColor: CARD, borderColor: BORDER }]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: BORDER }]} />
        <Text style={[styles.sheetTitle, { color: TEXT }]}>التعليقات ({comments.length})</Text>
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <Text style={[styles.emptyComments, { color: TEXT2 }]}>
              لا توجد تعليقات بعد
            </Text>
          }
          renderItem={({ item }) => {
            const commenter = users.find((u) => u.id === item.userId);
            const accentColor = ACCENT_COLORS[item.userId.length % ACCENT_COLORS.length];
            const liked = isReelCommentLiked(item.id);
            const likesCount = item.likedBy?.length ?? 0;
            const commenterStories = commenter ? getUserStories(commenter.id) : [];
            const commenterHasStory = commenterStories.length > 0;

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={() => handleLongPressComment(item)}
                style={[
                  styles.commentItem,
                  item.isPinned && { backgroundColor: "rgba(61,145,244,0.08)", borderRadius: 12, borderWidth: 0.5, borderColor: "#3D91F444" },
                ]}
              >
                {item.isPinned && (
                  <View style={styles.pinnedBadge}>
                    <Feather name="bookmark" size={9} color="#3D91F4" strokeWidth={2} />
                    <Text style={styles.pinnedText}>مثبّت</Text>
                  </View>
                )}
                <CommentStoryAvatar
                  avatar={item.userAvatar}
                  fallbackName={item.userName}
                  color={accentColor}
                  hasStory={commenterHasStory}
                  hasUnseen={commenter ? hasUnseenStory(commenter.id) : false}
                  onPress={() => handleNavigateToStoryOrProfile(item.userId, commenterHasStory)}
                />
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
                    style={[styles.commentText, { color: TEXT }]}
                    mentionStyle={{ color: "#3D91F4", fontFamily: "Inter_600SemiBold" }}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => likeReelComment(item.id)}
                  onLongPress={() => likesCount > 0 && setLikersCommentId(item.id)}
                  style={styles.commentLikeBtn}
                >
                  <Feather
                    name="heart"
                    size={15}
                    color={liked ? "#FF3B5C" : TEXT2}
                    strokeWidth={liked ? 0 : 1.5}
                  />
                  {likesCount > 0 && (
                    <Text style={[styles.commentLikeCount, { color: liked ? "#FF3B5C" : TEXT2 }]}>
                      {likesCount}
                    </Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
        <View style={[styles.commentInput, { backgroundColor: "#1C1C1C", borderColor: BORDER }]}>
          <MentionInput
            value={text}
            onChangeText={setText}
            users={users}
            placeholder="أضف تعليقاً... (@username للإشارة)"
            colors={{ text: TEXT, textSecondary: TEXT2, card: CARD, border: BORDER, backgroundSecondary: "#1C1C1C", tint: "#3D91F4", inputBackground: "#1C1C1C" }}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            containerStyle={{ flex: 1 }}
            style={{ borderWidth: 0, backgroundColor: "transparent", paddingHorizontal: 0, paddingVertical: 0 }}
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendCommentBtn}>
            <Feather name="send" size={18} color="#3D91F4" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ReelCommentOptionsModal
        visible={menuVisible}
        options={menuOptions}
        onClose={() => setMenuVisible(false)}
      />

      {/* Likers Modal */}
      <Modal
        visible={!!likersCommentId}
        transparent
        animationType="fade"
        onRequestClose={() => setLikersCommentId(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setLikersCommentId(null)} />
        <View style={[styles.likersSheet, { backgroundColor: CARD, borderColor: BORDER }]}>
          <View style={[styles.sheetHandle, { backgroundColor: BORDER }]} />
          <Text style={[styles.sheetTitle, { color: TEXT }]}>أعجب بالتعليق</Text>
          {likers.length === 0 ? (
            <Text style={[styles.emptyComments, { color: TEXT2 }]}>لا يوجد إعجابات بعد</Text>
          ) : (
            <FlatList
              data={likers}
              keyExtractor={(u) => u.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => {
                const color = ACCENT_COLORS[item.id.length % ACCENT_COLORS.length];
                return (
                  <TouchableOpacity
                    style={styles.likerRow}
                    onPress={() => { setLikersCommentId(null); onClose(); router.push(`/profile/${item.id}` as any); }}
                  >
                    <View style={[styles.commentAvatar, { backgroundColor: color }]}>
                      {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.commentAvatarImg} />
                      ) : (
                        <Text style={styles.commentAvatarText}>{item.name[0]?.toUpperCase()}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.commentUser, { color: TEXT }]}>{item.name}</Text>
                      {item.username && <Text style={{ color: TEXT2, fontSize: 12 }}>@{item.username}</Text>}
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

// ───── Share Sheet ─────
function ShareSheet({
  reelId,
  visible,
  onClose,
}: {
  reelId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { users, currentUser, shareReelToConversation, reels, shareContentToStory, isRoomMinimized, minimizedRoomId, minimizedRoomName, sendRoomMessage } = useApp();
  const { showToast } = useToast();
  const others = users.filter((u) => u.id !== currentUser?.id);
  const [addedToStory, setAddedToStory] = useState(false);
  const [sent, setSent] = useState<string[]>([]);
  const [sentToRoom, setSentToRoom] = useState(false);

  const handleShare = (userId: string) => {
    if (sent.includes(userId)) return;
    shareReelToConversation(reelId, userId);
    setSent((prev) => [...prev, userId]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDone = () => {
    if (sent.length > 0) {
      showToast(`تم مشاركة المقطع مع ${sent.length} شخص`, "success");
    }
    onClose();
  };

  const handleAddToStory = () => {
    const reel = reels.find((r) => r.id === reelId);
    if (!reel) return;
    const creator = users.find((u) => u.id === reel.creatorId);
    shareContentToStory("reel", reelId, reel.videoUrl, reel.title, creator?.name, reel.creatorId, "video");
    onClose();
  };

  const handleShareToRoom = () => {
    if (!minimizedRoomId) return;
    const reel = reels.find((r) => r.id === reelId);
    const creator = reel ? users.find((u) => u.id === reel.creatorId) : null;
    sendRoomMessage(
      minimizedRoomId,
      "",
      "shared",
      undefined,
      undefined, undefined, undefined,
      {
        id: reelId,
        type: "reel",
        mediaUrl: reel?.videoUrl,
        title: reel?.title,
        creatorName: creator?.name,
      },
    );
    setSentToRoom(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDone}>
      <Pressable style={styles.sheetBackdrop} onPress={handleDone} />
      <View style={[styles.commentSheet, { backgroundColor: CARD, borderColor: BORDER }]}>
        <View style={[styles.sheetHandle, { backgroundColor: BORDER }]} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 }}>
          <Text style={[styles.sheetTitle, { color: TEXT }]}>مشاركة</Text>
          {sent.length > 0 && (
            <TouchableOpacity onPress={handleDone} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#7C3AED", borderRadius: 20 }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" }}>إرسال ({sent.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Add to Story */}
        <TouchableOpacity
          style={[styles.addToStoryReelBtn, { borderColor: addedToStory ? "#10B981" : "#8B5CF6", backgroundColor: addedToStory ? "#10B98122" : "#8B5CF622" }]}
          onPress={!addedToStory ? handleAddToStory : undefined}
          activeOpacity={0.85}
        >
          <Ionicons name={addedToStory ? "checkmark-circle" : "add-circle-outline"} size={20} color={addedToStory ? "#10B981" : "#8B5CF6"} />
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: addedToStory ? "#10B981" : "#8B5CF6" }}>
            {addedToStory ? "تمت الإضافة للقصة" : "إضافة إلى قصتي"}
          </Text>
        </TouchableOpacity>

        {/* Contextual Room Share */}
        {isRoomMinimized && minimizedRoomId && (
          <TouchableOpacity
            style={[styles.addToStoryReelBtn, { borderColor: sentToRoom ? "#10B981" : "#7C3AED", backgroundColor: sentToRoom ? "#10B98122" : "#7C3AED22" }]}
            onPress={!sentToRoom ? handleShareToRoom : undefined}
            activeOpacity={0.85}
          >
            <Ionicons name={sentToRoom ? "checkmark-circle" : "mic-outline"} size={20} color={sentToRoom ? "#10B981" : "#7C3AED"} />
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: sentToRoom ? "#10B981" : "#7C3AED" }}>
              {sentToRoom ? "تمت المشاركة في الغرفة" : `مشاركة في ${minimizedRoomName}`}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: TEXT2, letterSpacing: 0.5, marginTop: 4, marginBottom: 4 }]}>إرسال لأشخاص</Text>

        <FlatList
          data={others}
          keyExtractor={(u) => u.id}
          style={{ maxHeight: 260 }}
          ListEmptyComponent={
            <Text style={[styles.emptyComments, { color: TEXT2 }]}>
              لا يوجد مستخدمون لمشاركتهم
            </Text>
          }
          renderItem={({ item }) => {
            const isSent = sent.includes(item.id);
            return (
              <TouchableOpacity style={styles.shareUser} onPress={() => handleShare(item.id)} activeOpacity={isSent ? 1 : 0.7}>
                <View
                  style={[
                    styles.commentAvatar,
                    { backgroundColor: ACCENT_COLORS[item.id.length % ACCENT_COLORS.length] },
                  ]}
                >
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.commentAvatarImg} />
                  ) : (
                    <Text style={styles.commentAvatarText}>{item.name[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.commentUser, { color: TEXT }]}>{item.name}</Text>
                  <Text style={[styles.commentText, { color: TEXT2, fontSize: 12 }]}>
                    @{item.username || item.email}
                  </Text>
                </View>
                {isSent ? (
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                ) : (
                  <Feather name="send" size={16} color="#3D91F4" strokeWidth={1.5} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

// ───── Publish Modal ─────
function PublishModal({
  visible,
  onClose,
  insets,
}: {
  visible: boolean;
  onClose: () => void;
  insets: any;
}) {
  const { addReel } = useApp();
  const { showToast } = useToast();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<ReelFilter>("none");
  const [loading, setLoading] = useState(false);

  const handlePickVideo = async () => {
    if (Platform.OS === "web") {
      showToast("رفع الفيديو غير مدعوم على الويب", "info");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast("يرجى السماح بالوصول للمعرض", "error");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handlePublish = async () => {
    if (!videoUri) {
      showToast("يرجى اختيار مقطع فيديو", "error");
      return;
    }
    setLoading(true);
    addReel(videoUri, title.trim(), filter);
    setLoading(false);
    showToast("تم نشر المقطع بنجاح!", "success");
    setVideoUri(null);
    setTitle("");
    setFilter("none");
    onClose();
  };

  const handleClose = () => {
    setVideoUri(null);
    setTitle("");
    setFilter("none");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.sheetBackdrop} onPress={handleClose} />
      <View
        style={[
          styles.publishSheet,
          {
            backgroundColor: CARD,
            borderColor: BORDER,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: BORDER }]} />
        <Text style={[styles.sheetTitle, { color: TEXT }]}>نشر مقطع جديد</Text>

        <TouchableOpacity
          onPress={handlePickVideo}
          style={[
            styles.videoPickBtn,
            {
              backgroundColor: videoUri ? `${"#3D91F4"}22` : "#1C1C1C",
              borderColor: videoUri ? "#3D91F4" : BORDER,
            },
          ]}
        >
          <Feather
            name={videoUri ? "check-circle" : "film"}
            size={28}
            color={videoUri ? "#3D91F4" : TEXT2}
            strokeWidth={1.5}
          />
          <Text style={[styles.videoPickText, { color: videoUri ? "#3D91F4" : TEXT2 }]}>
            {videoUri ? "تم اختيار المقطع" : "اختر مقطعاً من المعرض"}
          </Text>
        </TouchableOpacity>

        <View
          style={[styles.titleInput, { backgroundColor: "#1C1C1C", borderColor: BORDER }]}
        >
          <TextInput
            style={[styles.titleInputField, { color: TEXT, fontFamily: "Inter_400Regular" }]}
            value={title}
            onChangeText={setTitle}
            placeholder="وصف المقطع..."
            placeholderTextColor={TEXT2}
            textAlign="right"
            multiline
            maxLength={150}
          />
        </View>

        <Text style={[styles.filterLabel, { color: TEXT2 }]}>الفلاتر</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.key ? "#3D91F4" : "#1C1C1C",
                  borderColor: filter === f.key ? "#3D91F4" : BORDER,
                },
              ]}
            >
              <Text
                style={[styles.filterChipText, { color: filter === f.key ? "#fff" : TEXT2 }]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.publishBtns}>
          <TouchableOpacity onPress={handleClose} style={[styles.cancelPub, { borderColor: BORDER }]}>
            <Text style={{ color: TEXT2, fontFamily: "Inter_500Medium" }}>إلغاء</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePublish} disabled={loading} style={{ flex: 1 }}>
            <LinearGradient
              colors={["#7C3AED", "#4F46E5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.publishBtn}
            >
              <Text style={styles.publishBtnText}>{loading ? "..." : "نشر"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ───── Main Reels Screen ─────
export default function ReelsScreen() {
  const {
    reels,
    currentUser,
    likeReel,
    isReelLiked,
    getReelLikesCount,
    getReelComments,
    deleteReel,
    users,
  } = useApp();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { reelId: deepLinkReelId } = useLocalSearchParams<{ reelId?: string }>();
  const flatListRef = useRef<FlatList>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [commentReel, setCommentReel] = useState<string | null>(null);
  const [commentReelOwnerId, setCommentReelOwnerId] = useState<string>("");
  const [shareReel, setShareReel] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [screenFocused, setScreenFocused] = useState(true);

  // Deep link: when navigated here with a reelId param, scroll to that reel
  useEffect(() => {
    if (!deepLinkReelId || reels.length === 0) return;
    const idx = reels.findIndex((r) => r.id === deepLinkReelId);
    if (idx >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: idx, animated: true });
        setActiveIndex(idx);
      }, 300);
    }
  }, [deepLinkReelId, reels]);

  // Stop video when leaving tab
  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => {
        setScreenFocused(false);
      };
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast("تم تحديث الريلز", "success");
    }, 1000);
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });

  const [deleteReelId, setDeleteReelId] = useState<string | null>(null);

  const handleDelete = (reelId: string) => {
    setDeleteReelId(reelId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const getCreator = (creatorId: string) => users.find((u) => u.id === creatorId);

  if (reels.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: BG, paddingTop: insets.top },
        ]}
      >
        <Feather name="film" size={72} color={BORDER} strokeWidth={0.8} />
        <Text style={[styles.emptyTitle, { color: TEXT2 }]}>لا توجد مقاطع بعد</Text>
        <Text style={[styles.emptyDesc, { color: TEXT2 }]}>
          كن أول من ينشر مقطعاً!
        </Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/create-story", params: { mode: "reel" } } as any)}
          style={styles.emptyBtn}
        >
          <Feather name="plus" size={16} color="#fff" strokeWidth={2} />
          <Text style={[styles.emptyBtnText, { color: "#fff" }]}>نشر أول مقطع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <FlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={(r) => r.id}
        showsVerticalScrollIndicator={false}
        snapToInterval={REEL_HEIGHT}
        snapToAlignment="start"
        decelerationRate={0.88}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={(_, index) => ({
          length: REEL_HEIGHT,
          offset: REEL_HEIGHT * index,
          index,
        })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={["#7C3AED"]}
          />
        }
        renderItem={({ item, index }) => {
          const creator = getCreator(item.creatorId);
          return (
            <ReelPlayerItem
              reel={item}
              isActive={index === activeIndex && screenFocused}
              onLike={() => likeReel(item.id)}
              onComment={() => { setCommentReel(item.id); setCommentReelOwnerId(item.creatorId); }}
              onShare={() => setShareReel(item.id)}
              onDelete={() => handleDelete(item.id)}
              isLiked={isReelLiked(item.id)}
              likesCount={getReelLikesCount(item.id)}
              commentsCount={getReelComments(item.id).length}
              isOwner={item.creatorId === currentUser?.id}
              creatorName={creator?.name ?? "مستخدم"}
              creatorAvatar={creator?.avatar}
              isCreatorVerified={isUserVerified(creator)}
              insets={insets}
            />
          );
        }}
      />

      <TouchableOpacity
        style={[
          styles.addBtn,
          { top: insets.top + 12, backgroundColor: "rgba(0,0,0,0.5)" },
        ]}
        onPress={() => router.push({ pathname: "/create-story", params: { mode: "reel" } } as any)}
      >
        <Feather name="plus" size={24} color="#fff" strokeWidth={2} />
      </TouchableOpacity>

      {commentReel && (
        <CommentSheet
          reelId={commentReel}
          reelOwnerId={commentReelOwnerId}
          visible={!!commentReel}
          onClose={() => setCommentReel(null)}
        />
      )}
      {shareReel && (
        <ShareSheet
          reelId={shareReel}
          visible={!!shareReel}
          onClose={() => setShareReel(null)}
        />
      )}
      {/* Reel publishing now handled by the UniversalEditor at /create-story?mode=reel */}

      {/* Custom Dark Delete Reel Modal */}
      <Modal
        visible={!!deleteReelId}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteReelId(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", alignItems: "center", padding: 32 }}
          onPress={() => setDeleteReelId(null)}
        >
          <Pressable
            style={{ backgroundColor: CARD, borderRadius: 24, borderWidth: 1, borderColor: BORDER, padding: 28, width: "100%", alignItems: "center", gap: 14 }}
            onPress={() => {}}
          >
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#FF3B5C22", alignItems: "center", justifyContent: "center" }}>
              <Feather name="trash-2" size={28} color="#FF3B5C" strokeWidth={1.5} />
            </View>
            <Text style={{ color: TEXT, fontFamily: "Inter_700Bold", fontSize: 18 }}>حذف المقطع</Text>
            <Text style={{ color: TEXT2, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" }}>
              هل أنت متأكد من حذف هذا المقطع؟ لا يمكن التراجع عن هذا الإجراء.
            </Text>
            <View style={{ flexDirection: "row", gap: 12, width: "100%", marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => setDeleteReelId(null)}
                style={{ flex: 1, height: 50, borderRadius: 14, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: TEXT2, fontFamily: "Inter_500Medium", fontSize: 15 }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (deleteReelId) {
                    deleteReel(deleteReelId);
                    showToast("تم حذف المقطع", "info");
                  }
                  setDeleteReelId(null);
                }}
                style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: "#FF3B5C", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 }}>حذف</Text>
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
  reelItem: { width: SCREEN_WIDTH, position: "relative", backgroundColor: "#000" },
  reelGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: 260 },
  pauseOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  pauseIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  reelFsBtn: {
    position: "absolute",
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  reelFsCloseBtn: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  reelSeekRow: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reelSeekTime: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    minWidth: 32,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  reelSeekTrack: {
    flex: 1,
    height: 18,
    justifyContent: "center",
  },
  reelSeekFill: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  reelSeekProgress: {
    position: "absolute",
    left: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  reelSeekKnob: {
    position: "absolute",
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    marginLeft: -5,
  },
  reelMeta: { position: "absolute", bottom: 0, left: 16, right: 72, gap: 8 },
  creatorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  creatorAvatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: "#fff",
  },
  creatorAvatarFallback: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  creatorAvatarText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  creatorName: {
    color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  reelTitle: {
    color: "#fff", fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  reelActions: { position: "absolute", right: 12, bottom: 0, alignItems: "center", gap: 20 },
  actionBtn: { alignItems: "center", gap: 4, minWidth: 44, minHeight: 44, justifyContent: "center" },
  actionCount: {
    color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  addBtn: {
    position: "absolute", right: 16,
    width: 42, height: 42, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  commentSheet: {
    height: "65%",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, padding: 16, paddingBottom: 32, gap: 10,
  },
  publishSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, padding: 20, gap: 14,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 4,
  },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyComments: { textAlign: "center", fontFamily: "Inter_400Regular", padding: 24 },
  commentItem: { flexDirection: "row", gap: 10, paddingVertical: 8, paddingHorizontal: 8, alignItems: "flex-start" },
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
  commentAvatar: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  commentStoryRing: { width: 42, height: 42, borderRadius: 15, padding: 3, alignItems: "center", justifyContent: "center" },
  commentAvatarImg: { width: "100%", height: "100%" },
  commentAvatarText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  commentBody: { flex: 1 },
  commentUser: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 2 },
  commentText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  commentInput: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, minHeight: 48, gap: 10,
  },
  commentInputField: { flex: 1, fontSize: 15, maxHeight: 80 },
  sendCommentBtn: { padding: 4 },
  shareUser: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  addToStoryReelBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, borderWidth: 1.5, padding: 12, marginBottom: 8,
  },
  optionsSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 0.5,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 34,
  },
  optionItem: { paddingVertical: 16, paddingHorizontal: 8 },
  optionText: { fontSize: 16, fontFamily: "Inter_500Medium", textAlign: "center" },
  optionCancelBtn: { borderRadius: 16, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  optionCancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  videoPickBtn: {
    borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed",
    padding: 20, alignItems: "center", gap: 10,
  },
  videoPickText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  titleInput: {
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10, minHeight: 52,
  },
  titleInputField: { fontSize: 15, minHeight: 40 },
  filterLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 0.5 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, marginRight: 8,
  },
  filterChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  publishBtns: { flexDirection: "row", gap: 12 },
  cancelPub: {
    flex: 1, height: 50, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  publishBtn: { height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  publishBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  emptyContainer: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32,
  },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16,
  },
  emptyBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
