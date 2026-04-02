import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";

const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";

export default function ForgotPasswordScreen() {
  const { t } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const contactAdmin = () => {
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

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Feather name="lock" size={36} color="#F59E0B" strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>{t("forgotPassword")}</Text>
        <Text style={styles.desc}>
          لاستعادة كلمة المرور، تواصل مع المشرف عبر واتساب وسيتم مساعدتك في أقرب وقت ممكن.
        </Text>

        <TouchableOpacity onPress={contactAdmin} style={styles.waBtn} activeOpacity={0.85}>
          <Feather name="message-circle" size={20} color="#fff" strokeWidth={1.5} />
          <Text style={styles.waBtnText}>تواصل مع المشرف عبر واتساب</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backTextBtn}>
          <Text style={styles.backTextBtnText}>{t("cancel")}</Text>
        </TouchableOpacity>
      </View>
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
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 20 },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F59E0B18",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#F59E0B44",
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: TEXT, textAlign: "center" },
  desc: { fontSize: 15, fontFamily: "Inter_400Regular", color: TEXT2, textAlign: "center", lineHeight: 24 },
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
  backTextBtn: { paddingVertical: 12 },
  backTextBtnText: { color: TEXT2, fontSize: 15, fontFamily: "Inter_500Medium" },
});
