import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Alert, Animated, Modal, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";

import { useGameEngine } from "@/hooks/useGameEngine";
import {
  GamePlayer, GameType, GAME_INFO, PLAYER_COLORS,
} from "./gameTypes";
import GameSplash from "./GameSplash";
import WinScreen from "./WinScreen";
import TicTacToeGame from "./TicTacToeGame";
import DominoGame from "./DominoGame";

interface SeatUser {
  id: string;
  name: string;
  avatar?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  currentUserId: string;
  isOwner: boolean;
  seatedUsers: SeatUser[];
}

export default function GameEngine({
  visible, onClose, roomId, currentUserId, isOwner, seatedUsers,
}: Props) {
  const [gamePickerVisible, setGamePickerVisible] = useState(false);
  const [playerPickerVisible, setPlayerPickerVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const slideAnim = useRef(new Animated.Value(1000)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  const {
    game, isMyTurn, amIPlayer,
    startGame, endGame,
    ticTacToePlay, ticTacToeReset,
    dominoPlayTile, dominoDrawFromBoneyard,
  } = useGameEngine(currentUserId);

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 10 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(bgOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 1000, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSelectGame = (gt: GameType) => {
    setSelectedGame(gt);
    setGamePickerVisible(false);
    setSelectedPlayers([]);
    setPlayerPickerVisible(true);
  };

  const togglePlayer = (userId: string) => {
    const maxPlayers = selectedGame ? GAME_INFO[selectedGame].maxPlayers : 4;
    setSelectedPlayers((prev) => {
      if (prev.includes(userId)) return prev.filter((id) => id !== userId);
      if (prev.length >= maxPlayers) return prev;
      return [...prev, userId];
    });
  };

  const handleStartGame = () => {
    if (!selectedGame) return;
    const info = GAME_INFO[selectedGame];
    if (selectedPlayers.length < info.minPlayers) {
      Alert.alert("", `هذه اللعبة تحتاج على الأقل ${info.minPlayers} لاعبين`);
      return;
    }
    if (selectedPlayers.length > info.maxPlayers) {
      Alert.alert("", `الحد الأقصى ${info.maxPlayers} لاعبين لهذه اللعبة`);
      return;
    }

    const players: GamePlayer[] = selectedPlayers.map((uid, i) => {
      const user = seatedUsers.find((u) => u.id === uid);
      return {
        id: uid,
        name: user?.name ?? `لاعب ${i + 1}`,
        avatar: user?.avatar,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      };
    });

    setPlayerPickerVisible(false);
    startGame(selectedGame, players);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleEndGame = () => {
    Alert.alert("إنهاء اللعبة", "هل تريد إنهاء اللعبة الحالية؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "إنهاء",
        style: "destructive",
        onPress: () => {
          endGame();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  const winnerPlayer = game?.winner
    ? game.players.find((p) => p.id === game.winner) ?? null
    : null;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
        <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
          {/* ─── Header ─── */}
          <LinearGradient
            colors={game ? (GAME_INFO[game.gameType]?.gradient ?? ["#1a1a2e", "#16213e"]) : ["#1a1a2e", "#16213e"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={onClose} style={styles.headerCloseBtn}>
                <Ionicons name="chevron-down" size={22} color="#fff" />
              </TouchableOpacity>

              <View style={styles.headerCenter}>
                {game && game.status !== "idle" && game.status !== "selecting" ? (
                  <>
                    <Text style={styles.headerEmoji}>{GAME_INFO[game.gameType]?.emoji}</Text>
                    <Text style={styles.headerTitle}>{GAME_INFO[game.gameType]?.name}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.headerEmoji}>🎮</Text>
                    <Text style={styles.headerTitle}>ألعاب الغرفة</Text>
                  </>
                )}
              </View>

              {game && game.status === "playing" && (isOwner || amIPlayer) ? (
                <TouchableOpacity onPress={handleEndGame} style={styles.endGameBtn}>
                  <Ionicons name="stop-circle-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 36 }} />
              )}
            </View>

            {/* Spectator / Player badge */}
            {game && game.status === "playing" && (
              <View style={styles.roleBadge}>
                {amIPlayer ? (
                  <View style={[styles.rolePill, { backgroundColor: "rgba(76,175,80,0.3)" }]}>
                    <Ionicons name="game-controller" size={14} color="#4CAF50" />
                    <Text style={[styles.roleText, { color: "#4CAF50" }]}>أنت لاعب</Text>
                  </View>
                ) : (
                  <View style={[styles.rolePill, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                    <Ionicons name="eye-outline" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={[styles.roleText, { color: "rgba(255,255,255,0.7)" }]}>وضع المشاهدة</Text>
                  </View>
                )}
                {isMyTurn && (
                  <View style={[styles.rolePill, { backgroundColor: "rgba(255,215,0,0.25)" }]}>
                    <Text style={{ fontSize: 10 }}>⚡</Text>
                    <Text style={[styles.roleText, { color: "#FFD700" }]}>دورك الآن!</Text>
                  </View>
                )}
              </View>
            )}
          </LinearGradient>

          {/* ─── Content ─── */}
          <View style={styles.content}>
            {/* No game running — show lobby */}
            {(!game || game.status === "idle") && (
              <View style={styles.lobby}>
                <Text style={styles.lobbyTitle}>اختر لعبة للبدء 🎮</Text>
                <Text style={styles.lobbySubtitle}>
                  {isOwner ? "بما أنك صاحب الغرفة، يمكنك اختيار اللعبة" : "انتظر حتى يبدأ صاحب الغرفة لعبة"}
                </Text>

                {isOwner && (
                  <TouchableOpacity onPress={() => setGamePickerVisible(true)} style={styles.startGameBtn}>
                    <LinearGradient
                      colors={["#6366F1", "#4F46E5"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.startGameBtnGradient}
                    >
                      <Ionicons name="game-controller" size={22} color="#fff" />
                      <Text style={styles.startGameBtnText}>ابدأ لعبة جديدة</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <View style={styles.gameGrid}>
                  {(Object.entries(GAME_INFO) as [GameType, typeof GAME_INFO.tictactoe][]).map(([gt, info]) => (
                    <View key={gt} style={[styles.gameInfoCard, { borderColor: info.color + "55" }]}>
                      <Text style={styles.gameInfoEmoji}>{info.emoji}</Text>
                      <Text style={styles.gameInfoName}>{info.name}</Text>
                      <Text style={styles.gameInfoPlayers}>{info.minPlayers}–{info.maxPlayers} لاعبين</Text>
                      <Text style={styles.gameInfoDesc}>{info.description}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Splash */}
            {game && game.status === "splash" && (
              <GameSplash gameType={game.gameType} />
            )}

            {/* Playing */}
            {game && game.status === "playing" && (
              <>
                {game.gameType === "tictactoe" && game.tictactoe && (
                  <TicTacToeGame
                    state={game.tictactoe}
                    players={game.players}
                    currentTurnIndex={game.currentTurnIndex}
                    currentUserId={currentUserId}
                    isMyTurn={isMyTurn}
                    amIPlayer={amIPlayer}
                    onPlay={ticTacToePlay}
                    onReset={ticTacToeReset}
                  />
                )}
                {game.gameType === "domino" && game.domino && (
                  <DominoGame
                    state={game.domino}
                    players={game.players}
                    currentTurnIndex={game.currentTurnIndex}
                    currentUserId={currentUserId}
                    isMyTurn={isMyTurn}
                    amIPlayer={amIPlayer}
                    onPlayTile={dominoPlayTile}
                    onDrawFromBoneyard={dominoDrawFromBoneyard}
                  />
                )}
              </>
            )}

            {/* Win screen */}
            {game && game.status === "finished" && (
              <WinScreen
                winner={winnerPlayer}
                gameType={game.gameType}
                players={game.players}
                scores={game.domino ? game.domino.scores : undefined}
                onClose={endGame}
              />
            )}
          </View>
        </Animated.View>
      </Animated.View>

      {/* ─── Game Picker Modal ─── */}
      <Modal visible={gamePickerVisible} transparent animationType="slide" onRequestClose={() => setGamePickerVisible(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setGamePickerVisible(false)} />
        <View style={styles.pickerSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.pickerTitle}>اختر لعبة 🎮</Text>
          <ScrollView contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 32 }}>
            {(Object.entries(GAME_INFO) as [GameType, typeof GAME_INFO.tictactoe][]).map(([gt, info]) => (
              <TouchableOpacity
                key={gt}
                onPress={() => { handleSelectGame(gt); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={info.gradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.gamePickerCard}
                >
                  <Text style={styles.gamePickerEmoji}>{info.emoji}</Text>
                  <View style={styles.gamePickerInfo}>
                    <Text style={styles.gamePickerName}>{info.name}</Text>
                    <Text style={styles.gamePickerDesc}>{info.description}</Text>
                    <Text style={styles.gamePickerPlayers}>👥 {info.minPlayers}–{info.maxPlayers} لاعبين</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Player Picker Modal ─── */}
      <Modal visible={playerPickerVisible} transparent animationType="slide" onRequestClose={() => setPlayerPickerVisible(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setPlayerPickerVisible(false)} />
        <View style={styles.pickerSheet}>
          <View style={styles.sheetHandle} />
          {selectedGame && (
            <>
              <View style={styles.pickerHeader}>
                <Text style={styles.gamePickerEmoji}>{GAME_INFO[selectedGame].emoji}</Text>
                <View>
                  <Text style={styles.pickerTitle}>{GAME_INFO[selectedGame].name}</Text>
                  <Text style={styles.pickerSubtitle}>
                    اختر {GAME_INFO[selectedGame].minPlayers}–{GAME_INFO[selectedGame].maxPlayers} لاعبين من المقاعد
                  </Text>
                </View>
              </View>

              <ScrollView contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
                {seatedUsers.length === 0 ? (
                  <View style={styles.noSeatedMsg}>
                    <Ionicons name="people-outline" size={40} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.noSeatedText}>لا يوجد أحد في المقاعد حتى الآن</Text>
                  </View>
                ) : (
                  seatedUsers.map((u, i) => {
                    const selected = selectedPlayers.includes(u.id);
                    const color = PLAYER_COLORS[selectedPlayers.indexOf(u.id) % PLAYER_COLORS.length];
                    return (
                      <TouchableOpacity
                        key={u.id}
                        onPress={() => { togglePlayer(u.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[styles.playerPickerItem, selected && { borderColor: color, borderWidth: 2 }]}
                      >
                        <View style={[styles.playerPickerAvatar, { backgroundColor: (selected ? color : "#666") + "44" }]}>
                          <Text style={{ fontSize: 18, color: selected ? color : "#999" }}>
                            {u.name[0]?.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.playerPickerName}>{u.name}</Text>
                        {selected && (
                          <View style={[styles.selectedBadge, { backgroundColor: color }]}>
                            <Text style={styles.selectedBadgeText}>{selectedPlayers.indexOf(u.id) + 1}</Text>
                          </View>
                        )}
                        {!selected && (
                          <View style={styles.unselectedCircle}>
                            <Ionicons name="add" size={16} color="rgba(255,255,255,0.4)" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              <View style={styles.pickerFooter}>
                <Text style={styles.pickerCount}>
                  {selectedPlayers.length} / {GAME_INFO[selectedGame].maxPlayers} لاعبين
                </Text>
                <TouchableOpacity
                  onPress={handleStartGame}
                  disabled={selectedPlayers.length < GAME_INFO[selectedGame].minPlayers}
                  style={[styles.startBtn, selectedPlayers.length < GAME_INFO[selectedGame].minPlayers && { opacity: 0.5 }]}
                >
                  <LinearGradient
                    colors={GAME_INFO[selectedGame].gradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.startBtnGradient}
                  >
                    <Ionicons name="game-controller" size={20} color="#fff" />
                    <Text style={styles.startBtnText}>ابدأ اللعبة!</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  panel: {
    height: "92%", backgroundColor: "#0f0f1a",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  headerCloseBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
  },
  headerEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  endGameBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(255,107,107,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  roleBadge: { flexDirection: "row", gap: 8, marginTop: 6 },
  rolePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  content: { flex: 1 },
  lobby: { flex: 1, padding: 16 },
  lobbyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center", marginBottom: 6 },
  lobbySubtitle: { fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 20 },
  startGameBtn: { marginBottom: 20 },
  startGameBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderRadius: 18, paddingVertical: 16,
  },
  startGameBtnText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  gameGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gameInfoCard: {
    width: "47%", backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16, padding: 14, gap: 4,
    borderWidth: 1,
  },
  gameInfoEmoji: { fontSize: 28 },
  gameInfoName: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  gameInfoPlayers: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  gameInfoDesc: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular", lineHeight: 16 },
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  pickerSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 12, maxHeight: "80%",
    borderTopWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignSelf: "center", marginBottom: 12,
  },
  pickerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff", paddingHorizontal: 16, marginBottom: 4 },
  pickerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", paddingHorizontal: 16, marginBottom: 12 },
  pickerHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  gamePickerCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 18, padding: 16,
  },
  gamePickerEmoji: { fontSize: 36 },
  gamePickerInfo: { flex: 1, gap: 2 },
  gamePickerName: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  gamePickerDesc: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular" },
  gamePickerPlayers: { fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "Inter_500Medium", marginTop: 2 },
  playerPickerItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  playerPickerAvatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  playerPickerName: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  selectedBadge: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  selectedBadgeText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  unselectedCircle: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  noSeatedMsg: { alignItems: "center", gap: 12, paddingVertical: 40 },
  noSeatedText: { fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "Inter_400Regular", textAlign: "center" },
  pickerFooter: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)",
  },
  pickerCount: { fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_500Medium" },
  startBtn: { flex: 1 },
  startBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 16, paddingVertical: 14,
  },
  startBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});
