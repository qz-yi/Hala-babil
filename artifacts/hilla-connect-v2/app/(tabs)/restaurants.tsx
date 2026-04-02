import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { Restaurant } from "@/context/AppContext";

const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";

function RestaurantCard({
  restaurant,
  onPress,
}: {
  restaurant: Restaurant;
  onPress: () => void;
}) {
  const color = ACCENT_COLORS[restaurant.name.length % ACCENT_COLORS.length];

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.8}
      style={styles.card}
    >
      <View style={[styles.cardImageContainer, { backgroundColor: `${color}20` }]}>
        {restaurant.image ? (
          <Image source={{ uri: restaurant.image }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={styles.cardEmoji}>🍽️</Text>
          </View>
        )}
        <View style={[styles.categoryBadge, { backgroundColor: `${color}ee` }]}>
          <Text style={styles.categoryText}>{restaurant.category}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <Text style={styles.cardMenuCount}>
          {restaurant.menuItems?.length || 0} صنف
        </Text>
        <View style={styles.cardActions}>
          {restaurant.whatsapp && (
            <View style={[styles.actionBadge, { backgroundColor: "#25D36622" }]}>
              <Feather name="message-circle" size={13} color="#25D366" strokeWidth={1.5} />
            </View>
          )}
          <View style={[styles.actionBadge, { backgroundColor: `${color}22` }]}>
            <Feather name="phone" size={13} color={color} strokeWidth={1.5} />
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
  const { restaurants, isSuperAdmin, t } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={styles.headerTitle}>{t("restaurants")}</Text>
        {isSuperAdmin && (
          <TouchableOpacity
            onPress={() => router.push("/admin")}
            style={styles.addBtn}
          >
            <Feather name="plus" size={20} color="#000" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {restaurants.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="coffee" size={56} color={BORDER} strokeWidth={1} />
          <Text style={styles.emptyTitle}>{t("noRestaurants")}</Text>
          {isSuperAdmin && (
            <TouchableOpacity onPress={() => router.push("/admin")} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>{t("addRestaurant")}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => router.push(`/restaurant/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    marginBottom: 8,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: TEXT },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: TEXT,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { padding: 12, paddingTop: 8 },
  row: { gap: 10, marginBottom: 10 },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: BORDER,
    overflow: "hidden",
    backgroundColor: CARD,
  },
  cardImageContainer: { height: 110, position: "relative", overflow: "hidden" },
  cardImage: { width: "100%", height: "100%" },
  cardImagePlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  cardEmoji: { fontSize: 40 },
  categoryBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cardBody: { padding: 12, gap: 4 },
  cardName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: TEXT },
  cardMenuCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  actionBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  viewBtn: { marginLeft: "auto" as any, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  viewBtnText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_500Medium", color: TEXT2 },
  emptyBtn: { backgroundColor: TEXT, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 100, marginTop: 8 },
  emptyBtnText: { color: BG, fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
