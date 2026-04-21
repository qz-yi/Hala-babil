import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
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

import { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { User } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

// ── Theme constants (Strict Zentram Dark) ──────────────────────────────────
const Z_BG = "#000000";
const Z_PANEL = "#0A0A0A";
const Z_BORDER = "rgba(255,255,255,0.08)";
const Z_BLUE = "#3D91F4";   // Electric Blue
const Z_GREEN = "#00E676";  // Vibrant Green
const Z_TEXT = "#FFFFFF";
const Z_MUTED = "rgba(255,255,255,0.55)";

// ── Filters & Backgrounds ──────────────────────────────────────────────────
const STORY_FILTERS = [
  { key: "none", label: "Original" },
  { key: "warm", label: "Warm" },
  { key: "cool", label: "Cool" },
  { key: "vintage", label: "Vintage" },
  { key: "grayscale", label: "B&W" },
];

const TEXT_BACKGROUNDS: { id: string; colors: [string, string] }[] = [
  { id: "midnight", colors: ["#000000", "#1A1A2E"] },
  { id: "sunset", colors: ["#FF512F", "#DD2476"] },
  { id: "ocean", colors: ["#0072FF", "#00C6FF"] },
  { id: "forest", colors: ["#11998E", "#38EF7D"] },
  { id: "violet", colors: ["#8E2DE2", "#4A00E0"] },
  { id: "fire", colors: ["#F12711", "#F5AF19"] },
  { id: "rose", colors: ["#FF0844", "#FFB199"] },
  { id: "gold", colors: ["#B79891", "#94716B"] },
  { id: "neon", colors: ["#00F260", "#0575E6"] },
];

const HIGHLIGHT_STYLES = [
  { id: "classic", label: "Classic" },
  { id: "neon", label: "Neon" },
  { id: "block", label: "Block" },
  { id: "transparent", label: "Plain" },
] as const;

type HighlightId = (typeof HIGHLIGHT_STYLES)[number]["id"];
type AlignId = "left" | "center" | "right";

type TextOverlay = {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  highlight: HighlightId;
  align: AlignId;
};

const SCREEN = Dimensions.get("window");

// ── Filter overlay (preview only, baked at publish) ────────────────────────
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
          ...(filter === "grayscale" && Platform.OS === "web"
            ? ({ filter: "grayscale(100%)" } as any)
            : {}),
        },
      ]}
    />
  );
}

async function bakeFilter(uri: string, filter: string): Promise<string> {
  if (Platform.OS === "web" || filter === "none") return uri;
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
    );
    return result.uri;
  } catch {
    return uri;
  }
}

// ── Highlight visual styles ────────────────────────────────────────────────
function highlightStyle(h: HighlightId): { wrap: any; text: any } {
  switch (h) {
    case "neon":
      return {
        wrap: { backgroundColor: "transparent" },
        text: {
          color: Z_GREEN,
          textShadowColor: Z_GREEN,
          textShadowRadius: 12,
        },
      };
    case "block":
      return {
        wrap: {
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 4,
        },
        text: { color: "#000000" },
      };
    case "transparent":
      return {
        wrap: { backgroundColor: "transparent" },
        text: {
          color: "#FFFFFF",
          textShadowColor: "rgba(0,0,0,0.65)",
          textShadowRadius: 8,
        },
      };
    case "classic":
    default:
      return {
        wrap: {
          backgroundColor: "rgba(0,0,0,0.55)",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
        },
        text: { color: "#FFFFFF" },
      };
  }
}

// ── Draggable text overlay ─────────────────────────────────────────────────
function DraggableText({
  overlay,
  active,
  onActivate,
  onDelete,
  onChange,
  onEdit,
}: {
  overlay: TextOverlay;
  active: boolean;
  onActivate: () => void;
  onDelete: () => void;
  onChange: (next: Partial<TextOverlay>) => void;
  onEdit: () => void;
}) {
  const pan = useRef(new Animated.ValueXY({ x: overlay.x, y: overlay.y })).current;
  const lastPos = useRef({ x: overlay.x, y: overlay.y });

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        onActivate();
        pan.setOffset({ x: lastPos.current.x, y: lastPos.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        const nx = lastPos.current.x + g.dx;
        const ny = lastPos.current.y + g.dy;
        lastPos.current = { x: nx, y: ny };
        pan.flattenOffset();
        onChange({ x: nx, y: ny });
      },
    }),
  ).current;

  const hs = highlightStyle(overlay.highlight);
  const fontSize = 26 * overlay.scale;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        st.draggableBox,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
      ]}
    >
      <Pressable onPress={onActivate} onLongPress={onEdit}>
        <View
          style={[
            hs.wrap,
            active && {
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: Z_BLUE,
            },
          ]}
        >
          <Text
            style={[
              hs.text,
              {
                fontSize,
                fontFamily: "Inter_700Bold",
                textAlign: overlay.align,
                maxWidth: SCREEN.width - 60,
              },
            ]}
          >
            {overlay.text}
          </Text>
        </View>
      </Pressable>

      {active && (
        <>
          <TouchableOpacity
            style={st.deleteHandle}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={14} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={st.scaleHandle}
            onPress={() => onChange({ scale: overlay.scale >= 2 ? 0.7 : overlay.scale + 0.25 })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="resize-outline" size={14} color="#fff" />
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  );
}

// ── Manual Crop Modal (9:16 guide) ─────────────────────────────────────────
function CropModal({
  visible,
  uri,
  onClose,
  onApply,
}: {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  onApply: (newUri: string) => void;
}) {
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const last = useRef({ x: 0, y: 0 });

  const frameW = SCREEN.width - 40;
  const frameH = (frameW * 16) / 9;

  useEffect(() => {
    if (!visible || !uri) return;
    pan.setValue({ x: 0, y: 0 });
    last.current = { x: 0, y: 0 };
    Image.getSize(
      uri,
      (w, h) => setImgSize({ w, h }),
      () => setImgSize(null),
    );
  }, [visible, uri]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: last.current.x, y: last.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        last.current = {
          x: last.current.x + g.dx,
          y: last.current.y + g.dy,
        };
        pan.flattenOffset();
      },
    }),
  ).current;

  // Display: image fills frame (cover), user pans to reposition
  const displayScale = imgSize
    ? Math.max(frameW / imgSize.w, frameH / imgSize.h)
    : 1;
  const dispW = imgSize ? imgSize.w * displayScale : frameW;
  const dispH = imgSize ? imgSize.h * displayScale : frameH;

  const apply = async () => {
    if (!uri || !imgSize) return onClose();
    setBusy(true);
    try {
      // image is centered with offset (last.current)
      // visible region in display coords = [frameLeft, frameTop, frameW, frameH]
      // image left in display coords = (frameW - dispW)/2 + last.current.x
      const imgLeftDisp = (frameW - dispW) / 2 + last.current.x;
      const imgTopDisp = (frameH - dispH) / 2 + last.current.y;
      const visLeftDisp = -imgLeftDisp;
      const visTopDisp = -imgTopDisp;
      // Convert to source pixels
      const sx = Math.max(0, visLeftDisp / displayScale);
      const sy = Math.max(0, visTopDisp / displayScale);
      const sw = Math.min(imgSize.w - sx, frameW / displayScale);
      const sh = Math.min(imgSize.h - sy, frameH / displayScale);
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop: { originX: sx, originY: sy, width: sw, height: sh } }],
        { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG },
      );
      onApply(result.uri);
    } catch {
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={st.cropBackdrop}>
        <View style={st.cropHeader}>
          <TouchableOpacity onPress={onClose} style={st.cropHeaderBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={st.cropTitle}>Manual Crop · 9:16</Text>
          <TouchableOpacity onPress={apply} disabled={busy} style={st.cropHeaderBtn}>
            {busy ? (
              <ActivityIndicator size="small" color={Z_GREEN} />
            ) : (
              <Ionicons name="checkmark" size={26} color={Z_GREEN} />
            )}
          </TouchableOpacity>
        </View>

        <View style={[st.cropFrame, { width: frameW, height: frameH }]}>
          <View style={st.cropImageClip}>
            <Animated.View
              {...responder.panHandlers}
              style={{
                width: dispW,
                height: dispH,
                position: "absolute",
                left: (frameW - dispW) / 2,
                top: (frameH - dispH) / 2,
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
              }}
            >
              {uri && (
                <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
              )}
            </Animated.View>
          </View>
          <View pointerEvents="none" style={st.cropGridOverlay}>
            <View style={st.cropGridLineV1} />
            <View style={st.cropGridLineV2} />
            <View style={st.cropGridLineH1} />
            <View style={st.cropGridLineH2} />
          </View>
        </View>

        <Text style={st.cropHint}>Drag the image to reposition · Tap ✓ to apply</Text>
      </View>
    </Modal>
  );
}

// ── Audience Sheet (kept simple for new minimal UI) ────────────────────────
function AudienceSheet({
  visible,
  onClose,
  isCloseFriends,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  isCloseFriends: boolean;
  onSelect: (cf: boolean) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} />
      <View style={[st.sheet, { backgroundColor: Z_PANEL, borderColor: Z_BORDER }]}>
        <View style={st.handle} />
        <Text style={st.sheetTitle}>Audience</Text>

        <TouchableOpacity
          style={[st.audOpt, { borderColor: !isCloseFriends ? Z_BLUE : Z_BORDER }]}
          onPress={() => { onSelect(false); onClose(); }}
        >
          <Ionicons name="globe-outline" size={20} color={!isCloseFriends ? Z_BLUE : Z_MUTED} />
          <Text style={[st.audOptText, { color: !isCloseFriends ? Z_BLUE : Z_TEXT }]}>Public</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[st.audOpt, { borderColor: isCloseFriends ? Z_GREEN : Z_BORDER }]}
          onPress={() => { onSelect(true); onClose(); }}
        >
          <Ionicons name="star" size={20} color={isCloseFriends ? Z_GREEN : Z_MUTED} />
          <Text style={[st.audOptText, { color: isCloseFriends ? Z_GREEN : Z_TEXT }]}>Close Friends</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── MAIN: Create Story Screen ──────────────────────────────────────────────
export default function CreateStoryScreen() {
  const params = useLocalSearchParams<{
    sharedType?: string;
    sharedId?: string;
    originalStoryId?: string;
    sharedMediaUrl?: string;
    sharedCaption?: string;
    sharedCreatorName?: string;
    sharedCreatorId?: string;
    sharedCreatorAvatar?: string;
    mode?: string;
  }>();

  const { addStory, users, currentUser, closeFriendsList, updateCloseFriendsList } = useApp();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const topPad = Platform.OS === "web" ? 16 : insets.top;

  // ─ State
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [textBgIdx, setTextBgIdx] = useState(0);
  const [textBgImage, setTextBgImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftHighlight, setDraftHighlight] = useState<HighlightId>("classic");
  const [draftAlign, setDraftAlign] = useState<AlignId>("center");
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTool, setSidebarTool] = useState<null | "filter">(null);
  const [showCrop, setShowCrop] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  const [showAudience, setShowAudience] = useState(false);
  const [textMode, setTextMode] = useState<boolean>(params.mode === "text");
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  // ─ Shared post (repost) — full-screen sticker, no separate background screen
  const sharedPost = params.sharedId
    ? {
        id: params.sharedId,
        type: (params.sharedType as "post" | "reel" | "story") || "post",
        mediaUrl: params.sharedMediaUrl,
        caption: params.sharedCaption,
        creatorName: params.sharedCreatorName,
        creatorId: params.sharedCreatorId,
        creatorAvatar: params.sharedCreatorAvatar,
        originalStoryId: params.originalStoryId,
      }
    : undefined;

  const hasMedia = !!mediaUri;
  const hasShared = !!sharedPost;
  // Effective canvas mode
  const inTextMode = !hasMedia && !hasShared && textMode;
  const showPickerLanding = !hasMedia && !hasShared && !textMode;

  // ─ Mention search inside text editor
  useEffect(() => {
    const m = draftText.match(/@([\w\u0600-\u06FF]*)$/);
    if (m) {
      setMentionQuery(m[1].toLowerCase());
      setShowMentionPicker(true);
    } else {
      setShowMentionPicker(false);
      setMentionQuery("");
    }
  }, [draftText]);

  const mentionResults = useMemo(() => {
    return users
      .filter((u) => u.id !== currentUser?.id)
      .filter((u) =>
        (u.username || "").toLowerCase().includes(mentionQuery) ||
        u.name.toLowerCase().includes(mentionQuery),
      )
      .slice(0, 6);
  }, [users, currentUser?.id, mentionQuery]);

  const parsedMentionUsers = useMemo(() => {
    const found: User[] = [];
    const allText = overlays.map((o) => o.text).join(" ");
    const regex = /@([\w\u0600-\u06FF]+)/g;
    let match;
    while ((match = regex.exec(allText)) !== null) {
      const handle = match[1].toLowerCase();
      const u = users.find((x) =>
        x.id !== currentUser?.id &&
        (x.username?.toLowerCase() === handle ||
          x.name.toLowerCase().replace(/\s+/g, "_") === handle ||
          x.email.toLowerCase() === handle),
      );
      if (u && !found.some((y) => y.id === u.id)) found.push(u);
    }
    return found;
  }, [overlays, users, currentUser?.id]);

  // ─ Media picker (gallery)
  const handlePickMedia = async () => {
    if (Platform.OS === "web") {
      showToast("Media picking unavailable on web preview", "info");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast("Gallery permission required", "error");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type === "video" ? "video" : "image");
      setSelectedFilter("none");
      setTextMode(false);
    }
  };

  const pickTextBgFromGallery = async () => {
    if (Platform.OS === "web") {
      showToast("Gallery unavailable on web preview", "info");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast("Gallery permission required", "error");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setTextBgImage(result.assets[0].uri);
    }
  };

  // ─ Image manipulation (instant rotate / flip)
  const transformImage = async (actions: ImageManipulator.Action[]) => {
    if (!mediaUri || mediaType !== "image") return;
    try {
      const result = await ImageManipulator.manipulateAsync(mediaUri, actions, {
        compress: 0.92,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      setMediaUri(result.uri);
    } catch {
      showToast("Transform failed", "error");
    }
  };

  // ─ Text overlay create/update
  const openTextEditor = (existing?: TextOverlay) => {
    if (existing) {
      setEditingId(existing.id);
      setDraftText(existing.text);
      setDraftHighlight(existing.highlight);
      setDraftAlign(existing.align);
    } else {
      setEditingId(null);
      setDraftText("");
      setDraftHighlight("classic");
      setDraftAlign("center");
    }
  };

  const closeTextEditor = (commit: boolean) => {
    if (commit && draftText.trim()) {
      if (editingId) {
        setOverlays((prev) =>
          prev.map((o) =>
            o.id === editingId
              ? { ...o, text: draftText.trim(), highlight: draftHighlight, align: draftAlign }
              : o,
          ),
        );
      } else {
        const id = `ov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        setOverlays((prev) => [
          ...prev,
          {
            id,
            text: draftText.trim(),
            x: 0,
            y: 0,
            scale: 1,
            highlight: draftHighlight,
            align: draftAlign,
          },
        ]);
        setActiveOverlayId(id);
      }
    }
    setEditingId(null);
    setDraftText("");
    setShowMentionPicker(false);
  };

  const insertMention = (u: User) => {
    const handle = u.username || u.name.replace(/\s+/g, "_");
    const next = draftText.replace(/@([\w\u0600-\u06FF]*)$/, `@${handle} `);
    setDraftText(next);
    setShowMentionPicker(false);
  };

  // ─ Sidebar tools
  const sidebarTools: {
    id: string;
    icon: keyof typeof Ionicons.glyphMap | { mci: keyof typeof MaterialCommunityIcons.glyphMap };
    color: string;
    onPress: () => void;
  }[] = [
    {
      id: "crop",
      icon: "crop-outline",
      color: Z_BLUE,
      onPress: () => {
        if (mediaType !== "image" || !mediaUri) {
          showToast("Crop available for images only", "info");
          return;
        }
        setShowCrop(true);
      },
    },
    {
      id: "rotate",
      icon: "refresh-outline",
      color: Z_BLUE,
      onPress: () => transformImage([{ rotate: 90 }]),
    },
    {
      id: "flip",
      icon: "swap-horizontal-outline",
      color: Z_BLUE,
      onPress: () => transformImage([{ flip: ImageManipulator.FlipType.Horizontal }]),
    },
    {
      id: "filter",
      icon: { mci: "image-filter-vintage" },
      color: Z_GREEN,
      onPress: () => setSidebarTool((s) => (s === "filter" ? null : "filter")),
    },
    {
      id: "text",
      icon: "text-outline",
      color: Z_GREEN,
      onPress: () => openTextEditor(),
    },
  ];

  // ─ Publish
  const handlePublish = async () => {
    if (!mediaUri && !sharedPost && overlays.length === 0) {
      showToast("Add media or text first", "error");
      return;
    }
    setPublishing(true);
    try {
      let finalUri = mediaUri || sharedPost?.mediaUrl || textBgImage || "";
      if (mediaUri && mediaType === "image" && selectedFilter !== "none") {
        finalUri = await bakeFilter(mediaUri, selectedFilter);
      }
      const captionFromOverlays = overlays.map((o) => o.text).join("\n").trim() || undefined;
      if (isCloseFriends) updateCloseFriendsList(closeFriendsList);

      // Pass overlays as draggable label data
      const overlayData = overlays.map((o) => ({ text: o.text }));

      await addStory(
        finalUri,
        mediaType,
        captionFromOverlays,
        selectedFilter,
        isCloseFriends,
        parsedMentionUsers.map((u) => u.id),
        sharedPost,
        overlayData,
      );
      showToast(isCloseFriends ? "Posted to Close Friends" : "Story posted!", "success");
      router.back();
    } catch {
      showToast("Failed to publish", "error");
    } finally {
      setPublishing(false);
    }
  };

  const [composerOpen, setComposerOpen] = useState(false);

  // Helper to invoke editor properly
  const startEditor = (existing?: TextOverlay) => {
    openTextEditor(existing);
    setComposerOpen(true);
    setActiveOverlayId(existing?.id || null);
  };

  // Auto-open composer when entering text mode with no overlays
  useEffect(() => {
    if (textMode && overlays.length === 0 && !composerOpen) {
      startEditor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textMode]);

  return (
    <KeyboardAvoidingView
      style={st.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ═══════════════ FULL-SCREEN CANVAS ═══════════════ */}
      <View style={st.canvas}>
        {/* Canvas background layer */}
        {mediaUri ? (
          <>
            <Image source={{ uri: mediaUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <FilterPreviewOverlay filter={selectedFilter} />
          </>
        ) : sharedPost ? (
          // Repost full-screen: sticker over creator's media or gradient bg
          <>
            {sharedPost.mediaUrl ? (
              <Image source={{ uri: sharedPost.mediaUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={28} />
            ) : (
              <LinearGradient
                colors={TEXT_BACKGROUNDS[textBgIdx].colors}
                style={StyleSheet.absoluteFill}
              />
            )}
            <View style={st.repostStickerWrap} pointerEvents="none">
              <View style={st.repostSticker}>
                {sharedPost.mediaUrl ? (
                  <Image source={{ uri: sharedPost.mediaUrl }} style={st.repostStickerMedia} resizeMode="cover" />
                ) : (
                  <View style={[st.repostStickerMedia, { backgroundColor: "#222", alignItems: "center", justifyContent: "center" }]}>
                    <Ionicons name={sharedPost.type === "reel" ? "film" : "image"} size={48} color={Z_BLUE} />
                  </View>
                )}
                <View style={st.repostStickerFooter}>
                  {sharedPost.creatorAvatar ? (
                    <Image source={{ uri: sharedPost.creatorAvatar }} style={st.repostStickerAvatar} />
                  ) : (
                    <View style={[st.repostStickerAvatar, { backgroundColor: Z_BLUE }]} />
                  )}
                  <Text style={st.repostStickerName} numberOfLines={1}>
                    @{sharedPost.creatorName || "user"}
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          // Text-only or empty
          <>
            {textBgImage ? (
              <Image source={{ uri: textBgImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={TEXT_BACKGROUNDS[textBgIdx].colors}
                style={StyleSheet.absoluteFill}
              />
            )}
          </>
        )}

        {/* Draggable text overlays */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setActiveOverlayId(null)}
        >
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {overlays.map((o) => (
              <DraggableText
                key={o.id}
                overlay={o}
                active={activeOverlayId === o.id}
                onActivate={() => setActiveOverlayId(o.id)}
                onDelete={() => {
                  setOverlays((prev) => prev.filter((x) => x.id !== o.id));
                  setActiveOverlayId(null);
                }}
                onChange={(p) =>
                  setOverlays((prev) => prev.map((x) => (x.id === o.id ? { ...x, ...p } : x)))
                }
                onEdit={() => startEditor(o)}
              />
            ))}
          </View>
        </Pressable>

        {/* ─── Top bar: close + single Edit icon ─── */}
        <View style={[st.topBar, { paddingTop: topPad + 6 }]}>
          <TouchableOpacity onPress={() => router.back()} style={st.iconBtn}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {(hasMedia || hasShared || inTextMode) && (
            <TouchableOpacity
              onPress={() => setShowSidebar((s) => !s)}
              style={[st.editPill, showSidebar && { borderColor: Z_GREEN }]}
            >
              <Ionicons name={showSidebar ? "checkmark" : "create-outline"} size={18} color={showSidebar ? Z_GREEN : Z_BLUE} />
              <Text style={[st.editPillText, { color: showSidebar ? Z_GREEN : Z_BLUE }]}>
                {showSidebar ? "Done" : "Edit"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Right Vertical Sidebar (icons only) ─── */}
        {showSidebar && (
          <View style={[st.sidebar, { top: topPad + 70 }]}>
            {sidebarTools.map((t) => (
              <TouchableOpacity key={t.id} onPress={t.onPress} style={st.sidebarBtn} activeOpacity={0.7}>
                {typeof t.icon === "string" ? (
                  <Ionicons name={t.icon as any} size={22} color={t.color} />
                ) : (
                  <MaterialCommunityIcons name={t.icon.mci} size={22} color={t.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── Filter horizontal swipe (only when filter tool selected) ─── */}
        {showSidebar && sidebarTool === "filter" && hasMedia && mediaType === "image" && (
          <View style={[st.filterStrip, { bottom: insets.bottom + 100 }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 14, gap: 10 }}
            >
              {STORY_FILTERS.map((f) => {
                const active = selectedFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setSelectedFilter(f.key)}
                    style={[
                      st.filterChip,
                      { borderColor: active ? Z_GREEN : "rgba(255,255,255,0.2)" },
                      active && { backgroundColor: "rgba(0,230,118,0.15)" },
                    ]}
                  >
                    <Text style={[st.filterChipText, { color: active ? Z_GREEN : "#fff" }]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ─── Text-only background palette ─── */}
        {inTextMode && !composerOpen && (
          <View style={[st.bgPalette, { bottom: insets.bottom + 90 }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingHorizontal: 14 }}
            >
              <TouchableOpacity onPress={pickTextBgFromGallery} style={st.bgPlusBtn}>
                <Ionicons name="add" size={22} color={Z_GREEN} />
              </TouchableOpacity>
              {TEXT_BACKGROUNDS.map((bg, i) => {
                const active = !textBgImage && i === textBgIdx;
                return (
                  <TouchableOpacity
                    key={bg.id}
                    onPress={() => { setTextBgIdx(i); setTextBgImage(null); }}
                    style={[st.bgCircleWrap, active && { borderColor: Z_GREEN, borderWidth: 2 }]}
                  >
                    <LinearGradient colors={bg.colors} style={st.bgCircle} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ─── Landing picker (only when nothing selected) ─── */}
        {showPickerLanding && (
          <View style={st.landing}>
            <Text style={st.landingTitle}>Create a Story</Text>
            <View style={st.landingRow}>
              <TouchableOpacity style={[st.landingBtn, { borderColor: Z_BLUE }]} onPress={handlePickMedia} activeOpacity={0.85}>
                <Ionicons name="images-outline" size={28} color={Z_BLUE} />
                <Text style={[st.landingBtnText, { color: Z_BLUE }]}>Photo / Video</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.landingBtn, { borderColor: Z_GREEN }]}
                onPress={() => setTextMode(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="text" size={28} color={Z_GREEN} />
                <Text style={[st.landingBtnText, { color: Z_GREEN }]}>Create Text Story</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Bottom bar: Audience + Publish ─── */}
        {(hasMedia || hasShared || inTextMode) && !composerOpen && (
          <View style={[st.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              style={[st.audPill, { borderColor: isCloseFriends ? Z_GREEN : Z_BLUE }]}
              onPress={() => setShowAudience(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isCloseFriends ? "star" : "globe-outline"}
                size={16}
                color={isCloseFriends ? Z_GREEN : Z_BLUE}
              />
              <Text style={[st.audPillText, { color: isCloseFriends ? Z_GREEN : Z_BLUE }]}>
                {isCloseFriends ? "Close Friends" : "Public"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[st.publishBtn, { backgroundColor: isCloseFriends ? Z_GREEN : Z_BLUE }]}
              onPress={handlePublish}
              disabled={publishing}
              activeOpacity={0.85}
            >
              {publishing ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Text style={st.publishBtnText}>Share</Text>
                  <Ionicons name="arrow-forward" size={18} color="#000" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ═══════════════ TEXT COMPOSER OVERLAY ═══════════════ */}
      {composerOpen && (
        <View style={st.composerWrap} pointerEvents="box-none">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => { closeTextEditor(true); setComposerOpen(false); }}
          />
          <View style={st.composerCenter} pointerEvents="box-none">
            <View style={[st.composerBubble, highlightStyle(draftHighlight).wrap]}>
              <TextInput
                value={draftText}
                onChangeText={setDraftText}
                placeholder="Type something..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                autoFocus
                multiline
                style={[
                  highlightStyle(draftHighlight).text,
                  {
                    fontSize: 28,
                    fontFamily: "Inter_700Bold",
                    textAlign: draftAlign,
                    minWidth: 160,
                    maxWidth: SCREEN.width - 60,
                  },
                ]}
              />
            </View>

            {/* Mention picker */}
            {showMentionPicker && mentionResults.length > 0 && (
              <View style={st.mentionPicker}>
                <FlatList
                  data={mentionResults}
                  keyExtractor={(u) => u.id}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => {
                    const color = ACCENT_COLORS[(item.name?.length ?? 0) % ACCENT_COLORS.length];
                    return (
                      <TouchableOpacity style={st.mentionRow} onPress={() => insertMention(item)}>
                        <View style={[st.mentionAvatar, { backgroundColor: `${color}40` }]}>
                          {item.avatar ? (
                            <Image source={{ uri: item.avatar }} style={StyleSheet.absoluteFill as any} />
                          ) : (
                            <Text style={{ color, fontFamily: "Inter_700Bold" }}>
                              {item.name[0]?.toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={st.mentionName}>{item.name}</Text>
                          {item.username ? (
                            <Text style={st.mentionHandle}>@{item.username}</Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}
          </View>

          {/* Styling Bar */}
          <View style={[st.styleBar, { paddingBottom: insets.bottom + 14 }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, alignItems: "center" }}
            >
              {/* Alignment toggle */}
              <TouchableOpacity
                style={st.alignBtn}
                onPress={() =>
                  setDraftAlign((a) => (a === "left" ? "center" : a === "center" ? "right" : "left"))
                }
              >
                <Ionicons
                  name={
                    draftAlign === "left"
                      ? "reorder-three-outline"
                      : draftAlign === "center"
                      ? "menu-outline"
                      : "reorder-three-outline"
                  }
                  size={20}
                  color={Z_GREEN}
                  style={draftAlign === "right" ? { transform: [{ scaleX: -1 }] } : undefined}
                />
              </TouchableOpacity>

              {/* Highlight chips */}
              {HIGHLIGHT_STYLES.map((h) => {
                const active = draftHighlight === h.id;
                return (
                  <TouchableOpacity
                    key={h.id}
                    onPress={() => setDraftHighlight(h.id)}
                    style={[
                      st.hChip,
                      { borderColor: active ? Z_GREEN : "rgba(255,255,255,0.18)" },
                      active && { backgroundColor: "rgba(0,230,118,0.15)" },
                    ]}
                  >
                    <Text style={[st.hChipText, { color: active ? Z_GREEN : "#fff" }]}>
                      {h.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[st.doneBtn, { backgroundColor: Z_GREEN }]}
              onPress={() => { closeTextEditor(true); setComposerOpen(false); }}
            >
              <Text style={st.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ═══════════════ MODALS ═══════════════ */}
      <CropModal
        visible={showCrop}
        uri={mediaUri}
        onClose={() => setShowCrop(false)}
        onApply={(uri) => { setMediaUri(uri); setShowCrop(false); }}
      />

      <AudienceSheet
        visible={showAudience}
        onClose={() => setShowAudience(false)}
        isCloseFriends={isCloseFriends}
        onSelect={setIsCloseFriends}
      />
    </KeyboardAvoidingView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Z_BG },
  canvas: { flex: 1, backgroundColor: Z_BG, position: "relative", overflow: "hidden" },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 6,
    zIndex: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  editPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderColor: Z_BLUE,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editPillText: { fontFamily: "Inter_700Bold", fontSize: 13 },

  sidebar: {
    position: "absolute",
    right: 12,
    backgroundColor: "rgba(10,10,10,0.85)",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 16,
    borderWidth: 1,
    borderColor: Z_BORDER,
    zIndex: 19,
  },
  sidebarBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  filterStrip: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  filterChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },

  bgPalette: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  bgCircleWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  bgCircle: { flex: 1 },
  bgPlusBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Z_GREEN,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  landing: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 24,
  },
  landingTitle: { color: "#fff", fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 8 },
  landingRow: { flexDirection: "row", gap: 14 },
  landingBtn: {
    flex: 1,
    minWidth: 130,
    borderWidth: 1.5,
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  landingBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, textAlign: "center" },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 18,
  },
  audPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  audPillText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  publishBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 24,
  },
  publishBtnText: { color: "#000", fontFamily: "Inter_700Bold", fontSize: 15 },

  // Repost sticker
  repostStickerWrap: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  repostSticker: {
    width: SCREEN.width * 0.78,
    aspectRatio: 9 / 14,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 2,
    borderColor: Z_BLUE,
    overflow: "hidden",
  },
  repostStickerMedia: { flex: 1, width: "100%" },
  repostStickerFooter: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  repostStickerAvatar: { width: 22, height: 22, borderRadius: 11 },
  repostStickerName: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },

  // Draggable text
  draggableBox: { position: "absolute", top: "40%", left: "12%" },
  deleteHandle: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  scaleHandle: {
    position: "absolute",
    bottom: -10,
    right: -10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Z_BLUE,
    alignItems: "center",
    justifyContent: "center",
  },

  // Composer
  composerWrap: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    zIndex: 30,
  },
  composerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  composerBubble: {
    minHeight: 60,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  mentionPicker: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    maxHeight: 240,
    backgroundColor: Z_PANEL,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Z_BORDER,
    overflow: "hidden",
  },
  mentionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
  },
  mentionAvatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  mentionName: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  mentionHandle: { color: Z_MUTED, fontFamily: "Inter_400Regular", fontSize: 11 },

  styleBar: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    paddingTop: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  alignBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  hChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  hChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  doneBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
  },
  doneBtnText: { color: "#000", fontFamily: "Inter_700Bold", fontSize: 13 },

  // Crop modal
  cropBackdrop: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  cropHeader: {
    position: "absolute",
    top: 50,
    left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cropHeaderBtn: { padding: 8 },
  cropTitle: { flex: 1, color: "#fff", textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 15 },
  cropFrame: {
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Z_GREEN,
    backgroundColor: "#111",
  },
  cropImageClip: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  cropGridOverlay: { ...StyleSheet.absoluteFillObject },
  cropGridLineV1: { position: "absolute", top: 0, bottom: 0, left: "33%", width: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  cropGridLineV2: { position: "absolute", top: 0, bottom: 0, left: "66%", width: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  cropGridLineH1: { position: "absolute", left: 0, right: 0, top: "33%", height: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  cropGridLineH2: { position: "absolute", left: 0, right: 0, top: "66%", height: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  cropHint: { position: "absolute", bottom: 50, color: Z_MUTED, fontFamily: "Inter_400Regular", fontSize: 12 },

  // Sheets
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 18,
    paddingBottom: 36,
    gap: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", backgroundColor: Z_BORDER, marginBottom: 8 },
  sheetTitle: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center" },
  audOpt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
  },
  audOptText: { fontFamily: "Inter_700Bold", fontSize: 15 },
});
