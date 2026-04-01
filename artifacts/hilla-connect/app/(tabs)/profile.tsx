import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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

import { ACCENT_COLORS, STORY_GRADIENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { AccountType, Post, Reel } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 3) / 3;

const BG = "#000000";
const CARD = "#121212";
const BORDER = "#262626";
const TEXT = "#FFFFFF";
const TEXT2 = "#8E8E93";

type GridTab = "posts" | "reels";
type DrawerPage = "settings" | "activity" | "requests";

// ───── Drawer ─────
function ProfileDrawer({
  visible,
  onClose,
  theme,
  language,
  isSuperAdmin,
  onSettingsItem,
}: {
  visible: boolean;
  onClose: () => void;
  theme: string;
  language: string;
  isSuperAdmin: boolean;
  onSettingsItem: (item: string) => void;
}) {
  const {
    t,
    toggleTheme,
    setLanguage,
    getFollowRequests,
    acceptFollowRequest,
    rejectFollowRequest,
    users,
    currentUser,
    getLikedReels,
    getMyComments,
    getMyPostComments,
    getLikedPosts,
  } = useApp();
  const [page, setPage] = useState<DrawerPage>("settings");
  const followRequests = getFollowRequests();
  const likedReels = getLikedReels();
  const myPostComments = getMyPostComments();
  const likedPosts = getLikedPosts();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.drawerOverlay} onPress={onClose} />
      <View style={styles.drawer}>
        <View style={styles.drawerHandle} />
        <Text style={styles.drawerTitle}>الإعدادات</Text>

        <View style={styles.drawerTabs}>
          {[
            { key: "settings", label: "الإعدادات", icon: "settings" },
            { key: "activity", label: "نشاطي", icon: "activity" },
            { key: "requests", label: "الطلبات", icon: "users" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setPage(tab.key as DrawerPage)}
              style={[styles.drawerTab, page === tab.key && styles.drawerTabActive]}
            >
              <Feather name={tab.icon as any} size={17} color={page === tab.key ? TEXT : TEXT2} strokeWidth={1.5} />
              <Text style={[styles.drawerTabText, page === tab.key && { color: TEXT }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 48 }}>
          {page === "settings" && (
            <>
              <TouchableOpacity onPress={() => onSettingsItem("accountType")} style={styles.drawerItem}>
                <View style={[styles.drawerItemIcon, { backgroundColor: "#9B59B622" }]}>
                  <Feather name="lock" size={18} color="#9B59B6" strokeWidth={1.5} />
                </View>
                <Text style={styles.drawerItemText}>{t("accountType")}</Text>
                <Feather name="chevron-right" size={16} color={TEXT2} strokeWidth={1.5} />
              </TouchableOpacity>

              <View style={styles.drawerItem}>
                <View style={[styles.drawerItemIcon, { backgroundColor: "#3D91F422" }]}>
                  <Feather name={theme === "dark" ? "moon" : "sun"} size={18} color="#3D91F4" strokeWidth={1.5} />
                </View>
                <Text style={styles.drawerItemText}>{theme === "dark" ? t("darkMode") : t("lightMode")}</Text>
                <Switch
                  value={theme === "dark"}
                  onValueChange={toggleTheme}
                  trackColor={{ false: "#333", true: "#3D91F4" }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.drawerItem}>
                <View style={[styles.drawerItemIcon, { backgroundColor: "#34D39922" }]}>
                  <Feather name="globe" size={18} color="#34D399" strokeWidth={1.5} />
                </View>
                <Text style={styles.drawerItemText}>{t("language")}</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {(["ar", "en"] as const).map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      onPress={() => setLanguage(lang)}
                      style={[styles.langBtn, language === lang && styles.langBtnActive]}
                    >
                      <Text style={[styles.langBtnText, language === lang && { color: BG }]}>
                        {lang === "ar" ? "ع" : "EN"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {isSuperAdmin && (
                <TouchableOpacity
                  onPress={() => { onClose(); router.push("/admin"); }}
                  style={[styles.drawerItem, { borderColor: "#FFD70044" }]}
                >
                  <View style={[styles.drawerItemIcon, { backgroundColor: "#FFD70022" }]}>
                    <Feather name="shield" size={18} color="#FFD700" strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.drawerItemText, { color: "#FFD700" }]}>{t("adminPanel")}</Text>
                  <Feather name="chevron-right" size={16} color="#FFD700" strokeWidth={1.5} />
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => onSettingsItem("logout")} style={styles.drawerItem}>
                <View style={[styles.drawerItemIcon, { backgroundColor: "#FF3B5C22" }]}>
                  <Feather name="log-out" size={18} color="#FF3B5C" strokeWidth={1.5} />
                </View>
                <Text style={[styles.drawerItemText, { color: "#FF3B5C" }]}>{t("logout")}</Text>
                <Feather name="chevron-right" size={16} color="#FF3B5C" strokeWidth={1.5} />
              </TouchableOpacity>
            </>
          )}

          {page === "activity" && (
            <>
              <Text style={styles.sectionLabel}>المنشورات المُعجَب بها ({likedPosts.length})</Text>
              {likedPosts.length === 0 ? (
                <Text style={styles.emptyActivity}>لم تعجب بأي منشور بعد</Text>
              ) : likedPosts.slice(0, 5).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => { onClose(); router.push(`/post/${p.id}` as any); }}
                  style={styles.activityItem}
                >
                  <Feather name="heart" size={16} color="#FF3B5C" strokeWidth={0} />
                  <Text style={styles.activityItemText} numberOfLines={1}>
                    {p.content || (p.mediaType === "image" ? "📷 صورة" : "منشور")}
                  </Text>
                  <Feather name="chevron-right" size={13} color={TEXT2} strokeWidth={1.5} />
                </TouchableOpacity>
              ))}
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>تعليقاتي ({myPostComments.length})</Text>
              {myPostComments.length === 0 ? (
                <Text style={styles.emptyActivity}>لم تعلق على أي منشور بعد</Text>
              ) : myPostComments.slice(0, 5).map((c: any) => (
                <View key={c.id} style={styles.activityItem}>
                  <Feather name="message-circle" size={16} color="#3D91F4" strokeWidth={1.5} />
                  <Text style={styles.activityItemText} numberOfLines={1}>{c.content}</Text>
                </View>
              ))}
            </>
          )}

          {page === "requests" && (
            <>
              <Text style={styles.sectionLabel}>طلبات المتابعة ({followRequests.length})</Text>
              {followRequests.length === 0 ? (
                <View style={styles.emptyRequestsState}>
                  <Feather name="user-check" size={32} color={BORDER} strokeWidth={1} />
                  <Text style={styles.emptyActivity}>لا توجد طلبات معلقة</Text>
                </View>
              ) : followRequests.map((req: any) => {
                const sender = users.find((u) => u.id === req.senderId);
                if (!sender) return null;
                const color = ACCENT_COLORS[sender.name.length % ACCENT_COLORS.length];
                return (
                  <View key={req.id} style={styles.requestItem}>
                    <View style={[styles.requestAvatar, { backgroundColor: `${color}33` }]}>
                      {sender.avatar ? (
                        <Image source={{ uri: sender.avatar }} style={styles.requestAvatarImg} />
                      ) : (
                        <Text style={[styles.requestAvatarText, { color }]}>{sender.name[0]?.toUpperCase()}</Text>
                      )}
                    </View>
                    <Text style={styles.requestName} numberOfLines={1}>{sender.name}</Text>
                    <TouchableOpacity
                      onPress={() => { acceptFollowRequest(req.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={styles.requestAccept}
                    >
                      <Text style={styles.requestAcceptText}>قبول</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { rejectFollowRequest(req.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={styles.requestReject}
                    >
                      <Feather name="x" size={16} color={TEXT2} strokeWidth={1.5} />
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

// ───── Grid Items ─────
function PostGridItem({ post }: { post: Post }) {
  return (
    <TouchableOpacity
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      style={styles.gridItem}
      activeOpacity={0.8}
    >
      {post.mediaUrl ? (
        <Image source={{ uri: post.mediaUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
      ) : (
        <View style={styles.gridTextPlaceholder}>
          <Text style={styles.gridTextContent} numberOfLines={3}>{post.content}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ReelGridItem({ reel }: { reel: Reel }) {
  return (
    <TouchableOpacity
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/reels" as any); }}
      style={styles.gridItem}
      activeOpacity={0.8}
    >
      {reel.thumbnailUrl ? (
        <Image source={{ uri: reel.thumbnailUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
      ) : (
        <View style={[styles.gridTextPlaceholder, { backgroundColor: "#1C1C1C" }]}>
          <Feather name="film" size={24} color={TEXT2} strokeWidth={1} />
        </View>
      )}
      <View style={styles.reelPlayBadge}>
        <Feather name="play" size={10} color="#fff" strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
}

// ───── Main Profile Screen ─────
export default function ProfileScreen() {
  const {
    currentUser,
    isSuperAdmin,
    updateUser,
    logout,
    getFollowers,
    getFollowing,
    getUserPosts,
    getUserReels,
    getFollowRequests,
    setAccountType,
    theme,
    language,
    t,
  } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 40 : insets.bottom;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [gridTab, setGridTab] = useState<GridTab>("posts");
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [editBio, setEditBio] = useState(currentUser?.bio || "");
  const [saving, setSaving] = useState(false);
  const [accountTypeModal, setAccountTypeModal] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  if (!currentUser) {
    router.replace("/(auth)/login");
    return null;
  }

  const myPosts = getUserPosts(currentUser.id);
  const myReels = getUserReels(currentUser.id);
  const followersCount = getFollowers(currentUser.id).length;
  const followingCount = getFollowing(currentUser.id).length;
  const pendingRequests = getFollowRequests().length;

  const accentColor = ACCENT_COLORS[currentUser.name.length % ACCENT_COLORS.length];

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showToast("يجب السماح بالوصول للصور", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) {
      await updateUser({ avatar: result.assets[0].uri });
      showToast("تم تحديث الصورة", "success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { showToast(t("fillAll"), "error"); return; }
    setSaving(true);
    await updateUser({ name: editName.trim(), bio: editBio.trim() });
    setSaving(false);
    setEditModal(false);
    showToast(t("saved"), "success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSetAccountType = async (type: AccountType) => {
    await setAccountType(type);
    setAccountTypeModal(false);
    showToast(type === "public" ? "الحساب عام الآن" : "الحساب خاص الآن", "success");
  };

  const handleLogout = () => {
    logout();
    setLogoutModal(false);
    router.dismissAll();
    router.replace("/(auth)/login");
  };

  const handleDrawerItem = (item: string) => {
    setDrawerVisible(false);
    setTimeout(() => {
      if (item === "accountType") setAccountTypeModal(true);
      else if (item === "logout") setLogoutModal(true);
    }, 350);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={(gridTab === "posts" ? myPosts : myReels) as (Post | Reel)[]}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 100 }}
        columnWrapperStyle={{ gap: 1.5 }}
        ItemSeparatorComponent={() => <View style={{ height: 1.5 }} />}
        ListHeaderComponent={
          <View>
            {/* ── Header ── */}
            <View style={[styles.profileHeader, { paddingTop: topPad + 8 }]}>
              {/* Top bar */}
              <View style={styles.topBar}>
                {isSuperAdmin && (
                  <View style={styles.crownBadge}>
                    <Text style={styles.crownText}>👑 ملك</Text>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                {pendingRequests > 0 && (
                  <TouchableOpacity
                    onPress={() => setDrawerVisible(true)}
                    style={styles.pendingBadge}
                  >
                    <Text style={styles.pendingBadgeText}>{pendingRequests}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDrawerVisible(true); }}
                  style={styles.menuBtn}
                >
                  <Feather name="menu" size={22} color={TEXT} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>

              {/* Avatar */}
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85} style={styles.avatarWrap}>
                {isSuperAdmin ? (
                  <LinearGradient colors={["#FFD700", "#FFA500", "#FF8C00"]} style={styles.avatar}>
                    {currentUser.avatar ? (
                      <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarInitial}>{currentUser.name[0]?.toUpperCase()}</Text>
                    )}
                  </LinearGradient>
                ) : (
                  <LinearGradient
                    colors={STORY_GRADIENT_COLORS}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.avatarRing}
                  >
                    <View style={styles.avatarInner}>
                      {currentUser.avatar ? (
                        <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
                      ) : (
                        <View style={[{ flex: 1, borderRadius: 44, alignItems: "center", justifyContent: "center", backgroundColor: `${accentColor}33` }]}>
                          <Text style={[styles.avatarInitial, { color: accentColor }]}>{currentUser.name[0]?.toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                )}
                <View style={styles.editOverlay}>
                  <Feather name="camera" size={14} color="#fff" strokeWidth={1.5} />
                </View>
              </TouchableOpacity>

              {/* Name + Bio */}
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{currentUser.name}</Text>
                {currentUser.accountType === "private" && (
                  <View style={styles.privateBadge}>
                    <Feather name="lock" size={12} color={TEXT2} strokeWidth={1.5} />
                  </View>
                )}
              </View>
              {currentUser.bio ? (
                <Text style={styles.bioText}>{currentUser.bio}</Text>
              ) : null}

              {/* Edit Button */}
              <TouchableOpacity
                onPress={() => {
                  setEditName(currentUser.name);
                  setEditBio(currentUser.bio || "");
                  setEditModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={styles.editProfileBtn}
              >
                <Feather name="edit-2" size={14} color={TEXT} strokeWidth={1.5} />
                <Text style={styles.editProfileBtnText}>{t("editProfile")}</Text>
              </TouchableOpacity>

              {/* Stats */}
              <View style={styles.statsRow}>
                {[
                  { label: t("posts"), value: myPosts.length },
                  { label: t("followers"), value: followersCount },
                  { label: t("followingCount"), value: followingCount },
                ].map((stat, i) => (
                  <View key={i} style={styles.statItem}>
                    <Text style={styles.statNum}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Grid Tabs ── */}
            <View style={styles.gridTabs}>
              {[
                { key: "posts", icon: "grid" },
                { key: "reels", icon: "film" },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => {
                    setGridTab(tab.key as GridTab);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[styles.gridTab, gridTab === tab.key && styles.gridTabActive]}
                >
                  <Feather
                    name={tab.icon as any}
                    size={22}
                    color={gridTab === tab.key ? TEXT : TEXT2}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {(gridTab === "posts" ? myPosts : myReels).length === 0 && (
              <View style={styles.emptyGrid}>
                <Feather
                  name={gridTab === "posts" ? "image" : "film"}
                  size={48}
                  color={BORDER}
                  strokeWidth={1}
                />
                <Text style={styles.emptyGridText}>
                  {gridTab === "posts" ? t("noPosts") : t("noReels")}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push(gridTab === "posts" ? "/create-post" : "/(tabs)/reels")}
                  style={styles.emptyGridBtn}
                >
                  <Text style={styles.emptyGridBtnText}>
                    {gridTab === "posts" ? t("createPost") : t("publishReel")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) =>
          gridTab === "posts" ? (
            <PostGridItem post={item as Post} />
          ) : (
            <ReelGridItem reel={item as Reel} />
          )
        }
      />

      {/* Drawer */}
      <ProfileDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        theme={theme}
        language={language}
        isSuperAdmin={isSuperAdmin}
        onSettingsItem={handleDrawerItem}
      />

      {/* Edit Profile Modal */}
      <Modal visible={editModal} transparent animationType="fade" onRequestClose={() => setEditModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t("editProfile")}</Text>
            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalInputField}
                value={editName}
                onChangeText={setEditName}
                placeholder="الاسم"
                placeholderTextColor={TEXT2}
                textAlign="right"
              />
            </View>
            <View style={[styles.modalInput, { height: 90 }]}>
              <TextInput
                style={styles.modalInputField}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="اكتب نبذة عنك..."
                placeholderTextColor={TEXT2}
                textAlign="right"
                multiline
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setEditModal(false)} style={styles.cancelBtn}>
                <Text style={{ color: TEXT2, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveProfile} disabled={saving} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{saving ? "..." : t("save")}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Account Type Modal */}
      <Modal visible={accountTypeModal} transparent animationType="fade" onRequestClose={() => setAccountTypeModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAccountTypeModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t("accountType")}</Text>
            {[
              { type: "public" as AccountType, icon: "globe", label: t("publicAccount"), desc: "يمكن للجميع رؤية منشوراتك", color: "#3D91F4" },
              { type: "private" as AccountType, icon: "lock", label: t("privateAccount"), desc: "فقط متابعوك يرون منشوراتك", color: "#9B59B6" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.type}
                onPress={() => handleSetAccountType(opt.type)}
                style={[styles.accountTypeBtn, currentUser.accountType === opt.type && { borderColor: opt.color, backgroundColor: `${opt.color}10` }]}
              >
                <Feather name={opt.icon as any} size={22} color={currentUser.accountType === opt.type ? opt.color : TEXT2} strokeWidth={1.5} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accountTypeBtnTitle, currentUser.accountType === opt.type && { color: opt.color }]}>{opt.label}</Text>
                  <Text style={styles.accountTypeBtnDesc}>{opt.desc}</Text>
                </View>
                {currentUser.accountType === opt.type && (
                  <Feather name="check-circle" size={20} color={opt.color} strokeWidth={1.5} />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Logout Modal */}
      <Modal visible={logoutModal} transparent animationType="fade" onRequestClose={() => setLogoutModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setLogoutModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.logoutIcon}>
              <Feather name="log-out" size={28} color="#FF3B5C" strokeWidth={1.5} />
            </View>
            <Text style={styles.modalTitle}>تسجيل الخروج</Text>
            <Text style={styles.logoutDesc}>هل أنت متأكد من تسجيل الخروج؟</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setLogoutModal(false)} style={styles.cancelBtn}>
                <Text style={{ color: TEXT2, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={[styles.saveBtn, { backgroundColor: "#FF3B5C" }]}>
                <Text style={styles.saveBtnText}>خروج</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  profileHeader: { paddingHorizontal: 20, paddingBottom: 24, gap: 12, alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: BORDER },
  topBar: { flexDirection: "row", alignItems: "center", width: "100%", gap: 10 },
  crownBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: "#FFD70022", borderWidth: 0.5, borderColor: "#FFD70044" },
  crownText: { color: "#FFD700", fontFamily: "Inter_700Bold", fontSize: 13 },
  pendingBadge: { width: 26, height: 26, borderRadius: 8, backgroundColor: "#FF3B5C", alignItems: "center", justifyContent: "center" },
  pendingBadgeText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12 },
  menuBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: CARD, borderWidth: 0.5, borderColor: BORDER },

  avatarWrap: { position: "relative" },
  avatarRing: { width: 100, height: 100, borderRadius: 50, padding: 3, alignItems: "center", justifyContent: "center" },
  avatarInner: { width: "100%", height: "100%", borderRadius: 44, overflow: "hidden", backgroundColor: BG, padding: 2 },
  avatar: { width: 96, height: 96, borderRadius: 28, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarInitial: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff" },
  editOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3D91F4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: BG,
  },

  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileName: { fontSize: 22, fontFamily: "Inter_700Bold", color: TEXT },
  privateBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: CARD, alignItems: "center", justifyContent: "center", borderWidth: 0.5, borderColor: BORDER },
  bioText: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT2, textAlign: "center" },

  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: BORDER,
    backgroundColor: CARD,
  },
  editProfileBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: TEXT },

  statsRow: { flexDirection: "row", gap: 32 },
  statItem: { alignItems: "center", gap: 2 },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold", color: TEXT },
  statLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: TEXT2 },

  gridTabs: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: BORDER },
  gridTab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  gridTabActive: { borderBottomWidth: 1.5, borderBottomColor: TEXT },

  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gridTextPlaceholder: { flex: 1, width: "100%", backgroundColor: CARD, padding: 8, justifyContent: "center" },
  gridTextContent: { color: TEXT2, fontSize: 11, fontFamily: "Inter_400Regular" },
  reelPlayBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyGrid: { alignItems: "center", paddingVertical: 60, gap: 16 },
  emptyGridText: { fontSize: 16, fontFamily: "Inter_500Medium", color: TEXT2 },
  emptyGridBtn: { backgroundColor: TEXT, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 100, marginTop: 4 },
  emptyGridBtnText: { color: BG, fontFamily: "Inter_600SemiBold", fontSize: 14 },

  // Drawer
  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CARD,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 0.5,
    borderColor: BORDER,
    padding: 24,
    paddingTop: 16,
    maxHeight: "85%",
  },
  drawerHandle: { width: 36, height: 3, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 20 },
  drawerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: TEXT, marginBottom: 16, textAlign: "center" },
  drawerTabs: { flexDirection: "row", gap: 8, marginBottom: 20, backgroundColor: "#1C1C1C", padding: 4, borderRadius: 14 },
  drawerTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  drawerTabActive: { backgroundColor: CARD },
  drawerTabText: { fontSize: 12, fontFamily: "Inter_500Medium", color: TEXT2 },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#1C1C1C",
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  drawerItemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  drawerItemText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: TEXT },
  langBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "#1C1C1C" },
  langBtnActive: { backgroundColor: TEXT },
  langBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: TEXT2 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: TEXT2, marginBottom: 4 },
  activityItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: "#1C1C1C", borderRadius: 12, borderWidth: 0.5, borderColor: BORDER },
  activityItemText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT },
  emptyActivity: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT2, textAlign: "center", paddingVertical: 16 },
  emptyRequestsState: { alignItems: "center", paddingVertical: 28, gap: 12 },
  requestItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  requestAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  requestAvatarImg: { width: "100%", height: "100%", borderRadius: 20 },
  requestAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  requestName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: TEXT },
  requestAccept: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: "#3D91F4" },
  requestAcceptText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  requestReject: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#1C1C1C", alignItems: "center", justifyContent: "center" },

  // Modals
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalCard: { width: "100%", backgroundColor: CARD, borderRadius: 24, borderWidth: 0.5, borderColor: BORDER, padding: 24, gap: 14 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: TEXT, textAlign: "center" },
  modalInput: { backgroundColor: "#1C1C1C", borderRadius: 14, borderWidth: 0.5, borderColor: BORDER, paddingHorizontal: 14, justifyContent: "center" },
  modalInputField: { fontSize: 15, color: TEXT, fontFamily: "Inter_400Regular", paddingVertical: 14 },
  modalBtns: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 100, borderWidth: 0.5, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
  saveBtn: { flex: 1, height: 50, borderRadius: 100, backgroundColor: TEXT, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: BG, fontFamily: "Inter_600SemiBold", fontSize: 15 },
  accountTypeBtn: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 16, borderWidth: 0.5, borderColor: BORDER, backgroundColor: "#1C1C1C" },
  accountTypeBtnTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: TEXT },
  accountTypeBtnDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: TEXT2, marginTop: 2 },
  logoutIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#FF3B5C18", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  logoutDesc: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT2, textAlign: "center" },
});
