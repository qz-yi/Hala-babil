import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
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
import { useToast } from "@/components/Toast";

type Tab = "restaurants" | "users" | "rooms";

async function pickImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });
  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

function AddRestaurantForm({ onSave, onClose, colors, t, showToast }: any) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [category, setCategory] = useState("مشاوي");
  const [restImage, setRestImage] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemImage, setItemImage] = useState<string | null>(null);

  const categories = ["🍖 مشاوي", "🍕 بيتزا", "🍔 برغر", "🥗 صحي", "🍜 شرقي", "🧃 عصائر", "🍰 حلويات"];

  const handlePickRestImage = async () => {
    const uri = await pickImage();
    if (uri) setRestImage(uri);
    else showToast("لم يتم اختيار صورة", "info");
  };

  const handlePickItemImage = async () => {
    const uri = await pickImage();
    if (uri) setItemImage(uri);
    else showToast("لم يتم اختيار صورة", "info");
  };

  const addItem = () => {
    if (!itemName || !itemPrice) {
      showToast("أدخل اسم الصنف والسعر", "error");
      return;
    }
    const id = Date.now().toString() + Math.random();
    setMenuItems((prev) => [
      ...prev,
      {
        id,
        name: itemName,
        price: parseFloat(itemPrice),
        description: itemDesc || undefined,
        image: itemImage || undefined,
      },
    ]);
    setItemName("");
    setItemPrice("");
    setItemDesc("");
    setItemImage(null);
  };

  const handleSave = () => {
    if (!name || !phone) {
      showToast(t("fillAll"), "error");
      return;
    }
    onSave({ name, phone, whatsapp, category, menuItems, image: restImage || undefined });
    onClose();
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 14, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.formTitle, { color: colors.text }]}>{t("addRestaurant")}</Text>

      {/* Restaurant Image Picker */}
      <TouchableOpacity onPress={handlePickRestImage} activeOpacity={0.85}>
        <View
          style={[
            styles.imagePicker,
            { backgroundColor: colors.backgroundTertiary, borderColor: colors.border },
          ]}
        >
          {restImage ? (
            <>
              <Image source={{ uri: restImage }} style={styles.imagePickerImg} />
              <View style={styles.imagePickerOverlay}>
                <Ionicons name="camera" size={22} color="#fff" />
                <Text style={{ color: "#fff", fontFamily: "Inter_500Medium", fontSize: 12 }}>
                  تغيير الصورة
                </Text>
              </View>
            </>
          ) : (
            <>
              <Ionicons name="image-outline" size={36} color={colors.textSecondary} />
              <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 14 }]}>
                اضغط لاختيار صورة المطعم
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Text Fields */}
      {[
        { ph: "اسم المطعم *", val: name, fn: setName, icon: "restaurant-outline" },
        { ph: "رقم الهاتف *", val: phone, fn: setPhone, icon: "call-outline", kb: "phone-pad" as any },
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

      {/* Category */}
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

      {/* Menu Items */}
      <Text style={[styles.subLabel, { color: colors.textSecondary }]}>قائمة الأصناف</Text>

      {menuItems.map((item) => (
        <View key={item.id} style={[styles.menuItemRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.menuItemThumb} />
          ) : (
            <View style={[styles.menuItemThumbEmpty, { backgroundColor: colors.backgroundTertiary }]}>
              <Ionicons name="fast-food-outline" size={16} color={colors.textSecondary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[{ color: colors.text, fontFamily: "Inter_500Medium", fontSize: 14 }]}>{item.name}</Text>
            {item.description ? (
              <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }]}>
                {item.description}
              </Text>
            ) : null}
          </View>
          <Text style={[{ color: "#10B981", fontFamily: "Inter_600SemiBold", fontSize: 13 }]}>{item.price} د.ع</Text>
          <TouchableOpacity onPress={() => setMenuItems((p) => p.filter((m) => m.id !== item.id))}>
            <Ionicons name="close-circle" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      ))}

      {/* Add Item Section */}
      <View style={[styles.addItemSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
        <Text style={[styles.addItemTitle, { color: colors.text }]}>إضافة صنف جديد</Text>

        {/* Item Image Picker */}
        <TouchableOpacity onPress={handlePickItemImage} activeOpacity={0.85}>
          <View
            style={[
              styles.itemImagePicker,
              { backgroundColor: colors.backgroundTertiary, borderColor: colors.border },
            ]}
          >
            {itemImage ? (
              <>
                <Image source={{ uri: itemImage }} style={styles.itemImagePickerImg} />
                <View style={styles.itemImageOverlay}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </>
            ) : (
              <View style={{ alignItems: "center", gap: 4 }}>
                <Ionicons name="fast-food-outline" size={24} color={colors.textSecondary} />
                <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }]}>
                  صورة الوجبة
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={{ gap: 8 }}>
          {[
            { ph: "اسم الصنف *", val: itemName, fn: setItemName },
            { ph: "السعر (د.ع) *", val: itemPrice, fn: setItemPrice, kb: "number-pad" as any },
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
        </View>

        <TouchableOpacity onPress={addItem} style={[styles.addItemBtn, { borderColor: "#10B981", backgroundColor: "#10B98111" }]}>
          <Ionicons name="add-circle" size={18} color="#10B981" />
          <Text style={[{ color: "#10B981", fontFamily: "Inter_600SemiBold" }]}>{t("addItem")}</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={{ flex: 1 }}>
          <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{t("save")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function AdminScreen() {
  const { users, rooms, restaurants, addRestaurant, deleteRoom, deleteRestaurant, banUser, unbanUser, resetUserPassword, t, theme } = useApp();
  const { showToast } = useToast();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [activeTab, setActiveTab] = useState<Tab>("restaurants");
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; title: string; onConfirm: () => void }>({
    visible: false,
    title: "",
    onConfirm: () => {},
  });
  const [resetPwModal, setResetPwModal] = useState<{ visible: boolean; userId: string; userName: string }>({
    visible: false,
    userId: "",
    userName: "",
  });
  const [newPassword, setNewPassword] = useState("");

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: "restaurants", icon: "restaurant-outline", label: t("restaurants") },
    { key: "users", icon: "people-outline", label: t("users") },
    { key: "rooms", icon: "mic-outline", label: t("home") },
  ];

  const askConfirm = (title: string, onConfirm: () => void) => {
    setConfirmModal({ visible: true, title, onConfirm });
  };

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
                showToast={showToast}
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
                      {r.image ? (
                        <Image source={{ uri: r.image }} style={styles.listRestImg} />
                      ) : (
                        <View style={[styles.listIcon, { backgroundColor: `${color}22` }]}>
                          <Text>🍽️</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.listTitle, { color: colors.text }]}>{r.name}</Text>
                        <Text style={[styles.listSub, { color: colors.textSecondary }]}>
                          {r.category} · {r.menuItems?.length || 0} صنف
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          askConfirm(`حذف ${r.name}؟`, () => {
                            deleteRestaurant(r.id);
                            showToast("تم حذف المطعم", "success");
                          })
                        }
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
                    {u.avatar ? (
                      <Image source={{ uri: u.avatar }} style={styles.listAvatarImg} />
                    ) : (
                      <Text style={[styles.listAvatarText, { color }]}>{u.name[0]?.toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>{u.name}</Text>
                    <Text style={[styles.listSub, { color: colors.textSecondary }]}>{u.phone}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setNewPassword("");
                        setResetPwModal({ visible: true, userId: u.id, userName: u.name });
                      }}
                      style={[styles.actionTag, { backgroundColor: "#F59E0B22" }]}
                    >
                      <Ionicons name="key-outline" size={13} color="#F59E0B" />
                    </TouchableOpacity>
                    {u.isBanned ? (
                      <TouchableOpacity onPress={() => { unbanUser(u.id); showToast("تم رفع الحظر", "success"); }} style={[styles.actionTag, { backgroundColor: "#10B98122" }]}>
                        <Text style={{ color: "#10B981", fontFamily: "Inter_500Medium", fontSize: 12 }}>{t("unbanUser")}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() =>
                          askConfirm(`حظر ${u.name}؟`, () => {
                            banUser(u.id);
                            showToast("تم حظر المستخدم", "error");
                          })
                        }
                        style={[styles.actionTag, { backgroundColor: `${colors.danger}22` }]}
                      >
                        <Text style={{ color: colors.danger, fontFamily: "Inter_500Medium", fontSize: 12 }}>{t("banUser")}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
                    onPress={() =>
                      askConfirm(`حذف "${r.name}"؟`, () => {
                        deleteRoom(r.id);
                        showToast("تم حذف الغرفة", "success");
                      })
                    }
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

      {/* Reset Password Modal */}
      <Modal
        visible={resetPwModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetPwModal((p) => ({ ...p, visible: false }))}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setResetPwModal((p) => ({ ...p, visible: false }))}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <View style={[styles.modalIcon, { backgroundColor: "#F59E0B18" }]}>
              <Ionicons name="key-outline" size={28} color="#F59E0B" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("resetPasswordTitle")}
            </Text>
            <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" }]}>
              {resetPwModal.userName}
            </Text>
            <View style={[styles.fInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, width: "100%", marginTop: 8 }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.fInputText, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                placeholder={t("newPassword")}
                placeholderTextColor={colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                textAlign="right"
              />
            </View>
            <View style={{ flexDirection: "row", gap: 12, width: "100%", marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => setResetPwModal((p) => ({ ...p, visible: false }))}
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                  if (!newPassword.trim()) {
                    showToast(t("fillAll"), "error");
                    return;
                  }
                  resetUserPassword(resetPwModal.userId, newPassword.trim());
                  setResetPwModal((p) => ({ ...p, visible: false }));
                  showToast(t("resetPasswordSuccess"), "success");
                }}
              >
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.modalConfirmBtn}
                >
                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>{t("save")}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal((p) => ({ ...p, visible: false }))}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setConfirmModal((p) => ({ ...p, visible: false }))}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <View style={[styles.modalIcon, { backgroundColor: `${colors.danger}18` }]}>
              <Ionicons name="warning-outline" size={28} color={colors.danger} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{confirmModal.title}</Text>
            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              <TouchableOpacity
                onPress={() => setConfirmModal((p) => ({ ...p, visible: false }))}
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setConfirmModal((p) => ({ ...p, visible: false }));
                  confirmModal.onConfirm();
                }}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={[colors.danger, "#c0392b"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.modalConfirmBtn}
                >
                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>تأكيد</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    borderRadius: 16, borderWidth: 1, padding: 12, gap: 12,
  },
  listRestImg: {
    width: 48, height: 48, borderRadius: 13, resizeMode: "cover",
  },
  listIcon: {
    width: 48, height: 48, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  listAvatar: {
    width: 48, height: 48, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  listAvatarText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  listAvatarImg: {
    width: "100%", height: "100%",
    resizeMode: "cover", borderRadius: 13,
  },
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
  imagePicker: {
    height: 160, borderRadius: 18, borderWidth: 1.5, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
    gap: 8, overflow: "hidden",
  },
  imagePickerImg: {
    width: "100%", height: "100%", resizeMode: "cover",
    position: "absolute", top: 0, left: 0,
  },
  imagePickerOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
    paddingVertical: 10, gap: 4, flexDirection: "row",
  },
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
    gap: 10, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: "transparent",
  },
  menuItemThumb: {
    width: 44, height: 44, borderRadius: 10, resizeMode: "cover",
  },
  menuItemThumbEmpty: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  addItemSection: {
    borderRadius: 18, borderWidth: 1,
    padding: 14, gap: 10,
  },
  addItemTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  itemImagePicker: {
    height: 80, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  itemImagePickerImg: {
    width: "100%", height: "100%", resizeMode: "cover",
    position: "absolute", top: 0, left: 0,
  },
  itemImageOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center", justifyContent: "center",
    paddingVertical: 6,
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
    height: 50, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8, paddingHorizontal: 28,
  },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center",
  },
  modalCard: {
    width: "82%", maxWidth: 320, borderRadius: 24, borderWidth: 1,
    padding: 24, alignItems: "center", gap: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 30, elevation: 20,
  },
  modalIcon: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  modalTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  modalCancelBtn: {
    flex: 1, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  modalConfirmBtn: {
    height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
});
