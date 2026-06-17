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
import type { User, Merchant, Order } from "@/context/AppContext";
import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/themeStore";
import { VerifiedBadge } from "@/components/VerifiedBadge";

type Tab = "merchants" | "orders" | "users" | "rooms" | "governorates" | "settings";

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

function CreateMerchantOwnerForm({ onCreated }: { onCreated: () => void }) {
  const c = useThemeStore((s) => s.tokens);
  const { createMerchantAccount } = useApp();
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
    const res = await createMerchantAccount(name.trim(), email.trim().toLowerCase(), gov, password);
    setLoading(false);
    if (res.success) {
      showToast("تم إنشاء حساب صاحب المتجر ✓", "success");
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
      <Text style={[frm.label, { color: c.textSecondary }]}>اسم صاحب المتجر *</Text>
      <TextInput style={[frm.input, { backgroundColor: c.backgroundTertiary, borderColor: c.border, color: c.text }]} value={name} onChangeText={setName} placeholder="الاسم الكامل" placeholderTextColor={c.textSecondary} textAlign="right" />

      <Text style={[frm.label, { color: c.textSecondary }]}>البريد الإلكتروني *</Text>
      <TextInput style={[frm.input, { backgroundColor: c.backgroundTertiary, borderColor: c.border, color: c.text }]} value={email} onChangeText={setEmail} placeholder="merchant@example.com" placeholderTextColor={c.textSecondary} keyboardType="email-address" autoCapitalize="none" />

      <Text style={[frm.label, { color: c.textSecondary }]}>المحافظة *</Text>
      <TouchableOpacity style={[frm.input, frm.govBtn, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]} onPress={() => setGovModal(true)}>
        <Text style={{ color: gov ? c.text : c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 15 }}>{gov || "اختر المحافظة"}</Text>
        <Feather name="chevron-down" size={16} color={c.textSecondary} />
      </TouchableOpacity>

      <Text style={[frm.label, { color: c.textSecondary }]}>كلمة المرور *</Text>
      <TextInput style={[frm.input, { backgroundColor: c.backgroundTertiary, borderColor: c.border, color: c.text }]} value={password} onChangeText={setPassword} placeholder="كلمة مرور قوية" placeholderTextColor={c.textSecondary} secureTextEntry />

      <TouchableOpacity style={[frm.btn, { backgroundColor: "#6C63FF" }]} activeOpacity={0.85} onPress={handle} disabled={loading}>
        <Feather name="user-plus" size={18} color="#fff" strokeWidth={2} />
        <Text style={[frm.btnTxt, { color: "#fff" }]}>{loading ? "جارٍ الإنشاء..." : "إنشاء حساب صاحب متجر"}</Text>
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

function MerchantCard({ user, merchant, onToggleActive, onSetCommission, onClearDues }: {
  user: User;
  merchant: Merchant | undefined;
  onToggleActive: () => void;
  onSetCommission?: (rate: number) => void;
  onClearDues?: () => void;
}) {
  const c = useThemeStore((s) => s.tokens);
  const isActive = user.isActive !== false;
  const tierColor = merchant?.tier === "gold" ? "#F59E0B" : merchant?.tier === "silver" ? "#9CA3AF" : "#CD7F32";
  const [editingComm, setEditingComm] = useState(false);
  const [commInput, setCommInput] = useState((merchant?.commissionRate ?? 10).toString());
  const dues = merchant?.monthlyDues ?? 0;

  return (
    <View style={[ow.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={ow.row}>
        <View style={[ow.avatar, { backgroundColor: isActive ? "#6C63FF22" : `${c.danger}22` }]}>
          <Feather name="shopping-bag" size={20} color={isActive ? "#6C63FF" : c.danger} strokeWidth={1.5} />
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
      {merchant && (
        <>
          <View style={[ow.restRow, { backgroundColor: c.backgroundTertiary }]}>
            <Feather name="package" size={13} color={tierColor} strokeWidth={1.5} />
            <Text style={[ow.restName, { color: c.text }]}>{merchant.name}</Text>
            <Text style={[ow.badgeTxt, { color: tierColor }]}>{merchant.tier === "gold" ? "🥇" : merchant.tier === "silver" ? "🥈" : "🥉"}</Text>
            <Text style={[ow.restGov, { color: c.textSecondary }]}>{merchant.governorate}</Text>
          </View>
          <View style={[ow.statsRow, { backgroundColor: c.backgroundTertiary }]}>
            <View style={ow.statBlock}>
              <Text style={[ow.statLabel, { color: c.textSecondary }]}>المستحقات</Text>
              <Text style={[ow.statValue, { color: dues > 0 ? "#F59E0B" : c.success }]}>{dues.toLocaleString()} د.ع</Text>
            </View>
            <View style={[ow.statDivider, { backgroundColor: c.border }]} />
            <View style={ow.statBlock}>
              <Text style={[ow.statLabel, { color: c.textSecondary }]}>العمولة</Text>
              {editingComm ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <TextInput
                    style={[ow.commInput, { backgroundColor: c.background, color: c.text }]}
                    value={commInput}
                    onChangeText={setCommInput}
                    keyboardType="numeric"
                    autoFocus
                  />
                  <Text style={{ color: c.text, fontFamily: "Inter_600SemiBold" }}>%</Text>
                  <TouchableOpacity onPress={() => {
                    const v = parseFloat(commInput);
                    if (!isNaN(v) && v >= 0 && v <= 100) { onSetCommission?.(v); }
                    setEditingComm(false);
                  }}>
                    <Feather name="check" size={16} color={c.success} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => { setCommInput((merchant.commissionRate ?? 10).toString()); setEditingComm(true); }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[ow.statValue, { color: c.text }]}>{merchant.commissionRate ?? 10}%</Text>
                  <Feather name="edit-2" size={12} color={c.textSecondary} strokeWidth={1.5} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {dues > 0 && onClearDues && (
            <TouchableOpacity style={[ow.clearBtn, { backgroundColor: `${c.success}15`, borderColor: `${c.success}44` }]} onPress={onClearDues} activeOpacity={0.85}>
              <Feather name="check-circle" size={15} color={c.success} strokeWidth={1.5} />
              <Text style={[ow.clearBtnTxt, { color: c.success }]}>تصفية المستحقات</Text>
            </TouchableOpacity>
          )}
        </>
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
  statsRow: { flexDirection: "row", borderRadius: 10, padding: 12 },
  statBlock: { flex: 1, alignItems: "center", gap: 4 },
  statDivider: { width: 1 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  commInput: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, fontFamily: "Inter_700Bold", fontSize: 16, width: 48, textAlign: "center" },
  clearBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, paddingVertical: 10, borderWidth: 1 },
  clearBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});

const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "انتظار", color: "#F59E0B" },
  warehouse: { label: "المستودع", color: "#6C63FF" },
  in_transit: { label: "في الطريق", color: "#3B82F6" },
  delivered: { label: "تم التسليم", color: "#10B981" },
  returned: { label: "مرتجع", color: "#EF4444" },
};


export default function AdminScreen() {
  const {
    isManager, users, rooms, governorateImages,
    setOwnerActive,
    setGovernorateImage, theme, banUser, unbanUser, resetUserPassword,
    deleteRoom, verifyUser, revokeVerification,
    merchants, orders, updateOrderStatus, updateMerchantProfile,
  } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  useColors();
  const c = useThemeStore((s) => s.tokens);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [tab, setTab] = useState<Tab>("merchants");
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

  const merchantOwnerUsers = users.filter((u) => u.role === "MERCHANT_OWNER" || u.role === "RESTAURANT_OWNER");

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "merchants", label: "المتاجر", icon: "shopping-bag" },
    { key: "orders", label: "الطلبات", icon: "package" },
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

          {/* ── MERCHANTS TAB ── */}
          {tab === "merchants" && (
            <View>
              <SectionHeader title="إنشاء حساب صاحب متجر" subtitle="سيتم إنشاء متجر فارغ تلقائياً عند إنشاء الحساب" />
              <CreateMerchantOwnerForm onCreated={() => setCreatedRefresh((p) => p + 1)} />

              {merchantOwnerUsers.length > 0 && (
                <>
                  <SectionHeader title={`أصحاب المتاجر (${merchantOwnerUsers.length})`} />
                  {merchantOwnerUsers.map((u) => {
                    const merch = merchants.find((m) => m.ownerId === u.id);
                    return (
                      <MerchantCard
                        key={u.id}
                        user={u}
                        merchant={merch}
                        onToggleActive={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setOwnerActive(u.id, u.isActive === false);
                          showToast(u.isActive !== false ? "تم إيقاف الحساب" : "تم تفعيل الحساب", "success");
                        }}
                        onSetCommission={merch ? (rate) => {
                          updateMerchantProfile(merch.id, { commissionRate: rate });
                          showToast(`تم تحديث العمولة إلى ${rate}%`, "success");
                        } : undefined}
                        onClearDues={merch ? () => {
                          updateMerchantProfile(merch.id, { monthlyDues: 0 });
                          showToast("تمت تصفية المستحقات", "success");
                        } : undefined}
                      />
                    );
                  })}
                </>
              )}

              {merchantOwnerUsers.length === 0 && (
                <View style={styles.emptyState}>
                  <Feather name="shopping-bag" size={48} color={c.border} strokeWidth={1} />
                  <Text style={[styles.emptyTxt, { color: c.textSecondary }]}>لا يوجد أصحاب متاجر بعد</Text>
                </View>
              )}
            </View>
          )}

          {/* ── ORDERS TAB ── */}
          {tab === "orders" && (
            <View>
              <SectionHeader title={`الطلبات (${orders.length})`} subtitle="جميع طلبات منصة سفرة بابل" />
              {orders.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="package" size={48} color={c.border} strokeWidth={1} />
                  <Text style={[styles.emptyTxt, { color: c.textSecondary }]}>لا توجد طلبات بعد</Text>
                </View>
              ) : (
                [...orders].reverse().map((order) => {
                  const merchant = merchants.find((m) => m.id === order.merchantId);
                  const customer = users.find((u) => u.id === order.customerId);
                  const st = ORDER_STATUS_LABELS[order.status] ?? { label: order.status, color: "#6B7280" };
                  return (
                    <View key={order.id} style={[styles.roomCard, { backgroundColor: c.card, borderColor: c.border }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={[styles.roomName, { color: c.text }]}>#{order.id.slice(-6).toUpperCase()}</Text>
                        <View style={{ backgroundColor: `${st.color}22`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: st.color }}>{st.label}</Text>
                        </View>
                      </View>
                      {merchant && <Text style={[styles.roomOwner, { color: c.textSecondary }]}>🏪 {merchant.name}</Text>}
                      {customer && <Text style={[styles.roomOwner, { color: c.textSecondary }]}>👤 {customer.name}</Text>}
                      <Text style={[styles.roomCode, { color: c.success }]}>{order.totalIQD.toLocaleString()} د.ع</Text>
                      <Text style={[styles.roomOwner, { color: c.textSecondary, marginTop: 2 }]}>
                        {order.items.map((i) => `${i.productName} ×${i.quantity}`).join("، ")}
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                        <View style={{ backgroundColor: `${c.success}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                          <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: c.success }}>
                            عمولة: {order.commissionAmount.toLocaleString()} د.ع
                          </Text>
                        </View>
                        {order.affiliateCut > 0 && (
                          <View style={{ backgroundColor: "#6C63FF18", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                            <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#6C63FF" }}>
                              مؤثر: {order.affiliateCut.toLocaleString()} د.ع
                            </Text>
                          </View>
                        )}
                        <View style={{ backgroundColor: "#3B82F618", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                          <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#3B82F6" }}>
                            صافي المنصة: {order.platformCut.toLocaleString()} د.ع
                          </Text>
                        </View>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }} contentContainerStyle={{ gap: 6 }}>
                        {(["pending", "warehouse", "in_transit", "delivered", "returned"] as const).map((s) => {
                          const sl = ORDER_STATUS_LABELS[s];
                          return (
                            <TouchableOpacity key={s}
                              onPress={() => { updateOrderStatus(order.id, s); showToast(`تم تحديث الحالة: ${sl.label}`, "success"); }}
                              style={[styles.actionBtn, { borderColor: order.status === s ? sl.color : c.border, backgroundColor: order.status === s ? `${sl.color}22` : "transparent" }]}>
                              <Text style={[styles.actionBtnTxt, { color: order.status === s ? sl.color : c.textSecondary }]}>{sl.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
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
              <View style={[styles.settingsRow, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.settingsRowLeft}>
                  <View style={[styles.settingsIconBox, { backgroundColor: "#6C63FF22" }]}>
                    <Feather name="shopping-bag" size={18} color="#6C63FF" strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingsRowTitle, { color: c.text }]}>سفرة بابل — السوق</Text>
                    <Text style={[styles.settingsRowSubtitle, { color: c.textSecondary }]}>منصة التجارة المحلية — نشطة</Text>
                  </View>
                </View>
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
