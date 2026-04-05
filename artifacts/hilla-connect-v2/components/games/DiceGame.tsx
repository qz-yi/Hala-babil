import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DiceState, GamePlayer } from "./gameTypes";

function Die({ value, rolling }: { value: number; rolling?: boolean }) {
  const rot = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (rolling) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rot, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(rot, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]),
        { iterations: 5 }
      ).start();
      Animated.spring(sc, { toValue: 1.1, useNativeDriver: true, friction: 5 }).start();
    } else {
      Animated.spring(sc, { toValue: 1, useNativeDriver: true }).start();
    }
  }, [rolling]);

  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "30deg"] });
  const FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  return (
    <Animated.View style={[styles.die, { transform: [{ rotate: spin }, { scale: sc }] }]}>
      <Text style={styles.dieFace}>{value > 0 ? FACES[value] : "?"}</Text>
      {value > 0 && <Text style={styles.dieValue}>{value}</Text>}
    </Animated.View>
  );
}

interface Props {
  state: DiceState;
  players: GamePlayer[];
  currentTurnIndex: number;
  currentUserId: string;
  isMyTurn: boolean;
  amIPlayer: boolean;
  onRoll: () => void;
}

export default function DiceGame({
  state, players, currentTurnIndex, currentUserId, isMyTurn, amIPlayer, onRoll,
}: Props) {
  const currentPlayer = players[currentTurnIndex];
  const maxScore = Math.max(...players.map((p) => state.scores[p.id] ?? 0));

  return (
    <View style={styles.container}>
      {/* ─── Round indicator ─── */}
      <View style={styles.roundBar}>
        <Text style={styles.roundText}>الجولة {Math.min(state.round, state.maxRounds)} / {state.maxRounds}</Text>
        <View style={styles.roundDots}>
          {Array.from({ length: state.maxRounds }).map((_, i) => (
            <View key={i} style={[styles.roundDot, i < state.round - 1 && styles.roundDotFilled]} />
          ))}
        </View>
      </View>

      {/* ─── Scores ─── */}
      <View style={styles.scoresArea}>
        {players.map((p, pi) => {
          const score = state.scores[p.id] ?? 0;
          const dice = state.dice[p.id] ?? [0, 0];
          const total = dice[0] + dice[1];
          const isLeading = score === maxScore && score > 0;
          return (
            <View key={p.id} style={[styles.playerCard, { borderColor: isLeading ? "#FFD700" : "rgba(255,255,255,0.15)" }]}>
              <View style={[styles.playerAvatar, { backgroundColor: p.color + "44" }]}>
                <Text style={{ fontSize: 20, color: p.color }}>{p.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.playerInfo}>
                <View style={styles.playerNameRow}>
                  <Text style={styles.playerNameText}>{p.name.split(" ")[0]}</Text>
                  {isLeading && <Text style={{ fontSize: 14 }}>👑</Text>}
                  {state.roundWinner === p.id && <Text style={{ fontSize: 14 }}>🏆</Text>}
                </View>
                <View style={styles.playerDiceRow}>
                  <Die value={dice[0]} rolling={state.rolling && p.id === currentUserId} />
                  <Die value={dice[1]} rolling={state.rolling && p.id === currentUserId} />
                  {total > 0 && (
                    <View style={[styles.totalBadge, { backgroundColor: p.color + "55" }]}>
                      <Text style={styles.totalText}>{total}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.scoreDisplay}>
                <Text style={styles.scoreNumber}>{score}</Text>
                <Text style={styles.scoreLabel}>جولات</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* ─── Last action ─── */}
      <View style={styles.lastActionBar}>
        <Text style={styles.lastActionText}>{state.lastAction}</Text>
      </View>

      {/* ─── How to win ─── */}
      <View style={styles.rulesCard}>
        <Text style={styles.rulesTitle}>🎯 قواعد اللعبة</Text>
        <Text style={styles.rulesText}>كل لاعب يرمي نردتين. من يحصل على أعلى مجموع يفوز بالجولة. بعد {state.maxRounds} جولات من يملك أكثر جولات يفوز!</Text>
      </View>

      {/* ─── Turn + Roll ─── */}
      <View style={styles.turnArea}>
        <View style={styles.turnBar}>
          <View style={[styles.turnDot, { backgroundColor: currentPlayer?.color ?? "#fff" }]} />
          <Text style={styles.turnText}>
            {isMyTurn ? "🎲 دورك — ارمِ النرد!" : `⏳ دور ${currentPlayer?.name}`}
          </Text>
        </View>

        {isMyTurn && amIPlayer && (
          <TouchableOpacity onPress={onRoll} style={styles.rollBtn}>
            <Text style={styles.rollBtnText}>🎲 رمي النرد!</Text>
          </TouchableOpacity>
        )}

        {!amIPlayer && (
          <View style={styles.spectatorBar}>
            <Ionicons name="eye-outline" size={18} color="rgba(255,255,255,0.6)" />
            <Text style={styles.spectatorText}>أنت في وضع المشاهدة 👀</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12 },
  roundBar: { alignItems: "center", paddingVertical: 10, gap: 6 },
  roundText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  roundDots: { flexDirection: "row", gap: 8 },
  roundDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
  },
  roundDotFilled: { backgroundColor: "#FFD700", borderColor: "#FFD700" },
  scoresArea: { gap: 10, flex: 1, justifyContent: "center" },
  playerCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20,
    padding: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.15)",
  },
  playerAvatar: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  playerInfo: { flex: 1, gap: 6 },
  playerNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  playerNameText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  playerDiceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  scoreDisplay: { alignItems: "center" },
  scoreNumber: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#FFD700" },
  scoreLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_500Medium" },
  die: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#F5F5DC", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#333", elevation: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3,
  },
  dieFace: { fontSize: 24 },
  dieValue: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#333", position: "absolute", bottom: 2, right: 4 },
  totalBadge: {
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  totalText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  lastActionBar: {
    padding: 10, backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14, alignItems: "center", marginVertical: 8,
  },
  lastActionText: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "Inter_500Medium", textAlign: "center" },
  rulesCard: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 12, gap: 4,
  },
  rulesTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFD700" },
  rulesText: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", lineHeight: 18 },
  turnArea: { paddingVertical: 10, gap: 8 },
  turnBar: { flexDirection: "row", alignItems: "center", gap: 8 },
  turnDot: { width: 10, height: 10, borderRadius: 5 },
  turnText: { fontSize: 14, color: "#fff", fontFamily: "Inter_600SemiBold", flex: 1 },
  rollBtn: {
    backgroundColor: "#6A1B9A", borderRadius: 18, paddingVertical: 16,
    alignItems: "center", elevation: 4,
    shadowColor: "#6A1B9A", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  rollBtnText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  spectatorBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    padding: 14, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 14,
  },
  spectatorText: { fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_500Medium" },
});
