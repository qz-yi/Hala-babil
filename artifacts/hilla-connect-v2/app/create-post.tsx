import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
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

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

import type { PostFilter } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type MediaTab = "image" | "video";
type MediaType = "none" | "image" | "video";

// Color overlay config per filter
const FILTER_CONFIG: Record<PostFilter, { label: string; overlay: string }> = {
  none: { label: "بدون", overlay: "transparent" },
  grayscale: { label: "أبيض وأسود", overlay: "rgba(0,0,0,0)" },
  warm: { label: "دافئ", overlay: "rgba(255,140,0,0.22)" },
  cool: { label: "بارد", overlay: "rgba(0,120,255,0.20)" },
  vintage: { label: "كلاسيكي", overlay: "rgba(160,100,40,0.28)" },
};

// Apply filter using image manipulator
async function applyFilterToImage(uri: string, filter: PostFilter): Promise<string> {
  if (Platform.OS === "web") return uri;
  if (filter === "none") return uri;
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    return uri;
  }
}

// Image with visual filter overlay
function FilteredImage({ uri, filter, style }: { uri: string; filter: PostFilter; style?: any }) {
  const config = FILTER_CONFIG[filter];
  return (
    <View style={[style, { overflow: "hidden" }]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {filter === "grayscale" && Platform.OS === "web" && (
        <View style={[StyleSheet.absoluteFill, { filter: "grayscale(100%)" } as any]} />
      )}
      {filter !== "none" && filter !== "grayscale" && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: config.overlay }]} />
      )}
    </View>
  );
}

export default function CreatePostScreen() {
  const { addPost, theme, t } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const [activeTab, setActiveTab] = useState<MediaTab>("image");
  const [content, setContent] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaUris, setMediaUris] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<MediaType>("none");
  const [selectedFilter, setSelectedFilter] = useState<PostFilter>("none");
  const [publishing, setPublishing] = useState(false);
  const [applyingFilter, setApplyingFilter] = useState(false);

  const handlePickImage = async () => {
    if (Platform.OS === "web") { showToast("اختيار الوسائط غير مدعوم على الويب", "info"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { showToast("يرجى السماح بالوصول للمعرض", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 10,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map((a) => a.uri);
      if (uris.length === 1) {
        setMediaUri(uris[0]);
        setMediaUris([]);
      } else {
        setMediaUris(uris);
        setMediaUri(uris[0]);
      }
      setMediaType("image");
      setSelectedFilter("none");
    }
  };

  const handlePickVideo = async () => {
    if (Platform.OS === "web") { showToast("اختيار الفيديو غير مدعوم على الويب", "info"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { showToast("يرجى السماح بالوصول للمعرض", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType("video");
      setSelectedFilter("none");
    }
  };

  const handleTabPress = (tab: MediaTab) => {
    setActiveTab(tab);
    if (tab !== mediaType && (mediaUri || mediaUris.length > 0)) {
      setMediaUri(null);
      setMediaUris([]);
      setMediaType("none");
      setSelectedFilter("none");
    }
  };

  const handlePickMedia = () => {
    if (activeTab === "image") handlePickImage();
    else handlePickVideo();
  };

  const handleRemoveImage = (idx: number) => {
    if (mediaUris.length > 0) {
      const updated = mediaUris.filter((_, i) => i !== idx);
      if (updated.length === 0) {
        setMediaUris([]);
        setMediaUri(null);
        setMediaType("none");
      } else if (updated.length === 1) {
        setMediaUris([]);
        setMediaUri(updated[0]);
      } else {
        setMediaUris(updated);
        setMediaUri(updated[0]);
      }
    } else {
      setMediaUri(null);
      setMediaType("none");
      setSelectedFilter("none");
    }
  };

  const handlePublish = async () => {
    if (!content.trim() && !mediaUri && mediaUris.length === 0) {
      showToast("أضف نصاً أو وسائط على الأقل", "error");
      return;
    }
    setPublishing(true);

    if (mediaUris.length > 1) {
      await addPost(content.trim() || undefined, mediaUris[0], mediaType, selectedFilter, mediaUris);
    } else {
      let finalUri = mediaUri || undefined;
      if (finalUri && mediaType === "image" && selectedFilter !== "none") {
        setApplyingFilter(true);
        finalUri = await applyFilterToImage(finalUri, selectedFilter);
        setApplyingFilter(false);
      }
      await addPost(content.trim() || undefined, finalUri, mediaType, selectedFilter);
    }

    setPublishing(false);
    showToast("تم نشر المنشور!", "success");
    router.back();
  };

  const filterKeys = Object.keys(FILTER_CONFIG) as PostFilter[];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <LinearGradient
        colors={theme === "dark" ? ["rgba(79,70,229,0.15)", "transparent"] : ["rgba(79,70,229,0.06)", "transparent"]}
        style={[styles.headerGrad, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t("createPost")}</Text>
          <TouchableOpacity onPress={handlePublish} disabled={publishing || applyingFilter}>
            <LinearGradient
              colors={["#7C3AED", "#4F46E5"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.publishBtn}
            >
              {publishing || applyingFilter ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.publishBtnText}>{t("publish")}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Media Type Tabs */}
        <View style={[styles.tabsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(["image", "video"] as MediaTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabPress(tab)}
                style={[styles.tab, isActive && styles.tabActive]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab === "image" ? "image-outline" : "videocam-outline"}
                  size={17}
                  color={isActive ? "#fff" : colors.textSecondary}
                />
                <Text style={[styles.tabText, { color: isActive ? "#fff" : colors.textSecondary }]}>
                  {tab === "image" ? "صورة" : "فيديو"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Caption Input */}
        <TextInput
          style={[styles.captionInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
          value={content}
          onChangeText={setContent}
          placeholder="ماذا يدور في ذهنك؟"
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
          textAlign="right"
          returnKeyType="default"
        />

        {/* Media Preview — multi-image grid or single */}
        {mediaUris.length > 1 && mediaType === "image" ? (
          <View style={styles.multiImageWrap}>
            <FlatList
              data={mediaUris}
              horizontal
              keyExtractor={(_, i) => String(i)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
              renderItem={({ item, index }) => (
                <View style={styles.multiThumb}>
                  <Image source={{ uri: item }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(index)}
                    style={styles.multiThumbRemove}
                  >
                    <Ionicons name="close-circle" size={22} color="#fff" />
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.multiThumbBadge}>
                      <Text style={styles.multiThumbBadgeText}>الغلاف</Text>
                    </View>
                  )}
                </View>
              )}
            />
            <TouchableOpacity onPress={handlePickImage} style={styles.addMoreImgBtn}>
              <Ionicons name="add-circle-outline" size={22} color="#7C3AED" />
              <Text style={styles.addMoreImgText}>إضافة صور</Text>
            </TouchableOpacity>
          </View>
        ) : mediaUri && mediaType === "image" ? (
          <View style={styles.mediaPreviewWrap}>
            <FilteredImage uri={mediaUri} filter={selectedFilter} style={styles.mediaPreviewInner} />
            <TouchableOpacity
              onPress={() => handleRemoveImage(0)}
              style={styles.removeMedia}
            >
              <Ionicons name="close-circle" size={30} color="#fff" />
            </TouchableOpacity>
            {/* Re-pick + add more */}
            <TouchableOpacity onPress={handlePickImage} style={styles.cropBtn}>
              <View style={styles.cropBtnCircle}>
                <Ionicons name="checkmark" size={28} color="#fff" />
              </View>
            </TouchableOpacity>
            {selectedFilter !== "none" && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{FILTER_CONFIG[selectedFilter].label}</Text>
              </View>
            )}
          </View>
        ) : mediaUri && mediaType === "video" ? (
          <View style={styles.mediaPreviewWrap}>
            <View style={[styles.mediaPreviewInner, { backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.9)" />
              <Text style={styles.videoLabel}>تم اختيار الفيديو</Text>
            </View>
            <TouchableOpacity
              onPress={() => { setMediaUri(null); setMediaType("none"); }}
              style={styles.removeMedia}
            >
              <Ionicons name="close-circle" size={30} color="#fff" />
            </TouchableOpacity>
            {/* Re-pick button */}
            <TouchableOpacity onPress={handlePickVideo} style={styles.cropBtn}>
              <View style={styles.cropBtnCircle}>
                <Ionicons name="checkmark" size={28} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handlePickMedia}
            style={[styles.mediaPickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === "image" ? "images-outline" : "videocam-outline"}
              size={40}
              color={colors.textSecondary}
            />
            <Text style={[styles.mediaPickerText, { color: colors.textSecondary }]}>
              {activeTab === "image" ? "اضغط لإضافة صورة" : "اضغط لإضافة فيديو"}
            </Text>
            <Text style={[styles.mediaPickerHint, { color: colors.textSecondary }]}>
              {activeTab === "video" ? "سيُنشر كمنشور دائم" : "يمكنك تطبيق فلتر بعد الاختيار"}
            </Text>
          </TouchableOpacity>
        )}

        {/* ─── Filters (only for images) ─── */}
        {mediaUri && mediaType === "image" && (
          <View style={styles.filtersSection}>
            <Text style={[styles.filtersSectionTitle, { color: colors.textSecondary }]}>
              الفلاتر
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
              {filterKeys.map((f) => {
                const isActive = selectedFilter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setSelectedFilter(f)}
                    style={styles.filterItem}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.filterThumb, isActive && styles.filterThumbActive]}>
                      <FilteredImage uri={mediaUri} filter={f} style={styles.filterThumbImg} />
                    </View>
                    <Text style={[styles.filterLabel, { color: isActive ? colors.tint : colors.textSecondary }]}>
                      {FILTER_CONFIG[f].label}
                    </Text>
                    {isActive && (
                      <View style={[styles.filterActiveDot, { backgroundColor: colors.tint }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4, marginBottom: 16 },
  closeBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold" },
  publishBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, minWidth: 70, alignItems: "center" },
  publishBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  // Tabs
  tabsRow: {
    flexDirection: "row", borderRadius: 16, borderWidth: 1, overflow: "hidden", padding: 4, gap: 4,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 12,
  },
  tabActive: {
    backgroundColor: "#7C3AED",
  },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  body: { padding: 16, gap: 16, paddingBottom: 40 },
  captionInput: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    fontSize: 16, fontFamily: "Inter_400Regular",
    minHeight: 100, lineHeight: 24,
  },
  mediaPreviewWrap: { borderRadius: 16, overflow: "hidden", position: "relative", aspectRatio: 4 / 3 },
  mediaPreviewInner: { width: "100%", height: "100%" },
  removeMedia: { position: "absolute", top: 10, right: 10 },
  cropBtn: {
    position: "absolute", bottom: 12, right: 12,
  },
  cropBtnCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#FF8C00",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2.5, borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  videoLabel: {
    color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular",
    fontSize: 13, marginTop: 10,
  },
  filterBadge: {
    position: "absolute", bottom: 12, left: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  filterBadgeText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 },
  mediaPickerBtn: {
    aspectRatio: 4 / 3, borderRadius: 16, borderWidth: 2, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 10,
  },
  mediaPickerText: { fontSize: 15, fontFamily: "Inter_500Medium", textAlign: "center" },
  mediaPickerHint: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", opacity: 0.7 },
  multiImageWrap: { gap: 10, paddingVertical: 4 },
  multiThumb: {
    width: 110, height: 110, borderRadius: 14, overflow: "hidden",
    backgroundColor: "#111", position: "relative",
  },
  multiThumbRemove: { position: "absolute", top: 4, right: 4, zIndex: 2 },
  multiThumbBadge: {
    position: "absolute", bottom: 4, left: 4,
    backgroundColor: "rgba(124,58,237,0.85)",
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  multiThumbBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  addMoreImgBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed",
    borderColor: "#7C3AED", justifyContent: "center",
  },
  addMoreImgText: { color: "#7C3AED", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  // Filters
  filtersSection: { gap: 10 },
  filtersSectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", paddingHorizontal: 2 },
  filtersRow: { gap: 12, paddingRight: 4 },
  filterItem: { alignItems: "center", gap: 6 },
  filterThumb: {
    width: 68, height: 68, borderRadius: 14, overflow: "hidden",
    borderWidth: 2, borderColor: "transparent",
  },
  filterThumbActive: { borderColor: "#7C3AED", borderWidth: 2.5 },
  filterThumbImg: { width: "100%", height: "100%" },
  filterLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  filterActiveDot: { width: 6, height: 6, borderRadius: 3 },
});
