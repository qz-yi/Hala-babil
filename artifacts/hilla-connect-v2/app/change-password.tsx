import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
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

export default function ChangePasswordScreen() {
  const c = useThemeStore((s) => s.tokens);
  const { changePassword, t, theme } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast(t("fillAll"), "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(t("passwordMismatch"), "error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (newPassword.length < 6) {
      showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await changePassword(oldPassword, newPassword);
    setLoading(false);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t("passwordChanged"), "success");
      router.back();
    } else if (result.error === "wrong_password") {
      showToast(t("wrongPassword"), "error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      showToast(t("error"), "error");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad, backgroundColor: c.background }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: topPad + 12 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="arrow-left" size={22} color={c.text} strokeWidth={1.5} />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconBox}>
            <Feather name="lock" size={36} color="#10B981" strokeWidth={1.5} />
          </View>

          <Text style={[styles.title, { color: c.text }]}>{t("changePassword")}</Text>
          <Text style={[styles.desc, { color: c.textSecondary }]}>أدخل كلمة المرور الحالية ثم كلمة المرور الجديدة</Text>

          {/* كلمة المرور الحالية */}
          <View style={[styles.inputWrapper, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}>
            <Feather name="lock" size={18} color={c.textSecondary} strokeWidth={1.5} />
            <TextInput
              style={[styles.input, { color: c.text }]}
              placeholder={t("oldPassword")}
              placeholderTextColor={c.textSecondary}
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry={!showOld}
              returnKeyType="next"
              onSubmitEditing={() => newRef.current?.focus()}
              textAlign={Platform.OS !== "web" ? "right" : "left"}
            />
            <TouchableOpacity onPress={() => setShowOld(!showOld)}>
              <Feather name={showOld ? "eye-off" : "eye"} size={18} color={c.textSecondary} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {/* كلمة المرور الجديدة */}
          <View style={[styles.inputWrapper, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}>
            <Feather name="unlock" size={18} color={c.textSecondary} strokeWidth={1.5} />
            <TextInput
              ref={newRef}
              style={[styles.input, { color: c.text }]}
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

          {/* تأكيد كلمة المرور */}
          <View style={[styles.inputWrapper, { backgroundColor: c.backgroundTertiary, borderColor: c.border }]}>
            <Feather name="check-circle" size={18} color={c.textSecondary} strokeWidth={1.5} />
            <TextInput
              ref={confirmRef}
              style={[styles.input, { color: c.text }]}
              placeholder={t("confirmPassword")}
              placeholderTextColor={c.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              textAlign={Platform.OS !== "web" ? "right" : "left"}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color={c.textSecondary} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitBtn, { backgroundColor: c.text }]}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={[styles.submitBtnText, { color: c.background }]}>{loading ? "..." : t("save")}</Text>
          </TouchableOpacity>

          {/* Forgot Password link */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
            style={styles.forgotLink}
            activeOpacity={0.7}
          >
            <Feather name="help-circle" size={14} color={c.accent} strokeWidth={1.5} />
            <Text style={[styles.forgotLinkText, { color: c.accent }]}>{t("forgotPassword")}</Text>
          </TouchableOpacity>

          {/* WhatsApp support fallback */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
            <Text style={[styles.dividerText, { color: c.textSecondary }]}>أو</Text>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          </View>

          <TouchableOpacity
            onPress={() => {
              const { Linking } = require("react-native");
              Linking.openURL("https://wa.me/9647719820537?text=طلب+مساعدة+في+تغيير+كلمة+المرور");
            }}
            style={styles.waBtn}
            activeOpacity={0.85}
          >
            <Feather name="message-circle" size={18} color="#fff" strokeWidth={1.5} />
            <Text style={styles.waBtnText}>التواصل مع الدعم عبر واتساب</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: 80,
    paddingBottom: 32,
    gap: 16,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#10B98118",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#10B98144",
    marginBottom: 4,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  desc: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
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
  input: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular", height: "100%" },
  submitBtn: {
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
  submitBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  forgotLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  forgotLinkText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    marginTop: 4,
  },
  dividerLine: { flex: 1, height: 0.5 },
  dividerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  waBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#25D366",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 100,
    width: "100%",
    justifyContent: "center",
  },
  waBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
