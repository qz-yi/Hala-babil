import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
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

import { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { Room } from "@/context/AppContext";
import { useThemeStore } from "@/store/themeStore";

function RoomCard({ room, onPress, onDelete, isOwner, isSuperAdmin, t }: any) {
  const c = useThemeStore((s) => s.tokens);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const occupied = room.seats.filter((s: any) => s !== null).length;
  const totalSeats = room.seats.length || 8;
  const accentColor = ACCENT_COLORS[room.name.length % ACCENT_COLORS.length];
  const ownerUser =
    room.seatUsers?.find((u: any) => u?.id === room.ownerId) ??
    room.seatUsers?.find((u: any) => !!u) ??
    null;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPress={handlePress} style={[styles.roomCard, { borderColor: c.border, backgroundColor: c.card }]}>
        <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
        <LinearGradient colors={[`${accentColor}18`, "transparent"]} style={StyleSheet.absoluteFill} />
        <View style={[styles.roomColorBar, { backgroundColor: accentColor }]} />

        <View style={styles.roomHeader}>
          <View style={[styles.roomAvatar, { backgroundColor: `${accentColor}33` }]}>
            {ownerUser?.avatar ? (
              <Image source={{ uri: ownerUser.avatar }} style={styles.roomAvatarImg} />
            ) : (
              <Text style={[styles.roomAvatarText, { color: c.text }]}>
                {(ownerUser?.name?.[0] ?? room.name?.[0])?.toUpperCase() || "R"}
              </Text>
            )}
          </View>
          <View style={styles.roomInfo}>
            <Text style={[styles.roomName, { color: c.text }]} numberOfLines={1}>{room.name}</Text>
            <Text style={[styles.roomOwner, { color: c.textSecondary }]}>{room.ownerName}</Text>
          </View>
          {room.roomCode && (
            <View style={[styles.codeTag, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}55` }]}>
              <Feather name="hash" size={10} color={accentColor} strokeWidth={2} />
              <Text style={[styles.codeTagText, { color: accentColor }]}>{room.roomCode}</Text>
            </View>
          )}
          {(isOwner || isSuperAdmin) && (
            <TouchableOpacity
              onPress={() => onDelete(room.id)}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="trash-2" size={16} color={c.danger} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.seatsRow}>
          {Array(totalSeats).fill(null).map((_, i) => {
            const user = room.seatUsers?.[i];
            const isLocked = room.lockedSeats?.[i];
            return (
              <View
                key={i}
                style={[
                  styles.seat,
                  {
                    backgroundColor: isLocked ? c.backgroundTertiary : user ? `${accentColor}33` : c.backgroundTertiary,
                    borderColor: isLocked ? `${c.danger}44` : user ? accentColor : c.border,
                  },
                ]}
              >
                {isLocked ? (
                  <Feather name="lock" size={10} color={c.danger} strokeWidth={1.5} />
                ) : user ? (
                  user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.seatAvatarImg} />
                  ) : (
                    <Text style={[styles.seatText, { color: accentColor }]}>{user.name[0]?.toUpperCase()}</Text>
                  )
                ) : (
                  <Feather name="mic-off" size={10} color={c.textSecondary} strokeWidth={1.5} />
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.roomFooter}>
          <View style={styles.occupancyBadge}>
            <View style={[styles.liveIndicator, { backgroundColor: occupied > 0 ? c.success : c.textSecondary }]} />
            <Text style={[styles.occupancyText, { color: c.textSecondary }]}>{occupied}/{totalSeats} مستمع</Text>
          </View>
          <View style={[styles.joinBtn, { backgroundColor: accentColor }]}>
            <Text style={styles.joinBtnText}>دخول</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function CreateRoomModal({ onClose, onCreate, t }: any) {
  const c = useThemeStore((s) => s.tokens);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name.trim());
    setLoading(false);
    onClose();
  };

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.modalTitle, { color: c.text }]}>{t("createRoom")}</Text>
        <View style={[styles.inputWrapper, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}>
          <Feather name="mic" size={18} color={c.textSecondary} strokeWidth={1.5} />
          <TextInput
            style={[styles.inputField, { color: c.text }]}
            placeholder={t("roomName")}
            placeholderTextColor={c.textSecondary}
            value={name}
            onChangeText={setName}
            textAlign="right"
            autoFocus
          />
        </View>
        <View style={styles.modalBtns}>
          <TouchableOpacity onPress={onClose} style={[styles.modalCancel, { borderColor: c.border }]}>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCreate} disabled={loading} style={[styles.modalConfirm, { backgroundColor: c.text }]}>
            <Text style={[styles.modalConfirmText, { color: c.background }]}>{loading ? "..." : t("createRoom")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const c = useThemeStore((s) => s.tokens);
  return (
    <View style={[styles.searchBar, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}>
      <Feather name="search" size={16} color={c.textSecondary} strokeWidth={1.5} />
      <TextInput
        style={[styles.searchInput, { color: c.text }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.textSecondary}
        textAlign="right"
        returnKeyType="search"
        keyboardType="default"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange("")}>
          <Feather name="x" size={16} color={c.textSecondary} strokeWidth={1.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RoomsScreen() {
  const c = useThemeStore((s) => s.tokens);
  const {
    rooms, currentUser, isSuperAdmin, createRoom, deleteRoom,
    searchUsers, searchRoomByCode, t,
    isRoomMinimized, minimizedRoomId, expandRoom, leaveRoomFull,
  } = useApp();
  const insets = useSafeAreaInsets();
  const [showCreate, setShowCreate] = useState(false);
  const [showRoomLimitModal, setShowRoomLimitModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteRoomId, setPendingDeleteRoomId] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const visibleRooms = rooms.filter((r) => !r.isHidden || r.ownerId === currentUser?.id);
  const myRoom = currentUser ? rooms.find((r) => r.ownerId === currentUser.id) : null;
  const isSearching = searchQuery.trim().length > 0;

  const isNumericSearch = /^\d{6,}$/.test(searchQuery.trim());
  const searchResults = isNumericSearch ? [] : searchUsers(searchQuery);
  const roomByCode = isNumericSearch ? searchRoomByCode(searchQuery.trim()) : null;

  const tryJoinRoom = (roomId: string) => {
    if (isRoomMinimized && minimizedRoomId !== roomId) {
      setPendingRoomId(roomId);
      setShowBlockedModal(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      router.push(`/room/${roomId}` as any);
    }
  };

  const handleLeaveAndJoin = () => {
    if (minimizedRoomId) { leaveRoomFull(minimizedRoomId); expandRoom(); }
    setShowBlockedModal(false);
    if (pendingRoomId) { router.push(`/room/${pendingRoomId}` as any); setPendingRoomId(null); }
  };

  const handleSearchSubmit = () => {
    if (isNumericSearch) {
      const found = searchRoomByCode(searchQuery.trim());
      if (found) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); tryJoinRoom(found.id); }
      else Alert.alert(t("error"), t("roomCodeNotFound"));
    }
  };

  const handleCreateRoom = async (name: string) => {
    if (myRoom) { setShowRoomLimitModal(true); return; }
    await createRoom(name);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteRoom = (roomId: string) => {
    setPendingDeleteRoomId(roomId);
    setShowDeleteModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const confirmDeleteRoom = () => {
    if (pendingDeleteRoomId) {
      deleteRoom(pendingDeleteRoomId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPendingDeleteRoomId(null);
    }
    setShowDeleteModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: c.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerGreeting, { color: c.textSecondary }]}>مرحباً،</Text>
          <Text style={[styles.headerName, { color: c.text }]} numberOfLines={1}>
            {currentUser?.name || t("hillaConnect")}
          </Text>
        </View>
        {isSuperAdmin && (
          <TouchableOpacity onPress={() => router.push("/admin")} style={[styles.adminBtn, { backgroundColor: c.backgroundTertiary, borderColor: "#FFD70066" }]}>
            <Text style={{ fontSize: 18 }}>👑</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCreate(true); }}
          style={[styles.createBtn, { backgroundColor: c.text }]}
        >
          <Feather name="plus" size={22} color={c.background} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={t("searchByCode")} />
        {isNumericSearch && (
          <TouchableOpacity onPress={handleSearchSubmit} style={styles.codeSearchBtn}>
            <Feather name="hash" size={14} color="#fff" strokeWidth={2} />
            <Text style={styles.codeSearchBtnText}>
              {roomByCode ? `دخول غرفة "${roomByCode.name}"` : "بحث بكود الغرفة"}
            </Text>
            <Feather name="arrow-left" size={14} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {isSearching && !isNumericSearch ? (
        <FlatList
          data={searchResults}
          keyExtractor={(u) => u.id}
          contentContainerStyle={[styles.searchList, { paddingBottom: insets.bottom + 90 }]}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Feather name="search" size={36} color={c.border} strokeWidth={1} />
              <Text style={[styles.noResultsText, { color: c.textSecondary }]}>لا توجد نتائج</Text>
            </View>
          }
          renderItem={({ item }) => {
            const color = ACCENT_COLORS[item.id.length % ACCENT_COLORS.length];
            return (
              <TouchableOpacity
                style={[styles.searchResult, { borderBottomColor: c.border }]}
                onPress={() => router.push(`/profile/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.searchAvatar, { backgroundColor: `${color}33` }]}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.searchAvatarImg} />
                  ) : (
                    <Text style={[styles.searchAvatarText, { color }]}>{item.name[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchName, { color: c.text }]}>{item.name}</Text>
                  <Text style={[styles.searchPhone, { color: c.textSecondary }]}>@{item.username || item.email}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={c.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>
            );
          }}
        />
      ) : visibleRooms.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="mic" size={56} color={c.border} strokeWidth={1} />
          <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>{t("noRooms")}</Text>
          <Text style={[styles.emptyDesc, { color: c.textSecondary }]}>{t("createFirst")}</Text>
          <TouchableOpacity onPress={() => setShowCreate(true)} style={[styles.emptyBtn, { backgroundColor: c.text }]}>
            <Text style={[styles.emptyBtnText, { color: c.background }]}>{t("createRoom")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visibleRooms}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <RoomCard
              room={item}
              onPress={() => tryJoinRoom(item.id)}
              onDelete={handleDeleteRoom}
              isOwner={item.ownerId === currentUser?.id}
              isSuperAdmin={isSuperAdmin}
              t={t}
            />
          )}
        />
      )}

      {showCreate && (
        <CreateRoomModal onClose={() => setShowCreate(false)} onCreate={handleCreateRoom} t={t} />
      )}

      {/* Blocked — already in a room modal */}
      <Modal visible={showBlockedModal} transparent animationType="fade" onRequestClose={() => setShowBlockedModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "center", alignItems: "center", padding: 28 }}
          onPress={() => setShowBlockedModal(false)}
        >
          <Pressable
            style={{ backgroundColor: c.card, borderRadius: 24, borderWidth: 1, borderColor: `${c.accent}44`, padding: 28, width: "100%", alignItems: "center", gap: 14 }}
            onPress={() => {}}
          >
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${c.accent}22`, alignItems: "center", justifyContent: "center" }}>
              <Feather name="alert-circle" size={30} color={c.accent} strokeWidth={1.5} />
            </View>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 17, textAlign: "center" }}>تنبيه</Text>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
              لا يمكنك دخول غرفة جديدة، يجب مغادرة الغرفة الحالية أولاً. هل تريد المغادرة؟
            </Text>
            <View style={{ flexDirection: "row", gap: 12, width: "100%", marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => { setShowBlockedModal(false); setPendingRoomId(null); }}
                style={{ flex: 1, height: 50, borderRadius: 14, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>لا</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLeaveAndJoin}
                style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 }}>نعم</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Custom Delete Room Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "center", alignItems: "center", padding: 28 }}
          onPress={() => setShowDeleteModal(false)}
        >
          <Pressable
            style={{ backgroundColor: c.card, borderRadius: 24, borderWidth: 1, borderColor: `${c.danger}22`, padding: 28, width: "100%", alignItems: "center", gap: 14 }}
            onPress={() => {}}
          >
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${c.danger}18`, alignItems: "center", justifyContent: "center" }}>
              <Feather name="trash-2" size={28} color={c.danger} strokeWidth={1.5} />
            </View>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 17 }}>حذف الغرفة</Text>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" }}>
              هل أنت متأكد من حذف هذه الغرفة؟ لا يمكن التراجع عن هذا الإجراء.
            </Text>
            <View style={{ flexDirection: "row", gap: 12, width: "100%", marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={{ flex: 1, height: 50, borderRadius: 14, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeleteRoom}
                style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: c.danger, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 }}>حذف</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Room Creation Limit Modal */}
      <Modal visible={showRoomLimitModal} transparent animationType="fade" onRequestClose={() => setShowRoomLimitModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", alignItems: "center", padding: 32 }}
          onPress={() => setShowRoomLimitModal(false)}
        >
          <Pressable
            style={{ backgroundColor: c.card, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 28, width: "100%", alignItems: "center", gap: 14 }}
            onPress={() => {}}
          >
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#F59E0B22", alignItems: "center", justifyContent: "center" }}>
              <Feather name="alert-circle" size={28} color="#F59E0B" strokeWidth={1.5} />
            </View>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18 }}>تنبيه</Text>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" }}>
              يمكنك إنشاء غرفة واحدة فقط. يرجى حذف غرفتك الحالية أولاً.
            </Text>
            <TouchableOpacity
              onPress={() => setShowRoomLimitModal(false)}
              style={{ width: "100%", height: 50, borderRadius: 14, backgroundColor: c.text, alignItems: "center", justifyContent: "center", marginTop: 4 }}
            >
              <Text style={{ color: c.background, fontFamily: "Inter_700Bold", fontSize: 15 }}>حسناً</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, marginBottom: 12,
  },
  headerGreeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  headerName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  adminBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 0.5 },
  createBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 0.5, paddingHorizontal: 14, height: 44, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  codeSearchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, backgroundColor: "#4F46E5", borderRadius: 12, paddingVertical: 11 },
  codeSearchBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  list: { padding: 16, gap: 12 },
  roomCard: { borderRadius: 20, borderWidth: 0.5, overflow: "hidden" },
  roomColorBar: { height: 2, width: "100%" },
  roomHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  roomAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  roomAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  roomAvatarImg: { width: "100%", height: "100%", borderRadius: 22, resizeMode: "cover" },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  roomOwner: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  codeTag: { flexDirection: "row", alignItems: "center", gap: 3, borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  codeTagText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  deleteBtn: { padding: 8 },
  seatsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 14, paddingBottom: 12 },
  seat: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 0.5, overflow: "hidden" },
  seatText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  seatAvatarImg: { width: "100%", height: "100%", resizeMode: "cover" },
  roomFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 14 },
  occupancyBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveIndicator: { width: 7, height: 7, borderRadius: 4 },
  occupancyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  joinBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 100 },
  joinBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  searchList: { padding: 16, gap: 8 },
  searchResult: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 0.5 },
  searchAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  searchAvatarImg: { width: "100%", height: "100%", borderRadius: 22 },
  searchAvatarText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  searchName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  searchPhone: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  noResults: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 12 },
  noResultsText: { fontFamily: "Inter_400Regular", fontSize: 15 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 100, marginTop: 8 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", zIndex: 100, padding: 24 },
  modalCard: { width: "100%", borderRadius: 24, borderWidth: 0.5, padding: 24, gap: 16 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 0.5, paddingHorizontal: 14, height: 52, gap: 10 },
  inputField: { flex: 1, height: "100%", fontSize: 16, fontFamily: "Inter_400Regular" },
  modalBtns: { flexDirection: "row", gap: 12 },
  modalCancel: { flex: 1, height: 50, borderRadius: 100, borderWidth: 0.5, alignItems: "center", justifyContent: "center" },
  modalConfirm: { flex: 1, height: 50, borderRadius: 100, alignItems: "center", justifyContent: "center" },
  modalConfirmText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
