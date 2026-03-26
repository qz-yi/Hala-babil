import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
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

import Colors, { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

export default function ProfileScreen() {
  const { currentUser, isSuperAdmin, logout, updateProfile, toggleTheme, theme, language, setLanguage, t } = useApp();
  const { showToast } = useToast();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 30 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [saving, setSaving] = useState(false);

  const userColor = ACCENT_COLORS[(currentUser?.name?.length || 0) % ACCENT_COLORS.length];

  const handleLogout = () => {
    Alert.alert(t("logout"), t("confirmLogout"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"), style: "destructive",
        onPress: async () => {
          await logout();
          showToast("تم تسجيل الخروج", "info");
          router.replace("/");
        },
      },
    ]);
  };

  const handlePickImage = async () => {
    if (Platform.OS === "web") {
      showToast("رفع الصور غير مدعوم على الويب", "info");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast("يرجى السماح بالوصول للمعرض", "error");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      setSaving(true);
      await updateProfile(currentUser?.name || "", result.assets[0].uri);
      setSaving(false);
      showToast("تم تحديث الصورة الشخصية!", "success");
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim()) {
      showToast("الاسم لا يمكن أن يكون فارغاً", "error");
      return;
    }
    setSaving(true);
    await updateProfile(editName.trim(), currentUser?.avatar);
    setSaving(false);
    setEditModal(false);
    showToast("تم تحديث الاسم بنجاح!", "success");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: botPad + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={
          theme === "dark"
            ? ["rgba(124,58,237,0.2)", "transparent"]
            : ["rgba(124,58,237,0.1)", "transparent"]
        }
        style={[styles.headerGrad, { paddingTop: topPad + 12 }]}
      >
        {isSuperAdmin && (
          <LinearGradient
            colors={["#FFD700", "#FFA500"]}
            style={styles.crownBadge}
          >
            <Text style={styles.crownText}>👑 {t("king")}</Text>
          </LinearGradient>
        )}

        {/* Avatar with edit overlay */}
        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85} style={styles.avatarWrap}>
          {isSuperAdmin ? (
            <LinearGradient
              colors={["#FFD700", "#FFA500", "#FF8C00"]}
              style={styles.avatar}
            >
              {currentUser?.avatar ? (
                <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{currentUser?.name[0]?.toUpperCase()}</Text>
              )}
            </LinearGradient>
          ) : (
            <View style={[styles.avatar, { backgroundColor: `${userColor}33` }]}>
              {currentUser?.avatar ? (
                <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={[styles.avatarInitial, { color: userColor }]}>
                  {currentUser?.name[0]?.toUpperCase()}
                </Text>
              )}
            </View>
          )}
          <View style={styles.editOverlay}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Name row */}
        <View style={styles.nameRow}>
          <Text style={[styles.profileName, { color: colors.text }]}>{currentUser?.name}</Text>
          <TouchableOpacity
            onPress={() => { setEditName(currentUser?.name || ""); setEditModal(true); }}
            style={[styles.editNameBtn, { backgroundColor: `${userColor}22`, borderColor: `${userColor}44` }]}
          >
            <Ionicons name="pencil" size={14} color={userColor} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>
          {currentUser?.phone}
        </Text>
        {isSuperAdmin && (
          <View style={styles.superAdminBadge}>
            <Text style={styles.superAdminBadgeText}>{t("superAdmin")}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Stats */}
      <View style={[styles.statsRow, { marginHorizontal: 20 }]}>
        {[
          { label: "العمر", value: currentUser?.age || "—" },
          { label: "العنوان", value: currentUser?.address || "—" },
          { label: "البريد", value: (currentUser?.email || "—").split("@")[0] },
        ].map((stat, i) => (
          <View key={i} style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
              {stat.value.toString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Settings */}
      <View style={[styles.section, { marginHorizontal: 20 }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>الإعدادات</Text>

        {/* Theme */}
        <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: "#7C3AED22" }]}>
              <Ionicons name={theme === "dark" ? "moon" : "sunny"} size={20} color="#7C3AED" />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {theme === "dark" ? t("darkMode") : t("lightMode")}
            </Text>
          </View>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: "#7C3AED" }}
            thumbColor="#fff"
          />
        </View>

        {/* Language */}
        <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: "#3B82F622" }]}>
              <Ionicons name="language" size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t("language")}</Text>
          </View>
          <View style={styles.langToggle}>
            {(["ar", "en"] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => setLanguage(lang)}
                style={[styles.langBtn, { backgroundColor: language === lang ? "#3B82F6" : colors.backgroundTertiary }]}
              >
                <Text style={[styles.langBtnText, { color: language === lang ? "#fff" : colors.textSecondary }]}>
                  {lang === "ar" ? "ع" : "EN"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Admin Panel */}
        {isSuperAdmin && (
          <TouchableOpacity
            onPress={() => router.push("/admin")}
            style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.superAdmin }]}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: `${colors.superAdmin}22` }]}>
                <Ionicons name="shield" size={20} color={colors.superAdmin} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.superAdmin }]}>{t("adminPanel")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.superAdmin} />
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: `${colors.danger}22` }]}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.danger }]}>{t("logout")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Edit Name Modal */}
      <Modal visible={editModal} transparent animationType="fade" onRequestClose={() => setEditModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditModal(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>تعديل الاسم</Text>
            <View style={[styles.nameInput, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <TextInput
                style={[{ flex: 1, color: colors.text, fontFamily: "Inter_400Regular", fontSize: 16, height: "100%" }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="الاسم الجديد"
                placeholderTextColor={colors.textSecondary}
                textAlign="right"
                autoFocus
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setEditModal(false)}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveName} disabled={saving} style={{ flex: 1 }}>
                <LinearGradient
                  colors={["#7C3AED", "#4F46E5"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveBtnText}>{saving ? "..." : t("save")}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 10,
  },
  crownBadge: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#FFD700", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 10,
  },
  crownText: { color: "#000", fontFamily: "Inter_700Bold", fontSize: 14 },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 96, height: 96, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", borderRadius: 28 },
  avatarInitial: { fontSize: 38, fontFamily: "Inter_700Bold", color: "#fff" },
  editOverlay: {
    position: "absolute", bottom: -4, right: -4,
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: "#4F46E5",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileName: { fontSize: 24, fontFamily: "Inter_700Bold" },
  editNameBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  profilePhone: { fontSize: 14, fontFamily: "Inter_400Regular" },
  superAdminBadge: {
    backgroundColor: "rgba(255,215,0,0.15)",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: "#FFD700",
  },
  superAdminBadgeText: { color: "#FFD700", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statItem: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    padding: 12, alignItems: "center",
  },
  statValue: { fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "center" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "center" },
  section: { gap: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 4 },
  settingRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 16, borderWidth: 1, padding: 14,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  settingLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  langToggle: { flexDirection: "row", gap: 4 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  langBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center",
  },
  modalCard: {
    width: "85%", maxWidth: 340, borderRadius: 24, borderWidth: 1,
    padding: 24, gap: 16,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  nameInput: {
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, height: 52,
    justifyContent: "center",
  },
  modalBtns: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  saveBtn: {
    height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
