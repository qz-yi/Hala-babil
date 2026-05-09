import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { useThemeStore } from "@/store/themeStore";

type Stage = "email" | "otp" | "reset" | "done";

export default function ForgotPasswordScreen() {
  const { sendEmailOTP, resetPasswordWithOTP, t } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { tokens: c } = useThemeStore();

  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const otpRef = useRef<TextInput>(null);
  const newPassRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSendOTP = async () => {
    if (!email.trim()) { showToast(t("fillAll"), "error"); return; }
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showToast("أدخل بريداً إلكترونياً صالحاً", "error");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await sendEmailOTP(trimmedEmail);
    setLoading(false);
    if (!result.success) {
      let msg = "حدث خطأ. حاول مرة أخرى.";
      if (result.error === "network_error") {
        msg = "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.";
      } else if (result.error === "invalid_email") {
        msg = "البريد الإلكتروني المُدخَل غير صالح.";
      } else if (result.error === "send_failed") {
        msg = "فشل إرسال الرمز إلى بريدك. تحقق من صحة العنوان أو جرّب واتساب.";
      }
      showToast(msg, "error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    showToast(t("otpSent"), "success");
    setStage("otp");
    setTimeout(() => otpRef.current?.focus(), 400);
  };

  const handleVerifyOTP = () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      showToast("أدخل رمز التحقق المكوّن من 6 أرقام", "error");
      return;
    }
    setStage("reset");
    setTimeout(() => newPassRef.current?.focus(), 400);
  };

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) { showToast(t("fillAll"), "error"); return; }
    if (newPassword !== confirmPassword) { showToast(t("passwordMismatch"), "error"); return; }
    if (newPassword.length < 6) { showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error"); return; }
    setLoading(true);
    const result = await resetPasswordWithOTP(email.trim(), otp.trim(), newPassword);
    setLoading(false);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t("passwordChanged"), "success");
      setStage("done");
    } else {
      const errMsg = result.error === "network_error"
        ? "تعذّر الاتصال بالخادم. تحقق من اتصالك."
        : result.error === "not_found"
          ? t("emailNotFound")
          : t("otpInvalid");
      showToast(errMsg, "error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (result.error !== "network_error" && result.error !== "not_found") {
        setStage("otp");
        setOtp("");
      }
    }
  };

  const contactWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("https://wa.me/9647719820537?text=طلب+إعادة+تعيين+كلمة+المرور");
  };

  const ff = c.fontFamily;

  return (
    <View style={[st.container, { backgroundColor: c.background, paddingTop: topPad, paddingBottom: botPad }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[st.backBtn, { top: topPad + 12 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="arrow-left" size={22} color={c.text} strokeWidth={1.5} />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={st.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Stage: Email ── */}
          {stage === "email" && (
            <>
              <View style={[st.iconBox, { backgroundColor: `${c.warning}18`, borderColor: `${c.warning}44` }]}>
                <Feather name="mail" size={36} color={c.warning} strokeWidth={1.5} />
              </View>
              <Text style={[st.title, { color: c.text, fontFamily: ff ?? "Inter_700Bold" }]}>
                {t("forgotPassword")}
              </Text>
              <Text style={[st.desc, { color: c.textSecondary, fontFamily: ff ?? "Inter_400Regular" }]}>
                أدخل بريدك الإلكتروني المسجل وسنرسل لك رمز التحقق لإعادة تعيين كلمة المرور.
              </Text>

              <View style={[st.inputWrapper, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
                <Feather name="mail" size={18} color={c.textSecondary} strokeWidth={1.5} />
                <TextInput
                  style={[st.input, { color: c.text, fontFamily: ff ?? "Inter_400Regular" }]}
                  placeholder={t("email")}
                  placeholderTextColor={c.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSendOTP}
                  textAlign={Platform.OS !== "web" ? "right" : "left"}
                />
              </View>

              <TouchableOpacity
                onPress={handleSendOTP}
                style={[st.primaryBtn, { backgroundColor: c.accent }]}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={[st.primaryBtnText, { color: "#FFFFFF", fontFamily: ff ?? "Inter_600SemiBold" }]}>
                  {loading ? "..." : t("sendOTP")}
                </Text>
              </TouchableOpacity>

              <View style={st.divider}>
                <View style={[st.dividerLine, { backgroundColor: c.border }]} />
                <Text style={[st.dividerText, { color: c.textSecondary, fontFamily: ff ?? "Inter_400Regular" }]}>أو</Text>
                <View style={[st.dividerLine, { backgroundColor: c.border }]} />
              </View>

              <TouchableOpacity onPress={contactWhatsApp} style={st.waBtn} activeOpacity={0.85}>
                <Feather name="message-circle" size={20} color="#fff" strokeWidth={1.5} />
                <Text style={st.waBtnText}>{t("whatsappRecovery")}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={st.cancelBtn}>
                <Text style={[st.cancelBtnText, { color: c.textSecondary, fontFamily: ff ?? "Inter_500Medium" }]}>
                  {t("cancel")}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Stage: OTP ── */}
          {stage === "otp" && (
            <>
              <View style={[st.iconBox, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}44` }]}>
                <Feather name="shield" size={36} color={c.accent} strokeWidth={1.5} />
              </View>
              <Text style={[st.title, { color: c.text, fontFamily: ff ?? "Inter_700Bold" }]}>
                {t("enterOTP")}
              </Text>
              <Text style={[st.desc, { color: c.textSecondary, fontFamily: ff ?? "Inter_400Regular" }]}>
                تم إرسال رمز التحقق المكوّن من 6 أرقام إلى {email}
              </Text>

              <View style={[st.inputWrapper, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
                <Feather name="key" size={18} color={c.textSecondary} strokeWidth={1.5} />
                <TextInput
                  ref={otpRef}
                  style={[st.input, st.otpInput, { color: c.text, fontFamily: ff ?? "Inter_700Bold" }]}
                  placeholder="• • • • • •"
                  placeholderTextColor={c.textSecondary}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOTP}
                  textAlign="center"
                />
              </View>

              <TouchableOpacity
                onPress={handleVerifyOTP}
                style={[st.primaryBtn, { backgroundColor: c.accent }]}
                activeOpacity={0.85}
              >
                <Text style={[st.primaryBtnText, { color: "#FFFFFF", fontFamily: ff ?? "Inter_600SemiBold" }]}>
                  {t("verifyOTP")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setStage("email"); setOtp(""); }} style={st.cancelBtn}>
                <Text style={[st.cancelBtnText, { color: c.textSecondary, fontFamily: ff ?? "Inter_500Medium" }]}>
                  ← إعادة الإرسال
                </Text>
              </TouchableOpacity>

              <View style={st.divider}>
                <View style={[st.dividerLine, { backgroundColor: c.border }]} />
                <Text style={[st.dividerText, { color: c.textSecondary, fontFamily: ff ?? "Inter_400Regular" }]}>
                  {t("tryAnotherWay")}
                </Text>
                <View style={[st.dividerLine, { backgroundColor: c.border }]} />
              </View>

              <TouchableOpacity onPress={contactWhatsApp} style={st.waBtn} activeOpacity={0.85}>
                <Feather name="message-circle" size={20} color="#fff" strokeWidth={1.5} />
                <Text style={st.waBtnText}>{t("whatsappRecovery")}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Stage: Reset ── */}
          {stage === "reset" && (
            <>
              <View style={[st.iconBox, { backgroundColor: `${c.success}18`, borderColor: `${c.success}44` }]}>
                <Feather name="lock" size={36} color={c.success} strokeWidth={1.5} />
              </View>
              <Text style={[st.title, { color: c.text, fontFamily: ff ?? "Inter_700Bold" }]}>
                {t("resetPassword")}
              </Text>
              <Text style={[st.desc, { color: c.textSecondary, fontFamily: ff ?? "Inter_400Regular" }]}>
                أدخل كلمة المرور الجديدة
              </Text>

              <View style={[st.inputWrapper, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
                <Feather name="lock" size={18} color={c.textSecondary} strokeWidth={1.5} />
                <TextInput
                  ref={newPassRef}
                  style={[st.input, { color: c.text, fontFamily: ff ?? "Inter_400Regular" }]}
                  placeholder={t("newPassword")}
                  placeholderTextColor={c.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  textAlign={Platform.OS !== "web" ? "right" : "left"}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  <Feather name={showNew ? "eye-off" : "eye"} size={18} color={c.textSecondary} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>

              <View style={[st.inputWrapper, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
                <Feather name="lock" size={18} color={c.textSecondary} strokeWidth={1.5} />
                <TextInput
                  ref={confirmRef}
                  style={[st.input, { color: c.text, fontFamily: ff ?? "Inter_400Regular" }]}
                  placeholder={t("confirmPassword")}
                  placeholderTextColor={c.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                  textAlign={Platform.OS !== "web" ? "right" : "left"}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color={c.textSecondary} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleReset}
                style={[st.primaryBtn, { backgroundColor: c.accent }]}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={[st.primaryBtnText, { color: "#FFFFFF", fontFamily: ff ?? "Inter_600SemiBold" }]}>
                  {loading ? "..." : t("resetPassword")}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Stage: Done ── */}
          {stage === "done" && (
            <>
              <View style={[st.iconBox, { backgroundColor: `${c.success}18`, borderColor: `${c.success}44` }]}>
                <Feather name="check-circle" size={36} color={c.success} strokeWidth={1.5} />
              </View>
              <Text style={[st.title, { color: c.text, fontFamily: ff ?? "Inter_700Bold" }]}>تم بنجاح!</Text>
              <Text style={[st.desc, { color: c.textSecondary, fontFamily: ff ?? "Inter_400Regular" }]}>
                {t("passwordChanged")}
              </Text>

              <TouchableOpacity
                onPress={() => { router.dismissAll(); router.replace("/(auth)/login"); }}
                style={[st.primaryBtn, { backgroundColor: c.accent }]}
                activeOpacity={0.85}
              >
                <Text style={[st.primaryBtnText, { color: "#FFFFFF", fontFamily: ff ?? "Inter_600SemiBold" }]}>
                  {t("login")}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 32,
    gap: 16,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    marginBottom: 4,
  },
  title: { fontSize: 26, textAlign: "center" },
  desc: { fontSize: 15, textAlign: "center", lineHeight: 24 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 0.5,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
    width: "100%",
  },
  input: { flex: 1, fontSize: 16, height: "100%" },
  otpInput: { fontSize: 22, letterSpacing: 8 },
  primaryBtn: {
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
  },
  primaryBtnText: { fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%" },
  dividerLine: { flex: 1, height: 0.5 },
  dividerText: { fontSize: 13 },
  waBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#25D366",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 100,
    width: "100%",
    justifyContent: "center",
  },
  waBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { paddingVertical: 12 },
  cancelBtnText: { fontSize: 15 },
});
