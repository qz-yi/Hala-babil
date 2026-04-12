import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Animated,
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

import { useToast } from "@/components/Toast";
import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { MenuItem } from "@/context/AppContext";

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    restaurants, isManager, deleteRestaurant, t, theme,
    cart, addToCart, removeFromCart, updateCartQty, clearCart, getCartTotal, placeOrder,
    currentUser,
  } = useApp();
  const { showToast } = useToast();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cartModal, setCartModal] = useState(false);
  const [ordering, setOrdering] = useState(false);

  const restaurant = restaurants.find((r) => r.id === id);
  if (!restaurant) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textSecondary }}>المطعم غير موجود</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.tint, marginTop: 12 }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const accentColor = ACCENT_COLORS[restaurant.name.length % ACCENT_COLORS.length];
  const visibleItems = restaurant.menuItems.filter((m) => m.isVisible !== false);
  const cartItems = cart?.restaurantId === restaurant.id ? cart.items : [];
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart?.restaurantId === restaurant.id ? getCartTotal() : 0;

  const handleAddToCart = (item: MenuItem) => {
    if (!currentUser) { showToast("يجب تسجيل الدخول أولاً", "error"); return; }
    if (cart && cart.restaurantId !== restaurant.id) {
      Alert.alert(
        "سلة جديدة",
        `لديك طلب من مطعم "${cart.restaurantName}". هل تريد مسح السلة الحالية والبدء من هنا؟`,
        [
          { text: "إلغاء", style: "cancel" },
          {
            text: "مسح وإضافة",
            style: "destructive",
            onPress: () => {
              clearCart();
              addToCart(restaurant, item);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              showToast("تمت الإضافة للسلة", "success");
            },
          },
        ]
      );
      return;
    }
    addToCart(restaurant, item);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getQty = (itemId: string) => cartItems.find((i) => i.menuItemId === itemId)?.quantity ?? 0;

  const handlePlaceOrder = async () => {
    if (!cart || cartItems.length === 0) return;
    if (!restaurant.ownerId) {
      showToast("لا يمكن إرسال الطلب - لا يوجد صاحب مطعم مرتبط", "error");
      return;
    }
    setOrdering(true);
    await placeOrder();
    setOrdering(false);
    setCartModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast("✓ تم إرسال طلبك للمطعم عبر الرسائل", "success");
    router.push("/messages");
  };

  const confirmDelete = () => {
    deleteRestaurant(id);
    showToast("تم حذف المطعم", "success");
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + (cartCount > 0 ? 100 : 30) }}>

        {/* Hero */}
        <View style={[styles.hero, { paddingTop: topPad + 8 }]}>
          {restaurant.image ? (
            <TouchableOpacity activeOpacity={0.92} onPress={() => setSelectedImage(restaurant.image!)} style={styles.heroImgWrap}>
              <Image source={{ uri: restaurant.image }} style={styles.heroImg} />
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={styles.heroGrad} />
              <View style={[styles.heroTopRow, { paddingTop: topPad }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtnImg}>
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                {isManager && (
                  <TouchableOpacity onPress={() => setDeleteModal(true)} style={styles.deleteBtnImg}>
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.heroBottom}>
                <Text style={styles.heroName}>{restaurant.name}</Text>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <View style={[styles.categoryBadge, { backgroundColor: `${accentColor}cc`, borderColor: accentColor }]}>
                    <Text style={[styles.categoryText, { color: "#fff" }]}>{restaurant.category}</Text>
                  </View>
                  {restaurant.governorate && (
                    <View style={[styles.categoryBadge, { backgroundColor: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.4)" }]}>
                      <Text style={[styles.categoryText, { color: "#fff" }]}>📍 {restaurant.governorate}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <LinearGradient colors={[`${accentColor}30`, "transparent"]} style={[styles.headerNoImg, { paddingTop: topPad + 8 }]}>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerHeroSection}>
                  <View style={[styles.restaurantIcon, { backgroundColor: `${accentColor}22` }]}>
                    <Text style={{ fontSize: 48 }}>🍽️</Text>
                  </View>
                  <Text style={[styles.restaurantName, { color: colors.text }]}>{restaurant.name}</Text>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                    <View style={[styles.categoryBadge, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` }]}>
                      <Text style={[styles.categoryText, { color: accentColor }]}>{restaurant.category}</Text>
                    </View>
                    {restaurant.governorate && (
                      <View style={[styles.categoryBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.categoryText, { color: colors.textSecondary }]}>📍 {restaurant.governorate}</Text>
                      </View>
                    )}
                  </View>
                </View>
                {isManager && (
                  <TouchableOpacity onPress={() => setDeleteModal(true)} style={[styles.deleteBtn, { backgroundColor: `${colors.danger}22` }]}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Description */}
        {restaurant.description ? (
          <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>{restaurant.description}</Text>
          </View>
        ) : null}

        {/* Cart hint */}
        {visibleItems.length > 0 && (
          <View style={[styles.cartHint, { backgroundColor: `${accentColor}12`, borderColor: `${accentColor}33` }]}>
            <Ionicons name="bag-handle-outline" size={16} color={accentColor} />
            <Text style={[styles.cartHintTxt, { color: accentColor }]}>
              أضف الأصناف للسلة ثم أرسل طلبك عبر الرسائل مباشرةً
            </Text>
          </View>
        )}

        {/* Menu */}
        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
            <Ionicons name="restaurant" size={18} color={accentColor} />
            <Text style={[styles.menuTitle, { color: colors.text }]}>{t("menu")}</Text>
            <Text style={[styles.menuCount, { color: colors.textSecondary }]}>
              {visibleItems.length} صنف
            </Text>
          </View>

          {visibleItems.length === 0 ? (
            <View style={styles.emptyMenu}>
              <Ionicons name="fast-food-outline" size={32} color={colors.border} />
              <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                لا توجد أصناف متاحة
              </Text>
            </View>
          ) : (
            visibleItems.map((item, index) => {
              const qty = getQty(item.id);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.menuItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < visibleItems.length - 1 ? 0.5 : 0,
                    },
                  ]}
                >
                  {item.image ? (
                    <TouchableOpacity activeOpacity={0.85} onPress={() => setSelectedImage(item.image!)}>
                      <Image source={{ uri: item.image }} style={styles.mealImg} />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.mealImgEmpty, { backgroundColor: `${accentColor}18` }]}>
                      <Text style={{ fontSize: 20 }}>🍽️</Text>
                    </View>
                  )}

                  <View style={styles.menuItemLeft}>
                    <Text style={[styles.menuItemName, { color: colors.text }]}>{item.name}</Text>
                    {item.description && (
                      <Text style={[styles.menuItemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    <View style={[styles.priceBadge, { backgroundColor: `${accentColor}22` }]}>
                      <Text style={[styles.priceText, { color: accentColor }]}>
                        {item.price.toLocaleString()} د.ع
                      </Text>
                    </View>
                  </View>

                  {/* Cart Controls */}
                  <View style={styles.cartControls}>
                    {qty > 0 ? (
                      <View style={[styles.qtyRow, { borderColor: `${accentColor}44`, backgroundColor: `${accentColor}11` }]}>
                        <TouchableOpacity
                          onPress={() => { updateCartQty(item.id, qty - 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                          style={[styles.qtyBtn, { backgroundColor: `${accentColor}22` }]}
                        >
                          <Feather name="minus" size={14} color={accentColor} strokeWidth={2.5} />
                        </TouchableOpacity>
                        <Text style={[styles.qtyTxt, { color: accentColor }]}>{qty}</Text>
                        <TouchableOpacity
                          onPress={() => { updateCartQty(item.id, qty + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                          style={[styles.qtyBtn, { backgroundColor: `${accentColor}22` }]}
                        >
                          <Feather name="plus" size={14} color={accentColor} strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: accentColor }]}
                        onPress={() => handleAddToCart(item)}
                        activeOpacity={0.8}
                      >
                        <Feather name="plus" size={16} color="#fff" strokeWidth={2.5} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Bar */}
      {cartCount > 0 && cart?.restaurantId === restaurant.id && (
        <TouchableOpacity
          style={[styles.cartBar, { bottom: botPad + 16 }]}
          activeOpacity={0.9}
          onPress={() => setCartModal(true)}
        >
          <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cartBarGrad}>
            <View style={styles.cartBarBadge}>
              <Text style={styles.cartBarBadgeTxt}>{cartCount}</Text>
            </View>
            <Text style={styles.cartBarTitle}>عرض السلة</Text>
            <Text style={styles.cartBarTotal}>{cartTotal.toLocaleString()} د.ع</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Full Screen Image Viewer */}
      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <Pressable style={styles.imageViewerOverlay} onPress={() => setSelectedImage(null)}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.imageViewerImg} resizeMode="contain" />
          )}
          <TouchableOpacity style={styles.imageViewerClose} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </Pressable>
      </Modal>

      {/* Cart Modal */}
      <Modal visible={cartModal} transparent animationType="slide" onRequestClose={() => setCartModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCartModal(false)}>
          <Pressable style={[styles.cartSheet, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.cartSheetHeader}>
              <Text style={[styles.cartSheetTitle, { color: colors.text }]}>سلتك من {restaurant.name}</Text>
              <TouchableOpacity onPress={() => { clearCart(); setCartModal(false); }}>
                <Text style={{ color: colors.danger, fontFamily: "Inter_500Medium", fontSize: 14 }}>مسح</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {cartItems.map((ci) => (
                <View key={ci.menuItemId} style={[styles.cartItem, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.cartItemName, { color: colors.text }]}>{ci.menuItemName}</Text>
                  <View style={styles.cartItemRight}>
                    <Text style={[styles.cartItemPrice, { color: accentColor }]}>
                      {(ci.menuItemPrice * ci.quantity).toLocaleString()} د.ع
                    </Text>
                    <View style={[styles.qtyRow, { borderColor: `${accentColor}44`, backgroundColor: `${accentColor}11` }]}>
                      <TouchableOpacity
                        onPress={() => updateCartQty(ci.menuItemId, ci.quantity - 1)}
                        style={[styles.qtyBtn, { backgroundColor: `${accentColor}22` }]}
                      >
                        <Feather name="minus" size={12} color={accentColor} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <Text style={[styles.qtyTxt, { color: accentColor }]}>{ci.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => updateCartQty(ci.menuItemId, ci.quantity + 1)}
                        style={[styles.qtyBtn, { backgroundColor: `${accentColor}22` }]}
                      >
                        <Feather name="plus" size={12} color={accentColor} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.cartTotal, { borderTopColor: colors.border }]}>
              <Text style={[styles.cartTotalLabel, { color: colors.textSecondary }]}>الإجمالي</Text>
              <Text style={[styles.cartTotalValue, { color: accentColor }]}>
                {cartTotal.toLocaleString()} د.ع
              </Text>
            </View>

            <TouchableOpacity
              style={styles.orderBtn}
              activeOpacity={0.9}
              onPress={handlePlaceOrder}
              disabled={ordering}
            >
              <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.orderBtnGrad}>
                <Feather name="send" size={18} color="#fff" strokeWidth={2} />
                <Text style={styles.orderBtnTxt}>{ordering ? "جارٍ الإرسال..." : "إرسال الطلب للمطعم"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.orderNote, { color: colors.textSecondary }]}>
              سيصل طلبك كرسالة خاصة لصاحب المطعم
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModal} transparent animationType="fade" onRequestClose={() => setDeleteModal(false)}>
        <Pressable style={styles.deleteModalOverlay} onPress={() => setDeleteModal(false)}>
          <Pressable style={[styles.deleteCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <View style={[styles.deleteIcon, { backgroundColor: `${colors.danger}18` }]}>
              <Ionicons name="trash-outline" size={28} color={colors.danger} />
            </View>
            <Text style={[styles.deleteTitle, { color: colors.text }]}>حذف "{restaurant.name}"؟</Text>
            <Text style={[styles.deleteDesc, { color: colors.textSecondary }]}>لا يمكن التراجع عن هذا الإجراء.</Text>
            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              <TouchableOpacity onPress={() => setDeleteModal(false)} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={{ flex: 1 }}>
                <LinearGradient colors={[colors.danger, "#c0392b"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmBtn}>
                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>حذف</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {},
  heroImgWrap: { width: "100%", height: 260, position: "relative" },
  heroImg: { width: "100%", height: "100%", resizeMode: "cover" },
  heroGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 130 },
  heroTopRow: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtnImg: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  deleteBtnImg: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(200,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  heroBottom: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 14, gap: 6 },
  heroName: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  headerNoImg: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, zIndex: 1 },
  headerHeroSection: { flex: 1, alignItems: "center", gap: 8, marginTop: 8 },
  restaurantIcon: { width: 90, height: 90, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  restaurantName: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  categoryBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  categoryText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  deleteBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  descCard: { marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 14, padding: 14, borderWidth: 0.5 },
  descText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, textAlign: "right" },
  cartHint: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginVertical: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  cartHintTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  menuSection: { marginHorizontal: 16, borderRadius: 20, borderWidth: 0.5, overflow: "hidden", marginBottom: 16 },
  menuHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16, borderBottomWidth: 0.5 },
  menuTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold" },
  menuCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  emptyMenu: { alignItems: "center", paddingVertical: 32, gap: 10 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 14, gap: 12 },
  mealImg: { width: 64, height: 64, borderRadius: 14, resizeMode: "cover" },
  mealImgEmpty: { width: 64, height: 64, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  menuItemLeft: { flex: 1, gap: 4 },
  menuItemName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  menuItemDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  priceBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  priceText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  cartControls: { alignItems: "center", justifyContent: "center" },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  qtyRow: { flexDirection: "row", alignItems: "center", borderRadius: 20, borderWidth: 1, overflow: "hidden", gap: 0 },
  qtyBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  qtyTxt: { fontSize: 14, fontFamily: "Inter_700Bold", paddingHorizontal: 6, minWidth: 24, textAlign: "center" },
  cartBar: { position: "absolute", left: 16, right: 16 },
  cartBarGrad: { borderRadius: 20, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  cartBarBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  cartBarBadgeTxt: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  cartBarTitle: { flex: 1, color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  cartBarTotal: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  imageViewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center" },
  imageViewerImg: { width: "95%", height: "80%" },
  imageViewerClose: { position: "absolute", top: 50, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  cartSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 0.5, borderBottomWidth: 0, padding: 20, gap: 14 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#333", alignSelf: "center", marginBottom: 4 },
  cartSheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cartSheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  cartItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, gap: 10 },
  cartItemName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cartItemRight: { alignItems: "flex-end", gap: 6 },
  cartItemPrice: { fontSize: 13, fontFamily: "Inter_700Bold" },
  cartTotal: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 0.5 },
  cartTotalLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cartTotalValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  orderBtn: {},
  orderBtnGrad: { borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  orderBtnTxt: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  orderNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  deleteModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  deleteCard: { width: "82%", maxWidth: 320, borderRadius: 24, borderWidth: 1, padding: 24, alignItems: "center", gap: 12 },
  deleteIcon: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  deleteTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  deleteDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  cancelBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  confirmBtn: { height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", flex: 1 },
});
