import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeStore } from "@/store/themeStore";
import { useApp, type Product } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

export function ShopNowSheet({
  productIds,
  visible,
  onClose,
  onOpenCart,
}: {
  productIds: string[];
  visible: boolean;
  onClose: () => void;
  onOpenCart: () => void;
}) {
  const c = useThemeStore((s) => s.tokens);
  const { products, merchants, addToCart } = useApp();
  const { showToast } = useToast();
  const [selectedVariations, setSelectedVariations] = useState<Record<string, Record<string, string>>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const linkedProducts = productIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  const getQty = (productId: string) => quantities[productId] ?? 1;
  const setQty = (productId: string, qty: number) => {
    if (qty < 1) return;
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  };
  const setVariation = (productId: string, label: string, option: string) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] ?? {}), [label]: option },
    }));
  };

  const handleAddToCart = (product: Product) => {
    const merchant = merchants.find((m) => m.id === product.merchantId);
    if (!merchant) { showToast("لا يمكن العثور على المتجر", "error"); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addToCart(
      {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        merchantId: product.merchantId,
        quantity: getQty(product.id),
        selectedVariations: selectedVariations[product.id],
        productImage: product.images[0],
      },
      merchant.name
    );
    showToast("تمت الإضافة إلى السلة 🛒", "success");
    onClose();
    onOpenCart();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} />
      <View style={[st.sheet, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={[st.handle, { backgroundColor: c.border }]} />
        <Text style={[st.title, { color: c.text }]}>🛍️ تسوق الآن</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
        >
          {linkedProducts.length === 0 ? (
            <View style={{ alignItems: "center", padding: 40, gap: 12 }}>
              <Feather name="shopping-bag" size={48} color={c.border} strokeWidth={1} />
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" }}>
                لا توجد منتجات مرتبطة بهذا المقطع
              </Text>
            </View>
          ) : (
            linkedProducts.map((product) => {
              const merchant = merchants.find((m) => m.id === product.merchantId);
              const qty = getQty(product.id);
              return (
                <View
                  key={product.id}
                  style={[st.card, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}
                >
                  <View style={st.cardTop}>
                    {product.images[0] ? (
                      <Image source={{ uri: product.images[0] }} style={st.productImg} />
                    ) : (
                      <View style={[st.imgFallback, { backgroundColor: c.border }]}>
                        <Feather name="image" size={26} color={c.textSecondary} strokeWidth={1} />
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[st.productName, { color: c.text }]} numberOfLines={2}>
                        {product.name}
                      </Text>
                      {merchant && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Feather name="package" size={11} color={c.textSecondary} strokeWidth={1.5} />
                          <Text style={[st.merchantName, { color: c.textSecondary }]} numberOfLines={1}>
                            {merchant.name}
                          </Text>
                        </View>
                      )}
                      <Text style={st.price}>{product.price.toLocaleString()} IQD</Text>
                      {product.stock > 0 && product.stock <= 5 && (
                        <Text style={st.stockWarn}>آخر {product.stock} قطع!</Text>
                      )}
                      {product.stock === 0 && (
                        <Text style={st.outOfStock}>نفد المخزون</Text>
                      )}
                    </View>
                  </View>

                  {product.variations?.map((variation) => (
                    <View key={variation.id} style={{ marginTop: 10 }}>
                      <Text style={[st.varLabel, { color: c.textSecondary }]}>{variation.label}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          {variation.options.map((opt) => {
                            const active = selectedVariations[product.id]?.[variation.label] === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                onPress={() => {
                                  Haptics.selectionAsync();
                                  setVariation(product.id, variation.label, opt);
                                }}
                                style={[
                                  st.varChip,
                                  {
                                    backgroundColor: active ? c.accent : c.background,
                                    borderColor: active ? c.accent : c.border,
                                  },
                                ]}
                              >
                                <Text style={{ color: active ? "#fff" : c.text, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  ))}

                  <View style={st.cardBottom}>
                    <View style={[st.qtyRow, { borderColor: c.border, backgroundColor: c.background }]}>
                      <TouchableOpacity
                        onPress={() => { Haptics.selectionAsync(); setQty(product.id, qty - 1); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="minus" size={15} color={c.text} strokeWidth={2} />
                      </TouchableOpacity>
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", minWidth: 24, textAlign: "center" }}>
                        {qty}
                      </Text>
                      <TouchableOpacity
                        onPress={() => { Haptics.selectionAsync(); setQty(product.id, qty + 1); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="plus" size={15} color={c.text} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      style={{ flex: 1, opacity: product.stock === 0 ? 0.4 : 1 }}
                    >
                      <LinearGradient
                        colors={["#10B981", "#059669"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={st.addBtn}
                      >
                        <Feather name="shopping-cart" size={15} color="#fff" strokeWidth={2} />
                        <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                          أضف للسلة
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 0.5,
    padding: 20,
    maxHeight: "80%",
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 16 },
  card: {
    borderRadius: 20,
    borderWidth: 0.5,
    padding: 14,
    gap: 4,
  },
  cardTop: { flexDirection: "row", gap: 12 },
  productImg: { width: 90, height: 90, borderRadius: 14, resizeMode: "cover" },
  imgFallback: { width: 90, height: 90, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 15, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  merchantName: { fontSize: 12, fontFamily: "Inter_400Regular" },
  price: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#10B981" },
  stockWarn: { fontSize: 12, color: "#F59E0B", fontFamily: "Inter_500Medium" },
  outOfStock: { fontSize: 12, color: "#EF4444", fontFamily: "Inter_500Medium" },
  varLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  varChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardBottom: { flexDirection: "row", gap: 10, marginTop: 12, alignItems: "center" },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 0.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
  },
});
