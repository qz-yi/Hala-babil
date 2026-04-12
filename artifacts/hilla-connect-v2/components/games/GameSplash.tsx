import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { GameType, GAME_INFO } from "./gameTypes";

interface Props {
  gameType: GameType;
}

export default function GameSplash({ gameType }: Props) {
  const info = GAME_INFO[gameType];
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const emoji1Y = useRef(new Animated.Value(0)).current;
  const emoji2Y = useRef(new Animated.Value(0)).current;
  const emoji3Y = useRef(new Animated.Value(0)).current;
  const bgScale = useRef(new Animated.Value(0.8)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(60)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subSlide = useRef(new Animated.Value(30)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const readyScale = useRef(new Animated.Value(0)).current;
  const readyOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(bgScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.loop(
          Animated.timing(rotate, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true }),
          { iterations: 3 }
        ),
      ]),
      Animated.parallel([
        Animated.spring(emoji1Y, { toValue: -30, useNativeDriver: true, tension: 40, friction: 5 }),
        Animated.spring(emoji2Y, { toValue: -50, useNativeDriver: true, tension: 35, friction: 6 }),
        Animated.spring(emoji3Y, { toValue: -20, useNativeDriver: true, tension: 45, friction: 5 }),
        Animated.timing(titleSlide, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(subSlide, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(subOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.spring(readyScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
      Animated.timing(readyOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const splashEmojis = {
    tictactoe: ["❌", "⭕", "❌"],
    domino: ["🀱", "🀲", "🀳"],
  }[gameType] ?? ["🎮", "🕹️", "🎮"];

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale: bgScale }], opacity: bgOpacity }]}
    >
      <View style={[styles.backdrop, { backgroundColor: info.gradient[0] + "EE" }]} />
      <View style={styles.glow} />

      <View style={styles.floatingRow}>
        <Animated.Text style={[styles.floatEmoji, { transform: [{ translateY: emoji1Y }] }]}>
          {splashEmojis[0]}
        </Animated.Text>
        <Animated.Text style={[styles.floatEmoji, { transform: [{ translateY: emoji2Y }], fontSize: 48 }]}>
          {splashEmojis[1]}
        </Animated.Text>
        <Animated.Text style={[styles.floatEmoji, { transform: [{ translateY: emoji3Y }] }]}>
          {splashEmojis[2]}
        </Animated.Text>
      </View>

      <Animated.Text style={[styles.mainEmoji, { transform: [{ scale }, { rotate: spin }], opacity }]}>
        {info.emoji}
      </Animated.Text>

      <Animated.Text
        style={[styles.title, { transform: [{ translateY: titleSlide }], opacity: titleOpacity }]}
      >
        {info.name}
      </Animated.Text>

      <Animated.Text
        style={[styles.desc, { transform: [{ translateY: subSlide }], opacity: subOpacity }]}
      >
        {info.description}
      </Animated.Text>

      <Animated.View style={[styles.readyBadge, { transform: [{ scale: readyScale }], opacity: readyOpacity }]}>
        <Text style={styles.readyText}>🚀 انطلق!</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a0a2e",
  },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignSelf: "center",
    top: "30%",
  },
  floatingRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
    alignItems: "flex-end",
  },
  floatEmoji: {
    fontSize: 36,
  },
  mainEmoji: {
    fontSize: 90,
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  desc: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  readyBadge: {
    marginTop: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  readyText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
