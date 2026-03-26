import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
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

const SUPER_ADMIN_PHONE = "07719820537";

function SeatButton({
  index,
  user,
  isOwner,
  isSuperAdmin,
  currentUser,
  accentColor,
  onJoin,
  onKick,
  onBan,
  colors,
  t,
}: any) {
  const isMe = user?.id === currentUser?.id;
  const isSuperAdminUser = user?.phone === SUPER_ADMIN_PHONE;

  const handleLongPress = () => {
    if (!isOwner && !isSuperAdmin) return;
    if (!user || isMe) return;
    Alert.alert(user.name, "الإجراءات", [
      { text: t("kickUser"), onPress: () => onKick(user.id) },
      { text: t("banUser"), style: "destructive", onPress: () => onBan(user.id) },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  return (
    <TouchableOpacity
      onPress={() => !user && onJoin(index)}
      onLongPress={handleLongPress}
      activeOpacity={0.8}
      style={[
        styles.seat,
        {
          backgroundColor: user
            ? isSuperAdminUser
              ? "#FFD70022"
              : `${accentColor}22`
            : colors.backgroundTertiary,
          borderColor: user
            ? isSuperAdminUser
              ? "#FFD700"
              : accentColor
            : colors.border,
          borderWidth: isSuperAdminUser ? 2 : 1,
        },
      ]}
    >
      {user ? (
        <>
          {isSuperAdminUser && (
            <View style={styles.seatCrown}>
              <Text style={{ fontSize: 10 }}>👑</Text>
            </View>
          )}
          <View
            style={[
              styles.seatAvatar,
              {
                backgroundColor: isSuperAdminUser ? "#FFD700" : `${accentColor}44`,
              },
            ]}
          >
            <Text style={[styles.seatAvatarText, { color: isSuperAdminUser ? "#000" : "#fff" }]}>
              {user.name[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.seatName, { color: colors.text }]} numberOfLines={1}>
            {isMe ? "أنا" : user.name.split(" ")[0]}
          </Text>
          <Ionicons name="mic" size={14} color={accentColor} />
        </>
      ) : (
        <>
          <Ionicons name="add-circle-outline" size={26} color={colors.textSecondary} />
          <Text style={[styles.seatEmptyText, { color: colors.textSecondary }]}>
            {t("seat")} {index + 1}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function ChatMessage({ msg, isMe, colors, isSuperAdmin }: any) {
  const accentColor = ACCENT_COLORS[msg.senderName.length % ACCENT_COLORS.length];
  return (
    <Animated.View
      style={[styles.chatMsg, isMe ? styles.chatMsgRight : styles.chatMsgLeft]}
    >
      {!isMe && (
        <Text style={[styles.chatSender, { color: accentColor }]}>{msg.senderName}</Text>
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
    </Animated.View>
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
    sendRoomMessage,
    t,
    theme,
  } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [muted, setMuted] = useState(false);
  const flatRef = useRef<FlatList>(null);

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
  const isSuperAdminUser = currentUser?.phone === SUPER_ADMIN_PHONE;

  const handleLeave = () => {
    leaveRoomSeat(room.id);
    router.back();
  };

  const handleSend = () => {
    if (!message.trim()) return;
    sendRoomMessage(room.id, message.trim());
    setMessage("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

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
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-down" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.roomTitle, { color: colors.text }]}>{room.name}</Text>
            <Text style={[styles.roomOwnerLabel, { color: colors.textSecondary }]}>
              {room.ownerName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { setMuted(!muted); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.muteBtn, { backgroundColor: muted ? `${colors.danger}22` : `${accentColor}22` }]}
          >
            <Ionicons name={muted ? "mic-off" : "mic"} size={20} color={muted ? colors.danger : accentColor} />
          </TouchableOpacity>
        </View>

        {/* Super Admin Royal Entrance */}
        {isSuperAdminUser && (
          <View style={styles.royalBanner}>
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.royalGradient}
            >
              <Text style={styles.royalText}>👑 {t("royal")} 👑</Text>
            </LinearGradient>
          </View>
        )}
      </LinearGradient>

      {/* Seats Grid */}
      <View style={styles.seatsGrid}>
        {Array(6).fill(null).map((_, i) => (
          <SeatButton
            key={i}
            index={i}
            user={room.seatUsers[i]}
            isOwner={isOwner}
            isSuperAdmin={isSuperAdmin}
            currentUser={currentUser}
            accentColor={accentColor}
            onJoin={(idx: number) => {
              if (!isInRoom) joinRoomSeat(room.id, idx);
              else joinRoomSeat(room.id, idx);
            }}
            onKick={(uid: string) => kickFromRoom(room.id, uid)}
            onBan={(uid: string) => banFromRoom(room.id, uid)}
            colors={colors}
            t={t}
          />
        ))}
      </View>

      {/* Chat */}
      <View style={[styles.chatContainer, { backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border }]}>
        <FlatList
          ref={flatRef}
          data={[...room.chat].reverse()}
          keyExtractor={(m) => m.id}
          inverted
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ChatMessage
              msg={item}
              isMe={item.senderId === currentUser?.id}
              colors={colors}
              isSuperAdmin={item.senderId === SUPER_ADMIN_PHONE}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyChatState}>
              <Ionicons name="chatbubbles-outline" size={32} color={colors.border} />
              <Text style={[styles.emptyChatText, { color: colors.textSecondary }]}>
                ابدأ الدردشة
              </Text>
            </View>
          }
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.inputRow, { paddingBottom: botPad + 8, borderTopColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
            <TouchableOpacity
              onPress={handleLeave}
              style={[styles.leaveBtn, { backgroundColor: `${colors.danger}22` }]}
            >
              <Ionicons name="exit-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
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
              style={[styles.sendBtn, { backgroundColor: accentColor }]}
              disabled={!message.trim()}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  headerInfo: { flex: 1 },
  roomTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  roomOwnerLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  muteBtn: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  royalBanner: { marginTop: 10 },
  royalGradient: {
    borderRadius: 14, paddingVertical: 8, paddingHorizontal: 16,
    alignItems: "center",
  },
  royalText: {
    color: "#000", fontFamily: "Inter_700Bold",
    fontSize: 14, letterSpacing: 1,
  },
  seatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
    justifyContent: "center",
  },
  seat: {
    width: "30%",
    aspectRatio: 0.9,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 8,
    position: "relative",
  },
  seatCrown: { position: "absolute", top: 4, right: 4 },
  seatAvatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  seatAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seatName: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center" },
  seatEmptyText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  chatContainer: { flex: 1, borderTopWidth: 1 },
  chatList: { padding: 12, gap: 8 },
  chatMsg: { maxWidth: "80%" },
  chatMsgLeft: { alignSelf: "flex-start" },
  chatMsgRight: { alignSelf: "flex-end" },
  chatSender: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 3, paddingLeft: 4 },
  chatBubble: {
    borderRadius: 16, borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  chatText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  emptyChatState: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyChatText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    gap: 10, paddingHorizontal: 12,
    paddingTop: 10, borderTopWidth: 1,
  },
  leaveBtn: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  inputWrapper: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 12, height: 44,
    justifyContent: "center",
  },
  input: { fontSize: 15, height: "100%" },
  sendBtn: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
});
