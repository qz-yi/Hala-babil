import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { setSocketIo } from "./lib/socketSingleton";

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

// Make io accessible from routes via singleton
setSocketIo(io);

// ─── Game Rooms: roomId → ephemeral GameState ────────────────────────────────
const gameRooms = new Map<string, any>();

// ─── Presence Map: userId → Set<socketId> ────────────────────────────────────
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
  console.log(`\n✅ [SERVER] New device connected — socketId: ${socket.id}`);

  let registeredUserId: string | null = null;

  // ── Personal room registration + Presence Manager ────────────────────────
  socket.on("register-user", (userId: string) => {
    registeredUserId = userId;
    socket.join(`user_${userId}`);
    addPresence(userId, socket.id);
    logger.info({ userId, socketId: socket.id }, "[socket.io] User registered");
    console.log(`✅ [SERVER] User registered — userId: ${userId} — socketId: ${socket.id}`);

    // Broadcast online status
    io.emit("user:online", { userId });
  });

  // ── Subscribe to voice room socket room ──────────────────────────────────
  // Client emits this to receive room:participant-joined/left + room:message events
  socket.on("room:subscribe", (roomId: string) => {
    socket.join(`room_${roomId}`);
    logger.info({ roomId, socketId: socket.id }, "[socket.io] Subscribed to room channel");
  });

  socket.on("room:unsubscribe", (roomId: string) => {
    socket.leave(`room_${roomId}`);
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

  // ── Cold-call initiation ──────────────────────────────────────────────────
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

  // ── Callee accepts ────────────────────────────────────────────────────────
  socket.on("accept-call", (payload: {
    callRoomId: string;
    fromUserId: string;
    calleeUserId: string;
  }) => {
    logger.info({ payload }, "[socket.io] Call accepted");
    io.to(`user_${payload.fromUserId}`).emit("call-accepted", {
      callRoomId: payload.callRoomId,
      calleeUserId: payload.calleeUserId,
    });
    const calleeSockets = presenceMap.get(payload.calleeUserId);
    if (calleeSockets) {
      calleeSockets.forEach((sid) => {
        if (sid !== socket.id) {
          io.to(sid).emit("call-dismissed", { callRoomId: payload.callRoomId });
        }
      });
    }
  });

  // ── Callee declines ───────────────────────────────────────────────────────
  socket.on("decline-call", (payload: {
    callRoomId: string;
    fromUserId: string;
    calleeUserId: string;
  }) => {
    logger.info({ payload }, "[socket.io] Call declined");
    io.to(`user_${payload.fromUserId}`).emit("call-declined", {
      callRoomId: payload.callRoomId,
    });
    const calleeSockets = presenceMap.get(payload.calleeUserId);
    if (calleeSockets) {
      calleeSockets.forEach((sid) => {
        if (sid !== socket.id) {
          io.to(sid).emit("call-dismissed", { callRoomId: payload.callRoomId });
        }
      });
    }
  });

  // ── Caller cancels before answer ──────────────────────────────────────────
  socket.on("cancel-call", (payload: {
    callRoomId: string;
    targetUserId: string;
  }) => {
    logger.info({ payload }, "[socket.io] Call cancelled by caller");
    io.to(`user_${payload.targetUserId}`).emit("call-cancelled", {
      callRoomId: payload.callRoomId,
    });
  });

  // ── Private message relay ────────────────────────────────────────────────
  // Client emits this; server fans it out to all sockets of the target user.
  socket.on("private-message", (payload: {
    conversationId: string;
    receiverId: string;
    message: {
      id: string;
      senderId: string;
      senderName: string;
      content: string;
      type: string;
      mediaUrl?: string;
      timestamp: number;
      read: boolean;
    };
  }) => {
    if (!payload?.receiverId) return;
    logger.info({ to: payload.receiverId }, "[socket.io] Relaying private-message");
    io.to(`user_${payload.receiverId}`).emit("private-message", {
      conversationId: payload.conversationId,
      message: payload.message,
    });
  });

  // ── In-call multi-party invite ─────────────────────────────────────────────
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

  // ── GAME ROOMS ────────────────────────────────────────────────────────────
  socket.on("game:join-room", (roomId: string) => {
    socket.join(`game_${roomId}`);
    const existing = gameRooms.get(roomId);
    if (existing) socket.emit("game:state", existing);
    logger.info({ roomId, socketId: socket.id }, "[game] Joined game room");
  });

  socket.on("game:start", (payload: { roomId: string; gameState: any }) => {
    gameRooms.set(payload.roomId, payload.gameState);
    io.to(`game_${payload.roomId}`).emit("game:state", payload.gameState);
    logger.info({ roomId: payload.roomId, gameType: payload.gameState?.gameType }, "[game] Started");
  });

  socket.on("game:move", (payload: {
    roomId: string;
    newState: any;
    playerId: string;
    moveType: string;
  }) => {
    const current = gameRooms.get(payload.roomId);
    if (!current) return;
    const expected = current.players?.[current.currentTurnIndex];
    if (expected?.id !== payload.playerId) {
      logger.warn({ expected: expected?.id, got: payload.playerId }, "[game] Move rejected: wrong turn");
      return;
    }
    gameRooms.set(payload.roomId, payload.newState);
    socket.to(`game_${payload.roomId}`).emit("game:state", payload.newState);
    logger.info({ roomId: payload.roomId, moveType: payload.moveType }, "[game] Move applied");
  });

  socket.on("game:reset", (payload: { roomId: string; newState: any }) => {
    gameRooms.set(payload.roomId, payload.newState);
    io.to(`game_${payload.roomId}`).emit("game:state", payload.newState);
  });

  socket.on("game:end", (roomId: string) => {
    gameRooms.delete(roomId);
    io.to(`game_${roomId}`).emit("game:ended");
    logger.info({ roomId }, "[game] Ended");
  });

  // ── Disconnect cleanup ────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    if (registeredUserId) {
      removePresence(registeredUserId, socket.id);
      io.emit("user:offline", { userId: registeredUserId });
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
