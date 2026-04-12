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
import { VerifiedBadge } from "@/components/VerifiedBadge";

const BG = "#000000";
const CARD = "#111111";
const CARD2 = "#1A1A1A";
const BORDER = "#222222";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";
const ACCENT = "#10B981";
const RED = "#FF3B5C";
const BLUE = "#3D91F4";
const ORANGE = "#F59E0B";

type Tab = "owners" | "restaurants" | "users" | "rooms" | "governorates";

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={sec.wrap}>
      <Text style={sec.title}>{title}</Text>
      {subtitle ? <Text style={sec.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const sec = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 14 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: TEXT },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", color: TEXT2, marginTop: 4 },
});

function CreateOwnerForm({ onCreated }: { onCreated: () => void }) {
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
    <View style={frm.card}>
      <Text style={frm.label}>اسم صاحب المطعم *</Text>
      <TextInput style={frm.input} value={name} onChangeText={setName} placeholder="الاسم الكامل" placeholderTextColor={TEXT2} textAlign="right" />

      <Text style={frm.label}>البريد الإلكتروني *</Text>
      <TextInput style={frm.input} value={email} onChangeText={setEmail} placeholder="owner@example.com" placeholderTextColor={TEXT2} keyboardType="email-address" autoCapitalize="none" />

      <Text style={frm.label}>المحافظة *</Text>
      <TouchableOpacity style={[frm.input, frm.govBtn]} onPress={() => setGovModal(true)}>
        <Text style={{ color: gov ? TEXT : TEXT2, fontFamily: "Inter_400Regular", fontSize: 15 }}>{gov || "اختر المحافظة"}</Text>
        <Feather name="chevron-down" size={16} color={TEXT2} />
      </TouchableOpacity>

      <Text style={frm.label}>كلمة المرور *</Text>
      <TextInput style={frm.input} value={password} onChangeText={setPassword} placeholder="كلمة مرور قوية" placeholderTextColor={TEXT2} secureTextEntry />

      <TouchableOpacity style={frm.btn} activeOpacity={0.85} onPress={handle} disabled={loading}>
        <Feather name="user-plus" size={18} color={BG} strokeWidth={2} />
        <Text style={frm.btnTxt}>{loading ? "جارٍ الإنشاء..." : "إنشاء حساب صاحب مطعم"}</Text>
      </TouchableOpacity>

      <Modal visible={govModal} transparent animationType="slide" onRequestClose={() => setGovModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }} onPress={() => setGovModal(false)}>
          <Pressable style={{ backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }} onPress={() => {}}>
            <Text style={{ color: TEXT, fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "right", marginBottom: 16 }}>اختر المحافظة</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {IRAQI_GOVERNORATES.map((g) => (
                <TouchableOpacity key={g} onPress={() => { setGov(g); setGovModal(false); }}
                  style={{ paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: BORDER, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: g === gov ? ACCENT : TEXT, fontFamily: "Inter_500Medium", fontSize: 16 }}>{g}</Text>
                  {g === gov && <Feather name="check" size={18} color={ACCENT} />}
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
  card: { margin: 16, backgroundColor: CARD, borderRadius: 18, padding: 18, gap: 8, borderWidth: 0.5, borderColor: BORDER },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: TEXT2, textAlign: "right", marginTop: 4 },
  input: { backgroundColor: CARD2, borderRadius: 12, borderWidth: 0.5, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 13, color: TEXT, fontFamily: "Inter_400Regular", fontSize: 15 },
  govBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  btn: { backgroundColor: TEXT, borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  btnTxt: { color: BG, fontSize: 16, fontFamily: "Inter_700Bold" },
});

function OwnerCard({ user, restaurant, onToggleActive }: { user: User; restaurant: Restaurant | undefined; onToggleActive: () => void }) {
  const isActive = user.isActive !== false;
  return (
    <View style={ow.card}>
      <View style={ow.row}>
        <View style={[ow.avatar, { backgroundColor: isActive ? `${ACCENT}22` : `${RED}22` }]}>
          <Feather name="user" size={22} color={isActive ? ACCENT : RED} strokeWidth={1.5} />
        </View>
        <View style={ow.info}>
          <Text style={ow.name}>{user.name}</Text>
          <Text style={ow.email}>{user.email}</Text>
          <Text style={ow.gov}>📍 {user.primaryGovernorate}</Text>
        </View>
        <View style={ow.right}>
          <View style={[ow.badge, { backgroundColor: isActive ? `${ACCENT}22` : `${RED}22` }]}>
            <Text style={[ow.badgeTxt, { color: isActive ? ACCENT : RED }]}>{isActive ? "نشط" : "موقوف"}</Text>
          </View>
          <TouchableOpacity style={[ow.toggleBtn, { backgroundColor: isActive ? `${RED}22` : `${ACCENT}22`, borderColor: isActive ? RED : ACCENT }]}
            onPress={onToggleActive} activeOpacity={0.8}>
            <Text style={[ow.toggleTxt, { color: isActive ? RED : ACCENT }]}>{isActive ? "إيقاف" : "تفعيل"}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {restaurant && (
        <View style={ow.restRow}>
          <Feather name="coffee" size={13} color={TEXT2} strokeWidth={1.5} />
          <Text style={ow.restName}>{restaurant.name}</Text>
          <Text style={ow.restGov}>{restaurant.governorate}</Text>
        </View>
      )}
    </View>
  );
}

const ow = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 10, backgroundColor: CARD, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: BORDER, gap: 10 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: TEXT },
  email: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2 },
  gov: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2 },
  right: { gap: 6, alignItems: "flex-end" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  toggleTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  restRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: CARD2, borderRadius: 8, padding: 8 },
  restName: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: TEXT },
  restGov: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXT2 },
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
  const [editingCommission, setEditingCommission] = useState(false);
  const [commInput, setCommInput] = useState((restaurant.commissionRate ?? 10).toString());

  const dues = restaurant.monthlyDues ?? 0;

  return (
    <View style={rc.card}>
      <View style={rc.row}>
        {restaurant.image ? (
          <Image source={{ uri: restaurant.image }} style={rc.img} />
        ) : (
          <View style={rc.imgPlaceholder}><Text style={{ fontSize: 22 }}>🍽️</Text></View>
        )}
        <View style={rc.info}>
          <Text style={rc.name}>{restaurant.name}</Text>
          <Text style={rc.gov}>📍 {restaurant.governorate} · {restaurant.category}</Text>
          {ownerUser && <Text style={rc.owner}>👤 {ownerUser.name}</Text>}
          <Text style={rc.menuCount}>{restaurant.menuItems.length} صنف في القائمة</Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={rc.deleteBtn}>
          <Feather name="trash-2" size={16} color={RED} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <View style={rc.statsRow}>
        <View style={rc.statBlock}>
          <Text style={rc.statLabel}>المستحقات</Text>
          <Text style={[rc.statValue, { color: dues > 0 ? ORANGE : ACCENT }]}>{dues.toLocaleString()} د.ع</Text>
        </View>
        <View style={rc.statDivider} />
        <View style={rc.statBlock}>
          <Text style={rc.statLabel}>العمولة</Text>
          {editingCommission ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <TextInput
                style={rc.commInput}
                value={commInput}
                onChangeText={setCommInput}
                keyboardType="numeric"
                autoFocus
              />
              <Text style={{ color: TEXT, fontFamily: "Inter_600SemiBold" }}>%</Text>
              <TouchableOpacity onPress={() => {
                const v = parseFloat(commInput);
                if (!isNaN(v) && v >= 0 && v <= 100) { onSetCommission(v); }
                setEditingCommission(false);
              }}>
                <Feather name="check" size={16} color={ACCENT} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { setCommInput((restaurant.commissionRate ?? 10).toString()); setEditingCommission(true); }}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={rc.statValue}>{restaurant.commissionRate ?? 10}%</Text>
              <Feather name="edit-2" size={12} color={TEXT2} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {dues > 0 && (
        <TouchableOpacity style={rc.clearBtn} onPress={onClearDues} activeOpacity={0.85}>
          <Feather name="check-circle" size={15} color={ACCENT} strokeWidth={1.5} />
          <Text style={rc.clearBtnTxt}>تصفية المستحقات</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const rc = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: CARD, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: BORDER, gap: 12 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  img: { width: 60, height: 60, borderRadius: 12, backgroundColor: CARD2 },
  imgPlaceholder: { width: 60, height: 60, borderRadius: 12, backgroundColor: CARD2, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: TEXT },
  gov: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2 },
  owner: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2 },
  menuCount: { fontSize: 12, fontFamily: "Inter_500Medium", color: ACCENT },
  deleteBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", backgroundColor: CARD2, borderRadius: 10, padding: 12 },
  statBlock: { flex: 1, alignItems: "center", gap: 4 },
  statDivider: { width: 1, backgroundColor: BORDER },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXT2 },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: TEXT },
  commInput: { backgroundColor: BG, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, color: TEXT, fontFamily: "Inter_700Bold", fontSize: 16, width: 48, textAlign: "center" },
  clearBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: `${ACCENT}15`, borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: `${ACCENT}44` },
  clearBtnTxt: { color: ACCENT, fontFamily: "Inter_600SemiBold", fontSize: 14 },
});

export default function AdminScreen() {
  const {
    isManager, users, restaurants, rooms, governorateImages,
    setOwnerActive, setCommissionRate, clearDues, deleteRestaurant,
    setGovernorateImage, theme, banUser, unbanUser, resetUserPassword,
    deleteRoom, verifyUser, revokeVerification,
  } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const colors = Colors[theme];
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [tab, setTab] = useState<Tab>("owners");
  const [selectedGov, setSelectedGov] = useState<string | null>(null);
  const [createdRefresh, setCreatedRefresh] = useState(0);
  const [verifyModal, setVerifyModal] = useState<{ userId: string; userName: string } | null>(null);
  const [pwModal, setPwModal] = useState<{ userId: string; userName: string } | null>(null);
  const [newPw, setNewPw] = useState("");

  if (!isManager) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: TEXT2 }}>غير مصرح لك بالدخول</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: TEXT }}>رجوع</Text>
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
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#111111", "#000000"]} style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>لوحة المدير</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t.key); }}
            style={[styles.tabItem, tab === t.key && styles.tabItemActive]}>
            <Feather name={t.icon as any} size={14} color={tab === t.key ? BG : TEXT2} strokeWidth={tab === t.key ? 2.5 : 1.5} />
            <Text style={[styles.tabLabel, { color: tab === t.key ? BG : TEXT2 }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
                  <Feather name="users" size={48} color={BORDER} strokeWidth={1} />
                  <Text style={styles.emptyTxt}>لا يوجد أصحاب مطاعم بعد</Text>
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
                  style={[styles.govFilter, { borderColor: selectedGov === null ? ACCENT : BORDER, backgroundColor: selectedGov === null ? `${ACCENT}22` : CARD }]}>
                  <Text style={[styles.govFilterTxt, { color: selectedGov === null ? ACCENT : TEXT2 }]}>الكل</Text>
                </TouchableOpacity>
                {IRAQI_GOVERNORATES.map((g) => (
                  <TouchableOpacity key={g} onPress={() => setSelectedGov(selectedGov === g ? null : g)}
                    style={[styles.govFilter, { borderColor: selectedGov === g ? ACCENT : BORDER, backgroundColor: selectedGov === g ? `${ACCENT}22` : CARD }]}>
                    <Text style={[styles.govFilterTxt, { color: selectedGov === g ? ACCENT : TEXT2 }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filteredRestaurants.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="coffee" size={48} color={BORDER} strokeWidth={1} />
                  <Text style={styles.emptyTxt}>لا توجد مطاعم</Text>
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
                  <View key={u.id} style={styles.userCard}>
                    <View style={styles.userAvatar}>
                      {u.avatar ? <Image source={{ uri: u.avatar }} style={styles.userAvatarImg} /> : (
                        <Text style={{ fontSize: 18 }}>👤</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Text style={styles.userName}>{u.name}</Text>
                        {verified && <VerifiedBadge size={13} />}
                      </View>
                      <Text style={styles.userEmail}>{u.email}</Text>
                      {u.primaryGovernorate && <Text style={styles.userGov}>📍 {u.primaryGovernorate}</Text>}
                      {verified && u.verifiedUntil && (
                        <Text style={{ fontSize: 10, color: BLUE, fontFamily: "Inter_500Medium" }}>
                          موثق حتى {new Date(u.verifiedUntil).toLocaleDateString("ar-IQ")}
                        </Text>
                      )}
                    </View>
                    <View style={{ gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => { setVerifyModal({ userId: u.id, userName: u.name }); }}
                        style={[styles.actionBtn, { borderColor: BLUE }]}
                      >
                        <Feather name="check-circle" size={12} color={BLUE} strokeWidth={2} />
                        <Text style={[styles.actionBtnTxt, { color: BLUE }]}>{verified ? "تجديد" : "توثيق"}</Text>
                      </TouchableOpacity>
                      {verified && (
                        <TouchableOpacity
                          onPress={() => { revokeVerification(u.id); showToast("تم إلغاء التوثيق", "success"); }}
                          style={[styles.actionBtn, { borderColor: ORANGE }]}
                        >
                          <Feather name="x-circle" size={12} color={ORANGE} strokeWidth={2} />
                          <Text style={[styles.actionBtnTxt, { color: ORANGE }]}>إلغاء</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => { setPwModal({ userId: u.id, userName: u.name }); setNewPw(""); }}
                        style={[styles.actionBtn, { borderColor: TEXT2 }]}
                      >
                        <Feather name="lock" size={12} color={TEXT2} strokeWidth={2} />
                        <Text style={[styles.actionBtnTxt, { color: TEXT2 }]}>كلمة المرور</Text>
                      </TouchableOpacity>
                      {u.isBanned ? (
                        <TouchableOpacity onPress={() => { unbanUser(u.id); showToast("تم رفع الحظر", "success"); }}
                          style={[styles.actionBtn, { borderColor: ACCENT }]}>
                          <Text style={[styles.actionBtnTxt, { color: ACCENT }]}>رفع الحظر</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => { banUser(u.id); showToast("تم حظر المستخدم", "success"); }}
                          style={[styles.actionBtn, { borderColor: RED }]}>
                          <Text style={[styles.actionBtnTxt, { color: RED }]}>حظر</Text>
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
                  <Feather name="mic" size={48} color={BORDER} strokeWidth={1} />
                  <Text style={styles.emptyTxt}>لا توجد غرف</Text>
                </View>
              ) : (
                rooms.map((room) => (
                  <View key={room.id} style={styles.roomCard}>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomOwner}>بواسطة {room.ownerName}</Text>
                    <Text style={styles.roomCode}>#{room.roomCode}</Text>
                    <TouchableOpacity onPress={() => { deleteRoom(room.id); showToast("تم حذف الغرفة", "success"); }}
                      style={[styles.actionBtn, { borderColor: RED, marginTop: 4 }]}>
                      <Feather name="trash-2" size={13} color={RED} strokeWidth={1.5} />
                      <Text style={[styles.actionBtnTxt, { color: RED }]}>حذف</Text>
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
                      style={styles.govCard}>
                      {img?.image ? <Image source={{ uri: img.image }} style={styles.govCardImg} /> : (
                        <View style={styles.govCardPlaceholder}><Text style={{ fontSize: 20 }}>🏛️</Text></View>
                      )}
                      <Text style={styles.govCardName} numberOfLines={1}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Verify User Modal ── */}
      <Modal visible={!!verifyModal} transparent animationType="slide" onRequestClose={() => setVerifyModal(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }} onPress={() => setVerifyModal(null)}>
          <Pressable style={{ backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 }} onPress={() => {}}>
            <View style={{ alignItems: "center", gap: 8 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: `${BLUE}22`, alignItems: "center", justifyContent: "center" }}>
                <Feather name="check-circle" size={26} color={BLUE} strokeWidth={1.5} />
              </View>
              <Text style={{ color: TEXT, fontFamily: "Inter_700Bold", fontSize: 18 }}>توثيق الحساب</Text>
              <Text style={{ color: TEXT2, fontFamily: "Inter_400Regular", fontSize: 14 }}>{verifyModal?.userName}</Text>
            </View>
            <Text style={{ color: TEXT2, fontFamily: "Inter_500Medium", fontSize: 14, textAlign: "center" }}>اختر مدة التوثيق</Text>
            {[{ label: "شهر واحد (1M)", months: 1 }, { label: "ثلاثة أشهر (3M)", months: 3 }, { label: "سنة كاملة (1Y)", months: 12 }].map((opt) => (
              <TouchableOpacity
                key={opt.months}
                style={{ backgroundColor: `${BLUE}22`, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: `${BLUE}55` }}
                onPress={() => {
                  if (verifyModal) {
                    verifyUser(verifyModal.userId, opt.months);
                    showToast(`تم توثيق ${verifyModal.userName} لمدة ${opt.label}`, "success");
                    setVerifyModal(null);
                  }
                }}
              >
                <Text style={{ color: BLUE, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setVerifyModal(null)} style={{ paddingVertical: 12, alignItems: "center" }}>
              <Text style={{ color: TEXT2, fontFamily: "Inter_500Medium" }}>إلغاء</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal visible={!!pwModal} transparent animationType="slide" onRequestClose={() => setPwModal(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }} onPress={() => setPwModal(null)}>
          <Pressable style={{ backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 }} onPress={() => {}}>
            <View style={{ alignItems: "center", gap: 8 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#F59E0B22", alignItems: "center", justifyContent: "center" }}>
                <Feather name="lock" size={24} color="#F59E0B" strokeWidth={1.5} />
              </View>
              <Text style={{ color: TEXT, fontFamily: "Inter_700Bold", fontSize: 18 }}>تغيير كلمة المرور</Text>
              <Text style={{ color: TEXT2, fontFamily: "Inter_400Regular", fontSize: 13 }}>{pwModal?.userName}</Text>
            </View>
            <TextInput
              style={{ backgroundColor: CARD2, borderRadius: 12, borderWidth: 0.5, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 13, color: TEXT, fontFamily: "Inter_400Regular", fontSize: 15 }}
              placeholder="كلمة المرور الجديدة"
              placeholderTextColor={TEXT2}
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
              <Text style={{ color: BG, fontFamily: "Inter_700Bold", fontSize: 15 }}>حفظ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPwModal(null)} style={{ paddingVertical: 10, alignItems: "center" }}>
              <Text style={{ color: TEXT2, fontFamily: "Inter_500Medium" }}>إلغاء</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: TEXT },
  tabBar: { borderBottomWidth: 0.5, borderBottomColor: BORDER },
  tabBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tabItem: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: CARD, borderWidth: 0.5, borderColor: BORDER,
  },
  tabItemActive: { backgroundColor: TEXT, borderColor: TEXT },
  tabLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  govFilter: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  govFilterTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTxt: { fontSize: 16, fontFamily: "Inter_500Medium", color: TEXT2 },
  userCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 10, backgroundColor: CARD, borderRadius: 14, padding: 12, gap: 12, borderWidth: 0.5, borderColor: BORDER },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: CARD2, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  userAvatarImg: { width: "100%", height: "100%" },
  userName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: TEXT },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2 },
  userGov: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXT2 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  actionBtnTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  roomCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: BORDER, gap: 4 },
  roomName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: TEXT },
  roomOwner: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2 },
  roomCode: { fontSize: 11, fontFamily: "Inter_500Medium", color: ACCENT },
  govCard: { width: 100, borderRadius: 12, overflow: "hidden", backgroundColor: CARD, borderWidth: 0.5, borderColor: BORDER },
  govCardImg: { width: "100%", aspectRatio: 1, resizeMode: "cover" },
  govCardPlaceholder: { width: "100%", aspectRatio: 1, backgroundColor: CARD2, alignItems: "center", justifyContent: "center" },
  govCardName: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: TEXT, textAlign: "center", paddingVertical: 6, paddingHorizontal: 4 },
});
