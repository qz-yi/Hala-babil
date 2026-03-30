import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
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
import type { AccountType, Post, Reel } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 3) / 3;

type GridTab = "posts" | "reels";
type DrawerPage = "settings" | "activity" | "requests";

// ───── Drawer (Right Sidebar) ─────
function ProfileDrawer({
  visible,
  onClose,
  colors,
  theme,
  language,
  isSuperAdmin,
  onSettingsItem,
}: {
  visible: boolean;
  onClose: () => void;
  colors: any;
  theme: string;
  language: string;
  isSuperAdmin: boolean;
  onSettingsItem: (item: string) => void;
}) {
  const { t, toggleTheme, setLanguage, getFollowRequests, acceptFollowRequest, rejectFollowRequest, users, currentUser, getLikedReels, getMyComments, reels } = useApp();
  const [page, setPage] = useState<DrawerPage>("settings");
  const followRequests = getFollowRequests();
  const likedReels = getLikedReels();
  const myComments = getMyComments();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.drawerOverlay} onPress={onClose} />
      <View style={[styles.drawer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.drawerHandle} />
        <Text style={[styles.drawerTitle, { color: colors.text }]}>الإعدادات</Text>

        {/* Tabs */}
        <View style={[styles.drawerTabs, { borderColor: colors.border }]}>
          {[
            { key: "settings", label: "الإعدادات", icon: "settings-outline" },
            { key: "activity", label: "نشاطي", icon: "pulse-outline" },
            { key: "requests", label: "الطلبات", icon: "people-outline" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setPage(tab.key as DrawerPage)}
              style={[styles.drawerTab, page === tab.key && { backgroundColor: `${colors.tint}22` }]}
            >
              <Ionicons name={tab.icon as any} size={18} color={page === tab.key ? colors.tint : colors.textSecondary} />
              <Text style={[styles.drawerTabText, { color: page === tab.key ? colors.tint : colors.textSecondary }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 40 }}>
          {page === "settings" && (
            <>
              {/* نوع الحساب */}
              <TouchableOpacity onPress={() => onSettingsItem("accountType")} style={[styles.drawerItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <View style={[styles.drawerItemIcon, { backgroundColor: "#7C3AED22" }]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#7C3AED" />
                </View>
                <Text style={[styles.drawerItemText, { color: colors.text }]}>{t("accountType")}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {/* الوضع الليلي */}
              <View style={[styles.drawerItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <View style={[styles.drawerItemIcon, { backgroundColor: "#7C3AED22" }]}>
                  <Ionicons name={theme === "dark" ? "moon" : "sunny"} size={20} color="#7C3AED" />
                </View>
                <Text style={[styles.drawerItemText, { color: colors.text }]}>{theme === "dark" ? t("darkMode") : t("lightMode")}</Text>
                <Switch value={theme === "dark"} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: "#7C3AED" }} thumbColor="#fff" />
              </View>
              {/* اللغة */}
              <View style={[styles.drawerItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <View style={[styles.drawerItemIcon, { backgroundColor: "#3B82F622" }]}>
                  <Ionicons name="language" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.drawerItemText, { color: colors.text }]}>{t("language")}</Text>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {(["ar", "en"] as const).map((lang) => (
                    <TouchableOpacity key={lang} onPress={() => setLanguage(lang)} style={[styles.langBtn, { backgroundColor: language === lang ? "#3B82F6" : colors.backgroundTertiary }]}>
                      <Text style={[styles.langBtnText, { color: language === lang ? "#fff" : colors.textSecondary }]}>{lang === "ar" ? "ع" : "EN"}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* لوحة الإدارة */}
              {isSuperAdmin && (
                <TouchableOpacity onPress={() => { onClose(); router.push("/admin"); }} style={[styles.drawerItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.superAdmin }]}>
                  <View style={[styles.drawerItemIcon, { backgroundColor: `${colors.superAdmin}22` }]}>
                    <Ionicons name="shield" size={20} color={colors.superAdmin} />
                  </View>
                  <Text style={[styles.drawerItemText, { color: colors.superAdmin }]}>{t("adminPanel")}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.superAdmin} />
                </TouchableOpacity>
              )}
              {/* تسجيل الخروج */}
              <TouchableOpacity onPress={() => onSettingsItem("logout")} style={[styles.drawerItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <View style={[styles.drawerItemIcon, { backgroundColor: `${colors.danger}22` }]}>
                  <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                </View>
                <Text style={[styles.drawerItemText, { color: colors.danger }]}>{t("logout")}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.danger} />
              </TouchableOpacity>
            </>
          )}

          {page === "activity" && (
            <>
              <Text style={[styles.activitySectionTitle, { color: colors.textSecondary }]}>المقاطع المعجب بها ({likedReels.length})</Text>
              {likedReels.length === 0 ? (
                <Text style={[styles.emptyActivity, { color: colors.textSecondary }]}>لم تعجب بأي مقطع بعد</Text>
              ) : likedReels.slice(0, 5).map((r) => (
                <View key={r.id} style={[styles.activityItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <Ionicons name="heart" size={18} color="#E1306C" />
                  <Text style={[styles.activityItemText, { color: colors.text }]} numberOfLines={1}>{r.title || "مقطع بدون عنوان"}</Text>
                </View>
              ))}
              <Text style={[styles.activitySectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>تعليقاتي الأخيرة ({myComments.length})</Text>
              {myComments.length === 0 ? (
                <Text style={[styles.emptyActivity, { color: colors.textSecondary }]}>لم تضف أي تعليق بعد</Text>
              ) : myComments.slice(0, 5).map((c) => (
                <View key={c.id} style={[styles.activityItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.tint} />
                  <Text style={[styles.activityItemText, { color: colors.text }]} numberOfLines={1}>{c.content}</Text>
                </View>
              ))}
            </>
          )}

          {page === "requests" && (
            <>
              <Text style={[styles.activitySectionTitle, { color: colors.textSecondary }]}>
                {t("followRequests")} ({followRequests.length})
              </Text>
              {followRequests.length === 0 ? (
                <Text style={[styles.emptyActivity, { color: colors.textSecondary }]}>{t("noFollowRequests")}</Text>
              ) : followRequests.map((f) => {
                const requester = users.find((u) => u.id === f.followerId);
                if (!requester) return null;
                const color = ACCENT_COLORS[(requester.name?.length ?? 0) % ACCENT_COLORS.length];
                return (
                  <View key={f.id} style={[styles.requestItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    <View style={[styles.requestAvatar, { backgroundColor: `${color}33` }]}>
                      {requester.avatar ? <Image source={{ uri: requester.avatar }} style={StyleSheet.absoluteFill as any} /> :
                        <Text style={[styles.requestAvatarText, { color }]}>{requester.name[0]?.toUpperCase()}</Text>}
                    </View>
                    <Text style={[styles.requestName, { color: colors.text }]} numberOfLines={1}>{requester.name}</Text>
                    <TouchableOpacity onPress={() => acceptFollowRequest(requester.id)} style={[styles.acceptBtn, { backgroundColor: colors.tint }]}>
                      <Text style={styles.acceptBtnText}>{t("acceptRequest")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => rejectFollowRequest(requester.id)} style={[styles.rejectBtn, { borderColor: colors.border }]}>
                      <Ionicons name="close" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ───── Grid Item ─────
function PostGridItem({ post, colors }: { post: Post; colors: any }) {
  return (
    <View style={styles.gridItem}>
      {post.mediaUrl && post.mediaType === "image" ? (
        <Image source={{ uri: post.mediaUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
      ) : post.mediaUrl && post.mediaType === "video" ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
          <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.8)" />
        </View>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backgroundTertiary, alignItems: "center", justifyContent: "center", padding: 8 }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" }} numberOfLines={3}>
            {post.content}
          </Text>
        </View>
      )}
    </View>
  );
}

function ReelGridItem({ reel, colors }: { reel: Reel; colors: any }) {
  return (
    <View style={styles.gridItem}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.8)" />
      </View>
      <View style={[styles.gridOverlay]}>
        <Ionicons name="play" size={18} color="rgba(255,255,255,0.9)" />
      </View>
    </View>
  );
}

// ───── Main Profile Screen ─────
export default function ProfileScreen() {
  const {
    currentUser, isSuperAdmin, logout, updateProfile, theme, language, t,
    reels, posts, getFollowersCount, getFollowingCount, getFollowRequests,
  } = useApp();
  const { showToast } = useToast();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 30 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [editBio, setEditBio] = useState(currentUser?.bio || "");
  const [saving, setSaving] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [accountTypeModal, setAccountTypeModal] = useState(false);
  const [gridTab, setGridTab] = useState<GridTab>("posts");

  const userColor = ACCENT_COLORS[(currentUser?.name?.length || 0) % ACCENT_COLORS.length];
  const myReels = reels.filter((r) => r.creatorId === currentUser?.id);
  const myPosts = posts.filter((p) => p.creatorId === currentUser?.id);
  const followersCount = getFollowersCount(currentUser?.id || "");
  const followingCount = getFollowingCount(currentUser?.id || "");
  const pendingRequests = getFollowRequests().length;

  const handleLogout = async () => {
    setLogoutModal(false);
    await logout();
    showToast("تم تسجيل الخروج", "info");
    router.replace("/(auth)/login");
  };

  const handlePickImage = async () => {
    if (Platform.OS === "web") { showToast("رفع الصور غير مدعوم على الويب", "info"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { showToast("يرجى السماح بالوصول للمعرض", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (!result.canceled && result.assets[0]) {
      setSaving(true);
      await updateProfile(currentUser?.name || "", currentUser?.bio, result.assets[0].uri);
      setSaving(false);
      showToast("تم تحديث الصورة!", "success");
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { showToast("الاسم لا يمكن أن يكون فارغاً", "error"); return; }
    setSaving(true);
    await updateProfile(editName.trim(), editBio.trim(), currentUser?.avatar);
    setSaving(false);
    setEditModal(false);
    showToast("تم تحديث الملف الشخصي!", "success");
  };

  const handleDrawerItem = (item: string) => {
    setDrawerVisible(false);
    if (item === "logout") { setLogoutModal(true); }
    else if (item === "accountType") { setAccountTypeModal(true); }
  };

  const handleSetAccountType = async (type: AccountType) => {
    setAccountTypeModal(false);
    await updateProfile(currentUser?.name || "", currentUser?.bio, currentUser?.avatar, type);
    showToast(type === "private" ? "تم التحويل إلى حساب خاص" : "تم التحويل إلى حساب عام", "success");
  };

  const gridData = gridTab === "posts" ? myPosts : myReels;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={gridTab === "posts" ? myPosts : myReels}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 100 }}
        columnWrapperStyle={{ gap: 1.5 }}
        ItemSeparatorComponent={() => <View style={{ height: 1.5 }} />}
        ListHeaderComponent={
          <View>
            {/* ── Header ── */}
            <LinearGradient
              colors={theme === "dark" ? ["rgba(124,58,237,0.2)", "transparent"] : ["rgba(124,58,237,0.1)", "transparent"]}
              style={[styles.headerGrad, { paddingTop: topPad + 12 }]}
            >
              {/* Top Bar */}
              <View style={styles.topBar}>
                {isSuperAdmin && (
                  <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.crownBadge}>
                    <Text style={styles.crownText}>👑 {t("king")}</Text>
                  </LinearGradient>
                )}
                <View style={{ flex: 1 }} />
                {pendingRequests > 0 && (
                  <TouchableOpacity
                    onPress={() => setDrawerVisible(true)}
                    style={[styles.pendingBadge, { backgroundColor: "#E1306C" }]}
                  >
                    <Text style={styles.pendingBadgeText}>{pendingRequests}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setDrawerVisible(true)}
                  style={[styles.menuBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Ionicons name="menu" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Avatar */}
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85} style={styles.avatarWrap}>
                {isSuperAdmin ? (
                  <LinearGradient colors={["#FFD700", "#FFA500", "#FF8C00"]} style={styles.avatar}>
                    {currentUser?.avatar ? <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} /> :
                      <Text style={styles.avatarInitial}>{currentUser?.name[0]?.toUpperCase()}</Text>}
                  </LinearGradient>
                ) : (
                  <View style={[styles.avatar, { backgroundColor: `${userColor}33`, borderWidth: 3, borderColor: `${userColor}66` }]}>
                    {currentUser?.avatar ? <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} /> :
                      <Text style={[styles.avatarInitial, { color: userColor }]}>{currentUser?.name[0]?.toUpperCase()}</Text>}
                  </View>
                )}
                <View style={styles.editOverlay}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>

              {/* Name + Bio */}
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: colors.text }]}>{currentUser?.name}</Text>
                {currentUser?.accountType === "private" && (
                  <View style={[styles.privateBadge, { backgroundColor: `${colors.tint}22`, borderColor: `${colors.tint}44` }]}>
                    <Ionicons name="lock-closed" size={12} color={colors.tint} />
                  </View>
                )}
              </View>
              {currentUser?.bio ? (
                <Text style={[styles.bioText, { color: colors.textSecondary }]}>{currentUser.bio}</Text>
              ) : null}

              {/* Edit Profile Button */}
              <TouchableOpacity
                onPress={() => { setEditName(currentUser?.name || ""); setEditBio(currentUser?.bio || ""); setEditModal(true); }}
                style={[styles.editProfileBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              >
                <Ionicons name="pencil-outline" size={16} color={colors.text} />
                <Text style={[styles.editProfileBtnText, { color: colors.text }]}>{t("editProfile")}</Text>
              </TouchableOpacity>

              {/* Stats */}
              <View style={styles.statsRow}>
                {[
                  { label: t("posts"), value: myPosts.length },
                  { label: t("followers"), value: followersCount },
                  { label: t("followingCount"), value: followingCount },
                ].map((stat, i) => (
                  <View key={i} style={styles.statItem}>
                    <Text style={[styles.statNum, { color: colors.text }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* ── Grid Tabs ── */}
            <View style={[styles.gridTabs, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setGridTab("posts")} style={[styles.gridTab, gridTab === "posts" && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}>
                <Ionicons name="grid-outline" size={22} color={gridTab === "posts" ? colors.tint : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setGridTab("reels")} style={[styles.gridTab, gridTab === "reels" && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}>
                <Ionicons name="film-outline" size={22} color={gridTab === "reels" ? colors.tint : colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {gridData.length === 0 && (
              <View style={styles.emptyGrid}>
                <Ionicons name={gridTab === "posts" ? "images-outline" : "film-outline"} size={48} color={colors.border} />
                <Text style={[styles.emptyGridText, { color: colors.textSecondary }]}>
                  {gridTab === "posts" ? t("noPosts") : t("noReels")}
                </Text>
                <TouchableOpacity onPress={() => router.push(gridTab === "posts" ? "/create-post" : "/(tabs)/reels")}>
                  <LinearGradient colors={["#7C3AED", "#4F46E5"]} style={styles.emptyGridBtn}>
                    <Text style={styles.emptyGridBtnText}>{gridTab === "posts" ? t("createPost") : t("publishReel")}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) =>
          gridTab === "posts" ? (
            <PostGridItem post={item as Post} colors={colors} />
          ) : (
            <ReelGridItem reel={item as Reel} colors={colors} />
          )
        }
      />

      {/* ── Drawer ── */}
      <ProfileDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        colors={colors} theme={theme} language={language}
        isSuperAdmin={isSuperAdmin}
        onSettingsItem={handleDrawerItem}
      />

      {/* ── Edit Profile Modal ── */}
      <Modal visible={editModal} transparent animationType="fade" onRequestClose={() => setEditModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditModal(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("editProfile")}</Text>
            <View style={[styles.modalInput, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <TextInput
                style={[{ flex: 1, color: colors.text, fontFamily: "Inter_400Regular", fontSize: 15 }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="الاسم"
                placeholderTextColor={colors.textSecondary}
                textAlign="right"
              />
            </View>
            <View style={[styles.modalInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, height: 90 }]}>
              <TextInput
                style={[{ flex: 1, color: colors.text, fontFamily: "Inter_400Regular", fontSize: 14 }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="اكتب نبذة عنك..."
                placeholderTextColor={colors.textSecondary}
                textAlign="right"
                multiline
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setEditModal(false)} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveProfile} disabled={saving} style={{ flex: 1 }}>
                <LinearGradient colors={["#7C3AED", "#4F46E5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>{saving ? "..." : t("save")}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Account Type Modal ── */}
      <Modal visible={accountTypeModal} transparent animationType="fade" onRequestClose={() => setAccountTypeModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAccountTypeModal(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("accountType")}</Text>
            <TouchableOpacity onPress={() => handleSetAccountType("public")} style={[styles.accountTypeBtn, { backgroundColor: currentUser?.accountType === "public" ? `${colors.tint}22` : colors.backgroundTertiary, borderColor: currentUser?.accountType === "public" ? colors.tint : colors.border }]}>
              <Ionicons name="globe-outline" size={22} color={currentUser?.accountType === "public" ? colors.tint : colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountTypeBtnTitle, { color: colors.text }]}>{t("publicAccount")}</Text>
                <Text style={[styles.accountTypeBtnDesc, { color: colors.textSecondary }]}>يمكن للجميع رؤية منشوراتك</Text>
              </View>
              {currentUser?.accountType === "public" && <Ionicons name="checkmark-circle" size={22} color={colors.tint} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSetAccountType("private")} style={[styles.accountTypeBtn, { backgroundColor: currentUser?.accountType === "private" ? `${colors.tint}22` : colors.backgroundTertiary, borderColor: currentUser?.accountType === "private" ? colors.tint : colors.border }]}>
              <Ionicons name="lock-closed-outline" size={22} color={currentUser?.accountType === "private" ? colors.tint : colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountTypeBtnTitle, { color: colors.text }]}>{t("privateAccount")}</Text>
                <Text style={[styles.accountTypeBtnDesc, { color: colors.textSecondary }]}>فقط متابعوك يرون منشوراتك</Text>
              </View>
              {currentUser?.accountType === "private" && <Ionicons name="checkmark-circle" size={22} color={colors.tint} />}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Logout Modal ── */}
      <Modal visible={logoutModal} transparent animationType="fade" onRequestClose={() => setLogoutModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setLogoutModal(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <View style={[styles.logoutIcon, { backgroundColor: `${colors.danger}18` }]}>
              <Ionicons name="log-out-outline" size={30} color={colors.danger} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>تسجيل الخروج</Text>
            <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" }}>
              هل أنت متأكد؟
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setLogoutModal(false)} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={{ flex: 1 }}>
                <LinearGradient colors={[colors.danger, "#c0392b"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>تسجيل الخروج</Text>
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
  headerGrad: { paddingHorizontal: 20, paddingBottom: 24, gap: 12, alignItems: "center" },
  topBar: { flexDirection: "row", alignItems: "center", width: "100%", gap: 10 },
  crownBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, shadowColor: "#FFD700", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  crownText: { color: "#000", fontFamily: "Inter_700Bold", fontSize: 13 },
  pendingBadge: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  pendingBadgeText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  menuBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  avatarWrap: { position: "relative" },
  avatar: { width: 96, height: 96, borderRadius: 28, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%", borderRadius: 28 },
  avatarInitial: { fontSize: 38, fontFamily: "Inter_700Bold", color: "#fff" },
  editOverlay: { position: "absolute", bottom: -4, right: -4, width: 30, height: 30, borderRadius: 9, backgroundColor: "#4F46E5", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileName: { fontSize: 24, fontFamily: "Inter_700Bold" },
  privateBadge: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  bioText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginHorizontal: 20 },
  editProfileBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  editProfileBtnText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 32, justifyContent: "center" },
  statItem: { alignItems: "center", gap: 3 },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  gridTabs: { flexDirection: "row", borderBottomWidth: 1 },
  gridTab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  gridItem: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, backgroundColor: "#111", overflow: "hidden" },
  gridOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" },
  emptyGrid: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 14, paddingHorizontal: 40 },
  emptyGridText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  emptyGridBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  emptyGridBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  // Drawer
  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  drawer: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 20, paddingBottom: 40, maxHeight: "82%" },
  drawerHandle: { width: 40, height: 4, backgroundColor: "#ccc", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  drawerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 16 },
  drawerTabs: { flexDirection: "row", borderBottomWidth: 1, marginBottom: 16 },
  drawerTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: 10 },
  drawerTabText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  drawerItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  drawerItemIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  drawerItemText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  langBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  activitySectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginBottom: 6 },
  activityItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  activityItemText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  emptyActivity: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 16 },
  requestItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  requestAvatar: { width: 40, height: 40, borderRadius: 13, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  requestAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  requestName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  acceptBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  acceptBtnText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  rejectBtn: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  modalCard: { width: "88%", maxWidth: 360, borderRadius: 24, borderWidth: 1, padding: 24, gap: 14 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  modalInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 52, justifyContent: "center" },
  modalBtns: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  saveBtn: { height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  logoutIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  accountTypeBtn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  accountTypeBtnTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  accountTypeBtnDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
