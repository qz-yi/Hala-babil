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
import { useThemeStore } from "@/store/themeStore";

function GovernorateBar({
  selected,
  onSelect,
  governorateImages,
}: {
  selected: string | null;
  onSelect: (gov: string | null) => void;
  governorateImages: { name: string; image?: string }[];
}) {
  const c = useThemeStore((s) => s.tokens);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.govBar}
    >
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(null); }}
        activeOpacity={0.85}
        style={[s.govAllBtn, {
          borderColor: selected === null ? c.success : c.border,
          backgroundColor: selected === null ? `${c.success}22` : c.card,
        }]}
      >
        <Text style={[s.govAllTxt, { color: selected === null ? c.success : c.textSecondary }]}>الكل</Text>
      </TouchableOpacity>

      {IRAQI_GOVERNORATES.map((gov) => {
        const imgObj = governorateImages.find((g) => g.name === gov);
        const isSelected = selected === gov;
        return (
          <TouchableOpacity
            key={gov}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSelect(isSelected ? null : gov); }}
            activeOpacity={0.85}
            style={s.govItem}
          >
            <View style={[s.govOval, { borderColor: isSelected ? c.success : c.border, backgroundColor: c.card },
              isSelected && { borderColor: c.success, borderWidth: 2.5 }]}>
              {imgObj?.image ? (
                <Image source={{ uri: imgObj.image }} style={s.govOvalImg} />
              ) : (
                <View style={[s.govOvalPlaceholder, { backgroundColor: c.backgroundTertiary }]}>
                  <Text style={s.govOvalPlaceholderEmoji}>🏛️</Text>
                </View>
              )}
              <View style={s.govOvalGradient} />
              <Text style={s.govOvalName}>{gov}</Text>
              {isSelected && (
                <View style={s.govOvalCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={c.success} />
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
  const c = useThemeStore((s) => s.tokens);
  const imgObj = governorateImages.find((g) => g.name === gov);
  return (
    <View style={[s.selectedGovHeader, { borderBottomColor: c.border, backgroundColor: c.background }]}>
      <View style={[s.selectedGovOval, { borderColor: c.success, backgroundColor: c.card }]}>
        {imgObj?.image ? (
          <Image source={{ uri: imgObj.image }} style={s.selectedGovOvalImg} />
        ) : (
          <View style={[s.selectedGovOvalPlaceholder, { backgroundColor: c.backgroundTertiary }]}>
            <Text style={{ fontSize: 22 }}>🏛️</Text>
          </View>
        )}
        <View style={s.govOvalGradient} />
      </View>
      <View style={s.selectedGovNameWrap}>
        <Text style={s.selectedGovPin}>📍</Text>
        <Text style={[s.selectedGovName, { color: c.text }]}>{gov}</Text>
      </View>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClear(); }}
        style={[s.changeGovBtn, { borderColor: `${c.success}66`, backgroundColor: `${c.success}11` }]}
        activeOpacity={0.75}
      >
        <Feather name="edit-2" size={13} color={c.success} strokeWidth={2} />
        <Text style={[s.changeGovBtnText, { color: c.success }]}>تغيير</Text>
      </TouchableOpacity>
    </View>
  );
}

function RestaurantCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  const c = useThemeStore((s) => s.tokens);
  const color = ACCENT_COLORS[restaurant.name.length % ACCENT_COLORS.length];

  return (
    <TouchableOpacity
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      activeOpacity={0.8}
      style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <View style={[s.cardImageContainer, { backgroundColor: `${color}20` }]}>
        {restaurant.image ? (
          <Image source={{ uri: restaurant.image }} style={s.cardImage} resizeMode="cover" />
        ) : (
          <View style={s.cardImagePlaceholder}>
            <Text style={s.cardEmoji}>🍽️</Text>
          </View>
        )}
        <View style={[s.categoryBadge, { backgroundColor: `${color}ee` }]}>
          <Text style={s.categoryText}>{restaurant.category}</Text>
        </View>
        {restaurant.governorate ? (
          <View style={s.govTagOnCard}>
            <Text style={s.govTagTxt}>📍 {restaurant.governorate}</Text>
          </View>
        ) : null}
      </View>
      <View style={s.cardBody}>
        <Text style={[s.cardName, { color: c.text }]} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={[s.cardMenuCount, { color: c.textSecondary }]}>{restaurant.menuItems?.length || 0} صنف</Text>
        <View style={s.cardActions}>
          {restaurant.whatsapp && (
            <View style={[s.actionBadge, { backgroundColor: "#25D36622" }]}>
              <Feather name="message-circle" size={13} color="#25D366" strokeWidth={1.5} />
            </View>
          )}
          <View style={[s.actionBadge, { backgroundColor: `${color}22` }]}>
            <Feather name="phone" size={13} color={color} strokeWidth={1.5} />
          </View>
          <View style={[s.viewBtn, { backgroundColor: color }]}>
            <Text style={s.viewBtnText}>عرض</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ComingSoonScreen() {
  const c = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <View style={[s.header, { paddingTop: topPad, borderBottomColor: c.border }]}>
        <Text style={[s.headerTitle, { color: c.text }]}>المطاعم</Text>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20, padding: 40 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: `${c.accent}18`, alignItems: "center", justifyContent: "center" }}>
          <Feather name="clock" size={44} color={c.accent} strokeWidth={1.2} />
        </View>
        <Text style={{ fontSize: 28, fontFamily: "Inter_700Bold", color: c.text, textAlign: "center" }}>
          قريباً
        </Text>
        <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: c.textSecondary, textAlign: "center", lineHeight: 24 }}>
          نعمل على إطلاق قسم المطاعم قريباً.{"\n"}ترقّب التحديثات!
        </Text>
        <View style={{ width: 56, height: 4, borderRadius: 2, backgroundColor: c.accent, marginTop: 8 }} />
      </View>
    </View>
  );
}

export default function RestaurantsScreen() {
  const c = useThemeStore((s) => s.tokens);
  const { restaurants, isSuperAdmin, t, governorateImages, currentUser, restaurantsEnabled } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [selectedGov, setSelectedGov] = useState<string | null>(
    currentUser?.primaryGovernorate || null
  );

  const filtered = selectedGov
    ? restaurants.filter((r) => r.governorate === selectedGov)
    : restaurants;

  if (!restaurantsEnabled) return <ComingSoonScreen />;

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <View style={[s.header, { paddingTop: topPad, borderBottomColor: c.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: c.text }]}>{t("restaurants")}</Text>
        </View>
        {isSuperAdmin && (
          <TouchableOpacity onPress={() => router.push("/admin")} style={[s.addBtn, { backgroundColor: c.text }]}>
            <Feather name="plus" size={20} color={c.background} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

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
        <View style={s.emptyState}>
          <Feather name="map-pin" size={56} color={c.border} strokeWidth={1} />
          <Text style={[s.emptyTitle, { color: c.textSecondary }]}>
            {selectedGov ? t("noRestaurantsInGovernorate") : t("noRestaurants")}
          </Text>
          {selectedGov && (
            <TouchableOpacity onPress={() => setSelectedGov(null)} style={[s.emptyBtn, { backgroundColor: c.text }]}>
              <Text style={[s.emptyBtnText, { color: c.background }]}>عرض الكل</Text>
            </TouchableOpacity>
          )}
          {!selectedGov && isSuperAdmin && (
            <TouchableOpacity onPress={() => router.push("/admin")} style={[s.emptyBtn, { backgroundColor: c.text }]}>
              <Text style={[s.emptyBtnText, { color: c.background }]}>{t("addRestaurant")}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={s.row}
          renderItem={({ item }) => (
            <RestaurantCard restaurant={item} onPress={() => router.push(`/restaurant/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },

  govBar: { paddingHorizontal: 12, paddingVertical: 14, gap: 10, alignItems: "center", flexDirection: "row" },
  govAllBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 40, borderWidth: 1.5, alignItems: "center", justifyContent: "center", minWidth: 52, height: 80 },
  govAllTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  govItem: { alignItems: "center" },
  govOval: { width: 130, height: 80, borderRadius: 40, borderWidth: 2, overflow: "hidden", alignItems: "center", justifyContent: "center", position: "relative" },
  govOvalImg: { width: "100%", height: "100%", resizeMode: "cover" },
  govOvalPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  govOvalPlaceholderEmoji: { fontSize: 28 },
  govOvalGradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.38)" },
  govOvalName: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    textAlign: "center", color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13, paddingBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  govOvalCheck: { position: "absolute", top: 6, right: 8 },

  selectedGovHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, gap: 12 },
  selectedGovOval: { width: 56, height: 34, borderRadius: 17, overflow: "hidden", borderWidth: 1.5, position: "relative" },
  selectedGovOvalImg: { width: "100%", height: "100%", resizeMode: "cover" },
  selectedGovOvalPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  selectedGovNameWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  selectedGovPin: { fontSize: 16 },
  selectedGovName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  changeGovBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  changeGovBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  list: { padding: 12, paddingTop: 4 },
  row: { gap: 10, marginBottom: 10 },
  card: { flex: 1, borderRadius: 20, borderWidth: 0.5, overflow: "hidden" },
  cardImageContainer: { height: 110, position: "relative", overflow: "hidden" },
  cardImage: { width: "100%", height: "100%" },
  cardImagePlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  cardEmoji: { fontSize: 40 },
  categoryBadge: { position: "absolute", bottom: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
  govTagOnCard: { position: "absolute", top: 6, left: 6, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  govTagTxt: { fontSize: 9, fontFamily: "Inter_500Medium", color: "#fff" },
  cardBody: { padding: 12, gap: 4 },
  cardName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardMenuCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  actionBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  viewBtn: { marginLeft: "auto" as any, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  viewBtnText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_500Medium", textAlign: "center" },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 100, marginTop: 8 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
