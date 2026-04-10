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
import { IRAQI_GOVERNORATES } from "@/context/AppContext";
import type { MenuItem } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

type Tab = "restaurants" | "users" | "rooms" | "governorates";
type AddStep = "governorate" | "details";

async function pickImage(aspect: [number, number] = [4, 3]): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect,
    quality: 0.7,
  });
  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

function GovernorateStep({
  colors,
  t,
  governorateImages,
  onSelect,
  onClose,
}: {
  colors: any;
  t: (k: string) => string;
  governorateImages: { name: string; image?: string }[];
  onSelect: (gov: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={{ gap: 14 }}>
      <Text style={[styles.formTitle, { color: colors.text }]}>
        📍 {t("selectGovernorate")}
      </Text>
      <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" }]}>
        اختر المحافظة التي يقع فيها المطعم
      </Text>

      <View style={styles.govGrid}>
        {IRAQI_GOVERNORATES.map((gov) => {
          const imgObj = governorateImages.find((g) => g.name === gov);
          const isSelected = selected === gov;
          return (
            <TouchableOpacity
              key={gov}
              onPress={() => setSelected(gov)}
              activeOpacity={0.8}
              style={[
                styles.govCard,
                {
                  borderColor: isSelected ? "#10B981" : colors.border,
                  backgroundColor: isSelected ? "#10B98115" : colors.card,
                },
              ]}
            >
              <View style={[styles.govOval, { borderColor: isSelected ? "#10B981" : colors.border }]}>
                {imgObj?.image ? (
                  <Image source={{ uri: imgObj.image }} style={styles.govOvalImg} />
                ) : (
                  <Text style={{ fontSize: 22 }}>🏛️</Text>
                )}
              </View>
              <Text
                style={[
                  styles.govName,
                  { color: isSelected ? "#10B981" : colors.text },
                ]}
                numberOfLines={1}
              >
                {gov}
              </Text>
              {isSelected && (
                <View style={styles.govCheck}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
        <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => selected && onSelect(selected)}
          style={{ flex: 1, opacity: selected ? 1 : 0.5 }}
          disabled={!selected}
        >
          <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>التالي</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AddRestaurantForm({ onSave, onClose, colors, t, showToast, governorateImages }: any) {
  const [step, setStep] = useState<AddStep>("governorate");
  const [selectedGov, setSelectedGov] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [category, setCategory] = useState("🍖 مشاوي");
  const [restImage, setRestImage] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemImage, setItemImage] = useState<string | null>(null);

  const categories = ["🍖 مشاوي", "🍕 بيتزا", "🍔 برغر", "🥗 صحي", "🍜 شرقي", "🧃 عصائر", "🍰 حلويات"];

  const handlePickRestImage = async () => {
    const uri = await pickImage([4, 3]);
    if (uri) setRestImage(uri);
    else showToast("لم يتم اختيار صورة", "info");
  };

  const handlePickItemImage = async () => {
    const uri = await pickImage([1, 1]);
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
      { id, name: itemName, price: parseFloat(itemPrice), description: itemDesc || undefined, image: itemImage || undefined },
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
    onSave({ name, phone, whatsapp, category, menuItems, image: restImage || undefined, governorate: selectedGov });
    onClose();
  };

  if (step === "governorate") {
    return (
      <GovernorateStep
        colors={colors}
        t={t}
        governorateImages={governorateImages}
        onSelect={(gov) => { setSelectedGov(gov); setStep("details"); }}
        onClose={onClose}
      />
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 14, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => setStep("governorate")} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
        <View style={[styles.govBadgeInline, { backgroundColor: "#10B98120", borderColor: "#10B981" }]}>
          <Text style={{ fontSize: 14 }}>📍</Text>
          <Text style={{ color: "#10B981", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>{selectedGov}</Text>
        </View>
      </TouchableOpacity>

      <Text style={[styles.formTitle, { color: colors.text }]}>{t("addRestaurant")}</Text>

      <TouchableOpacity onPress={handlePickRestImage} activeOpacity={0.85}>
        <View style={[styles.imagePicker, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
          {restImage ? (
            <>
              <Image source={{ uri: restImage }} style={styles.imagePickerImg} />
              <View style={styles.imagePickerOverlay}>
                <Ionicons name="camera" size={22} color="#fff" />
                <Text style={{ color: "#fff", fontFamily: "Inter_500Medium", fontSize: 12 }}>تغيير الصورة</Text>
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

      <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{t("category")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.catBtn, { backgroundColor: category === cat ? "#10B981" : colors.backgroundTertiary, borderColor: category === cat ? "#10B981" : colors.border }]}
            >
              <Text style={[styles.catBtnText, { color: category === cat ? "#fff" : colors.textSecondary }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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
              <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }]}>{item.description}</Text>
            ) : null}
          </View>
          <Text style={[{ color: "#10B981", fontFamily: "Inter_600SemiBold", fontSize: 13 }]}>{item.price} د.ع</Text>
          <TouchableOpacity onPress={() => setMenuItems((p) => p.filter((m) => m.id !== item.id))}>
            <Ionicons name="close-circle" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      ))}

      <View style={[styles.addItemSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
        <Text style={[styles.addItemTitle, { color: colors.text }]}>إضافة صنف جديد</Text>
        <TouchableOpacity onPress={handlePickItemImage} activeOpacity={0.85}>
          <View style={[styles.itemImagePicker, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
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
                <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }]}>صورة الوجبة</Text>
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

function GovernoratesTab({ colors, t, governorateImages, setGovernorateImage, showToast }: any) {
  return (
    <View style={{ gap: 14 }}>
      <View style={[styles.infoCard, { backgroundColor: "#F59E0B18", borderColor: "#F59E0B44" }]}>
        <Ionicons name="information-circle" size={18} color="#F59E0B" />
        <Text style={[{ color: "#F59E0B", fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 }]}>
          ارفع صورة لكل محافظة (معلم أثري أو طبيعي). ستظهر للمستخدمين عند اختيار المحافظة.
        </Text>
      </View>

      <View style={styles.govManagementGrid}>
        {IRAQI_GOVERNORATES.map((gov) => {
          const imgObj = governorateImages.find((g: any) => g.name === gov);
          return (
            <View key={gov} style={[styles.govManageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async () => {
                  const uri = await pickImage([1, 1]);
                  if (uri) {
                    setGovernorateImage(gov, uri);
                    showToast(`تم رفع صورة ${gov}`, "success");
                  }
                }}
                style={styles.govManageOvalWrap}
              >
                <View style={[styles.govManageOval, { borderColor: imgObj?.image ? "#10B981" : colors.border }]}>
                  {imgObj?.image ? (
                    <Image source={{ uri: imgObj.image }} style={styles.govManageOvalImg} />
                  ) : (
                    <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={[styles.govManageName, { color: colors.text }]} numberOfLines={1}>{gov}</Text>
              {imgObj?.image && (
                <View style={styles.govDoneTag}>
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function AdminScreen() {
  const { users, rooms, restaurants, addRestaurant, deleteRoom, deleteRestaurant, banUser, unbanUser, resetUserPassword, t, theme, governorateImages, setGovernorateImage } = useApp();
  const { showToast } = useToast();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [activeTab, setActiveTab] = useState<Tab>("restaurants");
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; title: string; onConfirm: () => void }>({
    visible: false, title: "", onConfirm: () => {},
  });
  const [resetPwModal, setResetPwModal] = useState<{ visible: boolean; userId: string; userName: string }>({
    visible: false, userId: "", userName: "",
  });
  const [newPassword, setNewPassword] = useState("");

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: "restaurants", icon: "restaurant-outline", label: t("restaurants") },
    { key: "governorates", icon: "map-outline", label: "المحافظات" },
    { key: "users", icon: "people-outline", label: t("users") },
    { key: "rooms", icon: "mic-outline", label: t("home") },
  ];

  const askConfirm = (title: string, onConfirm: () => void) => {
    setConfirmModal({ visible: true, title, onConfirm });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0 }}>
          <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tabItem,
                  { backgroundColor: activeTab === tab.key ? "#FFD70022" : "transparent", borderColor: activeTab === tab.key ? "#FFD700" : "transparent" },
                ]}
              >
                <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? "#FFD700" : colors.textSecondary} />
                <Text style={[styles.tabLabel, { color: activeTab === tab.key ? "#FFD700" : colors.textSecondary }]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "restaurants" && (
          <>
            {showAddRestaurant ? (
              <AddRestaurantForm
                onSave={addRestaurant}
                onClose={() => setShowAddRestaurant(false)}
                colors={colors}
                t={t}
                showToast={showToast}
                governorateImages={governorateImages}
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
                          {r.governorate ? `📍 ${r.governorate} · ` : ""}{r.category} · {r.menuItems?.length || 0} صنف
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => askConfirm(`حذف ${r.name}؟`, () => { deleteRestaurant(r.id); showToast("تم حذف المطعم", "success"); })}
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

        {activeTab === "governorates" && (
          <GovernoratesTab
            colors={colors}
            t={t}
            governorateImages={governorateImages}
            setGovernorateImage={setGovernorateImage}
            showToast={showToast}
          />
        )}

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
                      onPress={() => { setNewPassword(""); setResetPwModal({ visible: true, userId: u.id, userName: u.name }); }}
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
                        onPress={() => askConfirm(`حظر ${u.name}؟`, () => { banUser(u.id); showToast("تم حظر المستخدم", "error"); })}
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
                    onPress={() => askConfirm(`حذف "${r.name}"؟`, () => { deleteRoom(r.id); showToast("تم حذف الغرفة", "success"); })}
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

      <Modal visible={resetPwModal.visible} transparent animationType="fade" onRequestClose={() => setResetPwModal((p) => ({ ...p, visible: false }))}>
        <Pressable style={styles.modalOverlay} onPress={() => setResetPwModal((p) => ({ ...p, visible: false }))}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <View style={[styles.modalIcon, { backgroundColor: "#F59E0B18" }]}>
              <Ionicons name="key-outline" size={28} color="#F59E0B" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("resetPasswordTitle")}</Text>
            <Text style={[{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" }]}>{resetPwModal.userName}</Text>
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
              <TouchableOpacity onPress={() => setResetPwModal((p) => ({ ...p, visible: false }))} style={[styles.modalCancelBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                  if (!newPassword.trim()) { showToast(t("fillAll"), "error"); return; }
                  resetUserPassword(resetPwModal.userId, newPassword.trim());
                  showToast(t("resetPasswordSuccess"), "success");
                  setResetPwModal((p) => ({ ...p, visible: false }));
                }}
              >
                <LinearGradient colors={["#F59E0B", "#D97706"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalConfirmBtn}>
                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>{t("save")}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={confirmModal.visible} transparent animationType="fade" onRequestClose={() => setConfirmModal((p) => ({ ...p, visible: false }))}>
        <Pressable style={styles.modalOverlay} onPress={() => setConfirmModal((p) => ({ ...p, visible: false }))}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <View style={[styles.modalIcon, { backgroundColor: `${colors.danger}18` }]}>
              <Ionicons name="warning-outline" size={28} color={colors.danger} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{confirmModal.title}</Text>
            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              <TouchableOpacity onPress={() => setConfirmModal((p) => ({ ...p, visible: false }))} style={[styles.modalCancelBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => { confirmModal.onConfirm(); setConfirmModal((p) => ({ ...p, visible: false })); }}
              >
                <LinearGradient colors={[colors.danger, "#c0392b"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalConfirmBtn}>
                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>{t("yes")}</Text>
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
  header: { paddingHorizontal: 16, paddingBottom: 12, gap: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  adminTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  adminSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  tabBar: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 4, gap: 4, alignSelf: "flex-start" },
  tabItem: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  tabLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  content: { padding: 16, gap: 12 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16 },
  addBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  listItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, borderWidth: 1 },
  listIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  listRestImg: { width: 44, height: 44, borderRadius: 12 },
  listAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  listAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  listAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  listTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  listSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  dangerBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionTag: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  formTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  imagePicker: { height: 120, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 8, overflow: "hidden" },
  imagePickerImg: { position: "absolute", width: "100%", height: "100%" },
  imagePickerOverlay: { position: "absolute", backgroundColor: "rgba(0,0,0,0.4)", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", gap: 4 },
  fInput: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  fInputText: { flex: 1, fontSize: 14 },
  subLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  menuItemRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, borderWidth: 1 },
  menuItemThumb: { width: 40, height: 40, borderRadius: 10 },
  menuItemThumbEmpty: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  addItemSection: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  addItemTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemImagePicker: { height: 70, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  itemImagePickerImg: { position: "absolute", width: "100%", height: "100%" },
  itemImageOverlay: { position: "absolute", backgroundColor: "rgba(0,0,0,0.4)", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  addItemBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  saveBtn: { height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  modalCard: { width: "82%", maxWidth: 320, borderRadius: 24, borderWidth: 1, padding: 24, alignItems: "center", gap: 12 },
  modalIcon: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  modalCancelBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalConfirmBtn: { height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", flex: 1 },
  govGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  govCard: {
    width: "28%",
    minWidth: 90,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 8,
    position: "relative",
  },
  govOval: {
    width: 60,
    height: 72,
    borderRadius: 30,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  govOvalImg: { width: "100%", height: "100%", resizeMode: "cover" },
  govName: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  govCheck: { position: "absolute", top: 6, right: 6 },
  govBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  govManagementGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "flex-start" },
  govManageCard: {
    width: "21%",
    minWidth: 76,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
    position: "relative",
  },
  govManageOvalWrap: { alignItems: "center" },
  govManageOval: {
    width: 52,
    height: 62,
    borderRadius: 26,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  govManageOvalImg: { width: "100%", height: "100%", resizeMode: "cover" },
  govManageName: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },
  govDoneTag: { position: "absolute", top: 4, right: 4 },
});
