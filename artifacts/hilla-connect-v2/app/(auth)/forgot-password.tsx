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

const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";
const INPUT_BG = "#1C1C1C";
const ACCENT = "#3D91F4";
const SUCCESS = "#10B981";
const WARNING = "#F59E0B";

type Stage = "email" | "otp" | "reset" | "done";

export default function ForgotPasswordScreen() {
  const { sendEmailOTP, resetPasswordWithOTP, t } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

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

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: topPad + 12 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="arrow-left" size={22} color={TEXT} strokeWidth={1.5} />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Stage: Email ── */}
          {stage === "email" && (
            <>
              <View style={[styles.iconBox, { backgroundColor: `${WARNING}18`, borderColor: `${WARNING}44` }]}>
                <Feather name="mail" size={36} color={WARNING} strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>{t("forgotPassword")}</Text>
              <Text style={styles.desc}>
                أدخل بريدك الإلكتروني المسجل وسنرسل لك رمز التحقق لإعادة تعيين كلمة المرور.
              </Text>

              <View style={styles.inputWrapper}>
                <Feather name="mail" size={18} color={TEXT2} strokeWidth={1.5} />
                <TextInput
                  style={styles.input}
                  placeholder={t("email")}
                  placeholderTextColor={TEXT2}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSendOTP}
                  textAlign={Platform.OS !== "web" ? "right" : "left"}
                />
              </View>

              <TouchableOpacity onPress={handleSendOTP} style={styles.primaryBtn} activeOpacity={0.85} disabled={loading}>
                <Text style={styles.primaryBtnText}>{loading ? "..." : t("sendOTP")}</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>أو</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity onPress={contactWhatsApp} style={styles.waBtn} activeOpacity={0.85}>
                <Feather name="message-circle" size={20} color="#fff" strokeWidth={1.5} />
                <Text style={styles.waBtnText}>{t("whatsappRecovery")}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Stage: OTP ── */}
          {stage === "otp" && (
            <>
              <View style={[styles.iconBox, { backgroundColor: `${ACCENT}18`, borderColor: `${ACCENT}44` }]}>
                <Feather name="shield" size={36} color={ACCENT} strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>{t("enterOTP")}</Text>
              <Text style={styles.desc}>
                تم إرسال رمز التحقق المكوّن من 6 أرقام إلى {email}
              </Text>

              <View style={styles.inputWrapper}>
                <Feather name="key" size={18} color={TEXT2} strokeWidth={1.5} />
                <TextInput
                  ref={otpRef}
                  style={[styles.input, styles.otpInput]}
                  placeholder="• • • • • •"
                  placeholderTextColor={TEXT2}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOTP}
                  textAlign="center"
                />
              </View>

              <TouchableOpacity onPress={handleVerifyOTP} style={styles.primaryBtn} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>{t("verifyOTP")}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setStage("email"); setOtp(""); }} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>← إعادة الإرسال</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t("tryAnotherWay")}</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity onPress={contactWhatsApp} style={styles.waBtn} activeOpacity={0.85}>
                <Feather name="message-circle" size={20} color="#fff" strokeWidth={1.5} />
                <Text style={styles.waBtnText}>{t("whatsappRecovery")}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Stage: Reset ── */}
          {stage === "reset" && (
            <>
              <View style={[styles.iconBox, { backgroundColor: `${SUCCESS}18`, borderColor: `${SUCCESS}44` }]}>
                <Feather name="lock" size={36} color={SUCCESS} strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>{t("resetPassword")}</Text>
              <Text style={styles.desc}>أدخل كلمة المرور الجديدة</Text>

              <View style={styles.inputWrapper}>
                <Feather name="lock" size={18} color={TEXT2} strokeWidth={1.5} />
                <TextInput
                  ref={newPassRef}
                  style={styles.input}
                  placeholder={t("newPassword")}
                  placeholderTextColor={TEXT2}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  textAlign={Platform.OS !== "web" ? "right" : "left"}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  <Feather name={showNew ? "eye-off" : "eye"} size={18} color={TEXT2} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Feather name="lock" size={18} color={TEXT2} strokeWidth={1.5} />
                <TextInput
                  ref={confirmRef}
                  style={styles.input}
                  placeholder={t("confirmPassword")}
                  placeholderTextColor={TEXT2}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                  textAlign={Platform.OS !== "web" ? "right" : "left"}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color={TEXT2} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleReset} style={styles.primaryBtn} activeOpacity={0.85} disabled={loading}>
                <Text style={styles.primaryBtnText}>{loading ? "..." : t("resetPassword")}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Stage: Done ── */}
          {stage === "done" && (
            <>
              <View style={[styles.iconBox, { backgroundColor: `${SUCCESS}18`, borderColor: `${SUCCESS}44` }]}>
                <Feather name="check-circle" size={36} color={SUCCESS} strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>تم بنجاح!</Text>
              <Text style={styles.desc}>{t("passwordChanged")}</Text>

              <TouchableOpacity
                onPress={() => { router.dismissAll(); router.replace("/(auth)/login"); }}
                style={styles.primaryBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>{t("login")}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
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
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: TEXT, textAlign: "center" },
  desc: { fontSize: 15, fontFamily: "Inter_400Regular", color: TEXT2, textAlign: "center", lineHeight: 24 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: BORDER,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
    width: "100%",
  },
  input: { flex: 1, fontSize: 16, color: TEXT, fontFamily: "Inter_400Regular", height: "100%" },
  otpInput: { fontSize: 22, letterSpacing: 8, fontFamily: "Inter_700Bold" },
  primaryBtn: {
    backgroundColor: TEXT,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
  },
  primaryBtnText: { color: BG, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%" },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: BORDER },
  dividerText: { fontSize: 13, fontFamily: "Inter_400Regular", color: TEXT2 },
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
  cancelBtnText: { color: TEXT2, fontSize: 15, fontFamily: "Inter_500Medium" },
});
