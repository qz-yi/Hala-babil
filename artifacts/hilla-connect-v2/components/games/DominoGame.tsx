import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DominoState, DominoTile, GamePlayer } from "./gameTypes";

function DominoTileView({
  tile, onPressLeft, onPressRight, disabled, highlight,
}: {
  tile: DominoTile;
  onPressLeft?: () => void;
  onPressRight?: () => void;
  disabled?: boolean;
  highlight?: boolean;
}) {
  const dots = (n: number) => "●".repeat(n) || "·";

  return (
    <View style={[styles.tile, highlight && styles.tileHighlight, { opacity: disabled ? 0.45 : 1 }]}>
      {onPressLeft && !disabled && (
        <TouchableOpacity onPress={onPressLeft} style={styles.tileSideBtn}>
          <Text style={styles.tileSideBtnText}>←</Text>
        </TouchableOpacity>
      )}
      <View style={styles.tileHalf}>
        <Text style={styles.tilePips}>{tile.a}</Text>
      </View>
      <View style={styles.tileDivider} />
      <View style={styles.tileHalf}>
        <Text style={styles.tilePips}>{tile.b}</Text>
      </View>
      {onPressRight && !disabled && (
        <TouchableOpacity onPress={onPressRight} style={styles.tileSideBtn}>
          <Text style={styles.tileSideBtnText}>→</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface Props {
  state: DominoState;
  players: GamePlayer[];
  currentTurnIndex: number;
  currentUserId: string;
  isMyTurn: boolean;
  amIPlayer: boolean;
  onPlayTile: (tileId: string, side: "left" | "right") => void;
  onDrawFromBoneyard: () => void;
}

export default function DominoGame({
  state, players, currentTurnIndex, currentUserId, isMyTurn,
  amIPlayer, onPlayTile, onDrawFromBoneyard,
}: Props) {
  const myHand = state.hands[currentUserId] ?? [];
  const currentPlayer = players[currentTurnIndex];

  const canPlay = (tile: DominoTile) =>
    tile.a === state.leftEnd || tile.b === state.leftEnd ||
    tile.a === state.rightEnd || tile.b === state.rightEnd;

  const hasPlayable = myHand.some(canPlay);

  return (
    <View style={styles.container}>
      {/* ─── Opponent info ─── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.opponentsRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
        {players.filter((p) => p.id !== currentUserId).map((p) => {
          const hand = state.hands[p.id] ?? [];
          const isTheirTurn = players[currentTurnIndex]?.id === p.id;
          return (
            <View key={p.id} style={[styles.opponentChip, isTheirTurn && { borderColor: p.color, borderWidth: 2 }]}>
              <View style={[styles.opponentAvatar, { backgroundColor: p.color + "44" }]}>
                <Text style={{ fontSize: 14, color: p.color }}>{p.name[0]?.toUpperCase()}</Text>
              </View>
              <Text style={styles.opponentName}>{p.name.split(" ")[0]}</Text>
              <Text style={styles.opponentCards}>🀱 {hand.length}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* ─── Board ends ─── */}
      <View style={styles.boardEnds}>
        <View style={styles.endPill}>
          <Text style={styles.endLabel}>طرف يسار</Text>
          <Text style={styles.endValue}>{state.leftEnd}</Text>
        </View>
        <View style={styles.boardCenter}>
          <Text style={styles.boardTileCount}>🀱 {state.board.length} قطعة على الطاولة</Text>
          <Text style={styles.boneyardCount}>📦 مخزون: {state.boneyard.length}</Text>
        </View>
        <View style={styles.endPill}>
          <Text style={styles.endLabel}>طرف يمين</Text>
          <Text style={styles.endValue}>{state.rightEnd}</Text>
        </View>
      </View>

      {/* ─── Board preview (last few tiles) ─── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.boardRow} contentContainerStyle={{ gap: 4, paddingHorizontal: 12, alignItems: "center" }}>
        {state.board.slice(-8).map((bt, i) => (
          <View key={i} style={styles.boardTile}>
            <Text style={styles.boardTileText}>{bt.flipped ? bt.tile.b : bt.tile.a}|{bt.flipped ? bt.tile.a : bt.tile.b}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ─── Last action + scores ─── */}
      <View style={styles.infoRow}>
        <Text style={styles.lastAction}>{state.lastAction}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 36 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 12 }}>
        {players.map((p) => (
          <View key={p.id} style={styles.scoreChip}>
            <View style={[styles.scoreDot, { backgroundColor: p.color }]} />
            <Text style={styles.scoreText}>{p.name.split(" ")[0]}: {state.scores[p.id] ?? 0}نقطة</Text>
          </View>
        ))}
      </ScrollView>

      {/* ─── Turn bar ─── */}
      <View style={styles.turnBar}>
        <View style={[styles.turnDot, { backgroundColor: currentPlayer?.color ?? "#fff" }]} />
        <Text style={styles.turnText}>
          {isMyTurn ? "🀱 دورك! اختر قطعة" : `⏳ دور ${currentPlayer?.name}`}
        </Text>
      </View>

      {/* ─── My Hand ─── */}
      {amIPlayer ? (
        <View style={styles.handArea}>
          <Text style={styles.handLabel}>يدك ({myHand.length} قطعة)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
            {myHand.map((tile) => {
              const playable = isMyTurn && canPlay(tile);
              const canGoLeft = playable && (tile.a === state.leftEnd || tile.b === state.leftEnd);
              const canGoRight = playable && (tile.a === state.rightEnd || tile.b === state.rightEnd);
              return (
                <DominoTileView
                  key={tile.id}
                  tile={tile}
                  disabled={!playable}
                  highlight={playable}
                  onPressLeft={canGoLeft ? () => onPlayTile(tile.id, "left") : undefined}
                  onPressRight={canGoRight ? () => onPlayTile(tile.id, "right") : undefined}
                />
              );
            })}
          </ScrollView>
          {isMyTurn && !hasPlayable && (
            <TouchableOpacity onPress={onDrawFromBoneyard} style={styles.drawBtn}>
              <Ionicons name="download-outline" size={16} color="#fff" />
              <Text style={styles.drawBtnText}>
                {state.boneyard.length > 0 ? "سحب من المخزون 📦" : "تمرير الدور ⏭️"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
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
  opponentsRow: { maxHeight: 60, paddingVertical: 6 },
  opponentChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  opponentAvatar: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  opponentName: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  opponentCards: { fontSize: 10, color: "rgba(255,255,255,0.6)" },
  boardEnds: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, gap: 8,
  },
  endPill: {
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, alignItems: "center",
  },
  endLabel: { fontSize: 10, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_500Medium" },
  endValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  boardCenter: { flex: 1, alignItems: "center", gap: 2 },
  boardTileCount: { fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold" },
  boneyardCount: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  boardRow: { maxHeight: 54, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  boardTile: {
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  boardTileText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  infoRow: { paddingHorizontal: 12, paddingVertical: 6 },
  lastAction: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_500Medium", textAlign: "center" },
  scoreChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  scoreDot: { width: 8, height: 8, borderRadius: 4 },
  scoreText: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_500Medium" },
  turnBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  turnDot: { width: 10, height: 10, borderRadius: 5 },
  turnText: { fontSize: 14, color: "#fff", fontFamily: "Inter_600SemiBold", flex: 1 },
  handArea: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 8 },
  handLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)", paddingHorizontal: 12 },
  tile: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F5F5DC", borderRadius: 10, overflow: "hidden",
    borderWidth: 2, borderColor: "#333",
    elevation: 3,
  },
  tileHighlight: { borderColor: "#4CAF50", elevation: 6 },
  tileHalf: { width: 34, height: 52, alignItems: "center", justifyContent: "center" },
  tilePips: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#1a1a1a" },
  tileDivider: { width: 2, height: 44, backgroundColor: "#333" },
  tileSideBtn: {
    width: 20, height: 52, backgroundColor: "#4CAF50",
    alignItems: "center", justifyContent: "center",
  },
  tileSideBtnText: { fontSize: 12, color: "#fff", fontFamily: "Inter_700Bold" },
  drawBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 12, marginTop: 6, backgroundColor: "#1565C0",
    borderRadius: 14, paddingVertical: 12,
  },
  drawBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  spectatorBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    padding: 16, backgroundColor: "rgba(0,0,0,0.3)",
  },
  spectatorText: { fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_500Medium" },
});
