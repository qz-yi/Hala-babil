import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
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
import { useToast } from "@/components/Toast";

const STORY_FILTERS = [
  { key: "none", label: "بدون" },
  { key: "warm", label: "دافئ" },
  { key: "cool", label: "بارد" },
  { key: "vintage", label: "كلاسيكي" },
  { key: "grayscale", label: "أبيض وأسود" },
];

const FILTER_STYLES: Record<string, object> = {
  none: {},
  warm: { tintColor: "rgba(255, 120, 0, 0.25)" },
  cool: { tintColor: "rgba(0, 120, 255, 0.25)" },
  vintage: { opacity: 0.85 },
  grayscale: { tintColor: "rgba(128,128,128,0.6)" },
};

export default function CreateStoryScreen() {
  const { addStory, theme } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [publishing, setPublishing] = useState(false);

  const handlePickMedia = async () => {
    if (Platform.OS === "web") { showToast("اختيار الوسائط غير مدعوم على الويب", "info"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { showToast("يرجى السماح بالوصول للمعرض", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type === "video" ? "video" : "image");
    }
  };

  const handlePublish = async () => {
    if (!mediaUri) {
      showToast("يرجى اختيار صورة أو فيديو", "error");
      return;
    }
    setPublishing(true);
    await addStory(mediaUri, mediaType, caption.trim() || undefined, selectedFilter);
    setPublishing(false);
    showToast("تم نشر القصة! ستختفي خلال 24 ساعة", "success");
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={theme === "dark" ? ["rgba(236,72,153,0.15)", "transparent"] : ["rgba(236,72,153,0.06)", "transparent"]}
        style={[styles.headerGrad, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>قصة جديدة</Text>
          <TouchableOpacity onPress={handlePublish} disabled={publishing}>
            <LinearGradient
              colors={["#EC4899", "#7C3AED"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.publishBtn}
            >
              <Text style={styles.publishBtnText}>{publishing ? "..." : "نشر"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Media */}
        {mediaUri ? (
          <View style={styles.mediaWrap}>
            <Image source={{ uri: mediaUri }} style={styles.media} resizeMode="cover" />
            {/* Caption overlay at bottom */}
            <View style={styles.captionOverlay}>
              <TextInput
                style={styles.captionInput}
                value={caption}
                onChangeText={setCaption}
                placeholder="أضف وصفاً..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                textAlign="center"
                multiline
              />
            </View>
            {/* Change media button */}
            <TouchableOpacity onPress={handlePickMedia} style={styles.changeMedia}>
              <Ionicons name="images-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handlePickMedia} style={[styles.pickerPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="add-circle-outline" size={52} color={colors.textSecondary} />
            <Text style={[styles.pickerText, { color: colors.textSecondary }]}>اضغط لاختيار صورة أو فيديو</Text>
            <Text style={[styles.pickerHint, { color: colors.textSecondary }]}>تظهر القصة لمدة 24 ساعة</Text>
          </TouchableOpacity>
        )}

        {/* Filter Selector */}
        {mediaUri && (
          <View>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>الفلاتر</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
              {STORY_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setSelectedFilter(f.key)}
                  style={[
                    styles.filterItem,
                    {
                      backgroundColor: selectedFilter === f.key ? colors.tint : colors.card,
                      borderColor: selectedFilter === f.key ? colors.tint : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.filterLabel, { color: selectedFilter === f.key ? "#fff" : colors.textSecondary }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Caption Field (standalone when no media) */}
        {!mediaUri && (
          <View style={[styles.captionStandalone, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.captionStandaloneInput, { color: colors.text }]}
              value={caption}
              onChangeText={setCaption}
              placeholder="اكتب قصتك..."
              placeholderTextColor={colors.textSecondary}
              textAlign="right"
              multiline
            />
          </View>
        )}

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            القصص تختفي تلقائياً بعد 24 ساعة من نشرها
          </Text>
        </View>
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
  publishBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  publishBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  body: { padding: 16, gap: 16 },
  mediaWrap: { borderRadius: 20, overflow: "hidden", aspectRatio: 9 / 16, position: "relative" },
  media: { width: "100%", height: "100%" },
  captionOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: "rgba(0,0,0,0.4)",
  },
  captionInput: { color: "#fff", fontFamily: "Inter_500Medium", fontSize: 16, textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 4 },
  changeMedia: {
    position: "absolute", top: 12, right: 12,
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
  pickerPlaceholder: {
    aspectRatio: 9 / 16, borderRadius: 20, borderWidth: 2, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 12,
  },
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
});
