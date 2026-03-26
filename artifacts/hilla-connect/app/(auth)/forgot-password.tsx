import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function ForgotPasswordScreen() {
  const { t, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const contactAdmin = () => {
    Linking.openURL("https://wa.me/9647719820537?text=طلب+إعادة+تعيين+كلمة+المرور");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: botPad }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border, top: topPad + 16 }]}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.iconBox}>
          <Ionicons name="help-buoy" size={36} color="#fff" />
        </LinearGradient>

        <Text style={[styles.title, { color: colors.text }]}>
          {t("forgotPassword")}
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          لاستعادة كلمة مرورك، يرجى التواصل مع المدير الأعلى عبر واتساب وسيتم المساعدة في إعادة تعيينها.
        </Text>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.warning} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            سيتم إعادة تعيين كلمة مرورك بشكل آمن بعد التحقق من هويتك.
          </Text>
        </View>

        <TouchableOpacity activeOpacity={0.85} onPress={contactAdmin}>
          <LinearGradient
            colors={["#25D366", "#128C7E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.whatsappBtn}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
            <Text style={styles.whatsappBtnText}>{t("contactAdmin")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: {
    position: "absolute",
    left: 24,
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
    zIndex: 10,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  iconBox: {
    width: 88, height: 88, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#F59E0B", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 14,
    marginBottom: 8,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  desc: {
    fontSize: 15, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 24, maxWidth: 320,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 340,
  },
  infoText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 18, paddingHorizontal: 32,
    borderRadius: 18,
    shadowColor: "#25D366", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
  whatsappBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
