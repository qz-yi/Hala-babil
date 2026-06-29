import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated, Modal, Pressable, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";

import { useGameEngine } from "@/hooks/useGameEngine";
import {
  GameType, GAME_INFO,
} from "./gameTypes";
import GameSplash from "./GameSplash";
import GameLobby from "./GameLobby";
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
  const [confirmEndVisible, setConfirmEndVisible] = useState(false);

  // Derive current user info from seated users list
  const currentSeat = seatedUsers.find((u) => u.id === currentUserId);
  const currentUserName = currentSeat?.name ?? "لاعب";
  const currentUserAvatar = currentSeat?.avatar;

  const slideAnim = useRef(new Animated.Value(1000)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  const {
    game, isMyTurn, amIPlayer, turnTimeLeft,
    isHost, lobbyState, endedResult, playerLeft, gameError,
    createGame, joinGame, startGame, endGame, queryRoom, clearError, clearEnded,
    ticTacToePlay, ticTacToeReset,
    dominoPlayTile, dominoDrawFromBoneyard,
  } = useGameEngine(currentUserId, currentUserName, currentUserAvatar, roomId);

  // Slide animation
  useEffect(() => {
    if (visible) {
      queryRoom();
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

  // Determine what to render
  const showEndScreen = !!endedResult || game?.status === "finished";
  const showPlaying = !showEndScreen && game?.status === "playing";
  const showLobby = !showEndScreen && !showPlaying && !!lobbyState;
  const showSplash = !showEndScreen && !showPlaying && !showLobby && game?.status === "splash";
  const showNoGame = !showEndScreen && !showPlaying && !showLobby && !showSplash;

  const handleSelectGame = (gt: GameType) => {
    setGamePickerVisible(false);
    createGame(gt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Winner for WinScreen
  const winnerPlayer = endedResult?.winnerId
    ? (game?.players.find((p) => p.id === endedResult.winnerId) ?? null)
    : null;

  const gameTypeName = game?.gameType ?? lobbyState?.gameType;
  const headerGradient = gameTypeName
    ? (GAME_INFO[gameTypeName]?.gradient ?? (["#1a1a2e", "#16213e"] as [string, string]))
    : (["#1a1a2e", "#16213e"] as [string, string]);

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
            colors={headerGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={onClose} style={styles.headerCloseBtn}>
                <Ionicons name="chevron-down" size={22} color="#fff" />
              </TouchableOpacity>

              <View style={styles.headerCenter}>
                {gameTypeName ? (
                  <>
                    <Text style={styles.headerEmoji}>{GAME_INFO[gameTypeName]?.emoji}</Text>
                    <Text style={styles.headerTitle}>{GAME_INFO[gameTypeName]?.name}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.headerEmoji}>🎮</Text>
                    <Text style={styles.headerTitle}>ألعاب الغرفة</Text>
                  </>
                )}
              </View>

              {showPlaying && (isOwner || amIPlayer || isHost) ? (
                <TouchableOpacity
                  onPress={() => setConfirmEndVisible(true)}
                  style={styles.endGameBtn}
                >
                  <Ionicons name="stop-circle-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 36 }} />
              )}
            </View>

            {/* Role badge */}
            {showPlaying && (
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

          {/* ─── Player-left banner ─── */}
          {playerLeft && (
            <View style={styles.playerLeftBanner}>
              <Ionicons name="person-remove-outline" size={16} color="#FF9800" />
              <Text style={styles.playerLeftText}>
                {playerLeft.name} {playerLeft.temporary ? "انقطع الاتصال مؤقتاً ⏳" : "غادر اللعبة 👋"}
              </Text>
            </View>
          )}

          {/* ─── Content ─── */}
          <View style={styles.content}>

            {/* No game running */}
            {showNoGame && (
              <View style={styles.noGameArea}>
                <Text style={styles.lobbyTitle}>ألعاب الغرفة 🎮</Text>
                <Text style={styles.lobbySubtitle}>
                  {isOwner
                    ? "اختر لعبة وابدأ مع اللاعبين في الغرفة"
                    : "انتظر حتى يبدأ صاحب الغرفة لعبة"}
                </Text>

                {isOwner && (
                  <TouchableOpacity
                    onPress={() => setGamePickerVisible(true)}
                    style={styles.startGameBtn}
                  >
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

            {/* Lobby */}
            {showLobby && (
              <GameLobby
                lobbyState={lobbyState!}
                currentUserId={currentUserId}
                isOwner={isOwner || isHost}
                onJoin={joinGame}
                onStart={startGame}
                onLeave={() => { endGame(); }}
              />
            )}

            {/* Splash / countdown */}
            {showSplash && game && (
              <GameSplash gameType={game.gameType} />
            )}

            {/* Playing */}
            {showPlaying && game && (
              <>
                {game.gameType === "tictactoe" && game.tictactoe && (
                  <TicTacToeGame
                    state={game.tictactoe}
                    players={game.players}
                    currentTurnIndex={game.currentTurnIndex}
                    currentUserId={currentUserId}
                    isMyTurn={isMyTurn}
                    amIPlayer={amIPlayer}
                    turnTimeLeft={turnTimeLeft}
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
                    turnTimeLeft={turnTimeLeft}
                    onPlayTile={dominoPlayTile}
                    onDrawFromBoneyard={dominoDrawFromBoneyard}
                  />
                )}
              </>
            )}

            {/* End screen */}
            {showEndScreen && (
              <WinScreen
                winner={winnerPlayer}
                gameType={game?.gameType ?? "tictactoe"}
                players={game?.players ?? []}
                scores={game?.domino?.scores ?? endedResult?.finalScores}
                onClose={() => { clearEnded(); }}
              />
            )}
          </View>
        </Animated.View>
      </Animated.View>

      {/* ─── Game Picker Modal ─── */}
      <Modal
        visible={gamePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGamePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setGamePickerVisible(false)}
        />
        <View style={styles.pickerSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.pickerTitle}>اختر لعبة 🎮</Text>
          <ScrollView
            contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 32 }}
          >
            {(Object.entries(GAME_INFO) as [GameType, typeof GAME_INFO.tictactoe][]).map(([gt, info]) => (
              <TouchableOpacity
                key={gt}
                onPress={() => {
                  handleSelectGame(gt);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
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
                    <Text style={styles.gamePickerPlayers}>
                      👥 {info.minPlayers}–{info.maxPlayers} لاعبين
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Confirm End Game Modal ─── */}
      <Modal
        visible={confirmEndVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmEndVisible(false)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setConfirmEndVisible(false)} />
        <View style={styles.confirmSheet}>
          <Text style={styles.confirmTitle}>إنهاء اللعبة؟</Text>
          <Text style={styles.confirmMsg}>ستنتهي اللعبة لجميع اللاعبين وسيُحتسب الخروج خسارة.</Text>
          <View style={styles.confirmBtns}>
            <TouchableOpacity
              onPress={() => setConfirmEndVisible(false)}
              style={styles.confirmCancel}
            >
              <Text style={styles.confirmCancelText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setConfirmEndVisible(false);
                endGame();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={styles.confirmEnd}
            >
              <Text style={styles.confirmEndText}>إنهاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Game Error Modal ─── */}
      <Modal
        visible={!!gameError}
        transparent
        animationType="fade"
        onRequestClose={clearError}
      >
        <Pressable style={styles.confirmOverlay} onPress={clearError} />
        <View style={styles.confirmSheet}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
          </View>
          <Text style={styles.confirmTitle}>خطأ</Text>
          <Text style={styles.confirmMsg}>{gameError}</Text>
          <TouchableOpacity onPress={clearError} style={styles.errorOkBtn}>
            <Text style={styles.errorOkText}>حسناً</Text>
          </TouchableOpacity>
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
  playerLeftBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,152,0,0.12)", padding: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,152,0,0.2)",
  },
  playerLeftText: {
    fontSize: 13, color: "#FF9800", fontFamily: "Inter_500Medium", flex: 1,
  },
  content: { flex: 1 },
  noGameArea: { flex: 1, padding: 16 },
  lobbyTitle: {
    fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff",
    textAlign: "center", marginBottom: 6,
  },
  lobbySubtitle: {
    fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular",
    textAlign: "center", marginBottom: 20,
  },
  startGameBtn: { marginBottom: 20 },
  startGameBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderRadius: 18, paddingVertical: 16,
  },
  startGameBtnText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  gameGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gameInfoCard: {
    width: "47%", backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16, padding: 14, gap: 4, borderWidth: 1,
  },
  gameInfoEmoji: { fontSize: 28 },
  gameInfoName: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  gameInfoPlayers: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  gameInfoDesc: {
    fontSize: 12, color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular", lineHeight: 16,
  },
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
  pickerTitle: {
    fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff",
    paddingHorizontal: 16, marginBottom: 12,
  },
  gamePickerCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 18, padding: 16,
  },
  gamePickerEmoji: { fontSize: 36 },
  gamePickerInfo: { flex: 1, gap: 2 },
  gamePickerName: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  gamePickerDesc: {
    fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular",
  },
  gamePickerPlayers: {
    fontSize: 12, color: "rgba(255,255,255,0.55)",
    fontFamily: "Inter_500Medium", marginTop: 2,
  },
  confirmOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.72)",
  },
  confirmSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#121212",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 12,
    borderWidth: 1, borderColor: "#262626",
  },
  confirmTitle: {
    fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center",
  },
  confirmMsg: {
    fontSize: 14, color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20,
  },
  confirmBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  confirmCancel: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14, paddingVertical: 14, alignItems: "center",
  },
  confirmCancelText: {
    fontSize: 15, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.7)",
  },
  confirmEnd: {
    flex: 1, backgroundColor: "rgba(239,68,68,0.2)",
    borderRadius: 14, paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(239,68,68,0.4)",
  },
  confirmEndText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#EF4444" },
  errorIcon: { alignItems: "center" },
  errorOkBtn: {
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14,
    paddingVertical: 14, alignItems: "center", marginTop: 4,
  },
  errorOkText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
