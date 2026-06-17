import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeStore } from "@/store/themeStore";

export default function MarketplaceScreen() {
  const c = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={s.center}>
        <Feather name="shopping-bag" size={56} color={c.textSecondary} strokeWidth={1} />
        <Text style={[s.title, { color: c.text }]}>سفرة بابل</Text>
        <Text style={[s.sub, { color: c.textSecondary }]}>السوق المحلي — قريباً</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
