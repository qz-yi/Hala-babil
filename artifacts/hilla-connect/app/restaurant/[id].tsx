import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { restaurants, isSuperAdmin, deleteRestaurant, t, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const restaurant = restaurants.find((r) => r.id === id);
  if (!restaurant) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textSecondary }}>المطعم غير موجود</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.tint, marginTop: 12 }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const accentColor = ACCENT_COLORS[restaurant.name.length % ACCENT_COLORS.length];

  const handleCall = () => {
    Linking.openURL(`tel:${restaurant.phone}`);
  };

  const handleWhatsApp = () => {
    if (restaurant.whatsapp) {
      Linking.openURL(`https://wa.me/964${restaurant.whatsapp.replace(/^0/, "")}`);
    }
  };

  const handleDelete = () => {
    Alert.alert(t("deleteRestaurant"), "هل أنت متأكد؟", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("deleteRestaurant"), style: "destructive",
        onPress: () => {
          deleteRestaurant(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[`${accentColor}30`, "transparent"]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerHeroSection}>
            <View style={[styles.restaurantIcon, { backgroundColor: `${accentColor}22` }]}>
              <Text style={{ fontSize: 48 }}>🍽️</Text>
            </View>
            <Text style={[styles.restaurantName, { color: colors.text }]}>{restaurant.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` }]}>
              <Text style={[styles.categoryText, { color: accentColor }]}>{restaurant.category}</Text>
            </View>
          </View>
          {isSuperAdmin && (
            <TouchableOpacity onPress={handleDelete} style={[styles.deleteBtn, { backgroundColor: `${colors.danger}22` }]}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={handleCall}
          style={[styles.actionBtn, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` }]}
        >
          <Ionicons name="call" size={22} color={accentColor} />
          <Text style={[styles.actionBtnText, { color: accentColor }]}>{t("call")}</Text>
        </TouchableOpacity>

        {restaurant.whatsapp && (
          <TouchableOpacity
            onPress={handleWhatsApp}
            style={[styles.actionBtn, { backgroundColor: "#25D36622", borderColor: "#25D36644" }]}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            <Text style={[styles.actionBtnText, { color: "#25D366" }]}>{t("whatsapp")}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Menu */}
      <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.menuHeader}>
          <Ionicons name="restaurant" size={18} color={accentColor} />
          <Text style={[styles.menuTitle, { color: colors.text }]}>{t("menu")}</Text>
          <Text style={[styles.menuCount, { color: colors.textSecondary }]}>
            {restaurant.menuItems?.length || 0} صنف
          </Text>
        </View>

        {restaurant.menuItems?.length === 0 ? (
          <View style={styles.emptyMenu}>
            <Ionicons name="fast-food-outline" size={32} color={colors.border} />
            <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              لا توجد أصناف في القائمة
            </Text>
          </View>
        ) : (
          <FlatList
            data={restaurant.menuItems}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 1 }}
            renderItem={({ item, index }) => (
              <View style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: index < (restaurant.menuItems?.length || 0) - 1 ? 1 : 0 }]}>
                <View style={styles.menuItemLeft}>
                  <Text style={[styles.menuItemName, { color: colors.text }]}>{item.name}</Text>
                  {item.description && (
                    <Text style={[styles.menuItemDesc, { color: colors.textSecondary }]}>
                      {item.description}
                    </Text>
                  )}
                </View>
                <View style={[styles.priceBadge, { backgroundColor: `${accentColor}22` }]}>
                  <Text style={[styles.priceText, { color: accentColor }]}>
                    {item.price.toLocaleString()} د.ع
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <View style={{ height: botPad + 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
    zIndex: 1,
  },
  headerHeroSection: {
    flex: 1, alignItems: "center", gap: 8, marginTop: 8,
  },
  restaurantIcon: {
    width: 90, height: 90, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
  },
  restaurantName: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  categoryBadge: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1,
  },
  categoryText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  deleteBtn: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  actionRow: {
    flexDirection: "row", gap: 12,
    paddingHorizontal: 16, marginBottom: 16,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 16, borderWidth: 1,
  },
  actionBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  menuSection: {
    marginHorizontal: 16,
    borderRadius: 20, borderWidth: 1,
    overflow: "hidden",
  },
  menuHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)",
  },
  menuTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold" },
  menuCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  emptyMenu: {
    alignItems: "center", paddingVertical: 32, gap: 10,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 16, gap: 12,
  },
  menuItemLeft: { flex: 1 },
  menuItemName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  menuItemDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  priceBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  priceText: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
