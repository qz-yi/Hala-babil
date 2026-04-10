import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Linking,
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

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import type { MenuItem } from "@/context/AppContext";

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { restaurants, isSuperAdmin, deleteRestaurant, t, theme } = useApp();
  const { showToast } = useToast();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [orderModal, setOrderModal] = useState(false);

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

  const handleCall = () => Linking.openURL(`tel:${restaurant.phone}`);
  const handleWhatsApp = () => {
    if (restaurant.whatsapp) {
      Linking.openURL(`https://wa.me/964${restaurant.whatsapp.replace(/^0/, "")}`);
    }
  };

  const handleSendOrder = (item: MenuItem) => {
    const number = restaurant.whatsapp || restaurant.phone;
    const waNumber = `964${number.replace(/^0/, "")}`;
    const msg = encodeURIComponent(
      `مرحباً 👋\nأريد طلب: ${item.name}\nالسعر: ${item.price.toLocaleString()} د.ع\n${item.description ? `\nالوصف: ${item.description}` : ""}`
    );
    Linking.openURL(`https://wa.me/${waNumber}?text=${msg}`);
    showToast(t("orderSent"), "success");
    setOrderModal(false);
    setSelectedItem(null);
  };

  const confirmDelete = () => {
    deleteRestaurant(id);
    showToast("تم حذف المطعم", "success");
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 20 }}>
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: topPad + 8 }]}>
          {restaurant.image ? (
            <TouchableOpacity activeOpacity={0.92} onPress={() => setSelectedImage(restaurant.image!)} style={styles.heroImgWrap}>
              <Image source={{ uri: restaurant.image }} style={styles.heroImg} />
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={styles.heroGrad} />
              <View style={[styles.heroTopRow, { paddingTop: topPad }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnImg]}>
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                {isSuperAdmin && (
                  <TouchableOpacity onPress={() => setDeleteModal(true)} style={[styles.deleteBtnImg]}>
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
                  {restaurant.governorate ? (
                    <View style={[styles.categoryBadge, { backgroundColor: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.4)" }]}>
                      <Text style={[styles.categoryText, { color: "#fff" }]}>📍 {restaurant.governorate}</Text>
                    </View>
                  ) : null}
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
                    {restaurant.governorate ? (
                      <View style={[styles.categoryBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.categoryText, { color: colors.textSecondary }]}>📍 {restaurant.governorate}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                {isSuperAdmin && (
                  <TouchableOpacity onPress={() => setDeleteModal(true)} style={[styles.deleteBtn, { backgroundColor: `${colors.danger}22` }]}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handleCall} style={[styles.actionBtn, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` }]}>
            <Ionicons name="call" size={22} color={accentColor} />
            <Text style={[styles.actionBtnText, { color: accentColor }]}>{t("call")}</Text>
          </TouchableOpacity>
          {restaurant.whatsapp && (
            <TouchableOpacity onPress={handleWhatsApp} style={[styles.actionBtn, { backgroundColor: "#25D36622", borderColor: "#25D36644" }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              <Text style={[styles.actionBtnText, { color: "#25D366" }]}>{t("whatsapp")}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order hint */}
        {(restaurant.whatsapp || restaurant.phone) && restaurant.menuItems?.length > 0 && (
          <View style={[styles.orderHint, { backgroundColor: `${accentColor}12`, borderColor: `${accentColor}33` }]}>
            <Ionicons name="bag-handle-outline" size={16} color={accentColor} />
            <Text style={[styles.orderHintTxt, { color: accentColor }]}>
              اضغط على أي صنف لإرسال طلبك مباشرة للمطعم
            </Text>
          </View>
        )}

        {/* Menu */}
        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
            <Ionicons name="restaurant" size={18} color={accentColor} />
            <Text style={[styles.menuTitle, { color: colors.text }]}>{t("menu")}</Text>
            <Text style={[styles.menuCount, { color: colors.textSecondary }]}>
              {restaurant.menuItems?.length || 0} صنف
            </Text>
          </View>

          {restaurant.menuItems?.length === 0 ? (
            <View style={styles.emptyMenu}>
              <Ionicons name="fast-food-outline" size={32} color={colors.border} />
              <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
                لا توجد أصناف في القائمة
              </Text>
            </View>
          ) : (
            <FlatList
              data={restaurant.menuItems}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 0 }}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => {
                    setSelectedItem(item);
                    setOrderModal(true);
                  }}
                  style={[
                    styles.menuItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < (restaurant.menuItems?.length || 0) - 1 ? 1 : 0,
                    },
                  ]}
                >
                  {item.image ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={(e) => { e.stopPropagation(); setSelectedImage(item.image!); }}
                    >
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
                      <Text style={[styles.menuItemDesc, { color: colors.textSecondary }]}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <View style={[styles.priceBadge, { backgroundColor: `${accentColor}22` }]}>
                      <Text style={[styles.priceText, { color: accentColor }]}>
                        {item.price.toLocaleString()} د.ع
                      </Text>
                    </View>
                    <View style={[styles.orderMiniBtn, { backgroundColor: "#25D36622" }]}>
                      <Ionicons name="logo-whatsapp" size={11} color="#25D366" />
                      <Text style={{ color: "#25D366", fontSize: 10, fontFamily: "Inter_600SemiBold" }}>طلب</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </ScrollView>

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

      {/* Order Modal */}
      <Modal visible={orderModal} transparent animationType="slide" onRequestClose={() => { setOrderModal(false); setSelectedItem(null); }}>
        <Pressable style={styles.orderOverlay} onPress={() => { setOrderModal(false); setSelectedItem(null); }}>
          <Pressable style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            {selectedItem && (
              <>
                {selectedItem.image ? (
                  <Image source={{ uri: selectedItem.image }} style={styles.orderImg} />
                ) : (
                  <View style={[styles.orderImgEmpty, { backgroundColor: `${accentColor}18` }]}>
                    <Text style={{ fontSize: 48 }}>🍽️</Text>
                  </View>
                )}

                <View style={styles.orderInfo}>
                  <Text style={[styles.orderItemName, { color: colors.text }]}>{selectedItem.name}</Text>
                  {selectedItem.description && (
                    <Text style={[styles.orderItemDesc, { color: colors.textSecondary }]}>{selectedItem.description}</Text>
                  )}
                  <View style={[styles.orderPriceBig, { backgroundColor: `${accentColor}18` }]}>
                    <Text style={[styles.orderPriceBigTxt, { color: accentColor }]}>
                      {selectedItem.price.toLocaleString()} د.ع
                    </Text>
                  </View>
                </View>

                <View style={styles.orderRestInfo}>
                  <Ionicons name="restaurant-outline" size={14} color={colors.textSecondary} />
                  <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }]}>
                    {restaurant.name}
                    {restaurant.governorate ? ` · 📍 ${restaurant.governorate}` : ""}
                  </Text>
                </View>

                <View style={styles.orderActions}>
                  <TouchableOpacity
                    onPress={() => { setOrderModal(false); setSelectedItem(null); }}
                    style={[styles.orderCancelBtn, { borderColor: colors.border }]}
                  >
                    <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 14 }}>{t("cancel")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSendOrder(selectedItem)}
                    style={styles.orderSendBtn}
                  >
                    <LinearGradient
                      colors={["#25D366", "#128C7E"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.orderSendGrad}
                    >
                      <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                      <Text style={styles.orderSendTxt}>{t("sendOrder")}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModal} transparent animationType="fade" onRequestClose={() => setDeleteModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setDeleteModal(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <View style={[styles.modalIcon, { backgroundColor: `${colors.danger}18` }]}>
              <Ionicons name="trash-outline" size={28} color={colors.danger} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              حذف "{restaurant.name}"؟
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              لا يمكن التراجع عن هذا الإجراء.
            </Text>
            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              <TouchableOpacity onPress={() => setDeleteModal(false)} style={[styles.modalCancelBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={{ flex: 1 }}>
                <LinearGradient colors={[colors.danger, "#c0392b"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalConfirmBtn}>
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
  backBtnImg: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center",
  },
  deleteBtnImg: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(200,0,0,0.4)", alignItems: "center", justifyContent: "center",
  },
  heroBottom: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 14, gap: 6,
  },
  heroName: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  headerNoImg: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: "center", justifyContent: "center", borderWidth: 1, zIndex: 1,
  },
  headerHeroSection: { flex: 1, alignItems: "center", gap: 8, marginTop: 8 },
  restaurantIcon: { width: 90, height: 90, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  restaurantName: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  categoryBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  categoryText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  deleteBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  actionRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginVertical: 16 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1,
  },
  actionBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  orderHint: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginBottom: 12, padding: 12,
    borderRadius: 14, borderWidth: 1,
  },
  orderHintTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  menuSection: { marginHorizontal: 16, borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  menuHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 16, borderBottomWidth: 1,
  },
  menuTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold" },
  menuCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  emptyMenu: { alignItems: "center", paddingVertical: 32, gap: 10 },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 14, gap: 12,
  },
  mealImg: { width: 60, height: 60, borderRadius: 14, resizeMode: "cover" },
  mealImgEmpty: { width: 60, height: 60, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  menuItemLeft: { flex: 1 },
  menuItemName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  menuItemDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  priceBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  priceText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  orderMiniBtn: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  imageViewerOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center", justifyContent: "center",
  },
  imageViewerImg: { width: "95%", height: "80%" },
  imageViewerClose: {
    position: "absolute", top: 50, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  orderOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  orderCard: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderBottomWidth: 0,
    padding: 24, gap: 16,
  },
  orderImg: { width: "100%", height: 180, borderRadius: 20, resizeMode: "cover" },
  orderImgEmpty: { width: "100%", height: 130, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  orderInfo: { gap: 8 },
  orderItemName: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "right" },
  orderItemDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "right" },
  orderPriceBig: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  orderPriceBigTxt: { fontSize: 18, fontFamily: "Inter_700Bold" },
  orderRestInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  orderActions: { flexDirection: "row", gap: 12 },
  orderCancelBtn: {
    flex: 1, height: 52, borderRadius: 16, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  orderSendBtn: { flex: 2 },
  orderSendGrad: {
    height: 52, borderRadius: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  orderSendTxt: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  modalCard: {
    width: "82%", maxWidth: 320, borderRadius: 24, borderWidth: 1,
    padding: 24, alignItems: "center", gap: 12,
  },
  modalIcon: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  modalDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  modalCancelBtn: {
    flex: 1, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  modalConfirmBtn: { height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", flex: 1 },
});
