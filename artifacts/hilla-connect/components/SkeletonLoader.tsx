import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: "#262626",
          opacity,
        },
        style,
      ]}
    />
  );
}

export function PostSkeleton() {
  return (
    <View style={skStyles.postCard}>
      <View style={skStyles.postHeader}>
        <Skeleton width={42} height={42} borderRadius={21} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width={120} height={13} borderRadius={6} />
          <Skeleton width={70} height={10} borderRadius={5} />
        </View>
      </View>
      <Skeleton width="100%" height={300} borderRadius={0} />
      <View style={{ padding: 14, gap: 8 }}>
        <Skeleton width="80%" height={13} borderRadius={6} />
        <Skeleton width="60%" height={13} borderRadius={6} />
      </View>
    </View>
  );
}

export function StorySkeleton() {
  return (
    <View style={skStyles.storyItem}>
      <Skeleton width={64} height={64} borderRadius={32} />
      <Skeleton width={48} height={10} borderRadius={5} style={{ marginTop: 6 }} />
    </View>
  );
}

export function MessageSkeleton() {
  return (
    <View style={skStyles.messageItem}>
      <Skeleton width={52} height={52} borderRadius={26} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="50%" height={14} borderRadius={6} />
        <Skeleton width="80%" height={12} borderRadius={5} />
      </View>
    </View>
  );
}

const skStyles = StyleSheet.create({
  postCard: {
    backgroundColor: "#121212",
    marginBottom: 8,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  storyItem: {
    alignItems: "center",
    width: 72,
    paddingHorizontal: 4,
  },
  messageItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#262626",
  },
});
