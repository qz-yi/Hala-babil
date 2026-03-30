import { Ionicons } from "@expo/vector-icons";
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
import type { Room, User } from "@/context/AppContext";

function RoomCard({ room, onPress, onDelete, isOwner, isSuperAdmin, t, colors, theme }: any) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const occupied = room.seats.filter((s: any) => s !== null).length;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const accentColor = ACCENT_COLORS[room.name.length % ACCENT_COLORS.length];
  const ownerUser = room.seatUsers?.find((u: any) => u?.id === room.ownerId) ?? room.seatUsers?.find((u: any) => !!u) ?? null;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPress={handlePress} style={[styles.roomCard, { borderColor: colors.border }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, opacity: 0.65 }]} />
        <BlurView intensity={45} tint={theme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[`${accentColor}22`, `${accentColor}08`]} style={StyleSheet.absoluteFill} />
        <View style={[styles.roomColorBar, { backgroundColor: accentColor }]} />
        <View style={styles.roomHeader}>
          <View style={[styles.roomAvatar, { backgroundColor: `${accentColor}33` }]}>
            {ownerUser?.avatar ? (
              <Image source={{ uri: ownerUser.avatar }} style={styles.roomAvatarImg} />
            ) : (
              <Text style={styles.roomAvatarText}>{(ownerUser?.name?.[0] ?? room.name?.[0])?.toUpperCase() || "R"}</Text>
            )}
          </View>
          <View style={styles.roomInfo}>
            <Text style={[styles.roomName, { color: colors.text }]} numberOfLines={1}>{room.name}</Text>
            <Text style={[styles.roomOwner, { color: colors.textSecondary }]}>{room.ownerName}</Text>
          </View>
          {(isOwner || isSuperAdmin) && (
            <TouchableOpacity onPress={() => onDelete(room.id)} style={[styles.deleteBtn, { backgroundColor: `${colors.danger}22` }]}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.seatsRow}>
          {Array(6).fill(null).map((_, i) => {
            const user = room.seatUsers[i];
            return (
              <View key={i} style={[styles.seat, { backgroundColor: user ? `${accentColor}33` : colors.backgroundTertiary, borderColor: user ? accentColor : colors.border }]}>
                {user ? (
                  user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.seatAvatarImg} />
                  ) : (
                    <Text style={styles.seatText}>{user.name[0]?.toUpperCase()}</Text>
                  )
                ) : (
                  <Ionicons name="mic-off-outline" size={14} color={colors.textSecondary} />
                )}
              </View>
            );
          })}
        </View>
        <View style={styles.roomFooter}>
          <View style={styles.occupancyBadge}>
            <View style={[styles.liveIndicator, { backgroundColor: occupied > 0 ? "#10B981" : colors.textSecondary }]} />
            <Text style={[styles.occupancyText, { color: colors.textSecondary }]}>{occupied}/6</Text>
          </View>
          <View style={[styles.joinBtn, { backgroundColor: accentColor }]}>
            <Text style={styles.joinBtnText}>دخول</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function CreateRoomModal({ onClose, onCreate, colors, t }: any) {
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
      <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>{t("createRoom")}</Text>
        <View style={[styles.inputWrapper2, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Ionicons name="mic" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.inputField, { color: colors.text, fontFamily: "Inter_400Regular" }]}
            placeholder={t("roomName")}
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            textAlign="right"
            autoFocus
          />
        </View>
        <View style={styles.modalBtns}>
          <TouchableOpacity onPress={onClose} style={[styles.modalCancel, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCreate} disabled={loading}>
            <LinearGradient colors={["#7C3AED", "#4F46E5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalConfirm}>
              <Text style={styles.modalConfirmText}>{loading ? "..." : t("createRoom")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function SearchBar({ value, onChange, colors }: { value: string; onChange: (v: string) => void; colors: any }) {
  return (
    <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
      <TextInput
        style={[styles.searchInput, { color: colors.text, fontFamily: "Inter_400Regular" }]}
        value={value}
        onChangeText={onChange}
        placeholder="ابحث عن مستخدم..."
        placeholderTextColor={colors.textSecondary}
        textAlign="right"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange("")}>
          <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RoomsScreen() {
  const { rooms, currentUser, isSuperAdmin, createRoom, deleteRoom, searchUsers, t, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const visibleRooms = rooms.filter((r) => !r.isHidden || r.ownerId === currentUser?.id);
  const myRoom = currentUser ? rooms.find((r) => r.ownerId === currentUser.id) : null;
  const searchResults = searchUsers(searchQuery);
  const isSearching = searchQuery.trim().length > 0;

  const handleCreateRoom = async (name: string) => {
    if (myRoom) { Alert.alert(t("error"), t("noRoomSlot")); return; }
    await createRoom(name);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteRoom = (roomId: string) => {
    Alert.alert(t("deleteRoom"), "هل أنت متأكد؟", [
      { text: t("cancel"), style: "cancel" },
      { text: t("deleteRoom"), style: "destructive", onPress: () => { deleteRoom(roomId); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={theme === "dark" ? ["rgba(79,70,229,0.2)", "transparent"] : ["rgba(79,70,229,0.08)", "transparent"]}
        style={[styles.headerGrad, { paddingTop: topPad }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerGreeting, { color: colors.textSecondary }]}>مرحباً،</Text>
            <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
              {currentUser?.name || t("hillaConnect")}
            </Text>
          </View>
          {isSuperAdmin && (
            <TouchableOpacity
              onPress={() => router.push("/admin")}
              style={[styles.adminBtn, { backgroundColor: `${colors.superAdmin}22`, borderColor: colors.superAdmin }]}
            >
              <Text style={[styles.adminBtnText, { color: colors.superAdmin }]}>👑</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowCreate(true)} style={[styles.createBtn, { backgroundColor: colors.tint }]}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <SearchBar value={searchQuery} onChange={setSearchQuery} colors={colors} />
      </LinearGradient>

      {isSearching ? (
        <FlatList
          data={searchResults}
          keyExtractor={(u) => u.id}
          contentContainerStyle={[styles.searchList, { paddingBottom: insets.bottom + 90 }]}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={40} color={colors.border} />
              <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>لا توجد نتائج</Text>
            </View>
          }
          renderItem={({ item }) => {
            const color = ACCENT_COLORS[item.id.length % ACCENT_COLORS.length];
            return (
              <TouchableOpacity
                style={[styles.searchResult, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/profile/${item.id}`)}
              >
                <View style={[styles.searchAvatar, { backgroundColor: `${color}33` }]}>
                  {item.avatar ? <Image source={{ uri: item.avatar }} style={styles.searchAvatarImg} /> :
                    <Text style={[styles.searchAvatarText, { color }]}>{item.name[0]?.toUpperCase()}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.searchPhone, { color: colors.textSecondary }]}>{item.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          }}
        />
      ) : visibleRooms.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="mic-circle-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t("noRooms")}</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{t("createFirst")}</Text>
          <TouchableOpacity onPress={() => setShowCreate(true)}>
            <LinearGradient colors={["#7C3AED", "#4F46E5"]} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>{t("createRoom")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visibleRooms}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <RoomCard
              room={item}
              onPress={() => router.push(`/room/${item.id}`)}
              onDelete={handleDeleteRoom}
              isOwner={item.ownerId === currentUser?.id}
              isSuperAdmin={isSuperAdmin}
              t={t} colors={colors} theme={theme}
            />
          )}
        />
      )}

      {showCreate && (
        <CreateRoomModal onClose={() => setShowCreate(false)} onCreate={handleCreateRoom} colors={colors} t={t} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  headerGreeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  headerName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  adminBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  adminBtnText: { fontSize: 20 },
  createBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 46, gap: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  searchList: { padding: 16, gap: 10 },
  searchResult: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1, padding: 12 },
  searchAvatar: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  searchAvatarImg: { width: "100%", height: "100%", borderRadius: 14 },
  searchAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  searchName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  searchPhone: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  noResults: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 12 },
  noResultsText: { fontFamily: "Inter_400Regular", fontSize: 15 },
  list: { padding: 16, gap: 14 },
  roomCard: { borderRadius: 24, borderWidth: 1, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 9 },
  roomColorBar: { height: 3, width: "100%" },
  roomHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  roomAvatar: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  roomAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  roomAvatarImg: { width: "100%", height: "100%", borderRadius: 16, resizeMode: "cover" },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  roomOwner: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  seatsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  seat: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, overflow: "hidden" },
  seatText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  seatAvatarImg: { width: "100%", height: "100%", borderRadius: 12, resizeMode: "cover" },
  roomFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 14 },
  occupancyBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveIndicator: { width: 8, height: 8, borderRadius: 4 },
  occupancyText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  joinBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12 },
  joinBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16, shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  emptyBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", zIndex: 100, padding: 24 },
  modalCard: { width: "100%", borderRadius: 24, borderWidth: 1, padding: 24, gap: 16 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  inputWrapper2: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 52, gap: 10 },
  inputField: { flex: 1, height: "100%", fontSize: 16 },
  modalBtns: { flexDirection: "row", gap: 12 },
  modalCancel: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalConfirm: { flex: 1, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  modalConfirmText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
