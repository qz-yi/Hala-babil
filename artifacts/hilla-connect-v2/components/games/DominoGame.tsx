import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Circle, Line, Rect, Svg } from "react-native-svg";

import TurnTimer from "@/components/games/TurnTimer";
import { DominoState, DominoTile, GamePlayer } from "./gameTypes";

// ── Domino dot layout ──────────────────────────────────────────────────────
// Normalized offsets (±1 units). Scaled to actual pixels when rendering.
const DOT_POSITIONS: [number, number][][] = [
  [],
  [[0, 0]],
  [[-1, -1], [1, 1]],
  [[-1, -1], [0, 0], [1, 1]],
  [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  [[-1, -1.2], [1, -1.2], [-1, 0], [1, 0], [-1, 1.2], [1, 1.2]],
];

interface TileProps {
  tile: DominoTile;
  size?: "hand" | "board" | "mini";
  highlight?: boolean;
  disabled?: boolean;
  onPressLeft?: () => void;
  onPressRight?: () => void;
  playAnim?: Animated.Value;
}

function DominoTileView({
  tile,
  size = "hand",
  highlight,
  disabled,
  onPressLeft,
  onPressRight,
  playAnim,
}: TileProps) {
  const dim = {
    hand: { w: 70, h: 112, r: 9, dotR: 4, dotSx: 9, dotSy: 11 },
    board: { w: 52, h: 82, r: 7, dotR: 3, dotSx: 7, dotSy: 8 },
    mini: { w: 36, h: 58, r: 5, dotR: 2, dotSx: 5, dotSy: 6 },
  }[size];

  const hw = dim.w;
  const hh = dim.h;
  const midY = hh / 2;
  const topCY = midY / 2;
  const botCY = midY + midY / 2;
  const dotFill = "#1a1a1a";
  const tileFill = "#F7F3E3";
  const borderColor = highlight ? "#4CAF50" : disabled ? "#888" : "#2a2a2a";

  const renderDots = (pips: number, cx: number, cy: number) =>
    (DOT_POSITIONS[pips] ?? []).map(([dx, dy], i) => (
      <Circle
        key={i}
        cx={cx + dx * dim.dotSx}
        cy={cy + dy * dim.dotSy}
        r={dim.dotR}
        fill={dotFill}
      />
    ));

  const tileContent = (
    <Svg width={hw} height={hh} viewBox={`0 0 ${hw} ${hh}`}>
      <Rect
        x={1} y={1} width={hw - 2} height={hh - 2}
        rx={dim.r} ry={dim.r}
        fill={tileFill}
        stroke={borderColor}
        strokeWidth={highlight ? 3 : 2}
      />
      <Line
        x1={6} y1={midY} x2={hw - 6} y2={midY}
        stroke={borderColor} strokeWidth={1.5}
      />
      {renderDots(tile.a, hw / 2, topCY)}
      {renderDots(tile.b, hw / 2, botCY)}
    </Svg>
  );

  const wrapper = playAnim
    ? (
      <Animated.View style={{ transform: [{ scale: playAnim }], opacity: disabled ? 0.45 : 1 }}>
        {tileContent}
      </Animated.View>
    )
    : <View style={{ opacity: disabled ? 0.45 : 1 }}>{tileContent}</View>;

  if (!onPressLeft && !onPressRight) return wrapper;

  return (
    <View style={{ gap: 5 }}>
      {wrapper}
      {!disabled && (
        <View style={{ flexDirection: "row", gap: 4 }}>
          {onPressLeft && (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPressLeft(); }}
              style={[styles.sideBtn, { backgroundColor: "#1565C0" }]}
            >
              <Text style={styles.sideBtnText}>← يسار</Text>
            </TouchableOpacity>
          )}
          {onPressRight && (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPressRight(); }}
              style={[styles.sideBtn, { backgroundColor: "#0D47A1" }]}
            >
              <Text style={styles.sideBtnText}>يمين →</Text>
            </TouchableOpacity>
          )}
        </View>
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
  turnTimeLeft: number;
  onPlayTile: (tileId: string, side: "left" | "right") => void;
  onDrawFromBoneyard: () => void;
}

export default function DominoGame({
  state,
  players,
  currentTurnIndex,
  currentUserId,
  isMyTurn,
  amIPlayer,
  turnTimeLeft,
  onPlayTile,
  onDrawFromBoneyard,
}: Props) {
  const myHand = state.hands[currentUserId] ?? [];
  const currentPlayer = players[currentTurnIndex];

  // Snap animation per tile
  const tileAnims = useRef(new Map<string, Animated.Value>()).current;

  const getOrCreateAnim = (tileId: string) => {
    if (!tileAnims.has(tileId)) {
      const anim = new Animated.Value(0.6);
      tileAnims.set(tileId, anim);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 12,
      }).start();
    }
    return tileAnims.get(tileId)!;
  };

  const canPlay = (tile: DominoTile) =>
    tile.a === state.leftEnd || tile.b === state.leftEnd ||
    tile.a === state.rightEnd || tile.b === state.rightEnd;

  const hasPlayable = myHand.some(canPlay);

  const handlePlayTile = (tileId: string, side: "left" | "right") => {
    tileAnims.delete(tileId);
    onPlayTile(tileId, side);
  };

  return (
    <View style={styles.container}>
      {/* Turn timer */}
      <TurnTimer timeLeft={turnTimeLeft} isActive={!!(amIPlayer && isMyTurn)} />

      {/* Opponents */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.opponentsRow}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}
      >
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

      {/* Board ends */}
      <View style={styles.boardEnds}>
        <View style={styles.endPill}>
          <Text style={styles.endLabel}>يسار</Text>
          <View style={{ alignItems: "center" }}>
            <Svg width={44} height={68} viewBox="0 0 44 68">
              <Rect x={1} y={1} width={42} height={66} rx={7} fill="#F7F3E3" stroke="#2a2a2a" strokeWidth={2} />
              <Line x1={5} y1={34} x2={39} y2={34} stroke="#2a2a2a" strokeWidth={1.5} />
              {(DOT_POSITIONS[state.leftEnd] ?? []).map(([dx, dy], i) => (
                <Circle key={i} cx={22 + dx * 6} cy={17 + dy * 8} r={3} fill="#1a1a1a" />
              ))}
              {(DOT_POSITIONS[state.leftEnd] ?? []).map(([dx, dy], i) => (
                <Circle key={`b${i}`} cx={22 + dx * 6} cy={51 + dy * 8} r={3} fill="#1a1a1a" />
              ))}
            </Svg>
          </View>
        </View>

        <View style={styles.boardCenter}>
          <Text style={styles.boardTileCount}>🀱 {state.board.length} على الطاولة</Text>
          <Text style={styles.boneyardCount}>📦 مخزون: {state.boneyard.length}</Text>
          <Text style={styles.lastAction}>{state.lastAction}</Text>
        </View>

        <View style={styles.endPill}>
          <Text style={styles.endLabel}>يمين</Text>
          <View style={{ alignItems: "center" }}>
            <Svg width={44} height={68} viewBox="0 0 44 68">
              <Rect x={1} y={1} width={42} height={66} rx={7} fill="#F7F3E3" stroke="#2a2a2a" strokeWidth={2} />
              <Line x1={5} y1={34} x2={39} y2={34} stroke="#2a2a2a" strokeWidth={1.5} />
              {(DOT_POSITIONS[state.rightEnd] ?? []).map(([dx, dy], i) => (
                <Circle key={i} cx={22 + dx * 6} cy={17 + dy * 8} r={3} fill="#1a1a1a" />
              ))}
              {(DOT_POSITIONS[state.rightEnd] ?? []).map(([dx, dy], i) => (
                <Circle key={`b${i}`} cx={22 + dx * 6} cy={51 + dy * 8} r={3} fill="#1a1a1a" />
              ))}
            </Svg>
          </View>
        </View>
      </View>

      {/* Board preview — last 8 tiles */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.boardRow}
        contentContainerStyle={{ gap: 4, paddingHorizontal: 12, alignItems: "center" }}
      >
        {state.board.slice(-10).map((bt, i, arr) => (
          <View key={i} style={[styles.boardTileWrap, i === arr.length - 1 && styles.lastBoardTile]}>
            <DominoTileView
              tile={bt.flipped ? { id: bt.tile.id, a: bt.tile.b, b: bt.tile.a } : bt.tile}
              size="mini"
            />
          </View>
        ))}
      </ScrollView>

      {/* Scores */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 32 }}
        contentContainerStyle={{ gap: 14, paddingHorizontal: 12, alignItems: "center" }}
      >
        {players.map((p) => (
          <View key={p.id} style={styles.scoreChip}>
            <View style={[styles.scoreDot, { backgroundColor: p.color }]} />
            <Text style={styles.scoreText}>{p.name.split(" ")[0]}: {state.scores[p.id] ?? 0}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Turn bar */}
      <View style={styles.turnBar}>
        <View style={[styles.turnDot, { backgroundColor: currentPlayer?.color ?? "#fff" }]} />
        <Text style={styles.turnText}>
          {isMyTurn ? "🀱 دورك! اختر قطعة" : `⏳ دور ${currentPlayer?.name}`}
        </Text>
      </View>

      {/* My Hand */}
      {amIPlayer ? (
        <View style={styles.handArea}>
          <Text style={styles.handLabel}>يدك ({myHand.length} قطعة)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            {myHand.map((tile) => {
              const playable = isMyTurn && canPlay(tile);
              const canGoLeft = playable && (tile.a === state.leftEnd || tile.b === state.leftEnd);
              const canGoRight = playable && (tile.a === state.rightEnd || tile.b === state.rightEnd);
              return (
                <DominoTileView
                  key={tile.id}
                  tile={tile}
                  size="hand"
                  disabled={!playable}
                  highlight={playable}
                  playAnim={getOrCreateAnim(tile.id)}
                  onPressLeft={canGoLeft ? () => handlePlayTile(tile.id, "left") : undefined}
                  onPressRight={canGoRight ? () => handlePlayTile(tile.id, "right") : undefined}
                />
              );
            })}
          </ScrollView>
          {isMyTurn && !hasPlayable && (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDrawFromBoneyard(); }}
              style={styles.drawBtn}
            >
              <Text style={styles.drawBtnText}>
                {state.boneyard.length > 0 ? "📦 سحب من المخزون" : "⏭️ تمرير الدور"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.spectatorBar}>
          <Text style={styles.spectatorText}>👀 أنت في وضع المشاهدة</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  opponentsRow: { maxHeight: 62, paddingVertical: 6 },
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
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 8, gap: 8,
  },
  endPill: {
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 8, alignItems: "center", gap: 4,
  },
  endLabel: { fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_500Medium" },
  boardCenter: { flex: 1, alignItems: "center", gap: 3 },
  boardTileCount: { fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold" },
  boneyardCount: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  lastAction: { fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_500Medium", textAlign: "center" },
  boardRow: {
    maxHeight: 70,
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  boardTileWrap: { opacity: 0.8 },
  lastBoardTile: { opacity: 1 },
  scoreChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  scoreDot: { width: 8, height: 8, borderRadius: 4 },
  scoreText: { fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_500Medium" },
  turnBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)",
  },
  turnDot: { width: 10, height: 10, borderRadius: 5 },
  turnText: { fontSize: 14, color: "#fff", fontFamily: "Inter_600SemiBold", flex: 1 },
  handArea: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 8, flex: 1 },
  handLabel: {
    fontSize: 12, color: "rgba(255,255,255,0.6)",
    paddingHorizontal: 12, fontFamily: "Inter_500Medium",
  },
  sideBtn: {
    flex: 1, borderRadius: 8, paddingVertical: 5,
    alignItems: "center", justifyContent: "center",
  },
  sideBtnText: { fontSize: 10, color: "#fff", fontFamily: "Inter_700Bold" },
  drawBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginHorizontal: 12, marginTop: 6, backgroundColor: "#1565C0",
    borderRadius: 14, paddingVertical: 12,
  },
  drawBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  spectatorBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 16, flex: 1,
  },
  spectatorText: { fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_500Medium" },
});
