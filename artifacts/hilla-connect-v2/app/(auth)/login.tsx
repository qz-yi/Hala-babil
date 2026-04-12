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

const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";
const INPUT_BG = "#1C1C1C";

export default function LoginScreen() {
  const { login, t } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
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
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 16, paddingBottom: botPad + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={22} color={TEXT} strokeWidth={1.5} />
          </TouchableOpacity>

          <View style={styles.headerBlock}>
            <LinearGradient
              colors={["#d6249f", "#285AEB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoRing}
            >
              <View style={styles.logoInner}>
                <Feather name="user" size={28} color={TEXT} strokeWidth={1.5} />
              </View>
            </LinearGradient>
            <Text style={styles.title}>{t("login")}</Text>
            <Text style={styles.subtitle}>مرحباً بك في هلا بابل</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Feather name="at-sign" size={18} color={TEXT2} strokeWidth={1.5} />
              <TextInput
                style={styles.input}
                placeholder={t("usernameOrEmail")}
                placeholderTextColor={TEXT2}
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                textAlign={Platform.OS !== "web" ? "right" : "left"}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color={TEXT2} strokeWidth={1.5} />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder={t("password")}
                placeholderTextColor={TEXT2}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                textAlign={Platform.OS !== "web" ? "right" : "left"}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color={TEXT2}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              style={{ alignSelf: "flex-end" }}
            >
              <Text style={styles.forgotText}>{t("forgotPassword")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
              style={styles.submitBtn}
            >
              <Text style={styles.submitBtnText}>{loading ? "..." : t("login")}</Text>
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>?ليس لديك حساب{"  "}</Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/register")}>
                <Text style={styles.switchLink}>{t("register")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
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
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: TEXT, textAlign: "center" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", color: TEXT2, textAlign: "center" },
  form: { gap: 16 },
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
  },
  input: { flex: 1, fontSize: 16, color: TEXT, fontFamily: "Inter_400Regular", height: "100%" },
  eyeBtn: { padding: 4 },
  forgotText: { fontSize: 14, fontFamily: "Inter_500Medium", color: TEXT2, marginTop: -4 },
  submitBtn: {
    backgroundColor: TEXT,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnText: { color: BG, fontSize: 17, fontFamily: "Inter_600SemiBold" },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 4 },
  switchText: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT2 },
  switchLink: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: TEXT },
});
