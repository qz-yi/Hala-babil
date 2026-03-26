import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { Restaurant } from "@/context/AppContext";

const CATEGORIES = ["🍖 مشاوي", "🍕 بيتزا", "🍔 برغر", "🥗 صحي", "🍜 شرقي", "🧃 عصائر"];

function RestaurantCard({ restaurant, onPress, colors }: any) {
  const color = ACCENT_COLORS[restaurant.name.length % ACCENT_COLORS.length];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <LinearGradient
        colors={[`${color}18`, "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.cardImage, { backgroundColor: `${color}25` }]}>
        <Text style={styles.cardEmoji}>🍽️</Text>
        <View style={[styles.categoryBadge, { backgroundColor: `${color}33` }]}>
          <Text style={[styles.categoryText, { color }]}>{restaurant.category}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <Text style={[styles.cardMenuCount, { color: colors.textSecondary }]}>
          {restaurant.menuItems?.length || 0} صنف في القائمة
        </Text>
        <View style={styles.cardActions}>
          {restaurant.whatsapp && (
            <View style={[styles.actionBadge, { backgroundColor: "#25D36622" }]}>
              <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
            </View>
          )}
          <View style={[styles.actionBadge, { backgroundColor: `${color}22` }]}>
            <Ionicons name="call-outline" size={14} color={color} />
          </View>
          <View style={[styles.viewBtn, { backgroundColor: color }]}>
            <Text style={styles.viewBtnText}>عرض</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RestaurantsScreen() {
  const { restaurants, isSuperAdmin, t, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          theme === "dark"
            ? ["rgba(16,185,129,0.15)", "transparent"]
            : ["rgba(16,185,129,0.07)", "transparent"]
        }
        style={[styles.headerGrad, { paddingTop: topPad }]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t("restaurants")}</Text>
          {isSuperAdmin && (
            <TouchableOpacity
              onPress={() => router.push("/admin")}
              style={[styles.addBtn, { backgroundColor: "#10B981" }]}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {restaurants.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t("noRestaurants")}</Text>
          {isSuperAdmin && (
            <TouchableOpacity onPress={() => router.push("/admin")}>
              <LinearGradient colors={["#10B981", "#059669"]} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>{t("addRestaurant")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => router.push(`/restaurant/${item.id}`)}
              colors={colors}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginTop: 12,
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addBtn: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#10B981", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  list: { padding: 12 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1, borderRadius: 20, borderWidth: 1, overflow: "hidden",
  },
  cardImage: {
    height: 110, alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  cardEmoji: { fontSize: 44 },
  categoryBadge: {
    position: "absolute", bottom: 8, right: 8,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  categoryText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardBody: { padding: 12, gap: 6 },
  cardName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardMenuCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  actionBadge: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  viewBtn: {
    marginLeft: "auto", paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10,
  },
  viewBtnText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_500Medium" },
  emptyBtn: {
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16,
  },
  emptyBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
