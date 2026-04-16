import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
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
import type { User } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

const STORY_FILTERS = [
  { key: "none", label: "بدون" },
  { key: "warm", label: "دافئ" },
  { key: "cool", label: "بارد" },
  { key: "vintage", label: "كلاسيكي" },
  { key: "grayscale", label: "أبيض وأسود" },
];

async function applyStoryFilter(uri: string, filter: string): Promise<string> {
  if (Platform.OS === "web" || filter === "none") return uri;
  try {
    const actions: ImageManipulator.Action[] = [{ resize: { width: 1080 } }];
    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return result.uri;
  } catch {
    return uri;
  }
}

function FilterPreviewOverlay({ filter }: { filter: string }) {
  if (filter === "none") return null;
  const overlays: Record<string, string> = {
    warm: "rgba(255,120,0,0.25)",
    cool: "rgba(0,100,255,0.22)",
    vintage: "rgba(160,100,40,0.28)",
    grayscale: "rgba(128,128,128,0.0)",
  };
  const overlay = overlays[filter];
  if (!overlay) return null;
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: overlay,
          ...(filter === "grayscale" && Platform.OS === "web" ? ({ filter: "grayscale(100%)" } as any) : {}),
        },
      ]}
    />
  );
}

function AudienceSheet({
  visible,
  onClose,
  isCloseFriends,
  onSelect,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  isCloseFriends: boolean;
  onSelect: (cf: boolean) => void;
  colors: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} />
      <View style={[st.audienceSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[st.handle, { backgroundColor: colors.border }]} />
        <Text style={[st.audienceTitle, { color: colors.text }]}>اختيار الجمهور</Text>
        <Text style={[st.audienceSubtitle, { color: colors.textSecondary }]}>من يمكنه رؤية قصتك؟</Text>

        <TouchableOpacity
          style={[
            st.audienceOption,
            { borderColor: !isCloseFriends ? "#3D91F4" : colors.border, backgroundColor: !isCloseFriends ? "#3D91F411" : "transparent" },
          ]}
          onPress={() => { onSelect(false); onClose(); }}
          activeOpacity={0.8}
        >
          <View style={[st.audienceIconWrap, { backgroundColor: !isCloseFriends ? "#3D91F422" : colors.backgroundSecondary || colors.background }]}>
            <Ionicons name="globe-outline" size={22} color={!isCloseFriends ? "#3D91F4" : colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[st.audienceOptionTitle, { color: !isCloseFriends ? "#3D91F4" : colors.text }]}>قصة عامة</Text>
            <Text style={[st.audienceOptionDesc, { color: colors.textSecondary }]}>يراها جميع متابعيك</Text>
          </View>
          {!isCloseFriends && (
            <View style={st.audienceCheck}>
              <Ionicons name="checkmark-circle" size={22} color="#3D91F4" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            st.audienceOption,
            { borderColor: isCloseFriends ? "#8B5CF6" : colors.border, backgroundColor: isCloseFriends ? "#8B5CF611" : "transparent" },
          ]}
          onPress={() => { onSelect(true); onClose(); }}
          activeOpacity={0.8}
        >
          <View style={[st.audienceIconWrap, { backgroundColor: isCloseFriends ? "#8B5CF622" : colors.backgroundSecondary || colors.background }]}>
            <Ionicons name="star" size={22} color={isCloseFriends ? "#8B5CF6" : colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[st.audienceOptionTitle, { color: isCloseFriends ? "#8B5CF6" : colors.text }]}>أصدقاء مقربون</Text>
            <Text style={[st.audienceOptionDesc, { color: colors.textSecondary }]}>لقائمتك المختارة فقط</Text>
          </View>
          {isCloseFriends && (
            <View style={st.audienceCheck}>
              <Ionicons name="checkmark-circle" size={22} color="#8B5CF6" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function CloseFriendsModal({
  visible,
  onClose,
  selectedIds,
  onSave,
  followers,
  users,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSave: (ids: string[]) => void;
  followers: string[];
  users: User[];
  colors: any;
}) {
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (visible) { setSelected(selectedIds); setSearch(""); }
  }, [visible, selectedIds]);

  const followerUsers = users.filter((u) => followers.includes(u.id));
  const filtered = followerUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.username || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} />
      <View style={[st.cfSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[st.handle, { backgroundColor: colors.border }]} />
        <Text style={[st.cfTitle, { color: colors.text }]}>اختر الأصدقاء المقربين</Text>
        <View style={[st.searchBox, { backgroundColor: colors.backgroundSecondary || colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث..."
            placeholderTextColor={colors.textSecondary}
            style={[st.searchInput, { color: colors.text }]}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          style={{ maxHeight: 360 }}
          ListEmptyComponent={
            <Text style={[st.emptyText, { color: colors.textSecondary }]}>لا يوجد متابعون</Text>
          }
          renderItem={({ item }) => {
            const color = ACCENT_COLORS[(item.name?.length ?? 0) % ACCENT_COLORS.length];
            const isSelected = selected.includes(item.id);
            return (
              <TouchableOpacity style={st.cfRow} onPress={() => toggle(item.id)} activeOpacity={0.8}>
                <View style={[st.miniAvatar, { backgroundColor: `${color}33` }]}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={StyleSheet.absoluteFill as any} />
                  ) : (
                    <Text style={[st.miniAvatarText, { color }]}>{item.name[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[st.cfUserName, { color: colors.text }]}>{item.name}</Text>
                  {item.username && (
                    <Text style={[st.cfUserHandle, { color: colors.textSecondary }]}>@{item.username}</Text>
                  )}
                </View>
                <View style={[st.checkbox, { borderColor: isSelected ? "#8B5CF6" : colors.border, backgroundColor: isSelected ? "#8B5CF6" : "transparent" }]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          }}
        />
        <TouchableOpacity
          style={st.cfSaveBtn}
          onPress={() => { onSave(selected); onClose(); }}
          activeOpacity={0.85}
        >
          <LinearGradient colors={["#8B5CF6", "#6D28D9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.cfSaveBtnGrad}>
            <Text style={st.cfSaveBtnText}>حفظ ({selected.length})</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function CreateStoryScreen() {
  const params = useLocalSearchParams<{
    sharedType?: string;
    sharedId?: string;
    sharedMediaUrl?: string;
    sharedCaption?: string;
    sharedCreatorName?: string;
    sharedCreatorId?: string;
  }>();

  const { addStory, theme, users, currentUser, getFollowers, closeFriendsList, updateCloseFriendsList } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [publishing, setPublishing] = useState(false);
  const [applyingFilter, setApplyingFilter] = useState(false);
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  const [cfList, setCfList] = useState<string[]>(closeFriendsList);
  const [showCFModal, setShowCFModal] = useState(false);
  const [showAudienceSheet, setShowAudienceSheet] = useState(false);
  const [mentions, setMentions] = useState<string[]>([]);
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentionPicker, setShowMentionPicker] = useState(false);

  const sharedPost = params.sharedId
    ? {
        id: params.sharedId,
        type: (params.sharedType as "post" | "reel") || "post",
        mediaUrl: params.sharedMediaUrl,
        caption: params.sharedCaption,
        creatorName: params.sharedCreatorName,
        creatorId: params.sharedCreatorId,
      }
    : undefined;

  const followers = getFollowers(currentUser?.id || "").map((f) => f.followerId);

  useEffect(() => {
    if (!isCloseFriends) return;
    const anim = Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
    );
    anim.start();
    return () => { anim.stop(); rotateAnim.setValue(0); };
  }, [isCloseFriends]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const handlePickMedia = async () => {
    if (Platform.OS === "web") { showToast("اختيار الوسائط غير مدعوم على الويب", "info"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { showToast("يرجى السماح بالوصول للمعرض", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.7,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type === "video" ? "video" : "image");
      setSelectedFilter("none");
    }
  };

  const handlePublish = async () => {
    if (!mediaUri && !sharedPost) {
      showToast("يرجى اختيار صورة أو فيديو", "error");
      return;
    }
    setPublishing(true);

    let finalUri = mediaUri || sharedPost?.mediaUrl || "";
    if (mediaUri && mediaType === "image" && selectedFilter !== "none") {
      setApplyingFilter(true);
      finalUri = await applyStoryFilter(mediaUri, selectedFilter);
      setApplyingFilter(false);
    }

    if (isCloseFriends) {
      updateCloseFriendsList(cfList);
    }

    await addStory(finalUri, mediaType, caption.trim() || undefined, selectedFilter, isCloseFriends, mentions, sharedPost);
    setPublishing(false);
    showToast(isCloseFriends ? "تم النشر للأصدقاء المقربين!" : "تم نشر القصة! ستختفي خلال 24 ساعة", "success");
    router.back();
  };

  const handleAddMention = (userId: string) => {
    if (!mentions.includes(userId)) setMentions((prev) => [...prev, userId]);
    setMentionSearch("");
    setShowMentionPicker(false);
  };

  const handleAudienceSelect = (cf: boolean) => {
    setIsCloseFriends(cf);
    if (cf && cfList.length === 0) {
      setTimeout(() => setShowCFModal(true), 350);
    }
  };

  const mentionResults = users
    .filter((u) => u.id !== currentUser?.id && !mentions.includes(u.id))
    .filter((u) =>
      u.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
      (u.username || "").toLowerCase().includes(mentionSearch.toLowerCase())
    )
    .slice(0, 6);

  const audienceColor = isCloseFriends ? "#8B5CF6" : "#3D91F4";
  const audienceIcon = isCloseFriends ? "star" : "globe-outline";
  const audienceLabel = isCloseFriends ? "أصدقاء مقربون" : "قصة عامة";

  return (
    <KeyboardAvoidingView
      style={[st.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <LinearGradient
        colors={theme === "dark" ? ["rgba(139,92,246,0.15)", "transparent"] : ["rgba(139,92,246,0.06)", "transparent"]}
        style={[st.headerGrad, { paddingTop: topPad + 8 }]}
      >
        <View style={st.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[st.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[st.headerTitle, { color: colors.text }]}>قصة جديدة</Text>
          <TouchableOpacity onPress={handlePublish} disabled={publishing || applyingFilter}>
            <LinearGradient
              colors={isCloseFriends ? ["#8B5CF6", "#6D28D9"] : ["#EC4899", "#7C3AED"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={st.publishBtn}
            >
              {publishing || applyingFilter ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={st.publishBtnText}>نشر</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={st.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Audience Selection Button ── */}
        <TouchableOpacity
          style={[st.audienceBtn, { backgroundColor: colors.card, borderColor: audienceColor }]}
          onPress={() => setShowAudienceSheet(true)}
          activeOpacity={0.8}
        >
          <View style={[st.audienceBtnIcon, { backgroundColor: `${audienceColor}22` }]}>
            {isCloseFriends ? (
              <Animated.View style={{ transform: [{ rotate }] }}>
                <Ionicons name="star" size={18} color={audienceColor} />
              </Animated.View>
            ) : (
              <Ionicons name={audienceIcon} size={18} color={audienceColor} />
            )}
          </View>
          <Text style={[st.audienceBtnLabel, { color: audienceColor }]}>{audienceLabel}</Text>
          <Ionicons name="chevron-down" size={16} color={audienceColor} style={{ marginStart: "auto" }} />
        </TouchableOpacity>

        {/* Close Friends Edit List button */}
        {isCloseFriends && (
          <TouchableOpacity
            style={[st.editListBtn, { borderColor: "#8B5CF6" }]}
            onPress={() => setShowCFModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="people-outline" size={16} color="#8B5CF6" />
            <Text style={[st.editListText, { color: "#8B5CF6" }]}>
              {cfList.length > 0 ? `تعديل القائمة (${cfList.length} شخص)` : "اختر الأصدقاء المقربين"}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#8B5CF6" />
          </TouchableOpacity>
        )}

        {/* ── Shared Post Sticker Preview ── */}
        {sharedPost && (
          <View style={[st.sharedStickerCard, { backgroundColor: colors.card, borderColor: "#8B5CF6" }]}>
            <LinearGradient colors={["#8B5CF622", "#EC489922"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.sharedStickerGrad}>
              {sharedPost.mediaUrl ? (
                <Image source={{ uri: sharedPost.mediaUrl }} style={st.sharedStickerThumb} resizeMode="cover" />
              ) : (
                <View style={[st.sharedStickerThumb, { backgroundColor: "#8B5CF644", alignItems: "center", justifyContent: "center" }]}>
                  <Ionicons name={sharedPost.type === "reel" ? "film-outline" : "image-outline"} size={28} color="#8B5CF6" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[st.sharedStickerType, { color: "#8B5CF6" }]}>
                  {sharedPost.type === "reel" ? "مقطع" : "منشور"} مشارك
                </Text>
                {sharedPost.creatorName && (
                  <Text style={[st.sharedStickerCreator, { color: colors.text }]}>{sharedPost.creatorName}</Text>
                )}
                {sharedPost.caption && (
                  <Text numberOfLines={2} style={[st.sharedStickerCaption, { color: colors.textSecondary }]}>{sharedPost.caption}</Text>
                )}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ── Media ── */}
        {mediaUri ? (
          <View style={st.mediaWrap}>
            <Image source={{ uri: mediaUri }} style={st.media} resizeMode="cover" />
            <FilterPreviewOverlay filter={selectedFilter} />
            {sharedPost && (
              <View style={st.stickerOverlay}>
                <View style={[st.stickerBubble, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
                  <Ionicons name={sharedPost.type === "reel" ? "film-outline" : "image-outline"} size={12} color="#8B5CF6" />
                  <Text style={st.stickerBubbleText}>{sharedPost.creatorName || "منشور مشارك"}</Text>
                </View>
              </View>
            )}
            <View style={st.captionOverlay}>
              <TextInput
                style={st.captionInput}
                value={caption}
                onChangeText={setCaption}
                placeholder="أضف وصفاً..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                textAlign="center"
                multiline
              />
            </View>
            <TouchableOpacity onPress={handlePickMedia} style={st.changeMedia}>
              <Ionicons name="checkmark" size={26} color="#fff" />
            </TouchableOpacity>
            {selectedFilter !== "none" && (
              <View style={st.filterBadge}>
                <Text style={st.filterBadgeText}>
                  {STORY_FILTERS.find((f) => f.key === selectedFilter)?.label}
                </Text>
              </View>
            )}
          </View>
        ) : !sharedPost ? (
          <TouchableOpacity onPress={handlePickMedia} style={[st.pickerPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="add-circle-outline" size={52} color={colors.textSecondary} />
            <Text style={[st.pickerText, { color: colors.textSecondary }]}>اضغط لاختيار صورة أو فيديو</Text>
            <Text style={[st.pickerHint, { color: colors.textSecondary }]}>الصور: 25 ثانية | الفيديو: حتى 60 ثانية</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handlePickMedia} style={[st.pickerPlaceholder, { backgroundColor: colors.card, borderColor: "#8B5CF6" }]}>
            <Ionicons name="add-circle-outline" size={36} color="#8B5CF6" />
            <Text style={[st.pickerText, { color: "#8B5CF6" }]}>أضف خلفية للقصة (اختياري)</Text>
          </TouchableOpacity>
        )}

        {/* Filter Selector */}
        {mediaUri && mediaType === "image" && (
          <View>
            <Text style={[st.sectionLabel, { color: colors.textSecondary }]}>الفلاتر</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filtersRow}>
              {STORY_FILTERS.map((f) => {
                const isActive = selectedFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setSelectedFilter(f.key)}
                    activeOpacity={0.8}
                    style={[
                      st.filterItem,
                      {
                        backgroundColor: isActive ? colors.tint : colors.card,
                        borderColor: isActive ? colors.tint : colors.border,
                        transform: [{ scale: isActive ? 1.05 : 1 }],
                      },
                    ]}
                  >
                    <Text style={[st.filterLabel, { color: isActive ? (theme === "dark" ? "#000" : "#fff") : colors.textSecondary }]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Caption (standalone) ── */}
        {!mediaUri && !sharedPost && (
          <View style={[st.captionStandalone, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[st.captionStandaloneInput, { color: colors.text }]}
              value={caption}
              onChangeText={setCaption}
              placeholder="اكتب قصتك..."
              placeholderTextColor={colors.textSecondary}
              textAlign="right"
              multiline
            />
          </View>
        )}

        {/* ── Mentions Section ── */}
        <View style={[st.mentionSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={st.mentionHeader}>
            <Ionicons name="at-outline" size={18} color={colors.textSecondary} />
            <Text style={[st.mentionHeaderText, { color: colors.text }]}>الإشارات</Text>
          </View>
          {mentions.length > 0 && (
            <View style={st.mentionTags}>
              {mentions.map((uid) => {
                const u = users.find((x) => x.id === uid);
                if (!u) return null;
                return (
                  <View key={uid} style={st.mentionTag}>
                    <Text style={st.mentionTagText}>@{u.username || u.name}</Text>
                    <TouchableOpacity onPress={() => setMentions((p) => p.filter((x) => x !== uid))}>
                      <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
          <TouchableOpacity
            style={[st.addMentionBtn, { borderColor: colors.border }]}
            onPress={() => setShowMentionPicker((v) => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add-outline" size={16} color={colors.textSecondary} />
            <Text style={[st.addMentionText, { color: colors.textSecondary }]}>أضف إشارة...</Text>
          </TouchableOpacity>
          {showMentionPicker && (
            <View>
              <TextInput
                value={mentionSearch}
                onChangeText={setMentionSearch}
                placeholder="ابحث عن مستخدم..."
                placeholderTextColor={colors.textSecondary}
                style={[st.mentionSearchInput, { color: colors.text, borderColor: colors.border }]}
                autoFocus
              />
              {mentionResults.map((u) => {
                const color = ACCENT_COLORS[(u.name?.length ?? 0) % ACCENT_COLORS.length];
                return (
                  <TouchableOpacity key={u.id} style={st.mentionResult} onPress={() => handleAddMention(u.id)} activeOpacity={0.8}>
                    <View style={[st.mentionResultAvatar, { backgroundColor: `${color}33` }]}>
                      {u.avatar ? (
                        <Image source={{ uri: u.avatar }} style={StyleSheet.absoluteFill as any} />
                      ) : (
                        <Text style={[st.mentionResultAvatarText, { color }]}>{u.name[0]?.toUpperCase()}</Text>
                      )}
                    </View>
                    <Text style={[st.mentionResultName, { color: colors.text }]}>{u.name}</Text>
                    {u.username && <Text style={[st.mentionResultHandle, { color: colors.textSecondary }]}>@{u.username}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={[st.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={[st.tipsText, { color: colors.textSecondary }]}>
            القصص تختفي تلقائياً بعد 24 ساعة من نشرها
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <AudienceSheet
        visible={showAudienceSheet}
        onClose={() => setShowAudienceSheet(false)}
        isCloseFriends={isCloseFriends}
        onSelect={handleAudienceSelect}
        colors={colors}
      />

      <CloseFriendsModal
        visible={showCFModal}
        onClose={() => { setShowCFModal(false); if (cfList.length === 0) setIsCloseFriends(false); }}
        selectedIds={cfList}
        onSave={(ids) => { setCfList(ids); if (ids.length === 0) setIsCloseFriends(false); }}
        followers={followers}
        users={users}
        colors={colors}
      />
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  closeBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold" },
  publishBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  publishBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  body: { padding: 16, gap: 14 },

  audienceBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 16, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  audienceBtnIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  audienceBtnLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },

  audienceSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 0.5, padding: 20, paddingBottom: 40, gap: 12,
  },
  audienceTitle: { fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center", marginBottom: 2 },
  audienceSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginBottom: 4 },
  audienceOption: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 16, borderWidth: 1.5, padding: 14,
  },
  audienceIconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  audienceOptionTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 2 },
  audienceOptionDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
  audienceCheck: { marginLeft: 4 },

  editListBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
  },
  editListText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13 },

  sharedStickerCard: { borderRadius: 16, borderWidth: 1.5, overflow: "hidden" },
  sharedStickerGrad: { flexDirection: "row", gap: 12, padding: 12, alignItems: "center" },
  sharedStickerThumb: { width: 56, height: 56, borderRadius: 10, overflow: "hidden" },
  sharedStickerType: { fontFamily: "Inter_700Bold", fontSize: 11, marginBottom: 2 },
  sharedStickerCreator: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  sharedStickerCaption: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },

  mediaWrap: { borderRadius: 20, overflow: "hidden", aspectRatio: 9 / 16, position: "relative" },
  media: { width: "100%", height: "100%" },
  stickerOverlay: { position: "absolute", bottom: 80, left: 0, right: 0, alignItems: "center" },
  stickerBubble: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#8B5CF655" },
  stickerBubbleText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 },
  captionOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: "rgba(0,0,0,0.4)" },
  captionInput: { color: "#fff", fontFamily: "Inter_500Medium", fontSize: 16, textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 4 },
  changeMedia: {
    position: "absolute", bottom: 12, right: 12,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#FF8C00", alignItems: "center", justifyContent: "center",
    borderWidth: 2.5, borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  filterBadge: { position: "absolute", top: 12, left: 12, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  filterBadgeText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 },
  pickerPlaceholder: { aspectRatio: 9 / 16, borderRadius: 20, borderWidth: 2, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 12 },
  pickerText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  pickerHint: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 10, letterSpacing: 0.5 },
  filtersRow: { gap: 10 },
  filterItem: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  filterLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  captionStandalone: { borderRadius: 16, borderWidth: 1, padding: 14, minHeight: 80 },
  captionStandaloneInput: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
  tipsCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 12 },
  tipsText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

  mentionSection: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  mentionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  mentionHeaderText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  mentionTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mentionTag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#8B5CF6", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  mentionTagText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 },
  addMentionBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderStyle: "dashed", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  addMentionText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  mentionSearchInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 8 },
  mentionResult: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  mentionResultAvatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  mentionResultAvatarText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  mentionResultName: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 13 },
  mentionResultHandle: { fontFamily: "Inter_400Regular", fontSize: 12 },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  cfSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 0.5, padding: 16, paddingBottom: 36, gap: 14 },
  handle: { width: 36, height: 3, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  cfTitle: { fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  cfRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  miniAvatar: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  miniAvatarText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  cfUserName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  cfUserHandle: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  emptyText: { textAlign: "center", fontFamily: "Inter_400Regular", paddingVertical: 20 },
  cfSaveBtn: { borderRadius: 20, overflow: "hidden", marginTop: 8 },
  cfSaveBtnGrad: { paddingVertical: 14, alignItems: "center" },
  cfSaveBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
});
