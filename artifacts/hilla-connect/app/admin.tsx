import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { MenuItem } from "@/context/AppContext";

type Tab = "restaurants" | "users" | "rooms";

function AddRestaurantForm({ onSave, onClose, colors, t }: any) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [category, setCategory] = useState("مشاوي");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDesc, setItemDesc] = useState("");

  const categories = ["🍖 مشاوي", "🍕 بيتزا", "🍔 برغر", "🥗 صحي", "🍜 شرقي", "🧃 عصائر", "🍰 حلويات"];

  const addItem = () => {
    if (!itemName || !itemPrice) return;
    const id = Date.now().toString();
    setMenuItems((prev) => [...prev, { id, name: itemName, price: parseFloat(itemPrice), description: itemDesc }]);
    setItemName(""); setItemPrice(""); setItemDesc("");
  };

  const handleSave = () => {
    if (!name || !phone) { Alert.alert("خطأ", t("fillAll")); return; }
    onSave({ name, phone, whatsapp, category, menuItems });
    onClose();
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 14, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.formTitle, { color: colors.text }]}>{t("addRestaurant")}</Text>

      {[
        { ph: "اسم المطعم", val: name, fn: setName, icon: "restaurant-outline" },
        { ph: "رقم الهاتف", val: phone, fn: setPhone, icon: "call-outline", kb: "phone-pad" as any },
        { ph: "واتساب (اختياري)", val: whatsapp, fn: setWhatsapp, icon: "logo-whatsapp", kb: "phone-pad" as any },
      ].map((f, i) => (
        <View key={i} style={[styles.fInput, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Ionicons name={f.icon as any} size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.fInputText, { color: colors.text, fontFamily: "Inter_400Regular" }]}
            placeholder={f.ph}
            placeholderTextColor={colors.textSecondary}
            value={f.val}
            onChangeText={f.fn}
            keyboardType={f.kb || "default"}
            textAlign="right"
          />
        </View>
      ))}

      <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{t("category")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.catBtn,
                {
                  backgroundColor: category === cat ? "#10B981" : colors.backgroundTertiary,
                  borderColor: category === cat ? "#10B981" : colors.border,
                },
              ]}
            >
              <Text style={[styles.catBtnText, { color: category === cat ? "#fff" : colors.textSecondary }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Text style={[styles.subLabel, { color: colors.textSecondary }]}>القائمة</Text>

      {menuItems.map((item) => (
        <View key={item.id} style={[styles.menuItemRow, { borderColor: colors.border }]}>
          <Text style={[{ flex: 1, color: colors.text, fontFamily: "Inter_500Medium" }]}>{item.name}</Text>
          <Text style={[{ color: "#10B981", fontFamily: "Inter_600SemiBold" }]}>{item.price} د.ع</Text>
          <TouchableOpacity onPress={() => setMenuItems((p) => p.filter((m) => m.id !== item.id))}>
            <Ionicons name="close-circle" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      ))}

      <View style={{ gap: 8 }}>
        {[
          { ph: "اسم الصنف", val: itemName, fn: setItemName },
          { ph: "السعر (د.ع)", val: itemPrice, fn: setItemPrice, kb: "number-pad" as any },
          { ph: "الوصف (اختياري)", val: itemDesc, fn: setItemDesc },
        ].map((f, i) => (
          <View key={i} style={[styles.fInput, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <TextInput
              style={[styles.fInputText, { color: colors.text, fontFamily: "Inter_400Regular" }]}
              placeholder={f.ph}
              placeholderTextColor={colors.textSecondary}
              value={f.val}
              onChangeText={f.fn}
              keyboardType={f.kb || "default"}
              textAlign="right"
            />
          </View>
        ))}
        <TouchableOpacity onPress={addItem} style={[styles.addItemBtn, { borderColor: "#10B981" }]}>
          <Ionicons name="add" size={18} color="#10B981" />
          <Text style={[{ color: "#10B981", fontFamily: "Inter_600SemiBold" }]}>{t("addItem")}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave}>
          <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>{t("save")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function AdminScreen() {
  const { users, rooms, restaurants, addRestaurant, deleteRoom, deleteRestaurant, banUser, unbanUser, t, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [activeTab, setActiveTab] = useState<Tab>("restaurants");
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: "restaurants", icon: "restaurant-outline", label: t("restaurants") },
    { key: "users", icon: "people-outline", label: t("users") },
    { key: "rooms", icon: "mic-outline", label: t("home") },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={["rgba(255,215,0,0.2)", "transparent"]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.adminTitle, { color: "#FFD700" }]}>👑 {t("adminPanel")}</Text>
            <Text style={[styles.adminSubtitle, { color: colors.textSecondary }]}>{t("superAdmin")}</Text>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabItem,
                {
                  backgroundColor: activeTab === tab.key ? "#FFD70022" : "transparent",
                  borderColor: activeTab === tab.key ? "#FFD700" : "transparent",
                },
              ]}
            >
              <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? "#FFD700" : colors.textSecondary} />
              <Text style={[styles.tabLabel, { color: activeTab === tab.key ? "#FFD700" : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Restaurants Tab */}
        {activeTab === "restaurants" && (
          <>
            {showAddRestaurant ? (
              <AddRestaurantForm
                onSave={addRestaurant}
                onClose={() => setShowAddRestaurant(false)}
                colors={colors}
                t={t}
              />
            ) : (
              <>
                <TouchableOpacity onPress={() => setShowAddRestaurant(true)}>
                  <LinearGradient colors={["#10B981", "#059669"]} style={styles.addBtn}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addBtnText}>{t("addRestaurant")}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {restaurants.map((r) => {
                  const color = ACCENT_COLORS[r.name.length % ACCENT_COLORS.length];
                  return (
                    <View key={r.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={[styles.listIcon, { backgroundColor: `${color}22` }]}>
                        <Text>🍽️</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.listTitle, { color: colors.text }]}>{r.name}</Text>
                        <Text style={[styles.listSub, { color: colors.textSecondary }]}>{r.category} · {r.menuItems?.length || 0} صنف</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(t("deleteRestaurant"), "هل أنت متأكد؟", [
                            { text: t("cancel"), style: "cancel" },
                            { text: t("deleteRestaurant"), style: "destructive", onPress: () => deleteRestaurant(r.id) },
                          ]);
                        }}
                        style={[styles.dangerBtn, { backgroundColor: `${colors.danger}22` }]}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <>
            {users.map((u) => {
              const color = ACCENT_COLORS[u.name.length % ACCENT_COLORS.length];
              return (
                <View key={u.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.listAvatar, { backgroundColor: `${color}33` }]}>
                    <Text style={[styles.listAvatarText, { color }]}>{u.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>{u.name}</Text>
                    <Text style={[styles.listSub, { color: colors.textSecondary }]}>{u.phone}</Text>
                  </View>
                  {u.isBanned ? (
                    <TouchableOpacity onPress={() => unbanUser(u.id)} style={[styles.actionTag, { backgroundColor: "#10B98122" }]}>
                      <Text style={{ color: "#10B981", fontFamily: "Inter_500Medium", fontSize: 12 }}>{t("unbanUser")}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(t("banUser"), u.name, [
                          { text: t("cancel"), style: "cancel" },
                          { text: t("banUser"), style: "destructive", onPress: () => banUser(u.id) },
                        ]);
                      }}
                      style={[styles.actionTag, { backgroundColor: `${colors.danger}22` }]}
                    >
                      <Text style={{ color: colors.danger, fontFamily: "Inter_500Medium", fontSize: 12 }}>{t("banUser")}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Rooms Tab */}
        {activeTab === "rooms" && (
          <>
            {rooms.map((r) => {
              const color = ACCENT_COLORS[r.name.length % ACCENT_COLORS.length];
              const occ = r.seats.filter(Boolean).length;
              return (
                <View key={r.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.listIcon, { backgroundColor: `${color}22` }]}>
                    <Ionicons name="mic" size={18} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>{r.name}</Text>
                    <Text style={[styles.listSub, { color: colors.textSecondary }]}>{r.ownerName} · {occ}/6</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(t("deleteRoom"), r.name, [
                        { text: t("cancel"), style: "cancel" },
                        { text: t("deleteRoom"), style: "destructive", onPress: () => deleteRoom(r.id) },
                      ]);
                    }}
                    style={[styles.dangerBtn, { backgroundColor: `${colors.danger}22` }]}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  adminTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  adminSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tabBar: {
    flexDirection: "row", borderRadius: 16, borderWidth: 1,
    padding: 4, gap: 4,
  },
  tabItem: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    paddingVertical: 9, borderRadius: 12, borderWidth: 1,
  },
  tabLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  content: { padding: 16, gap: 12 },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 16, paddingVertical: 16,
    shadowColor: "#10B981", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  addBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  listItem: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, borderWidth: 1, padding: 14, gap: 12,
  },
  listIcon: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  listAvatar: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  listAvatarText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  listTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  listSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  dangerBtn: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  actionTag: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  formTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  fInput: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, height: 50, gap: 10,
  },
  fInputText: { flex: 1, fontSize: 15 },
  subLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  catBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1,
  },
  catBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  menuItemRow: {
    flexDirection: "row", alignItems: "center",
    gap: 10, paddingVertical: 10, borderBottomWidth: 1,
  },
  addItemBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    borderRadius: 12, borderWidth: 1.5,
    paddingVertical: 10,
  },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  saveBtn: {
    flex: 1, height: 50, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 28,
  },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
