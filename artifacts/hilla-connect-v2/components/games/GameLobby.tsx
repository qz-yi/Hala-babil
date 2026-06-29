import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { ClientLobbyState, GameType } from "./gameTypes";
import { GAME_INFO } from "./gameTypes";

interface Props {
  lobbyState: ClientLobbyState;
  currentUserId: string;
  isOwner: boolean;
  onJoin: () => void;
  onStart: () => void;
  onLeave: () => void;
}

export default function GameLobby({
  lobbyState, currentUserId, isOwner, onJoin, onStart, onLeave,
}: Props) {
  const { gameType, players, hostUserId } = lobbyState;
  const info = GAME_INFO[gameType as GameType];
  const amIIn = players.some((p) => p.userId === currentUserId);
  const canStart = isOwner && players.length >= info.minPlayers;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[info.color + "33", "transparent"]}
        style={styles.topGrad}
      />

      {/* Game banner */}
      <Animated.View style={[styles.gameBanner, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.gameEmoji}>{info.emoji}</Text>
        <Text style={styles.gameName}>{info.name}</Text>
      </Animated.View>

      <Text style={styles.subtitle}>
        {amIIn
          ? (isOwner ? "أنت مضيف اللعبة — انتظر حتى تكتمل الفريق" : "أنت في اللوبي — انتظر المضيف")
          : "لعبة جارية في الغرفة — انضم الآن!"}
      </Text>

      {/* Players */}
      <View style={styles.playersSection}>
        <Text style={styles.playersHeader}>
          اللاعبون ({players.length} / {info.maxPlayers})
        </Text>
        <View style={styles.playersList}>
          {players.map((p) => (
            <View key={p.userId} style={styles.playerRow}>
              <View style={[styles.avatar, { backgroundColor: p.color + "33" }]}>
                {p.avatar ? (
                  <Image source={{ uri: p.avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={[styles.avatarLetter, { color: p.color }]}>
                    {p.name[0]?.toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>{p.name}</Text>
                {p.userId === hostUserId && (
                  <Text style={styles.hostLabel}>👑 المضيف</Text>
                )}
              </View>
              {p.userId === currentUserId && (
                <View style={styles.meBadge}>
                  <Text style={styles.meBadgeText}>أنت</Text>
                </View>
              )}
              <View style={[styles.onlineDot, { backgroundColor: p.connected ? "#4CAF50" : "#666" }]} />
            </View>
          ))}

          {/* Empty slots */}
          {Array.from({ length: info.maxPlayers - players.length }).map((_, i) => (
            <View key={`empty-${i}`} style={[styles.playerRow, { opacity: 0.35 }]}>
              <View style={[styles.avatar, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
                <Ionicons name="person-add-outline" size={18} color="rgba(255,255,255,0.4)" />
              </View>
              <Text style={[styles.playerName, { color: "rgba(255,255,255,0.3)" }]}>
                في انتظار لاعب...
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Min players notice */}
      {isOwner && players.length < info.minPlayers && (
        <View style={styles.minNotice}>
          <Ionicons name="information-circle-outline" size={16} color="#FF9800" />
          <Text style={styles.minNoticeText}>
            تحتاج على الأقل {info.minPlayers} لاعبين للبدء
          </Text>
        </View>
      )}

      {/* CTA buttons */}
      <View style={styles.ctaRow}>
        {!amIIn && (
          <TouchableOpacity
            onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onJoin(); }}
            style={styles.joinBtn}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={info.gradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.joinBtnGrad}
            >
              <Ionicons name="game-controller" size={20} color="#fff" />
              <Text style={styles.joinBtnText}>انضم للعبة!</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {amIIn && isOwner && (
          <TouchableOpacity
            onPress={() => { if (canStart) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onStart(); } }}
            style={[styles.joinBtn, !canStart && { opacity: 0.5 }]}
            disabled={!canStart}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={info.gradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.joinBtnGrad}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.joinBtnText}>ابدأ اللعبة!</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onLeave(); }}
          style={styles.leaveBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="exit-outline" size={18} color="#EF4444" />
          <Text style={styles.leaveBtnText}>
            {amIIn ? "مغادرة" : "إغلاق"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 0 },
  topGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 160 },
  gameBanner: {
    alignItems: "center", paddingVertical: 20, gap: 4,
  },
  gameEmoji: { fontSize: 64 },
  gameName: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  subtitle: {
    fontSize: 14, color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular",
    textAlign: "center", marginBottom: 20,
  },
  playersSection: { flex: 1 },
  playersHeader: {
    fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10,
  },
  playersList: { gap: 8 },
  playerRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16,
    padding: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarLetter: { fontSize: 20, fontFamily: "Inter_700Bold" },
  playerName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  hostLabel: { fontSize: 11, color: "#FFD700", fontFamily: "Inter_500Medium", marginTop: 1 },
  meBadge: {
    backgroundColor: "rgba(99,102,241,0.3)", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  meBadgeText: { fontSize: 11, color: "#818CF8", fontFamily: "Inter_600SemiBold" },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  minNotice: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,152,0,0.12)", borderRadius: 12,
    padding: 10, marginBottom: 12,
    borderWidth: 1, borderColor: "rgba(255,152,0,0.25)",
  },
  minNoticeText: { fontSize: 13, color: "#FF9800", fontFamily: "Inter_500Medium", flex: 1 },
  ctaRow: { gap: 10, paddingTop: 8 },
  joinBtn: {},
  joinBtnGrad: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderRadius: 18, paddingVertical: 16,
  },
  joinBtnText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  leaveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.25)",
  },
  leaveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#EF4444" },
});
