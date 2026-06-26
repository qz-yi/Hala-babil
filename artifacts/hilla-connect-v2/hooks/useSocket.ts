import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

let sharedSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!sharedSocket || !sharedSocket.connected) {
    sharedSocket = io(API_BASE, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    sharedSocket.on("connect", () => {
      console.log(`\n✅ [APP] Connected to server successfully — socketId: ${sharedSocket?.id} — server: ${API_BASE || "(relative)"}`);
    });

    sharedSocket.on("disconnect", (reason) => {
      console.log(`⚠️  [APP] Disconnected from server — reason: ${reason}`);
    });

    sharedSocket.on("connect_error", (err) => {
      console.log(`❌ [APP] Connection error — ${err.message}`);
    });
  }
  return sharedSocket;
}

// ─── Room Heartbeat ───────────────────────────────────────────────────────────
// Emits room:heartbeat every 5 s while the user is seated in a room.
// Call startRoomHeartbeat when entering, stopRoomHeartbeat when leaving.
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export function startRoomHeartbeat(roomId: string, userId: string) {
  stopRoomHeartbeat();
  const emit = () => getSocket().emit("room:heartbeat", { roomId, userId, ts: Date.now() });
  emit(); // immediate first beat
  heartbeatInterval = setInterval(emit, 5_000);
  console.log(`💓 [APP] Heartbeat started — room: ${roomId} user: ${userId}`);
}

export function stopRoomHeartbeat() {
  if (heartbeatInterval !== null) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log("💔 [APP] Heartbeat stopped");
  }
}

/** Register user in their personal socket room + Presence Manager */
export function registerUserSocket(userId: string) {
  const socket = getSocket();
  const doRegister = () => socket.emit("register-user", userId);
  if (socket.connected) {
    doRegister();
  } else {
    socket.once("connect", doRegister);
  }
}

/**
 * Emit `initiate-call` to the server — server will broadcast `incoming-call`
 * to ALL active sockets of the target user (Presence Manager).
 */
export function initiateCallSignal(payload: {
  targetUserId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  callRoomId: string;
  callType: "audio" | "video";
}) {
  getSocket().emit("initiate-call", payload);
}

/** Callee accepts — notifies caller + dismisses on own other devices */
export function acceptCallSignal(payload: {
  callRoomId: string;
  fromUserId: string;
  calleeUserId: string;
}) {
  getSocket().emit("accept-call", payload);
}

/** Callee declines */
export function declineCallSignal(payload: {
  callRoomId: string;
  fromUserId: string;
  calleeUserId: string;
}) {
  getSocket().emit("decline-call", payload);
}

/** Caller cancels before the callee answers */
export function cancelCallSignal(payload: {
  callRoomId: string;
  targetUserId: string;
}) {
  getSocket().emit("cancel-call", payload);
}

export function useSocket(userId?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (userId) {
      registerUserSocket(userId);
      socket.on("reconnect", () => registerUserSocket(userId));
    }

    return () => {
      if (userId) {
        socket.off("reconnect");
      }
    };
  }, [userId]);

  const joinRoom = useCallback((roomId: string, uid: string) => {
    socketRef.current?.emit("join-room", roomId, uid);
  }, []);

  const sendOffer = useCallback((roomId: string, offer: RTCSessionDescriptionInit, fromUserId: string) => {
    socketRef.current?.emit("offer", roomId, offer, fromUserId);
  }, []);

  const sendAnswer = useCallback((roomId: string, answer: RTCSessionDescriptionInit, fromUserId: string) => {
    socketRef.current?.emit("answer", roomId, answer, fromUserId);
  }, []);

  const sendIceCandidate = useCallback((roomId: string, candidate: RTCIceCandidateInit, fromUserId: string) => {
    socketRef.current?.emit("ice-candidate", roomId, candidate, fromUserId);
  }, []);

  const endCall = useCallback((roomId: string) => {
    socketRef.current?.emit("end-call", roomId);
  }, []);

  return { socket: socketRef, joinRoom, sendOffer, sendAnswer, sendIceCandidate, endCall };
}
