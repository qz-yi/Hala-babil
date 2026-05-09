import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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

export default function LoginScreen() {
  const { login, t } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { tokens: c } = useThemeStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      showToast(t("fillAll"), "error");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await login(identifier.trim(), password);
    setLoading(false);
    if (success) {
      showToast(t("welcome") + "!", "success");
      router.dismissAll();
      router.replace("/(tabs)");
    } else {
      showToast(t("invalidCredentials"), "error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={[st.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[st.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={st.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={22} color={c.text} strokeWidth={1.5} />
          </TouchableOpacity>

          <View style={st.headerBlock}>
            <LinearGradient
              colors={[c.gradientStart, c.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={st.logoRing}
            >
              <View style={[st.logoInner, { backgroundColor: c.card }]}>
                <Feather name="user" size={28} color={c.text} strokeWidth={1.5} />
              </View>
            </LinearGradient>
            <Text style={[st.title, { color: c.text, fontFamily: c.fontFamily ?? "Inter_700Bold" }]}>
              {t("login")}
            </Text>
            <Text style={[st.subtitle, { color: c.textSecondary, fontFamily: c.fontFamily ?? "Inter_400Regular" }]}>
              {t("welcomeToApp")}
            </Text>
          </View>

          <View style={st.form}>
            <View style={[st.inputWrapper, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
              <Feather name="at-sign" size={18} color={c.textSecondary} strokeWidth={1.5} />
              <TextInput
                style={[st.input, { color: c.text, fontFamily: c.fontFamily ?? "Inter_400Regular" }]}
                placeholder={t("usernameOrEmail")}
                placeholderTextColor={c.textSecondary}
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                textAlign={Platform.OS !== "web" ? "right" : "left"}
              />
            </View>

            <View style={[st.inputWrapper, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
              <Feather name="lock" size={18} color={c.textSecondary} strokeWidth={1.5} />
              <TextInput
                ref={passwordRef}
                style={[st.input, { color: c.text, fontFamily: c.fontFamily ?? "Inter_400Regular" }]}
                placeholder={t("password")}
                placeholderTextColor={c.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                textAlign={Platform.OS !== "web" ? "right" : "left"}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={st.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={c.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              style={{ alignSelf: "flex-end" }}
            >
              <Text style={[st.forgotText, { color: c.textSecondary, fontFamily: c.fontFamily ?? "Inter_500Medium" }]}>
                {t("forgotPassword")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
              style={[st.submitBtn, { backgroundColor: c.text }]}
            >
              <Text style={[st.submitBtnText, { color: c.background, fontFamily: c.fontFamily ?? "Inter_600SemiBold" }]}>
                {loading ? "..." : t("login")}
              </Text>
            </TouchableOpacity>

            <View style={st.switchRow}>
              <Text style={[st.switchText, { color: c.textSecondary, fontFamily: c.fontFamily ?? "Inter_400Regular" }]}>
                ?ليس لديك حساب{"  "}
              </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/register")}>
                <Text style={[st.switchLink, { color: c.text, fontFamily: c.fontFamily ?? "Inter_600SemiBold" }]}>
                  {t("register")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 32 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerBlock: { alignItems: "center", gap: 16 },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    padding: 2.5,
  },
  logoInner: {
    width: "100%",
    height: "100%",
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 28, textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center" },
  form: { gap: 16 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 0.5,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: { flex: 1, fontSize: 16, height: "100%" },
  eyeBtn: { padding: 4 },
  forgotText: { fontSize: 14, marginTop: -4 },
  submitBtn: {
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnText: { fontSize: 17 },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 4 },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14 },
});
