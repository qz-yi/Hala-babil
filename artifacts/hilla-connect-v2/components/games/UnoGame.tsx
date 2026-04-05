import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Animated, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { UnoCard, UnoColor, UnoState, GamePlayer } from "./gameTypes";

const COLOR_MAP: Record<UnoColor, string> = {
  red: "#E53935",
  green: "#43A047",
  blue: "#1E88E5",
  yellow: "#FDD835",
  wild: "#6A1B9A",
};

const COLOR_EMOJI: Record<UnoColor, string> = {
  red: "🔴",
  green: "🟢",
  blue: "🔵",
  yellow: "🟡",
  wild: "🌈",
};

function UnoCardView({
  card, onPress, disabled, small,
}: { card: UnoCard; onPress?: () => void; disabled?: boolean; small?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled || !onPress) return;
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, tension: 100, friction: 10 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const bg = COLOR_MAP[card.color];
  const size = small ? styles.cardSmall : styles.card;
  const textSize = small ? 10 : 14;

  const label = card.action
    ? ({ skip: "⊘", reverse: "⇄", draw2: "+2", wild: "★", wild4: "+4★" }[card.action] ?? "?")
    : `${card.value}`;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={[size, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }]}
      >
        <Text style={[styles.cardTopLeft, { fontSize: textSize, color: card.color === "yellow" ? "#333" : "#fff" }]}>
          {label}
        </Text>
        <Text style={[styles.cardCenter, { color: card.color === "yellow" ? "#333" : "#fff" }]}>
          {card.action ? label : `${card.value}`}
        </Text>
        <Text style={[styles.cardBottomRight, { fontSize: textSize, color: card.color === "yellow" ? "#333" : "#fff" }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

interface Props {
  state: UnoState;
  players: GamePlayer[];
  currentTurnIndex: number;
  currentUserId: string;
  isMyTurn: boolean;
  amIPlayer: boolean;
  onPlayCard: (cardId: string, chosenColor?: UnoColor) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onChooseColor: (color: UnoColor) => void;
}

export default function UnoGame({
  state, players, currentTurnIndex, currentUserId, isMyTurn,
  amIPlayer, onPlayCard, onDrawCard, onCallUno, onChooseColor,
}: Props) {
  const topCard = state.discardPile[state.discardPile.length - 1];
  const myHand = state.hands[currentUserId] ?? [];
  const currentPlayer = players[currentTurnIndex];

  const colors: UnoColor[] = ["red", "green", "blue", "yellow"];

  if (state.choosingColor && isMyTurn) {
    return (
      <View style={styles.colorPickerOverlay}>
        <Text style={styles.colorPickTitle}>اختر لون الوايلد 🎨</Text>
        <View style={styles.colorGrid}>
          {colors.map((c) => (
            <TouchableOpacity key={c} onPress={() => onChooseColor(c)} style={[styles.colorBtn, { backgroundColor: COLOR_MAP[c] }]}>
              <Text style={styles.colorBtnEmoji}>{COLOR_EMOJI[c]}</Text>
              <Text style={styles.colorBtnLabel}>{c === "red" ? "أحمر" : c === "green" ? "أخضر" : c === "blue" ? "أزرق" : "أصفر"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── Opponent cards summary ─── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.opponentsRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {players.filter((p) => p.id !== currentUserId).map((p) => {
          const hand = state.hands[p.id] ?? [];
          const isTheirTurn = players[currentTurnIndex]?.id === p.id;
          return (
            <View key={p.id} style={[styles.opponentChip, isTheirTurn && { borderColor: p.color, borderWidth: 2 }]}>
              <View style={[styles.opponentAvatar, { backgroundColor: p.color + "44" }]}>
                <Text style={{ fontSize: 14, color: p.color }}>{p.name[0]?.toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.opponentName}>{p.name.split(" ")[0]}</Text>
                <Text style={styles.opponentCards}>🃏 {hand.length}</Text>
              </View>
              {isTheirTurn && <View style={styles.turnDot} />}
              {hand.length === 1 && <Text style={styles.unoBadge}>UNO!</Text>}
            </View>
          );
        })}
      </ScrollView>

      {/* ─── Game Table ─── */}
      <View style={styles.table}>
        {/* Direction indicator */}
        <Text style={styles.directionText}>
          {state.direction === 1 ? "↻ في الاتجاه" : "↺ عكس الاتجاه"}
        </Text>

        {/* Draw pile */}
        <TouchableOpacity
          onPress={isMyTurn && amIPlayer ? onDrawCard : undefined}
          disabled={!isMyTurn || !amIPlayer}
          style={[styles.drawPile, { opacity: isMyTurn && amIPlayer ? 1 : 0.6 }]}
        >
          <Text style={styles.drawPileEmoji}>🂠</Text>
          <Text style={styles.drawPileCount}>{state.deckSize}</Text>
          {state.drawStack > 0 && (
            <View style={styles.drawStackBadge}>
              <Text style={styles.drawStackText}>+{state.drawStack}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Discard pile */}
        <View style={styles.discardArea}>
          {topCard && <UnoCardView card={topCard} disabled />}
          <View style={[styles.colorIndicator, { backgroundColor: COLOR_MAP[state.currentColor] }]}>
            <Text style={styles.colorIndicatorEmoji}>{COLOR_EMOJI[state.currentColor]}</Text>
          </View>
        </View>
      </View>

      {/* ─── Last action ─── */}
      <View style={styles.lastActionBar}>
        <Text style={styles.lastActionText}>{state.lastAction}</Text>
      </View>

      {/* ─── Turn indicator ─── */}
      <View style={styles.turnBar}>
        <View style={[styles.turnDotLarge, { backgroundColor: currentPlayer?.color ?? "#fff" }]} />
        <Text style={styles.turnText}>
          {isMyTurn ? "🎴 دورك! العب ورقة أو اسحب" : `⏳ دور ${currentPlayer?.name}`}
        </Text>
      </View>

      {/* ─── My hand ─── */}
      {amIPlayer ? (
        <View style={styles.handArea}>
          <Text style={styles.handLabel}>يدك ({myHand.length} ورقة)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
            {myHand.map((card) => {
              const playable = isMyTurn && (
                state.drawStack > 0
                  ? (card.action === "draw2" || card.action === "wild4" || card.action === "wild")
                  : (card.color === state.currentColor || card.color === "wild" ||
                    (topCard && (card.value === topCard.value || card.action === topCard.action)))
              );
              return (
                <UnoCardView
                  key={card.id}
                  card={card}
                  onPress={() => onPlayCard(card.id)}
                  disabled={!playable}
                />
              );
            })}
          </ScrollView>
          {myHand.length === 1 && (
            <TouchableOpacity onPress={onCallUno} style={styles.unoBtn}>
              <Text style={styles.unoBtnText}>📢 UNO!</Text>
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
  opponentsRow: { maxHeight: 70, paddingVertical: 8 },
  opponentChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  opponentAvatar: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  opponentName: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  opponentCards: { fontSize: 10, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" },
  turnDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4CAF50", position: "absolute", top: 4, right: 4 },
  unoBadge: { position: "absolute", top: -8, right: -4, backgroundColor: "#E53935", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  table: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 24, paddingHorizontal: 20,
  },
  directionText: {
    position: "absolute", top: 8, alignSelf: "center",
    fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_500Medium",
  },
  drawPile: {
    width: 64, height: 92, borderRadius: 12,
    backgroundColor: "#1a237e", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
  },
  drawPileEmoji: { fontSize: 32 },
  drawPileCount: { fontSize: 11, color: "#fff", fontFamily: "Inter_700Bold", marginTop: 2 },
  drawStackBadge: {
    position: "absolute", top: -8, right: -8,
    backgroundColor: "#E53935", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  drawStackText: { fontSize: 12, color: "#fff", fontFamily: "Inter_700Bold" },
  discardArea: { alignItems: "center", gap: 6 },
  colorIndicator: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.5)",
  },
  colorIndicatorEmoji: { fontSize: 16 },
  card: {
    width: 64, height: 92, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 4,
    position: "relative",
  },
  cardSmall: {
    width: 44, height: 64, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    elevation: 2,
  },
  cardTopLeft: { position: "absolute", top: 4, left: 6, fontFamily: "Inter_700Bold" },
  cardCenter: { fontSize: 28, fontFamily: "Inter_700Bold" },
  cardBottomRight: { position: "absolute", bottom: 4, right: 6, fontFamily: "Inter_700Bold" },
  lastActionBar: {
    marginHorizontal: 16, padding: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12, alignItems: "center",
  },
  lastActionText: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_500Medium", textAlign: "center" },
  turnBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  turnDotLarge: { width: 10, height: 10, borderRadius: 5 },
  turnText: { fontSize: 14, color: "#fff", fontFamily: "Inter_600SemiBold", flex: 1 },
  handArea: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 8 },
  handLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_500Medium", paddingHorizontal: 16 },
  unoBtn: {
    marginHorizontal: 16, marginTop: 8, backgroundColor: "#E53935",
    borderRadius: 14, paddingVertical: 10, alignItems: "center",
  },
  unoBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  spectatorBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    padding: 16, backgroundColor: "rgba(0,0,0,0.3)",
  },
  spectatorText: { fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_500Medium" },
  colorPickerOverlay: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.85)", padding: 24,
  },
  colorPickTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 24 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "center" },
  colorBtn: {
    width: 100, height: 100, borderRadius: 20,
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  colorBtnEmoji: { fontSize: 36 },
  colorBtnLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
});
