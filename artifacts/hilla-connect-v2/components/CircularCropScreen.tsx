import { Feather } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Line, Mask, Rect } from "react-native-svg";

const { width: SW, height: SH } = Dimensions.get("window");
const CIRCLE_D = Math.min(SW, 420);
const CIRCLE_R = CIRCLE_D / 2;
const PREVIEW_H = Math.round(SH * 0.62);
const CX = SW / 2;
const CY = PREVIEW_H / 2;

interface Props {
  visible: boolean;
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  onClose: () => void;
  onDone: (croppedUri: string) => void;
}

export function CircularCropScreen({
  visible,
  imageUri,
  imageWidth,
  imageHeight,
  onClose,
  onDone,
}: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(false);

  const MAX_DIM = 1200;
  const ratio = imageWidth / imageHeight;
  const dispW = ratio >= 1 ? MAX_DIM : Math.round(MAX_DIM * ratio);
  const dispH = ratio >= 1 ? Math.round(MAX_DIM / ratio) : MAX_DIM;

  const minScale = Math.max(CIRCLE_D / dispW, CIRCLE_D / dispH);

  const scale = useSharedValue(minScale);
  const savedScale = useSharedValue(minScale);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      const ms = Math.max(CIRCLE_D / dispW, CIRCLE_D / dispH);
      scale.value = ms;
      savedScale.value = ms;
      tx.value = 0;
      ty.value = 0;
      savedTx.value = 0;
      savedTy.value = 0;
    }
  }, [visible, imageUri]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.max(minScale, Math.min(next, minScale * 8));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  const handleDone = async () => {
    setLoading(true);
    try {
      const curScale = scale.value;
      const curTx = tx.value;
      const curTy = ty.value;

      const rendW = dispW * curScale;
      const rendH = dispH * curScale;

      const imgLeft = CX + curTx - rendW / 2;
      const imgTop = CY + curTy - rendH / 2;

      const circleTLx = CX - CIRCLE_R;
      const circleTLy = CY - CIRCLE_R;

      const originX_disp = (circleTLx - imgLeft) / curScale;
      const originY_disp = (circleTLy - imgTop) / curScale;
      const cropSize_disp = CIRCLE_D / curScale;

      const scaleToOrigX = imageWidth / dispW;
      const scaleToOrigY = imageHeight / dispH;

      const originX = Math.max(0, Math.round(originX_disp * scaleToOrigX));
      const originY = Math.max(0, Math.round(originY_disp * scaleToOrigY));
      const cropW = Math.round(cropSize_disp * scaleToOrigX);
      const cropH = Math.round(cropSize_disp * scaleToOrigY);
      const cropSize = Math.max(1, Math.min(cropW, cropH, imageWidth - originX, imageHeight - originY));

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { crop: { originX, originY, width: cropSize, height: cropSize } },
          { resize: { width: 512, height: 512 } },
        ],
        { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
      );
      onDone(result.uri);
    } catch (err) {
      console.error("CircularCrop error:", err);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const topPad = Platform.OS === "web" ? 24 : (insets.top || 44);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: topPad + 4 }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerSideBtn} disabled={loading}>
            <Text style={styles.cancelText}>إلغاء</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>صورة الملف الشخصي</Text>
          <TouchableOpacity onPress={handleDone} style={styles.headerSideBtn} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color="#3D91F4" />
              : <Text style={styles.doneText}>تم</Text>}
          </TouchableOpacity>
        </View>

        <View style={[styles.preview, { height: PREVIEW_H }]}>
          <GestureDetector gesture={composed}>
            <Animated.View style={[{ width: dispW, height: dispH }, animStyle]}>
              <Image
                source={{ uri: imageUri }}
                style={{ width: dispW, height: dispH }}
                contentFit="fill"
              />
            </Animated.View>
          </GestureDetector>

          <Svg
            width={SW}
            height={PREVIEW_H}
            style={StyleSheet.absoluteFill as any}
            pointerEvents="none"
          >
            <Defs>
              <Mask id="cropHole">
                <Rect width={SW} height={PREVIEW_H} fill="white" />
                <Circle cx={CX} cy={CY} r={CIRCLE_R} fill="black" />
              </Mask>
            </Defs>
            <Rect
              width={SW}
              height={PREVIEW_H}
              fill="rgba(0,0,0,0.68)"
              mask="url(#cropHole)"
            />
            <Circle
              cx={CX}
              cy={CY}
              r={CIRCLE_R}
              fill="none"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth={1.5}
            />
            <Line
              x1={CX - CIRCLE_R + CIRCLE_D / 3}
              y1={CY - CIRCLE_R}
              x2={CX - CIRCLE_R + CIRCLE_D / 3}
              y2={CY + CIRCLE_R}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={0.8}
            />
            <Line
              x1={CX - CIRCLE_R + (CIRCLE_D * 2) / 3}
              y1={CY - CIRCLE_R}
              x2={CX - CIRCLE_R + (CIRCLE_D * 2) / 3}
              y2={CY + CIRCLE_R}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={0.8}
            />
            <Line
              x1={CX - CIRCLE_R}
              y1={CY - CIRCLE_R + CIRCLE_D / 3}
              x2={CX + CIRCLE_R}
              y2={CY - CIRCLE_R + CIRCLE_D / 3}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={0.8}
            />
            <Line
              x1={CX - CIRCLE_R}
              y1={CY - CIRCLE_R + (CIRCLE_D * 2) / 3}
              x2={CX + CIRCLE_R}
              y2={CY - CIRCLE_R + (CIRCLE_D * 2) / 3}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={0.8}
            />
          </Svg>
        </View>

        <View style={styles.hintRow}>
          <Feather name="move" size={16} color="rgba(255,255,255,0.45)" />
          <Text style={styles.hintText}>اسحب وكبّر الصورة لضبط القص الدائري</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  headerSideBtn: {
    minWidth: 60,
    alignItems: "center",
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
  },
  doneText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#3D91F4",
  },
  preview: {
    width: SW,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 22,
  },
  hintText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
  },
});
