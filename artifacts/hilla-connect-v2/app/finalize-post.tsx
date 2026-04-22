/**
 * Finalize Post Screen
 * ────────────────────
 * The second step of the post / reel publishing flow. The UniversalEditor
 * (`/create-story`) bakes the user's edits into a flat media file, then
 * navigates here. This screen collects the caption + mentions and triggers
 * the actual API call.
 *
 * Route params:
 *   - mode:       "post" | "reel"
 *   - mediaUri:   absolute URI of the baked media (PNG for images, mp4 for video)
 *   - mediaType:  "image" | "video" | "none"
 *   - filter:     filter key to apply at viewer time (videos only, images already baked)
 *   - mentions:   comma-separated user IDs parsed from overlay text
 *
 * Instagram-style UX: scaled-down preview thumbnail + caption input + Share button.
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { consumeBakedMedia, type BakedMediaPayload } from "@/lib/bakedMediaBridge";

const Z_BG = "#000000";
const Z_PANEL = "#0A0A0A";
const Z_BORDER = "rgba(255,255,255,0.08)";
const Z_BLUE = "#3D91F4";
const Z_GREEN = "#00E676";
const Z_TEXT = "#FFFFFF";
const Z_MUTED = "rgba(255,255,255,0.55)";

const T = {
  finalizePost: "إتمام النشر",
  finalizeReel: "إتمام المقطع",
  caption: "وصف المنشور",
  captionPlaceholder: "أضف وصفاً... استخدم @ للإشارة إلى الأشخاص",
  share: "نشر",
  back: "رجوع",
  postedPost: "تم نشر المنشور",
  postedReel: "تم نشر المقطع",
  publishFailed: "فشل النشر",
  noMedia: "لا توجد وسائط",
};

function VideoThumb({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function FinalizePostScreen() {
  const insets = useSafeAreaInsets();
  const { addPost, addReel } = useApp();
  const { showToast } = useToast();

  // The baked media is handed off from the editor via an in-memory bridge —
  // see `lib/bakedMediaBridge.ts` for why we don't pass it through router
  // params. Consume it once on mount and freeze it in local state for the
  // lifetime of this screen.
  const [payload, setPayload] = useState<BakedMediaPayload | null>(null);
  useEffect(() => {
    const p = consumeBakedMedia();
    if (!p) {
      // No payload means the user landed here directly (deep-link, refresh
      // on web). Bounce back to the editor.
      router.replace("/(tabs)" as any);
      return;
    }
    setPayload(p);
  }, []);

  const mode = payload?.mode || "post";
  const mediaUri = payload?.mediaUri || "";
  const mediaType = payload?.mediaType || "image";
  const filter = (payload?.filter || "none") as any;

  const [caption, setCaption] = useState("");
  const [publishing, setPublishing] = useState(false);

  const title = mode === "reel" ? T.finalizeReel : T.finalizePost;
  const successMsg = mode === "reel" ? T.postedReel : T.postedPost;

  const handleShare = async () => {
    if (!mediaUri) {
      showToast(T.noMedia, "error");
      return;
    }
    setPublishing(true);
    try {
      if (mode === "reel") {
        await addReel(mediaUri, caption.trim(), filter);
      } else {
        await addPost(
          caption.trim() || undefined,
          mediaUri || undefined,
          mediaType,
          filter,
        );
      }
      showToast(successMsg, "success");
      // Pop both finalize and editor — return to the previous screen the user came from.
      if (router.canGoBack()) router.back();
      router.replace("/(tabs)" as any);
    } catch (err: any) {
      console.error("[finalize-post] publish failed", err);
      showToast(`${T.publishFailed}: ${err?.message || ""}`, "error");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Preview thumb + caption row */}
        <View style={styles.row}>
          <View style={styles.thumb}>
            {mediaUri ? (
              mediaType === "video" ? (
                <VideoThumb uri={mediaUri} />
              ) : (
                <Image source={{ uri: mediaUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              )
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: Z_PANEL }]} />
            )}
          </View>

          <TextInput
            style={styles.captionInput}
            placeholder={T.captionPlaceholder}
            placeholderTextColor={Z_MUTED}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2200}
            textAlign="right"
          />
        </View>

        <Text style={styles.charCount}>{caption.length}/2200</Text>
      </ScrollView>

      {/* Share button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          disabled={publishing}
          activeOpacity={0.85}
        >
          {publishing ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Text style={styles.shareBtnText}>{T.share}</Text>
              <Ionicons name="paper-plane" size={18} color="#000" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Z_BG },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Z_BORDER,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, color: Z_TEXT, fontFamily: "Inter_700Bold", fontSize: 17, textAlign: "center" },
  row: { flexDirection: "row-reverse", gap: 12, alignItems: "flex-start" },
  thumb: {
    width: 90,
    height: 120,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: Z_PANEL,
    borderWidth: 1,
    borderColor: Z_BORDER,
  },
  captionInput: {
    flex: 1,
    minHeight: 120,
    color: Z_TEXT,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    paddingTop: 8,
    paddingHorizontal: 4,
    textAlignVertical: "top",
  },
  charCount: { color: Z_MUTED, fontSize: 12, textAlign: "left", marginTop: 8 },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: Z_BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Z_BORDER,
  },
  shareBtn: {
    backgroundColor: Z_BLUE,
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareBtnText: { color: "#000", fontFamily: "Inter_700Bold", fontSize: 16 },
});
