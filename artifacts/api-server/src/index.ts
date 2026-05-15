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

// WebRTC Signaling events
io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "[socket.io] Client connected");

  // Join a call room
  socket.on("join-room", (roomId: string, userId: string) => {
    socket.join(roomId);
    logger.info({ roomId, userId, socketId: socket.id }, "[socket.io] User joined room");
    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
      logger.info({ roomId, userId }, "[socket.io] User disconnected from room");
    });
  });

  // WebRTC offer
  socket.on("offer", (roomId: string, offer: RTCSessionDescriptionInit, fromUserId: string) => {
    logger.info({ roomId, fromUserId }, "[socket.io] Relaying offer");
    socket.to(roomId).emit("offer", offer, fromUserId);
  });

  // WebRTC answer
  socket.on("answer", (roomId: string, answer: RTCSessionDescriptionInit, fromUserId: string) => {
    logger.info({ roomId, fromUserId }, "[socket.io] Relaying answer");
    socket.to(roomId).emit("answer", answer, fromUserId);
  });

  // ICE candidates
  socket.on("ice-candidate", (roomId: string, candidate: RTCIceCandidateInit, fromUserId: string) => {
    socket.to(roomId).emit("ice-candidate", candidate, fromUserId);
  });

  // Call ended
  socket.on("end-call", (roomId: string) => {
    socket.to(roomId).emit("call-ended");
  });

  // Invite a user to join an existing call
  socket.on("invite-to-call", (payload: {
    targetUserId: string;
    fromUserId: string;
    fromName: string;
    callRoomId: string;
    callType: string;
  }) => {
    logger.info({ payload }, "[socket.io] Call invitation sent");
    // Broadcast to all sockets in the target user's personal room
    io.to(`user_${payload.targetUserId}`).emit("invite-to-call", {
      fromName: payload.fromName,
      newRoomId: payload.callRoomId,
      callType: payload.callType,
    });
  });

  // Each socket joins its personal room (for targeted invites)
  socket.on("register-user", (userId: string) => {
    socket.join(`user_${userId}`);
    logger.info({ userId, socketId: socket.id }, "[socket.io] User registered to personal room");
  });

  socket.on("disconnect", () => {
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
