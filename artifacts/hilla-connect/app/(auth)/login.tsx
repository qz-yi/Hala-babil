import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
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

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function LoginScreen() {
  const { login, t, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert(t("error"), t("fillAll"));
      return;
    }
    setLoading(true);
    const success = await login(phone.trim(), password);
    setLoading(false);
    if (success) {
      router.dismissAll();
      router.replace("/(tabs)");
    } else {
      Alert.alert(t("error"), t("invalidCredentials"));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          theme === "dark"
            ? ["rgba(79,70,229,0.15)", "transparent"]
            : ["rgba(79,70,229,0.08)", "transparent"]
        }
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 20, paddingBottom: botPad + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerBlock}>
            <LinearGradient
              colors={["#7C3AED", "#4F46E5"]}
              style={styles.iconBox}
            >
              <Ionicons name="person" size={28} color="#fff" />
            </LinearGradient>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("login")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t("hillaConnect")}
            </Text>
          </View>

          {/* Fields */}
          <View style={styles.form}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                placeholder={t("phone")}
                placeholderTextColor={colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                textAlign={Platform.OS !== "web" ? "right" : "left"}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                placeholder={t("password")}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                textAlign={Platform.OS !== "web" ? "right" : "left"}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              style={{ alignSelf: "flex-end" }}
            >
              <Text style={[styles.forgotText, { color: colors.tint }]}>
                {t("forgotPassword")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={["#7C3AED", "#4F46E5", "#3B82F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnText}>
                  {loading ? "..." : t("login")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <TouchableOpacity onPress={() => router.replace("/(auth)/register")}>
                <Text style={[styles.switchLink, { color: colors.tint }]}>
                  {t("register")}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                {"  "}?ليس لديك حساب
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerBlock: {
    alignItems: "center",
    gap: 12,
    marginVertical: 12,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 56,
    gap: 10,
  },
  inputIcon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  eyeBtn: {
    padding: 4,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginTop: -4,
  },
  submitBtn: {
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
    marginTop: 4,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  switchText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  switchLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
