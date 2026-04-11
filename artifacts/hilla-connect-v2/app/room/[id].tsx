import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
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
import type { Message, User } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import UserActionsModal from "@/components/UserActionsModal";
import GameEngine from "@/components/games/GameEngine";

const SUPER_ADMIN_PHONE = "07719820537";
const EMOJI_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍", "🔥", "⭐"];

// ─── مكوّن حلقة التحدث ───
function SpeakingRing({ color, speaking }: { color: string; speaking: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!speaking) { pulse.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [speaking]);

  if (!speaking) return null;
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        styles.speakRing,
        { borderColor: color, transform: [{ scale: pulse }] },
      ]}
    />
  );
}

// ─── مكوّن المقعد (دائري أكبر) ───
function SeatCard({
  index, user, isOwner, isSuperAdmin, currentUser, accentColor,
  onPress, onUserPress, onLeaveSeat, onLockSeat, onUnlockSeat,
  colors, t, isMuted, isAdminMuted, isLocked,
}: any) {
  const isMe = user?.id === currentUser?.id;
  const isSuperAdminUser = user?.phone === SUPER_ADMIN_PHONE;
  const userColor = user ? ACCENT_COLORS[user.name.length % ACCENT_COLORS.length] : accentColor;
  const [speaking, setSpeaking] = useState(false);
  const effectiveMuted = isMuted || isAdminMuted;
  const canAdmin = isOwner || isSuperAdmin;

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => { setSpeaking(Math.random() > 0.5); }, 1200);
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <View style={styles.seatWrapper}>
      <TouchableOpacity
        onPress={() => {
          if (isLocked && !canAdmin) { Alert.alert("", t("seatLocked")); return; }
          if (!user) { onPress(index); }
          else if (!isMe) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUserPress(user); }
        }}
        activeOpacity={user && !isMe ? 0.8 : 0.85}
        style={[
          styles.seatCircle,
          {
            backgroundColor: user
              ? isSuperAdminUser ? "#FFD70020" : `${userColor}20`
              : isLocked ? "#1A0A0A" : colors.backgroundTertiary,
            borderColor: user
              ? speaking && !effectiveMuted ? (isSuperAdminUser ? "#FFD700" : userColor) : "transparent"
              : isLocked ? "#FF3B5C44" : colors.border,
            borderWidth: user && speaking && !effectiveMuted ? 2.5 : 1,
          },
        ]}
      >
        {user ? (
          <>
            {!effectiveMuted && (
              <SpeakingRing color={isSuperAdminUser ? "#FFD700" : userColor} speaking={speaking} />
            )}
            {/* Avatar fills the full circle */}
            <View style={styles.seatAvatarFill}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: isSuperAdminUser ? "#FFD700" : `${userColor}55` }]}>
                  <Text style={[styles.seatAvatarText, { color: isSuperAdminUser ? "#000" : userColor, fontSize: 24 }]}>
                    {user.name[0]?.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            {/* Mic badge overlay */}
            <View style={[styles.seatMicBadge, { backgroundColor: effectiveMuted ? "#FF3B5C" : speaking ? (isSuperAdminUser ? "#FFD700" : userColor) : "#1C1C1E" }]}>
              <Ionicons name={effectiveMuted ? "mic-off" : "mic"} size={9} color={effectiveMuted ? "#fff" : isSuperAdminUser && !effectiveMuted ? "#000" : "#fff"} />
            </View>
          </>
        ) : isLocked ? (
          <Ionicons name="lock-closed" size={24} color="#FF3B5C66" />
        ) : (
          <Ionicons name="add" size={26} color={colors.textSecondary} />
        )}
      </TouchableOpacity>

      {/* Label below seat */}
      <Text style={[styles.seatLabelName, { color: user ? colors.text : colors.textSecondary }]} numberOfLines={1}>
        {user
          ? (isSuperAdminUser ? "👑 " : "") + (isMe ? "أنا" : user.name.split(" ")[0])
          : isLocked ? "🔒" : `${index + 1}`}
      </Text>

      {/* Leave seat button for current user */}
      {user && isMe && (
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onLeaveSeat(); }}
          style={[styles.seatActionBtn, { backgroundColor: `${colors.danger}22` }]}
        >
          <Ionicons name="arrow-down-circle-outline" size={11} color={colors.danger} />
          <Text style={[styles.seatActionText, { color: colors.danger }]}>نزول</Text>
        </TouchableOpacity>
      )}

      {/* Unlock button for admins on locked empty seats */}
      {isLocked && canAdmin && !user && (
        <TouchableOpacity
          onPress={() => onUnlockSeat(index)}
          style={[styles.seatActionBtn, { backgroundColor: "#34D39922" }]}
        >
          <Ionicons name="lock-open-outline" size={11} color="#34D399" />
          <Text style={[styles.seatActionText, { color: "#34D399" }]}>فتح</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── قائمة سياق مخصصة مع النمط الداكن ───
function RoomMsgContextSheet({
  visible, isMe, isPinned, isRoomOwner, onClose, onReply, onEdit, onDelete, onPin,
}: {
  visible: boolean; isMe: boolean; isPinned: boolean; isRoomOwner: boolean;
  onClose: () => void; onReply: () => void; onEdit: () => void;
  onDelete: () => void; onPin: () => void;
}) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={roomCtxStyles.backdrop} onPress={onClose} />
      <View style={roomCtxStyles.sheet}>
        <View style={roomCtxStyles.handle} />

        <TouchableOpacity style={roomCtxStyles.item} onPress={() => { onReply(); onClose(); }}>
          <View style={[roomCtxStyles.icon, { backgroundColor: "#3D91F422" }]}>
            <Ionicons name="arrow-undo-outline" size={17} color="#3D91F4" />
          </View>
          <Text style={roomCtxStyles.label}>رد</Text>
        </TouchableOpacity>

        {isMe && (
          <TouchableOpacity style={roomCtxStyles.item} onPress={() => { onEdit(); onClose(); }}>
            <View style={[roomCtxStyles.icon, { backgroundColor: "#10B98122" }]}>
              <Ionicons name="pencil-outline" size={17} color="#10B981" />
            </View>
            <Text style={roomCtxStyles.label}>تعديل</Text>
          </TouchableOpacity>
        )}

        {isRoomOwner && (
          <TouchableOpacity style={roomCtxStyles.item} onPress={() => { onPin(); onClose(); }}>
            <View style={[roomCtxStyles.icon, { backgroundColor: "#F59E0B22" }]}>
              <Ionicons name="pin-outline" size={17} color="#F59E0B" />
            </View>
            <Text style={roomCtxStyles.label}>{isPinned ? "إلغاء التثبيت" : "تثبيت"}</Text>
          </TouchableOpacity>
        )}

        {(isMe || isRoomOwner) && (
          <>
            <View style={roomCtxStyles.sep} />
            <TouchableOpacity style={roomCtxStyles.item} onPress={() => { onDelete(); onClose(); }}>
              <View style={[roomCtxStyles.icon, { backgroundColor: "#EF444422" }]}>
                <Ionicons name="trash-outline" size={17} color="#EF4444" />
              </View>
              <Text style={[roomCtxStyles.label, { color: "#EF4444" }]}>حذف</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const roomCtxStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#121212",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 38, gap: 2,
    borderWidth: 1, borderColor: "#262626",
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.6, shadowRadius: 14, elevation: 14,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#2C2C2E", alignSelf: "center", marginBottom: 14 },
  item: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 4 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#FFFFFF" },
  sep: { height: 1, backgroundColor: "#262626", marginVertical: 4 },
});

// ─── فقاعة الدردشة مع التفاعل والرد والتمرير ───
function ChatBubble({
  msg, isMe, colors, onMediaPress,
  onReply, onReaction, onDelete, onPin, onEdit,
  isRoomOwner, currentUserId, senderAvatar,
}: {
  msg: Message; isMe: boolean; colors: any; onMediaPress: any;
  onReply: (m: Message) => void;
  onReaction: (m: Message) => void;
  onDelete: (m: Message) => void;
  onPin: (m: Message) => void;
  onEdit: (m: Message) => void;
  isRoomOwner: boolean;
  currentUserId: string;
  senderAvatar?: string;
}) {
  const color = ACCENT_COLORS[msg.senderName.length % ACCENT_COLORS.length];
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dx > 8 && Math.abs(gs.dy) < 20,
      onPanResponderMove: (_, gs) => {
        if (gs.dx > 0) translateX.setValue(Math.min(gs.dx, 70));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > 48) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onReply(msg);
        }
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
      },
    })
  ).current;

  const [showCtxSheet, setShowCtxSheet] = useState(false);

  const handleLongPress = () => {
    if (msg.type === "system") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowCtxSheet(true);
  };

  if (msg.type === "system") {
    return (
      <View style={styles.systemMsgWrap}>
        <View style={styles.systemMsgBubble}>
          <Text style={styles.systemMsgText}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;

  return (
    <Animated.View
      style={[
        styles.chatMsg,
        isMe ? styles.chatMsgRight : styles.chatMsgLeft,
        { transform: [{ translateX }] },
      ]}
      {...panResponder.panHandlers}
    >
      {/* بطاقة الرد */}
      {msg.replyToContent && (
        <View style={[styles.replyQuote, isMe ? { alignSelf: "flex-end" } : {}]}>
          <View style={[styles.replyQuoteBar, { backgroundColor: isMe ? "#fff" : "#4F46E5" }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.replyQuoteSender, { color: isMe ? "#fff" : "#4F46E5" }]}>
              {msg.replyToSender}
            </Text>
            <Text style={[styles.replyQuoteText, { color: isMe ? "rgba(255,255,255,0.8)" : colors.textSecondary }]} numberOfLines={1}>
              {msg.replyToContent}
            </Text>
          </View>
        </View>
      )}

      {/* صف الاسم والصورة */}
      {!isMe && (
        <TouchableOpacity
          onPress={() => msg.senderId && router.push(`/profile/${msg.senderId}` as any)}
          activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}
        >
          <View style={[styles.chatSenderAvatar, { backgroundColor: `${color}25` }]}>
            {senderAvatar ? (
              <Image source={{ uri: senderAvatar }} style={styles.chatSenderAvatarImg} />
            ) : (
              <Text style={[styles.chatSenderAvatarText, { color }]}>
                {msg.senderName[0]?.toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={[styles.chatSender, { color }]}>{msg.senderName}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => onReaction(msg)}
        onLongPress={handleLongPress}
        activeOpacity={0.85}
        delayLongPress={400}
      >
        <View
          style={[
            styles.chatBubble,
            { backgroundColor: isMe ? "#4F46E5" : colors.card, borderColor: isMe ? "transparent" : colors.border },
            msg.isPinned && styles.pinnedBubble,
          ]}
        >
          {msg.isPinned && (
            <View style={styles.pinnedBadge}>
              <Ionicons name="pin" size={10} color="#F59E0B" />
              <Text style={styles.pinnedBadgeText}>مثبّت</Text>
            </View>
          )}
          {msg.type === "image" && msg.mediaUrl ? (
            <TouchableOpacity
              onPress={() => onMediaPress(msg.mediaUrl, "image")}
              activeOpacity={0.9}
              style={styles.chatMediaWrap}
            >
              <Image source={{ uri: msg.mediaUrl }} style={styles.chatMediaImg} resizeMode="cover" />
              <View style={styles.chatMediaExpand}>
                <Ionicons name="expand-outline" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          ) : msg.type === "video" && msg.mediaUrl ? (
            <TouchableOpacity
              onPress={() => onMediaPress(msg.mediaUrl, "video")}
              activeOpacity={0.9}
              style={[styles.chatMediaWrap, { backgroundColor: "#000" }]}
            >
              <View style={styles.chatVideoPlay}>
                <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.9)" />
              </View>
              <View style={styles.chatMediaExpand}>
                <Ionicons name="expand-outline" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          ) : null}
          {msg.content ? (
            <Text style={[styles.chatText, { color: isMe ? "#fff" : colors.text }]}>{msg.content}</Text>
          ) : null}
        </View>
      </TouchableOpacity>

      {/* مؤشر التمرير */}
      <Animated.View
        style={[
          styles.swipeHint,
          isMe ? { right: -22 } : { left: -22 },
          { opacity: translateX.interpolate({ inputRange: [0, 48], outputRange: [0, 1] }) },
        ]}
      >
        <Ionicons name="arrow-undo" size={16} color={colors.textSecondary} />
      </Animated.View>

      {/* تفاعلات */}
      {hasReactions && (
        <View style={[styles.reactionsRow, isMe ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}>
          {Object.entries(msg.reactions!).map(([emoji, userIds]) => (
            <View key={emoji} style={styles.reactionChip}>
              <Text style={styles.reactionChipEmoji}>{emoji}</Text>
              {userIds.length > 1 && (
                <Text style={styles.reactionChipCount}>{userIds.length}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* قائمة السياق الداكنة */}
      <RoomMsgContextSheet
        visible={showCtxSheet}
        isMe={isMe}
        isPinned={msg.isPinned ?? false}
        isRoomOwner={isRoomOwner}
        onClose={() => setShowCtxSheet(false)}
        onReply={() => onReply(msg)}
        onEdit={() => onEdit(msg)}
        onDelete={() => onDelete(msg)}
        onPin={() => onPin(msg)}
      />
    </Animated.View>
  );
}

// ─── شريط إيموجي عائم ───
function EmojiBar({
  visible, onSelect, onClose, colors,
}: { visible: boolean; onSelect: (e: string) => void; onClose: () => void; colors: any }) {
  if (!visible) return null;
  return (
    <Pressable style={styles.emojiBarOverlay} onPress={onClose}>
      <View style={[styles.emojiBarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {EMOJI_REACTIONS.map((e) => (
          <TouchableOpacity
            key={e}
            style={styles.emojiBarBtn}
            onPress={() => { onSelect(e); onClose(); }}
          >
            <Text style={styles.emojiBarText}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Pressable>
  );
}

// ─── تأثير التفاعل العائم ───
type FloatingItem = { id: string; emoji: string; x: number; y: Animated.Value; opacity: Animated.Value; scale: Animated.Value };

function FloatingReactions({ reactions }: { reactions: FloatingItem[] }) {
  return (
    <>
      {reactions.map((r) => (
        <Animated.Text
          key={r.id}
          style={{
            position: "absolute",
            bottom: r.y,
            left: r.x,
            fontSize: 30,
            opacity: r.opacity,
            transform: [{ scale: r.scale }],
            zIndex: 999,
            pointerEvents: "none",
          }}
        >
          {r.emoji}
        </Animated.Text>
      ))}
    </>
  );
}

// ─── مودال الصور ───
function MediaFullscreenModal({ visible, uri, type, onClose }: any) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={mStyles.overlay}>
        <TouchableOpacity style={mStyles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
        {type === "image" ? (
          <Image source={{ uri }} style={mStyles.fullImage} resizeMode="contain" />
        ) : (
          <View style={mStyles.videoPlaceholder}>
            <Ionicons name="videocam" size={60} color="rgba(255,255,255,0.5)" />
            <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 12, fontFamily: "Inter_400Regular" }}>
              معاينة الفيديو
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.97)", alignItems: "center", justifyContent: "center" },
  closeBtn: {
    position: "absolute", top: 52, right: 20, width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", zIndex: 10,
  },
  fullImage: { width: "100%", height: "80%" },
  videoPlaceholder: { alignItems: "center", justifyContent: "center" },
});

// ─── الشاشة الرئيسية ───
export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    rooms, currentUser, isSuperAdmin, users,
    joinRoomSeat, leaveRoomSeat, kickFromRoom, banFromRoom, deleteRoom,
    sendRoomMessage, deleteRoomMessage, pinRoomMessage, editRoomMessage, addRoomReaction,
    muteUserInRoom, updateRoomBackground, setRoomAnnouncement,
    lockSeat, unlockSeat, shareRoomToDM, t, theme,
  } = useApp();
  const { showToast } = useToast();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const [message, setMessage] = useState("");
  const [muted, setMuted] = useState(false);
  const [joinModal, setJoinModal] = useState<{ visible: boolean; seatIndex: number }>({ visible: false, seatIndex: -1 });
  const [deleteModal, setDeleteModal] = useState(false);
  const [userActionsTarget, setUserActionsTarget] = useState<User | null>(null);
  const [presenceModal, setPresenceModal] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [mediaModal, setMediaModal] = useState<{ uri: string; type: "image" | "video" } | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<FloatingItem[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAnnouncementEdit, setShowAnnouncementEdit] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showGameEngine, setShowGameEngine] = useState(false);
  const [showLockSeatsModal, setShowLockSeatsModal] = useState(false);
  const [lockSeatsTemp, setLockSeatsTemp] = useState<boolean[]>(Array(8).fill(false));

  // حالات جديدة
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [emojiBarTarget, setEmojiBarTarget] = useState<Message | null>(null);

  const flatRef = useRef<FlatList>(null);
  const topPad = Platform.OS === "web" ? 30 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const room = rooms.find((r) => r.id === id);

  if (!room) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textSecondary }}>الغرفة غير موجودة</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.tint }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const accentColor = ACCENT_COLORS[room.name.length % ACCENT_COLORS.length];
  const isOwner = room.ownerId === currentUser?.id;
  const isInRoom = room.seats.includes(currentUser?.id || "");
  const mutedUsers = room.mutedUsers ?? [];
  const isAdminMutedMe = mutedUsers.includes(currentUser?.id ?? "");
  const ownerUser =
    room.seatUsers?.find((u: any) => u?.id === room.ownerId) ??
    room.seatUsers?.find((u: any) => !!u) ?? null;
  const effectiveMuted = !isInRoom || muted || isAdminMutedMe;
  const isSuperAdminUser = currentUser?.phone === SUPER_ADMIN_PHONE;
  const canAdmin = isOwner || isSuperAdmin;

  const presentMembers = (room.seatUsers ?? []).filter(Boolean) as User[];
  const presenceCount = presentMembers.length;
  const lockedSeats = room.lockedSeats ?? Array(8).fill(false);
  const myFollowing = users.filter((u) => u.id !== currentUser?.id);

  const pinnedMsg = room.chat.find((m) => m.isPinned) ?? null;

  const handleLeaveRoom = () => {
    setMuted(true);
    leaveRoomSeat(room.id);
    showToast("غادرت الغرفة", "info");
    router.back();
  };

  const handleLeaveSeat = () => {
    leaveRoomSeat(room.id);
    setMuted(false);
    showToast("نزلت من المقعد، أنت الآن مستمع", "info");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSeatPress = (index: number) => {
    if (lockedSeats[index]) {
      showToast(t("seatLocked"), "info");
      return;
    }
    setJoinModal({ visible: true, seatIndex: index });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const confirmJoinSeat = () => {
    setMuted(false);
    joinRoomSeat(room.id, joinModal.seatIndex);
    setJoinModal({ visible: false, seatIndex: -1 });
    showToast("انضممت للمقعد! 🎤", "success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSend = () => {
    const text = editingMsg ? message.trim() : message.trim();
    if (!text) return;

    if (editingMsg) {
      editRoomMessage(room.id, editingMsg.id, text);
      setEditingMsg(null);
      setMessage("");
      showToast("تم تعديل الرسالة", "success");
    } else {
      sendRoomMessage(
        room.id, text, "text", undefined,
        replyTo?.id, replyTo?.content, replyTo?.senderName
      );
      setReplyTo(null);
      setMessage("");
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleUserPress = (user: User) => {
    if (user.id === currentUser?.id) return;
    setUserActionsTarget(user);
    setPresenceModal(false);
  };

  const handlePickRoomImage = async () => {
    setShowAttach(false);
    if (Platform.OS === "web") { Alert.alert("", "رفع الصور غير مدعوم على الويب"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      sendRoomMessage(room.id, "", "image", result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePickRoomVideo = async () => {
    setShowAttach(false);
    if (Platform.OS === "web") { Alert.alert("", "رفع الفيديو غير مدعوم على الويب"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false, quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      sendRoomMessage(room.id, "", "video", result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleChangeBackground = async () => {
    setShowAdminPanel(false);
    setShowOptionsMenu(false);
    if (Platform.OS === "web") {
      Alert.alert("", "رفع الخلفية غير مدعوم على الويب");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      updateRoomBackground(room.id, result.assets[0].uri);
      showToast(t("backgroundChanged"), "success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const copyRoomCode = async () => {
    if (!room.roomCode) return;
    await Clipboard.setStringAsync(room.roomCode);
    showToast("تم نسخ كود الغرفة ✅", "success");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveAnnouncement = () => {
    setRoomAnnouncement(room.id, announcementText.trim());
    setShowAnnouncementEdit(false);
    showToast("تم حفظ الإعلان", "success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const triggerFloatingReaction = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const rId = `${Date.now()}-${Math.random()}`;
    const xPos = Math.random() * 200 + 60;
    const yAnim = new Animated.Value(0);
    const opAnim = new Animated.Value(1);
    const scaleAnim = new Animated.Value(0.5);
    const newR: FloatingItem = { id: rId, emoji, x: xPos, y: yAnim, opacity: opAnim, scale: scaleAnim };
    setFloatingReactions((prev) => [...prev, newR]);
    Animated.parallel([
      Animated.timing(yAnim, { toValue: 300, duration: 2000, useNativeDriver: false }),
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: false, friction: 4 }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]),
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(opAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ]),
    ]).start(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== rId));
    });
  };

  const handleEmojiReaction = (emoji: string) => {
    if (!emojiBarTarget) return;
    addRoomReaction(room.id, emojiBarTarget.id, emoji);
    triggerFloatingReaction(emoji);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleReply = (msg: Message) => {
    setReplyTo(msg);
    setEditingMsg(null);
  };

  const handleEdit = (msg: Message) => {
    setEditingMsg(msg);
    setReplyTo(null);
    setMessage(msg.content);
  };

  const handleDelete = (msg: Message) => {
    deleteRoomMessage(room.id, msg.id);
    showToast("تم حذف الرسالة", "info");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePin = (msg: Message) => {
    pinRoomMessage(room.id, msg.id);
    showToast(msg.isPinned ? "تم إلغاء التثبيت" : "تم تثبيت الرسالة 📌", "success");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Image */}
      {room.background && (
        <Image
          source={{ uri: room.background }}
          style={StyleSheet.absoluteFillObject as any}
          resizeMode="cover"
          blurRadius={2}
        />
      )}
      {room.background && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.65)" }]} />
      )}

      {/* Floating Reactions Layer */}
      <View style={styles.reactionsLayer} pointerEvents="none">
        <FloatingReactions reactions={floatingReactions} />
      </View>

      {/* Emoji Reaction Bar */}
      <EmojiBar
        visible={!!emojiBarTarget}
        onSelect={handleEmojiReaction}
        onClose={() => setEmojiBarTarget(null)}
        colors={colors}
      />

      {/* Header */}
      <LinearGradient
        colors={[`${accentColor}25`, "transparent"]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-down" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={[styles.headerAvatar, { backgroundColor: `${accentColor}33` }]}>
            {ownerUser?.avatar ? (
              <Image source={{ uri: ownerUser.avatar }} style={styles.headerAvatarImg} />
            ) : (
              <Text style={[styles.headerAvatarText, { color: accentColor }]}>
                {(ownerUser?.name?.[0] ?? room.ownerName?.[0] ?? "R")?.toUpperCase()}
              </Text>
            )}
          </View>

          <View style={styles.headerInfo}>
            <Text style={[styles.roomTitle, { color: colors.text }]} numberOfLines={1}>{room.name}</Text>
            <Text style={[styles.roomOwner, { color: colors.textSecondary }]}>👤 {room.ownerName}</Text>
            {room.roomCode ? (
              <TouchableOpacity
                onPress={copyRoomCode}
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.roomCodeSubtext}>#{room.roomCode}</Text>
                <Ionicons name="copy-outline" size={9} color={colors.textSecondary} style={{ opacity: 0.45 }} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPresenceModal(true); }}
            style={[styles.presenceBtn, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}44` }]}
          >
            <Ionicons name="eye-outline" size={16} color={accentColor} />
            <Text style={[styles.presenceCount, { color: accentColor }]}>{presenceCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!isInRoom) { showToast("ادخل للمقعد أولاً", "info"); return; }
              setMuted(!muted);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast(muted ? "تم تفعيل الميكروفون" : "تم كتم الميكروفون", "info");
            }}
            style={[
              styles.headerBtn,
              { backgroundColor: effectiveMuted ? `${colors.danger}22` : `${accentColor}22`, borderColor: effectiveMuted ? colors.danger : `${accentColor}55` },
            ]}
          >
            <Ionicons name={effectiveMuted ? "mic-off" : "mic"} size={20} color={effectiveMuted ? colors.danger : accentColor} />
          </TouchableOpacity>

          {/* زر القائمة — ثلاث نقاط */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowOptionsMenu(true);
            }}
            style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {isSuperAdminUser && (
          <View style={{ marginTop: 10 }}>
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.royalBanner}
            >
              <Text style={styles.royalText}>👑 {t("royal")} 👑</Text>
            </LinearGradient>
          </View>
        )}
      </LinearGradient>

      {/* Announcement Card */}
      {room.announcement && room.announcement.trim().length > 0 && (
        <View style={[styles.announcementCard, { borderColor: `${accentColor}55`, backgroundColor: `${accentColor}14` }]}>
          <Ionicons name="megaphone-outline" size={16} color={accentColor} />
          <Text style={[styles.announcementText, { color: colors.text }]} numberOfLines={2}>
            {room.announcement}
          </Text>
          {canAdmin && (
            <TouchableOpacity
              onPress={() => { setAnnouncementText(room.announcement ?? ""); setShowAnnouncementEdit(true); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Seats — 2 rows × 4 cols */}
      <View style={styles.seatsSection}>
        <View style={styles.seatsGrid}>
          {Array(8).fill(null).map((_, i) => (
            <SeatCard
              key={i}
              index={i}
              user={room.seatUsers[i] ?? null}
              isOwner={isOwner}
              isSuperAdmin={isSuperAdmin}
              currentUser={currentUser}
              accentColor={accentColor}
              onPress={handleSeatPress}
              onUserPress={handleUserPress}
              onLeaveSeat={handleLeaveSeat}
              onLockSeat={(idx: number) => {
                lockSeat(room.id, idx);
                showToast("تم قفل المقعد 🔒", "info");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              onUnlockSeat={(idx: number) => {
                unlockSeat(room.id, idx);
                showToast("تم فتح المقعد ✅", "success");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              colors={colors}
              t={t}
              isMuted={room.seatUsers[i]?.id === currentUser?.id ? muted : false}
              isAdminMuted={mutedUsers.includes((room.seatUsers[i] as any)?.id ?? "")}
              isLocked={lockedSeats[i] ?? false}
            />
          ))}
        </View>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView
        style={[styles.chatArea, { borderTopColor: `${colors.border}55` }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Pinned Message Banner */}
        {pinnedMsg && (
          <TouchableOpacity
            style={[styles.pinnedBanner, { backgroundColor: "#F59E0B18", borderColor: "#F59E0B44" }]}
            onPress={() => {
              const idx = [...room.chat].reverse().findIndex((m) => m.id === pinnedMsg.id);
              flatRef.current?.scrollToIndex({ index: idx, animated: true });
            }}
          >
            <Ionicons name="pin" size={14} color="#F59E0B" />
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={[styles.pinnedBannerSender, { color: "#F59E0B" }]}>{pinnedMsg.senderName}</Text>
              <Text style={[styles.pinnedBannerText, { color: colors.text }]} numberOfLines={1}>
                {pinnedMsg.content || "📎 مرفق"}
              </Text>
            </View>
            {canAdmin && (
              <TouchableOpacity
                onPress={() => pinRoomMessage(room.id, pinnedMsg.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}

        <FlatList
          ref={flatRef}
          data={[...room.chat].reverse()}
          keyExtractor={(m) => m.id}
          inverted
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const senderUser =
              (room.seatUsers ?? []).find((u: any) => u?.id === item.senderId) ??
              users.find((u: any) => u.id === item.senderId);
            return (
              <ChatBubble
                msg={item}
                isMe={item.senderId === currentUser?.id}
                colors={colors}
                onMediaPress={(uri: string, type: "image" | "video") => setMediaModal({ uri, type })}
                onReply={handleReply}
                onReaction={(m: Message) => setEmojiBarTarget(m)}
                onDelete={handleDelete}
                onPin={handlePin}
                onEdit={handleEdit}
                isRoomOwner={canAdmin}
                currentUserId={currentUser?.id ?? ""}
                senderAvatar={senderUser?.avatar}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={32} color={colors.border} />
              <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                ابدأ الدردشة
              </Text>
            </View>
          }
        />

        {/* Attachment Menu */}
        {showAttach && (
          <View style={[styles.attachMenu, { backgroundColor: "rgba(0,0,0,0.5)", borderTopColor: `${colors.border}55` }]}>
            <TouchableOpacity
              onPress={handlePickRoomImage}
              style={[styles.attachItem, { backgroundColor: `${accentColor}18` }]}
            >
              <Ionicons name="image-outline" size={22} color={accentColor} />
              <Text style={[styles.attachLabel, { color: accentColor }]}>صورة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickRoomVideo}
              style={[styles.attachItem, { backgroundColor: "#E1306C18" }]}
            >
              <Ionicons name="videocam-outline" size={22} color="#E1306C" />
              <Text style={[styles.attachLabel, { color: "#E1306C" }]}>فيديو</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reply / Edit Preview */}
        {(replyTo || editingMsg) && (
          <View style={[styles.replyPreviewBar, { backgroundColor: colors.backgroundTertiary, borderTopColor: `${accentColor}55` }]}>
            <View style={[styles.replyPreviewAccent, { backgroundColor: accentColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.replyPreviewLabel, { color: accentColor }]}>
                {editingMsg ? "✏️ تعديل" : `↩️ رد على ${replyTo?.senderName}`}
              </Text>
              <Text style={[styles.replyPreviewContent, { color: colors.textSecondary }]} numberOfLines={1}>
                {editingMsg ? editingMsg.content : replyTo?.content || "📎 مرفق"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { setReplyTo(null); setEditingMsg(null); setMessage(""); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            styles.inputRow,
            { paddingBottom: botPad + 8, borderTopColor: `${colors.border}55`, backgroundColor: "rgba(0,0,0,0.45)" },
          ]}
        >
          {/* زر الخروج */}
          <TouchableOpacity onPress={handleLeaveRoom} style={[styles.roundBtn, { backgroundColor: `${colors.danger}22` }]}>
            <Ionicons name="exit-outline" size={20} color={colors.danger} />
          </TouchableOpacity>

          {/* زر المرفقات */}
          <TouchableOpacity
            onPress={() => setShowAttach((v) => !v)}
            style={[styles.roundBtn, { backgroundColor: showAttach ? `${accentColor}22` : colors.backgroundTertiary }]}
          >
            <Ionicons name={showAttach ? "close" : "attach"} size={20} color={showAttach ? accentColor : colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.inputWrap, { backgroundColor: colors.inputBackground, borderColor: editingMsg ? accentColor : colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
              placeholder={editingMsg ? "تعديل الرسالة..." : t("typeMessage")}
              placeholderTextColor={colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              textAlign="right"
            />
          </View>

          {/* نجوم */}
          <TouchableOpacity
            onPress={() => triggerFloatingReaction("⭐")}
            style={[styles.roundBtn, { backgroundColor: "rgba(255,215,0,0.12)" }]}
          >
            <Text style={{ fontSize: 18 }}>⭐</Text>
          </TouchableOpacity>

          {/* قلوب */}
          <TouchableOpacity
            onPress={() => triggerFloatingReaction("❤️")}
            style={[styles.roundBtn, { backgroundColor: "rgba(225,48,108,0.12)" }]}
          >
            <Text style={{ fontSize: 18 }}>❤️</Text>
          </TouchableOpacity>

          {/* إرسال */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim()}
            style={[styles.roundBtn, { backgroundColor: message.trim() ? accentColor : colors.backgroundTertiary }]}
          >
            <Ionicons name={editingMsg ? "checkmark" : "send"} size={18} color={message.trim() ? "#fff" : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* User Actions Modal */}
      <UserActionsModal
        visible={!!userActionsTarget}
        targetUser={userActionsTarget}
        roomId={room.id}
        isRoomOwner={isOwner || isSuperAdmin}
        mutedUsers={mutedUsers}
        onClose={() => setUserActionsTarget(null)}
      />

      {/* Presence List Modal */}
      <Modal
        visible={presenceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPresenceModal(false)}
      >
        <Pressable style={styles.presenceOverlay} onPress={() => setPresenceModal(false)} />
        <View style={[styles.presenceSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.presenceHeader}>
            <Ionicons name="eye" size={18} color={accentColor} />
            <Text style={[styles.presenceTitle, { color: colors.text }]}>{t("roomMembers")}</Text>
            <View style={[styles.presenceBadge, { backgroundColor: `${accentColor}22` }]}>
              <Text style={[styles.presenceBadgeText, { color: accentColor }]}>{presenceCount}</Text>
            </View>
          </View>

          {presentMembers.length === 0 ? (
            <View style={styles.noMembersContainer}>
              <Ionicons name="people-outline" size={40} color={colors.border} />
              <Text style={[styles.noMembersText, { color: colors.textSecondary }]}>{t("noMembers")}</Text>
            </View>
          ) : (
            <FlatList
              data={presentMembers}
              keyExtractor={(u) => u.id}
              contentContainerStyle={styles.membersList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isMe = item.id === currentUser?.id;
                const uColor = ACCENT_COLORS[item.name.length % ACCENT_COLORS.length];
                const isSA = item.phone === SUPER_ADMIN_PHONE;
                const isMutedMember = mutedUsers.includes(item.id);
                return (
                  <TouchableOpacity
                    onPress={() => {
                      if (!isMe) {
                        setPresenceModal(false);
                        router.push(`/profile/${item.id}` as any);
                      }
                    }}
                    activeOpacity={isMe ? 1 : 0.8}
                    style={[styles.memberItem, { borderColor: colors.border }]}
                  >
                    <View style={[styles.memberAvatar, { backgroundColor: isSA ? "#FFD70030" : `${uColor}33` }]}>
                      {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.memberAvatarImg} />
                      ) : (
                        <Text style={[styles.memberAvatarText, { color: isSA ? "#FFD700" : uColor }]}>
                          {item.name[0]?.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {isSA && <Text>👑</Text>}
                        <Text style={[styles.memberName, { color: colors.text }]}>
                          {isMe ? `${item.name} (أنا)` : item.name}
                        </Text>
                        {isMutedMember && (
                          <View style={styles.mutedBadge}>
                            <Ionicons name="mic-off" size={10} color="#fff" />
                          </View>
                        )}
                      </View>
                      {item.id === room.ownerId && (
                        <Text style={[styles.memberRole, { color: accentColor }]}>{t("owner")}</Text>
                      )}
                    </View>
                    {!isMe && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>

      {/* Admin Panel Modal */}
      <Modal
        visible={showAdminPanel}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdminPanel(false)}
      >
        <Pressable style={styles.presenceOverlay} onPress={() => setShowAdminPanel(false)} />
        <View style={[styles.presenceSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.presenceHeader}>
            <Ionicons name="settings" size={18} color="#FFD700" />
            <Text style={[styles.presenceTitle, { color: colors.text }]}>لوحة تحكم الأدمن</Text>
          </View>

          <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 32 }}>
            <TouchableOpacity
              style={[styles.adminPanelBtn, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}44` }]}
              onPress={handleChangeBackground}
            >
              <Ionicons name="image-outline" size={22} color={accentColor} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.adminPanelBtnTitle, { color: colors.text }]}>{t("changeBackground")}</Text>
                <Text style={[styles.adminPanelBtnDesc, { color: colors.textSecondary }]}>
                  اختر صورة من هاتفك كخلفية للغرفة
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {room.background && (
              <TouchableOpacity
                style={[styles.adminPanelBtn, { backgroundColor: "#FF3B5C12", borderColor: "#FF3B5C33" }]}
                onPress={() => {
                  updateRoomBackground(room.id, "");
                  setShowAdminPanel(false);
                  showToast("تم إزالة الخلفية", "info");
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#FF3B5C" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.adminPanelBtnTitle, { color: colors.text }]}>إزالة الخلفية</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.adminPanelBtn, { backgroundColor: "#F59E0B14", borderColor: "#F59E0B44" }]}
              onPress={() => {
                setAnnouncementText(room.announcement ?? "");
                setShowAdminPanel(false);
                setShowAnnouncementEdit(true);
              }}
            >
              <Ionicons name="megaphone-outline" size={22} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.adminPanelBtnTitle, { color: colors.text }]}>{t("editAnnouncement")}</Text>
                <Text style={[styles.adminPanelBtnDesc, { color: colors.textSecondary }]}>
                  {room.announcement ? room.announcement.substring(0, 40) + "..." : "لا يوجد إعلان حالياً"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Announcement Edit Modal */}
      <Modal
        visible={showAnnouncementEdit}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAnnouncementEdit(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAnnouncementEdit(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <View style={[styles.modalIconWrap, { backgroundColor: "#F59E0B18" }]}>
              <Ionicons name="megaphone" size={32} color="#F59E0B" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("editAnnouncement")}</Text>
            <TextInput
              style={[styles.announcementInput, { color: colors.text, backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}
              placeholder={t("announcementPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              value={announcementText}
              onChangeText={setAnnouncementText}
              multiline
              textAlign="right"
              maxLength={200}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {announcementText.length}/200
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setShowAnnouncementEdit(false)}
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 15 }}>
                  {t("cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveAnnouncement} style={{ flex: 1 }}>
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.modalConfirmBtn}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.modalConfirmText}>{t("save")}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Share Room Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <Pressable style={styles.presenceOverlay} onPress={() => setShowShareModal(false)} />
        <View style={[styles.presenceSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.presenceHeader}>
            <Ionicons name="share-social" size={18} color={accentColor} />
            <Text style={[styles.presenceTitle, { color: colors.text }]}>{t("shareRoom")}</Text>
          </View>

          <View style={[styles.roomPoster, { backgroundColor: `${accentColor}14`, borderColor: `${accentColor}44` }]}>
            <View style={[styles.roomPosterAvatar, { backgroundColor: `${accentColor}33` }]}>
              <Text style={{ fontSize: 28 }}>🎙️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.roomPosterName, { color: colors.text }]}>{room.name}</Text>
              <Text style={[styles.roomPosterOwner, { color: colors.textSecondary }]}>
                بواسطة {room.ownerName}
              </Text>
              <View style={[styles.roomPosterCode, { backgroundColor: `${accentColor}22` }]}>
                <Text style={[{ color: accentColor, fontFamily: "Inter_700Bold", fontSize: 14 }]}>
                  #{room.roomCode}
                </Text>
              </View>
            </View>
          </View>

          <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 14, paddingHorizontal: 16, marginBottom: 8 }]}>
            {t("selectFriend")}
          </Text>

          {myFollowing.length === 0 ? (
            <View style={styles.noMembersContainer}>
              <Ionicons name="people-outline" size={40} color={colors.border} />
              <Text style={[styles.noMembersText, { color: colors.textSecondary }]}>لا يوجد أصدقاء</Text>
            </View>
          ) : (
            <FlatList
              data={myFollowing}
              keyExtractor={(u) => u.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const uColor = ACCENT_COLORS[item.name.length % ACCENT_COLORS.length];
                return (
                  <TouchableOpacity
                    style={[styles.memberItem, { borderColor: colors.border }]}
                    onPress={() => {
                      shareRoomToDM(room.id, item.id);
                      setShowShareModal(false);
                      showToast(`${t("inviteSent")} إلى ${item.name} ✅`, "success");
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.memberAvatar, { backgroundColor: `${uColor}33` }]}>
                      {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.memberAvatarImg} />
                      ) : (
                        <Text style={[styles.memberAvatarText, { color: uColor }]}>
                          {item.name[0]?.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.memberRole, { color: colors.textSecondary }]}>{item.phone}</Text>
                    </View>
                    <View style={[styles.sendInviteBtn, { backgroundColor: accentColor }]}>
                      <Ionicons name="send" size={14} color="#fff" />
                      <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>دعوة</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <Pressable style={styles.presenceOverlay} onPress={() => setShowOptionsMenu(false)} />
        <View style={[styles.optionsSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sheetHandle} />

          {/* الألعاب */}
          <TouchableOpacity
            style={[styles.optionsItem, { borderBottomColor: colors.border }]}
            onPress={() => {
              setShowOptionsMenu(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowGameEngine(true);
            }}
          >
            <View style={[styles.optionsIconWrap, { backgroundColor: "#6A1B9A18" }]}>
              <Text style={{ fontSize: 20 }}>🎮</Text>
            </View>
            <Text style={[styles.optionsLabel, { color: colors.text }]}>الألعاب</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* مشاركة الغرفة */}
          <TouchableOpacity
            style={[styles.optionsItem, { borderBottomColor: colors.border }]}
            onPress={() => { setShowOptionsMenu(false); setShowShareModal(true); }}
          >
            <View style={[styles.optionsIconWrap, { backgroundColor: `${accentColor}18` }]}>
              <Ionicons name="share-social-outline" size={20} color={accentColor} />
            </View>
            <Text style={[styles.optionsLabel, { color: colors.text }]}>مشاركة الغرفة</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* تغيير الخلفية */}
          {canAdmin && (
            <TouchableOpacity
              style={[styles.optionsItem, { borderBottomColor: colors.border }]}
              onPress={() => { setShowOptionsMenu(false); handleChangeBackground(); }}
            >
              <View style={[styles.optionsIconWrap, { backgroundColor: "#6366F118" }]}>
                <Ionicons name="image-outline" size={20} color="#6366F1" />
              </View>
              <Text style={[styles.optionsLabel, { color: colors.text }]}>تغيير الخلفية</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* تعديل الإعلان */}
          {canAdmin && (
            <TouchableOpacity
              style={[styles.optionsItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setAnnouncementText(room.announcement ?? "");
                setShowOptionsMenu(false);
                setShowAnnouncementEdit(true);
              }}
            >
              <View style={[styles.optionsIconWrap, { backgroundColor: "#F59E0B18" }]}>
                <Ionicons name="megaphone-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={[styles.optionsLabel, { color: colors.text }]}>تعديل الإعلان</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* قفل المقاعد */}
          {canAdmin && (
            <TouchableOpacity
              style={[styles.optionsItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setLockSeatsTemp([...lockedSeats]);
                setShowOptionsMenu(false);
                setShowLockSeatsModal(true);
              }}
            >
              <View style={[styles.optionsIconWrap, { backgroundColor: "#FF3B5C18" }]}>
                <Ionicons name="lock-closed-outline" size={20} color="#FF3B5C" />
              </View>
              <Text style={[styles.optionsLabel, { color: colors.text }]}>قفل المقاعد</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* حذف الغرفة */}
          {(isOwner || isSuperAdmin) && (
            <TouchableOpacity
              style={[styles.optionsItem, { borderBottomColor: "transparent" }]}
              onPress={() => { setShowOptionsMenu(false); setDeleteModal(true); }}
            >
              <View style={[styles.optionsIconWrap, { backgroundColor: `${colors.danger}18` }]}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </View>
              <Text style={[styles.optionsLabel, { color: colors.danger }]}>حذف الغرفة</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {/* Delete Room Confirmation Modal */}
      <Modal visible={deleteModal} transparent animationType="fade" onRequestClose={() => setDeleteModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setDeleteModal(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <View style={[styles.modalIconWrap, { backgroundColor: `${colors.danger}18` }]}>
              <Ionicons name="trash-outline" size={32} color={colors.danger} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>حذف الغرفة</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              هل أنت متأكد من حذف غرفة "{room.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setDeleteModal(false)}
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 15 }}>
                  {t("cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setDeleteModal(false);
                  deleteRoom(room.id);
                  showToast("تم حذف الغرفة", "success");
                  router.back();
                }}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={[colors.danger, "#c0392b"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.modalConfirmBtn}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.modalConfirmText}>حذف</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Lock Seats Modal */}
      <Modal
        visible={showLockSeatsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLockSeatsModal(false)}
      >
        <Pressable style={styles.presenceOverlay} onPress={() => setShowLockSeatsModal(false)} />
        <View style={[styles.presenceSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.presenceHeader}>
            <Ionicons name="lock-closed" size={18} color="#FF3B5C" />
            <Text style={[styles.presenceTitle, { color: colors.text }]}>قفل المقاعد</Text>
          </View>
          <Text style={{ paddingHorizontal: 20, color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 14 }}>
            اضغط على المقعد لتبديل حالة القفل
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 20, paddingBottom: 16 }}>
            {Array(8).fill(null).map((_, i) => {
              const isLk = lockSeatsTemp[i] ?? false;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    const next = [...lockSeatsTemp];
                    next[i] = !next[i];
                    setLockSeatsTemp(next);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    width: 70, height: 70, borderRadius: 16,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: isLk ? "#FF3B5C22" : `${accentColor}18`,
                    borderWidth: 2, borderColor: isLk ? "#FF3B5C" : `${accentColor}55`,
                    gap: 4,
                  }}
                >
                  <Ionicons
                    name={isLk ? "lock-closed" : "lock-open-outline"}
                    size={22}
                    color={isLk ? "#FF3B5C" : accentColor}
                  />
                  <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: isLk ? "#FF3B5C" : accentColor }}>
                    {i + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 32 }}>
            <TouchableOpacity
              onPress={() => setShowLockSeatsModal(false)}
              style={[styles.modalCancelBtn, { flex: 1, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 15 }}>
                {t("cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                lockSeatsTemp.forEach((shouldLock, idx) => {
                  if (shouldLock && !(lockedSeats[idx] ?? false)) {
                    lockSeat(room.id, idx);
                  } else if (!shouldLock && (lockedSeats[idx] ?? false)) {
                    unlockSeat(room.id, idx);
                  }
                });
                setShowLockSeatsModal(false);
                showToast("تم تحديث حالة المقاعد 🔒", "success");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={["#FF3B5C", "#c0392b"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.modalConfirmBtn}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.modalConfirmText}>تطبيق</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join Seat Confirmation Modal */}
      <Modal
        visible={joinModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setJoinModal({ visible: false, seatIndex: -1 })}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setJoinModal({ visible: false, seatIndex: -1 })}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <View style={[styles.modalIconWrap, { backgroundColor: `${accentColor}22` }]}>
              <Ionicons name="mic" size={32} color={accentColor} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>هل تريد الصعود للميكروفون؟</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              المقعد NO.{joinModal.seatIndex + 1} — ستصبح متحدثاً ويمكنك النزول في أي وقت.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setJoinModal({ visible: false, seatIndex: -1 })}
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 15 }}>
                  {t("cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmJoinSeat} style={{ flex: 1 }}>
                <LinearGradient
                  colors={[accentColor, accentColor + "cc"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.modalConfirmBtn}
                >
                  <Ionicons name="mic" size={18} color="#fff" />
                  <Text style={styles.modalConfirmText}>صعود للمنصة</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Media Fullscreen Modal */}
      {mediaModal && (
        <MediaFullscreenModal
          visible={!!mediaModal}
          uri={mediaModal.uri}
          type={mediaModal.type}
          onClose={() => setMediaModal(null)}
        />
      )}

      {/* 🎮 Game Engine Overlay */}
      <GameEngine
        visible={showGameEngine}
        onClose={() => setShowGameEngine(false)}
        roomId={room.id}
        currentUserId={currentUser?.id ?? ""}
        isOwner={isOwner || isSuperAdmin}
        seatedUsers={(room.seatUsers ?? []).filter(Boolean).map((u: any) => ({
          id: u.id, name: u.name, avatar: u.avatar,
        }))}
      />
    </View>
  );
}

const SEAT_SIZE = 78;

const styles = StyleSheet.create({
  container: { flex: 1 },
  reactionsLayer: {
    position: "absolute", left: 0, right: 0, bottom: 0, top: 0,
    zIndex: 998,
  },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "nowrap" },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  headerAvatarImg: { width: "100%", height: "100%", borderRadius: 12, resizeMode: "cover" },
  headerAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  headerInfo: { flex: 1, minWidth: 0 },
  roomTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  roomOwner: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  roomCodeSubtext: { fontSize: 9, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.3)", letterSpacing: 0.5 },
  presenceBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
  },
  presenceCount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  royalBanner: { borderRadius: 14, paddingVertical: 8, paddingHorizontal: 16, alignItems: "center" },
  royalText: { color: "#000", fontFamily: "Inter_700Bold", fontSize: 14, letterSpacing: 1 },
  announcementCard: {
    marginHorizontal: 16, marginBottom: 8, borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10,
  },
  announcementText: {
    flex: 1, fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 18, textAlign: "right",
  },

  // Seats — simplified: circular avatar only + mic badge
  seatsSection: { paddingHorizontal: 8, paddingBottom: 4 },
  seatsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "space-evenly", gap: 10,
  },
  seatWrapper: {
    width: SEAT_SIZE, alignItems: "center", gap: 4,
  },
  seatCircle: {
    width: SEAT_SIZE, height: SEAT_SIZE, borderRadius: SEAT_SIZE / 2,
    overflow: "visible", position: "relative",
    alignItems: "center", justifyContent: "center",
  },
  speakRing: {
    borderRadius: SEAT_SIZE / 2 + 4, borderWidth: 2.5, position: "absolute",
    top: -4, left: -4, right: -4, bottom: -4,
  },
  seatAvatarFill: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: SEAT_SIZE / 2, overflow: "hidden", backgroundColor: "#2C2C2E",
  },
  seatAvatarText: { fontFamily: "Inter_700Bold" },
  seatMicBadge: {
    position: "absolute", bottom: 2, right: 2,
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#000",
  },
  seatLabelName: {
    fontSize: 9, fontFamily: "Inter_600SemiBold",
    textAlign: "center", maxWidth: SEAT_SIZE,
  },
  seatActionBtn: {
    flexDirection: "row", alignItems: "center", gap: 2,
    borderRadius: 7, paddingHorizontal: 5, paddingVertical: 3,
  },
  seatActionText: { fontSize: 8, fontFamily: "Inter_600SemiBold" },

  // Chat
  chatArea: { flex: 1, borderTopWidth: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  chatList: { padding: 12, gap: 8 },
  chatMsg: { maxWidth: "82%" },
  chatMsgLeft: { alignSelf: "flex-start", alignItems: "flex-start" },
  chatMsgRight: { alignSelf: "flex-end", alignItems: "flex-end" },
  chatSender: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  chatSenderAvatar: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  chatSenderAvatarImg: { width: "100%", height: "100%" },
  chatSenderAvatarText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  chatBubble: { borderRadius: 16, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12 },
  chatText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  chatMediaWrap: {
    width: 160, height: 160, borderRadius: 12,
    overflow: "hidden", marginBottom: 4, backgroundColor: "#111",
    alignItems: "center", justifyContent: "center",
  },
  chatMediaImg: { width: "100%", height: "100%" },
  chatVideoPlay: { alignItems: "center", justifyContent: "center" },
  chatMediaExpand: {
    position: "absolute", bottom: 6, right: 6,
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
  systemMsgWrap: { alignItems: "center", paddingVertical: 2 },
  systemMsgBubble: {
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  systemMsgText: { color: "#aaa", fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" },
  emptyChat: { alignItems: "center", paddingVertical: 24, gap: 8 },

  // Pinned banner in chat
  pinnedBanner: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 7,
    borderBottomWidth: 1,
  },
  pinnedBannerSender: { fontSize: 10, fontFamily: "Inter_700Bold" },
  pinnedBannerText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  // Pinned bubble styling
  pinnedBubble: { borderLeftWidth: 3, borderLeftColor: "#F59E0B" },
  pinnedBadge: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 4 },
  pinnedBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#F59E0B" },

  // Swipe hint
  swipeHint: { position: "absolute", top: "50%", marginTop: -8, zIndex: 1 },

  // Reactions row
  reactionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 3, paddingHorizontal: 4 },
  reactionChip: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  reactionChipEmoji: { fontSize: 13 },
  reactionChipCount: { fontSize: 11, color: "#fff", fontFamily: "Inter_600SemiBold" },

  // Reply quote (inside bubble)
  replyQuote: {
    flexDirection: "row", alignItems: "stretch",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 8, overflow: "hidden",
    marginBottom: 4, maxWidth: "100%",
  },
  replyQuoteBar: { width: 3, borderRadius: 3 },
  replyQuoteSender: { fontSize: 10, fontFamily: "Inter_700Bold", paddingHorizontal: 6, paddingTop: 4 },
  replyQuoteText: { fontSize: 11, fontFamily: "Inter_400Regular", paddingHorizontal: 6, paddingBottom: 4 },

  // Emoji bar overlay
  emojiBarOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  emojiBarContainer: {
    flexDirection: "row", borderRadius: 24, borderWidth: 1,
    paddingVertical: 10, paddingHorizontal: 8, gap: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    elevation: 10,
  },
  emojiBarBtn: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21 },
  emojiBarText: { fontSize: 24 },

  // Reply preview bar above input
  replyPreviewBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, gap: 8,
  },
  replyPreviewAccent: { width: 3, height: 32, borderRadius: 2 },
  replyPreviewLabel: { fontSize: 11, fontFamily: "Inter_700Bold" },
  replyPreviewContent: { fontSize: 12, fontFamily: "Inter_400Regular" },

  // Input row
  attachMenu: { flexDirection: "row", gap: 12, padding: 12, borderTopWidth: 1 },
  attachItem: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, height: 44, borderRadius: 12,
  },
  attachLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    gap: 6, paddingHorizontal: 10, paddingTop: 10, borderTopWidth: 1,
  },
  roundBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  inputWrap: {
    flex: 1, borderRadius: 22, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  input: { fontSize: 14, fontFamily: "Inter_400Regular" },

  // Presence / Sheet / Modal
  presenceOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  presenceSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, paddingTop: 12, maxHeight: "72%",
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#ccc", alignSelf: "center", marginBottom: 12,
  },
  presenceHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  presenceTitle: { fontSize: 18, fontFamily: "Inter_700Bold", flex: 1 },
  presenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  presenceBadgeText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  noMembersContainer: { alignItems: "center", paddingVertical: 40, gap: 12 },
  noMembersText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  membersList: { paddingHorizontal: 16, paddingBottom: 32, gap: 4 },
  memberItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1,
  },
  memberAvatar: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  memberAvatarImg: { width: "100%", height: "100%", borderRadius: 14 },
  memberAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  memberName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  memberRole: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  mutedBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#E1306C", alignItems: "center", justifyContent: "center",
  },
  adminPanelBtn: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 14,
  },
  adminPanelBtnTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  adminPanelBtnDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  roomPoster: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, borderWidth: 1, padding: 14,
  },
  roomPosterAvatar: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  roomPosterName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  roomPosterOwner: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  roomPosterCode: {
    alignSelf: "flex-start", marginTop: 6,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
  },
  sendInviteBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  optionsSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, paddingTop: 12, paddingBottom: 32,
  },
  optionsItem: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  optionsIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  optionsLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  modalCard: {
    width: "100%", maxWidth: 340,
    borderRadius: 24, borderWidth: 1,
    padding: 24, alignItems: "center", gap: 12,
  },
  modalIconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  modalDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  modalBtns: { flexDirection: "row", gap: 12, width: "100%", marginTop: 4 },
  modalCancelBtn: {
    flex: 1, height: 50, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  modalConfirmBtn: {
    height: 50, borderRadius: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  modalConfirmText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
  announcementInput: {
    width: "100%", borderRadius: 14, borderWidth: 1,
    padding: 12, fontSize: 14, fontFamily: "Inter_400Regular",
    minHeight: 80, textAlignVertical: "top",
  },
  charCount: { fontSize: 12, fontFamily: "Inter_400Regular", alignSelf: "flex-end" },
});
