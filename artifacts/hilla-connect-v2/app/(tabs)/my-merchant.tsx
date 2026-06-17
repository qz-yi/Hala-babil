import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useThemeStore } from "@/store/themeStore";

export default function MyMerchantScreen() {
  const c = useThemeStore((s) => s.tokens);
  const { currentUser, isMerchantOwner } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (!currentUser) router.replace("/(auth)/login");
  }, [currentUser]);

  if (!currentUser || !isMerchantOwner) return null;

  if (currentUser.isActive === false) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background, padding: 32, gap: 20 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#FF3B5C22", alignItems: "center", justifyContent: "center" }}>
          <Feather name="slash" size={40} color={c.danger} strokeWidth={1.5} />
        </View>
        <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 22, textAlign: "center" }}>حسابك موقوف</Text>
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 24 }}>
          تواصل مع الإدارة لإعادة تفعيل حسابك
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingTop: topPad + 8, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: c.text }}>متجري</Text>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 24, padding: 40 }}>
        <LinearGradient
          colors={["#6C63FF22", "#6C63FF05"]}
          style={{ width: "100%", borderRadius: 28, padding: 40, alignItems: "center", gap: 20 }}
        >
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#6C63FF22", alignItems: "center", justifyContent: "center" }}>
            <Feather name="shopping-bag" size={44} color="#6C63FF" strokeWidth={1.2} />
          </View>
          <Text style={{ fontSize: 28, fontFamily: "Inter_700Bold", color: c.text, textAlign: "center" }}>
            سفرة بابل
          </Text>
          <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: c.textSecondary, textAlign: "center", lineHeight: 26 }}>
            منصة التجارة المحلية العراقية{"\n"}قريباً — ترقّب التحديثات!
          </Text>
          <View style={{ width: 56, height: 4, borderRadius: 2, backgroundColor: "#6C63FF", marginTop: 4 }} />
        </LinearGradient>
      </View>
    </View>
  );
}
