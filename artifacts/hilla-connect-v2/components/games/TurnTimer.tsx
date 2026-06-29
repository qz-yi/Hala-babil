import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Circle, Svg } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + 8) * 2;

interface Props {
  timeLeft: number;
  totalTime?: number;
  isActive: boolean;
}

export default function TurnTimer({ timeLeft, totalTime = 30, isActive }: Props) {
  const dashOffset = useSharedValue(0);

  useEffect(() => {
    dashOffset.value = withTiming(
      CIRCUMFERENCE * (1 - timeLeft / totalTime),
      { duration: 600, easing: Easing.out(Easing.ease) },
    );
  }, [timeLeft, totalTime]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const urgent = timeLeft <= 7;
  const warning = timeLeft <= 15 && timeLeft > 7;
  const ringColor = urgent ? "#EF4444" : warning ? "#FF9800" : "#4CAF50";
  const textColor = urgent ? "#EF4444" : warning ? "#FF9800" : "rgba(255,255,255,0.85)";
  const bgRing = urgent
    ? "rgba(239,68,68,0.15)"
    : warning
      ? "rgba(255,152,0,0.15)"
      : "rgba(255,255,255,0.08)";

  if (!isActive) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.ringWrap, { backgroundColor: bgRing }]}>
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          {/* Background ring */}
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={5} fill="none"
          />
          {/* Animated progress ring — stroked counter-clockwise */}
          <AnimatedCircle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke={ringColor}
            strokeWidth={5}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeLinecap="round"
            rotation={-90}
            origin={`${SIZE / 2}, ${SIZE / 2}`}
            animatedProps={animatedProps}
          />
        </Svg>
        <Text style={[styles.count, { color: textColor }]}>
          {timeLeft}
        </Text>
      </View>
      <Text style={[styles.label, { color: textColor }]}>
        {urgent ? "⚡ جلد!" : "⏱ دورك"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
