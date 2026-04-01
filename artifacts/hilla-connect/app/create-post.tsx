import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
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

type MediaType = "none" | "image" | "video";

// Color overlay config per filter
const FILTER_CONFIG: Record<PostFilter, { label: string; overlay: string; brightness?: number }> = {
  none: { label: "بدون", overlay: "transparent" },
  grayscale: { label: "أبيض وأسود", overlay: "rgba(0,0,0,0)" },
  warm: { label: "دافئ", overlay: "rgba(255,140,0,0.22)" },
  cool: { label: "بارد", overlay: "rgba(0,120,255,0.20)" },
  vintage: { label: "كلاسيكي", overlay: "rgba(160,100,40,0.28)" },
};

// Apply CSS-style tint for web, or use image manipulator for grayscale on native
async function applyFilterToImage(uri: string, filter: PostFilter): Promise<string> {
  if (Platform.OS === "web") return uri;
  if (filter === "none") return uri;

  try {
    // Resize to reasonable quality
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
function FilteredImage({
  uri,
  filter,
  style,
}: {
  uri: string;
  filter: PostFilter;
  style?: any;
}) {
  const config = FILTER_CONFIG[filter];
  return (
    <View style={[style, { overflow: "hidden" }]}>
      <Image
        source={{ uri }}
        style={[StyleSheet.absoluteFill, filter === "grayscale" ? { opacity: 1 } : {}]}
        resizeMode="cover"
      />
      {filter === "grayscale" && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0)", mixBlendMode: "saturation" as any },
          ]}
        />
      )}
      {filter !== "none" && filter !== "grayscale" && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: config.overlay }]} />
      )}
      {filter === "grayscale" && Platform.OS === "web" && (
        <View
          style={[StyleSheet.absoluteFill, { filter: "grayscale(100%)" } as any]}
        />
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

  const [content, setContent] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("none");
  const [selectedFilter, setSelectedFilter] = useState<PostFilter>("none");
  const [publishing, setPublishing] = useState(false);
  const [applyingFilter, setApplyingFilter] = useState(false);

  const handlePickImage = async () => {
    if (Platform.OS === "web") { showToast("اختيار الوسائط غير مدعوم على الويب", "info"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { showToast("يرجى السماح بالوصول للمعرض", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type === "video" ? "video" : "image");
      setSelectedFilter("none");
    }
  };

  const handlePublish = async () => {
    if (!content.trim() && !mediaUri) {
      showToast("أضف نصاً أو صورة على الأقل", "error");
      return;
    }
    setPublishing(true);
    let finalUri = mediaUri || undefined;

    // Apply filter to image before saving
    if (finalUri && mediaType === "image" && selectedFilter !== "none") {
      setApplyingFilter(true);
      finalUri = await applyFilterToImage(finalUri, selectedFilter);
      setApplyingFilter(false);
    }

    await addPost(content.trim() || undefined, finalUri, mediaType, selectedFilter);
    setPublishing(false);
    showToast("تم نشر المنشور!", "success");
    router.back();
  };

  const filterKeys = Object.keys(FILTER_CONFIG) as PostFilter[];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        />

        {/* Media Preview with filter */}
        {mediaUri && mediaType === "image" ? (
          <View style={styles.mediaPreviewWrap}>
            <FilteredImage uri={mediaUri} filter={selectedFilter} style={styles.mediaPreviewInner} />
            <TouchableOpacity
              onPress={() => { setMediaUri(null); setMediaType("none"); setSelectedFilter("none"); }}
              style={styles.removeMedia}
            >
              <Ionicons name="close-circle" size={30} color="#fff" />
            </TouchableOpacity>
            {/* Filter badge */}
            {selectedFilter !== "none" && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{FILTER_CONFIG[selectedFilter].label}</Text>
              </View>
            )}
          </View>
        ) : mediaUri && mediaType === "video" ? (
          <View style={styles.mediaPreviewWrap}>
            <View style={[styles.mediaPreviewInner, { backgroundColor: "#000", alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name="play-circle" size={60} color="rgba(255,255,255,0.9)" />
            </View>
            <TouchableOpacity
              onPress={() => { setMediaUri(null); setMediaType("none"); }}
              style={styles.removeMedia}
            >
              <Ionicons name="close-circle" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handlePickImage}
            style={[styles.mediaPickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="images-outline" size={36} color={colors.textSecondary} />
            <Text style={[styles.mediaPickerText, { color: colors.textSecondary }]}>اضغط لإضافة صورة أو فيديو</Text>
          </TouchableOpacity>
        )}

        {/* ─── Filters (only for images) ─── */}
        {mediaUri && mediaType === "image" && (
          <View style={styles.filtersSection}>
            <Text style={[styles.filtersSectionTitle, { color: colors.textSecondary }]}>
              <Ionicons name="color-filter-outline" size={14} /> الفلاتر
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
                    {/* Filter thumbnail */}
                    <View style={[styles.filterThumb, isActive && styles.filterThumbActive]}>
                      <FilteredImage uri={mediaUri} filter={f} style={styles.filterThumbImg} />
                    </View>
                    <Text
                      style={[
                        styles.filterLabel,
                        { color: isActive ? colors.tint : colors.textSecondary },
                      ]}
                    >
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

        {/* Media Picker Row */}
        {!mediaUri && (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={handlePickImage} style={[styles.actionBtn, { backgroundColor: `${colors.tint}18`, borderColor: `${colors.tint}33` }]}>
              <Ionicons name="image-outline" size={22} color={colors.tint} />
              <Text style={[styles.actionBtnText, { color: colors.tint }]}>صورة</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePickImage} style={[styles.actionBtn, { backgroundColor: "#E1306C18", borderColor: "#E1306C33" }]}>
              <Ionicons name="videocam-outline" size={22} color="#E1306C" />
              <Text style={[styles.actionBtnText, { color: "#E1306C" }]}>فيديو</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  closeBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold" },
  publishBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, minWidth: 70, alignItems: "center" },
  publishBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  body: { padding: 16, gap: 16 },
  captionInput: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    fontSize: 16, fontFamily: "Inter_400Regular",
    minHeight: 120, lineHeight: 24,
  },
  mediaPreviewWrap: { borderRadius: 16, overflow: "hidden", position: "relative", aspectRatio: 4 / 3 },
  mediaPreviewInner: { width: "100%", height: "100%" },
  removeMedia: { position: "absolute", top: 10, right: 10 },
  filterBadge: {
    position: "absolute", bottom: 10, left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  filterBadgeText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 },
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
  // Picker
  mediaPickerBtn: {
    aspectRatio: 4 / 3, borderRadius: 16, borderWidth: 2, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 10,
  },
  mediaPickerText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 16, borderWidth: 1 },
  actionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
