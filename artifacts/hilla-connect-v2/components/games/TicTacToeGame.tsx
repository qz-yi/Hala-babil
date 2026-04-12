import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { TicTacToeState, GamePlayer } from "./gameTypes";

interface Props {
  state: TicTacToeState;
  players: GamePlayer[];
  currentTurnIndex: number;
  currentUserId: string;
  isMyTurn: boolean;
  amIPlayer: boolean;
  onPlay: (cellIndex: number) => void;
  onReset: () => void;
}

export default function TicTacToeGame({
  state,
  players,
  currentTurnIndex,
  currentUserId,
  isMyTurn,
  amIPlayer,
  onPlay,
  onReset,
}: Props) {
  const mySymbol = state.symbols[currentUserId];
  const currentPlayer = players[currentTurnIndex];
  const isFinished = state.winLine !== null || state.isDraw;

  const getCellStyle = (idx: number) => {
    const isWin = state.winLine?.includes(idx);
    const cell = state.board[idx];
    return {
      bg: isWin
        ? cell === "X" ? "rgba(99,102,241,0.3)" : "rgba(239,68,68,0.3)"
        : "rgba(255,255,255,0.06)",
      border: isWin
        ? cell === "X" ? "#6366F1" : "#EF4444"
        : "rgba(255,255,255,0.12)",
    };
  };

  const renderSymbol = (cell: "X" | "O" | null, idx: number) => {
    if (!cell) return null;
    const isWin = state.winLine?.includes(idx);
    const color = cell === "X" ? "#6366F1" : "#EF4444";
    return (
      <Text style={[styles.cellSymbol, { color: isWin ? color : color + "cc" }]}>
        {cell === "X" ? "✕" : "○"}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.lastAction}>{state.lastAction}</Text>
      </View>

      {/* Players strip */}
      <View style={styles.playersRow}>
        {players.map((p, i) => {
          const sym = state.symbols[p.id];
          const isActive = !isFinished && currentTurnIndex === i;
          const symColor = sym === "X" ? "#6366F1" : "#EF4444";
          return (
            <View
              key={p.id}
              style={[
                styles.playerCard,
                isActive && { borderColor: symColor, borderWidth: 2 },
              ]}
            >
              <View style={[styles.symbolBadge, { backgroundColor: symColor + "22" }]}>
                <Text style={[styles.symbolBadgeText, { color: symColor }]}>
                  {sym === "X" ? "✕" : "○"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
                {p.id === currentUserId && (
                  <Text style={[styles.youLabel, { color: symColor }]}>أنت</Text>
                )}
              </View>
              {isActive && !isFinished && (
                <View style={styles.activeDot}>
                  <Text style={{ fontSize: 9 }}>⚡</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Grid */}
      <View style={styles.gridWrap}>
        <View style={styles.grid}>
          {state.board.map((cell, idx) => {
            const cellStyle = getCellStyle(idx);
            const canPlay = isMyTurn && !cell && !isFinished && amIPlayer;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => canPlay && onPlay(idx)}
                activeOpacity={canPlay ? 0.7 : 1}
                style={[
                  styles.cell,
                  { backgroundColor: cellStyle.bg, borderColor: cellStyle.border },
                  canPlay && styles.cellPlayable,
                ]}
              >
                {renderSymbol(cell, idx)}
                {!cell && canPlay && (
                  <Text style={styles.cellHint}>
                    {mySymbol === "X" ? "✕" : "○"}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Win overlay lines (visual) */}
        {state.winLine && (
          <View style={styles.winOverlay} pointerEvents="none">
            <LinearGradient
              colors={
                state.board[state.winLine[0]] === "X"
                  ? ["#6366F180", "#6366F120"]
                  : ["#EF444480", "#EF444420"]
              }
              style={styles.winLine}
            />
          </View>
        )}
      </View>

      {/* Turn indicator */}
      {!isFinished && (
        <View style={styles.turnRow}>
          {isMyTurn && amIPlayer ? (
            <View style={styles.myTurnPill}>
              <Text style={styles.myTurnText}>🎯 دورك! اضغط على خانة</Text>
            </View>
          ) : amIPlayer ? (
            <Text style={styles.waitText}>انتظر دور {currentPlayer?.name}...</Text>
          ) : (
            <Text style={styles.waitText}>تتفرج على اللعبة</Text>
          )}
        </View>
      )}

      {/* Draw / Reset */}
      {isFinished && (
        <TouchableOpacity onPress={onReset} style={styles.resetBtn} activeOpacity={0.8}>
          <LinearGradient
            colors={["#6366F1", "#4F46E5"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.resetBtnGradient}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.resetBtnText}>لعبة جديدة</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: "center" },
  statusBar: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
    marginBottom: 16, width: "100%",
  },
  lastAction: {
    color: "rgba(255,255,255,0.85)", fontFamily: "Inter_500Medium",
    fontSize: 13, textAlign: "center",
  },
  playersRow: {
    flexDirection: "row", gap: 10, width: "100%", marginBottom: 20,
  },
  playerCard: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14,
    padding: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  symbolBadge: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  symbolBadgeText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  playerName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  youLabel: { fontSize: 10, fontFamily: "Inter_500Medium", marginTop: 2 },
  activeDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(255,215,0,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  gridWrap: { position: "relative", marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, width: 270 },
  cell: {
    width: 82, height: 82, borderRadius: 16, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  cellPlayable: { borderStyle: "dashed" },
  cellSymbol: { fontSize: 38, fontFamily: "Inter_700Bold" },
  cellHint: { fontSize: 28, color: "rgba(255,255,255,0.18)", fontFamily: "Inter_700Bold" },
  winOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  winLine: { width: "80%", height: 6, borderRadius: 3 },
  turnRow: { alignItems: "center" },
  myTurnPill: {
    backgroundColor: "rgba(99,102,241,0.25)", borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  myTurnText: { color: "#6366F1", fontFamily: "Inter_700Bold", fontSize: 15 },
  waitText: { color: "rgba(255,255,255,0.45)", fontFamily: "Inter_400Regular", fontSize: 14 },
  resetBtn: { marginTop: 8, width: "80%" },
  resetBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 16, paddingVertical: 14,
  },
  resetBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
});
