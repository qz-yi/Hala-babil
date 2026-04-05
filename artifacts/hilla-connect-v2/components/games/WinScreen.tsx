import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GamePlayer, GAME_INFO, GameType } from "./gameTypes";

interface Props {
  winner: GamePlayer | null;
  gameType: GameType;
  players: GamePlayer[];
  scores?: Record<string, number>;
  onClose: () => void;
}

export default function WinScreen({ winner, gameType, players, scores, onClose }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const confetti1 = useRef(new Animated.Value(-50)).current;
  const confetti2 = useRef(new Animated.Value(-50)).current;
  const confetti3 = useRef(new Animated.Value(-50)).current;
  const confetti4 = useRef(new Animated.Value(-50)).current;
  const trophyBounce = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(trophyBounce, { toValue: -10, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(trophyBounce, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
        ]),
        { iterations: -1 }
      ),
    ]).start();

    const confettiAnims = [confetti1, confetti2, confetti3, confetti4];
    const delays = [0, 200, 100, 300];
    confettiAnims.forEach((c, i) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(c, { toValue: 800, duration: 2000 + i * 300, useNativeDriver: true, easing: Easing.linear }),
            Animated.timing(c, { toValue: -50, duration: 0, useNativeDriver: true }),
          ]),
          { iterations: -1 }
        ).start();
      }, delays[i]);
    });
  }, []);

  const confettis = [
    { anim: confetti1, x: "15%", emoji: "🎉" },
    { anim: confetti2, x: "40%", emoji: "🎊" },
    { anim: confetti3, x: "65%", emoji: "⭐" },
    { anim: confetti4, x: "85%", emoji: "🏆" },
  ];

  const info = GAME_INFO[gameType];

  return (
    <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
      {confettis.map((c, i) => (
        <Animated.Text key={i} style={[styles.confetti, { left: c.x as any, transform: [{ translateY: c.anim }] }]}>
          {c.emoji}
        </Animated.Text>
      ))}

      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Animated.Text style={[styles.trophy, { transform: [{ translateY: trophyBounce }] }]}>
          🏆
        </Animated.Text>

        <Text style={styles.winTitle}>
          {winner ? "الفائز!" : "تعادل!"}
        </Text>

        {winner ? (
          <>
            <View style={[styles.winnerAvatar, { backgroundColor: winner.color + "44" }]}>
              <Text style={{ fontSize: 36, color: winner.color }}>{winner.name[0]?.toUpperCase()}</Text>
            </View>
            <Text style={[styles.winnerName, { color: winner.color }]}>{winner.name}</Text>
            <Text style={styles.winnerMsg}>🎉 فاز بلعبة {info.name}! 🎉</Text>
          </>
        ) : (
          <Text style={styles.drawMsg}>لا يوجد فائز واضح — تعادل رائع! 🤝</Text>
        )}

        {scores && (
          <View style={styles.scoresArea}>
            {players
              .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
              .map((p, i) => (
                <View key={p.id} style={styles.scoreRow}>
                  <Text style={styles.scoreRank}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</Text>
                  <View style={[styles.scoreDot, { backgroundColor: p.color }]} />
                  <Text style={styles.scoreName}>{p.name.split(" ")[0]}</Text>
                  <Text style={styles.scoreVal}>{scores[p.id] ?? 0}</Text>
                </View>
              ))}
          </View>
        )}

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕ إنهاء اللعبة</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  },
  confetti: {
    position: "absolute",
    fontSize: 28,
    zIndex: 1,
  },
  card: {
    width: "85%",
    maxWidth: 340,
    backgroundColor: "#1a1a2e",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,215,0,0.4)",
    zIndex: 2,
    elevation: 20,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  trophy: {
    fontSize: 64,
    marginBottom: 4,
  },
  winTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFD700",
    letterSpacing: 2,
  },
  winnerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  winnerName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  winnerMsg: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  drawMsg: {
    fontSize: 16,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 24,
  },
  scoresArea: {
    width: "100%",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 12,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scoreRank: { fontSize: 18, width: 28 },
  scoreDot: { width: 10, height: 10, borderRadius: 5 },
  scoreName: { flex: 1, fontSize: 14, color: "#fff", fontFamily: "Inter_600SemiBold" },
  scoreVal: { fontSize: 14, color: "#FFD700", fontFamily: "Inter_700Bold" },
  closeBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginTop: 4,
  },
  closeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
