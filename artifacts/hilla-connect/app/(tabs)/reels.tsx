import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
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

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp, type Reel, type ReelFilter } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

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
  colors,
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
  colors: any;
  insets: any;
}) {
  const [paused, setPaused] = useState(false);

  const player = useVideoPlayer(reel.videoUrl, (p) => {
    p.loop = true;
    if (isActive) p.play();
  });

  React.useEffect(() => {
    if (isActive && !paused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, paused]);

  const overlay = getFilterOverlay(reel.filter);
  const accentColor = ACCENT_COLORS[reel.id.length % ACCENT_COLORS.length];

  const togglePause = () => {
    setPaused((p) => !p);
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
            <Text style={{ fontSize: 40, color: "#fff" }}>▶</Text>
          </View>
        </View>
      )}

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        style={styles.reelGradient}
        pointerEvents="none"
      />

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
        </TouchableOpacity>
        {!!reel.title && (
          <Text style={styles.reelTitle} numberOfLines={2}>
            {reel.title}
          </Text>
        )}
      </View>

      {/* Action buttons - must be on top, so use onPress to stop propagation */}
      <View style={[styles.reelActions, { paddingBottom: insets.bottom + 90 }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
          <Text style={{ fontSize: 30, color: isLiked ? "#FF3B5C" : "#fff" }}>
            {isLiked ? "❤️" : "🤍"}
          </Text>
          <Text style={styles.actionCount}>{likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
          <Text style={{ fontSize: 28, color: "#fff" }}>💬</Text>
          <Text style={styles.actionCount}>{commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
          <Text style={{ fontSize: 28, color: "#fff" }}>📤</Text>
          <Text style={styles.actionCount}>مشاركة</Text>
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
            <Text style={{ fontSize: 24, color: "#FF3B5C" }}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ───── Comment Sheet ─────
function CommentSheet({
  reelId,
  visible,
  onClose,
  colors,
}: {
  reelId: string;
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const { getReelComments, addReelComment } = useApp();
  const [text, setText] = useState("");
  const comments = getReelComments(reelId);

  const handleSend = () => {
    if (!text.trim()) return;
    addReelComment(reelId, text.trim());
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
              لا توجد تعليقات بعد
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <View
                style={[
                  styles.commentAvatar,
                  { backgroundColor: ACCENT_COLORS[item.userId.length % ACCENT_COLORS.length] },
                ]}
              >
                {item.userAvatar ? (
                  <Image source={{ uri: item.userAvatar }} style={styles.commentAvatarImg} />
                ) : (
                  <Text style={styles.commentAvatarText}>{item.userName[0]?.toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.commentBody}>
                <Text style={[styles.commentUser, { color: colors.tint }]}>{item.userName}</Text>
                <Text style={[styles.commentText, { color: colors.text }]}>{item.content}</Text>
              </View>
            </View>
          )}
        />
        <View
          style={[
            styles.commentInput,
            { backgroundColor: colors.inputBackground, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[
              styles.commentInputField,
              { color: colors.text, fontFamily: "Inter_400Regular" },
            ]}
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

// ───── Share Sheet ─────
function ShareSheet({
  reelId,
  visible,
  onClose,
  colors,
}: {
  reelId: string;
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const { users, currentUser, shareReelToConversation } = useApp();
  const { showToast } = useToast();
  const others = users.filter((u) => u.id !== currentUser?.id);

  const handleShare = (userId: string) => {
    shareReelToConversation(reelId, userId);
    showToast("تم مشاركة المقطع", "success");
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
              لا يوجد مستخدمون لمشاركتهم
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.shareUser} onPress={() => handleShare(item.id)}>
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
              <View>
                <Text style={[styles.commentUser, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.commentText, { color: colors.textSecondary, fontSize: 12 }]}>
                  {item.phone}
                </Text>
              </View>
              <Text style={{ marginLeft: "auto" as any, fontSize: 18, color: colors.tint }}>↗</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

// ───── Publish Modal ─────
function PublishModal({
  visible,
  onClose,
  colors,
  insets,
}: {
  visible: boolean;
  onClose: () => void;
  colors: any;
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
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.sheetTitle, { color: colors.text }]}>نشر مقطع جديد</Text>

        <TouchableOpacity
          onPress={handlePickVideo}
          style={[
            styles.videoPickBtn,
            {
              backgroundColor: videoUri ? `${colors.tint}22` : colors.backgroundTertiary,
              borderColor: videoUri ? colors.tint : colors.border,
            },
          ]}
        >
          <Text style={{ fontSize: 28 }}>{videoUri ? "✅" : "🎬"}</Text>
          <Text style={[styles.videoPickText, { color: videoUri ? colors.tint : colors.textSecondary }]}>
            {videoUri ? "تم اختيار المقطع ✓" : "اختر مقطعاً من المعرض"}
          </Text>
        </TouchableOpacity>

        <View
          style={[styles.titleInput, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
        >
          <TextInput
            style={[styles.titleInputField, { color: colors.text, fontFamily: "Inter_400Regular" }]}
            value={title}
            onChangeText={setTitle}
            placeholder="وصف المقطع..."
            placeholderTextColor={colors.textSecondary}
            textAlign="right"
            multiline
            maxLength={150}
          />
        </View>

        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>الفلاتر</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.key ? colors.tint : colors.backgroundTertiary,
                  borderColor: filter === f.key ? colors.tint : colors.border,
                },
              ]}
            >
              <Text
                style={[styles.filterChipText, { color: filter === f.key ? "#fff" : colors.textSecondary }]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.publishBtns}>
          <TouchableOpacity onPress={handleClose} style={[styles.cancelPub, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>إلغاء</Text>
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
    theme,
  } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [activeIndex, setActiveIndex] = useState(0);
  const [commentReel, setCommentReel] = useState<string | null>(null);
  const [shareReel, setShareReel] = useState<string | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [screenFocused, setScreenFocused] = useState(true);

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

  const handleDelete = (reelId: string) => {
    Alert.alert("حذف المقطع", "هل أنت متأكد؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: () => {
          deleteReel(reelId);
          showToast("تم حذف المقطع", "info");
        },
      },
    ]);
  };

  const getCreator = (creatorId: string) => users.find((u) => u.id === creatorId);

  if (reels.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <Text style={{ fontSize: 72 }}>🎬</Text>
        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>لا توجد مقاطع بعد</Text>
        <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
          كن أول من ينشر مقطعاً!
        </Text>
        <TouchableOpacity onPress={() => setShowPublish(true)}>
          <LinearGradient colors={["#7C3AED", "#4F46E5"]} style={styles.emptyBtn}>
            <Text style={[styles.emptyBtnText, { color: "#fff" }]}>+ نشر أول مقطع</Text>
          </LinearGradient>
        </TouchableOpacity>
        <PublishModal
          visible={showPublish}
          onClose={() => setShowPublish(false)}
          colors={colors}
          insets={insets}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <FlatList
        data={reels}
        keyExtractor={(r) => r.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={REEL_HEIGHT}
        decelerationRate="fast"
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
              onComment={() => setCommentReel(item.id)}
              onShare={() => setShareReel(item.id)}
              onDelete={() => handleDelete(item.id)}
              isLiked={isReelLiked(item.id)}
              likesCount={getReelLikesCount(item.id)}
              commentsCount={getReelComments(item.id).length}
              isOwner={item.creatorId === currentUser?.id}
              creatorName={creator?.name ?? "مستخدم"}
              creatorAvatar={creator?.avatar}
              colors={colors}
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
        onPress={() => setShowPublish(true)}
      >
        <Text style={{ fontSize: 26, color: "#fff" }}>+</Text>
      </TouchableOpacity>

      {commentReel && (
        <CommentSheet
          reelId={commentReel}
          visible={!!commentReel}
          onClose={() => setCommentReel(null)}
          colors={colors}
        />
      )}
      {shareReel && (
        <ShareSheet
          reelId={shareReel}
          visible={!!shareReel}
          onClose={() => setShareReel(null)}
          colors={colors}
        />
      )}
      <PublishModal
        visible={showPublish}
        onClose={() => setShowPublish(false)}
        colors={colors}
        insets={insets}
      />
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
  actionBtn: { alignItems: "center", gap: 4 },
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
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, padding: 20, paddingBottom: 32, gap: 12,
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
  commentItem: { flexDirection: "row", gap: 10, paddingVertical: 8, alignItems: "flex-start" },
  commentAvatar: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
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
