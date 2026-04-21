import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ACCENT_COLORS } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { User } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

// ────────────────────────────────────────────────────────────────────────────
// THEME (Strict Zentram Dark)
// ────────────────────────────────────────────────────────────────────────────
const Z_BG = "#000000";
const Z_PANEL = "#0A0A0A";
const Z_BORDER = "rgba(255,255,255,0.08)";
const Z_BLUE = "#3D91F4";   // Electric Blue
const Z_GREEN = "#00E676";  // Vibrant Green
const Z_TEXT = "#FFFFFF";
const Z_MUTED = "rgba(255,255,255,0.55)";
const Z_INPUT_BG = "rgba(0,0,0,0.55)"; // semi-transparent black

// ────────────────────────────────────────────────────────────────────────────
// ARABIC STRINGS
// ────────────────────────────────────────────────────────────────────────────
const T = {
  createStory: "إنشاء قصة",
  photoVideo: "صورة / فيديو",
  textStory: "قصة نصية",
  edit: "تعديل",
  done: "تم",
  share: "نشر",
  audience: "الجمهور",
  publicLabel: "عام",
  closeFriends: "أصدقاء مقربون",
  noFollowers: "لا يوجد متابعون",
  searchFollowers: "ابحث في المتابعين...",
  save: "حفظ",
  manualCrop: "قص يدوي · 9:16",
  cropHint: "اسحب الزوايا لتحديد منطقة القص",
  apply: "تطبيق",
  type: "اكتب شيئاً...",
  classic: "كلاسيكي",
  neon: "نيون",
  block: "بلوك",
  plain: "شفاف",
  pickMedia: "اختر صورة أو فيديو",
  permissionGallery: "يرجى السماح بالوصول للمعرض",
  permissionDenied: "تم رفض الإذن",
  selectMediaFirst: "اختر وسائط أولاً",
  cropImageOnly: "القص يعمل على الصور فقط",
  postedPublic: "تم نشر القصة",
  postedCF: "تم النشر للأصدقاء المقربين",
  publishFailed: "فشل النشر",
  needContent: "أضف وسائط أو نصاً",
};

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────
const STORY_FILTERS = [
  { key: "none", label: "الأصلي" },
  { key: "warm", label: "دافئ" },
  { key: "cool", label: "بارد" },
  { key: "vintage", label: "فينتاج" },
  { key: "grayscale", label: "أبيض وأسود" },
  { key: "sepia", label: "سيبيا" },
];

const TEXT_BACKGROUNDS: { id: string; colors: [string, string] }[] = [
  { id: "midnight", colors: ["#000000", "#1A1A2E"] },
  { id: "sunset", colors: ["#FF512F", "#DD2476"] },
  { id: "ocean", colors: ["#0072FF", "#00C6FF"] },
  { id: "forest", colors: ["#11998E", "#38EF7D"] },
  { id: "violet", colors: ["#8E2DE2", "#4A00E0"] },
  { id: "fire", colors: ["#F12711", "#F5AF19"] },
  { id: "rose", colors: ["#FF0844", "#FFB199"] },
  { id: "neon", colors: ["#00F260", "#0575E6"] },
];

const HIGHLIGHT_STYLES = [
  { id: "classic", label: T.classic },
  { id: "neon", label: T.neon },
  { id: "block", label: T.block },
  { id: "transparent", label: T.plain },
] as const;

type HighlightId = (typeof HIGHLIGHT_STYLES)[number]["id"];
type AlignId = "left" | "center" | "right";

type TextOverlay = {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  highlight: HighlightId;
  align: AlignId;
};

const SCREEN = Dimensions.get("window");

// ────────────────────────────────────────────────────────────────────────────
// FILTER UTILITIES
// ────────────────────────────────────────────────────────────────────────────
function filterOverlayColor(filter: string): string | null {
  const overlays: Record<string, string> = {
    warm: "rgba(255,120,0,0.25)",
    cool: "rgba(0,100,255,0.22)",
    vintage: "rgba(160,100,40,0.28)",
    grayscale: "rgba(128,128,128,0.0)",
    sepia: "rgba(112,66,20,0.35)",
  };
  return overlays[filter] || null;
}

function webFilterCss(filter: string): any {
  if (Platform.OS !== "web") return undefined;
  switch (filter) {
    case "grayscale":
      return { filter: "grayscale(100%)" };
    case "sepia":
      return { filter: "sepia(80%)" };
    case "warm":
      return { filter: "saturate(140%) hue-rotate(-10deg)" };
    case "cool":
      return { filter: "saturate(120%) hue-rotate(15deg)" };
    case "vintage":
      return { filter: "contrast(90%) sepia(40%) saturate(120%)" };
    default:
      return undefined;
  }
}

function FilterOverlay({ filter }: { filter: string }) {
  const c = filterOverlayColor(filter);
  if (!c || filter === "none") return null;
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: c }]} />;
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

// ────────────────────────────────────────────────────────────────────────────
// HIGHLIGHT VISUAL STYLES
// ────────────────────────────────────────────────────────────────────────────
function highlightStyle(h: HighlightId): { wrap: any; text: any } {
  switch (h) {
    case "neon":
      return {
        wrap: { backgroundColor: "transparent", paddingHorizontal: 6, paddingVertical: 4 },
        text: { color: Z_GREEN, textShadowColor: Z_GREEN, textShadowRadius: 12 },
      };
    case "block":
      return {
        wrap: { backgroundColor: "#FFFFFF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
        text: { color: "#000000" },
      };
    case "transparent":
      return {
        wrap: { backgroundColor: "transparent", paddingHorizontal: 6, paddingVertical: 4 },
        text: { color: "#FFFFFF", textShadowColor: "rgba(0,0,0,0.65)", textShadowRadius: 8 },
      };
    case "classic":
    default:
      return {
        wrap: { backgroundColor: Z_INPUT_BG, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
        text: { color: "#FFFFFF" },
      };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// VIDEO PLAYER (preview with optional CSS filter on web)
// ────────────────────────────────────────────────────────────────────────────
function VideoPreview({ uri, filter }: { uri: string; filter: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <View style={[StyleSheet.absoluteFill, webFilterCss(filter)]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DRAGGABLE TEXT OVERLAY
// Gestures:
//  - Single-tap        → activate
//  - Double-tap        → edit
//  - Pan (1 finger)    → move
//  - Pinch (2 fingers) → linear scale via event.scale
//  - Scale handle drag → linear scale: NewScale = StartScale * (CurrentDist / StartDist)
//  - Rotate handle drag→ continuous angular rotation
// ────────────────────────────────────────────────────────────────────────────
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
  const scaleRef = useRef(overlay.scale);
  const rotRef = useRef(overlay.rotation);
  const [, force] = useState(0);
  const wrapRef = useRef<View>(null);
  const wrapCenter = useRef({ x: 0, y: 0 });

  // Sync external changes to refs
  useEffect(() => {
    pan.setValue({ x: overlay.x, y: overlay.y });
    lastPos.current = { x: overlay.x, y: overlay.y };
    scaleRef.current = overlay.scale;
    rotRef.current = overlay.rotation;
    force((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay.id]);

  // Continuously cache wrap center in window coords (re-measured on layout/active changes)
  const remeasure = () => {
    setTimeout(() => {
      wrapRef.current?.measureInWindow((x, y, w, h) => {
        wrapCenter.current = { x: x + w / 2, y: y + h / 2 };
      });
    }, 0);
  };
  useEffect(() => {
    remeasure();
  }, [overlay.id, active, overlay.x, overlay.y]);

  // ── PAN (move text) ──
  const panStart = useRef({ x: 0, y: 0 });
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .maxPointers(1)
    .minDistance(2)
    .onBegin(() => {
      onActivate();
      panStart.current = { x: lastPos.current.x, y: lastPos.current.y };
      pan.setOffset(panStart.current);
      pan.setValue({ x: 0, y: 0 });
    })
    .onUpdate((e) => {
      pan.setValue({ x: e.translationX, y: e.translationY });
    })
    .onEnd((e) => {
      const nx = panStart.current.x + e.translationX;
      const ny = panStart.current.y + e.translationY;
      lastPos.current = { x: nx, y: ny };
      pan.flattenOffset();
      onChange({ x: nx, y: ny });
      remeasure();
    });

  // ── PINCH (two-finger zoom) ──
  const pinchStart = useRef(1);
  const pinchGesture = Gesture.Pinch()
    .runOnJS(true)
    .onBegin(() => {
      pinchStart.current = scaleRef.current;
      onActivate();
    })
    .onUpdate((e) => {
      const next = Math.max(0.4, Math.min(6, pinchStart.current * e.scale));
      scaleRef.current = next;
      force((n) => n + 1);
    })
    .onEnd(() => {
      onChange({ scale: scaleRef.current });
    });

  // ── DOUBLE TAP (edit) ──
  const doubleTap = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(2)
    .maxDuration(280)
    .onEnd((_e, success) => {
      if (success) onEdit();
    });

  // ── SINGLE TAP (activate, only if not consumed by double-tap) ──
  const singleTap = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(1)
    .maxDuration(220)
    .onEnd((_e, success) => {
      if (success) onActivate();
    });

  const tapGesture = Gesture.Exclusive(doubleTap, singleTap);
  const bodyGesture = Gesture.Race(tapGesture, Gesture.Simultaneous(panGesture, pinchGesture));

  // ── SCALE HANDLE (drag) — proper linear: NewScale = StartScale * (Dist / StartDist) ──
  const scaleStartDist = useRef(0);
  const scaleStartScale = useRef(1);
  const scaleHandleGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      onActivate();
      scaleStartScale.current = scaleRef.current;
      scaleStartDist.current = 0;
      wrapRef.current?.measureInWindow((x, y, w, h) => {
        wrapCenter.current = { x: x + w / 2, y: y + h / 2 };
        scaleStartDist.current = Math.max(
          24,
          Math.hypot(e.absoluteX - wrapCenter.current.x, e.absoluteY - wrapCenter.current.y),
        );
      });
    })
    .onUpdate((e) => {
      // If measure not yet ready, capture on the fly
      if (scaleStartDist.current === 0) {
        scaleStartDist.current = Math.max(
          24,
          Math.hypot(e.absoluteX - wrapCenter.current.x, e.absoluteY - wrapCenter.current.y),
        );
        return;
      }
      const d = Math.max(
        4,
        Math.hypot(e.absoluteX - wrapCenter.current.x, e.absoluteY - wrapCenter.current.y),
      );
      const ratio = d / scaleStartDist.current;
      const next = Math.max(0.4, Math.min(6, scaleStartScale.current * ratio));
      scaleRef.current = next;
      force((n) => n + 1);
    })
    .onEnd(() => {
      onChange({ scale: scaleRef.current });
      remeasure();
    });

  // ── ROTATE HANDLE (drag in arc) — continuous transform: rotate(Xdeg) ──
  const rotStartAngle = useRef(0);
  const rotStartRot = useRef(0);
  const rotReady = useRef(false);
  const rotateHandleGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      onActivate();
      rotStartRot.current = rotRef.current;
      rotReady.current = false;
      wrapRef.current?.measureInWindow((x, y, w, h) => {
        wrapCenter.current = { x: x + w / 2, y: y + h / 2 };
        rotStartAngle.current = Math.atan2(
          e.absoluteY - wrapCenter.current.y,
          e.absoluteX - wrapCenter.current.x,
        );
        rotReady.current = true;
      });
    })
    .onUpdate((e) => {
      if (!rotReady.current) {
        rotStartAngle.current = Math.atan2(
          e.absoluteY - wrapCenter.current.y,
          e.absoluteX - wrapCenter.current.x,
        );
        rotReady.current = true;
        return;
      }
      const a = Math.atan2(
        e.absoluteY - wrapCenter.current.y,
        e.absoluteX - wrapCenter.current.x,
      );
      const delta = a - rotStartAngle.current;
      rotRef.current = rotStartRot.current + (delta * 180) / Math.PI;
      force((n) => n + 1);
    })
    .onEnd(() => {
      onChange({ rotation: rotRef.current });
      remeasure();
    });

  const hs = highlightStyle(overlay.highlight);
  const fontSize = 26 * scaleRef.current;

  return (
    <Animated.View
      ref={wrapRef as any}
      onLayout={remeasure}
      style={[
        st.draggableBox,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate: `${rotRef.current}deg` },
          ],
        },
      ]}
    >
      <GestureDetector gesture={bodyGesture}>
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
                maxWidth: SCREEN.width - 80,
              },
            ]}
          >
            {overlay.text}
          </Text>
        </View>
      </GestureDetector>

      {active && (
        <>
          {/* X delete handle (top-left) */}
          <View style={st.handleDelete}>
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          {/* Rotate handle (top-right) — circular drag */}
          <GestureDetector gesture={rotateHandleGesture}>
            <View style={st.handleRotate}>
              <Ionicons name="sync-outline" size={14} color="#fff" />
            </View>
          </GestureDetector>
          {/* Scale handle (bottom-right) — linear distance scaling */}
          <GestureDetector gesture={scaleHandleGesture}>
            <View style={st.handleScale}>
              <Ionicons name="resize-outline" size={14} color="#fff" />
            </View>
          </GestureDetector>
        </>
      )}
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CORNER-HANDLE CROP MODAL
// ────────────────────────────────────────────────────────────────────────────
type CropRect = { x: number; y: number; w: number; h: number };

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
  const insets = useSafeAreaInsets();
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [busy, setBusy] = useState(false);

  // Display container fits screen with padding
  const PAD = 20;
  const containerW = SCREEN.width - PAD * 2;
  const containerH = SCREEN.height - 220;

  // Computed image fit (contain)
  const fitScale = imgSize
    ? Math.min(containerW / imgSize.w, containerH / imgSize.h)
    : 1;
  const dispW = imgSize ? imgSize.w * fitScale : containerW;
  const dispH = imgSize ? imgSize.h * fitScale : containerH;
  const imgLeft = (containerW - dispW) / 2;
  const imgTop = (containerH - dispH) / 2;

  // Crop rect in display coords (relative to container origin)
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 100, h: 100 });

  useEffect(() => {
    if (!visible || !uri) return;
    Image.getSize(
      uri,
      (w, h) => {
        setImgSize({ w, h });
        // Initial crop: 9:16 centered within image area
        const fs = Math.min(containerW / w, containerH / h);
        const dW = w * fs;
        const dH = h * fs;
        const il = (containerW - dW) / 2;
        const it = (containerH - dH) / 2;
        const targetH = dH;
        const targetW = (targetH * 9) / 16;
        const finalW = Math.min(dW, targetW);
        const finalH = (finalW * 16) / 9;
        setCrop({
          x: il + (dW - finalW) / 2,
          y: it + (dH - finalH) / 2,
          w: finalW,
          h: finalH,
        });
      },
      () => setImgSize(null),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, uri]);

  const cropRef = useRef(crop);
  useEffect(() => { cropRef.current = crop; }, [crop]);

  // Bound crop to image rectangle
  const clampCrop = (c: CropRect): CropRect => {
    const minX = imgLeft;
    const minY = imgTop;
    const maxX = imgLeft + dispW;
    const maxY = imgTop + dispH;
    let { x, y, w, h } = c;
    w = Math.max(60, Math.min(maxX - minX, w));
    h = (w * 16) / 9;
    if (h > maxY - minY) {
      h = maxY - minY;
      w = (h * 9) / 16;
    }
    x = Math.max(minX, Math.min(maxX - w, x));
    y = Math.max(minY, Math.min(maxY - h, y));
    return { x, y, w, h };
  };

  // ─ Move whole crop frame ─
  const startCrop = useRef<CropRect>(crop);
  const moveResp = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { startCrop.current = cropRef.current; },
      onPanResponderMove: (_, g) => {
        setCrop(
          clampCrop({
            x: startCrop.current.x + g.dx,
            y: startCrop.current.y + g.dy,
            w: startCrop.current.w,
            h: startCrop.current.h,
          }),
        );
      },
    }),
  ).current;

  // ─ Corner resize (maintains 9:16) ─
  const cornerStart = useRef<CropRect>(crop);
  const makeCornerResp = (corner: "tl" | "tr" | "bl" | "br") =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { cornerStart.current = cropRef.current; },
      onPanResponderMove: (_, g) => {
        const s = cornerStart.current;
        let dx = g.dx;
        // For each corner, compute new w (and y/x adjusted) maintaining ratio
        let nx = s.x, ny = s.y, nw = s.w;
        switch (corner) {
          case "br":
            nw = s.w + dx;
            break;
          case "tr":
            nw = s.w + dx;
            ny = s.y - ((nw - s.w) * 16) / 9;
            break;
          case "bl":
            nw = s.w - dx;
            nx = s.x + (s.w - nw);
            break;
          case "tl":
            nw = s.w - dx;
            nx = s.x + (s.w - nw);
            ny = s.y - ((nw - s.w) * 16) / 9;
            break;
        }
        const nh = (nw * 16) / 9;
        setCrop(clampCrop({ x: nx, y: ny, w: nw, h: nh }));
      },
    });

  const cornerTL = useRef(makeCornerResp("tl")).current;
  const cornerTR = useRef(makeCornerResp("tr")).current;
  const cornerBL = useRef(makeCornerResp("bl")).current;
  const cornerBR = useRef(makeCornerResp("br")).current;

  const apply = async () => {
    if (!uri || !imgSize) return onClose();
    setBusy(true);
    try {
      // Convert crop (display coords relative to container) to source pixels
      const localX = (crop.x - imgLeft) / fitScale;
      const localY = (crop.y - imgTop) / fitScale;
      const localW = crop.w / fitScale;
      const localH = crop.h / fitScale;
      const sx = Math.max(0, localX);
      const sy = Math.max(0, localY);
      const sw = Math.min(imgSize.w - sx, localW);
      const sh = Math.min(imgSize.h - sy, localH);
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
      <View style={[st.cropBackdrop, { paddingTop: insets.top }]}>
        <View style={st.cropHeader}>
          <TouchableOpacity onPress={onClose} style={st.cropHeaderBtn}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={st.cropTitle}>{T.manualCrop}</Text>
          <TouchableOpacity onPress={apply} disabled={busy} style={st.cropHeaderBtn}>
            {busy ? (
              <ActivityIndicator size="small" color={Z_GREEN} />
            ) : (
              <Ionicons name="checkmark" size={28} color={Z_GREEN} />
            )}
          </TouchableOpacity>
        </View>

        <View style={[st.cropContainer, { width: containerW, height: containerH }]}>
          {uri && imgSize && (
            <Image
              source={{ uri }}
              style={{
                position: "absolute",
                left: imgLeft,
                top: imgTop,
                width: dispW,
                height: dispH,
              }}
              resizeMode="contain"
            />
          )}

          {/* Dark overlays outside crop */}
          <View pointerEvents="none" style={[st.cropMask, { left: 0, top: 0, right: 0, height: crop.y }]} />
          <View pointerEvents="none" style={[st.cropMask, { left: 0, top: crop.y + crop.h, right: 0, bottom: 0 }]} />
          <View pointerEvents="none" style={[st.cropMask, { left: 0, top: crop.y, width: crop.x, height: crop.h }]} />
          <View pointerEvents="none" style={[st.cropMask, { left: crop.x + crop.w, top: crop.y, right: 0, height: crop.h }]} />

          {/* Crop frame */}
          <View
            {...moveResp.panHandlers}
            style={[st.cropFrame, { left: crop.x, top: crop.y, width: crop.w, height: crop.h }]}
          >
            {/* Grid */}
            <View pointerEvents="none" style={st.cropGridLineV1} />
            <View pointerEvents="none" style={st.cropGridLineV2} />
            <View pointerEvents="none" style={st.cropGridLineH1} />
            <View pointerEvents="none" style={st.cropGridLineH2} />
          </View>

          {/* Corner handles (positioned absolute on container) */}
          <View {...cornerTL.panHandlers} style={[st.cornerHandle, { left: crop.x - 18, top: crop.y - 18 }]}>
            <View style={[st.cornerInner, { borderTopWidth: 3, borderLeftWidth: 3 }]} />
          </View>
          <View {...cornerTR.panHandlers} style={[st.cornerHandle, { left: crop.x + crop.w - 18, top: crop.y - 18 }]}>
            <View style={[st.cornerInner, { borderTopWidth: 3, borderRightWidth: 3 }]} />
          </View>
          <View {...cornerBL.panHandlers} style={[st.cornerHandle, { left: crop.x - 18, top: crop.y + crop.h - 18 }]}>
            <View style={[st.cornerInner, { borderBottomWidth: 3, borderLeftWidth: 3 }]} />
          </View>
          <View {...cornerBR.panHandlers} style={[st.cornerHandle, { left: crop.x + crop.w - 18, top: crop.y + crop.h - 18 }]}>
            <View style={[st.cornerInner, { borderBottomWidth: 3, borderRightWidth: 3 }]} />
          </View>
        </View>

        <Text style={[st.cropHint, { paddingBottom: insets.bottom + 16 }]}>
          {T.cropHint}
        </Text>
      </View>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CLOSE FRIENDS PICKER (followers-only search)
// ────────────────────────────────────────────────────────────────────────────
function CloseFriendsModal({
  visible,
  onClose,
  selectedIds,
  onSave,
  followerUsers,
}: {
  visible: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSave: (ids: string[]) => void;
  followerUsers: User[];
}) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (visible) { setSelected(selectedIds); setSearch(""); }
  }, [visible, selectedIds]);

  const filtered = followerUsers.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q)
    );
  });

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} />
      <View style={[st.cfSheet, { backgroundColor: Z_PANEL, paddingBottom: insets.bottom + 24 }]}>
        <View style={st.handle} />
        <Text style={st.sheetTitle}>{T.closeFriends}</Text>

        <View style={st.searchBox}>
          <Ionicons name="search" size={16} color={Z_MUTED} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={T.searchFollowers}
            placeholderTextColor={Z_MUTED}
            style={st.searchInput}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          style={{ maxHeight: 360 }}
          ListEmptyComponent={<Text style={st.emptyText}>{T.noFollowers}</Text>}
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
                  <Text style={st.cfUserName}>{item.name}</Text>
                  {item.username ? <Text style={st.cfUserHandle}>@{item.username}</Text> : null}
                </View>
                <View style={[st.checkbox, { borderColor: isSelected ? Z_GREEN : Z_BORDER, backgroundColor: isSelected ? Z_GREEN : "transparent" }]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#000" />}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity
          style={[st.cfSaveBtn, { backgroundColor: Z_GREEN }]}
          onPress={() => { onSave(selected); onClose(); }}
        >
          <Text style={st.cfSaveBtnText}>
            {T.save} ({selected.length})
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN: Create Story Screen
// ────────────────────────────────────────────────────────────────────────────
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

  const { addStory, users, currentUser, getFollowers, closeFriendsList, updateCloseFriendsList } = useApp();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const topPad = Platform.OS === "web" ? 12 : insets.top;

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
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [showCFModal, setShowCFModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  const [cfList, setCfList] = useState<string[]>(closeFriendsList);
  const [textMode, setTextMode] = useState<boolean>(params.mode === "text");
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);

  // Instagram-style keyboard tracking — toolbar sticks above keyboard
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt as any, (e) => {
      setKbHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvt as any, () => setKbHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // ─ Shared post (repost) — full-screen sticker
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
  const inTextMode = !hasMedia && !hasShared && textMode;
  const showLanding = !hasMedia && !hasShared && !textMode;

  // ─ Mention search inside composer
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

  // ─ Followers list (for Close Friends search)
  const followerUsers = useMemo(() => {
    if (!currentUser) return [];
    const followerIds = getFollowers(currentUser.id).map((f) => f.followerId);
    return users.filter((u) => followerIds.includes(u.id));
  }, [currentUser, getFollowers, users]);

  // ─ Media picker
  const handlePickMedia = async () => {
    if (Platform.OS === "web") {
      showToast("اختيار الوسائط محدود على الويب", "info");
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast(T.permissionGallery, "error");
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { showToast(T.permissionGallery, "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setTextBgImage(result.assets[0].uri);
    }
  };

  const transformImage = async (actions: ImageManipulator.Action[]) => {
    if (!mediaUri || mediaType !== "image") return;
    try {
      const result = await ImageManipulator.manipulateAsync(mediaUri, actions, {
        compress: 0.92,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      setMediaUri(result.uri);
    } catch {
      // ignore
    }
  };

  // ─ Text composer
  const startEditor = (existing?: TextOverlay) => {
    if (existing) {
      setEditingId(existing.id);
      setDraftText(existing.text);
      setDraftHighlight(existing.highlight);
      setDraftAlign(existing.align);
      setActiveOverlayId(existing.id);
    } else {
      setEditingId(null);
      setDraftText("");
      setDraftHighlight("classic");
      setDraftAlign("center");
    }
    setComposerOpen(true);
  };

  const closeComposer = (commit: boolean) => {
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
          { id, text: draftText.trim(), x: 0, y: 0, scale: 1, rotation: 0, highlight: draftHighlight, align: draftAlign },
        ]);
        setActiveOverlayId(id);
      }
    }
    setEditingId(null);
    setDraftText("");
    setShowMentionPicker(false);
    setComposerOpen(false);
  };

  const insertMention = (u: User) => {
    const handle = u.username || u.name.replace(/\s+/g, "_");
    const next = draftText.replace(/@([\w\u0600-\u06FF]*)$/, `@${handle} `);
    setDraftText(next);
    setShowMentionPicker(false);
  };

  // Auto-open composer when entering text mode with no overlays
  useEffect(() => {
    if (textMode && overlays.length === 0 && !composerOpen) {
      startEditor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textMode]);

  // ─ Sidebar tools (Close Friends added)
  type Tool = {
    id: string;
    iconType: "ion" | "mci";
    icon: any;
    color: string;
    onPress: () => void;
    arabicLabel: string;
  };
  const sidebarTools: Tool[] = [
    {
      id: "crop",
      iconType: "ion",
      icon: "crop-outline",
      color: Z_BLUE,
      arabicLabel: "قص",
      onPress: () => {
        if (mediaType !== "image" || !mediaUri) {
          showToast(T.cropImageOnly, "info");
          return;
        }
        setShowCrop(true);
      },
    },
    {
      id: "rotate",
      iconType: "ion",
      icon: "refresh-outline",
      color: Z_BLUE,
      arabicLabel: "تدوير",
      onPress: () => transformImage([{ rotate: 90 }]),
    },
    {
      id: "flip",
      iconType: "ion",
      icon: "swap-horizontal-outline",
      color: Z_BLUE,
      arabicLabel: "قلب",
      onPress: () => transformImage([{ flip: ImageManipulator.FlipType.Horizontal }]),
    },
    {
      id: "filter",
      iconType: "mci",
      icon: "image-filter-vintage",
      color: Z_GREEN,
      arabicLabel: "فلاتر",
      onPress: () => setFilterPanelOpen((s) => !s),
    },
    {
      id: "text",
      iconType: "ion",
      icon: "text-outline",
      color: Z_GREEN,
      arabicLabel: "نص",
      onPress: () => startEditor(),
    },
    {
      id: "closeFriends",
      iconType: "ion",
      icon: "star-outline",
      color: Z_GREEN,
      arabicLabel: T.closeFriends,
      onPress: () => setShowCFModal(true),
    },
  ];

  // ─ Publish
  const handlePublish = async () => {
    if (!mediaUri && !sharedPost && overlays.length === 0) {
      showToast(T.needContent, "error");
      return;
    }
    setPublishing(true);
    try {
      let finalUri = mediaUri || sharedPost?.mediaUrl || textBgImage || "";
      if (mediaUri && mediaType === "image" && selectedFilter !== "none") {
        finalUri = await bakeFilter(mediaUri, selectedFilter);
      }
      const captionFromOverlays = overlays.map((o) => o.text).join("\n").trim() || undefined;
      if (isCloseFriends) updateCloseFriendsList(cfList);

      const overlayData = overlays.map((o) => ({ text: o.text }));
      const mentionsArray = parsedMentionUsers.map((u) => u.id); // always an array

      await addStory(
        finalUri,
        mediaType,
        captionFromOverlays,
        selectedFilter,
        isCloseFriends,
        mentionsArray,
        sharedPost,
        overlayData,
      );
      showToast(isCloseFriends ? T.postedCF : T.postedPublic, "success");
      router.back();
    } catch (err: any) {
      console.error("[create-story] publish failed", err);
      showToast(`${T.publishFailed}: ${err?.message || ""}`, "error");
    } finally {
      setPublishing(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={st.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={st.canvas}>
        {/* ════════ Background canvas layer ════════ */}
        {mediaUri ? (
          mediaType === "video" ? (
            <>
              <VideoPreview uri={mediaUri} filter={selectedFilter} />
              <FilterOverlay filter={selectedFilter} />
            </>
          ) : (
            <>
              <Image
                source={{ uri: mediaUri }}
                style={[StyleSheet.absoluteFill, webFilterCss(selectedFilter)]}
                resizeMode="cover"
              />
              <FilterOverlay filter={selectedFilter} />
            </>
          )
        ) : sharedPost ? (
          // FULL-SCREEN repost: media fills the screen edge-to-edge
          <>
            {sharedPost.mediaUrl ? (
              <Image source={{ uri: sharedPost.mediaUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <LinearGradient colors={TEXT_BACKGROUNDS[textBgIdx].colors} style={StyleSheet.absoluteFill} />
            )}
            {/* Mention attribution badge (small, top-center) */}
            <View pointerEvents="none" style={[st.repostBadge, { top: topPad + 60 }]}>
              {sharedPost.creatorAvatar ? (
                <Image source={{ uri: sharedPost.creatorAvatar }} style={st.repostBadgeAvatar} />
              ) : (
                <View style={[st.repostBadgeAvatar, { backgroundColor: Z_BLUE }]} />
              )}
              <Text style={st.repostBadgeText}>@{sharedPost.creatorName || "user"}</Text>
            </View>
          </>
        ) : (
          <>
            {textBgImage ? (
              <Image source={{ uri: textBgImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <LinearGradient colors={TEXT_BACKGROUNDS[textBgIdx].colors} style={StyleSheet.absoluteFill} />
            )}
          </>
        )}

        {/* ════════ Draggable text overlays (no parent Pressable that would block sidebar) ════════ */}
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

        {/* ════════ Top bar: close + Edit pill ════════ */}
        <View style={[st.topBar, { paddingTop: topPad + 6 }]} pointerEvents="box-none">
          <TouchableOpacity onPress={() => router.back()} style={st.iconBtn}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1 }} pointerEvents="none" />

          {(hasMedia || hasShared || inTextMode) && (
            <TouchableOpacity
              onPress={() => setShowSidebar((s) => !s)}
              style={[st.editPill, showSidebar && { borderColor: Z_GREEN }]}
            >
              <Ionicons name={showSidebar ? "checkmark" : "create-outline"} size={18} color={showSidebar ? Z_GREEN : Z_BLUE} />
              <Text style={[st.editPillText, { color: showSidebar ? Z_GREEN : Z_BLUE }]}>
                {showSidebar ? T.done : T.edit}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ════════ Vertical Sidebar (icons) ════════ */}
        {showSidebar && (
          <View style={[st.sidebar, { top: topPad + 70 }]} pointerEvents="box-none">
            {sidebarTools.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={t.onPress}
                style={st.sidebarBtn}
                activeOpacity={0.6}
              >
                {t.iconType === "ion" ? (
                  <Ionicons name={t.icon} size={22} color={t.color} />
                ) : (
                  <MaterialCommunityIcons name={t.icon} size={22} color={t.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ════════ Filter horizontal swipe (when filter tool active) ════════ */}
        {showSidebar && filterPanelOpen && hasMedia && (
          <View style={[st.filterStrip, { bottom: insets.bottom + 100 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10 }}>
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

        {/* ════════ Text-only background palette ════════ */}
        {inTextMode && !composerOpen && (
          <View style={[st.bgPalette, { bottom: insets.bottom + 90 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 14 }}>
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

        {/* ════════ Landing chooser ════════ */}
        {showLanding && (
          <View style={st.landing} pointerEvents="box-none">
            <Text style={st.landingTitle}>{T.createStory}</Text>
            <View style={st.landingRow}>
              <TouchableOpacity style={[st.landingBtn, { borderColor: Z_BLUE }]} onPress={handlePickMedia} activeOpacity={0.85}>
                <Ionicons name="images-outline" size={28} color={Z_BLUE} />
                <Text style={[st.landingBtnText, { color: Z_BLUE }]}>{T.photoVideo}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.landingBtn, { borderColor: Z_GREEN }]} onPress={() => setTextMode(true)} activeOpacity={0.85}>
                <Ionicons name="text" size={28} color={Z_GREEN} />
                <Text style={[st.landingBtnText, { color: Z_GREEN }]}>{T.textStory}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ════════ Bottom bar: Audience pill + Publish ════════ */}
        {(hasMedia || hasShared || inTextMode) && !composerOpen && (
          <View style={[st.bottomBar, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
            <TouchableOpacity
              style={[st.audPill, { borderColor: isCloseFriends ? Z_GREEN : Z_BLUE }]}
              onPress={() => {
                const next = !isCloseFriends;
                setIsCloseFriends(next);
                if (next && cfList.length === 0) setShowCFModal(true);
              }}
            >
              <Ionicons name={isCloseFriends ? "star" : "globe-outline"} size={16} color={isCloseFriends ? Z_GREEN : Z_BLUE} />
              <Text style={[st.audPillText, { color: isCloseFriends ? Z_GREEN : Z_BLUE }]}>
                {isCloseFriends ? T.closeFriends : T.publicLabel}
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
                  <Text style={st.publishBtnText}>{T.share}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#000" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ════════ Text composer ════════ */}
      {composerOpen && (
        <View style={st.composerWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeComposer(true)} />
          <View
            style={[
              st.composerCenter,
              kbHeight > 0 && { paddingBottom: kbHeight + 80 },
            ]}
            pointerEvents="box-none"
          >
            <View style={[st.composerBubble, highlightStyle(draftHighlight).wrap]}>
              <TextInput
                value={draftText}
                onChangeText={setDraftText}
                placeholder={T.type}
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
                            <Text style={{ color, fontFamily: "Inter_700Bold" }}>{item.name[0]?.toUpperCase()}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={st.mentionName}>{item.name}</Text>
                          {item.username ? <Text style={st.mentionHandle}>@{item.username}</Text> : null}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}
          </View>

          <View
            style={[
              st.styleBar,
              kbHeight > 0
                ? { bottom: kbHeight, paddingBottom: 10 }
                : { bottom: 0, paddingBottom: insets.bottom + 14 },
            ]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: "center" }}>
              <TouchableOpacity
                style={st.alignBtn}
                onPress={() => setDraftAlign((a) => (a === "left" ? "center" : a === "center" ? "right" : "left"))}
              >
                <Ionicons
                  name={draftAlign === "center" ? "menu-outline" : "reorder-three-outline"}
                  size={20}
                  color={Z_GREEN}
                  style={draftAlign === "right" ? { transform: [{ scaleX: -1 }] } : undefined}
                />
              </TouchableOpacity>

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
                    <Text style={[st.hChipText, { color: active ? Z_GREEN : "#fff" }]}>{h.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={[st.doneBtn, { backgroundColor: Z_GREEN }]} onPress={() => closeComposer(true)}>
              <Text style={st.doneBtnText}>{T.done}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ════════ Crop modal ════════ */}
      <CropModal
        visible={showCrop}
        uri={mediaUri}
        onClose={() => setShowCrop(false)}
        onApply={(uri) => { setMediaUri(uri); setShowCrop(false); }}
      />

      {/* ════════ Close Friends modal ════════ */}
      <CloseFriendsModal
        visible={showCFModal}
        onClose={() => { setShowCFModal(false); if (cfList.length === 0) setIsCloseFriends(false); }}
        selectedIds={cfList}
        onSave={(ids) => {
          setCfList(ids);
          if (ids.length > 0) setIsCloseFriends(true);
        }}
        followerUsers={followerUsers}
      />
    </KeyboardAvoidingView>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Z_BG },
  canvas: { flex: 1, backgroundColor: Z_BG, position: "relative", overflow: "hidden" },

  topBar: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 6,
    zIndex: 30,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  editPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderColor: Z_BLUE, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  editPillText: { fontFamily: "Inter_700Bold", fontSize: 13 },

  sidebar: {
    position: "absolute",
    right: 12,
    backgroundColor: "rgba(10,10,10,0.85)",
    borderRadius: 24,
    paddingVertical: 12, paddingHorizontal: 8,
    gap: 14,
    borderWidth: 1, borderColor: Z_BORDER,
    zIndex: 25,
  },
  sidebarBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },

  filterStrip: {
    position: "absolute",
    left: 0, right: 0,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 24,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  filterChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },

  bgPalette: { position: "absolute", left: 0, right: 0, zIndex: 24 },
  bgCircleWrap: {
    width: 38, height: 38, borderRadius: 19,
    overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  bgCircle: { flex: 1 },
  bgPlusBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: Z_GREEN,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  landing: {
    position: "absolute",
    top: 0, bottom: 0, left: 0, right: 0,
    alignItems: "center", justifyContent: "center",
    padding: 28, gap: 24,
  },
  landingTitle: { color: "#fff", fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 8 },
  landingRow: { flexDirection: "row", gap: 14 },
  landingBtn: {
    flex: 1, minWidth: 130,
    borderWidth: 1.5, borderRadius: 22,
    paddingVertical: 28, paddingHorizontal: 14,
    alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  landingBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, textAlign: "center" },

  bottomBar: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 10,
    flexDirection: "row", alignItems: "center", gap: 10,
    zIndex: 22,
  },
  audPill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 24, borderWidth: 1,
  },
  audPillText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  publishBtn: {
    flex: 1,
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8,
    paddingVertical: 14, borderRadius: 24,
  },
  publishBtnText: { color: "#000", fontFamily: "Inter_700Bold", fontSize: 15 },

  // Repost
  repostBadge: {
    position: "absolute", alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    borderWidth: 1, borderColor: Z_BLUE,
  },
  repostBadgeAvatar: { width: 22, height: 22, borderRadius: 11 },
  repostBadgeText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },

  // Draggable text
  draggableBox: { position: "absolute", top: "40%", left: "12%" },
  handleDelete: {
    position: "absolute", top: -12, left: -12,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "#FF3B30",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#000",
  },
  handleRotate: {
    position: "absolute", top: -12, right: -12,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Z_BLUE,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#000",
  },
  handleScale: {
    position: "absolute", bottom: -12, right: -12,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Z_GREEN,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#000",
  },

  // Composer
  composerWrap: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    zIndex: 50,
  },
  composerCenter: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20,
  },
  composerBubble: {
    minHeight: 60, minWidth: 100,
    alignItems: "center", justifyContent: "center",
  },
  mentionPicker: {
    position: "absolute", bottom: 100, left: 20, right: 20,
    maxHeight: 240,
    backgroundColor: Z_PANEL,
    borderRadius: 14, borderWidth: 1, borderColor: Z_BORDER,
    overflow: "hidden",
  },
  mentionRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10 },
  mentionAvatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  mentionName: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  mentionHandle: { color: Z_MUTED, fontFamily: "Inter_400Regular", fontSize: 11 },

  styleBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingTop: 10, paddingHorizontal: 12,
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  alignBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  hChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1,
  },
  hChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  doneBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 18 },
  doneBtnText: { color: "#000", fontFamily: "Inter_700Bold", fontSize: 13 },

  // Crop modal
  cropBackdrop: { flex: 1, backgroundColor: "#000", alignItems: "center" },
  cropHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 12,
    width: "100%",
  },
  cropHeaderBtn: { padding: 8 },
  cropTitle: { flex: 1, color: "#fff", textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 15 },
  cropContainer: {
    backgroundColor: "#111",
    overflow: "hidden",
    position: "relative",
    marginTop: 8,
  },
  cropMask: { position: "absolute", backgroundColor: "rgba(0,0,0,0.65)" },
  cropFrame: {
    position: "absolute",
    borderWidth: 2, borderColor: Z_GREEN,
    backgroundColor: "transparent",
  },
  cropGridLineV1: { position: "absolute", top: 0, bottom: 0, left: "33%", width: 1, backgroundColor: "rgba(255,255,255,0.35)" },
  cropGridLineV2: { position: "absolute", top: 0, bottom: 0, left: "66%", width: 1, backgroundColor: "rgba(255,255,255,0.35)" },
  cropGridLineH1: { position: "absolute", left: 0, right: 0, top: "33%", height: 1, backgroundColor: "rgba(255,255,255,0.35)" },
  cropGridLineH2: { position: "absolute", left: 0, right: 0, top: "66%", height: 1, backgroundColor: "rgba(255,255,255,0.35)" },
  cornerHandle: {
    position: "absolute", width: 36, height: 36,
    alignItems: "center", justifyContent: "center",
    zIndex: 5,
  },
  cornerInner: {
    width: 22, height: 22, borderColor: Z_GREEN,
  },
  cropHint: { color: Z_MUTED, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 12, textAlign: "center" },

  // Close Friends sheet
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  cfSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 18, gap: 12,
    borderTopWidth: 1, borderColor: Z_BORDER,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", backgroundColor: Z_BORDER, marginBottom: 6 },
  sheetTitle: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center" },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 14, borderWidth: 1, borderColor: Z_BORDER,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#000",
  },
  searchInput: { flex: 1, color: "#fff", fontFamily: "Inter_400Regular", fontSize: 14 },
  cfRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  miniAvatar: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  miniAvatarText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  cfUserName: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  cfUserHandle: { color: Z_MUTED, fontFamily: "Inter_400Regular", fontSize: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  emptyText: { textAlign: "center", color: Z_MUTED, fontFamily: "Inter_400Regular", paddingVertical: 20 },
  cfSaveBtn: { borderRadius: 18, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  cfSaveBtnText: { color: "#000", fontFamily: "Inter_700Bold", fontSize: 15 },
});
