import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  path: "/socket.io/",
});

// ─── Presence Map: userId → Set<socketId> ────────────────────────────────────
// Tracks all active sockets for each user so we can:
//   1. Broadcast incoming-call to ALL devices at once
//   2. Dismiss ringing on all OTHER devices when one answers
const presenceMap = new Map<string, Set<string>>();

function addPresence(userId: string, socketId: string) {
  if (!presenceMap.has(userId)) presenceMap.set(userId, new Set());
  presenceMap.get(userId)!.add(socketId);
}

function removePresence(userId: string, socketId: string) {
  const sockets = presenceMap.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) presenceMap.delete(userId);
}

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "[socket.io] Client connected");

  let registeredUserId: string | null = null;

  // ── Personal room registration + Presence Manager ────────────────────────
  // Each socket joins its personal room (for targeted signals).
  // Also tracked in presenceMap for cross-device broadcast.
  socket.on("register-user", (userId: string) => {
    registeredUserId = userId;
    socket.join(`user_${userId}`);
    addPresence(userId, socket.id);
    logger.info({ userId, socketId: socket.id }, "[socket.io] User registered");
  });

  // ── Call Room (WebRTC signaling room) ─────────────────────────────────────
  socket.on("join-room", (roomId: string, userId: string) => {
    socket.join(roomId);
    logger.info({ roomId, userId, socketId: socket.id }, "[socket.io] User joined call room");
    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });

  // ── WebRTC Relay ──────────────────────────────────────────────────────────
  socket.on("offer", (roomId: string, offer: RTCSessionDescriptionInit, fromUserId: string) => {
    logger.info({ roomId, fromUserId }, "[socket.io] Relaying offer");
    socket.to(roomId).emit("offer", offer, fromUserId);
  });

  socket.on("answer", (roomId: string, answer: RTCSessionDescriptionInit, fromUserId: string) => {
    logger.info({ roomId, fromUserId }, "[socket.io] Relaying answer");
    socket.to(roomId).emit("answer", answer, fromUserId);
  });

  socket.on("ice-candidate", (roomId: string, candidate: RTCIceCandidateInit, fromUserId: string) => {
    socket.to(roomId).emit("ice-candidate", candidate, fromUserId);
  });

  socket.on("end-call", (roomId: string) => {
    socket.to(roomId).emit("call-ended");
  });

  // ── NEW: Cold-call initiation ─────────────────────────────────────────────
  // Caller emits this BEFORE navigating to the call screen.
  // Server broadcasts `incoming-call` to ALL devices of the target user.
  socket.on("initiate-call", (payload: {
    targetUserId: string;
    fromUserId: string;
    fromUserName: string;
    fromUserAvatar: string;
    callRoomId: string;
    callType: "audio" | "video";
  }) => {
    logger.info({ payload }, "[socket.io] Call initiated — broadcasting incoming-call");
    io.to(`user_${payload.targetUserId}`).emit("incoming-call", {
      fromUserId: payload.fromUserId,
      fromUserName: payload.fromUserName,
      fromUserAvatar: payload.fromUserAvatar,
      callRoomId: payload.callRoomId,
      callType: payload.callType,
    });
  });

  // ── NEW: Callee accepts ───────────────────────────────────────────────────
  // 1. Notify caller their call was accepted.
  // 2. Dismiss ringing on ALL OTHER devices of the same callee user.
  socket.on("accept-call", (payload: {
    callRoomId: string;
    fromUserId: string;
    calleeUserId: string;
  }) => {
    logger.info({ payload }, "[socket.io] Call accepted");
    // Tell the caller
    io.to(`user_${payload.fromUserId}`).emit("call-accepted", {
      callRoomId: payload.callRoomId,
      calleeUserId: payload.calleeUserId,
    });
    // Dismiss on all OTHER callee devices (not the one that answered)
    const calleeSockets = presenceMap.get(payload.calleeUserId);
    if (calleeSockets) {
      calleeSockets.forEach((sid) => {
        if (sid !== socket.id) {
          io.to(sid).emit("call-dismissed", { callRoomId: payload.callRoomId });
        }
      });
    }
  });

  // ── NEW: Callee declines ──────────────────────────────────────────────────
  socket.on("decline-call", (payload: {
    callRoomId: string;
    fromUserId: string;
    calleeUserId: string;
  }) => {
    logger.info({ payload }, "[socket.io] Call declined");
    io.to(`user_${payload.fromUserId}`).emit("call-declined", {
      callRoomId: payload.callRoomId,
    });
    // Also dismiss on any other callee devices still ringing
    const calleeSockets = presenceMap.get(payload.calleeUserId);
    if (calleeSockets) {
      calleeSockets.forEach((sid) => {
        if (sid !== socket.id) {
          io.to(sid).emit("call-dismissed", { callRoomId: payload.callRoomId });
        }
      });
    }
  });

  // ── NEW: Caller cancels before answer ─────────────────────────────────────
  socket.on("cancel-call", (payload: {
    callRoomId: string;
    targetUserId: string;
  }) => {
    logger.info({ payload }, "[socket.io] Call cancelled by caller");
    io.to(`user_${payload.targetUserId}`).emit("call-cancelled", {
      callRoomId: payload.callRoomId,
    });
  });

  // ── In-call multi-party invite (existing) ─────────────────────────────────
  socket.on("invite-to-call", (payload: {
    targetUserId: string;
    fromUserId: string;
    fromName: string;
    callRoomId: string;
    callType: string;
  }) => {
    logger.info({ payload }, "[socket.io] In-call invite sent");
    io.to(`user_${payload.targetUserId}`).emit("invite-to-call", {
      fromName: payload.fromName,
      newRoomId: payload.callRoomId,
      callType: payload.callType,
    });
  });

  // ── Disconnect cleanup ────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    if (registeredUserId) {
      removePresence(registeredUserId, socket.id);
      logger.info({ userId: registeredUserId, socketId: socket.id }, "[socket.io] Presence removed");
    }
    logger.info({ socketId: socket.id }, "[socket.io] Client disconnected");
  });
});

export { io };

const host = "0.0.0.0";
httpServer.listen(port, host, () => {
  logger.info({ port, host }, "Server listening");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
