import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ACCENT_COLORS } from "@/constants/colors";
import { useApp, IRAQI_GOVERNORATES } from "@/context/AppContext";
import type { Restaurant } from "@/context/AppContext";

const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";
const ACCENT = "#10B981";

function GovernorateBar({
  selected,
  onSelect,
  governorateImages,
}: {
  selected: string | null;
  onSelect: (gov: string | null) => void;
  governorateImages: { name: string; image?: string }[];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.govBar}
    >
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(null); }}
        activeOpacity={0.85}
        style={[styles.govAllBtn, { borderColor: selected === null ? ACCENT : BORDER, backgroundColor: selected === null ? `${ACCENT}22` : CARD }]}
      >
        <Text style={[styles.govAllTxt, { color: selected === null ? ACCENT : TEXT2 }]}>الكل</Text>
      </TouchableOpacity>

      {IRAQI_GOVERNORATES.map((gov) => {
        const imgObj = governorateImages.find((g) => g.name === gov);
        const isSelected = selected === gov;
        return (
          <TouchableOpacity
            key={gov}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onSelect(isSelected ? null : gov);
            }}
            activeOpacity={0.85}
            style={styles.govItem}
          >
            <View style={[styles.govOval, isSelected && styles.govOvalSelected]}>
              {imgObj?.image ? (
                <Image source={{ uri: imgObj.image }} style={styles.govOvalImg} />
              ) : (
                <View style={styles.govOvalPlaceholder}>
                  <Text style={styles.govOvalPlaceholderEmoji}>🏛️</Text>
                </View>
              )}
              <View style={styles.govOvalGradient} />
              <Text style={styles.govOvalName}>{gov}</Text>
              {isSelected && (
                <View style={styles.govOvalCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={ACCENT} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function SelectedGovernorateHeader({
  gov,
  governorateImages,
  onClear,
}: {
  gov: string;
  governorateImages: { name: string; image?: string }[];
  onClear: () => void;
}) {
  const imgObj = governorateImages.find((g) => g.name === gov);
  return (
    <View style={styles.selectedGovHeader}>
      {/* Oval thumbnail */}
      <View style={styles.selectedGovOval}>
        {imgObj?.image ? (
          <Image source={{ uri: imgObj.image }} style={styles.selectedGovOvalImg} />
        ) : (
          <View style={styles.selectedGovOvalPlaceholder}>
            <Text style={{ fontSize: 22 }}>🏛️</Text>
          </View>
        )}
        <View style={styles.govOvalGradient} />
      </View>

      {/* Name */}
      <View style={styles.selectedGovNameWrap}>
        <Text style={styles.selectedGovPin}>📍</Text>
        <Text style={styles.selectedGovName}>{gov}</Text>
      </View>

      {/* Change button */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClear();
        }}
        style={styles.changeGovBtn}
        activeOpacity={0.75}
      >
        <Feather name="edit-2" size={13} color={ACCENT} strokeWidth={2} />
        <Text style={styles.changeGovBtnText}>تغيير</Text>
      </TouchableOpacity>
    </View>
  );
}

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
        {restaurant.governorate ? (
          <View style={styles.govTagOnCard}>
            <Text style={styles.govTagTxt}>📍 {restaurant.governorate}</Text>
          </View>
        ) : null}
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
  const { restaurants, isSuperAdmin, t, governorateImages, currentUser } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [selectedGov, setSelectedGov] = useState<string | null>(
    currentUser?.primaryGovernorate || null
  );

  const filtered = selectedGov
    ? restaurants.filter((r) => r.governorate === selectedGov)
    : restaurants;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t("restaurants")}</Text>
        </View>
        {isSuperAdmin && (
          <TouchableOpacity
            onPress={() => router.push("/admin")}
            style={styles.addBtn}
          >
            <Feather name="plus" size={20} color="#000" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Governorate selector — full bar when none selected, compact header when one is selected */}
      {selectedGov ? (
        <SelectedGovernorateHeader
          gov={selectedGov}
          governorateImages={governorateImages}
          onClear={() => setSelectedGov(null)}
        />
      ) : (
        <GovernorateBar
          selected={selectedGov}
          onSelect={setSelectedGov}
          governorateImages={governorateImages}
        />
      )}

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="map-pin" size={56} color={BORDER} strokeWidth={1} />
          <Text style={styles.emptyTitle}>
            {selectedGov ? t("noRestaurantsInGovernorate") : t("noRestaurants")}
          </Text>
          {selectedGov && (
            <TouchableOpacity onPress={() => setSelectedGov(null)} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>عرض الكل</Text>
            </TouchableOpacity>
          )}
          {!selectedGov && isSuperAdmin && (
            <TouchableOpacity onPress={() => router.push("/admin")} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>{t("addRestaurant")}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
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
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: TEXT },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: TEXT, alignItems: "center", justifyContent: "center",
  },

  /* ── Full governorate scroll bar ── */
  govBar: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
    alignItems: "center",
    flexDirection: "row",
  },
  govAllBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 40, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
    minWidth: 52, height: 80,
  },
  govAllTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  govItem: { alignItems: "center" },
  govOval: {
    width: 130, height: 80,
    borderRadius: 40, borderWidth: 2, borderColor: BORDER,
    overflow: "hidden", alignItems: "center", justifyContent: "center",
    position: "relative", backgroundColor: "#1a1a1a",
  },
  govOvalSelected: { borderColor: ACCENT, borderWidth: 2.5 },
  govOvalImg: { width: "100%", height: "100%", resizeMode: "cover" },
  govOvalPlaceholder: {
    width: "100%", height: "100%",
    alignItems: "center", justifyContent: "center", backgroundColor: "#1e1e2e",
  },
  govOvalPlaceholderEmoji: { fontSize: 28 },
  govOvalGradient: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  govOvalName: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    textAlign: "center", color: "#fff",
    fontFamily: "Inter_700Bold", fontSize: 13, paddingBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  govOvalCheck: { position: "absolute", top: 6, right: 8 },

  /* ── Selected governorate compact header ── */
  selectedGovHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    backgroundColor: "#0a0a0a",
    gap: 12,
  },
  selectedGovOval: {
    width: 56, height: 34,
    borderRadius: 17, overflow: "hidden",
    borderWidth: 1.5, borderColor: ACCENT,
    position: "relative", backgroundColor: "#1a1a1a",
  },
  selectedGovOvalImg: { width: "100%", height: "100%", resizeMode: "cover" },
  selectedGovOvalPlaceholder: {
    width: "100%", height: "100%",
    alignItems: "center", justifyContent: "center", backgroundColor: "#1e1e2e",
  },
  selectedGovNameWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  selectedGovPin: { fontSize: 16 },
  selectedGovName: {
    fontSize: 17, fontFamily: "Inter_700Bold", color: TEXT,
  },
  changeGovBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: `${ACCENT}66`,
    backgroundColor: `${ACCENT}11`,
  },
  changeGovBtnText: {
    color: ACCENT, fontSize: 13, fontFamily: "Inter_600SemiBold",
  },

  /* ── Restaurant list ── */
  list: { padding: 12, paddingTop: 4 },
  row: { gap: 10, marginBottom: 10 },
  card: {
    flex: 1, borderRadius: 20, borderWidth: 0.5,
    borderColor: BORDER, overflow: "hidden", backgroundColor: CARD,
  },
  cardImageContainer: { height: 110, position: "relative", overflow: "hidden" },
  cardImage: { width: "100%", height: "100%" },
  cardImagePlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  cardEmoji: { fontSize: 40 },
  categoryBadge: { position: "absolute", bottom: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
  govTagOnCard: {
    position: "absolute", top: 6, left: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
  },
  govTagTxt: { fontSize: 9, fontFamily: "Inter_500Medium", color: "#fff" },
  cardBody: { padding: 12, gap: 4 },
  cardName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: TEXT },
  cardMenuCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  actionBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  viewBtn: { marginLeft: "auto" as any, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  viewBtnText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },

  /* ── Empty state ── */
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_500Medium", color: TEXT2, textAlign: "center" },
  emptyBtn: { backgroundColor: TEXT, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 100, marginTop: 8 },
  emptyBtnText: { color: BG, fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
