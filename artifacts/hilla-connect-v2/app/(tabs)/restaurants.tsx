import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
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
import { useApp, type Product } from "@/context/AppContext";
import { ShopNowSheet } from "@/components/ShopNowSheet";
import { CartSheet } from "@/components/CartSheet";
import { useToast } from "@/components/Toast";

const { width: SW } = Dimensions.get("window");
const CARD_WIDTH = (SW - 48) / 2;
const CARD_IMG_H = 180;

const CATEGORIES = [
  { key: "all",         label: "الكل",       icon: "grid" },
  { key: "fashion",     label: "أزياء",      icon: "scissors" },
  { key: "electronics", label: "إلكترونيات", icon: "cpu" },
  { key: "food",        label: "طعام",       icon: "coffee" },
  { key: "beauty",      label: "تجميل",      icon: "star" },
  { key: "home",        label: "منزل",       icon: "home" },
  { key: "sports",      label: "رياضة",      icon: "activity" },
  { key: "other",       label: "أخرى",       icon: "package" },
];

type Particle = { id: number; anim: Animated.Value; x: number; y: number };

function useShimmer() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return shimmer;
}

function ShimmerCard({ c }: { c: any }) {
  const shimmer = useShimmer();
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  return (
    <View style={[st.productCard, { backgroundColor: c.card, borderColor: c.border, width: CARD_WIDTH }]}>
      <Animated.View style={[st.shimmerImg, { backgroundColor: c.backgroundTertiary, opacity }]} />
      <View style={{ padding: 10, gap: 8 }}>
        <Animated.View style={[st.shimmerLine, { backgroundColor: c.backgroundTertiary, width: "70%", opacity }]} />
        <Animated.View style={[st.shimmerLine, { backgroundColor: c.backgroundTertiary, width: "45%", opacity }]} />
        <Animated.View style={[st.shimmerBtn, { backgroundColor: c.backgroundTertiary, opacity }]} />
      </View>
    </View>
  );
}

function ProductQuickViewSheet({
  product,
  visible,
  onClose,
  onAddToCart,
  onOpenCart,
  merchants,
  c,
}: {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onOpenCart: () => void;
  merchants: any[];
  c: any;
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setImageIndex(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!product) return null;
  const merchant = merchants.find((m: any) => m.id === product.merchantId);
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const images = product.images.length > 0 ? product.images : [];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          st.quickSheet,
          {
            backgroundColor: c.card,
            borderColor: c.border,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <View style={[st.sheetHandle, { backgroundColor: c.border }]} />

        {/* Image carousel */}
        {images.length > 0 ? (
          <View style={st.quickImgWrap}>
            <ScrollView
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (SW - 48));
                setImageIndex(Math.min(idx, images.length - 1));
              }}
            >
              {images.map((uri, i) => (
                <Image key={i} source={{ uri }} style={[st.quickImg, { width: SW - 48 }]} resizeMode="cover" />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={st.dotRow}>
                {images.map((_, i) => (
                  <View key={i} style={[st.dot, { backgroundColor: i === imageIndex ? "#fff" : "rgba(255,255,255,0.4)" }]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[st.quickImgFallback, { backgroundColor: c.backgroundTertiary }]}>
            <Feather name="image" size={48} color={c.border} strokeWidth={0.8} />
          </View>
        )}

        <View style={{ padding: 20, gap: 12 }}>
          {merchant && (
            <View style={[st.merchantBadge, { backgroundColor: `${c.accent}18` }]}>
              <Feather name="package" size={11} color={c.accent} />
              <Text style={{ color: c.accent, fontFamily: "Inter_500Medium", fontSize: 11 }}>{merchant.name}</Text>
            </View>
          )}

          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>{product.name}</Text>

          {product.description ? (
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 }}>
              {product.description}
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold", fontSize: 22 }}>
              {product.price.toLocaleString()} IQD
            </Text>
            {isLowStock && (
              <View style={[st.lowStockBadge]}>
                <Feather name="alert-circle" size={12} color="#F59E0B" strokeWidth={2} />
                <Text style={{ color: "#F59E0B", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
                  متبقي {product.stock} قطع فقط!
                </Text>
              </View>
            )}
            {product.stock === 0 && (
              <View style={[st.outStockBadge]}>
                <Text style={{ color: "#EF4444", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>نفد المخزون</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={onClose} style={[st.cancelQV, { borderColor: c.border }]}>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium" }}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={product.stock === 0}
              onPress={() => { onAddToCart(product); onClose(); onOpenCart(); }}
              style={[st.addQVBtn, { opacity: product.stock === 0 ? 0.4 : 1 }]}
            >
              <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.addQVGrad}>
                <Feather name="shopping-cart" size={16} color="#fff" strokeWidth={2} />
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 }}>أضف للسلة</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

export default function MarketplaceScreen() {
  const c = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { products, merchants, addToCart, cart } = useApp();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [shopNowProducts, setShopNowProducts] = useState<string[]>([]);
  const [shopNowVisible, setShopNowVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewVisible, setQuickViewVisible] = useState(false);
  const [shimmerLoading, setShimmerLoading] = useState(true);

  const cartBtnRef = useRef<View>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => setShimmerLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  const cartCount = cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0;

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      if (activeCategory !== "all" && p.category !== activeCategory) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, activeCategory, search]);

  const spawnParticle = (px: number, py: number) => {
    const id = ++particleIdRef.current;
    const anim = new Animated.Value(0);
    setParticles((prev) => [...prev, { id, anim, x: px, y: py }]);
    Animated.timing(anim, { toValue: 1, duration: 620, useNativeDriver: true }).start(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    });
  };

  const handleQuickAdd = (product: Product, px?: number, py?: number) => {
    const merchant = merchants.find((m) => m.id === product.merchantId);
    if (!merchant) return;
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
    showToast("تمت الإضافة إلى السلة 🛒", "success");
    if (px !== undefined && py !== undefined) spawnParticle(px, py);
  };

  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const SHIMMER_COUNT = 6;

  return (
    <View style={[st.root, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[st.header, { paddingTop: topPad + 8, borderBottomColor: c.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={[st.headerTitle, { color: c.text }]}>سفرة بابل</Text>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
              {filtered.length} منتج متاح
            </Text>
          </View>
          <View ref={cartBtnRef}>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCartVisible(true); }}
              style={[st.cartBtn, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}
            >
              <Feather name="shopping-cart" size={20} color={c.text} strokeWidth={1.5} />
              {cartCount > 0 && (
                <View style={st.cartBadge}>
                  <Text style={st.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={[st.searchWrap, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}>
          <Feather name="search" size={16} color={c.textSecondary} strokeWidth={1.5} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث عن منتج..."
            placeholderTextColor={c.textSecondary}
            style={{ flex: 1, color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}
            textAlign="right"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={15} color={c.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat.key); }}
                  style={[st.catChip, { backgroundColor: active ? c.accent : c.backgroundTertiary, borderColor: active ? c.accent : c.border }]}
                >
                  <Feather name={cat.icon as any} size={13} color={active ? "#fff" : c.textSecondary} strokeWidth={1.5} />
                  <Text style={{ color: active ? "#fff" : c.text, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular", fontSize: 13 }}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Product Grid with parallax scroll */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[st.grid, { paddingBottom: botPad + 100 }]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {shimmerLoading ? (
          <View style={st.productGrid}>
            {Array.from({ length: SHIMMER_COUNT }).map((_, i) => (
              <ShimmerCard key={i} c={c} />
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View style={st.empty}>
            <Feather name="shopping-bag" size={60} color={c.border} strokeWidth={0.8} />
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", marginTop: 12, textAlign: "center" }}>
              {products.length === 0 ? "لا توجد منتجات بعد\nتابع المتاجر لتشاهد منتجاتهم" : "لا توجد نتائج"}
            </Text>
          </View>
        ) : (
          <View style={st.productGrid}>
            {filtered.map((product, index) => {
              const merchant = merchants.find((m) => m.id === product.merchantId);
              const isLowStock = product.stock > 0 && product.stock <= 5;

              const cardTop = Math.floor(index / 2) * (CARD_WIDTH * 1.55 + 16);
              const paralaxAnim = scrollY.interpolate({
                inputRange: [cardTop - 200, cardTop + 300],
                outputRange: [-20, 20],
                extrapolate: "clamp",
              });

              return (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => { setQuickViewProduct(product); setQuickViewVisible(true); }}
                  activeOpacity={0.88}
                  style={[st.productCard, { backgroundColor: c.card, borderColor: c.border, width: CARD_WIDTH }]}
                >
                  {/* Image with parallax */}
                  <View style={[st.imgClip, { height: CARD_IMG_H }]}>
                    {product.images[0] ? (
                      <Animated.Image
                        source={{ uri: product.images[0] }}
                        style={[st.productImg, { transform: [{ translateY: paralaxAnim }] }]}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[st.productImgFallback, { backgroundColor: c.backgroundTertiary, height: CARD_IMG_H + 40 }]}>
                        <Feather name="image" size={36} color={c.border} strokeWidth={0.8} />
                      </View>
                    )}
                    {/* Image count badge */}
                    {product.images.length > 1 && (
                      <View style={st.imgCountBadge}>
                        <Feather name="image" size={10} color="#fff" />
                        <Text style={{ color: "#fff", fontSize: 10, fontFamily: "Inter_500Medium" }}>{product.images.length}</Text>
                      </View>
                    )}
                  </View>

                  <View style={st.cardBody}>
                    {merchant && (
                      <View style={[st.merchantBadge, { backgroundColor: `${c.accent}18` }]}>
                        <Feather name="package" size={10} color={c.accent} strokeWidth={1.5} />
                        <Text style={{ color: c.accent, fontFamily: "Inter_500Medium", fontSize: 10 }} numberOfLines={1}>
                          {merchant.name}
                        </Text>
                      </View>
                    )}
                    <Text style={[st.productName, { color: c.text }]} numberOfLines={2}>{product.name}</Text>
                    <Text style={[st.productPrice, { color: "#10B981" }]}>
                      {product.price.toLocaleString()} IQD
                    </Text>

                    {/* Live stock urgency */}
                    {isLowStock && (
                      <View style={st.lowStockInCard}>
                        <Feather name="zap" size={10} color="#F59E0B" strokeWidth={2} />
                        <Text style={{ color: "#F59E0B", fontSize: 10, fontFamily: "Inter_600SemiBold" }}>
                          متبقي {product.stock} قطع فقط!
                        </Text>
                      </View>
                    )}
                    {product.stock === 0 && (
                      <Text style={{ color: "#EF4444", fontSize: 11, fontFamily: "Inter_400Regular" }}>نفد المخزون</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={(e) => {
                      if (product.stock > 0) {
                        const { pageX, pageY } = e.nativeEvent;
                        handleQuickAdd(product, pageX, pageY);
                      }
                    }}
                    disabled={product.stock === 0}
                    style={[st.addChip, { opacity: product.stock === 0 ? 0.35 : 1 }]}
                  >
                    <LinearGradient
                      colors={["#10B981", "#059669"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={st.addChipGrad}
                    >
                      <Feather name="plus" size={14} color="#fff" strokeWidth={2.5} />
                      <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>أضف</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </Animated.ScrollView>

      {/* Floating particle animations */}
      {particles.map((particle) => {
        const translateY = particle.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -160] });
        const translateX = particle.anim.interpolate({ inputRange: [0, 1], outputRange: [0, SW / 2 - particle.x] });
        const opacity = particle.anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.8, 0] });
        const scale = particle.anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.3, 0.5] });
        return (
          <Animated.View
            key={particle.id}
            pointerEvents="none"
            style={[
              st.particleView,
              {
                left: particle.x - 12,
                top: particle.y - 12,
                opacity,
                transform: [{ translateY }, { translateX }, { scale }],
              },
            ]}
          >
            <LinearGradient colors={["#10B981", "#059669"]} style={st.particleGrad}>
              <Feather name="shopping-cart" size={13} color="#fff" strokeWidth={2} />
            </LinearGradient>
          </Animated.View>
        );
      })}

      <ProductQuickViewSheet
        product={quickViewProduct}
        visible={quickViewVisible}
        onClose={() => setQuickViewVisible(false)}
        onAddToCart={(p) => handleQuickAdd(p)}
        onOpenCart={() => setCartVisible(true)}
        merchants={merchants}
        c={c}
      />

      <ShopNowSheet
        productIds={shopNowProducts}
        visible={shopNowVisible}
        onClose={() => setShopNowVisible(false)}
        onOpenCart={() => setCartVisible(true)}
      />
      <CartSheet visible={cartVisible} onClose={() => setCartVisible(false)} />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  cartBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -4, right: -4,
    minWidth: 18, height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 0.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 0.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  grid: { padding: 16 },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  productCard: {
    borderRadius: 20,
    borderWidth: 0.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  imgClip: { overflow: "hidden", width: "100%" },
  productImg: { width: "100%", height: CARD_IMG_H + 40 },
  productImgFallback: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  imgCountBadge: {
    position: "absolute",
    top: 8, left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  cardBody: { padding: 10, gap: 5 },
  merchantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  productName: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  productPrice: { fontSize: 15, fontFamily: "Inter_700Bold" },
  lowStockInCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F59E0B18",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  addChip: { marginHorizontal: 10, marginBottom: 10, borderRadius: 10, overflow: "hidden" },
  addChipGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 9,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  shimmerImg: { width: "100%", height: CARD_IMG_H, borderRadius: 0 },
  shimmerLine: { height: 12, borderRadius: 6 },
  shimmerBtn: { height: 34, borderRadius: 10, marginTop: 4 },
  particleView: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    zIndex: 999,
    pointerEvents: "none" as any,
  },
  particleGrad: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  quickSheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 0.5,
    overflow: "hidden",
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12 },
  quickImgWrap: { height: 240, overflow: "hidden" },
  quickImg: { height: 240 },
  quickImgFallback: { height: 200, alignItems: "center", justifyContent: "center" },
  dotRow: { position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  lowStockBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#F59E0B18", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  outStockBadge: {
    backgroundColor: "#EF444418", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  cancelQV: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  addQVBtn: { flex: 2, borderRadius: 14, overflow: "hidden" },
  addQVGrad: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50 },
});
