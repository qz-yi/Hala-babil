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

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    return () => {
      // Don't disconnect shared socket on unmount
    };
  }, []);

  const joinRoom = useCallback((roomId: string, userId: string) => {
    socketRef.current?.emit("join-room", roomId, userId);
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

  return {
    socket: socketRef,
    joinRoom,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    endCall,
  };
}
