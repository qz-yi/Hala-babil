import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
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

export default function ProfileScreen() {
  const { currentUser, isSuperAdmin, logout, toggleTheme, theme, language, setLanguage, t } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [editName, setEditName] = useState(false);
  const [nameValue, setNameValue] = useState(currentUser?.name || "");

  const userColor = ACCENT_COLORS[(currentUser?.name?.length || 0) % ACCENT_COLORS.length];

  const handleLogout = () => {
    Alert.alert(t("logout"), t("confirmLogout"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"), style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: botPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header gradient */}
      <LinearGradient
        colors={
          theme === "dark"
            ? ["rgba(124,58,237,0.2)", "transparent"]
            : ["rgba(124,58,237,0.1)", "transparent"]
        }
        style={[styles.headerGrad, { paddingTop: topPad + 12 }]}
      >
        {/* Super Admin crown effect */}
        {isSuperAdmin && (
          <View style={styles.crownRow}>
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              style={styles.crownBadge}
            >
              <Text style={styles.crownText}>👑 {t("king")}</Text>
            </LinearGradient>
          </View>
        )}

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {isSuperAdmin ? (
            <LinearGradient
              colors={["#FFD700", "#FFA500", "#FF8C00"]}
              style={[styles.avatar, styles.superAdminAvatar]}
            >
              <Text style={styles.avatarText}>{currentUser?.name[0]?.toUpperCase()}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.avatar, { backgroundColor: `${userColor}33` }]}>
              <Text style={[styles.avatarText, { color: userColor }]}>
                {currentUser?.name[0]?.toUpperCase()}
              </Text>
            </View>
          )}
          {isSuperAdmin && (
            <View style={[styles.superAdminGlow, { shadowColor: "#FFD700" }]} />
          )}
        </View>

        <Text style={[styles.profileName, { color: colors.text }]}>
          {currentUser?.name}
        </Text>
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
          { label: "العنوان", value: currentUser?.address || "—", small: true },
          { label: "البريد", value: (currentUser?.email || "—").split("@")[0], small: true },
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
              <Ionicons
                name={theme === "dark" ? "moon" : "sunny"}
                size={20}
                color="#7C3AED"
              />
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
            <TouchableOpacity
              onPress={() => setLanguage("ar")}
              style={[
                styles.langBtn,
                {
                  backgroundColor: language === "ar" ? "#3B82F6" : colors.backgroundTertiary,
                },
              ]}
            >
              <Text style={[styles.langBtnText, { color: language === "ar" ? "#fff" : colors.textSecondary }]}>
                ع
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLanguage("en")}
              style={[
                styles.langBtn,
                {
                  backgroundColor: language === "en" ? "#3B82F6" : colors.backgroundTertiary,
                },
              ]}
            >
              <Text style={[styles.langBtnText, { color: language === "en" ? "#fff" : colors.textSecondary }]}>
                EN
              </Text>
            </TouchableOpacity>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 8,
  },
  crownRow: { marginBottom: 4 },
  crownBadge: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 10,
  },
  crownText: { color: "#000", fontFamily: "Inter_700Bold", fontSize: 14 },
  avatarContainer: { position: "relative", marginBottom: 4 },
  avatar: {
    width: 90, height: 90, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
  },
  superAdminAvatar: {
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 20,
  },
  superAdminGlow: {
    position: "absolute",
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: "rgba(255,215,0,0.15)",
    transform: [{ scale: 1.3 }],
  },
  avatarText: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff" },
  profileName: { fontSize: 24, fontFamily: "Inter_700Bold" },
  profilePhone: { fontSize: 14, fontFamily: "Inter_400Regular" },
  superAdminBadge: {
    backgroundColor: "rgba(255,215,0,0.15)",
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: "#FFD700",
  },
  superAdminBadgeText: { color: "#FFD700", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  statsRow: {
    flexDirection: "row", gap: 10, marginBottom: 20,
  },
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
});
