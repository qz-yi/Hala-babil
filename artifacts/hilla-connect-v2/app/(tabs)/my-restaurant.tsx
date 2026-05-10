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
import { useThemeStore } from "@/store/themeStore";

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
  const c = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const MANAGER_WA = "9647719820537";
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, alignItems: "center", justifyContent: "center", gap: 24, backgroundColor: c.background }]}>
      <LinearGradient colors={["#FF3B5C22", "#FF3B5C05"]} style={styles.disabledGrad}>
        <View style={styles.disabledIcon}>
          <Feather name="slash" size={48} color={c.danger} strokeWidth={1.5} />
        </View>
        <Text style={[styles.disabledTitle, { color: c.text }]}>حسابك موقوف</Text>
        <Text style={[styles.disabledDesc, { color: c.textSecondary }]}>
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
  const c = useThemeStore((s) => s.tokens);
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
          <Pressable style={[styles.modalSheet, { backgroundColor: c.card }]} onPress={() => {}}>
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>{item ? "تعديل الصنف" : "إضافة صنف جديد"}</Text>

            <TouchableOpacity style={styles.itemImgPicker} onPress={async () => { const uri = await pickImg(); if (uri) setImage(uri); }}>
              {image ? (
                <Image source={{ uri: image }} style={styles.itemImgPreview} />
              ) : (
                <View style={[styles.itemImgPlaceholder, { backgroundColor: c.backgroundTertiary }]}>
                  <Feather name="image" size={28} color={c.textSecondary} strokeWidth={1.5} />
                  <Text style={[styles.itemImgPlaceholderTxt, { color: c.textSecondary }]}>اضف صورة</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>اسم الصنف *</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: c.backgroundTertiary, borderColor: c.border, color: c.text }]}
                value={name}
                onChangeText={setName}
                placeholder="مثال: برجر كلاسيك"
                placeholderTextColor={c.textSecondary}
                textAlign="right"
              />
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>السعر (د.ع) *</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: c.backgroundTertiary, borderColor: c.border, color: c.text }]}
                value={price}
                onChangeText={setPrice}
                placeholder="5000"
                placeholderTextColor={c.textSecondary}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>الوصف</Text>
              <TextInput
                style={[styles.fieldInput, { height: 72, backgroundColor: c.backgroundTertiary, borderColor: c.border, color: c.text }]}
                value={desc}
                onChangeText={setDesc}
                placeholder="وصف مختصر (اختياري)"
                placeholderTextColor={c.textSecondary}
                multiline
                textAlign="right"
              />
            </View>

            <TouchableOpacity style={[styles.saveItemBtn, { backgroundColor: c.text }]} activeOpacity={0.85} onPress={handleSave}>
              <Text style={[styles.saveItemBtnTxt, { color: c.background }]}>حفظ</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function MyRestaurantScreen() {
  const c = useThemeStore((s) => s.tokens);
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
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", paddingTop: topPad, backgroundColor: c.background }]}>
        <Feather name="alert-circle" size={48} color={c.textSecondary} strokeWidth={1} />
        <Text style={{ color: c.textSecondary, marginTop: 16, fontFamily: "Inter_500Medium", fontSize: 16 }}>
          لم يتم ربط مطعم بحسابك بعد
        </Text>
        <Text style={{ color: c.textSecondary, marginTop: 8, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", paddingHorizontal: 40 }}>
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
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: c.border }]}>
          <Text style={[styles.headerTitle, { color: c.text }]}>مطعمي</Text>
          <TouchableOpacity style={[styles.editProfileBtn, { borderColor: c.border, backgroundColor: c.card }]} onPress={openEditProfile} activeOpacity={0.8}>
            <Feather name="edit-2" size={16} color={c.text} strokeWidth={1.5} />
            <Text style={[styles.editProfileBtnTxt, { color: c.text }]}>تعديل</Text>
          </TouchableOpacity>
        </View>

        {/* Cover + Identity */}
        <TouchableOpacity style={[styles.coverWrap, { backgroundColor: c.card }]} onPress={handlePickCover} activeOpacity={0.85}>
          {restaurant.image ? (
            <Image source={{ uri: restaurant.image }} style={styles.coverImg} />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: c.backgroundTertiary }]}>
              <Feather name="camera" size={36} color={c.textSecondary} strokeWidth={1} />
              <Text style={[styles.coverPlaceholderTxt, { color: c.textSecondary }]}>اضغط لإضافة صورة المطعم</Text>
            </View>
          )}
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.coverOverlay}>
            <Text style={styles.coverName}>{restaurant.name}</Text>
            {restaurant.description ? (
              <Text style={styles.coverDesc} numberOfLines={2}>{restaurant.description}</Text>
            ) : null}
            <View style={[styles.coverBadge, { backgroundColor: `${c.success}cc` }]}>
              <Text style={styles.coverBadgeTxt}>{restaurant.category}</Text>
            </View>
          </View>
          <View style={styles.cameraIcon}>
            <Feather name="camera" size={16} color="#fff" strokeWidth={1.5} />
          </View>
        </TouchableOpacity>

        {/* Dues Card */}
        <View style={[styles.duesCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.duesRow}>
            <View style={styles.duesBlock}>
              <Text style={[styles.duesLabel, { color: c.textSecondary }]}>المستحقات الشهرية</Text>
              <Text style={[styles.duesValue, { color: dues > 0 ? "#F59E0B" : c.success }]}>
                {dues.toLocaleString("ar-IQ")} د.ع
              </Text>
            </View>
            <View style={[styles.duesDivider, { backgroundColor: c.border }]} />
            <View style={styles.duesBlock}>
              <Text style={[styles.duesLabel, { color: c.textSecondary }]}>نسبة العمولة</Text>
              <Text style={[styles.duesValue, { color: c.text }]}>{commission}%</Text>
            </View>
          </View>
          <Text style={[styles.duesNote, { color: c.textSecondary }]}>
            يتم احتساب العمولة تلقائياً على كل طلب واردة عبر التطبيق
          </Text>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <View style={styles.menuHeader}>
            <Text style={[styles.menuTitle, { color: c.text }]}>قائمة الطعام ({restaurant.menuItems.length} صنف)</Text>
            <TouchableOpacity
              style={[styles.addItemBtn, { backgroundColor: c.text }]}
              activeOpacity={0.85}
              onPress={() => { setEditingItem(null); setAddItemModal(true); }}
            >
              <Feather name="plus" size={18} color={c.background} strokeWidth={2.5} />
              <Text style={[styles.addItemBtnTxt, { color: c.background }]}>إضافة صنف</Text>
            </TouchableOpacity>
          </View>

          {restaurant.menuItems.length === 0 ? (
            <View style={styles.emptyMenu}>
              <Feather name="coffee" size={48} color={c.border} strokeWidth={1} />
              <Text style={[styles.emptyMenuTxt, { color: c.textSecondary }]}>لا توجد أصناف بعد</Text>
              <Text style={[styles.emptyMenuSub, { color: c.textSecondary }]}>أضف أصناف قائمة طعامك الآن</Text>
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
            <Pressable style={[styles.modalSheet, { backgroundColor: c.card }]} onPress={() => {}}>
              <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
              <Text style={[styles.sheetTitle, { color: c.text }]}>تعديل بيانات المطعم</Text>

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>اسم المطعم *</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: c.backgroundTertiary, borderColor: c.border, color: c.text }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="اسم مطعمك"
                  placeholderTextColor={c.textSecondary}
                  textAlign="right"
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>الفئة</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: c.backgroundTertiary, borderColor: c.border, color: c.text }]}
                  value={editCategory}
                  onChangeText={setEditCategory}
                  placeholder="مثال: مشاوي، وجبات سريعة"
                  placeholderTextColor={c.textSecondary}
                  textAlign="right"
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>وصف المطعم</Text>
                <TextInput
                  style={[styles.fieldInput, { height: 90, backgroundColor: c.backgroundTertiary, borderColor: c.border, color: c.text }]}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  placeholder="صف مطعمك ومميزاته..."
                  placeholderTextColor={c.textSecondary}
                  multiline
                  textAlign="right"
                />
              </View>

              <TouchableOpacity style={[styles.saveItemBtn, { backgroundColor: c.text }]} activeOpacity={0.85} onPress={handleSaveProfile}>
                <Text style={[styles.saveItemBtnTxt, { color: c.background }]}>حفظ التغييرات</Text>
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
  const c = useThemeStore((s) => s.tokens);
  const isVisible = item.isVisible !== false;

  return (
    <View style={[styles.menuItemRow, { backgroundColor: c.card, borderColor: c.border }, !isVisible && styles.menuItemHidden]}>
      <Text style={[styles.menuItemNum, { color: c.textSecondary }]}>#{index}</Text>

      {item.image ? (
        <Image source={{ uri: item.image }} style={[styles.menuItemImg, { backgroundColor: c.backgroundTertiary }]} />
      ) : (
        <View style={[styles.menuItemImgPlaceholder, { backgroundColor: c.backgroundTertiary }]}>
          <Text style={{ fontSize: 20 }}>🍽️</Text>
        </View>
      )}

      <View style={styles.menuItemInfo}>
        <Text style={[styles.menuItemName, { color: c.text }, !isVisible && { color: c.textSecondary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.menuItemPrice, { color: c.success }]}>{item.price.toLocaleString()} د.ع</Text>
        {item.description ? (
          <Text style={[styles.menuItemDesc, { color: c.textSecondary }]} numberOfLines={1}>{item.description}</Text>
        ) : null}
      </View>

      <View style={styles.menuItemActions}>
        <Switch
          value={isVisible}
          onValueChange={onToggleVisibility}
          trackColor={{ false: c.border, true: `${c.success}88` }}
          thumbColor={isVisible ? c.success : c.textSecondary}
          ios_backgroundColor={c.border}
        />
        <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
          <Feather name="edit-2" size={16} color={c.textSecondary} strokeWidth={1.5} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
          <Feather name="trash-2" size={16} color={c.danger} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  editProfileBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  editProfileBtnTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  coverWrap: { margin: 16, borderRadius: 20, overflow: "hidden", height: 200 },
  coverImg: { width: "100%", height: "100%", resizeMode: "cover" },
  coverPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", gap: 12 },
  coverPlaceholderTxt: { fontFamily: "Inter_400Regular", fontSize: 14 },
  coverOverlay: { position: "absolute", bottom: 16, left: 16, right: 16, gap: 6 },
  coverName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  coverDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  coverBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  coverBadgeTxt: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cameraIcon: {
    position: "absolute", top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center",
  },

  duesCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 0.5, padding: 16, gap: 10 },
  duesRow: { flexDirection: "row", alignItems: "center" },
  duesBlock: { flex: 1, alignItems: "center", gap: 4 },
  duesDivider: { width: 1, height: 44 },
  duesLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  duesValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  duesNote: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },

  menuSection: { paddingHorizontal: 16 },
  menuHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  menuTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  addItemBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  addItemBtnTxt: { fontSize: 13, fontFamily: "Inter_700Bold" },
  emptyMenu: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyMenuTxt: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  emptyMenuSub: { fontSize: 13, fontFamily: "Inter_400Regular" },

  menuItemRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, padding: 12, marginBottom: 10,
    borderWidth: 0.5,
  },
  menuItemHidden: { opacity: 0.5 },
  menuItemNum: { fontSize: 12, fontFamily: "Inter_700Bold", minWidth: 22 },
  menuItemImg: { width: 52, height: 52, borderRadius: 10 },
  menuItemImgPlaceholder: { width: 52, height: 52, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuItemInfo: { flex: 1, gap: 3 },
  menuItemName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  menuItemPrice: { fontSize: 13, fontFamily: "Inter_700Bold" },
  menuItemDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },
  menuItemActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "right" },
  fieldRow: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  fieldInput: {
    borderRadius: 12, borderWidth: 0.5,
    paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15,
  },
  itemImgPicker: { alignSelf: "center", width: 100, height: 100, borderRadius: 16, overflow: "hidden" },
  itemImgPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  itemImgPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", gap: 6 },
  itemImgPlaceholderTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  saveItemBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  saveItemBtnTxt: { fontSize: 16, fontFamily: "Inter_700Bold" },

  disabledGrad: { borderRadius: 24, padding: 32, margin: 24, alignItems: "center", gap: 16 },
  disabledIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#FF3B5C15", alignItems: "center", justifyContent: "center" },
  disabledTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  disabledDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  waBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#25D366", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 100,
  },
  waBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
