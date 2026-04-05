import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LudoState, LudoPiece, GamePlayer } from "./gameTypes";

const LUDO_COLORS = ["#E53935", "#1E88E5", "#2E7D32", "#F57F17"];

const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

function PieceToken({ piece, color, movable, onPress }: {
  piece: LudoPiece; color: string; movable: boolean; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (!movable) return;
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={!movable}
        style={[
          styles.piece,
          { backgroundColor: color, borderColor: movable ? "#FFD700" : "rgba(255,255,255,0.3)" },
          movable && styles.pieceMovable,
        ]}
      >
        {piece.isFinished ? (
          <Text style={{ fontSize: 10 }}>✓</Text>
        ) : piece.isHome ? (
          <Text style={{ fontSize: 10 }}>🏠</Text>
        ) : (
          <Text style={styles.piecePos}>{piece.position}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

interface Props {
  state: LudoState;
  players: GamePlayer[];
  currentTurnIndex: number;
  currentUserId: string;
  isMyTurn: boolean;
  amIPlayer: boolean;
  onRollDice: () => void;
  onMovePiece: (pieceId: string) => void;
}

export default function LudoGame({
  state, players, currentTurnIndex, currentUserId, isMyTurn,
  amIPlayer, onRollDice, onMovePiece,
}: Props) {
  const currentPlayer = players[currentTurnIndex];
  const diceAnim = useRef(new Animated.Value(1)).current;

  const handleRoll = () => {
    Animated.sequence([
      Animated.timing(diceAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
      Animated.spring(diceAnim, { toValue: 1.2, useNativeDriver: true, tension: 80 }),
      Animated.spring(diceAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onRollDice();
  };

  const DICE_FACE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  return (
    <View style={styles.container}>
      {/* ─── Player chips ─── */}
      <View style={styles.playersRow}>
        {players.map((p, pi) => {
          const isTurn = players[currentTurnIndex]?.id === p.id;
          const playerPieces = state.pieces.filter((pc) => pc.playerId === p.id);
          const finished = playerPieces.filter((pc) => pc.isFinished).length;
          return (
            <View key={p.id} style={[styles.playerChip, isTurn && { borderColor: LUDO_COLORS[pi], borderWidth: 2 }]}>
              <View style={[styles.playerDot, { backgroundColor: LUDO_COLORS[pi] }]} />
              <Text style={styles.playerName}>{p.name.split(" ")[0]}</Text>
              <Text style={styles.playerFinished}>✓{finished}/4</Text>
            </View>
          );
        })}
      </View>

      {/* ─── Board visual (simplified) ─── */}
      <View style={styles.boardArea}>
        <View style={styles.boardGrid}>
          {[0, 1, 2, 3].map((quadrant) => {
            const color = LUDO_COLORS[quadrant];
            const player = players[quadrant];
            const playerPieces = player ? state.pieces.filter((pc) => pc.playerId === player.id) : [];
            const homePieces = playerPieces.filter((pc) => pc.isHome && !pc.isFinished);
            const onBoardPieces = playerPieces.filter((pc) => !pc.isHome && !pc.isFinished);
            const finishedPieces = playerPieces.filter((pc) => pc.isFinished);

            return (
              <View key={quadrant} style={[styles.quadrant, { backgroundColor: color + "33", borderColor: color + "66" }]}>
                <Text style={[styles.quadrantLabel, { color }]}>{player?.name.split(" ")[0] ?? "؟"}</Text>
                <View style={styles.piecesInQuadrant}>
                  {homePieces.map((pc) => (
                    <PieceToken key={pc.id} piece={pc} color={color} movable={isMyTurn && amIPlayer && state.movablePieces.includes(pc.id)} onPress={() => onMovePiece(pc.id)} />
                  ))}
                  {onBoardPieces.slice(0, 2).map((pc) => (
                    <PieceToken key={pc.id} piece={pc} color={color} movable={isMyTurn && amIPlayer && state.movablePieces.includes(pc.id)} onPress={() => onMovePiece(pc.id)} />
                  ))}
                  {finishedPieces.map((pc) => (
                    <PieceToken key={pc.id} piece={pc} color={color} movable={false} onPress={() => {}} />
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {/* ─── Center Dice ─── */}
        <View style={styles.centerDice}>
          <Animated.View style={{ transform: [{ scale: diceAnim }] }}>
            <Text style={styles.diceFace}>{state.dice > 0 ? DICE_FACE[state.dice] : "🎲"}</Text>
          </Animated.View>
          {state.dice > 0 && <Text style={styles.diceValue}>{state.dice}</Text>}
        </View>
      </View>

      {/* ─── Last action ─── */}
      <View style={styles.lastActionBar}>
        <Text style={styles.lastActionText}>{state.lastAction}</Text>
      </View>

      {/* ─── On-board pieces summary ─── */}
      <View style={styles.onBoardSummary}>
        {players.map((p, pi) => {
          const onBoard = state.pieces.filter((pc) => pc.playerId === p.id && !pc.isHome && !pc.isFinished);
          if (onBoard.length === 0) return null;
          return (
            <View key={p.id} style={styles.boardPiecesRow}>
              <View style={[styles.smallDot, { backgroundColor: LUDO_COLORS[pi] }]} />
              <Text style={styles.boardPiecesText}>{p.name.split(" ")[0]}: </Text>
              {onBoard.map((pc) => (
                <TouchableOpacity key={pc.id} onPress={() => onMovePiece(pc.id)} disabled={!state.movablePieces.includes(pc.id)}>
                  <View style={[styles.onBoardPiece, { backgroundColor: LUDO_COLORS[pi] + "55", borderColor: state.movablePieces.includes(pc.id) ? "#FFD700" : "transparent" }]}>
                    <Text style={{ fontSize: 11, color: "#fff" }}>{pc.position}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </View>

      {/* ─── Turn bar + roll ─── */}
      <View style={styles.turnBar}>
        <View style={[styles.turnDot, { backgroundColor: currentPlayer?.color ?? LUDO_COLORS[currentTurnIndex] ?? "#fff" }]} />
        <Text style={styles.turnText} numberOfLines={1}>
          {isMyTurn ? "🎲 دورك!" : `⏳ دور ${currentPlayer?.name}`}
        </Text>
        {isMyTurn && amIPlayer && !state.diceRolled && (
          <TouchableOpacity onPress={handleRoll} style={styles.rollBtn}>
            <Text style={styles.rollBtnText}>🎲 رمي</Text>
          </TouchableOpacity>
        )}
        {isMyTurn && amIPlayer && state.diceRolled && state.movablePieces.length > 0 && (
          <View style={styles.movePieceHint}>
            <Text style={styles.movePieceHintText}>👆 اختر قطعة</Text>
          </View>
        )}
      </View>

      {!amIPlayer && (
        <View style={styles.spectatorBar}>
          <Ionicons name="eye-outline" size={18} color="rgba(255,255,255,0.6)" />
          <Text style={styles.spectatorText}>أنت في وضع المشاهدة 👀</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  playersRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 12, paddingVertical: 8,
  },
  playerChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  playerDot: { width: 10, height: 10, borderRadius: 5 },
  playerName: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  playerFinished: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  boardArea: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12,
  },
  boardGrid: {
    width: "100%", flexDirection: "row", flexWrap: "wrap", gap: 6,
  },
  quadrant: {
    flex: 1, minWidth: "47%", borderRadius: 16, borderWidth: 1,
    padding: 10, minHeight: 90,
  },
  quadrantLabel: { fontSize: 12, fontFamily: "Inter_700Bold", marginBottom: 6 },
  piecesInQuadrant: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  piece: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, elevation: 3,
  },
  pieceMovable: {
    elevation: 6, shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 4,
  },
  piecePos: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  centerDice: {
    position: "absolute", alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 20, padding: 12,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
  },
  diceFace: { fontSize: 40 },
  diceValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 2 },
  lastActionBar: {
    marginHorizontal: 12, padding: 8,
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, alignItems: "center",
  },
  lastActionText: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_500Medium", textAlign: "center" },
  onBoardSummary: { paddingHorizontal: 12, paddingVertical: 4, gap: 4 },
  boardPiecesRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  smallDot: { width: 8, height: 8, borderRadius: 4 },
  boardPiecesText: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_500Medium" },
  onBoardPiece: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1.5 },
  turnBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  turnDot: { width: 10, height: 10, borderRadius: 5 },
  turnText: { fontSize: 14, color: "#fff", fontFamily: "Inter_600SemiBold", flex: 1 },
  rollBtn: {
    backgroundColor: "#2E7D32", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
  },
  rollBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  movePieceHint: {
    backgroundColor: "#F57F17", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
  },
  movePieceHintText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  spectatorBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    padding: 14, backgroundColor: "rgba(0,0,0,0.3)",
  },
  spectatorText: { fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_500Medium" },
});
