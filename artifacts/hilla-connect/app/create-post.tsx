import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { useToast } from "@/components/Toast";

type MediaType = "none" | "image" | "video";

export default function CreatePostScreen() {
  const { addPost, theme, t } = useApp();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const [content, setContent] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("none");
  const [publishing, setPublishing] = useState(false);

  const handlePickImage = async () => {
    if (Platform.OS === "web") { showToast("اختيار الوسائط غير مدعوم على الويب", "info"); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { showToast("يرجى السماح بالوصول للمعرض", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type === "video" ? "video" : "image");
    }
  };

  const handlePublish = async () => {
    if (!content.trim() && !mediaUri) {
      showToast("أضف نصاً أو صورة على الأقل", "error");
      return;
    }
    setPublishing(true);
    await addPost(content.trim() || undefined, mediaUri || undefined, mediaType);
    setPublishing(false);
    showToast("تم نشر المنشور!", "success");
    router.back();
  };

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
          <TouchableOpacity onPress={handlePublish} disabled={publishing}>
            <LinearGradient
              colors={["#7C3AED", "#4F46E5"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.publishBtn}
            >
              <Text style={styles.publishBtnText}>{publishing ? "..." : t("publish")}</Text>
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

        {/* Media Preview */}
        {mediaUri ? (
          <View style={styles.mediaPreviewWrap}>
            <Image source={{ uri: mediaUri }} style={styles.mediaPreview} resizeMode="cover" />
            <TouchableOpacity
              onPress={() => { setMediaUri(null); setMediaType("none"); }}
              style={styles.removeMedia}
            >
              <Ionicons name="close-circle" size={28} color="#fff" />
            </TouchableOpacity>
            {mediaType === "video" && (
              <View style={styles.videoIndicator}>
                <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.9)" />
              </View>
            )}
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
  publishBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  publishBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  body: { padding: 16, gap: 16 },
  captionInput: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    fontSize: 16, fontFamily: "Inter_400Regular",
    minHeight: 120, lineHeight: 24,
  },
  mediaPreviewWrap: { borderRadius: 16, overflow: "hidden", position: "relative", aspectRatio: 4 / 3 },
  mediaPreview: { width: "100%", height: "100%" },
  removeMedia: { position: "absolute", top: 10, right: 10 },
  videoIndicator: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  mediaPickerBtn: {
    aspectRatio: 4 / 3, borderRadius: 16, borderWidth: 2, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 10,
  },
  mediaPickerText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 16, borderWidth: 1 },
  actionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
