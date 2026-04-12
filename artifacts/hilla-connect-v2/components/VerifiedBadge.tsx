import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

const BLUE = "#3D91F4";
const LIGHT_BLUE = "#93C5FD";

interface VerifiedBadgeProps {
  size?: number;
  style?: any;
}

export function VerifiedBadge({ size = 14, style }: VerifiedBadgeProps) {
  return (
    <View
      style={[
        {
          width: size + 4,
          height: size + 4,
          borderRadius: (size + 4) / 2,
          backgroundColor: BLUE,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Feather name="check" size={size - 2} color="#fff" strokeWidth={3} />
    </View>
  );
}

interface VerifiedAvatarFrameProps {
  size: number;
  children: React.ReactNode;
}

export function VerifiedAvatarFrame({ size, children }: VerifiedAvatarFrameProps) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const BORDER = 3;
  const outerSize = size + BORDER * 2 + 4;

  return (
    <View style={{ width: outerSize, height: outerSize, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: outerSize / 2,
            transform: [{ rotate }],
            overflow: "hidden",
          },
        ]}
      >
        <View style={styles.gradientInner}>
          {GRADIENT_STOPS.map((color, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                width: outerSize,
                height: outerSize / GRADIENT_STOPS.length + 2,
                top: (i * outerSize) / GRADIENT_STOPS.length,
                backgroundColor: color,
              }}
            />
          ))}
        </View>
      </Animated.View>

      <View
        style={{
          width: size + 4,
          height: size + 4,
          borderRadius: (size + 4) / 2,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}

const GRADIENT_STOPS = [
  "#1D4ED8",
  BLUE,
  LIGHT_BLUE,
  "#BFDBFE",
  LIGHT_BLUE,
  BLUE,
  "#1D4ED8",
];

const styles = StyleSheet.create({
  gradientInner: {
    flex: 1,
    borderRadius: 999,
    overflow: "hidden",
  },
});
