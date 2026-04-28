import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { PrivateMessage } from "@/context/AppContext";

const TEXT2 = "#A0A0A0";

/**
 * AudioBubble
 * ───────────
 * Voice-message player with a tappable / draggable waveform that doubles as a
 * seek bar. Tapping anywhere on the wave seeks the loaded sound to the
 * matching position; dragging scrubs in real time. Used in chat bubbles AND
 * in the chat-info shared-audio list (with `tone="light"`).
 */
export function AudioBubble({
  msg,
  isMe,
  tone = "bubble",
}: {
  msg: PrivateMessage;
  isMe: boolean;
  tone?: "bubble" | "light";
}) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [waveWidth, setWaveWidth] = useState(0);

  // Refs so the PanResponder closures (created once via useRef) can read the
  // latest sound + width without re-mounting the responder.
  const soundRef = useRef<Audio.Sound | null>(null);
  const waveWidthRef = useRef(0);
  useEffect(() => { soundRef.current = sound; }, [sound]);
  useEffect(() => { waveWidthRef.current = waveWidth; }, [waveWidth]);

  useEffect(() => {
    return () => { sound?.unloadAsync(); };
  }, [sound]);

  const ensureSound = async (): Promise<Audio.Sound | null> => {
    if (soundRef.current) return soundRef.current;
    if (!msg.mediaUrl) return null;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
    const { sound: newSound } = await Audio.Sound.createAsync({ uri: msg.mediaUrl });
    newSound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.isLoaded) {
        const prog = status.durationMillis ? status.positionMillis / status.durationMillis : 0;
        setProgress(prog);
        if (status.didJustFinish) { setPlaying(false); setProgress(0); }
      }
    });
    setSound(newSound);
    soundRef.current = newSound;
    return newSound;
  };

  const handleTogglePlay = async () => {
    if (!msg.mediaUrl) { Alert.alert("", "ملف الصوت غير متاح"); return; }
    try {
      if (playing) { await soundRef.current?.pauseAsync(); setPlaying(false); return; }
      const s = await ensureSound();
      if (!s) return;
      await s.playAsync();
      setPlaying(true);
    } catch { Alert.alert("", "تعذر تشغيل الرسالة الصوتية"); }
  };

  const seekToFraction = useCallback(async (fraction: number) => {
    const f = Math.max(0, Math.min(1, fraction));
    setProgress(f);
    let s = soundRef.current;
    if (!s) s = await ensureSound();
    if (!s) return;
    const status: any = await s.getStatusAsync();
    if (!status.isLoaded || !status.durationMillis) return;
    await s.setPositionAsync(Math.round(status.durationMillis * f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg.mediaUrl]);

  const seekResp = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const w = waveWidthRef.current;
        if (w > 0) seekToFraction(e.nativeEvent.locationX / w);
      },
      onPanResponderMove: (e) => {
        const w = waveWidthRef.current;
        if (w > 0) seekToFraction(e.nativeEvent.locationX / w);
      },
    }),
  ).current;

  const waveHeights = [4, 8, 12, 6, 14, 8, 10, 5, 12, 7, 9, 4, 11, 6, 8, 10, 6, 12, 7, 9, 5, 11, 8];
  const palette = tone === "light"
    ? { btnBg: "#3D91F422", btnIcon: "#3D91F4", barOn: "#3D91F4", barOff: "#3D91F455", txt: TEXT2 }
    : isMe
      ? { btnBg: "rgba(255,255,255,0.25)", btnIcon: "#fff", barOn: "#fff", barOff: "rgba(255,255,255,0.4)", txt: "rgba(255,255,255,0.8)" }
      : { btnBg: "#3D91F422", btnIcon: "#3D91F4", barOn: "#3D91F4", barOff: "#3D91F455", txt: TEXT2 };

  return (
    <View style={s.audioMsg}>
      <TouchableOpacity
        onPress={handleTogglePlay}
        activeOpacity={0.8}
        style={[s.audioPlayBtn, { backgroundColor: palette.btnBg }]}
      >
        <Feather name={playing ? "pause" : "play"} size={13} color={palette.btnIcon} strokeWidth={1.5} />
      </TouchableOpacity>
      <View
        {...seekResp.panHandlers}
        onLayout={(e) => setWaveWidth(e.nativeEvent.layout.width)}
        style={s.audioWave}
      >
        {waveHeights.map((h, i) => (
          <View
            key={i}
            style={[
              s.audioBar,
              { height: h, backgroundColor: progress > i / waveHeights.length ? palette.barOn : palette.barOff },
            ]}
          />
        ))}
      </View>
      {msg.duration != null ? (
        <Text style={[s.audioDuration, { color: palette.txt }]}>
          {Math.floor(msg.duration / 60)}:{(msg.duration % 60).toString().padStart(2, "0")}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  audioMsg: { flexDirection: "row", alignItems: "center", gap: 8, minWidth: 180, paddingVertical: 4 },
  audioPlayBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  audioWave: { flex: 1, flexDirection: "row", alignItems: "center", gap: 2, height: 24 },
  audioBar: { width: 2, borderRadius: 1 },
  audioDuration: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
