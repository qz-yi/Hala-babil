import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "@/store/themeStore";
import { useApp, type Product, type Order, type Merchant, type CommerceTier } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

type Tab = "dashboard" | "catalog" | "orders";

const ORDER_STATUSES: Record<string, { label: string; color: string; icon: string }> = {
  pending:   { label: "قيد الانتظار", color: "#F59E0B", icon: "clock"        },
  accepted:  { label: "تم القبول",   color: "#3B82F6", icon: "check-circle"  },
  shipped:   { label: "قيد الشحن",   color: "#8B5CF6", icon: "truck"         },
  delivered: { label: "تم التوصيل", color: "#10B981", icon: "package"        },
  cancelled: { label: "ملغي",        color: "#EF4444", icon: "x-circle"      },
};

const TIER_COLORS: Record<CommerceTier, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold:   "#FFD700",
};

const ORDER_STATUS_FLOW = ["pending", "accepted", "shipped", "delivered"];

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function MyMerchantScreen() {
  const c = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const {
    currentUser, isMerchantOwner, getMyMerchant, products, orders,
    addProduct, updateProduct, deleteProduct, updateOrderStatus, updateMerchantProfile,
    acceptOrder, rejectOrder,
  } = useApp();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [addProductVisible, setAddProductVisible] = useState(false);
  const [storeProfileVisible, setStoreProfileVisible] = useState(false);

  useEffect(() => {
    if (!currentUser) router.replace("/(auth)/login");
  }, [currentUser]);

  if (!currentUser || !isMerchantOwner) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 20 }}>
          <Feather name="lock" size={52} color={c.textSecondary} strokeWidth={1} />
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20, textAlign: "center" }}>
            هذه الصفحة للتجار فقط
          </Text>
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 24 }}>
            تواصل مع الإدارة لتفعيل حساب تاجر
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const merchant = getMyMerchant();
  const myProducts = useMemo(
    () => products.filter((p) => p.merchantId === merchant?.id),
    [products, merchant],
  );
  const myOrders = useMemo(
    () => orders
      .filter((o) => o.merchantId === merchant?.id)
      .sort((a, b) => b.createdAt - a.createdAt),
    [orders, merchant],
  );

  if (!merchant) return null;

  const tierColor = TIER_COLORS[merchant.tier] ?? "#C0C0C0";
  const totalRevenue = myOrders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + o.totalIQD, 0);
  const pendingOrders = myOrders.filter((o) => o.status === "pending").length;

  // Stat card width: 4 cards with 12px gaps, 16px horizontal padding each side
  const statCardW = Math.floor((W - 32 - 36) / 4);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* ── Header: cover photo OR gradient background, content in normal flow ── */}
      <View style={{ overflow: "hidden" }}>
        {/* Background layer */}
        {merchant.coverPhoto ? (
          <>
            <Image
              source={{ uri: merchant.coverPhoto }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.50)" }]} />
          </>
        ) : (
          <LinearGradient
            colors={[`${tierColor}28`, c.background]}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {/* Content — normal flow, not absolute */}
        <View style={{
          paddingTop: (Platform.OS === "web" ? 20 : insets.top) + 12,
          paddingHorizontal: 16,
          paddingBottom: 0,
          gap: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: merchant.coverPhoto ? "rgba(255,255,255,0.15)" : c.border,
        }}>
          <HeaderContent
            merchant={merchant}
            tierColor={tierColor}
            tab={tab}
            setTab={setTab}
            totalRevenue={totalRevenue}
            pendingOrders={pendingOrders}
            myProducts={myProducts}
            statCardW={statCardW}
            c={merchant.coverPhoto
              ? { ...c, text: "#fff", textSecondary: "rgba(255,255,255,0.72)" }
              : c
            }
            onEditProfile={() => setStoreProfileVisible(true)}
          />
        </View>
      </View>

      {/* ── Body: tab content, takes remaining height ── */}
      <View style={{ flex: 1 }}>
        {tab === "dashboard" && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: (Platform.OS === "web" ? 20 : insets.bottom) + 100,
              gap: 12,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[st.sectionTitle, { color: c.text }]}>آخر الطلبات</Text>
            {myOrders.slice(0, 5).length === 0 ? (
              <View style={[st.emptyBox, { borderColor: c.border }]}>
                <Feather name="inbox" size={36} color={c.border} strokeWidth={1} />
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>
                  لا توجد طلبات بعد
                </Text>
              </View>
            ) : (
              myOrders.slice(0, 5).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  c={c}
                  onAccept={(o) => { acceptOrder?.(o.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); showToast("تم قبول الطلب ✅", "success"); }}
                  onReject={(o) => { rejectOrder?.(o.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); showToast("تم رفض الطلب", "error"); }}
                  onAdvance={(o) => {
                    const idx = ORDER_STATUS_FLOW.indexOf(o.status);
                    if (idx < ORDER_STATUS_FLOW.length - 1) {
                      updateOrderStatus?.(o.id, ORDER_STATUS_FLOW[idx + 1] as any);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                />
              ))
            )}
          </ScrollView>
        )}

        {tab === "catalog" && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: (Platform.OS === "web" ? 20 : insets.bottom) + 100,
              gap: 12,
            }}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setAddProductVisible(true);
              }}
              style={st.addProductBtn}
            >
              <LinearGradient
                colors={["#7C3AED", "#4F46E5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={st.addProductGrad}
              >
                <Feather name="plus" size={18} color="#fff" strokeWidth={2.5} />
                <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
                  إضافة منتج جديد
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {myProducts.length === 0 ? (
              <View style={[st.emptyBox, { borderColor: c.border }]}>
                <Feather name="box" size={36} color={c.border} strokeWidth={1} />
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>
                  لا توجد منتجات بعد
                </Text>
              </View>
            ) : (
              myProducts.map((product) => (
                <View
                  key={product.id}
                  style={[st.productRow, { backgroundColor: c.card, borderColor: c.border }]}
                >
                  {product.images[0] ? (
                    <Image source={{ uri: product.images[0] }} style={st.productRowImg} />
                  ) : (
                    <View style={[st.productRowImgFallback, { backgroundColor: c.backgroundTertiary }]}>
                      <Feather name="image" size={22} color={c.border} strokeWidth={1} />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
                    <Text
                      style={{ color: c.text, fontFamily: "Inter_600SemiBold", fontSize: 14 }}
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>
                    <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold", fontSize: 14 }}>
                      {product.price.toLocaleString()} IQD
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      <View style={[st.stockBadge, {
                        backgroundColor: product.stock > 0 ? "#10B98118" : "#EF444418",
                      }]}>
                        <Text style={{
                          color: product.stock > 0 ? "#10B981" : "#EF4444",
                          fontSize: 11, fontFamily: "Inter_500Medium",
                        }}>
                          {product.stock > 0 ? `${product.stock} قطعة` : "نفد"}
                        </Text>
                      </View>
                      {product.images.length > 1 && (
                        <View style={[st.stockBadge, { backgroundColor: "#7C3AED18" }]}>
                          <Feather name="image" size={10} color="#7C3AED" />
                          <Text style={{ color: "#7C3AED", fontSize: 11, fontFamily: "Inter_400Regular" }}>
                            {product.images.length} صور
                          </Text>
                        </View>
                      )}
                      <View style={[st.stockBadge, { backgroundColor: c.backgroundTertiary }]}>
                        <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular" }}>
                          {product.category}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ gap: 8, flexShrink: 0 }}>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updateProduct?.(product.id, { isActive: !product.isActive });
                        showToast(product.isActive ? "تم إخفاء المنتج" : "تم تفعيل المنتج", "info");
                      }}
                      style={[st.iconBtn, { backgroundColor: c.backgroundTertiary }]}
                    >
                      <Feather
                        name={product.isActive ? "eye" : "eye-off"}
                        size={16}
                        color={c.textSecondary}
                        strokeWidth={1.5}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        deleteProduct?.(product.id);
                        showToast("تم حذف المنتج", "info");
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
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: (Platform.OS === "web" ? 20 : insets.bottom) + 100,
              gap: 12,
            }}
            showsVerticalScrollIndicator={false}
          >
            {myOrders.length === 0 ? (
              <View style={[st.emptyBox, { borderColor: c.border }]}>
                <Feather name="shopping-bag" size={36} color={c.border} strokeWidth={1} />
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>
                  لا توجد طلبات بعد
                </Text>
              </View>
            ) : (
              myOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  c={c}
                  onAccept={(o) => { acceptOrder?.(o.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); showToast("تم قبول الطلب ✅", "success"); }}
                  onReject={(o) => { rejectOrder?.(o.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); showToast("تم رفض الطلب", "error"); }}
                  onAdvance={(o) => {
                    const idx = ORDER_STATUS_FLOW.indexOf(o.status);
                    if (idx < ORDER_STATUS_FLOW.length - 1) {
                      updateOrderStatus?.(o.id, ORDER_STATUS_FLOW[idx + 1] as any);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      showToast("تم تحديث حالة الطلب", "success");
                    }
                  }}
                />
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* ── Modals ── */}
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
      <StoreProfileModal
        visible={storeProfileVisible}
        merchant={merchant}
        onClose={() => setStoreProfileVisible(false)}
        onSave={(data) => {
          updateMerchantProfile(merchant.id, data);
          showToast("تم تحديث ملف المتجر!", "success");
          setStoreProfileVisible(false);
        }}
      />
    </View>
  );
}

// ─── HeaderContent ───────────────────────────────────────────────────────────
function HeaderContent({
  merchant, tierColor, tab, setTab,
  totalRevenue, pendingOrders, myProducts,
  statCardW, c, onEditProfile,
}: {
  merchant: Merchant; tierColor: string;
  tab: Tab; setTab: (t: Tab) => void;
  totalRevenue: number; pendingOrders: number; myProducts: Product[];
  statCardW: number; c: any; onEditProfile: () => void;
}) {
  const stats = [
    { label: "الإيرادات",       value: `${(totalRevenue / 1000).toFixed(0)}K`, icon: "trending-up",  color: "#10B981" },
    { label: "المعلقة",          value: String(pendingOrders),                  icon: "clock",         color: "#F59E0B" },
    { label: "المنتجات",         value: String(myProducts.length),              icon: "box",           color: c.accent ?? "#7C3AED" },
    { label: "المبيعات",         value: String(merchant.monthlySales),          icon: "shopping-bag",  color: "#8B5CF6" },
  ];

  return (
    <>
      {/* Row 1: Store name + actions + logo */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={[st.storeName, { color: c.text }]} numberOfLines={1}>
            {merchant.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEditProfile(); }}
            style={[st.editProfileBtn, { backgroundColor: `${tierColor}22`, borderColor: tierColor }]}
          >
            <Feather name="edit-2" size={13} color={tierColor} strokeWidth={1.5} />
            <Text style={{ color: tierColor, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
              تحديث المتجر
            </Text>
          </TouchableOpacity>
          {merchant.logo ? (
            <Image
              source={{ uri: merchant.logo }}
              style={[st.merchantLogoImg, { borderColor: tierColor }]}
            />
          ) : (
            <View style={[st.merchantIcon, { backgroundColor: `${tierColor}22` }]}>
              <Feather name="package" size={28} color={tierColor} strokeWidth={1.2} />
            </View>
          )}
        </View>
      </View>

      {/* Row 2: Stats — horizontally scrollable so they never overflow on small screens */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 2 }}
      >
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={[
              st.statCard,
              {
                width: Math.max(statCardW, 72),
                backgroundColor: c.card ?? "rgba(255,255,255,0.12)",
                borderColor: c.border ?? "rgba(255,255,255,0.2)",
              },
            ]}
          >
            <Feather name={stat.icon as any} size={18} color={stat.color} strokeWidth={1.5} />
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15 }} numberOfLines={1}>
              {stat.value}
            </Text>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Row 3: Commission info */}
      <View style={[st.commissionRow, {
        backgroundColor: c.backgroundTertiary ?? "rgba(255,255,255,0.1)",
        borderColor: c.border ?? "rgba(255,255,255,0.2)",
      }]}>
        <Feather name="percent" size={14} color={c.accent ?? "#7C3AED"} strokeWidth={1.5} />
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, flexShrink: 1 }}>
          عمولتك:{" "}
          <Text style={{ color: c.accent ?? "#7C3AED", fontFamily: "Inter_600SemiBold" }}>
            {merchant.tier === "gold" ? "1%" : merchant.tier === "silver" ? "1.5%" : "2%"}
          </Text>
          {" · "}
          {merchant.tier === "bronze"
            ? "0–100 مبيعة"
            : merchant.tier === "silver"
            ? "101–500 مبيعة"
            : "500+ مبيعة"}
        </Text>
      </View>

      {/* Row 4: Tab bar */}
      <View style={[st.tabBar, { borderTopColor: c.border ?? "rgba(255,255,255,0.2)" }]}>
        {(
          [
            { key: "dashboard", label: "التحكم",   icon: "bar-chart-2" },
            { key: "catalog",   label: "المنتجات", icon: "box" },
            { key: "orders",    label: "الطلبات",  icon: "shopping-bag" },
          ] as { key: Tab; label: string; icon: string }[]
        ).map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => { Haptics.selectionAsync(); setTab(t.key); }}
            style={[
              st.tabBtn,
              tab === t.key && { borderBottomColor: c.accent ?? "#7C3AED", borderBottomWidth: 2 },
            ]}
          >
            <Feather
              name={t.icon as any}
              size={14}
              color={tab === t.key ? (c.accent ?? "#7C3AED") : c.textSecondary}
              strokeWidth={1.5}
            />
            <Text style={{
              color: tab === t.key ? (c.accent ?? "#7C3AED") : c.textSecondary,
              fontFamily: tab === t.key ? "Inter_600SemiBold" : "Inter_400Regular",
              fontSize: 13,
            }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

// ─── OrderCard ───────────────────────────────────────────────────────────────
function OrderCard({
  order, c, onAdvance, onAccept, onReject,
}: {
  order: Order; c: any;
  onAdvance: (o: Order) => void;
  onAccept: (o: Order) => void;
  onReject: (o: Order) => void;
}) {
  const status = ORDER_STATUSES[order.status] ?? { label: order.status, color: "#888", icon: "help-circle" };
  const canAdvance = order.status === "accepted" || order.status === "shipped";
  const isPending = order.status === "pending";
  const isFinal = order.status === "delivered" || order.status === "cancelled";

  return (
    <View style={[st.orderCard, { backgroundColor: c.card, borderColor: c.border }]}>
      {/* Accent stripe */}
      <View style={[st.orderAccentStripe, { backgroundColor: status.color }]} />

      <View style={{ flex: 1, padding: 14, gap: 8 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: c.text, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
              طلب #{order.id.slice(-6).toUpperCase()}
            </Text>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
              {new Date(order.createdAt).toLocaleDateString("ar-IQ")} · {order.items.length} منتج
            </Text>
          </View>
          <View style={[st.statusBadge, { backgroundColor: `${status.color}18`, borderColor: status.color }]}>
            <Feather name={status.icon as any} size={11} color={status.color} strokeWidth={2} />
            <Text style={{ color: status.color, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* Items summary */}
        <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" }} numberOfLines={1}>
          {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(" · ")}
        </Text>

        {/* Total */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold", fontSize: 16 }}>
            {order.totalIQD.toLocaleString()} IQD
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular" }}>
            {order.paymentMethod === "cod" ? "كاش عند الاستلام" : order.paymentMethod}
          </Text>
        </View>

        {/* Address */}
        {order.address ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Feather name="map-pin" size={12} color={c.textSecondary} strokeWidth={1.5} />
            <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 }} numberOfLines={1}>
              {order.address}
            </Text>
          </View>
        ) : null}

        {/* Action buttons */}
        {isPending && (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <TouchableOpacity
              onPress={() => onAccept(order)}
              style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}
            >
              <LinearGradient
                colors={["#10B981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={st.orderActionBtn}
              >
                <Feather name="check" size={14} color="#fff" strokeWidth={2.5} />
                <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>قبول</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onReject(order)}
              style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}
            >
              <LinearGradient
                colors={["#EF4444", "#c0392b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={st.orderActionBtn}
              >
                <Feather name="x" size={14} color="#fff" strokeWidth={2.5} />
                <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>رفض</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {canAdvance && (
          <TouchableOpacity
            onPress={() => onAdvance(order)}
            style={{ borderRadius: 12, overflow: "hidden", marginTop: 4 }}
          >
            <LinearGradient
              colors={["#7C3AED", "#4F46E5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.orderActionBtn}
            >
              <Feather name="arrow-left" size={14} color="#fff" strokeWidth={2} />
              <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>تقدم الحالة</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── AddProductModal ─────────────────────────────────────────────────────────
const PRODUCT_CATEGORIES = ["fashion", "electronics", "food", "beauty", "home", "sports", "other"];
const MAX_GALLERY = 5;

function AddProductModal({
  visible, merchantId, onClose, onAdd,
}: {
  visible: boolean; merchantId: string; onClose: () => void; onAdd: (data: any) => void;
}) {
  const c = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { height: WH } = useWindowDimensions();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const handlePickImages = async () => {
    if (Platform.OS === "web") { showToast("اختيار الصور من الويب غير مدعوم حالياً", "info"); return; }
    const remaining = MAX_GALLERY - galleryImages.length;
    if (remaining <= 0) { showToast(`الحد الأقصى ${MAX_GALLERY} صور`, "error"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { showToast("يرجى السماح بالوصول للمعرض", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.75,
      selectionLimit: remaining,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      setGalleryImages((prev) => [...prev, ...newUris].slice(0, MAX_GALLERY));
    }
  };

  const handleAdd = () => {
    if (!name.trim() || !price.trim() || !stock.trim()) {
      showToast("يرجى تعبئة الحقول الإلزامية", "error");
      return;
    }
    onAdd({
      merchantId,
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      images: galleryImages,
      stock: parseInt(stock),
      sku: sku.trim() || undefined,
      category,
      isActive: true,
    });
    setName(""); setPrice(""); setStock(""); setSku(""); setDescription(""); setCategory("other"); setGalleryImages([]);
  };

  const botPad = Platform.OS === "web" ? 20 : insets.bottom;
  const maxH = WH * 0.88;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={st.kav}
      >
        <View style={[st.sheet, {
          backgroundColor: c.card,
          borderColor: c.border,
          maxHeight: maxH,
          paddingBottom: botPad + 16,
        }]}>
          <View style={[st.handle, { backgroundColor: c.border }]} />
          <Text style={[st.sheetTitle, { color: c.text }]}>منتج جديد</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 8 }}>
            {/* Gallery */}
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>
              معرض الصور ({galleryImages.length}/{MAX_GALLERY})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {galleryImages.map((uri, idx) => (
                  <View key={idx} style={st.galleryThumb}>
                    <Image source={{ uri }} style={st.galleryThumbImg} />
                    <TouchableOpacity
                      onPress={() => setGalleryImages((prev) => prev.filter((_, i) => i !== idx))}
                      style={st.galleryRemove}
                    >
                      <Feather name="x" size={12} color="#fff" strokeWidth={2.5} />
                    </TouchableOpacity>
                    {idx === 0 && (
                      <View style={st.galleryMainBadge}>
                        <Text style={{ color: "#fff", fontSize: 9, fontFamily: "Inter_600SemiBold" }}>رئيسية</Text>
                      </View>
                    )}
                  </View>
                ))}
                {galleryImages.length < MAX_GALLERY && (
                  <TouchableOpacity
                    onPress={handlePickImages}
                    style={[st.galleryAddBtn, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}
                  >
                    <Feather name="plus" size={24} color={c.textSecondary} strokeWidth={1.5} />
                    <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 }}>
                      إضافة
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            {/* Text inputs */}
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

            {/* Description */}
            <View style={[st.inputWrap, {
              backgroundColor: c.backgroundTertiary,
              borderColor: c.border,
              height: 80,
              alignItems: "flex-start",
              paddingVertical: 10,
            }]}>
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

            {/* Category */}
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>الفئة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {PRODUCT_CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => { Haptics.selectionAsync(); setCategory(cat); }}
                      style={[st.catChip, {
                        backgroundColor: active ? c.accent : c.backgroundTertiary,
                        borderColor: active ? c.accent : c.border,
                      }]}
                    >
                      <Text style={{
                        color: active ? "#fff" : c.text,
                        fontSize: 13,
                        fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular",
                      }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity onPress={handleAdd} style={{ borderRadius: 16, overflow: "hidden" }}>
              <LinearGradient
                colors={["#7C3AED", "#4F46E5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 16, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 }}>إضافة المنتج</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── StoreProfileModal ───────────────────────────────────────────────────────
function StoreProfileModal({
  visible, merchant, onClose, onSave,
}: {
  visible: boolean; merchant: Merchant; onClose: () => void; onSave: (data: Partial<Merchant>) => void;
}) {
  const c = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { height: WH } = useWindowDimensions();
  const { showToast } = useToast();
  const [logo, setLogo] = useState<string | undefined>(merchant.logo);
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>(merchant.coverPhoto);
  const [bio, setBio] = useState(merchant.bio ?? "");

  useEffect(() => {
    if (visible) {
      setLogo(merchant.logo);
      setCoverPhoto(merchant.coverPhoto);
      setBio(merchant.bio ?? "");
    }
  }, [visible]);

  const pickImage = async (type: "logo" | "cover") => {
    if (Platform.OS === "web") { showToast("اختيار الصور من الويب غير مدعوم", "info"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { showToast("يرجى السماح بالوصول للمعرض", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: type === "logo" ? [1, 1] : [16, 9],
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      if (type === "logo") setLogo(result.assets[0].uri);
      else setCoverPhoto(result.assets[0].uri);
    }
  };

  const botPad = Platform.OS === "web" ? 20 : insets.bottom;
  const maxH = WH * 0.88;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={st.kav}
      >
        <View style={[st.sheet, {
          backgroundColor: c.card,
          borderColor: c.border,
          maxHeight: maxH,
          paddingBottom: botPad + 16,
        }]}>
          <View style={[st.handle, { backgroundColor: c.border }]} />
          <Text style={[st.sheetTitle, { color: c.text }]}>تحديث ملف المتجر</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
            {/* Cover Photo */}
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>صورة الغلاف</Text>
            <TouchableOpacity
              onPress={() => pickImage("cover")}
              style={[st.coverPickerBtn, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}
            >
              {coverPhoto ? (
                <>
                  <Image source={{ uri: coverPhoto }} style={st.coverPickerImg} resizeMode="cover" />
                  <View style={[StyleSheet.absoluteFillObject, {
                    backgroundColor: "rgba(0,0,0,0.35)",
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                  }]}>
                    <Feather name="camera" size={28} color="#fff" strokeWidth={1.5} />
                    <Text style={{ color: "#fff", fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 6 }}>
                      تغيير الغلاف
                    </Text>
                  </View>
                </>
              ) : (
                <View style={{ alignItems: "center", gap: 8 }}>
                  <Feather name="image" size={36} color={c.textSecondary} strokeWidth={1} />
                  <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                    اختر صورة الغلاف
                  </Text>
                  <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }}>
                    16:9 موصى به
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Logo */}
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>شعار المتجر</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <TouchableOpacity
                onPress={() => pickImage("logo")}
                style={[st.logoPickerBtn, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}
              >
                {logo ? (
                  <>
                    <Image source={{ uri: logo }} style={st.logoPickerImg} />
                    <View style={[StyleSheet.absoluteFillObject, {
                      backgroundColor: "rgba(0,0,0,0.4)",
                      borderRadius: 44,
                      alignItems: "center",
                      justifyContent: "center",
                    }]}>
                      <Feather name="camera" size={22} color="#fff" strokeWidth={1.5} />
                    </View>
                  </>
                ) : (
                  <Feather name="upload" size={28} color={c.textSecondary} strokeWidth={1} />
                )}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>شعار المتجر</Text>
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
                  يظهر في قائمة المنتجات وبطاقة التاجر
                </Text>
              </View>
            </View>

            {/* Bio */}
            <View style={[st.inputWrap, {
              backgroundColor: c.backgroundTertiary,
              borderColor: c.border,
              height: 80,
              alignItems: "flex-start",
              paddingVertical: 10,
            }]}>
              <Feather name="edit-3" size={16} color={c.textSecondary} strokeWidth={1.5} style={{ marginTop: 2 }} />
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="وصف المتجر (اختياري)"
                placeholderTextColor={c.textSecondary}
                multiline
                style={{ flex: 1, color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}
                textAlign="right"
              />
            </View>

            <TouchableOpacity
              onPress={() => onSave({ logo, coverPhoto, bio: bio.trim() || undefined })}
              style={{ borderRadius: 16, overflow: "hidden" }}
            >
              <LinearGradient
                colors={["#7C3AED", "#4F46E5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 16, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 }}>حفظ التغييرات</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  storeName:       { fontSize: 22, fontFamily: "Inter_700Bold" },
  tierBadge:       { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  editProfileBtn:  { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  merchantIcon:    { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  merchantLogoImg: { width: 52, height: 52, borderRadius: 26, borderWidth: 2 },
  statCard:        { borderRadius: 14, borderWidth: 0.5, paddingVertical: 10, paddingHorizontal: 6, alignItems: "center", gap: 4 },
  commissionRow:   { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 0.5, padding: 10 },
  tabBar:          { flexDirection: "row", borderTopWidth: 0.5, marginTop: 4 },
  tabBtn:          { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  sectionTitle:    { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  emptyBox:        { alignItems: "center", justifyContent: "center", gap: 12, padding: 40, borderRadius: 20, borderWidth: 0.5, borderStyle: "dashed" },
  productRow:      { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 0.5, padding: 12 },
  productRowImg:         { width: 64, height: 64, borderRadius: 10, flexShrink: 0 },
  productRowImgFallback: { width: 64, height: 64, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stockBadge:      { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  iconBtn:         { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  orderCard:         { borderRadius: 16, borderWidth: 0.5, flexDirection: "row", overflow: "hidden" },
  orderAccentStripe: { width: 4 },
  orderActionBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  statusBadge:       { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 },
  advanceBtn:        { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addProductBtn:   { borderRadius: 16, overflow: "hidden" },
  addProductGrad:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16 },
  backdrop:        { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)" },
  kav:             { justifyContent: "flex-end" },
  sheet:           { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 0.5, padding: 20 },
  handle:          { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetTitle:      { fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center", marginBottom: 18 },
  inputWrap:       { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 0.5, borderRadius: 14, paddingHorizontal: 14, height: 50 },
  catChip:         { borderWidth: 0.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  galleryThumb:        { width: 80, height: 80, borderRadius: 12, overflow: "hidden" },
  galleryThumbImg:     { width: 80, height: 80 },
  galleryRemove:       { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center" },
  galleryMainBadge:    { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(124,58,237,0.85)", paddingVertical: 3, alignItems: "center" },
  galleryAddBtn:       { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  coverPickerBtn:      { height: 140, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  coverPickerImg:      { width: "100%", height: "100%", position: "absolute" },
  logoPickerBtn:       { width: 88, height: 88, borderRadius: 44, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoPickerImg:       { width: 88, height: 88, borderRadius: 44 },
});
