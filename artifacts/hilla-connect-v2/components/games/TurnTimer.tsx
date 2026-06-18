import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface Props {
  timeLeft: number;
  totalTime?: number;
  isActive: boolean;
}

export default function TurnTimer({ timeLeft, totalTime = 30, isActive }: Props) {
  const widthAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: timeLeft / totalTime,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, totalTime]);

  const urgent = timeLeft <= 7;
  const warning = timeLeft <= 15 && timeLeft > 7;
  const barColor = urgent ? "#EF4444" : warning ? "#FF9800" : "#4CAF50";
  const textColor = urgent ? "#EF4444" : warning ? "#FF9800" : "rgba(255,255,255,0.7)";

  if (!isActive) return null;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: barColor,
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <Text style={[styles.count, { color: textColor }]}>
        {urgent ? "⚡" : "⏱"} {timeLeft}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  track: {
    flex: 1,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 3,
  },
  count: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    minWidth: 36,
    textAlign: "right",
  },
});
