import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
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
import { useApp, type PaymentMethod } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: string; color: string; desc: string }[] = [
  { key: "cod",      label: "الدفع عند الاستلام",  icon: "truck",          color: "#F59E0B", desc: "كاش مع تأكيد OTP" },
  { key: "zaincash", label: "ZainCash",             icon: "smartphone",     color: "#00B5A3", desc: "دفع فوري عبر التطبيق" },
  { key: "fastpay",  label: "FastPay",              icon: "zap",            color: "#5B4FE9", desc: "محفظة إلكترونية" },
  { key: "dafaa",    label: "Dafaa",                icon: "credit-card",    color: "#EF4444", desc: "بطاقة دفاع" },
];

type Step = "cart" | "checkout" | "otp" | "success";

export function CartSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const c = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { cart, removeFromCart, clearCart, placeOrder } = useApp();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>("cart");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const total = cart?.items.reduce((sum, i) => sum + i.productPrice * i.quantity, 0) ?? 0;

  const handleClose = () => {
    setStep("cart");
    setOtp("");
    onClose();
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("checkout");
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) { showToast("يرجى إدخال العنوان", "error"); return; }
    setLoading(true);
    const order = await placeOrder(paymentMethod, address.trim(), notes.trim());
    setLoading(false);
    if (!order) { showToast("حدث خطأ أثناء تقديم الطلب", "error"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (paymentMethod === "cod") {
      const code = String(Math.floor(1000 + Math.random() * 9000));
      setGeneratedOtp(code);
      setStep("otp");
    } else {
      setStep("success");
    }
  };

  const handleOtpConfirm = () => {
    if (otp === generatedOtp) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("success");
    } else {
      showToast("رمز OTP غير صحيح", "error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleDone = () => {
    setStep("cart");
    setOtp("");
    setAddress("");
    setNotes("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={st.backdrop} onPress={handleClose} />
      <View
        style={[
          st.sheet,
          {
            backgroundColor: c.card,
            borderColor: c.border,
            paddingBottom: (Platform.OS === "web" ? 20 : insets.bottom) + 20,
          },
        ]}
      >
        <View style={[st.handle, { backgroundColor: c.border }]} />

        {/* ── CART STEP ── */}
        {step === "cart" && (
          <>
            <View style={st.headerRow}>
              <Text style={[st.sheetTitle, { color: c.text }]}>🛒 السلة</Text>
              {(cart?.items.length ?? 0) > 0 && (
                <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); clearCart(); }}>
                  <Text style={{ color: c.danger, fontFamily: "Inter_500Medium", fontSize: 13 }}>إفراغ</Text>
                </TouchableOpacity>
              )}
            </View>
            {!cart || cart.items.length === 0 ? (
              <View style={{ alignItems: "center", padding: 40, gap: 12 }}>
                <Feather name="shopping-cart" size={52} color={c.border} strokeWidth={1} />
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>سلتك فارغة</Text>
              </View>
            ) : (
              <>
                <Text style={[st.merchantLabel, { color: c.textSecondary }]}>من: {cart.merchantName}</Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                  {cart.items.map((item) => (
                    <View key={item.productId} style={[st.cartItem, { borderBottomColor: c.border }]}>
                      {item.productImage ? (
                        <Image source={{ uri: item.productImage }} style={st.cartItemImg} />
                      ) : (
                        <View style={[st.cartItemImgFallback, { backgroundColor: c.border }]}>
                          <Feather name="image" size={18} color={c.textSecondary} />
                        </View>
                      )}
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={{ color: c.text, fontFamily: "Inter_600SemiBold", fontSize: 14 }} numberOfLines={1}>
                          {item.productName}
                        </Text>
                        {item.selectedVariations && Object.keys(item.selectedVariations).length > 0 && (
                          <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" }}>
                            {Object.entries(item.selectedVariations).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </Text>
                        )}
                        <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold", fontSize: 14 }}>
                          {(item.productPrice * item.quantity).toLocaleString()} IQD
                          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                            {" "}(×{item.quantity})
                          </Text>
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeFromCart(item.productId)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="x" size={18} color={c.textSecondary} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                <View style={[st.totalRow, { borderTopColor: c.border }]}>
                  <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium" }}>الإجمالي</Text>
                  <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18 }}>
                    {total.toLocaleString()} IQD
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCheckout} style={st.primaryBtnWrap}>
                  <LinearGradient colors={["#7C3AED", "#4F46E5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.primaryBtn}>
                    <Text style={st.primaryBtnText}>متابعة الطلب</Text>
                    <Feather name="arrow-left" size={18} color="#fff" strokeWidth={2} />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* ── CHECKOUT STEP ── */}
        {step === "checkout" && (
          <>
            <View style={st.headerRow}>
              <TouchableOpacity onPress={() => setStep("cart")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="arrow-right" size={22} color={c.text} strokeWidth={1.5} />
              </TouchableOpacity>
              <Text style={[st.sheetTitle, { color: c.text }]}>تفاصيل الطلب</Text>
              <View style={{ width: 22 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              <View>
                <Text style={[st.fieldLabel, { color: c.textSecondary }]}>العنوان *</Text>
                <View style={[st.inputWrap, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}>
                  <Feather name="map-pin" size={16} color={c.textSecondary} strokeWidth={1.5} />
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="المحافظة، الحي، رقم المنزل..."
                    placeholderTextColor={c.textSecondary}
                    style={{ flex: 1, color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}
                    textAlign="right"
                  />
                </View>
              </View>

              <View>
                <Text style={[st.fieldLabel, { color: c.textSecondary }]}>ملاحظات (اختياري)</Text>
                <View style={[st.inputWrap, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}>
                  <Feather name="message-square" size={16} color={c.textSecondary} strokeWidth={1.5} />
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="أي ملاحظات خاصة..."
                    placeholderTextColor={c.textSecondary}
                    style={{ flex: 1, color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}
                    textAlign="right"
                  />
                </View>
              </View>

              <Text style={[st.fieldLabel, { color: c.textSecondary }]}>طريقة الدفع</Text>
              {PAYMENT_OPTIONS.map((opt) => {
                const active = paymentMethod === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => { Haptics.selectionAsync(); setPaymentMethod(opt.key); }}
                    style={[
                      st.paymentCard,
                      {
                        backgroundColor: active ? `${opt.color}18` : c.backgroundTertiary,
                        borderColor: active ? opt.color : c.border,
                      },
                    ]}
                  >
                    <View style={[st.paymentIcon, { backgroundColor: `${opt.color}22` }]}>
                      <Feather name={opt.icon as any} size={20} color={opt.color} strokeWidth={1.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>{opt.label}</Text>
                      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>{opt.desc}</Text>
                    </View>
                    {active && <Feather name="check-circle" size={20} color={opt.color} strokeWidth={2} />}
                  </TouchableOpacity>
                );
              })}

              <View style={[st.totalRow, { borderTopColor: c.border }]}>
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium" }}>المجموع</Text>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18 }}>
                  {total.toLocaleString()} IQD
                </Text>
              </View>

              <TouchableOpacity onPress={handlePlaceOrder} disabled={loading} style={st.primaryBtnWrap}>
                <LinearGradient colors={["#7C3AED", "#4F46E5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.primaryBtn}>
                  <Text style={st.primaryBtnText}>{loading ? "جاري التأكيد..." : "تأكيد الطلب"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </>
        )}

        {/* ── COD OTP STEP ── */}
        {step === "otp" && (
          <View style={{ alignItems: "center", gap: 20, paddingVertical: 16 }}>
            <View style={[st.otpIconWrap, { backgroundColor: "#F59E0B22" }]}>
              <Feather name="shield" size={44} color="#F59E0B" strokeWidth={1.2} />
            </View>
            <Text style={[st.sheetTitle, { color: c.text }]}>تأكيد الاستلام</Text>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 }}>
              عند وصول المندوب، أعطه رمز التأكيد التالي أو أدخله في التطبيق
            </Text>
            <View style={[st.otpBox, { backgroundColor: "#F59E0B18", borderColor: "#F59E0B" }]}>
              <Text style={st.otpCode}>{generatedOtp}</Text>
            </View>
            <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" }}>
              أدخل الرمز الذي أدخله المندوب لتأكيد الاستلام
            </Text>
            <View style={[st.inputWrap, { backgroundColor: c.backgroundTertiary, borderColor: c.border, width: "100%" }]}>
              <Feather name="key" size={16} color={c.textSecondary} strokeWidth={1.5} />
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="أدخل رمز OTP"
                placeholderTextColor={c.textSecondary}
                keyboardType="number-pad"
                maxLength={4}
                style={{ flex: 1, color: c.text, fontFamily: "Inter_700Bold", fontSize: 22, textAlign: "center", letterSpacing: 8 }}
                textAlign="center"
              />
            </View>
            <TouchableOpacity onPress={handleOtpConfirm} style={[st.primaryBtnWrap, { width: "100%" }]}>
              <LinearGradient colors={["#F59E0B", "#D97706"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.primaryBtn}>
                <Feather name="check" size={18} color="#fff" strokeWidth={2} />
                <Text style={st.primaryBtnText}>تأكيد الاستلام</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ── SUCCESS STEP ── */}
        {step === "success" && (
          <View style={{ alignItems: "center", gap: 20, paddingVertical: 20 }}>
            <View style={[st.otpIconWrap, { backgroundColor: "#10B98122" }]}>
              <Feather name="check-circle" size={52} color="#10B981" strokeWidth={1.2} />
            </View>
            <Text style={[st.sheetTitle, { color: c.text }]}>تم تقديم الطلب! 🎉</Text>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 }}>
              شكراً لك! سيتم توصيل طلبك في أقرب وقت ممكن. يمكنك متابعة حالة طلبك في ملفك الشخصي.
            </Text>
            <TouchableOpacity onPress={handleDone} style={[st.primaryBtnWrap, { width: "100%" }]}>
              <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.primaryBtn}>
                <Text style={st.primaryBtnText}>متابعة التسوق</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
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
    maxHeight: "90%",
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  merchantLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8 },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  cartItemImg: { width: 56, height: 56, borderRadius: 10, resizeMode: "cover" },
  cartItemImgFallback: { width: 56, height: 56, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 0.5,
    marginTop: 4,
  },
  primaryBtnWrap: { borderRadius: 16, overflow: "hidden" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 0.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
  },
  paymentIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  otpIconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  otpBox: { borderWidth: 2, borderRadius: 20, paddingHorizontal: 36, paddingVertical: 16, borderStyle: "dashed" },
  otpCode: { fontSize: 42, fontFamily: "Inter_700Bold", color: "#F59E0B", letterSpacing: 14 },
});
