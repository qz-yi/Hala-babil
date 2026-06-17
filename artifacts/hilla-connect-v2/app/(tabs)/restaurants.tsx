import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
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

  const handleQuickAdd = (product: Product) => {
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
  };

  const topPad = Platform.OS === "web" ? 20 : insets.top;

  return (
    <View style={[st.root, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[st.header, { paddingTop: topPad + 8, borderBottomColor: c.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={[st.headerTitle, { color: c.text }]}>سفرة بابل</Text>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat.key); }}
                  style={[
                    st.catChip,
                    {
                      backgroundColor: active ? c.accent : c.backgroundTertiary,
                      borderColor: active ? c.accent : c.border,
                    },
                  ]}
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

      {/* Product grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[st.grid, { paddingBottom: (Platform.OS === "web" ? 20 : insets.bottom) + 100 }]}
      >
        {filtered.length === 0 ? (
          <View style={st.empty}>
            <Feather name="shopping-bag" size={60} color={c.border} strokeWidth={0.8} />
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", marginTop: 12, textAlign: "center" }}>
              {products.length === 0 ? "لا توجد منتجات بعد\nتابع المتاجر لتشاهد منتجاتهم" : "لا توجد نتائج"}
            </Text>
          </View>
        ) : (
          <View style={st.productGrid}>
            {filtered.map((product) => {
              const merchant = merchants.find((m) => m.id === product.merchantId);
              return (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => {
                    setShopNowProducts([product.id]);
                    setShopNowVisible(true);
                  }}
                  activeOpacity={0.85}
                  style={[st.productCard, { backgroundColor: c.card, borderColor: c.border, width: CARD_WIDTH }]}
                >
                  {product.images[0] ? (
                    <Image source={{ uri: product.images[0] }} style={st.productImg} />
                  ) : (
                    <View style={[st.productImgFallback, { backgroundColor: c.backgroundTertiary }]}>
                      <Feather name="image" size={36} color={c.border} strokeWidth={0.8} />
                    </View>
                  )}

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
                    {product.stock === 0 && (
                      <Text style={{ color: "#EF4444", fontSize: 11, fontFamily: "Inter_400Regular" }}>نفد المخزون</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => product.stock > 0 && handleQuickAdd(product)}
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
      </ScrollView>

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
    width: 42, height: 42,
    borderRadius: 21,
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
  },
  productImg: { width: "100%", height: 160, resizeMode: "cover" },
  productImgFallback: {
    width: "100%",
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: 10, gap: 4 },
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
  addChip: { marginHorizontal: 10, marginBottom: 10, borderRadius: 10, overflow: "hidden" },
  addChipGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
});
