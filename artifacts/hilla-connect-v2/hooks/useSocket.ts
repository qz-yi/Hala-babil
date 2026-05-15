import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "https://almalke4.replit.app";

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
  }
  return sharedSocket;
}

/** Register user in their personal socket room so they can receive invite-to-call events */
export function registerUserSocket(userId: string) {
  const socket = getSocket();
  const doRegister = () => socket.emit("register-user", userId);
  if (socket.connected) {
    doRegister();
  } else {
    socket.once("connect", doRegister);
  }
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
