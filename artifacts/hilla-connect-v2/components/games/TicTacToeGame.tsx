import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Pressable, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Circle, G, Line, Rect, Svg } from "react-native-svg";

import TurnTimer from "@/components/games/TurnTimer";
import { gameSounds } from "@/utils/gameSounds";
import { GamePlayer, TicTacToeState } from "./gameTypes";

// ── SVG Board constants ────────────────────────────────────────────────────
const BOARD_SIZE = 270;
const CELL = BOARD_SIZE / 3; // 90
const PAD = 12;
const WIN_LINE_LENGTH = 340; // max diagonal length (sqrt(270²+270²)≈382; use 340)

const AnimatedLine = Animated.createAnimatedComponent(Line);

const WIN_LINE_ENDPOINTS: Record<string, [number, number, number, number]> = {
  "0,1,2": [PAD, CELL / 2,        BOARD_SIZE - PAD, CELL / 2],
  "3,4,5": [PAD, CELL * 1.5,      BOARD_SIZE - PAD, CELL * 1.5],
  "6,7,8": [PAD, CELL * 2.5,      BOARD_SIZE - PAD, CELL * 2.5],
  "0,3,6": [CELL / 2,        PAD, CELL / 2,        BOARD_SIZE - PAD],
  "1,4,7": [CELL * 1.5,      PAD, CELL * 1.5,      BOARD_SIZE - PAD],
  "2,5,8": [CELL * 2.5,      PAD, CELL * 2.5,      BOARD_SIZE - PAD],
  "0,4,8": [PAD + 4,         PAD + 4,         BOARD_SIZE - PAD - 4, BOARD_SIZE - PAD - 4],
  "2,4,6": [BOARD_SIZE - PAD - 4, PAD + 4,         PAD + 4,         BOARD_SIZE - PAD - 4],
};

interface Props {
  state: TicTacToeState;
  players: GamePlayer[];
  currentTurnIndex: number;
  currentUserId: string;
  isMyTurn: boolean;
  amIPlayer: boolean;
  turnTimeLeft: number;
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
  turnTimeLeft,
  onPlay,
  onReset,
}: Props) {
  const mySymbol = state.symbols[currentUserId];
  const currentPlayer = players[currentTurnIndex];
  const isFinished = state.winLine !== null || state.isDraw;

  // ── Reanimated shared values for each cell's scale ─────────────────────────
  const sv = [
    useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0),
  ];

  const prevBoard = useRef<typeof state.board>(Array(9).fill(null));

  // Initialize existing pieces on mount (reconnect mid-game)
  useEffect(() => {
    state.board.forEach((cell, i) => {
      if (cell !== null) sv[i].value = 1;
    });
    prevBoard.current = [...state.board];
    gameSounds.preload();
  }, []);

  // Animate newly placed pieces with spring + sound
  useEffect(() => {
    state.board.forEach((cell, i) => {
      if (cell !== null && prevBoard.current[i] === null) {
        sv[i].value = 0;
        sv[i].value = withSpring(1, { damping: 8, stiffness: 260 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        gameSounds.playPlace();
      }
    });
    prevBoard.current = [...state.board];
  }, [state.board]);

  // Play win/draw sound on finish
  const wasFinished = useRef(false);
  useEffect(() => {
    if (isFinished && !wasFinished.current) {
      wasFinished.current = true;
      if (state.winLine) {
        const winner = state.board[state.winLine[0]];
        const winnerIsMe = state.symbols[currentUserId] === winner;
        (winnerIsMe ? gameSounds.playWin : gameSounds.playLose)();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (state.isDraw) {
        gameSounds.playDraw();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
    if (!isFinished) wasFinished.current = false;
  }, [isFinished, state.winLine, state.isDraw]);

  // Animated styles per cell
  const cellStyles = sv.map((s) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }))
  );

  // ── Win line stroke-draw animation ─────────────────────────────────────────
  const winDash = useSharedValue(WIN_LINE_LENGTH);

  useEffect(() => {
    if (state.winLine) {
      winDash.value = WIN_LINE_LENGTH;
      winDash.value = withDelay(50, withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }));
    } else {
      winDash.value = WIN_LINE_LENGTH;
    }
  }, [state.winLine]);

  const winLineAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: winDash.value,
  }));

  const winLineKey = state.winLine ? state.winLine.join(",") : null;
  const winEndpoints = winLineKey ? WIN_LINE_ENDPOINTS[winLineKey] : null;
  const winColor = state.winLine && state.board[state.winLine[0]] === "X"
    ? "#818CF8" : "#F87171";

  return (
    <View style={styles.container}>
      {/* Circular turn timer */}
      <TurnTimer timeLeft={turnTimeLeft} isActive={!isFinished && amIPlayer} />

      {/* Status bar */}
      {!!state.lastAction && (
        <View style={styles.statusBar}>
          <Text style={styles.lastAction}>{state.lastAction}</Text>
        </View>
      )}

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
                <Svg width={28} height={28} viewBox="0 0 28 28">
                  {sym === "X" ? (
                    <G>
                      <Line x1={5} y1={5} x2={23} y2={23} stroke={symColor} strokeWidth={3.5} strokeLinecap="round" />
                      <Line x1={23} y1={5} x2={5} y2={23} stroke={symColor} strokeWidth={3.5} strokeLinecap="round" />
                    </G>
                  ) : (
                    <Circle cx={14} cy={14} r={10} stroke={symColor} strokeWidth={3.5} fill="none" />
                  )}
                </Svg>
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

      {/* ── SVG BOARD ── */}
      <View style={styles.boardWrap}>
        {/* Grid lines + win line */}
        <Svg
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Rect
            x={0} y={0}
            width={BOARD_SIZE} height={BOARD_SIZE}
            rx={20} ry={20}
            fill="rgba(255,255,255,0.04)"
          />
          <Line x1={CELL}     y1={PAD}           x2={CELL}     y2={BOARD_SIZE - PAD} stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round" />
          <Line x1={CELL * 2} y1={PAD}           x2={CELL * 2} y2={BOARD_SIZE - PAD} stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round" />
          <Line x1={PAD}           y1={CELL}     x2={BOARD_SIZE - PAD} y2={CELL}     stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round" />
          <Line x1={PAD}           y1={CELL * 2} x2={BOARD_SIZE - PAD} y2={CELL * 2} stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round" />

          {/* Win line: stroke-draw via strokeDashoffset */}
          {winEndpoints && (
            <AnimatedLine
              x1={winEndpoints[0]} y1={winEndpoints[1]}
              x2={winEndpoints[2]} y2={winEndpoints[3]}
              stroke={winColor}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={WIN_LINE_LENGTH}
              animatedProps={winLineAnimatedProps}
            />
          )}
        </Svg>

        {/* Pieces — Reanimated.View with spring scale */}
        {state.board.map((cell, idx) => {
          if (!cell) return null;
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          const isWin = state.winLine?.includes(idx) ?? false;

          return (
            <Animated.View
              key={idx}
              style={[
                {
                  position: "absolute",
                  left: col * CELL,
                  top: row * CELL,
                  width: CELL,
                  height: CELL,
                  alignItems: "center",
                  justifyContent: "center",
                },
                cellStyles[idx],
              ]}
              pointerEvents="none"
            >
              {cell === "X" ? (
                <Svg width={58} height={58} viewBox="0 0 58 58">
                  <Line x1={10} y1={10} x2={48} y2={48} stroke={isWin ? "#818CF8" : "#6366F1"} strokeWidth={isWin ? 8 : 6} strokeLinecap="round" />
                  <Line x1={48} y1={10} x2={10} y2={48} stroke={isWin ? "#818CF8" : "#6366F1"} strokeWidth={isWin ? 8 : 6} strokeLinecap="round" />
                </Svg>
              ) : (
                <Svg width={58} height={58} viewBox="0 0 58 58">
                  <Circle cx={29} cy={29} r={23} stroke={isWin ? "#F87171" : "#EF4444"} strokeWidth={isWin ? 8 : 6} fill="none" />
                </Svg>
              )}
            </Animated.View>
          );
        })}

        {/* Ghost hints on empty cells when it's my turn */}
        {!isFinished && isMyTurn && amIPlayer && state.board.map((cell, idx) => {
          if (cell !== null) return null;
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          return (
            <View
              key={`hint${idx}`}
              style={{ position: "absolute", left: col * CELL, top: row * CELL, width: CELL, height: CELL, alignItems: "center", justifyContent: "center" }}
              pointerEvents="none"
            >
              {mySymbol === "X" ? (
                <Svg width={40} height={40} viewBox="0 0 40 40">
                  <Line x1={7} y1={7} x2={33} y2={33} stroke="rgba(99,102,241,0.2)" strokeWidth={5} strokeLinecap="round" />
                  <Line x1={33} y1={7} x2={7} y2={33} stroke="rgba(99,102,241,0.2)" strokeWidth={5} strokeLinecap="round" />
                </Svg>
              ) : (
                <Svg width={40} height={40} viewBox="0 0 40 40">
                  <Circle cx={20} cy={20} r={14} stroke="rgba(239,68,68,0.2)" strokeWidth={5} fill="none" />
                </Svg>
              )}
            </View>
          );
        })}

        {/* Touch targets */}
        {Array.from({ length: 9 }).map((_, idx) => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          const cell = state.board[idx];
          const canPlay = isMyTurn && !cell && !isFinished && amIPlayer;
          return (
            <Pressable
              key={`touch${idx}`}
              style={{ position: "absolute", left: col * CELL, top: row * CELL, width: CELL, height: CELL }}
              onPress={() => canPlay && onPlay(idx)}
            />
          );
        })}
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
            <Text style={styles.waitText}>تتفرج على اللعبة 👀</Text>
          )}
        </View>
      )}

      {isFinished && (
        <TouchableOpacity onPress={onReset} style={styles.resetBtn} activeOpacity={0.8}>
          <LinearGradient
            colors={["#6366F1", "#4F46E5"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.resetBtnGradient}
          >
            <Text style={styles.resetBtnText}>🔄 إنهاء اللعبة</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 4 },
  statusBar: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
    marginBottom: 14, width: "92%",
  },
  lastAction: { color: "rgba(255,255,255,0.85)", fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center" },
  playersRow: { flexDirection: "row", gap: 10, width: "92%", marginBottom: 20 },
  playerCard: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14,
    padding: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  symbolBadge: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  playerName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  youLabel: { fontSize: 10, fontFamily: "Inter_500Medium", marginTop: 2 },
  activeDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,215,0,0.2)", alignItems: "center", justifyContent: "center" },
  boardWrap: { width: BOARD_SIZE, height: BOARD_SIZE, position: "relative", marginBottom: 20 },
  turnRow: { alignItems: "center", marginTop: 4 },
  myTurnPill: {
    backgroundColor: "rgba(99,102,241,0.25)", borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(99,102,241,0.4)",
  },
  myTurnText: { color: "#6366F1", fontFamily: "Inter_700Bold", fontSize: 15 },
  waitText: { color: "rgba(255,255,255,0.45)", fontFamily: "Inter_400Regular", fontSize: 14 },
  resetBtn: { marginTop: 16, width: "80%" },
  resetBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 14 },
  resetBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
});
