import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { useThemeStore } from "@/store/themeStore";
import { useApp, type Product, type Order, type CommerceTier } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

type Tab = "dashboard" | "catalog" | "orders";

const ORDER_STATUSES: Record<string, { label: string; color: string }> = {
  pending:    { label: "قيد الانتظار",   color: "#F59E0B" },
  warehouse:  { label: "في المستودع",    color: "#3B82F6" },
  in_transit: { label: "قيد التوصيل",   color: "#8B5CF6" },
  delivered:  { label: "تم التوصيل",    color: "#10B981" },
  returned:   { label: "مُعاد",          color: "#EF4444" },
};

const TIER_COLORS: Record<CommerceTier, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold:   "#FFD700",
};

const ORDER_STATUS_FLOW: string[] = ["pending", "warehouse", "in_transit", "delivered"];

export default function MyMerchantScreen() {
  const c = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { currentUser, isMerchantOwner, getMyMerchant, products, orders, addProduct, updateProduct, deleteProduct, updateOrderStatus } = useApp();
  const { showToast } = useToast();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const [tab, setTab] = useState<Tab>("dashboard");
  const [addProductVisible, setAddProductVisible] = useState(false);

  useEffect(() => {
    if (!currentUser) router.replace("/(auth)/login");
  }, [currentUser]);

  if (!currentUser || !isMerchantOwner) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background, padding: 32, gap: 20 }}>
        <Feather name="lock" size={52} color={c.textSecondary} strokeWidth={1} />
        <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20, textAlign: "center" }}>
          هذه الصفحة للتجار فقط
        </Text>
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 24 }}>
          تواصل مع الإدارة لتفعيل حساب تاجر
        </Text>
      </View>
    );
  }

  const merchant = getMyMerchant();
  const myProducts = useMemo(() => products.filter((p) => p.merchantId === merchant?.id), [products, merchant]);
  const myOrders = useMemo(
    () => orders.filter((o) => o.merchantId === merchant?.id).sort((a, b) => b.createdAt - a.createdAt),
    [orders, merchant]
  );

  const totalRevenue = myOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.totalIQD, 0);
  const pendingOrders = myOrders.filter((o) => o.status === "pending").length;

  if (!merchant) return null;

  const tierColor = TIER_COLORS[merchant.tier] ?? "#C0C0C0";

  return (
    <View style={[st.root, { backgroundColor: c.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[`${tierColor}22`, c.background]}
        style={[st.header, { paddingTop: topPad + 8, borderBottomColor: c.border }]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={[st.storeName, { color: c.text }]}>{merchant.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              <View style={[st.tierBadge, { backgroundColor: `${tierColor}22`, borderColor: tierColor }]}>
                <Feather name="award" size={11} color={tierColor} strokeWidth={1.5} />
                <Text style={{ color: tierColor, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
                  {merchant.tier === "gold" ? "ذهبي" : merchant.tier === "silver" ? "فضي" : "برونزي"}
                </Text>
              </View>
              <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" }}>
                {merchant.governorate}
              </Text>
            </View>
          </View>
          <View style={[st.merchantIcon, { backgroundColor: `${tierColor}22` }]}>
            <Feather name="package" size={28} color={tierColor} strokeWidth={1.2} />
          </View>
        </View>

        {/* Stats row */}
        <View style={st.statsRow}>
          {[
            { label: "الإيرادات", value: `${(totalRevenue / 1000).toFixed(0)}K IQD`, icon: "trending-up", color: "#10B981" },
            { label: "الطلبات المعلقة", value: String(pendingOrders), icon: "clock", color: "#F59E0B" },
            { label: "المنتجات", value: String(myProducts.length), icon: "box", color: c.accent },
            { label: "إجمالي المبيعات", value: String(merchant.monthlySales), icon: "shopping-bag", color: "#8B5CF6" },
          ].map((stat) => (
            <View key={stat.label} style={[st.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Feather name={stat.icon as any} size={18} color={stat.color} strokeWidth={1.5} />
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 16 }}>{stat.value}</Text>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Commission info */}
        <View style={[st.commissionRow, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}>
          <Feather name="percent" size={14} color={c.accent} strokeWidth={1.5} />
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
            عمولتك الحالية:{" "}
            <Text style={{ color: c.accent, fontFamily: "Inter_600SemiBold" }}>
              {merchant.tier === "gold" ? "1%" : merchant.tier === "silver" ? "1.5%" : "2%"}
            </Text>
            {" "}· {merchant.tier === "bronze" ? "0–100 مبيعة" : merchant.tier === "silver" ? "101–500 مبيعة" : "500+ مبيعة"}
          </Text>
        </View>

        {/* Tabs */}
        <View style={[st.tabs, { borderColor: c.border }]}>
          {([
            { key: "dashboard", label: "لوحة التحكم", icon: "bar-chart-2" },
            { key: "catalog",   label: "المنتجات",   icon: "box" },
            { key: "orders",    label: "الطلبات",     icon: "shopping-bag" },
          ] as { key: Tab; label: string; icon: string }[]).map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => { Haptics.selectionAsync(); setTab(t.key); }}
              style={[
                st.tabBtn,
                tab === t.key && { borderBottomColor: c.accent, borderBottomWidth: 2 },
              ]}
            >
              <Feather name={t.icon as any} size={14} color={tab === t.key ? c.accent : c.textSecondary} strokeWidth={1.5} />
              <Text style={{ color: tab === t.key ? c.accent : c.textSecondary, fontFamily: tab === t.key ? "Inter_600SemiBold" : "Inter_400Regular", fontSize: 13 }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Tab Content */}
      {tab === "dashboard" && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: botPad + 100 }}>
          <Text style={[st.sectionTitle, { color: c.text }]}>آخر الطلبات</Text>
          {myOrders.slice(0, 5).length === 0 ? (
            <View style={[st.emptyBox, { borderColor: c.border }]}>
              <Feather name="inbox" size={36} color={c.border} strokeWidth={1} />
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>لا توجد طلبات بعد</Text>
            </View>
          ) : (
            myOrders.slice(0, 5).map((order) => (
              <OrderCard key={order.id} order={order} c={c} onAdvance={(o) => {
                const idx = ORDER_STATUS_FLOW.indexOf(o.status);
                if (idx < ORDER_STATUS_FLOW.length - 1) {
                  updateOrderStatus?.(o.id, ORDER_STATUS_FLOW[idx + 1] as any);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }} />
            ))
          )}
        </ScrollView>
      )}

      {tab === "catalog" && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: botPad + 100 }}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setAddProductVisible(true); }}
            style={st.addProductBtn}
          >
            <LinearGradient colors={["#7C3AED", "#4F46E5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.addProductGrad}>
              <Feather name="plus" size={18} color="#fff" strokeWidth={2.5} />
              <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>إضافة منتج جديد</Text>
            </LinearGradient>
          </TouchableOpacity>

          {myProducts.length === 0 ? (
            <View style={[st.emptyBox, { borderColor: c.border }]}>
              <Feather name="box" size={36} color={c.border} strokeWidth={1} />
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>لا توجد منتجات بعد</Text>
            </View>
          ) : (
            myProducts.map((product) => (
              <View key={product.id} style={[st.productRow, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[st.productRowImg, { backgroundColor: c.backgroundTertiary }]}>
                  <Feather name="image" size={22} color={c.border} strokeWidth={1} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: c.text, fontFamily: "Inter_600SemiBold", fontSize: 14 }} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold", fontSize: 14 }}>
                    {product.price.toLocaleString()} IQD
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={[st.stockBadge, { backgroundColor: product.stock > 0 ? "#10B98118" : "#EF444418" }]}>
                      <Text style={{ color: product.stock > 0 ? "#10B981" : "#EF4444", fontSize: 11, fontFamily: "Inter_500Medium" }}>
                        {product.stock > 0 ? `${product.stock} قطعة` : "نفد"}
                      </Text>
                    </View>
                    <View style={[st.stockBadge, { backgroundColor: c.backgroundTertiary }]}>
                      <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular" }}>
                        {product.category}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{ gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateProduct?.(product.id, { isActive: !product.isActive });
                      showToast(product.isActive ? "تم إخفاء المنتج" : "تم تفعيل المنتج", "info");
                    }}
                    style={[st.iconBtn, { backgroundColor: c.backgroundTertiary }]}
                  >
                    <Feather name={product.isActive ? "eye" : "eye-off"} size={16} color={c.textSecondary} strokeWidth={1.5} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert("حذف المنتج", "هل أنت متأكد؟", [
                        { text: "إلغاء", style: "cancel" },
                        { text: "حذف", style: "destructive", onPress: () => { deleteProduct?.(product.id); showToast("تم حذف المنتج", "info"); } },
                      ]);
                    }}
                    style={[st.iconBtn, { backgroundColor: "#EF444418" }]}
                  >
                    <Feather name="trash-2" size={16} color="#EF4444" strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {tab === "orders" && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: botPad + 100 }}>
          {myOrders.length === 0 ? (
            <View style={[st.emptyBox, { borderColor: c.border }]}>
              <Feather name="shopping-bag" size={36} color={c.border} strokeWidth={1} />
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>لا توجد طلبات بعد</Text>
            </View>
          ) : (
            myOrders.map((order) => (
              <OrderCard key={order.id} order={order} c={c} onAdvance={(o) => {
                const idx = ORDER_STATUS_FLOW.indexOf(o.status);
                if (idx < ORDER_STATUS_FLOW.length - 1) {
                  updateOrderStatus?.(o.id, ORDER_STATUS_FLOW[idx + 1] as any);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  showToast("تم تحديث حالة الطلب", "success");
                }
              }} />
            ))
          )}
        </ScrollView>
      )}

      <AddProductModal
        visible={addProductVisible}
        merchantId={merchant.id}
        onClose={() => setAddProductVisible(false)}
        onAdd={(data) => {
          addProduct(data);
          showToast("تم إضافة المنتج بنجاح!", "success");
          setAddProductVisible(false);
        }}
      />
    </View>
  );
}

function OrderCard({ order, c, onAdvance }: { order: Order; c: any; onAdvance: (o: Order) => void }) {
  const status = ORDER_STATUSES[order.status] ?? { label: order.status, color: "#888" };
  const canAdvance = order.status !== "delivered" && order.status !== "returned";
  return (
    <View style={[st.orderCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View>
          <Text style={{ color: c.text, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
            طلب #{order.id.slice(-6).toUpperCase()}
          </Text>
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
            {new Date(order.createdAt).toLocaleDateString("ar-IQ")} · {order.items.length} منتج
          </Text>
        </View>
        <View style={[st.statusBadge, { backgroundColor: `${status.color}18`, borderColor: status.color }]}>
          <Text style={{ color: status.color, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>{status.label}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <View>
          <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold", fontSize: 16 }}>
            {order.totalIQD.toLocaleString()} IQD
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular" }}>
            {order.paymentMethod === "cod" ? "كاش عند الاستلام" : order.paymentMethod}
          </Text>
        </View>
        {canAdvance && (
          <TouchableOpacity
            onPress={() => onAdvance(order)}
            style={[st.advanceBtn, { backgroundColor: c.accent }]}
          >
            <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>تقدم الحالة</Text>
            <Feather name="arrow-left" size={14} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const PRODUCT_CATEGORIES = ["fashion","electronics","food","beauty","home","sports","other"];

function AddProductModal({
  visible,
  merchantId,
  onClose,
  onAdd,
}: {
  visible: boolean;
  merchantId: string;
  onClose: () => void;
  onAdd: (data: any) => void;
}) {
  const c = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !price.trim() || !stock.trim()) return;
    onAdd({
      merchantId,
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      images: [],
      stock: parseInt(stock),
      sku: sku.trim() || undefined,
      category,
      isActive: true,
    });
    setName(""); setPrice(""); setStock(""); setSku(""); setDescription(""); setCategory("other");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" }} onPress={onClose} />
      <KeyboardAvoidingView behavior="padding" style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <View style={[st.addModal, { backgroundColor: c.card, borderColor: c.border, paddingBottom: (Platform.OS === "web" ? 20 : insets.bottom) + 16 }]}>
          <View style={[{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: "center", marginBottom: 16 }]} />
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center", marginBottom: 16 }}>
            منتج جديد
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {[
              { value: name, set: setName, placeholder: "اسم المنتج *", icon: "tag" as const },
              { value: price, set: setPrice, placeholder: "السعر (IQD) *", icon: "dollar-sign" as const, keyboard: "decimal-pad" as const },
              { value: stock, set: setStock, placeholder: "المخزون *", icon: "package" as const, keyboard: "number-pad" as const },
              { value: sku, set: setSku, placeholder: "رمز SKU (اختياري)", icon: "hash" as const },
            ].map((field) => (
              <View key={field.placeholder} style={[st.inputWrap, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}>
                <Feather name={field.icon} size={16} color={c.textSecondary} strokeWidth={1.5} />
                <TextInput
                  value={field.value}
                  onChangeText={field.set}
                  placeholder={field.placeholder}
                  placeholderTextColor={c.textSecondary}
                  keyboardType={(field as any).keyboard ?? "default"}
                  style={{ flex: 1, color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}
                  textAlign="right"
                />
              </View>
            ))}
            <View style={[st.inputWrap, { backgroundColor: c.backgroundTertiary, borderColor: c.border, height: 80, alignItems: "flex-start", paddingVertical: 10 }]}>
              <Feather name="align-left" size={16} color={c.textSecondary} strokeWidth={1.5} style={{ marginTop: 2 }} />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="وصف المنتج (اختياري)"
                placeholderTextColor={c.textSecondary}
                multiline
                style={{ flex: 1, color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}
                textAlign="right"
              />
            </View>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>الفئة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {PRODUCT_CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => { Haptics.selectionAsync(); setCategory(cat); }}
                      style={[st.catChip, { backgroundColor: active ? c.accent : c.backgroundTertiary, borderColor: active ? c.accent : c.border }]}
                    >
                      <Text style={{ color: active ? "#fff" : c.text, fontSize: 13, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity onPress={handleAdd} style={{ borderRadius: 16, overflow: "hidden" }}>
              <LinearGradient colors={["#7C3AED", "#4F46E5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ padding: 16, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 }}>إضافة المنتج</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0, borderBottomWidth: 0.5, gap: 12 },
  storeName: { fontSize: 24, fontFamily: "Inter_700Bold" },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  merchantIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 0.5, padding: 10, alignItems: "center", gap: 4 },
  commissionRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 0.5, padding: 10 },
  tabs: { flexDirection: "row", borderTopWidth: 0.5, marginTop: 4 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  emptyBox: { alignItems: "center", justifyContent: "center", gap: 12, padding: 40, borderRadius: 20, borderWidth: 0.5, borderStyle: "dashed" },
  productRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 0.5, padding: 12 },
  productRowImg: { width: 56, height: 56, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  orderCard: { borderRadius: 16, borderWidth: 0.5, padding: 14, gap: 4 },
  statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  advanceBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addProductBtn: { borderRadius: 16, overflow: "hidden" },
  addProductGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16 },
  addModal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 0.5, padding: 20 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 0.5, borderRadius: 14, paddingHorizontal: 14, height: 50 },
  catChip: { borderWidth: 0.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
});
