import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToast } from "@/components/Toast";
import { useApp } from "@/context/AppContext";
import type { MenuItem } from "@/context/AppContext";

const BG = "#000000";
const CARD = "#111111";
const CARD2 = "#181818";
const BORDER = "#222222";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";
const ACCENT = "#10B981";
const RED = "#FF3B5C";
const ORANGE = "#F59E0B";

async function pickImg(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (!res.canceled && res.assets[0]) return res.assets[0].uri;
  return null;
}

function DisabledScreen() {
  const insets = useSafeAreaInsets();
  const MANAGER_WA = "9647719820537";
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, alignItems: "center", justifyContent: "center", gap: 24 }]}>
      <LinearGradient colors={["#FF3B5C22", "#FF3B5C05"]} style={styles.disabledGrad}>
        <View style={styles.disabledIcon}>
          <Feather name="slash" size={48} color={RED} strokeWidth={1.5} />
        </View>
        <Text style={styles.disabledTitle}>حسابك موقوف</Text>
        <Text style={styles.disabledDesc}>
          تم إيقاف حسابك بواسطة المدير. يرجى التواصل مع الإدارة لمعرفة السبب وإعادة التفعيل.
        </Text>
        <TouchableOpacity
          style={styles.waBtn}
          activeOpacity={0.85}
          onPress={() => Linking.openURL(`https://wa.me/${MANAGER_WA}`)}
        >
          <Feather name="message-circle" size={20} color="#fff" strokeWidth={1.5} />
          <Text style={styles.waBtnText}>تواصل مع المدير عبر واتساب</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

function AddEditItemModal({
  visible,
  item,
  onClose,
  onSave,
}: {
  visible: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onSave: (data: Omit<MenuItem, "id">) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item?.price?.toString() ?? "");
  const [desc, setDesc] = useState(item?.description ?? "");
  const [image, setImage] = useState<string | undefined>(item?.image);

  useEffect(() => {
    setName(item?.name ?? "");
    setPrice(item?.price?.toString() ?? "");
    setDesc(item?.description ?? "");
    setImage(item?.image);
  }, [item, visible]);

  const handleSave = () => {
    if (!name.trim() || !price.trim()) return;
    onSave({ name: name.trim(), price: parseFloat(price), description: desc.trim() || undefined, image, isVisible: item?.isVisible ?? true });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{item ? "تعديل الصنف" : "إضافة صنف جديد"}</Text>

            <TouchableOpacity style={styles.itemImgPicker} onPress={async () => { const uri = await pickImg(); if (uri) setImage(uri); }}>
              {image ? (
                <Image source={{ uri: image }} style={styles.itemImgPreview} />
              ) : (
                <View style={styles.itemImgPlaceholder}>
                  <Feather name="image" size={28} color={TEXT2} strokeWidth={1.5} />
                  <Text style={styles.itemImgPlaceholderTxt}>اضف صورة</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>اسم الصنف *</Text>
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={setName}
                placeholder="مثال: برجر كلاسيك"
                placeholderTextColor={TEXT2}
                textAlign="right"
              />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>السعر (د.ع) *</Text>
              <TextInput
                style={styles.fieldInput}
                value={price}
                onChangeText={setPrice}
                placeholder="5000"
                placeholderTextColor={TEXT2}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>الوصف</Text>
              <TextInput
                style={[styles.fieldInput, { height: 72 }]}
                value={desc}
                onChangeText={setDesc}
                placeholder="وصف مختصر (اختياري)"
                placeholderTextColor={TEXT2}
                multiline
                textAlign="right"
              />
            </View>

            <TouchableOpacity style={styles.saveItemBtn} activeOpacity={0.85} onPress={handleSave}>
              <Text style={styles.saveItemBtnTxt}>حفظ</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function MyRestaurantScreen() {
  const {
    currentUser, isRestaurantOwner, getMyRestaurant,
    updateRestaurantProfile,
    addMenuItemToRestaurant, updateMenuItemInRestaurant, deleteMenuItemFromRestaurant, toggleMenuItemVisibility,
  } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [editProfileModal, setEditProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [addItemModal, setAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/(auth)/login");
    }
  }, [currentUser]);

  if (!currentUser || !isRestaurantOwner) return null;

  if (currentUser.isActive === false) {
    return <DisabledScreen />;
  }

  const restaurant = getMyRestaurant();

  if (!restaurant) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", paddingTop: topPad }]}>
        <Feather name="alert-circle" size={48} color={TEXT2} strokeWidth={1} />
        <Text style={{ color: TEXT2, marginTop: 16, fontFamily: "Inter_500Medium", fontSize: 16 }}>
          لم يتم ربط مطعم بحسابك بعد
        </Text>
        <Text style={{ color: TEXT2, marginTop: 8, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", paddingHorizontal: 40 }}>
          تواصل مع المدير لإنشاء مطعمك
        </Text>
      </View>
    );
  }

  const openEditProfile = () => {
    setEditName(restaurant.name);
    setEditDesc(restaurant.description ?? "");
    setEditCategory(restaurant.category);
    setEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) { showToast("اسم المطعم مطلوب", "error"); return; }
    updateRestaurantProfile(restaurant.id, { name: editName.trim(), description: editDesc.trim() || undefined, category: editCategory.trim() || "مطعم" });
    setEditProfileModal(false);
    showToast("تم حفظ بيانات المطعم", "success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePickCover = async () => {
    const uri = await pickImg();
    if (uri) {
      updateRestaurantProfile(restaurant.id, { image: uri });
      showToast("تم تحديث صورة المطعم", "success");
    }
  };

  const handleAddItem = (data: Omit<MenuItem, "id">) => {
    addMenuItemToRestaurant(restaurant.id, data);
    showToast("تمت إضافة الصنف", "success");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleEditItem = (data: Omit<MenuItem, "id">) => {
    if (!editingItem) return;
    updateMenuItemInRestaurant(restaurant.id, editingItem.id, data);
    setEditingItem(null);
    showToast("تم تحديث الصنف", "success");
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert("حذف الصنف", "هل أنت متأكد من حذف هذا الصنف؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: () => {
          deleteMenuItemFromRestaurant(restaurant.id, itemId);
          showToast("تم حذف الصنف", "success");
        },
      },
    ]);
  };

  const dues = restaurant.monthlyDues ?? 0;
  const commission = restaurant.commissionRate ?? 10;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Text style={styles.headerTitle}>مطعمي</Text>
          <TouchableOpacity style={styles.editProfileBtn} onPress={openEditProfile} activeOpacity={0.8}>
            <Feather name="edit-2" size={16} color={TEXT} strokeWidth={1.5} />
            <Text style={styles.editProfileBtnTxt}>تعديل</Text>
          </TouchableOpacity>
        </View>

        {/* Cover + Identity */}
        <TouchableOpacity style={styles.coverWrap} onPress={handlePickCover} activeOpacity={0.85}>
          {restaurant.image ? (
            <Image source={{ uri: restaurant.image }} style={styles.coverImg} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Feather name="camera" size={36} color={TEXT2} strokeWidth={1} />
              <Text style={styles.coverPlaceholderTxt}>اضغط لإضافة صورة المطعم</Text>
            </View>
          )}
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.coverOverlay}>
            <Text style={styles.coverName}>{restaurant.name}</Text>
            {restaurant.description ? (
              <Text style={styles.coverDesc} numberOfLines={2}>{restaurant.description}</Text>
            ) : null}
            <View style={styles.coverBadge}>
              <Text style={styles.coverBadgeTxt}>{restaurant.category}</Text>
            </View>
          </View>
          <View style={styles.cameraIcon}>
            <Feather name="camera" size={16} color="#fff" strokeWidth={1.5} />
          </View>
        </TouchableOpacity>

        {/* Dues Card */}
        <View style={styles.duesCard}>
          <View style={styles.duesRow}>
            <View style={styles.duesBlock}>
              <Text style={styles.duesLabel}>المستحقات الشهرية</Text>
              <Text style={[styles.duesValue, { color: dues > 0 ? ORANGE : ACCENT }]}>
                {dues.toLocaleString("ar-IQ")} د.ع
              </Text>
            </View>
            <View style={[styles.duesDivider]} />
            <View style={styles.duesBlock}>
              <Text style={styles.duesLabel}>نسبة العمولة</Text>
              <Text style={[styles.duesValue, { color: TEXT }]}>{commission}%</Text>
            </View>
          </View>
          <Text style={styles.duesNote}>
            يتم احتساب العمولة تلقائياً على كل طلب واردة عبر التطبيق
          </Text>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>قائمة الطعام ({restaurant.menuItems.length} صنف)</Text>
            <TouchableOpacity
              style={styles.addItemBtn}
              activeOpacity={0.85}
              onPress={() => { setEditingItem(null); setAddItemModal(true); }}
            >
              <Feather name="plus" size={18} color={BG} strokeWidth={2.5} />
              <Text style={styles.addItemBtnTxt}>إضافة صنف</Text>
            </TouchableOpacity>
          </View>

          {restaurant.menuItems.length === 0 ? (
            <View style={styles.emptyMenu}>
              <Feather name="coffee" size={48} color={BORDER} strokeWidth={1} />
              <Text style={styles.emptyMenuTxt}>لا توجد أصناف بعد</Text>
              <Text style={styles.emptyMenuSub}>أضف أصناف قائمة طعامك الآن</Text>
            </View>
          ) : (
            restaurant.menuItems.map((item, idx) => (
              <MenuItemRow
                key={item.id}
                item={item}
                index={idx + 1}
                restaurantId={restaurant.id}
                onEdit={() => { setEditingItem(item); setAddItemModal(true); }}
                onDelete={() => handleDeleteItem(item.id)}
                onToggleVisibility={() => toggleMenuItemVisibility(restaurant.id, item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <AddEditItemModal
        visible={addItemModal}
        item={editingItem}
        onClose={() => { setAddItemModal(false); setEditingItem(null); }}
        onSave={editingItem ? handleEditItem : handleAddItem}
      />

      {/* Edit Profile Modal */}
      <Modal visible={editProfileModal} transparent animationType="slide" onRequestClose={() => setEditProfileModal(false)}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => setEditProfileModal(false)}>
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>تعديل بيانات المطعم</Text>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>اسم المطعم *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="اسم مطعمك"
                  placeholderTextColor={TEXT2}
                  textAlign="right"
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>الفئة</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editCategory}
                  onChangeText={setEditCategory}
                  placeholder="مثال: مشاوي، وجبات سريعة"
                  placeholderTextColor={TEXT2}
                  textAlign="right"
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>وصف المطعم</Text>
                <TextInput
                  style={[styles.fieldInput, { height: 90 }]}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  placeholder="صف مطعمك ومميزاته..."
                  placeholderTextColor={TEXT2}
                  multiline
                  textAlign="right"
                />
              </View>

              <TouchableOpacity style={styles.saveItemBtn} activeOpacity={0.85} onPress={handleSaveProfile}>
                <Text style={styles.saveItemBtnTxt}>حفظ التغييرات</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function MenuItemRow({
  item,
  index,
  restaurantId,
  onEdit,
  onDelete,
  onToggleVisibility,
}: {
  item: MenuItem;
  index: number;
  restaurantId: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}) {
  const isVisible = item.isVisible !== false;

  return (
    <View style={[styles.menuItemRow, !isVisible && styles.menuItemHidden]}>
      <Text style={styles.menuItemNum}>#{index}</Text>

      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.menuItemImg} />
      ) : (
        <View style={styles.menuItemImgPlaceholder}>
          <Text style={{ fontSize: 20 }}>🍽️</Text>
        </View>
      )}

      <View style={styles.menuItemInfo}>
        <Text style={[styles.menuItemName, !isVisible && { color: TEXT2 }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.menuItemPrice}>{item.price.toLocaleString()} د.ع</Text>
        {item.description ? (
          <Text style={styles.menuItemDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
      </View>

      <View style={styles.menuItemActions}>
        <Switch
          value={isVisible}
          onValueChange={onToggleVisibility}
          trackColor={{ false: BORDER, true: `${ACCENT}88` }}
          thumbColor={isVisible ? ACCENT : TEXT2}
          ios_backgroundColor={BORDER}
        />
        <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
          <Feather name="edit-2" size={16} color={TEXT2} strokeWidth={1.5} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
          <Feather name="trash-2" size={16} color={RED} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 0.5, borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: TEXT },
  editProfileBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  editProfileBtnTxt: { color: TEXT, fontSize: 13, fontFamily: "Inter_600SemiBold" },

  coverWrap: { margin: 16, borderRadius: 20, overflow: "hidden", height: 200, backgroundColor: CARD },
  coverImg: { width: "100%", height: "100%", resizeMode: "cover" },
  coverPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: CARD2 },
  coverPlaceholderTxt: { color: TEXT2, fontFamily: "Inter_400Regular", fontSize: 14 },
  coverOverlay: { position: "absolute", bottom: 16, left: 16, right: 16, gap: 6 },
  coverName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  coverDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  coverBadge: { alignSelf: "flex-start", backgroundColor: `${ACCENT}cc`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  coverBadgeTxt: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cameraIcon: {
    position: "absolute", top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center",
  },

  duesCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: CARD, borderWidth: 0.5, borderColor: BORDER, padding: 16, gap: 10 },
  duesRow: { flexDirection: "row", alignItems: "center" },
  duesBlock: { flex: 1, alignItems: "center", gap: 4 },
  duesDivider: { width: 1, height: 44, backgroundColor: BORDER },
  duesLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT2 },
  duesValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  duesNote: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXT2, textAlign: "center" },

  menuSection: { paddingHorizontal: 16 },
  menuHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  menuTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: TEXT },
  addItemBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: TEXT, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  addItemBtnTxt: { color: BG, fontSize: 13, fontFamily: "Inter_700Bold" },
  emptyMenu: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyMenuTxt: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: TEXT2 },
  emptyMenuSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: TEXT2 },

  menuItemRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: CARD, borderRadius: 14, padding: 12, marginBottom: 10,
    borderWidth: 0.5, borderColor: BORDER,
  },
  menuItemHidden: { opacity: 0.5 },
  menuItemNum: { fontSize: 12, fontFamily: "Inter_700Bold", color: TEXT2, minWidth: 22 },
  menuItemImg: { width: 52, height: 52, borderRadius: 10, backgroundColor: CARD2 },
  menuItemImgPlaceholder: { width: 52, height: 52, borderRadius: 10, backgroundColor: CARD2, alignItems: "center", justifyContent: "center" },
  menuItemInfo: { flex: 1, gap: 3 },
  menuItemName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: TEXT },
  menuItemPrice: { fontSize: 13, fontFamily: "Inter_700Bold", color: ACCENT },
  menuItemDesc: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXT2 },
  menuItemActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: TEXT, textAlign: "right" },
  fieldRow: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: TEXT2, textAlign: "right" },
  fieldInput: {
    backgroundColor: CARD2, borderRadius: 12, borderWidth: 0.5, borderColor: BORDER,
    paddingHorizontal: 14, paddingVertical: 12, color: TEXT, fontFamily: "Inter_400Regular", fontSize: 15,
  },
  itemImgPicker: { alignSelf: "center", width: 100, height: 100, borderRadius: 16, overflow: "hidden" },
  itemImgPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  itemImgPlaceholder: { width: "100%", height: "100%", backgroundColor: CARD2, alignItems: "center", justifyContent: "center", gap: 6 },
  itemImgPlaceholderTxt: { fontSize: 11, color: TEXT2, fontFamily: "Inter_400Regular" },
  saveItemBtn: { backgroundColor: TEXT, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  saveItemBtnTxt: { color: BG, fontSize: 16, fontFamily: "Inter_700Bold" },

  disabledGrad: { borderRadius: 24, padding: 32, margin: 24, alignItems: "center", gap: 16 },
  disabledIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: `${RED}15`, alignItems: "center", justifyContent: "center" },
  disabledTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: TEXT },
  disabledDesc: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT2, textAlign: "center", lineHeight: 22 },
  waBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#25D366", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 100,
  },
  waBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
