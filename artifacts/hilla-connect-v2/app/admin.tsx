import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToast } from "@/components/Toast";
import { IRAQI_GOVERNORATES, useApp, isUserVerified } from "@/context/AppContext";
import type { Restaurant, User } from "@/context/AppContext";
import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/themeStore";
import { VerifiedBadge } from "@/components/VerifiedBadge";

type Tab = "owners" | "restaurants" | "users" | "rooms" | "governorates" | "settings";

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const c = useThemeStore((s) => s.tokens);
  return (
    <View style={sec.wrap}>
      <Text style={[sec.title, { color: c.text }]}>{title}</Text>
      {subtitle ? <Text style={[sec.sub, { color: c.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

const sec = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 14 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
});

function CreateOwnerForm({ onCreated }: { onCreated: () => void }) {
  const c = useThemeStore((s) => s.tokens);
  const { createOwnerAccount } = useApp();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gov, setGov] = useState("");
  const [password, setPassword] = useState("");
  const [govModal, setGovModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!name.trim() || !email.trim() || !gov || !password.trim()) {
      showToast("يرجى ملء جميع الحقول", "error"); return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await createOwnerAccount(name.trim(), email.trim().toLowerCase(), gov, password);
    setLoading(false);
    if (res.success) {
      showToast("تم إنشاء الحساب والمطعم بنجاح ✓", "success");
      setName(""); setEmail(""); setGov(""); setPassword("");
      onCreated();
    } else if (res.error === "email_exists") {
      showToast("البريد الإلكتروني مسجل مسبقاً", "error");
    } else {
      showToast("حدث خطأ، حاول مرة أخرى", "error");
    }
  };

  return (
    <View style={[frm.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[frm.label, { color: c.textSecondary }]}>اسم صاحب المطعم *</Text>
      <TextInput style={[frm.input, { backgroundColor: c.backgroundTertiary, borderColor: c.border, color: c.text }]} value={name} onChangeText={setName} placeholder="الاسم الكامل" placeholderTextColor={c.textSecondary} textAlign="right" />

      <Text style={[frm.label, { color: c.textSecondary }]}>البريد الإلكتروني *</Text>
      <TextInput style={[frm.input, { backgroundColor: c.backgroundTertiary, borderColor: c.border, color: c.text }]} value={email} onChangeText={setEmail} placeholder="owner@example.com" placeholderTextColor={c.textSecondary} keyboardType="email-address" autoCapitalize="none" />

      <Text style={[frm.label, { color: c.textSecondary }]}>المحافظة *</Text>
      <TouchableOpacity style={[frm.input, frm.govBtn, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]} onPress={() => setGovModal(true)}>
        <Text style={{ color: gov ? c.text : c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 15 }}>{gov || "اختر المحافظة"}</Text>
        <Feather name="chevron-down" size={16} color={c.textSecondary} />
      </TouchableOpacity>

      <Text style={[frm.label, { color: c.textSecondary }]}>كلمة المرور *</Text>
      <TextInput style={[frm.input, { backgroundColor: c.backgroundTertiary, borderColor: c.border, color: c.text }]} value={password} onChangeText={setPassword} placeholder="كلمة مرور قوية" placeholderTextColor={c.textSecondary} secureTextEntry />

      <TouchableOpacity style={[frm.btn, { backgroundColor: c.text }]} activeOpacity={0.85} onPress={handle} disabled={loading}>
        <Feather name="user-plus" size={18} color={c.background} strokeWidth={2} />
        <Text style={[frm.btnTxt, { color: c.background }]}>{loading ? "جارٍ الإنشاء..." : "إنشاء حساب صاحب مطعم"}</Text>
      </TouchableOpacity>

      <Modal visible={govModal} transparent animationType="slide" onRequestClose={() => setGovModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }} onPress={() => setGovModal(false)}>
          <Pressable style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }} onPress={() => {}}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "right", marginBottom: 16 }}>اختر المحافظة</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {IRAQI_GOVERNORATES.map((g) => (
                <TouchableOpacity key={g} onPress={() => { setGov(g); setGovModal(false); }}
                  style={{ paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: c.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: g === gov ? c.success : c.text, fontFamily: "Inter_500Medium", fontSize: 16 }}>{g}</Text>
                  {g === gov && <Feather name="check" size={18} color={c.success} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const frm = StyleSheet.create({
  card: { margin: 16, borderRadius: 18, padding: 18, gap: 8, borderWidth: 0.5 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right", marginTop: 4 },
  input: { borderRadius: 12, borderWidth: 0.5, paddingHorizontal: 14, paddingVertical: 13, fontFamily: "Inter_400Regular", fontSize: 15 },
  govBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  btn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  btnTxt: { fontSize: 16, fontFamily: "Inter_700Bold" },
});

function OwnerCard({ user, restaurant, onToggleActive }: { user: User; restaurant: Restaurant | undefined; onToggleActive: () => void }) {
  const c = useThemeStore((s) => s.tokens);
  const isActive = user.isActive !== false;
  return (
    <View style={[ow.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={ow.row}>
        <View style={[ow.avatar, { backgroundColor: isActive ? `${c.success}22` : `${c.danger}22` }]}>
          <Feather name="user" size={22} color={isActive ? c.success : c.danger} strokeWidth={1.5} />
        </View>
        <View style={ow.info}>
          <Text style={[ow.name, { color: c.text }]}>{user.name}</Text>
          <Text style={[ow.email, { color: c.textSecondary }]}>{user.email}</Text>
          <Text style={[ow.gov, { color: c.textSecondary }]}>📍 {user.primaryGovernorate}</Text>
        </View>
        <View style={ow.right}>
          <View style={[ow.badge, { backgroundColor: isActive ? `${c.success}22` : `${c.danger}22` }]}>
            <Text style={[ow.badgeTxt, { color: isActive ? c.success : c.danger }]}>{isActive ? "نشط" : "موقوف"}</Text>
          </View>
          <TouchableOpacity style={[ow.toggleBtn, { backgroundColor: isActive ? `${c.danger}22` : `${c.success}22`, borderColor: isActive ? c.danger : c.success }]}
            onPress={onToggleActive} activeOpacity={0.8}>
            <Text style={[ow.toggleTxt, { color: isActive ? c.danger : c.success }]}>{isActive ? "إيقاف" : "تفعيل"}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {restaurant && (
        <View style={[ow.restRow, { backgroundColor: c.backgroundTertiary }]}>
          <Feather name="coffee" size={13} color={c.textSecondary} strokeWidth={1.5} />
          <Text style={[ow.restName, { color: c.text }]}>{restaurant.name}</Text>
          <Text style={[ow.restGov, { color: c.textSecondary }]}>{restaurant.governorate}</Text>
        </View>
      )}
    </View>
  );
}

const ow = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 14, borderWidth: 0.5, gap: 10 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  email: { fontSize: 12, fontFamily: "Inter_400Regular" },
  gov: { fontSize: 12, fontFamily: "Inter_400Regular" },
  right: { gap: 6, alignItems: "flex-end" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  toggleTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  restRow: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, padding: 8 },
  restName: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  restGov: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

function RestaurantManagerCard({
  restaurant,
  ownerUser,
  onSetCommission,
  onClearDues,
  onDelete,
}: {
  restaurant: Restaurant;
  ownerUser?: User;
  onSetCommission: (rate: number) => void;
  onClearDues: () => void;
  onDelete: () => void;
}) {
  const c = useThemeStore((s) => s.tokens);
  const [editingCommission, setEditingCommission] = useState(false);
  const [commInput, setCommInput] = useState((restaurant.commissionRate ?? 10).toString());

  const dues = restaurant.monthlyDues ?? 0;

  return (
    <View style={[rc.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={rc.row}>
        {restaurant.image ? (
          <Image source={{ uri: restaurant.image }} style={[rc.img, { backgroundColor: c.backgroundTertiary }]} />
        ) : (
          <View style={[rc.imgPlaceholder, { backgroundColor: c.backgroundTertiary }]}><Text style={{ fontSize: 22 }}>🍽️</Text></View>
        )}
        <View style={rc.info}>
          <Text style={[rc.name, { color: c.text }]}>{restaurant.name}</Text>
          <Text style={[rc.gov, { color: c.textSecondary }]}>📍 {restaurant.governorate} · {restaurant.category}</Text>
          {ownerUser && <Text style={[rc.owner, { color: c.textSecondary }]}>👤 {ownerUser.name}</Text>}
          <Text style={[rc.menuCount, { color: c.success }]}>{restaurant.menuItems.length} صنف في القائمة</Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={rc.deleteBtn}>
          <Feather name="trash-2" size={16} color={c.danger} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <View style={[rc.statsRow, { backgroundColor: c.backgroundTertiary }]}>
        <View style={rc.statBlock}>
          <Text style={[rc.statLabel, { color: c.textSecondary }]}>المستحقات</Text>
          <Text style={[rc.statValue, { color: dues > 0 ? "#F59E0B" : c.success }]}>{dues.toLocaleString()} د.ع</Text>
        </View>
        <View style={[rc.statDivider, { backgroundColor: c.border }]} />
        <View style={rc.statBlock}>
          <Text style={[rc.statLabel, { color: c.textSecondary }]}>العمولة</Text>
          {editingCommission ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <TextInput
                style={[rc.commInput, { backgroundColor: c.background, color: c.text }]}
                value={commInput}
                onChangeText={setCommInput}
                keyboardType="numeric"
                autoFocus
              />
              <Text style={{ color: c.text, fontFamily: "Inter_600SemiBold" }}>%</Text>
              <TouchableOpacity onPress={() => {
                const v = parseFloat(commInput);
                if (!isNaN(v) && v >= 0 && v <= 100) { onSetCommission(v); }
                setEditingCommission(false);
              }}>
                <Feather name="check" size={16} color={c.success} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { setCommInput((restaurant.commissionRate ?? 10).toString()); setEditingCommission(true); }}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={[rc.statValue, { color: c.text }]}>{restaurant.commissionRate ?? 10}%</Text>
              <Feather name="edit-2" size={12} color={c.textSecondary} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {dues > 0 && (
        <TouchableOpacity style={[rc.clearBtn, { backgroundColor: `${c.success}15`, borderColor: `${c.success}44` }]} onPress={onClearDues} activeOpacity={0.85}>
          <Feather name="check-circle" size={15} color={c.success} strokeWidth={1.5} />
          <Text style={[rc.clearBtnTxt, { color: c.success }]}>تصفية المستحقات</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const rc = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 14, borderWidth: 0.5, gap: 12 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  img: { width: 60, height: 60, borderRadius: 12 },
  imgPlaceholder: { width: 60, height: 60, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  gov: { fontSize: 12, fontFamily: "Inter_400Regular" },
  owner: { fontSize: 12, fontFamily: "Inter_400Regular" },
  menuCount: { fontSize: 12, fontFamily: "Inter_500Medium" },
  deleteBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", borderRadius: 10, padding: 12 },
  statBlock: { flex: 1, alignItems: "center", gap: 4 },
  statDivider: { width: 1 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  commInput: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, fontFamily: "Inter_700Bold", fontSize: 16, width: 48, textAlign: "center" },
  clearBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, paddingVertical: 10, borderWidth: 1 },
  clearBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});

export default function AdminScreen() {
  const {
    isManager, users, restaurants, rooms, governorateImages,
    setOwnerActive, setCommissionRate, clearDues, deleteRestaurant,
    setGovernorateImage, theme, banUser, unbanUser, resetUserPassword,
    deleteRoom, verifyUser, revokeVerification,
    restaurantsEnabled, toggleRestaurantsEnabled,
  } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const c = useThemeStore((s) => s.tokens);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [tab, setTab] = useState<Tab>("owners");
  const [selectedGov, setSelectedGov] = useState<string | null>(null);
  const [createdRefresh, setCreatedRefresh] = useState(0);
  const [verifyModal, setVerifyModal] = useState<{ userId: string; userName: string } | null>(null);
  const [pwModal, setPwModal] = useState<{ userId: string; userName: string } | null>(null);
  const [newPw, setNewPw] = useState("");

  if (!isManager) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", backgroundColor: c.background }]}>
        <Text style={{ color: c.textSecondary }}>غير مصرح لك بالدخول</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: c.text }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ownerUsers = users.filter((u) => u.role === "RESTAURANT_OWNER");
  const filteredRestaurants = selectedGov
    ? restaurants.filter((r) => r.governorate === selectedGov)
    : restaurants;

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "owners", label: "الأصحاب", icon: "users" },
    { key: "restaurants", label: "المطاعم", icon: "coffee" },
    { key: "users", label: "المستخدمون", icon: "user" },
    { key: "rooms", label: "الغرف", icon: "mic" },
    { key: "governorates", label: "المحافظات", icon: "map" },
    { key: "settings", label: "إعدادات", icon: "settings" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Header */}
      <LinearGradient colors={["#111111", "#000000"]} style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>لوحة المدير</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tab Grid — 3 columns */}
      <View style={[styles.adminGrid, { borderBottomColor: c.border }]}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t.key); }}
              style={[styles.gridTile, active && styles.gridTileActive]}
              activeOpacity={0.75}
            >
              <View style={[styles.gridIconBg, { backgroundColor: active ? "rgba(255,255,255,0.15)" : c.backgroundTertiary, borderColor: c.border }]}>
                <Feather name={t.icon as any} size={22} color={active ? "#fff" : c.textSecondary} strokeWidth={1.5} />
              </View>
              <Text style={[styles.gridTileLabel, { color: active ? "#fff" : c.textSecondary }]} numberOfLines={1}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>

          {/* ── OWNERS TAB ── */}
          {tab === "owners" && (
            <View>
              <SectionHeader title="إنشاء حساب صاحب مطعم" subtitle="سيتم إنشاء مطعم فارغ تلقائياً عند إنشاء الحساب" />
              <CreateOwnerForm onCreated={() => setCreatedRefresh((p) => p + 1)} />

              {ownerUsers.length > 0 && (
                <>
                  <SectionHeader title={`أصحاب المطاعم (${ownerUsers.length})`} />
                  {ownerUsers.map((u) => {
                    const rest = restaurants.find((r) => r.ownerId === u.id);
                    return (
                      <OwnerCard
                        key={u.id}
                        user={u}
                        restaurant={rest}
                        onToggleActive={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setOwnerActive(u.id, u.isActive === false);
                          showToast(u.isActive !== false ? "تم إيقاف الحساب" : "تم تفعيل الحساب", "success");
                        }}
                      />
                    );
                  })}
                </>
              )}

              {ownerUsers.length === 0 && (
                <View style={styles.emptyState}>
                  <Feather name="users" size={48} color={c.border} strokeWidth={1} />
                  <Text style={[styles.emptyTxt, { color: c.textSecondary }]}>لا يوجد أصحاب مطاعم بعد</Text>
                </View>
              )}
            </View>
          )}

          {/* ── RESTAURANTS TAB ── */}
          {tab === "restaurants" && (
            <View>
              <SectionHeader title={`إدارة المطاعم (${restaurants.length})`} subtitle="العمولات والمستحقات الشهرية" />

              {/* Gov filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}>
                <TouchableOpacity onPress={() => setSelectedGov(null)}
                  style={[styles.govFilter, { borderColor: selectedGov === null ? c.success : c.border, backgroundColor: selectedGov === null ? `${c.success}22` : c.card }]}>
                  <Text style={[styles.govFilterTxt, { color: selectedGov === null ? c.success : c.textSecondary }]}>الكل</Text>
                </TouchableOpacity>
                {IRAQI_GOVERNORATES.map((g) => (
                  <TouchableOpacity key={g} onPress={() => setSelectedGov(selectedGov === g ? null : g)}
                    style={[styles.govFilter, { borderColor: selectedGov === g ? c.success : c.border, backgroundColor: selectedGov === g ? `${c.success}22` : c.card }]}>
                    <Text style={[styles.govFilterTxt, { color: selectedGov === g ? c.success : c.textSecondary }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filteredRestaurants.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="coffee" size={48} color={c.border} strokeWidth={1} />
                  <Text style={[styles.emptyTxt, { color: c.textSecondary }]}>لا توجد مطاعم</Text>
                </View>
              ) : (
                filteredRestaurants.map((r) => {
                  const owner = r.ownerId ? users.find((u) => u.id === r.ownerId) : undefined;
                  return (
                    <RestaurantManagerCard
                      key={r.id}
                      restaurant={r}
                      ownerUser={owner}
                      onSetCommission={(rate) => {
                        setCommissionRate(r.id, rate);
                        showToast(`تم تحديث العمولة إلى ${rate}%`, "success");
                      }}
                      onClearDues={() => {
                        clearDues(r.id);
                        showToast("تمت تصفية المستحقات", "success");
                      }}
                      onDelete={() => {
                        deleteRestaurant(r.id);
                        showToast("تم حذف المطعم", "success");
                      }}
                    />
                  );
                })
              )}
            </View>
          )}

          {/* ── USERS TAB ── */}
          {tab === "users" && (
            <View>
              <SectionHeader title={`المستخدمون (${users.filter(u => !u.role || u.role === "CUSTOMER").length})`} />
              {users.filter((u) => !u.role || u.role === "CUSTOMER").map((u) => {
                const verified = isUserVerified(u);
                return (
                  <View key={u.id} style={[styles.userCard, { backgroundColor: c.card, borderColor: c.border }]}>
                    <View style={[styles.userAvatar, { backgroundColor: c.backgroundTertiary }]}>
                      {u.avatar ? <Image source={{ uri: u.avatar }} style={styles.userAvatarImg} /> : (
                        <Text style={{ fontSize: 18 }}>👤</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Text style={[styles.userName, { color: c.text }]}>{u.name}</Text>
                        {verified && <VerifiedBadge size={13} />}
                      </View>
                      <Text style={[styles.userEmail, { color: c.textSecondary }]}>{u.email}</Text>
                      {u.primaryGovernorate && <Text style={[styles.userGov, { color: c.textSecondary }]}>📍 {u.primaryGovernorate}</Text>}
                      {verified && u.verifiedUntil && (
                        <Text style={{ fontSize: 10, color: c.accent, fontFamily: "Inter_500Medium" }}>
                          موثق حتى {new Date(u.verifiedUntil).toLocaleDateString("ar-IQ")}
                        </Text>
                      )}
                    </View>
                    <View style={{ gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => { setVerifyModal({ userId: u.id, userName: u.name }); }}
                        style={[styles.actionBtn, { borderColor: c.accent }]}
                      >
                        <Feather name="check-circle" size={12} color={c.accent} strokeWidth={2} />
                        <Text style={[styles.actionBtnTxt, { color: c.accent }]}>{verified ? "تجديد" : "توثيق"}</Text>
                      </TouchableOpacity>
                      {verified && (
                        <TouchableOpacity
                          onPress={() => { revokeVerification(u.id); showToast("تم إلغاء التوثيق", "success"); }}
                          style={[styles.actionBtn, { borderColor: "#F59E0B" }]}
                        >
                          <Feather name="x-circle" size={12} color="#F59E0B" strokeWidth={2} />
                          <Text style={[styles.actionBtnTxt, { color: "#F59E0B" }]}>إلغاء</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => { setPwModal({ userId: u.id, userName: u.name }); setNewPw(""); }}
                        style={[styles.actionBtn, { borderColor: c.textSecondary }]}
                      >
                        <Feather name="lock" size={12} color={c.textSecondary} strokeWidth={2} />
                        <Text style={[styles.actionBtnTxt, { color: c.textSecondary }]}>كلمة المرور</Text>
                      </TouchableOpacity>
                      {u.isBanned ? (
                        <TouchableOpacity onPress={() => { unbanUser(u.id); showToast("تم رفع الحظر", "success"); }}
                          style={[styles.actionBtn, { borderColor: c.success }]}>
                          <Text style={[styles.actionBtnTxt, { color: c.success }]}>رفع الحظر</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => { banUser(u.id); showToast("تم حظر المستخدم", "success"); }}
                          style={[styles.actionBtn, { borderColor: c.danger }]}>
                          <Text style={[styles.actionBtnTxt, { color: c.danger }]}>حظر</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── ROOMS TAB ── */}
          {tab === "rooms" && (
            <View>
              <SectionHeader title={`الغرف النشطة (${rooms.length})`} />
              {rooms.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="mic" size={48} color={c.border} strokeWidth={1} />
                  <Text style={[styles.emptyTxt, { color: c.textSecondary }]}>لا توجد غرف</Text>
                </View>
              ) : (
                rooms.map((room) => (
                  <View key={room.id} style={[styles.roomCard, { backgroundColor: c.card, borderColor: c.border }]}>
                    <Text style={[styles.roomName, { color: c.text }]}>{room.name}</Text>
                    <Text style={[styles.roomOwner, { color: c.textSecondary }]}>بواسطة {room.ownerName}</Text>
                    <Text style={[styles.roomCode, { color: c.success }]}>#{room.roomCode}</Text>
                    <TouchableOpacity onPress={() => { deleteRoom(room.id); showToast("تم حذف الغرفة", "success"); }}
                      style={[styles.actionBtn, { borderColor: c.danger, marginTop: 4 }]}>
                      <Feather name="trash-2" size={13} color={c.danger} strokeWidth={1.5} />
                      <Text style={[styles.actionBtnTxt, { color: c.danger }]}>حذف</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ── GOVERNORATES TAB ── */}
          {tab === "governorates" && (
            <View>
              <SectionHeader title="صور المحافظات" subtitle="اضغط على المحافظة لتغيير صورتها" />
              <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 10, alignItems: "flex-start" }}>
                {IRAQI_GOVERNORATES.map((g) => {
                  const img = governorateImages.find((gi) => gi.name === g);
                  return (
                    <TouchableOpacity key={g} activeOpacity={0.85}
                      onPress={async () => {
                        const { status } = await import("expo-image-picker").then((m) => m.requestMediaLibraryPermissionsAsync());
                        if (status !== "granted") return;
                        const res = await import("expo-image-picker").then((m) => m.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 }));
                        if (!res.canceled && res.assets[0]) { setGovernorateImage(g, res.assets[0].uri); showToast(`تم تحديث صورة ${g}`, "success"); }
                      }}
                      style={[styles.govCard, { backgroundColor: c.card, borderColor: c.border }]}>
                      {img?.image ? <Image source={{ uri: img.image }} style={styles.govCardImg} /> : (
                        <View style={[styles.govCardPlaceholder, { backgroundColor: c.backgroundTertiary }]}><Text style={{ fontSize: 20 }}>🏛️</Text></View>
                      )}
                      <Text style={[styles.govCardName, { color: c.text }]} numberOfLines={1}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── SETTINGS TAB ── */}
          {tab === "settings" && (
            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              <SectionHeader title="إعدادات التطبيق" subtitle="تحكم في ميزات وأقسام التطبيق" />
              {/* Restaurants feature toggle */}
              <View style={[styles.settingsRow, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.settingsRowLeft}>
                  <View style={[styles.settingsIconBox, { backgroundColor: `${c.accent}22` }]}>
                    <Feather name="coffee" size={18} color={c.accent} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingsRowTitle, { color: c.text }]}>قسم المطاعم</Text>
                    <Text style={[styles.settingsRowSubtitle, { color: c.textSecondary }]}>
                      {restaurantsEnabled ? "مفعّل — المستخدمون يرون قائمة المطاعم" : "معطّل — سيظهر للمستخدمين شاشة \"قريباً\""}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={restaurantsEnabled}
                  onValueChange={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    toggleRestaurantsEnabled();
                    showToast(restaurantsEnabled ? "تم تعطيل قسم المطاعم" : "تم تفعيل قسم المطاعم", restaurantsEnabled ? "error" : "success");
                  }}
                  trackColor={{ false: c.border, true: c.accent }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Verify User Modal ── */}
      <Modal visible={!!verifyModal} transparent animationType="slide" onRequestClose={() => setVerifyModal(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }} onPress={() => setVerifyModal(null)}>
          <Pressable style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 }} onPress={() => {}}>
            <View style={{ alignItems: "center", gap: 8 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: `${c.accent}22`, alignItems: "center", justifyContent: "center" }}>
                <Feather name="check-circle" size={26} color={c.accent} strokeWidth={1.5} />
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18 }}>توثيق الحساب</Text>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14 }}>{verifyModal?.userName}</Text>
            </View>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 14, textAlign: "center" }}>اختر مدة التوثيق</Text>
            {[{ label: "شهر واحد (1M)", months: 1 }, { label: "ثلاثة أشهر (3M)", months: 3 }, { label: "سنة كاملة (1Y)", months: 12 }].map((opt) => (
              <TouchableOpacity
                key={opt.months}
                style={{ backgroundColor: `${c.accent}22`, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: `${c.accent}55` }}
                onPress={() => {
                  if (verifyModal) {
                    verifyUser(verifyModal.userId, opt.months);
                    showToast(`تم توثيق ${verifyModal.userName} لمدة ${opt.label}`, "success");
                    setVerifyModal(null);
                  }
                }}
              >
                <Text style={{ color: c.accent, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setVerifyModal(null)} style={{ paddingVertical: 12, alignItems: "center" }}>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium" }}>إلغاء</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal visible={!!pwModal} transparent animationType="slide" onRequestClose={() => setPwModal(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }} onPress={() => setPwModal(null)}>
          <Pressable style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 }} onPress={() => {}}>
            <View style={{ alignItems: "center", gap: 8 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#F59E0B22", alignItems: "center", justifyContent: "center" }}>
                <Feather name="lock" size={24} color="#F59E0B" strokeWidth={1.5} />
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18 }}>تغيير كلمة المرور</Text>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>{pwModal?.userName}</Text>
            </View>
            <TextInput
              style={{ backgroundColor: c.backgroundTertiary, borderRadius: 12, borderWidth: 0.5, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 13, color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}
              placeholder="كلمة المرور الجديدة"
              placeholderTextColor={c.textSecondary}
              value={newPw}
              onChangeText={setNewPw}
              secureTextEntry
              textAlign="right"
            />
            <TouchableOpacity
              style={{ backgroundColor: "#F59E0B", borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
              onPress={() => {
                if (!newPw.trim()) { showToast("يرجى إدخال كلمة المرور", "error"); return; }
                if (pwModal) {
                  resetUserPassword(pwModal.userId, newPw.trim());
                  showToast("تم تغيير كلمة المرور بنجاح", "success");
                  setPwModal(null);
                  setNewPw("");
                }
              }}
            >
              <Text style={{ color: c.background, fontFamily: "Inter_700Bold", fontSize: 15 }}>حفظ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPwModal(null)} style={{ paddingVertical: 10, alignItems: "center" }}>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium" }}>إلغاء</Text>
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  adminGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 0,
    borderBottomWidth: 0.5,
  },
  gridTile: {
    width: "33.33%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 8,
  },
  gridTileActive: {},
  gridIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
  },
  gridTileLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  govFilter: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  govFilterTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTxt: { fontSize: 16, fontFamily: "Inter_500Medium" },
  userCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 12, gap: 12, borderWidth: 0.5 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  userAvatarImg: { width: "100%", height: "100%" },
  userName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  userGov: { fontSize: 11, fontFamily: "Inter_400Regular" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  actionBtnTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  roomCard: { marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14, borderWidth: 0.5, gap: 4 },
  roomName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  roomOwner: { fontSize: 12, fontFamily: "Inter_400Regular" },
  roomCode: { fontSize: 11, fontFamily: "Inter_500Medium" },
  govCard: { width: 100, borderRadius: 12, overflow: "hidden", borderWidth: 0.5 },
  govCardImg: { width: "100%", aspectRatio: 1, resizeMode: "cover" },
  govCardPlaceholder: { width: "100%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  govCardName: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center", paddingVertical: 6, paddingHorizontal: 4 },
  settingsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 0.5, borderRadius: 16, padding: 14, marginBottom: 12, gap: 12,
  },
  settingsRowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  settingsIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  settingsRowTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 2 },
  settingsRowSubtitle: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
});
