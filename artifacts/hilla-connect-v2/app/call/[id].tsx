import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useThemeStore } from "@/store/themeStore";
import { getSocket } from "@/hooks/useSocket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type CallType = "audio" | "video";

export default function CallScreen() {
  const { id, type: callType, name, avatar } = useLocalSearchParams<{
    id: string;
    type: CallType;
    name: string;
    avatar: string;
  }>();

  const { currentUser } = useApp();
  const insets = useSafeAreaInsets();
  const c = useThemeStore((s) => s.tokens);

  const [status, setStatus] = useState<"connecting" | "ringing" | "active" | "ended">("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callRoomId = `call_${[currentUser?.id, id].sort().join("_")}`;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const endCall = useCallback(() => {
    getSocket().emit("end-call", callRoomId);
    cleanup();
    router.back();
  }, [callRoomId]);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    peerRef.current = null;
    setStatus("ended");
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  };

  const initWebRTC = useCallback(async () => {
    if (!currentUser) return;

    if (Platform.OS !== "web") {
      setStatus("active");
      startTimer();
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === "video",
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        Alert.alert("خطأ", "تعذر الوصول إلى الميكروفون/الكاميرا. تحقق من الصلاحيات.");
        router.back();
        return;
      }

      localStreamRef.current = stream;

      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setStatus("active");
        startTimer();
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket().emit("ice-candidate", callRoomId, event.candidate, currentUser.id);
        }
      };

      const socket = getSocket();
      socket.emit("join-room", callRoomId, currentUser.id);

      socket.on("user-connected", async (_userId: string) => {
        setStatus("ringing");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", callRoomId, offer, currentUser.id);
      });

      socket.on("offer", async (offer: RTCSessionDescriptionInit) => {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", callRoomId, answer, currentUser.id);
        setStatus("active");
        startTimer();
      });

      socket.on("answer", async (answer: RTCSessionDescriptionInit) => {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        setStatus("active");
        startTimer();
      });

      socket.on("ice-candidate", async (candidate: RTCIceCandidateInit) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {}
      });

      socket.on("call-ended", () => {
        cleanup();
        router.back();
      });

      setStatus("ringing");
    } catch (err) {
      console.error("[call] WebRTC init error:", err);
      router.back();
    }
  }, [currentUser, callType, callRoomId]);

  useEffect(() => {
    initWebRTC();
    return () => {
      cleanup();
      const socket = getSocket();
      socket.off("user-connected");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, []);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((m) => !m);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCamOff((c) => !c);
  };

  const statusLabel =
    status === "connecting" ? "جارٍ الاتصال..." :
    status === "ringing" ? "يرن..." :
    status === "active" ? formatDuration(callDuration) :
    "انتهت المكالمة";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background */}
      <View style={styles.bg} />

      {/* Remote video (web only) */}
      {Platform.OS === "web" && callType === "video" && (
        <video
          ref={remoteVideoRef as any}
          autoPlay
          playsInline
          style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" } as any}
        />
      )}

      {/* Avatar / caller info */}
      <View style={styles.callerInfo}>
        {avatar ? (
          <Image source={{ uri: decodeURIComponent(avatar) }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{name?.[0] || "?"}</Text>
          </View>
        )}
        <Text style={styles.callerName}>{decodeURIComponent(name || "")}</Text>
        <Text style={styles.statusText}>{statusLabel}</Text>
        {status === "connecting" && <ActivityIndicator color="white" style={{ marginTop: 12 }} />}
      </View>

      {/* Local video preview (web only, video call) */}
      {Platform.OS === "web" && callType === "video" && (
        <View style={styles.localVideoContainer}>
          <video
            ref={localVideoRef as any}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" } as any}
          />
        </View>
      )}

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
        {/* Mute */}
        <TouchableOpacity
          style={[styles.ctrlBtn, isMuted && styles.ctrlBtnActive]}
          onPress={toggleMute}
        >
          <Feather name={isMuted ? "mic-off" : "mic"} size={24} color="white" />
          <Text style={styles.ctrlLabel}>{isMuted ? "إلغاء الكتم" : "كتم"}</Text>
        </TouchableOpacity>

        {/* Camera toggle (video only) */}
        {callType === "video" && (
          <TouchableOpacity
            style={[styles.ctrlBtn, isCamOff && styles.ctrlBtnActive]}
            onPress={toggleCamera}
          >
            <Feather name={isCamOff ? "video-off" : "video"} size={24} color="white" />
            <Text style={styles.ctrlLabel}>{isCamOff ? "تشغيل الكاميرا" : "إيقاف الكاميرا"}</Text>
          </TouchableOpacity>
        )}

        {/* Speaker */}
        <TouchableOpacity
          style={[styles.ctrlBtn, isSpeaker && styles.ctrlBtnActive]}
          onPress={() => setIsSpeaker((s) => !s)}
        >
          <Ionicons name={isSpeaker ? "volume-high" : "volume-medium"} size={24} color="white" />
          <Text style={styles.ctrlLabel}>مكبر الصوت</Text>
        </TouchableOpacity>

        {/* End Call */}
        <TouchableOpacity style={styles.endBtn} onPress={endCall}>
          <Feather name="phone-off" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a1a2e",
  },
  callerInfo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "white",
    fontSize: 40,
    fontWeight: "700",
  },
  callerName: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
  },
  statusText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
  },
  localVideoContainer: {
    position: "absolute",
    top: 100,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "#000",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  ctrlBtn: {
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 50,
    padding: 16,
  },
  ctrlBtnActive: {
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  ctrlLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    textAlign: "center",
  },
  endBtn: {
    backgroundColor: "#FF3B30",
    borderRadius: 50,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
});
