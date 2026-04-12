import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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

import Colors, { ACCENT_COLORS, STORY_GRADIENT_COLORS } from "@/constants/colors";
import { useApp, isUserVerified } from "@/context/AppContext";
import type { AccountType, Post, Reel } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { VerifiedBadge, VerifiedAvatarFrame } from "@/components/VerifiedBadge";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 3) / 3;
const COVER_HEIGHT = 170;

type GridTab = "posts" | "reels";
type DrawerPage = "settings" | "activity" | "requests" | "saved";

// ───── Followers / Following Modal ─────
function FollowListModal({
  visible,
  title,
  userIds,
  allUsers,
  onClose,
  colors,
}: {
  visible: boolean;
  title: string;
  userIds: string[];
  allUsers: any[];
  onClose: () => void;
  colors: any;
}) {
  const [query, setQuery] = useState("");

  const filteredUsers = allUsers
    .filter((u) => userIds.includes(u.id))
    .filter((u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(query.toLowerCase()))
    );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.followBg} onPress={onClose} />
      <View style={[styles.followSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.followHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.followTitle, { color: colors.text }]}>{title}</Text>

        <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.textSecondary} strokeWidth={1.5} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="ابحث..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            textAlign="right"
          />
        </View>

        <FlatList
          data={filteredUsers}
          keyExtractor={(u) => u.id}
          style={{ maxHeight: 400 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.followEmpty}>
              <Feather name="users" size={36} color={colors.border} strokeWidth={1} />
              <Text style={[styles.followEmptyText, { color: colors.textSecondary }]}>لا توجد نتائج</Text>
            </View>
          }
          renderItem={({ item }) => {
            const color = ACCENT_COLORS[(item.name?.length ?? 0) % ACCENT_COLORS.length];
            return (
              <TouchableOpacity
                style={[styles.followUserItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  onClose();
                  setTimeout(() => router.push(`/profile/${item.id}` as any), 300);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.followAvatar, { backgroundColor: `${color}33` }]}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.followAvatarImg} />
                  ) : (
                    <Text style={[styles.followAvatarText, { color }]}>{item.name[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.followUserName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.followUserPhone, { color: colors.textSecondary }]}>@{item.username || item.email}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

// ───── Profile Drawer ─────
function ProfileDrawer({
  visible,
  onClose,
  theme,
  language,
  isSuperAdmin,
  onSettingsItem,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  theme: string;
  language: string;
  isSuperAdmin: boolean;
  onSettingsItem: (item: string) => void;
  colors: any;
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
    getSavedPosts,
  } = useApp();
  const verified = isUserVerified(currentUser);
  const isExpired = currentUser?.verifiedUntil && !verified;
  const MANAGER_WHATSAPP = "07719820537";
  const [page, setPage] = useState<DrawerPage>("settings");
  const followRequests = getFollowRequests();
  const likedReels = getLikedReels();
  const myPostComments = getMyPostComments();
  const likedPosts = getLikedPosts();
  const savedPostsList = getSavedPosts();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.drawerOverlay} onPress={onClose} />
      <View style={[styles.drawer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.drawerHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.drawerTitle, { color: colors.text }]}>الإعدادات</Text>

        <View style={[styles.drawerTabs, { borderBottomColor: colors.border }]}>
          {[
            { key: "settings", label: "الإعدادات", icon: "settings" },
            { key: "activity", label: "نشاطي", icon: "activity" },
            { key: "requests", label: "الطلبات", icon: "users" },
            { key: "saved", label: "محفوظ", icon: "bookmark" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setPage(tab.key as DrawerPage)}
              style={[styles.drawerTab, page === tab.key && [styles.drawerTabActive, { borderBottomColor: colors.text }]]}
            >
              <Feather name={tab.icon as any} size={17} color={page === tab.key ? colors.text : colors.textSecondary} strokeWidth={1.5} />
              <Text style={[styles.drawerTabText, { color: page === tab.key ? colors.text : colors.textSecondary }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 48 }}>
          {page === "settings" && (
            <>
              <TouchableOpacity onPress={() => onSettingsItem("accountType")} style={[styles.drawerItem, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                <View style={[styles.drawerItemIcon, { backgroundColor: "#9B59B622" }]}>
                  <Feather name="lock" size={18} color="#9B59B6" strokeWidth={1.5} />
                </View>
                <Text style={[styles.drawerItemText, { color: colors.text }]}>{t("accountType")}</Text>
                <Feather name="chevron-right" size={16} color={colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>

              <View style={[styles.drawerItem, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                <View style={[styles.drawerItemIcon, { backgroundColor: "#3D91F422" }]}>
                  <Feather name={theme === "dark" ? "moon" : "sun"} size={18} color="#3D91F4" strokeWidth={1.5} />
                </View>
                <Text style={[styles.drawerItemText, { color: colors.text }]}>{theme === "dark" ? t("darkMode") : t("lightMode")}</Text>
                <Switch
                  value={theme === "dark"}
                  onValueChange={toggleTheme}
                  trackColor={{ false: "#333", true: "#3D91F4" }}
                  thumbColor="#fff"
                />
              </View>

              <View style={[styles.drawerItem, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                <View style={[styles.drawerItemIcon, { backgroundColor: "#34D39922" }]}>
                  <Feather name="globe" size={18} color="#34D399" strokeWidth={1.5} />
                </View>
                <Text style={[styles.drawerItemText, { color: colors.text }]}>{t("language")}</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {(["ar", "en"] as const).map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      onPress={() => setLanguage(lang)}
                      style={[styles.langBtn, language === lang && { backgroundColor: colors.text }]}
                    >
                      <Text style={[styles.langBtnText, language === lang && { color: colors.background }]}>
                        {lang === "ar" ? "ع" : "EN"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {isSuperAdmin && (
                <TouchableOpacity
                  onPress={() => { onClose(); router.push("/admin"); }}
                  style={[styles.drawerItem, { borderColor: "#FFD70044", backgroundColor: "#FFD70011" }]}
                >
                  <View style={[styles.drawerItemIcon, { backgroundColor: "#FFD70022" }]}>
                    <Feather name="shield" size={18} color="#FFD700" strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.drawerItemText, { color: "#FFD700" }]}>{t("adminPanel")}</Text>
                  <Feather name="chevron-right" size={16} color="#FFD700" strokeWidth={1.5} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => { onClose(); setTimeout(() => router.push("/change-password"), 350); }}
                style={[styles.drawerItem, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
              >
                <View style={[styles.drawerItemIcon, { backgroundColor: "#F59E0B22" }]}>
                  <Feather name="key" size={18} color="#F59E0B" strokeWidth={1.5} />
                </View>
                <Text style={[styles.drawerItemText, { color: colors.text }]}>{t("changePassword")}</Text>
                <Feather name="chevron-right" size={16} color={colors.textSecondary} strokeWidth={1.5} />
              </TouchableOpacity>

              {isExpired ? (
                <View style={[styles.drawerItem, { borderColor: "#FF3B5C44", backgroundColor: "#FF3B5C11", flexDirection: "column", alignItems: "flex-end", gap: 10 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, width: "100%" }}>
                    <View style={[styles.drawerItemIcon, { backgroundColor: "#FF3B5C22" }]}>
                      <Feather name="shield-off" size={18} color="#FF3B5C" strokeWidth={1.5} />
                    </View>
                    <Text style={[styles.drawerItemText, { color: "#FF3B5C", flex: 1 }]}>انتهت فترة التوثيق</Text>
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right", width: "100%" }}>
                    انتهت فترة التوثيق، هل تريد التجديد؟
                  </Text>
                  <TouchableOpacity
                    style={{ backgroundColor: "#3D91F4", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, alignSelf: "flex-end" }}
                    onPress={() => { import("react-native").then(({ Linking }) => Linking.openURL(`https://wa.me/${MANAGER_WHATSAPP}?text=${encodeURIComponent("مرحبا، أريد تجديد التوثيق")}`)); }}
                  >
                    <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>التواصل مع الدعم</Text>
                  </TouchableOpacity>
                </View>
              ) : !verified ? (
                <TouchableOpacity
                  style={[styles.drawerItem, { borderColor: "#3D91F422", backgroundColor: "#3D91F411" }]}
                  onPress={() => { import("react-native").then(({ Linking }) => Linking.openURL(`https://wa.me/${MANAGER_WHATSAPP}?text=${encodeURIComponent("مرحبا، أريد توثيق حسابي")}`)); }}
                >
                  <View style={[styles.drawerItemIcon, { backgroundColor: "#3D91F422" }]}>
                    <Feather name="check-circle" size={18} color="#3D91F4" strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.drawerItemText, { color: "#3D91F4" }]}>توثيق الحساب</Text>
                  <Feather name="chevron-right" size={16} color="#3D91F4" strokeWidth={1.5} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.drawerItem, { borderColor: "#3D91F422", backgroundColor: "#3D91F411" }]}>
                  <View style={[styles.drawerItemIcon, { backgroundColor: "#3D91F422" }]}>
                    <Feather name="check-circle" size={18} color="#3D91F4" strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.drawerItemText, { color: "#3D91F4" }]}>حساب موثق ✓</Text>
                </View>
              )}

              <TouchableOpacity onPress={() => onSettingsItem("logout")} style={[styles.drawerItem, { borderColor: "#FF3B5C22", backgroundColor: colors.backgroundSecondary }]}>
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
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>المنشورات المُعجَب بها ({likedPosts.length})</Text>
              {likedPosts.length === 0 ? (
                <Text style={[styles.emptyActivity, { color: colors.textSecondary }]}>لم تعجب بأي منشور بعد</Text>
              ) : likedPosts.slice(0, 5).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => { onClose(); router.push(`/post/${p.id}` as any); }}
                  style={[styles.activityItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                >
                  <Feather name="heart" size={16} color="#FF3B5C" strokeWidth={0} />
                  <Text style={[styles.activityItemText, { color: colors.text }]} numberOfLines={1}>
                    {p.content || (p.mediaType === "image" ? "📷 صورة" : "منشور")}
                  </Text>
                  <Feather name="chevron-right" size={13} color={colors.textSecondary} strokeWidth={1.5} />
                </TouchableOpacity>
              ))}
              <Text style={[styles.sectionLabel, { marginTop: 16, color: colors.textSecondary }]}>تعليقاتي ({myPostComments.length})</Text>
              {myPostComments.length === 0 ? (
                <Text style={[styles.emptyActivity, { color: colors.textSecondary }]}>لم تعلق على أي منشور بعد</Text>
              ) : myPostComments.slice(0, 5).map((c: any) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => { onClose(); router.push(`/post/${c.postId}` as any); }}
                  style={[styles.activityItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                >
                  <Feather name="message-circle" size={16} color="#3D91F4" strokeWidth={1.5} />
                  <Text style={[styles.activityItemText, { color: colors.text }]} numberOfLines={1}>{c.content}</Text>
                  <Feather name="chevron-right" size={13} color={colors.textSecondary} strokeWidth={1.5} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {page === "requests" && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>طلبات المتابعة ({followRequests.length})</Text>
              {followRequests.length === 0 ? (
                <View style={styles.emptyRequestsState}>
                  <Feather name="user-check" size={32} color={colors.border} strokeWidth={1} />
                  <Text style={[styles.emptyActivity, { color: colors.textSecondary }]}>لا توجد طلبات معلقة</Text>
                </View>
              ) : followRequests.map((req: any) => {
                const sender = users.find((u) => u.id === req.senderId);
                if (!sender) return null;
                const color = ACCENT_COLORS[sender.name.length % ACCENT_COLORS.length];
                return (
                  <View key={req.id} style={[styles.requestItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    <View style={[styles.requestAvatar, { backgroundColor: `${color}33` }]}>
                      {sender.avatar ? (
                        <Image source={{ uri: sender.avatar }} style={styles.requestAvatarImg} />
                      ) : (
                        <Text style={[styles.requestAvatarText, { color }]}>{sender.name[0]?.toUpperCase()}</Text>
                      )}
                    </View>
                    <Text style={[styles.requestName, { color: colors.text }]} numberOfLines={1}>{sender.name}</Text>
                    <TouchableOpacity
                      onPress={() => { acceptFollowRequest(req.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={styles.requestAccept}
                    >
                      <Text style={styles.requestAcceptText}>قبول</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { rejectFollowRequest(req.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={[styles.requestReject, { borderColor: colors.border }]}
                    >
                      <Feather name="x" size={16} color={colors.textSecondary} strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </>
          )}

          {page === "saved" && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>المنشورات المحفوظة ({savedPostsList.length})</Text>
              {savedPostsList.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 32, gap: 8 }}>
                  <Feather name="bookmark" size={36} color={colors.border} strokeWidth={1} />
                  <Text style={[styles.emptyActivity, { color: colors.textSecondary }]}>لم تحفظ أي منشور بعد</Text>
                </View>
              ) : savedPostsList.map((p: any) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => { onClose(); router.push(`/post/${p.id}` as any); }}
                  style={[styles.activityItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                >
                  <Feather name="bookmark" size={16} color={colors.tint} strokeWidth={0} />
                  <Text style={[styles.activityItemText, { color: colors.text }]} numberOfLines={1}>
                    {p.content || (p.mediaType === "image" ? "📷 صورة" : p.mediaType === "video" ? "🎬 فيديو" : "منشور")}
                  </Text>
                  <Feather name="chevron-right" size={13} color={colors.textSecondary} strokeWidth={1.5} />
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ───── Grid Items (Clickable) ─────
function PostGridItem({ post, colors }: { post: Post; colors: any }) {
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/user-posts/${post.creatorId}?startId=${post.id}` as any);
      }}
      style={[styles.gridItem, { backgroundColor: colors.card }]}
      activeOpacity={0.8}
    >
      {post.mediaUrl ? (
        <Image source={{ uri: post.mediaUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
      ) : (
        <View style={[styles.gridTextPlaceholder, { backgroundColor: colors.card }]}>
          <Text style={[styles.gridTextContent, { color: colors.textSecondary }]} numberOfLines={3}>{post.content}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ReelGridItem({ reel, colors }: { reel: Reel; colors: any }) {
  const [thumbError, setThumbError] = useState(false);
  const thumbUrl = (reel as any).thumbnailUrl || reel.videoUrl;
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/(tabs)/reels" as any);
      }}
      style={[styles.gridItem, { backgroundColor: colors.card }]}
      activeOpacity={0.8}
    >
      {thumbUrl && !thumbError ? (
        <Image
          source={{ uri: thumbUrl }}
          style={StyleSheet.absoluteFill as any}
          resizeMode="cover"
          onError={() => setThumbError(true)}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill as any, { backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center" }]}>
          <Feather name="film" size={26} color="#7C3AED" strokeWidth={1} />
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
    updateProfile,
    updateCoverPhoto,
    logout,
    getFollowers,
    getFollowing,
    getUserPosts,
    getUserReels,
    getFollowRequests,
    theme,
    language,
    t,
    users,
  } = useApp();
  const colors = Colors[theme];
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 40 : insets.bottom;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [gridTab, setGridTab] = useState<GridTab>("posts");
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [editBio, setEditBio] = useState(currentUser?.bio || "");
  const [editUsername, setEditUsername] = useState(currentUser?.username || "");
  const [saving, setSaving] = useState(false);
  const [accountTypeModal, setAccountTypeModal] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [followersModal, setFollowersModal] = useState(false);
  const [followingModal, setFollowingModal] = useState(false);

  const handlePickCover = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showToast("يجب السماح بالوصول للصور", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      await updateCoverPhoto(result.assets[0].uri);
      showToast("تم تحديث صورة الغلاف", "success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      router.replace("/(auth)/login");
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const myPosts = getUserPosts(currentUser.id);
  const myReels = getUserReels(currentUser.id);
  const followers = getFollowers(currentUser.id);
  const following = getFollowing(currentUser.id);
  const followersCount = followers.length;
  const followingCount = following.length;
  const pendingRequests = getFollowRequests().length;

  const followerIds = followers.map((f) => f.followerId);
  const followingIds = following.map((f) => f.followingId);

  const accentColor = ACCENT_COLORS[currentUser.name.length % ACCENT_COLORS.length];

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showToast("يجب السماح بالوصول للصور", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfile(currentUser!.name, currentUser!.bio, result.assets[0].uri);
      showToast("تم تحديث الصورة", "success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { showToast(t("fillAll"), "error"); return; }
    if (editUsername.trim() && editUsername.trim().length < 1) {
      showToast("اسم المستخدم يجب أن يكون حرفاً واحداً على الأقل", "error");
      return;
    }
    setSaving(true);
    const result = await updateProfile(
      editName.trim(),
      editBio.trim(),
      undefined,
      undefined,
      editUsername.trim() || undefined
    );
    setSaving(false);
    if (!result.success && result.error === "username_taken") {
      showToast("اسم المستخدم غير متاح", "error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setEditModal(false);
    showToast(t("saved"), "success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSetAccountType = async (type: AccountType) => {
    await updateProfile(currentUser!.name, currentUser!.bio, undefined, type);
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            {/* ── Cover Photo ── */}
            <View style={[styles.coverContainer, { height: COVER_HEIGHT + topPad }]}>
              {currentUser.coverUrl ? (
                <Image
                  source={{ uri: currentUser.coverUrl }}
                  style={StyleSheet.absoluteFill as any}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={isSuperAdmin ? ["#8B6914", "#FFD700", "#B8860B"] : ["#1a1a2e", "#16213e", "#0f3460"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill as any}
                />
              )}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.55)"]}
                style={StyleSheet.absoluteFill as any}
              />

              {/* Top bar inside cover */}
              <View style={[styles.topBar, { paddingTop: topPad + 8, paddingHorizontal: 16, position: "absolute", top: 0, left: 0, right: 0 }]}>
                {isSuperAdmin && (
                  <View style={[styles.crownBadge]}>
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
                  style={styles.menuBtnOnCover}
                >
                  <Feather name="menu" size={22} color="#fff" strokeWidth={1.5} />
                </TouchableOpacity>
              </View>

              {/* Change cover button */}
              <TouchableOpacity
                onPress={handlePickCover}
                style={styles.coverCamBtn}
                activeOpacity={0.8}
              >
                <Feather name="camera" size={15} color="#fff" strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            {/* ── Avatar row overlapping cover ── */}
            <View style={[styles.avatarRow, { backgroundColor: colors.background }]}>
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85} style={styles.avatarWrap}>
                {isSuperAdmin ? (
                  <LinearGradient colors={["#FFD700", "#FFA500", "#FF8C00"]} style={styles.avatar}>
                    {currentUser.avatar ? (
                      <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarInitial}>{currentUser.name[0]?.toUpperCase()}</Text>
                    )}
                  </LinearGradient>
                ) : isUserVerified(currentUser) ? (
                  <VerifiedAvatarFrame size={90}>
                    {currentUser.avatar ? (
                      <Image source={{ uri: currentUser.avatar }} style={{ width: 90, height: 90, borderRadius: 45 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", backgroundColor: `${accentColor}33` }}>
                        <Text style={[styles.avatarInitial, { color: accentColor }]}>{currentUser.name[0]?.toUpperCase()}</Text>
                      </View>
                    )}
                  </VerifiedAvatarFrame>
                ) : (
                  <LinearGradient
                    colors={STORY_GRADIENT_COLORS}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.avatarRing}
                  >
                    <View style={[styles.avatarInner, { backgroundColor: colors.background }]}>
                      {currentUser.avatar ? (
                        <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
                      ) : (
                        <View style={{ flex: 1, borderRadius: 44, alignItems: "center", justifyContent: "center", backgroundColor: `${accentColor}33` }}>
                          <Text style={[styles.avatarInitial, { color: accentColor }]}>{currentUser.name[0]?.toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                )}
                <View style={styles.editOverlay}>
                  <Feather name="camera" size={13} color="#fff" strokeWidth={1.5} />
                </View>
              </TouchableOpacity>

              <View style={{ flex: 1 }} />

              {/* Edit Profile Button (right side of avatar row) */}
              <TouchableOpacity
                onPress={() => {
                  setEditName(currentUser.name);
                  setEditBio(currentUser.bio || "");
                  setEditUsername(currentUser.username || "");
                  setEditModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.editProfileBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Feather name="edit-2" size={14} color={colors.text} strokeWidth={1.5} />
                <Text style={[styles.editProfileBtnText, { color: colors.text }]}>{t("editProfile")}</Text>
              </TouchableOpacity>
            </View>

            {/* ── Profile Info ── */}
            <View style={[styles.profileInfo, { borderBottomColor: colors.border }]}>
              {/* Name + Bio */}
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: colors.text }]}>{currentUser.name}</Text>
                {isUserVerified(currentUser) && <VerifiedBadge size={16} style={{ marginTop: 1 }} />}
                {currentUser.accountType === "private" && (
                  <View style={[styles.privateBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name="lock" size={12} color={colors.textSecondary} strokeWidth={1.5} />
                  </View>
                )}
              </View>
              {currentUser.username ? (
                <Text style={[styles.usernameText, { color: colors.tint }]}>@{currentUser.username}</Text>
              ) : null}
              {currentUser.bio ? (
                <Text style={[styles.bioText, { color: colors.textSecondary }]}>{currentUser.bio}</Text>
              ) : null}

              {/* Stats — followers/following clickable */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: colors.text }]}>{myPosts.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("posts")}</Text>
                </View>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFollowersModal(true);
                  }}
                >
                  <Text style={[styles.statNum, { color: colors.text }]}>{followersCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("followers")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFollowingModal(true);
                  }}
                >
                  <Text style={[styles.statNum, { color: colors.text }]}>{followingCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("followingCount")}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Grid Tabs ── */}
            <View style={[styles.gridTabs, { borderBottomColor: colors.border }]}>
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
                  style={[styles.gridTab, gridTab === tab.key && [styles.gridTabActive, { borderBottomColor: colors.text }]]}
                >
                  <Feather
                    name={tab.icon as any}
                    size={22}
                    color={gridTab === tab.key ? colors.text : colors.textSecondary}
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
                  color={colors.border}
                  strokeWidth={1}
                />
                <Text style={[styles.emptyGridText, { color: colors.textSecondary }]}>
                  {gridTab === "posts" ? t("noPosts") : t("noReels")}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push(gridTab === "posts" ? "/create-post" : "/(tabs)/reels")}
                  style={[styles.emptyGridBtn, { backgroundColor: colors.tint }]}
                >
                  <Text style={[styles.emptyGridBtnText, { color: colors.background }]}>
                    {gridTab === "posts" ? t("createPost") : t("publishReel")}
                  </Text>
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

      <ProfileDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        theme={theme}
        language={language}
        isSuperAdmin={isSuperAdmin}
        onSettingsItem={handleDrawerItem}
        colors={colors}
      />

      {/* Followers Modal */}
      <FollowListModal
        visible={followersModal}
        title={`المتابعون (${followersCount})`}
        userIds={followerIds}
        allUsers={users}
        onClose={() => setFollowersModal(false)}
        colors={colors}
      />

      {/* Following Modal */}
      <FollowListModal
        visible={followingModal}
        title={`يتابعون (${followingCount})`}
        userIds={followingIds}
        allUsers={users}
        onClose={() => setFollowingModal(false)}
        colors={colors}
      />

      {/* Edit Profile Modal */}
      <Modal visible={editModal} transparent animationType="fade" onRequestClose={() => setEditModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditModal(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("editProfile")}</Text>

            {/* Name */}
            <View style={[styles.modalInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <TextInput
                style={[styles.modalInputField, { color: colors.text }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="الاسم"
                placeholderTextColor={colors.textSecondary}
                textAlign="right"
              />
            </View>

            {/* Username */}
            <View style={[styles.modalInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 8 }]}>
              <Text style={{ color: colors.tint, fontSize: 16, fontFamily: "Inter_600SemiBold" }}>@</Text>
              <TextInput
                style={[styles.modalInputField, { color: colors.text }]}
                value={editUsername}
                onChangeText={(v) => setEditUsername(v.replace(/\s/g, "").toLowerCase())}
                placeholder="اسم المستخدم"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="left"
              />
            </View>

            {/* Bio */}
            <View style={[styles.modalInput, { height: 90, backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <TextInput
                style={[styles.modalInputField, { color: colors.text }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="اكتب نبذة عنك..."
                placeholderTextColor={colors.textSecondary}
                textAlign="right"
                multiline
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                setEditModal(false);
                setTimeout(handlePickCover, 350);
              }}
              style={[styles.coverPhotoBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              activeOpacity={0.75}
            >
              <Feather name="camera" size={17} color={colors.tint} strokeWidth={1.5} />
              <Text style={[styles.coverPhotoBtnText, { color: colors.tint }]}>تحديث صورة الغلاف</Text>
            </TouchableOpacity>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setEditModal(false)} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveProfile} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.tint }]}>
                <Text style={[styles.saveBtnText, { color: colors.background }]}>{saving ? "..." : t("save")}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Account Type Modal */}
      <Modal visible={accountTypeModal} transparent animationType="fade" onRequestClose={() => setAccountTypeModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAccountTypeModal(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("accountType")}</Text>
            {[
              { type: "public" as AccountType, icon: "globe", label: t("publicAccount"), desc: "يمكن للجميع رؤية منشوراتك", color: "#3D91F4" },
              { type: "private" as AccountType, icon: "lock", label: t("privateAccount"), desc: "فقط متابعوك يرون منشوراتك", color: "#9B59B6" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.type}
                onPress={() => handleSetAccountType(opt.type)}
                style={[
                  styles.accountTypeBtn,
                  { borderColor: currentUser.accountType === opt.type ? opt.color : colors.border },
                  currentUser.accountType === opt.type && { backgroundColor: `${opt.color}10` },
                ]}
              >
                <Feather name={opt.icon as any} size={22} color={currentUser.accountType === opt.type ? opt.color : colors.textSecondary} strokeWidth={1.5} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accountTypeBtnTitle, { color: currentUser.accountType === opt.type ? opt.color : colors.text }]}>{opt.label}</Text>
                  <Text style={[styles.accountTypeBtnDesc, { color: colors.textSecondary }]}>{opt.desc}</Text>
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
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <View style={styles.logoutIcon}>
              <Feather name="log-out" size={28} color="#FF3B5C" strokeWidth={1.5} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>تسجيل الخروج</Text>
            <Text style={[styles.logoutDesc, { color: colors.textSecondary }]}>هل أنت متأكد من تسجيل الخروج؟</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setLogoutModal(false)} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={[styles.saveBtn, { backgroundColor: "#FF3B5C" }]}>
                <Text style={[styles.saveBtnText, { color: "#fff" }]}>خروج</Text>
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

  coverContainer: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  coverCamBtn: {
    position: "absolute",
    bottom: 12,
    left: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  avatarRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: -50,
  },

  profileInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 6,
    borderBottomWidth: 0.5,
  },

  topBar: { flexDirection: "row", alignItems: "center", width: "100%", gap: 10 },
  crownBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: "#FFD70022", borderWidth: 0.5, borderColor: "#FFD70044" },
  crownText: { color: "#FFD700", fontFamily: "Inter_700Bold", fontSize: 13 },
  pendingBadge: { width: 26, height: 26, borderRadius: 8, backgroundColor: "#FF3B5C", alignItems: "center", justifyContent: "center" },
  pendingBadgeText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12 },
  menuBtnOnCover: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)",
  },

  avatarWrap: { position: "relative", marginTop: -16 },
  avatarRing: { width: 96, height: 96, borderRadius: 48, padding: 3, alignItems: "center", justifyContent: "center" },
  avatarInner: { width: "100%", height: "100%", borderRadius: 44, overflow: "hidden", padding: 2 },
  avatar: { width: 92, height: 92, borderRadius: 28, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarInitial: { fontSize: 34, fontFamily: "Inter_700Bold", color: "#fff" },
  editOverlay: {
    position: "absolute", bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "#3D91F4",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },

  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileName: { fontSize: 21, fontFamily: "Inter_700Bold" },
  usernameText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  privateBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 0.5 },
  bioText: { fontSize: 14, fontFamily: "Inter_400Regular" },

  editProfileBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 0.5,
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  editProfileBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  statsRow: { flexDirection: "row", gap: 32, marginTop: 8 },
  statItem: { alignItems: "center", gap: 2 },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },

  gridTabs: { flexDirection: "row", borderBottomWidth: 0.5 },
  gridTab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  gridTabActive: { borderBottomWidth: 1.5 },

  gridItem: {
    width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  gridTextPlaceholder: { flex: 1, width: "100%", padding: 8, justifyContent: "center" },
  gridTextContent: { fontSize: 11, fontFamily: "Inter_400Regular" },
  reelPlayBadge: {
    position: "absolute", top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center", justifyContent: "center",
  },

  emptyGrid: { alignItems: "center", paddingVertical: 60, gap: 16 },
  emptyGridText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  emptyGridBtn: { paddingHorizontal: 24, paddingVertical: 11, borderRadius: 100, marginTop: 4 },
  emptyGridBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },

  // Drawer
  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  drawer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 0.5,
    padding: 24, paddingTop: 16, maxHeight: "85%",
  },
  drawerHandle: { width: 36, height: 3, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  drawerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 16, textAlign: "center" },
  drawerTabs: { flexDirection: "row", marginBottom: 16, borderBottomWidth: 0.5, paddingBottom: 12 },
  drawerTab: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 8 },
  drawerTabActive: { borderBottomWidth: 1.5 },
  drawerTabText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  drawerItem: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 14, borderRadius: 16, borderWidth: 0.5,
  },
  drawerItemIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  drawerItemText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(150,150,150,0.3)" },
  langBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#888" },

  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 8, paddingHorizontal: 2 },
  emptyActivity: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 12 },
  activityItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 0.5 },
  activityItemText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  emptyRequestsState: { alignItems: "center", paddingVertical: 24, gap: 12 },
  requestItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 14, borderWidth: 0.5 },
  requestAvatar: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  requestAvatarImg: { width: "100%", height: "100%", borderRadius: 20 },
  requestAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  requestName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  requestAccept: { backgroundColor: "#3D91F4", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  requestAcceptText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  requestReject: { width: 34, height: 34, borderRadius: 17, borderWidth: 0.5, alignItems: "center", justifyContent: "center" },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", borderRadius: 24, padding: 24, gap: 16, borderWidth: 0.5 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  modalInput: { borderRadius: 16, borderWidth: 0.5, paddingHorizontal: 16, height: 52, justifyContent: "center" },
  modalInputField: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  coverPhotoBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 16, borderWidth: 0.5,
    paddingVertical: 13,
  },
  coverPhotoBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, borderRadius: 20, paddingVertical: 14, alignItems: "center", borderWidth: 0.5 },
  saveBtn: { flex: 1, borderRadius: 20, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  accountTypeBtn: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, borderWidth: 1, padding: 14 },
  accountTypeBtnTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  accountTypeBtnDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  logoutIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FF3B5C22", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  logoutDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },

  // Followers modal
  followBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  followSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 0.5, padding: 20, paddingBottom: 40, maxHeight: "80%",
  },
  followHandle: { width: 36, height: 3, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  followTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 12 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, borderWidth: 0.5, paddingHorizontal: 14, height: 44, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  followUserItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 0.5 },
  followAvatar: { width: 46, height: 46, borderRadius: 23, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  followAvatarImg: { width: "100%", height: "100%", borderRadius: 23 },
  followAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  followUserName: { fontSize: 16, fontFamily: "Inter_500Medium" },
  followUserPhone: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  followEmpty: { alignItems: "center", paddingVertical: 40, gap: 12 },
  followEmptyText: { fontFamily: "Inter_400Regular" },
});
