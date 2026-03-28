import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import type { User } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import UserActionsModal from "@/components/UserActionsModal";

const SUPER_ADMIN_PHONE = "07719820537";

function SpeakingRing({ color, speaking }: { color: string; speaking: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!speaking) {
      pulse.setValue(1);
      return;
    }
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

function SeatCard({
  index,
  user,
  isOwner,
  isSuperAdmin,
  currentUser,
  accentColor,
  onPress,
  onUserPress,
  colors,
  t,
  isMuted,
}: any) {
  const isMe = user?.id === currentUser?.id;
  const isSuperAdminUser = user?.phone === SUPER_ADMIN_PHONE;
  const userColor = user
    ? ACCENT_COLORS[user.name.length % ACCENT_COLORS.length]
    : accentColor;
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setSpeaking(Math.random() > 0.5);
    }, 1200);
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <TouchableOpacity
      onPress={() => {
        if (!user) {
          onPress(index);
        } else if (!isMe) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onUserPress(user);
        }
      }}
      activeOpacity={user && !isMe ? 0.8 : user ? 1 : 0.8}
      style={[
        styles.seat,
        {
          backgroundColor: user
            ? isSuperAdminUser
              ? "#FFD70014"
              : `${userColor}18`
            : colors.backgroundTertiary,
          borderColor: user
            ? isSuperAdminUser
              ? "#FFD700"
              : speaking
              ? userColor
              : `${userColor}55`
            : colors.border,
          borderWidth: isSuperAdminUser ? 2 : 1.5,
        },
      ]}
    >
      <View style={styles.seatInner}>
        {user && (
          <View style={styles.avatarRingWrap}>
            {!isMuted && (
              <SpeakingRing
                color={isSuperAdminUser ? "#FFD700" : userColor}
                speaking={speaking}
              />
            )}
            <View
              style={[
                styles.seatAvatarLg,
                { backgroundColor: isSuperAdminUser ? "#FFD700" : `${userColor}40` },
              ]}
            >
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.seatAvatarImg} />
              ) : (
                <Text style={[styles.seatAvatarText, { color: isSuperAdminUser ? "#000" : userColor }]}>
                  {user.name[0]?.toUpperCase()}
                </Text>
              )}
            </View>
          </View>
        )}

        {user ? (
          <>
            <View style={styles.seatNameRow}>
              {isSuperAdminUser && <Text style={{ fontSize: 10 }}>👑</Text>}
              <Text style={[styles.seatName, { color: colors.text }]} numberOfLines={1}>
                {isMe ? "أنا" : user.name.split(" ")[0]}
              </Text>
            </View>
            <View style={[styles.micIndicator, { backgroundColor: speaking && !isMuted ? `${userColor}33` : "transparent" }]}>
              <Ionicons
                name={speaking && !isMuted ? "mic" : "mic-outline"}
                size={12}
                color={speaking && !isMuted ? userColor : colors.textSecondary}
              />
            </View>
            {!isMe && (
              <View style={[styles.tapHint, { backgroundColor: `${userColor}22` }]}>
                <Ionicons name="ellipsis-horizontal" size={10} color={userColor} />
              </View>
            )}
          </>
        ) : (
          <>
            <View style={[styles.emptyAvatarCircle, { borderColor: colors.border }]}>
              <Ionicons name="add" size={22} color={colors.textSecondary} />
            </View>
            <Text style={[styles.seatEmptyLabel, { color: colors.textSecondary }]}>
              {t("seat")} {index + 1}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

function ChatBubble({ msg, isMe, colors }: any) {
  const color = ACCENT_COLORS[msg.senderName.length % ACCENT_COLORS.length];
  return (
    <View style={[styles.chatMsg, isMe ? styles.chatMsgRight : styles.chatMsgLeft]}>
      {!isMe && (
        <Text style={[styles.chatSender, { color }]}>{msg.senderName}</Text>
      )}
      <View
        style={[
          styles.chatBubble,
          {
            backgroundColor: isMe ? "#4F46E5" : colors.card,
            borderColor: isMe ? "transparent" : colors.border,
          },
        ]}
      >
        <Text style={[styles.chatText, { color: isMe ? "#fff" : colors.text }]}>
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    rooms,
    currentUser,
    isSuperAdmin,
    joinRoomSeat,
    leaveRoomSeat,
    kickFromRoom,
    banFromRoom,
    deleteRoom,
    sendRoomMessage,
    t,
    theme,
  } = useApp();
  const { showToast } = useToast();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [muted, setMuted] = useState(false);
  const [joinModal, setJoinModal] = useState<{ visible: boolean; seatIndex: number }>({
    visible: false,
    seatIndex: -1,
  });
  const [deleteModal, setDeleteModal] = useState(false);
  const [userActionsTarget, setUserActionsTarget] = useState<User | null>(null);
  const [presenceModal, setPresenceModal] = useState(false);
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
  const ownerUser =
    room.seatUsers?.find((u: any) => u?.id === room.ownerId) ??
    room.seatUsers?.find((u: any) => !!u) ??
    null;
  const effectiveMuted = !isInRoom || muted;
  const isSuperAdminUser = currentUser?.phone === SUPER_ADMIN_PHONE;

  const presentMembers = (room.seatUsers ?? []).filter(Boolean) as User[];
  const presenceCount = presentMembers.length;

  const handleLeave = () => {
    setMuted(true);
    leaveRoomSeat(room.id);
    showToast("غادرت الغرفة", "info");
    router.back();
  };

  const handleSeatPress = (index: number) => {
    setJoinModal({ visible: true, seatIndex: index });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const confirmJoinSeat = () => {
    setMuted(false);
    joinRoomSeat(room.id, joinModal.seatIndex);
    setJoinModal({ visible: false, seatIndex: -1 });
    showToast("انضممت للمقعد!", "success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    sendRoomMessage(room.id, message.trim());
    setMessage("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleUserPress = (user: User) => {
    if (user.id === currentUser?.id) return;
    setUserActionsTarget(user);
    setPresenceModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <Text style={[styles.roomTitle, { color: colors.text }]} numberOfLines={1}>
              {room.name}
            </Text>
            <Text style={[styles.roomOwner, { color: colors.textSecondary }]}>
              👤 {room.ownerName}
            </Text>
          </View>

          {/* Presence counter */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPresenceModal(true);
            }}
            style={[styles.presenceBtn, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}44` }]}
          >
            <Ionicons name="eye-outline" size={16} color={accentColor} />
            <Text style={[styles.presenceCount, { color: accentColor }]}>{presenceCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!isInRoom) {
                showToast("ادخل للمقعد أولاً", "info");
                return;
              }
              setMuted(!muted);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast(muted ? "تم تفعيل الميكروفون" : "تم كتم الميكروفون", "info");
            }}
            style={[
              styles.headerBtn,
              { backgroundColor: effectiveMuted ? `${colors.danger}22` : `${accentColor}22`, borderColor: effectiveMuted ? colors.danger : `${accentColor}55` },
            ]}
          >
            <Ionicons
              name={effectiveMuted ? "mic-off" : "mic"}
              size={20}
              color={effectiveMuted ? colors.danger : accentColor}
            />
          </TouchableOpacity>

          {(isOwner || isSuperAdmin) && (
            <TouchableOpacity
              onPress={() => setDeleteModal(true)}
              style={[styles.headerBtn, { backgroundColor: `${colors.danger}22`, borderColor: `${colors.danger}44` }]}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          )}
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

      {/* Seats — 2×3 grid */}
      <View style={styles.seatsSection}>
        <View style={styles.seatsGrid}>
          {Array(6).fill(null).map((_, i) => (
            <SeatCard
              key={i}
              index={i}
              user={room.seatUsers[i]}
              isOwner={isOwner}
              isSuperAdmin={isSuperAdmin}
              currentUser={currentUser}
              accentColor={accentColor}
              onPress={handleSeatPress}
              onUserPress={handleUserPress}
              colors={colors}
              t={t}
              isMuted={effectiveMuted}
            />
          ))}
        </View>
      </View>

      {/* Chat */}
      <View style={[styles.chatArea, { backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border }]}>
        <FlatList
          ref={flatRef}
          data={[...room.chat].reverse()}
          keyExtractor={(m) => m.id}
          inverted
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ChatBubble
              msg={item}
              isMe={item.senderId === currentUser?.id}
              colors={colors}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={32} color={colors.border} />
              <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }]}>
                ابدأ الدردشة
              </Text>
            </View>
          }
        />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View
            style={[
              styles.inputRow,
              {
                paddingBottom: botPad + 8,
                borderTopColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
              },
            ]}
          >
            <TouchableOpacity onPress={handleLeave} style={[styles.roundBtn, { backgroundColor: `${colors.danger}22` }]}>
              <Ionicons name="exit-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
            <View style={[styles.inputWrap, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                placeholder={t("typeMessage")}
                placeholderTextColor={colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                textAlign="right"
              />
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!message.trim()}
              style={[styles.roundBtn, { backgroundColor: message.trim() ? accentColor : colors.backgroundTertiary }]}
            >
              <Ionicons name="send" size={18} color={message.trim() ? "#fff" : colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* User Actions Modal */}
      <UserActionsModal
        visible={!!userActionsTarget}
        targetUser={userActionsTarget}
        roomId={room.id}
        isRoomOwner={isOwner || isSuperAdmin}
        onClose={() => setUserActionsTarget(null)}
      />

      {/* Presence List Modal */}
      <Modal
        visible={presenceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPresenceModal(false)}
      >
        <Pressable
          style={styles.presenceOverlay}
          onPress={() => setPresenceModal(false)}
        />
        <View style={[styles.presenceSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.presenceHeader}>
            <Ionicons name="eye" size={18} color={accentColor} />
            <Text style={[styles.presenceTitle, { color: colors.text }]}>
              {t("roomMembers")}
            </Text>
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
                return (
                  <TouchableOpacity
                    onPress={() => {
                      if (!isMe) handleUserPress(item);
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
                      </View>
                      {item.id === room.ownerId && (
                        <Text style={[styles.memberRole, { color: accentColor }]}>{t("owner")}</Text>
                      )}
                    </View>
                    {!isMe && (
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              تأكيد الصعود للمنصة
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              هل تريد الجلوس في المقعد رقم {joinModal.seatIndex + 1}؟
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setJoinModal({ visible: false, seatIndex: -1 })}
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 15 }]}>
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
                  <Text style={styles.modalConfirmText}>انضم</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const SEAT_SIZE = 100;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerBtn: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  headerAvatarImg: { width: "100%", height: "100%", borderRadius: 14, resizeMode: "cover" },
  headerAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  headerInfo: { flex: 1 },
  roomTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  roomOwner: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  presenceBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1,
  },
  presenceCount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  royalBanner: {
    borderRadius: 14, paddingVertical: 8, paddingHorizontal: 16, alignItems: "center",
  },
  royalText: { color: "#000", fontFamily: "Inter_700Bold", fontSize: 14, letterSpacing: 1 },
  seatsSection: { padding: 16 },
  seatsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  seat: {
    width: SEAT_SIZE, height: SEAT_SIZE + 20,
    borderRadius: 22, overflow: "visible", position: "relative",
  },
  seatInner: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, padding: 8 },
  avatarRingWrap: {
    position: "relative", width: 54, height: 54,
    alignItems: "center", justifyContent: "center",
  },
  speakRing: {
    borderRadius: 30, borderWidth: 2.5, position: "absolute",
    top: -4, left: -4, right: -4, bottom: -4,
  },
  seatAvatarLg: {
    width: 54, height: 54, borderRadius: 18,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  seatAvatarImg: { width: "100%", height: "100%", borderRadius: 18 },
  seatAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  seatNameRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  seatName: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  micIndicator: {
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
    flexDirection: "row", alignItems: "center", gap: 2,
  },
  tapHint: {
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2,
  },
  emptyAvatarCircle: {
    width: 52, height: 52, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderStyle: "dashed",
  },
  seatEmptyLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  chatArea: { flex: 1, borderTopWidth: 1 },
  chatList: { padding: 12, gap: 8 },
  chatMsg: { maxWidth: "82%" },
  chatMsgLeft: { alignSelf: "flex-start" },
  chatMsgRight: { alignSelf: "flex-end" },
  chatSender: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 2, paddingHorizontal: 4 },
  chatBubble: {
    borderRadius: 16, borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  chatText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  emptyChat: { alignItems: "center", paddingVertical: 24, gap: 8 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    gap: 10, paddingHorizontal: 12,
    paddingTop: 10, borderTopWidth: 1,
  },
  roundBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  inputWrap: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  input: { fontSize: 14, fontFamily: "Inter_400Regular" },
  presenceOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  presenceSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, paddingTop: 12, maxHeight: "65%",
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
  presenceBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  presenceBadgeText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  noMembersContainer: { alignItems: "center", paddingVertical: 40, gap: 12 },
  noMembersText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  membersList: { paddingHorizontal: 16, paddingBottom: 32, gap: 4 },
  memberItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  memberAvatar: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  memberAvatarImg: { width: "100%", height: "100%", borderRadius: 14 },
  memberAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  memberName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  memberRole: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  modalCard: {
    width: "100%", maxWidth: 340,
    borderRadius: 24, borderWidth: 1,
    padding: 24, alignItems: "center", gap: 12,
  },
  modalIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  modalDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  modalBtns: { flexDirection: "row", gap: 12, width: "100%", marginTop: 4 },
  modalCancelBtn: {
    flex: 1, borderRadius: 16, borderWidth: 1,
    paddingVertical: 14, alignItems: "center",
  },
  modalConfirmBtn: {
    borderRadius: 16, paddingVertical: 14,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8,
  },
  modalConfirmText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
