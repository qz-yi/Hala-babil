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
  Modal,
  FlatList,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useCallStore } from "@/store/callStore";
import { useCallAudio } from "@/hooks/useCallAudio";
import { callManager } from "@/lib/callManager";
import { getSocket } from "@/hooks/useSocket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

type CallType = "audio" | "video";
type CallStatus = "connecting" | "ringing" | "active" | "ended";

export default function CallScreen() {
  const { id, type: callType, name, avatar, resume } = useLocalSearchParams<{
    id: string;
    type: CallType;
    name: string;
    avatar: string;
    resume?: string;
  }>();

  const { currentUser, users, getConversation, injectCallLog } = useApp();
  const { setActiveCall } = useCallStore();
  const { startRinging, playConnected, playDisconnected, stopAll } = useCallAudio();
  const insets = useSafeAreaInsets();

  const isResume = resume === "1";

  const [status, setStatus] = useState<CallStatus>(isResume ? "active" : "connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showInvite, setShowInvite] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartedAt = useRef<number>(Date.now());
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const callRoomId = `call_${[currentUser?.id, id].sort().join("_")}`;
  const decodedName = decodeURIComponent(name || "");
  const decodedAvatar = decodeURIComponent(avatar || "");

  // Contacts list for group invite (exclude self and current callee)
  const contacts = users.filter(
    (u) => u.id !== currentUser?.id && u.id !== id
  );

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startTimer = useCallback(() => {
    callStartedAt.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  }, []);

  const buildCallLog = useCallback(
    (outcome: "completed" | "cancelled" | "missed") => {
      const icon = callType === "video" ? "📹" : "📞";
      const durSecs = Math.floor((Date.now() - callStartedAt.current) / 1000);
      const dur = formatDuration(durSecs);

      if (outcome === "completed") {
        return `${icon} ${callType === "video" ? "مكالمة مرئية" : "مكالمة صوتية"} • ${dur}`;
      }
      if (outcome === "cancelled") {
        return `${icon} مكالمة ملغاة`;
      }
      return `${icon} مكالمة فائتة`;
    },
    [callType],
  );

  const cleanup = useCallback(
    (outcome: "completed" | "cancelled" | "missed" = "cancelled") => {
      stopAll();
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

      // Inject call log message into the conversation
      if (currentUser && id) {
        try {
          const convo = getConversation(id);
          if (convo?.id) {
            injectCallLog(convo.id, id, buildCallLog(outcome));
          }
        } catch {}
      }

      // Clear global call state
      setActiveCall(null);

      // Cleanup WebRTC
      if (!isResume) {
        callManager.cleanup();
      }
    },
    [currentUser, id, getConversation, injectCallLog, buildCallLog, setActiveCall, stopAll, isResume],
  );

  const endCall = useCallback(() => {
    getSocket().emit("end-call", callRoomId);
    const outcome = status === "active" ? "completed" : "cancelled";
    cleanup(outcome);
    router.back();
  }, [callRoomId, status, cleanup]);

  const initWebRTC = useCallback(async () => {
    if (!currentUser) return;

    if (Platform.OS !== "web") {
      // Native: show active state without real WebRTC (requires native build)
      setStatus("active");
      startTimer();
      setActiveCall({
        callRoomId,
        otherUserId: id,
        otherUserName: decodedName,
        otherUserAvatar: decodedAvatar,
        callType: callType as CallType,
        startedAt: Date.now(),
        conversationId: getConversation(id)?.id || id,
      });
      return;
    }

    try {
      let stream = callManager.localStream;

      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === "video",
          });
          callManager.localStream = stream;
        } catch {
          Alert.alert("خطأ", "تعذر الوصول للميكروفون/الكاميرا. تحقق من الصلاحيات.");
          router.back();
          return;
        }
      }

      // Attach local video
      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = stream;
        callManager.localVideoEl = localVideoRef.current;
      }

      let pc = callManager.pc;

      if (!pc || pc.connectionState === "closed" || pc.connectionState === "failed") {
        pc = new RTCPeerConnection(ICE_SERVERS);
        callManager.pc = pc;
        stream.getTracks().forEach((track) => pc!.addTrack(track, stream!));

        pc.ontrack = (event) => {
          const remoteStream = event.streams[0];
          callManager.remoteStream = remoteStream;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            callManager.remoteVideoEl = remoteVideoRef.current;
          }
          playConnected();
          stopAll();
          setStatus("active");
          startTimer();
          setActiveCall({
            callRoomId,
            otherUserId: id,
            otherUserName: decodedName,
            otherUserAvatar: decodedAvatar,
            callType: callType as CallType,
            startedAt: Date.now(),
            conversationId: getConversation(id)?.id || id,
          });
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            getSocket().emit("ice-candidate", callRoomId, event.candidate, currentUser.id);
          }
        };
      } else if (isResume) {
        // Resuming — reattach video elements
        if (remoteVideoRef.current && callManager.remoteStream) {
          remoteVideoRef.current.srcObject = callManager.remoteStream;
        }
        if (localVideoRef.current && callManager.localStream) {
          localVideoRef.current.srcObject = callManager.localStream;
        }
        // Restart timer from saved startedAt
        const saved = useCallStore.getState().activeCall;
        if (saved) {
          callStartedAt.current = saved.startedAt;
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            setCallDuration(Math.floor((Date.now() - saved.startedAt) / 1000));
          }, 1000);
        }
        return;
      }

      const socket = getSocket();
      socket.emit("join-room", callRoomId, currentUser.id);

      // Start ringing while waiting
      startRinging();
      setStatus("ringing");

      socket.on("user-connected", async (_userId: string) => {
        if (!callManager.pc) return;
        const offer = await callManager.pc.createOffer();
        await callManager.pc.setLocalDescription(offer);
        socket.emit("offer", callRoomId, offer, currentUser.id);
      });

      socket.on("offer", async (offer: RTCSessionDescriptionInit) => {
        if (!callManager.pc) return;
        await callManager.pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await callManager.pc.createAnswer();
        await callManager.pc.setLocalDescription(answer);
        socket.emit("answer", callRoomId, answer, currentUser.id);
        playConnected();
        stopAll();
        setStatus("active");
        startTimer();
        setActiveCall({
          callRoomId,
          otherUserId: id,
          otherUserName: decodedName,
          otherUserAvatar: decodedAvatar,
          callType: callType as CallType,
          startedAt: Date.now(),
          conversationId: getConversation(id)?.id || id,
        });
      });

      socket.on("answer", async (answer: RTCSessionDescriptionInit) => {
        if (!callManager.pc) return;
        await callManager.pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("ice-candidate", async (candidate: RTCIceCandidateInit) => {
        try { await callManager.pc?.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      });

      socket.on("call-ended", () => {
        playDisconnected();
        cleanup("completed");
        setTimeout(() => router.back(), 800);
      });

      // Incoming invite to a group call
      socket.on("invite-to-call", ({ fromName, newRoomId }: { fromName: string; newRoomId: string }) => {
        Alert.alert(
          "دعوة لمكالمة جماعية",
          `${fromName} يدعوك للانضمام للمكالمة`,
          [
            { text: "رفض", style: "cancel" },
            {
              text: "قبول",
              onPress: () => {
                socket.emit("join-room", newRoomId, currentUser.id);
              },
            },
          ],
        );
      });
    } catch (err) {
      console.error("[call] WebRTC init error:", err);
      playDisconnected();
      router.back();
    }
  }, [currentUser, callType, callRoomId, id, decodedName, decodedAvatar, isResume, startRinging, playConnected, playDisconnected, stopAll, startTimer, setActiveCall, getConversation]);

  useEffect(() => {
    initWebRTC();
    return () => {
      // Only remove socket listeners, do NOT cleanup WebRTC (user may have navigated away)
      const socket = getSocket();
      socket.off("user-connected");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("call-ended");
      socket.off("invite-to-call");
    };
  }, []);

  const toggleMute = () => {
    callManager.localStream?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((m) => !m);
  };

  const toggleCamera = () => {
    callManager.localStream?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCamOff((c) => !c);
  };

  const inviteContact = (contactId: string, contactName: string) => {
    setShowInvite(false);
    getSocket().emit("invite-to-call", {
      targetUserId: contactId,
      fromUserId: currentUser?.id,
      fromName: currentUser?.name || "مستخدم",
      callRoomId,
      callType,
    });
    Alert.alert("", `تم إرسال الدعوة إلى ${contactName}`);
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

      {/* Remote video full screen (web + video call) */}
      {Platform.OS === "web" && callType === "video" && (
        <video
          ref={(el) => { remoteVideoRef.current = el; callManager.attachRemoteVideo(el); }}
          autoPlay
          playsInline
          style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" } as any}
        />
      )}

      {/* Caller info overlay */}
      <View style={[styles.callerInfo, callType === "video" && status === "active" && styles.callerInfoVideo]}>
        {decodedAvatar ? (
          <Image source={{ uri: decodedAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{decodedName?.[0] || "?"}</Text>
          </View>
        )}
        <Text style={styles.callerName}>{decodedName}</Text>
        <Text style={styles.statusText}>{statusLabel}</Text>
        {(status === "connecting" || status === "ringing") && (
          <ActivityIndicator color="rgba(255,255,255,0.7)" style={{ marginTop: 12 }} />
        )}
      </View>

      {/* Local video preview (top-right corner) */}
      {Platform.OS === "web" && callType === "video" && (
        <View style={styles.localVideoContainer}>
          <video
            ref={(el) => { localVideoRef.current = el; callManager.attachLocalVideo(el); }}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" } as any}
          />
          {isCamOff && (
            <View style={styles.camOffOverlay}>
              <Feather name="video-off" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          )}
        </View>
      )}

      {/* Controls bar */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>

        {/* Mute */}
        <View style={styles.ctrlWrap}>
          <TouchableOpacity
            style={[styles.ctrlBtn, isMuted && styles.ctrlBtnOn]}
            onPress={toggleMute}
          >
            <Feather name={isMuted ? "mic-off" : "mic"} size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.ctrlLabel}>{isMuted ? "إلغاء الكتم" : "كتم"}</Text>
        </View>

        {/* Camera toggle (video only) */}
        {callType === "video" && (
          <View style={styles.ctrlWrap}>
            <TouchableOpacity
              style={[styles.ctrlBtn, isCamOff && styles.ctrlBtnOn]}
              onPress={toggleCamera}
            >
              <Feather name={isCamOff ? "video-off" : "video"} size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.ctrlLabel}>{isCamOff ? "تشغيل الكاميرا" : "إيقاف الكاميرا"}</Text>
          </View>
        )}

        {/* Speaker */}
        <View style={styles.ctrlWrap}>
          <TouchableOpacity
            style={[styles.ctrlBtn, isSpeaker && styles.ctrlBtnOn]}
            onPress={() => setIsSpeaker((s) => !s)}
          >
            <Ionicons name={isSpeaker ? "volume-high" : "volume-medium-outline"} size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.ctrlLabel}>مكبر الصوت</Text>
        </View>

        {/* Add member */}
        <View style={styles.ctrlWrap}>
          <TouchableOpacity
            style={styles.ctrlBtn}
            onPress={() => setShowInvite(true)}
          >
            <Feather name="user-plus" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.ctrlLabel}>إضافة</Text>
        </View>

        {/* End call */}
        <View style={styles.ctrlWrap}>
          <TouchableOpacity style={styles.endBtn} onPress={endCall}>
            <Feather name="phone-off" size={26} color="white" />
          </TouchableOpacity>
          <Text style={styles.ctrlLabel}>إنهاء</Text>
        </View>
      </View>

      {/* Invite contacts modal */}
      <Modal
        visible={showInvite}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInvite(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>دعوة جهة اتصال</Text>
              <TouchableOpacity onPress={() => setShowInvite(false)}>
                <Feather name="x" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            {contacts.length === 0 ? (
              <Text style={styles.emptyContacts}>لا توجد جهات اتصال</Text>
            ) : (
              <FlatList
                data={contacts}
                keyExtractor={(u) => u.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => inviteContact(item.id, item.name)}
                  >
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.contactAvatar} />
                    ) : (
                      <View style={[styles.contactAvatar, styles.contactAvatarFallback]}>
                        <Text style={styles.contactInitial}>{item.name?.[0] || "?"}</Text>
                      </View>
                    )}
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Feather name="phone-call" size={16} color="#4ade80" />
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 360 }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d1117" },
  bg: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0d1117" },

  callerInfo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  callerInfoVideo: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
  },

  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.25)",
  },
  avatarPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "white", fontSize: 44, fontWeight: "700" },
  callerName: { color: "white", fontSize: 26, fontWeight: "700", marginTop: 6, textAlign: "center" },
  statusText: { color: "rgba(255,255,255,0.65)", fontSize: 16, fontVariant: ["tabular-nums"] },

  localVideoContainer: {
    position: "absolute",
    top: 90,
    right: 16,
    width: 96,
    height: 136,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#000",
  },
  camOffOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  ctrlWrap: { alignItems: "center", gap: 8 },
  ctrlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlBtnOn: { backgroundColor: "rgba(255,255,255,0.32)" },
  ctrlLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, textAlign: "center", maxWidth: 60 },

  endBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 14,
  },

  // Invite modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#161b22",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingTop: 6,
    maxHeight: "65%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: { color: "white", fontSize: 16, fontWeight: "700" },
  emptyContacts: { color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: 32, fontSize: 14 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  contactAvatar: { width: 42, height: 42, borderRadius: 21 },
  contactAvatarFallback: { backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  contactInitial: { color: "white", fontSize: 16, fontWeight: "600" },
  contactName: { flex: 1, color: "white", fontSize: 15 },
});
