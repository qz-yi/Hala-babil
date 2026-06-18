import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
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
import { useApp, type Product } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

const { width: SW } = Dimensions.get("window");
const CARD_W = (SW - 48) / 2;

const TIER_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  bronze: { label: "برونزي", color: "#CD7F32", icon: "award" },
  silver: { label: "فضي",    color: "#C0C0C0", icon: "award" },
  gold:   { label: "ذهبي",   color: "#FFD700", icon: "award" },
};

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:   { label: "قيد الانتظار", color: "#F59E0B" },
  accepted:  { label: "تم القبول",   color: "#3B82F6" },
  shipped:   { label: "قيد الشحن",   color: "#8B5CF6" },
  delivered: { label: "تم التوصيل", color: "#10B981" },
  cancelled: { label: "ملغي",        color: "#EF4444" },
};

export default function StoreProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;
  const { showToast } = useToast();

  const {
    merchants, products, reels, posts, users,
    currentUser, addToCart,
    toggleFollowMerchant, isMerchantFollowed,
    blockMerchantStore, isMerchantBlocked,
    getConversation, sendPrivateMessage,
  } = useApp();

  const [confirmBlock, setConfirmBlock] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const merchant = merchants.find((m) => m.id === id);
  const owner = users.find((u) => u.id === merchant?.ownerId);

  const storeProducts = useMemo(
    () => products.filter((p) => p.merchantId === id && p.isActive),
    [products, id]
  );

  const storeReels = useMemo(
    () => reels.filter((r) => r.creatorId === merchant?.ownerId).slice(0, 6),
    [reels, merchant]
  );

  const storePosts = useMemo(
    () => posts.filter((p) => p.creatorId === merchant?.ownerId).slice(0, 6),
    [posts, merchant]
  );

  if (!merchant) {
    return (
      <View style={[st.root, { backgroundColor: c.background, alignItems: "center", justifyContent: "center" }]}>
        <Feather name="alert-circle" size={40} color={c.textSecondary} strokeWidth={1} />
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", marginTop: 12 }}>المتجر غير موجود</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: c.accent, fontFamily: "Inter_600SemiBold" }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tier = TIER_LABELS[merchant.tier] ?? TIER_LABELS.bronze;
  const isFollowed = isMerchantFollowed(merchant.id);
  const isBlocked = isMerchantBlocked(merchant.id);
  const isOwn = currentUser?.id === merchant.ownerId;

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFollowMerchant(merchant.id);
    showToast(isFollowed ? "تم إلغاء المتابعة" : "تمت المتابعة! ✨", isFollowed ? "info" : "success");
  };

  const handleBlock = () => {
    blockMerchantStore(merchant.id);
    setConfirmBlock(false);
    showToast("تم حظر هذا المتجر", "error");
    router.back();
  };

  const handleChat = () => {
    if (!currentUser || !owner) return;
    const conv = getConversation(owner.id);
    router.push(`/chat/${conv.id}`);
  };

  const handleAddToCart = (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addToCart(
      {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        merchantId: product.merchantId,
        quantity: 1,
        productImage: product.images[0],
      },
      merchant.name
    );
    showToast("تمت الإضافة للسلة 🛒", "success");
  };

  return (
    <View style={[st.root, { backgroundColor: c.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 40 }}>

        {/* ── Hero Cover ── */}
        <View style={{ position: "relative" }}>
          {merchant.coverPhoto ? (
            <Image source={{ uri: merchant.coverPhoto }} style={[st.cover]} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={[`${tier.color}55`, `${tier.color}11`, c.background]}
              style={st.cover}
            />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.45)", "transparent", "rgba(0,0,0,0.6)"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[st.backBtn, { top: topPad + 10 }]}
          >
            <Feather name="arrow-left" size={20} color="#fff" strokeWidth={2} />
          </TouchableOpacity>

          {/* Tier badge */}
          <View style={[st.tierBadge, { backgroundColor: `${tier.color}22`, borderColor: `${tier.color}66` }]}>
            <Feather name={tier.icon as any} size={12} color={tier.color} />
            <Text style={{ color: tier.color, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>{tier.label}</Text>
          </View>
        </View>

        {/* ── Merchant Info ── */}
        <View style={[st.infoCard, { backgroundColor: c.card, borderColor: c.border }]}>
          {/* Logo */}
          <View style={st.logoWrap}>
            {merchant.logo ? (
              <Image source={{ uri: merchant.logo }} style={st.logo} />
            ) : (
              <LinearGradient colors={[`${tier.color}44`, `${tier.color}22`]} style={st.logoFallback}>
                <Text style={{ fontSize: 28, fontFamily: "Inter_700Bold", color: tier.color }}>
                  {merchant.name[0]?.toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <View style={[st.tierDot, { backgroundColor: tier.color }]} />
          </View>

          <Text style={[st.merchantName, { color: c.text }]}>{merchant.name}</Text>

          {merchant.bio ? (
            <Text style={[st.bio, { color: c.textSecondary }]}>{merchant.bio}</Text>
          ) : null}

          <View style={[st.metaRow]}>
            <View style={st.metaItem}>
              <Feather name="map-pin" size={13} color={c.textSecondary} strokeWidth={1.5} />
              <Text style={[st.metaText, { color: c.textSecondary }]}>{merchant.governorate}</Text>
            </View>
            <View style={st.metaItem}>
              <Feather name="box" size={13} color={c.textSecondary} strokeWidth={1.5} />
              <Text style={[st.metaText, { color: c.textSecondary }]}>{storeProducts.length} منتج</Text>
            </View>
            {merchant.category && (
              <View style={st.metaItem}>
                <Feather name="tag" size={13} color={c.textSecondary} strokeWidth={1.5} />
                <Text style={[st.metaText, { color: c.textSecondary }]}>{merchant.category}</Text>
              </View>
            )}
          </View>

          {/* ── Action Buttons ── */}
          {!isOwn && (
            <View style={st.actionRow}>
              {!isBlocked ? (
                <>
                  <TouchableOpacity
                    onPress={handleFollow}
                    style={{ flex: 1 }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={isFollowed ? [c.backgroundTertiary, c.backgroundTertiary] : ["#7C3AED", "#4F46E5"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={st.followBtn}
                    >
                      <Feather
                        name={isFollowed ? "user-check" : "user-plus"}
                        size={15}
                        color={isFollowed ? c.text : "#fff"}
                        strokeWidth={2}
                      />
                      <Text style={{ color: isFollowed ? c.text : "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                        {isFollowed ? "متابَع" : "متابعة"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleChat} style={[st.iconBtn, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}44` }]}>
                    <Feather name="message-circle" size={18} color={c.accent} strokeWidth={1.5} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setConfirmBlock(true)} style={[st.iconBtn, { backgroundColor: "#EF444418", borderColor: "#EF444444" }]}>
                    <Feather name="slash" size={18} color="#EF4444" strokeWidth={1.5} />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={[st.blockedBanner, { backgroundColor: "#EF444418", borderColor: "#EF444444" }]}>
                  <Feather name="slash" size={14} color="#EF4444" />
                  <Text style={{ color: "#EF4444", fontFamily: "Inter_500Medium", fontSize: 13 }}>
                    هذا المتجر محظور
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Catalog ── */}
        {storeProducts.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <View style={st.sectionHeader}>
              <Feather name="shopping-bag" size={16} color={c.accent} strokeWidth={1.5} />
              <Text style={[st.sectionTitle, { color: c.text }]}>المنتجات ({storeProducts.length})</Text>
            </View>
            <View style={st.productGrid}>
              {storeProducts.map((product) => {
                const isLow = product.stock > 0 && product.stock <= 5;
                return (
                  <View key={product.id} style={[st.productCard, { backgroundColor: c.card, borderColor: c.border }]}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => product.images[0] && setSelectedImg(product.images[0])}
                    >
                      {product.images[0] ? (
                        <Image source={{ uri: product.images[0] }} style={st.productImg} resizeMode="cover" />
                      ) : (
                        <View style={[st.productImgFallback, { backgroundColor: c.backgroundTertiary }]}>
                          <Feather name="image" size={28} color={c.border} strokeWidth={0.8} />
                        </View>
                      )}
                      {isLow && (
                        <View style={st.lowBadge}>
                          <Text style={{ color: "#F59E0B", fontSize: 9, fontFamily: "Inter_600SemiBold" }}>
                            آخر {product.stock} قطع
                          </Text>
                        </View>
                      )}
                      {product.stock === 0 && (
                        <View style={[st.lowBadge, { backgroundColor: "#EF444488" }]}>
                          <Text style={{ color: "#fff", fontSize: 9, fontFamily: "Inter_600SemiBold" }}>نفد</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={{ padding: 10, gap: 6 }}>
                      <Text style={{ color: c.text, fontFamily: "Inter_600SemiBold", fontSize: 13 }} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold", fontSize: 13 }}>
                        {product.price.toLocaleString()} IQD
                      </Text>
                      <TouchableOpacity
                        disabled={product.stock === 0}
                        onPress={() => handleAddToCart(product)}
                        style={{ opacity: product.stock === 0 ? 0.35 : 1 }}
                      >
                        <LinearGradient
                          colors={["#10B981", "#059669"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={st.addBtn}
                        >
                          <Feather name="shopping-cart" size={12} color="#fff" strokeWidth={2} />
                          <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>أضف للسلة</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Recent Posts/Reels Preview ── */}
        {(storePosts.length > 0 || storeReels.length > 0) && (
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <View style={st.sectionHeader}>
              <Feather name="film" size={16} color={c.accent} strokeWidth={1.5} />
              <Text style={[st.sectionTitle, { color: c.text }]}>المنشورات والريلز</Text>
            </View>
            <View style={st.mediaGrid}>
              {[...storePosts, ...storeReels].slice(0, 6).map((item: any, idx) => {
                const uri = (item as any).mediaUrl ?? (item as any).videoUrl;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[st.mediaThumb, { backgroundColor: c.backgroundTertiary }]}
                    onPress={() => uri && setSelectedImg(uri)}
                    activeOpacity={0.85}
                  >
                    {uri ? (
                      <Image source={{ uri }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
                    ) : (
                      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <Feather name="file-text" size={20} color={c.border} strokeWidth={1} />
                      </View>
                    )}
                    {(item as any).videoUrl && (
                      <View style={st.playOverlay}>
                        <Feather name="play" size={14} color="#fff" strokeWidth={2} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {storeProducts.length === 0 && storePosts.length === 0 && storeReels.length === 0 && (
          <View style={[st.emptyState, { borderColor: c.border }]}>
            <Feather name="package" size={48} color={c.border} strokeWidth={0.8} />
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 12 }}>
              لا توجد منتجات أو منشورات بعد
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Image Lightbox ── */}
      <Modal visible={!!selectedImg} transparent animationType="fade" onRequestClose={() => setSelectedImg(null)}>
        <Pressable style={st.lightboxOverlay} onPress={() => setSelectedImg(null)}>
          {selectedImg && (
            <Image source={{ uri: selectedImg }} style={st.lightboxImg} resizeMode="contain" />
          )}
          <TouchableOpacity style={st.lightboxClose} onPress={() => setSelectedImg(null)}>
            <Feather name="x" size={22} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </Pressable>
      </Modal>

      {/* ── Block Confirm Modal ── */}
      <Modal visible={confirmBlock} transparent animationType="fade" onRequestClose={() => setConfirmBlock(false)}>
        <Pressable style={st.modalOverlay} onPress={() => setConfirmBlock(false)}>
          <Pressable style={[st.modalCard, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => {}}>
            <View style={[st.modalIcon, { backgroundColor: "#EF444418" }]}>
              <Feather name="slash" size={26} color="#EF4444" strokeWidth={1.5} />
            </View>
            <Text style={[st.modalTitle, { color: c.text }]}>حظر "{merchant.name}"؟</Text>
            <Text style={[st.modalDesc, { color: c.textSecondary }]}>
              لن تظهر لك منتجاته في السوق ولن تتلقى إشعارات منه.
            </Text>
            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              <TouchableOpacity onPress={() => setConfirmBlock(false)} style={[st.modalCancelBtn, { borderColor: c.border }]}>
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium" }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBlock} style={{ flex: 1 }}>
                <LinearGradient colors={["#EF4444", "#c0392b"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.modalConfirmBtn}>
                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>حظر</Text>
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
  cover: { width: "100%", height: 200 },
  backBtn: {
    position: "absolute", left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  tierBadge: {
    position: "absolute", top: 16, right: 16,
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1,
  },
  infoCard: {
    marginHorizontal: 16, marginTop: -28,
    borderRadius: 24, borderWidth: 0.5,
    padding: 20, alignItems: "center", gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 10,
  },
  logoWrap: { position: "relative" },
  logo: { width: 76, height: 76, borderRadius: 20 },
  logoFallback: {
    width: 76, height: 76, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  tierDot: {
    position: "absolute", bottom: -3, right: -3,
    width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: "#fff",
  },
  merchantName: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  bio: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  actionRow: { flexDirection: "row", gap: 10, width: "100%", marginTop: 4 },
  followBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    paddingVertical: 12, borderRadius: 14,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  blockedBanner: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  productGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 16, justifyContent: "space-between",
  },
  productCard: {
    width: CARD_W, borderRadius: 18, borderWidth: 0.5,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  productImg: { width: "100%", height: 150, resizeMode: "cover" },
  productImgFallback: {
    width: "100%", height: 150,
    alignItems: "center", justifyContent: "center",
  },
  lowBadge: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: "#F59E0B88",
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3,
  },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderRadius: 10, paddingVertical: 9,
  },
  mediaGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 3,
  },
  mediaThumb: {
    width: (SW - 48) / 3, height: (SW - 48) / 3,
    borderRadius: 10, overflow: "hidden",
  },
  playOverlay: {
    position: "absolute", bottom: 6, right: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  emptyState: {
    margin: 16, borderRadius: 20, borderWidth: 1, borderStyle: "dashed",
    padding: 40, alignItems: "center",
  },
  lightboxOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center", justifyContent: "center",
  },
  lightboxImg: { width: "95%", height: "80%" },
  lightboxClose: {
    position: "absolute", top: 50, right: 20,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
  },
  modalCard: {
    width: "84%", maxWidth: 340, borderRadius: 24, borderWidth: 0.5,
    padding: 24, alignItems: "center", gap: 12,
  },
  modalIcon: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  modalTitle: { fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  modalDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  modalCancelBtn: {
    flex: 1, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  modalConfirmBtn: {
    flex: 1, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
});
