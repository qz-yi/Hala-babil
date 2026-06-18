import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "@/store/themeStore";
import { useApp, type Order, type OrderStatus } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: string; bg: string }> = {
  pending:   { label: "قيد الانتظار", color: "#F59E0B", icon: "clock",        bg: "#F59E0B18" },
  accepted:  { label: "تم القبول",   color: "#3B82F6", icon: "check-circle",  bg: "#3B82F618" },
  shipped:   { label: "قيد الشحن",   color: "#8B5CF6", icon: "truck",         bg: "#8B5CF618" },
  delivered: { label: "تم التوصيل", color: "#10B981", icon: "package",        bg: "#10B98118" },
  cancelled: { label: "ملغي",        color: "#EF4444", icon: "x-circle",      bg: "#EF444418" },
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: "الدفع عند الاستلام",
  zaincash: "زين كاش",
  fastpay: "فاست باي",
  dafaa: "دفعة",
};

type FilterTab = "all" | OrderStatus;
const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",       label: "الكل" },
  { key: "pending",   label: "انتظار" },
  { key: "accepted",  label: "مقبول" },
  { key: "shipped",   label: "شحن" },
  { key: "delivered", label: "مُوصَّل" },
  { key: "cancelled", label: "ملغي" },
];

function OrderDetailModal({
  order,
  visible,
  onClose,
  onCancel,
  merchant,
  c,
}: {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
  onCancel: () => void;
  merchant: any;
  c: any;
}) {
  if (!order) return null;
  const cfg = STATUS_CONFIG[order.status];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.detailOverlay} onPress={onClose} />
      <View style={[st.detailSheet, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={[st.sheetHandle, { backgroundColor: c.border }]} />

        {/* Status header */}
        <View style={[st.detailStatusBanner, { backgroundColor: cfg.bg }]}>
          <Feather name={cfg.icon as any} size={20} color={cfg.color} strokeWidth={1.5} />
          <Text style={{ color: cfg.color, fontFamily: "Inter_700Bold", fontSize: 16 }}>{cfg.label}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
          {/* Merchant */}
          {merchant && (
            <View style={[st.detailSection, { backgroundColor: c.backgroundSecondary, borderColor: c.border }]}>
              <Text style={[st.detailSectionTitle, { color: c.textSecondary }]}>المتجر</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
                {merchant.logo ? (
                  <Image source={{ uri: merchant.logo }} style={st.merchantLogoSm} />
                ) : (
                  <View style={[st.merchantLogoFallback, { backgroundColor: `${c.accent}22` }]}>
                    <Text style={{ color: c.accent, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                      {merchant.name[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={{ color: c.text, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>{merchant.name}</Text>
              </View>
            </View>
          )}

          {/* Items */}
          <View style={[st.detailSection, { backgroundColor: c.backgroundSecondary, borderColor: c.border }]}>
            <Text style={[st.detailSectionTitle, { color: c.textSecondary }]}>الأصناف</Text>
            {order.items.map((item, i) => (
              <View key={i} style={[st.itemRow, { borderBottomColor: c.border, borderBottomWidth: i < order.items.length - 1 ? 0.5 : 0 }]}>
                <Text style={{ color: c.text, fontFamily: "Inter_500Medium", fontSize: 14, flex: 1 }} numberOfLines={2}>
                  {item.productName}
                </Text>
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                  ×{item.quantity}
                </Text>
                <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold", fontSize: 14, minWidth: 80, textAlign: "left" }}>
                  {(item.productPrice * item.quantity).toLocaleString()} IQD
                </Text>
              </View>
            ))}
          </View>

          {/* Total + Payment */}
          <View style={[st.detailSection, { backgroundColor: c.backgroundSecondary, borderColor: c.border }]}>
            <View style={st.totalRow}>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14 }}>طريقة الدفع</Text>
              <Text style={{ color: c.text, fontFamily: "Inter_500Medium", fontSize: 14 }}>
                {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </Text>
            </View>
            {order.address && (
              <View style={[st.totalRow, { marginTop: 8 }]}>
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14 }}>العنوان</Text>
                <Text style={{ color: c.text, fontFamily: "Inter_500Medium", fontSize: 13, flex: 1, textAlign: "left" }}>
                  {order.address}
                </Text>
              </View>
            )}
            <View style={[st.totalRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: c.border }]}>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 16 }}>المجموع</Text>
              <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold", fontSize: 18 }}>
                {order.totalIQD.toLocaleString()} IQD
              </Text>
            </View>
          </View>

          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" }}>
            رقم الطلب: {order.id.slice(0, 12).toUpperCase()}
          </Text>
        </ScrollView>

        {/* Cancel button */}
        {order.status === "pending" && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 }}>
            <TouchableOpacity onPress={onCancel} style={{ borderRadius: 16, overflow: "hidden" }}>
              <LinearGradient colors={["#EF4444", "#c0392b"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.cancelOrderBtn}>
                <Feather name="x-circle" size={16} color="#fff" strokeWidth={2} />
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 }}>إلغاء الطلب</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={onClose} style={{ paddingBottom: 20, alignItems: "center" }}>
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 15 }}>إغلاق</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function MyOrdersScreen() {
  const c = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;
  const { showToast } = useToast();

  const { getMyOrders, merchants, cancelOrder } = useApp();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const allOrders = getMyOrders();

  const filtered = useMemo(() => {
    if (activeFilter === "all") return allOrders;
    return allOrders.filter((o) => o.status === activeFilter);
  }, [allOrders, activeFilter]);

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  const handleCancelFromDetail = () => {
    if (!selectedOrder) return;
    setConfirmCancelId(selectedOrder.id);
  };

  const confirmCancel = () => {
    if (!confirmCancelId) return;
    cancelOrder(confirmCancelId);
    setConfirmCancelId(null);
    setDetailVisible(false);
    setSelectedOrder(null);
    showToast("تم إلغاء الطلب", "error");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const selectedMerchant = selectedOrder
    ? merchants.find((m) => m.id === selectedOrder.merchantId)
    : null;

  const renderOrder = ({ item: order }: { item: Order }) => {
    const cfg = STATUS_CONFIG[order.status];
    const merchant = merchants.find((m) => m.id === order.merchantId);
    const date = new Date(order.createdAt);
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

    return (
      <TouchableOpacity
        onPress={() => handleOpenDetail(order)}
        activeOpacity={0.86}
        style={[st.orderCard, { backgroundColor: c.card, borderColor: c.border }]}
      >
        {/* Status bar accent */}
        <View style={[st.orderAccent, { backgroundColor: cfg.color }]} />

        <View style={{ flex: 1, padding: 14 }}>
          {/* Top row */}
          <View style={st.orderTopRow}>
            <View style={[st.statusChip, { backgroundColor: cfg.bg }]}>
              <Feather name={cfg.icon as any} size={11} color={cfg.color} strokeWidth={2} />
              <Text style={{ color: cfg.color, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>{cfg.label}</Text>
            </View>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>{dateStr}</Text>
          </View>

          {/* Merchant name */}
          {merchant && (
            <Text style={{ color: c.text, fontFamily: "Inter_600SemiBold", fontSize: 15, marginTop: 8 }}>
              {merchant.name}
            </Text>
          )}

          {/* Items summary */}
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 3 }} numberOfLines={1}>
            {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(" · ")}
          </Text>

          {/* Bottom row */}
          <View style={st.orderBottomRow}>
            <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold", fontSize: 15 }}>
              {order.totalIQD.toLocaleString()} IQD
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                {order.items.length} صنف
              </Text>
              <Feather name="chevron-left" size={14} color={c.textSecondary} strokeWidth={1.5} />
            </View>
          </View>

          {/* Cancel shortcut for pending */}
          {order.status === "pending" && (
            <TouchableOpacity
              onPress={() => setConfirmCancelId(order.id)}
              style={st.quickCancelBtn}
            >
              <Feather name="x" size={11} color="#EF4444" strokeWidth={2} />
              <Text style={{ color: "#EF4444", fontFamily: "Inter_500Medium", fontSize: 12 }}>إلغاء</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[st.root, { backgroundColor: c.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[`${c.accent}18`, "transparent"]}
        style={[st.header, { paddingTop: topPad + 10 }]}
      >
        <View style={st.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[st.backBtn, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}>
            <Feather name="arrow-left" size={20} color={c.text} strokeWidth={1.5} />
          </TouchableOpacity>
          <View>
            <Text style={[st.headerTitle, { color: c.text }]}>طلباتي</Text>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
              {allOrders.length} طلب
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {FILTER_TABS.map((tab) => {
              const active = activeFilter === tab.key;
              const count = tab.key === "all" ? allOrders.length : allOrders.filter((o) => o.status === tab.key).length;
              const cfg = tab.key !== "all" ? STATUS_CONFIG[tab.key as OrderStatus] : null;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => { Haptics.selectionAsync(); setActiveFilter(tab.key); }}
                  style={[
                    st.filterChip,
                    {
                      backgroundColor: active ? (cfg?.color ?? c.accent) + "22" : c.backgroundTertiary,
                      borderColor: active ? (cfg?.color ?? c.accent) : c.border,
                    },
                  ]}
                >
                  <Text style={{
                    color: active ? (cfg?.color ?? c.accent) : c.text,
                    fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular",
                    fontSize: 13,
                  }}>
                    {tab.label}
                    {count > 0 ? ` (${count})` : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <View style={st.emptyState}>
          <Feather name="shopping-bag" size={60} color={c.border} strokeWidth={0.8} />
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", marginTop: 16, textAlign: "center", fontSize: 15, lineHeight: 24 }}>
            {allOrders.length === 0 ? "لا توجد طلبات بعد\nتسوق من سوق سفرة بابل!" : "لا توجد طلبات بهذا التصنيف"}
          </Text>
          {allOrders.length === 0 && (
            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
              <LinearGradient colors={["#7C3AED", "#4F46E5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.shopBtn}>
                <Feather name="shopping-bag" size={15} color="#fff" strokeWidth={2} />
                <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>تصفح المنتجات</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: botPad + 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onCancel={handleCancelFromDetail}
        merchant={selectedMerchant}
        c={c}
      />

      {/* Cancel Confirm Modal */}
      <Modal visible={!!confirmCancelId} transparent animationType="fade" onRequestClose={() => setConfirmCancelId(null)}>
        <Pressable style={st.confirmOverlay} onPress={() => setConfirmCancelId(null)}>
          <Pressable style={[st.confirmCard, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => {}}>
            <View style={[st.confirmIcon, { backgroundColor: "#EF444418" }]}>
              <Feather name="x-circle" size={26} color="#EF4444" strokeWidth={1.5} />
            </View>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 17 }}>إلغاء الطلب؟</Text>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
              سيتم إلغاء الطلب ولا يمكن التراجع عن هذا الإجراء.
            </Text>
            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              <TouchableOpacity onPress={() => setConfirmCancelId(null)} style={[st.confirmCancelBtn, { borderColor: c.border }]}>
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium" }}>تراجع</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmCancel} style={{ flex: 1, borderRadius: 14, overflow: "hidden" }}>
                <LinearGradient colors={["#EF4444", "#c0392b"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.confirmOkBtn}>
                  <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 }}>إلغاء الطلب</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, gap: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: "center", justifyContent: "center", borderWidth: 0.5,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  orderCard: {
    borderRadius: 18, borderWidth: 0.5,
    flexDirection: "row", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  orderAccent: { width: 4, borderRadius: 2 },
  orderTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  orderBottomRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginTop: 10,
  },
  quickCancelBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-end", marginTop: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, backgroundColor: "#EF444414", borderWidth: 0.5, borderColor: "#EF444444",
  },
  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32,
  },
  shopBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
  },
  // Detail modal
  detailOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
  },
  detailSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    maxHeight: "88%", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 0.5, borderLeftWidth: 0.5, borderRightWidth: 0.5,
    overflow: "hidden",
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginTop: 10, marginBottom: 6,
  },
  detailStatusBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  detailSection: {
    borderRadius: 16, borderWidth: 0.5, padding: 14,
  },
  detailSectionTitle: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase", letterSpacing: 1,
  },
  itemRow: {
    flexDirection: "row", alignItems: "center",
    gap: 10, paddingVertical: 10,
  },
  totalRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
  },
  cancelOrderBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 16,
  },
  merchantLogoSm: { width: 38, height: 38, borderRadius: 10, resizeMode: "cover" },
  merchantLogoFallback: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  // Confirm modal
  confirmOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
  },
  confirmCard: {
    width: "84%", maxWidth: 340, borderRadius: 24, borderWidth: 0.5,
    padding: 24, alignItems: "center", gap: 12,
  },
  confirmIcon: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  confirmCancelBtn: {
    flex: 1, height: 48, borderRadius: 14, borderWidth: 0.5,
    alignItems: "center", justifyContent: "center",
  },
  confirmOkBtn: {
    height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
});
