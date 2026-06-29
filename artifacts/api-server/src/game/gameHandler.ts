import type { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "../lib/logger.js";
import type {
  ClientGameState,
  GameCreatePayload,
  GameDrawPayload,
  GameLeavePayload,
  GameMovePayload,
  GamePassPayload,
  GameRoom,
  GameStartPayload,
  GameJoinPayload,
} from "./gameTypes.js";
import {
  addPlayerToRoom,
  cancelReconnectTimer,
  clearTimer,
  createRoom,
  getRoom,
  markPlayerConnected,
  markPlayerDisconnected,
  registry,
  removePlayerFromRoom,
  scheduleCleanup,
  scheduleReconnect,
  setTurnTimer,
} from "./gameRegistry.js";
import { applyTicTacToeMove, initTicTacToe } from "./ticTacToeLogic.js";
import {
  applyDominoDraw,
  applyDominoMove,
  applyDominoPass,
  computeBlockedWinner,
  initDomino,
} from "./dominoLogic.js";

// ─── Sanitise state for a specific viewer ────────────────────────────────────
function buildClientState(room: GameRoom, viewerUserId: string): ClientGameState {
  const base: ClientGameState = {
    roomId: room.id,
    gameType: room.gameType,
    status: room.status,
    players: room.players.map((p) => ({
      userId: p.userId,
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      connected: p.connected,
      handSize: room.domino ? (room.domino.hands[p.userId]?.length ?? 0) : undefined,
    })),
    currentTurnIndex: room.currentTurnIndex,
    turnDeadline: room.turnDeadline,
    winner: room.winner,
    tictactoe: room.tictactoe,
  };

  if (room.domino) {
    const d = room.domino;
    const opponentHandSizes: Record<string, number> = {};
    for (const p of room.players) {
      if (p.userId !== viewerUserId) {
        opponentHandSizes[p.userId] = d.hands[p.userId]?.length ?? 0;
      }
    }
    base.domino = {
      myHand: d.hands[viewerUserId] ?? [],
      opponentHandSizes,
      board: d.board,
      leftEnd: d.leftEnd,
      rightEnd: d.rightEnd,
      boneyardSize: d.boneyard.length,
      scores: d.scores,
      passCount: d.passCount,
      lastAction: d.lastAction,
    };
  }

  return base;
}

// ─── Broadcast personalised state to every player ────────────────────────────
function broadcastState(io: SocketIOServer, room: GameRoom): void {
  for (const p of room.players) {
    const state = buildClientState(room, p.userId);
    io.to(`user_${p.userId}`).emit("game:state", state);
  }
}

// ─── Advance to next turn index ───────────────────────────────────────────────
function nextTurn(room: GameRoom): void {
  room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
}

// ─── End game ────────────────────────────────────────────────────────────────
function endGame(
  io: SocketIOServer,
  room: GameRoom,
  winnerId: string | null,
  reason: "win" | "draw" | "forfeit" | "blocked",
): void {
  clearTimer(room);
  room.status = "finished";
  room.winner = winnerId;

  const winner = room.players.find((p) => p.userId === winnerId);

  io.to(`game_${room.id}`).emit("game:ended", {
    roomId: room.id,
    winnerId,
    winnerName: winner?.name ?? null,
    reason,
    finalScores: room.domino?.scores ?? {},
  });

  broadcastState(io, room);
  scheduleCleanup(room.id);
}

// ─── Handle turn expiry (server-side timer) ───────────────────────────────────
function handleTurnExpiry(io: SocketIOServer, room: GameRoom): void {
  const timedOutPlayer = room.players[room.currentTurnIndex];
  logger.info({ roomId: room.id, turnIndex: room.currentTurnIndex, userId: timedOutPlayer?.userId }, "[game] Turn expired");

  // Broadcast timeout event to the whole room BEFORE advancing the turn so
  // clients can distinguish a timeout-driven change from a normal move.
  io.to(`game_${room.id}`).emit("game:timeout", {
    roomId: room.id,
    timedOutUserId: timedOutPlayer?.userId ?? null,
    timedOutUserName: timedOutPlayer?.name ?? null,
    previousTurnIndex: room.currentTurnIndex,
  });

  if (room.gameType === "tictactoe") {
    nextTurn(room);
    setTurnTimer(room, () => handleTurnExpiry(io, room));
    broadcastState(io, room);
    return;
  }

  if (room.gameType === "domino" && room.domino) {
    const currentPlayer = room.players[room.currentTurnIndex];
    if (currentPlayer) {
      const { newState, isBlocked } = applyDominoPass(
        room.domino,
        currentPlayer.userId,
        currentPlayer.name,
        room.players.length,
      );
      room.domino = newState;

      if (isBlocked) {
        const playerIds = room.players.map((p) => p.userId);
        endGame(io, room, computeBlockedWinner(room.domino, playerIds), "blocked");
        return;
      }
    }

    nextTurn(room);
    setTurnTimer(room, () => handleTurnExpiry(io, room));
    broadcastState(io, room);
  }
}

// ─── Lobby helper ─────────────────────────────────────────────────────────────
function emitLobbyState(io: SocketIOServer, room: GameRoom): void {
  const lobbyPayload = {
    roomId: room.id,
    players: room.players.map((p) => ({
      userId: p.userId,
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      connected: p.connected,
    })),
    hostUserId: room.hostUserId,
    gameType: room.gameType,
  };
  io.to(`game_${room.id}`).emit("game:lobby_state", lobbyPayload);
  // Also broadcast to the chat-room so non-game members see the lobby invitation
  io.to(room.id).emit("game:lobby_state", lobbyPayload);
}

// ─── Main handler registration ────────────────────────────────────────────────
export function registerGameHandlers(io: SocketIOServer, socket: Socket): void {

  // ── game:create ──────────────────────────────────────────────────────────────
  socket.on("game:create", (payload: GameCreatePayload) => {
    const { roomId, gameType, userId, name, avatar, color } = payload;
    logger.info({ roomId, gameType, userId }, "[game] game:create");

    const room = createRoom(roomId, gameType, { userId, socketId: socket.id, name, avatar, color });
    socket.join(`game_${roomId}`);
    markPlayerConnected(room, userId, socket.id);

    emitLobbyState(io, room);
    broadcastState(io, room);
  });

  // ── game:join ────────────────────────────────────────────────────────────────
  socket.on("game:join", (payload: GameJoinPayload) => {
    const { roomId, userId, name, avatar } = payload;
    logger.info({ roomId, userId }, "[game] game:join");

    const room = getRoom(roomId);
    if (!room) {
      socket.emit("game:error", { message: "الغرفة غير موجودة" });
      return;
    }

    cancelReconnectTimer(room, userId);

    if (room.status === "playing") {
      const existing = room.players.find((p) => p.userId === userId);
      if (existing) {
        markPlayerConnected(room, userId, socket.id);
        socket.join(`game_${roomId}`);

        // Resume the per-turn timer so the countdown isn't paused indefinitely.
        // Only restart if no timer is running (cleared on disconnect).
        if (!room.timer) {
          setTurnTimer(room, () => handleTurnExpiry(io, room));
        }

        // Push fresh state with updated turnDeadline to the reconnecting client.
        socket.emit("game:state", buildClientState(room, userId));
        io.to(`game_${roomId}`).emit("game:player_reconnected", { userId, name });
        return;
      }
      socket.emit("game:error", { message: "اللعبة جارية بالفعل" });
      return;
    }

    const { error } = addPlayerToRoom(room, { userId, socketId: socket.id, name, avatar });
    if (error) {
      socket.emit("game:error", { message: error });
      return;
    }

    socket.join(`game_${roomId}`);
    emitLobbyState(io, room);
    broadcastState(io, room);
  });

  // ── game:start ───────────────────────────────────────────────────────────────
  socket.on("game:start", (payload: GameStartPayload) => {
    const { roomId, userId } = payload;
    logger.info({ roomId, userId }, "[game] game:start");

    const room = getRoom(roomId);
    if (!room) { socket.emit("game:error", { message: "الغرفة غير موجودة" }); return; }
    if (room.hostUserId !== userId) { socket.emit("game:error", { message: "فقط المضيف يمكنه بدء اللعبة" }); return; }
    if (room.status !== "lobby") { socket.emit("game:error", { message: "اللعبة بدأت بالفعل" }); return; }
    if (room.players.length < 2) { socket.emit("game:error", { message: "يجب أن يكون هناك لاعبان على الأقل" }); return; }

    room.status = "playing";
    room.currentTurnIndex = 0;

    const playerIds = room.players.map((p) => p.userId);
    if (room.gameType === "tictactoe") {
      room.tictactoe = initTicTacToe(playerIds);
    } else {
      room.domino = initDomino(playerIds);
    }

    setTurnTimer(room, () => handleTurnExpiry(io, room));
    broadcastState(io, room);
  });

  // ── game:move ────────────────────────────────────────────────────────────────
  socket.on("game:move", (payload: GameMovePayload) => {
    const { roomId, userId, move } = payload;

    const room = getRoom(roomId);
    if (!room) { socket.emit("game:error", { message: "الغرفة غير موجودة" }); return; }
    if (room.status !== "playing") { socket.emit("game:error", { message: "اللعبة ليست جارية" }); return; }

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.userId !== userId) {
      socket.emit("game:error", { message: "ليس دورك" });
      return;
    }

    if (move.kind === "tictactoe" && room.tictactoe) {
      const { newState, winnerId, isDraw, error } = applyTicTacToeMove(
        room.tictactoe, userId, move.cellIndex, currentPlayer.name,
      );
      if (error) { socket.emit("game:error", { message: error }); return; }
      room.tictactoe = newState;

      if (winnerId) { endGame(io, room, winnerId, "win"); return; }
      if (isDraw)   { endGame(io, room, null, "draw"); return; }

      nextTurn(room);

    } else if (move.kind === "domino" && room.domino) {
      const { newState, winnerId, error } = applyDominoMove(
        room.domino, userId, move.tileId, move.end, move.flipped,
        currentPlayer.name, room.currentTurnIndex,
      );
      if (error) { socket.emit("game:error", { message: error }); return; }
      room.domino = newState;

      if (winnerId) { endGame(io, room, winnerId, "win"); return; }

      nextTurn(room);

    } else {
      socket.emit("game:error", { message: "نوع حركة غير صالح" });
      return;
    }

    setTurnTimer(room, () => handleTurnExpiry(io, room));
    broadcastState(io, room);
  });

  // ── game:draw (Dominoes — boneyard) ─────────────────────────────────────────
  socket.on("game:draw", (payload: GameDrawPayload) => {
    const { roomId, userId } = payload;

    const room = getRoom(roomId);
    if (!room || !room.domino) { socket.emit("game:error", { message: "لعبة دومينو غير موجودة" }); return; }
    if (room.status !== "playing")  { socket.emit("game:error", { message: "اللعبة ليست جارية" }); return; }

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.userId !== userId) {
      socket.emit("game:error", { message: "ليس دورك" });
      return;
    }

    const { newState, drawnTile, error } = applyDominoDraw(
      room.domino, userId, currentPlayer.name,
    );
    if (error) { socket.emit("game:error", { message: error }); return; }
    room.domino = newState;

    if (drawnTile) {
      socket.emit("game:drew_tile", { tile: drawnTile });
    }

    setTurnTimer(room, () => handleTurnExpiry(io, room));
    broadcastState(io, room);
  });

  // ── game:pass (Dominoes — no valid move) ─────────────────────────────────────
  socket.on("game:pass", (payload: GamePassPayload) => {
    const { roomId, userId } = payload;

    const room = getRoom(roomId);
    if (!room || !room.domino) { socket.emit("game:error", { message: "لعبة دومينو غير موجودة" }); return; }
    if (room.status !== "playing")  { socket.emit("game:error", { message: "اللعبة ليست جارية" }); return; }

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.userId !== userId) {
      socket.emit("game:error", { message: "ليس دورك" });
      return;
    }

    const { newState, isBlocked, error } = applyDominoPass(
      room.domino, userId, currentPlayer.name, room.players.length,
    );
    if (error) { socket.emit("game:error", { message: error }); return; }
    room.domino = newState;

    if (isBlocked) {
      const playerIds = room.players.map((p) => p.userId);
      endGame(io, room, computeBlockedWinner(room.domino, playerIds), "blocked");
      return;
    }

    nextTurn(room);
    setTurnTimer(room, () => handleTurnExpiry(io, room));
    broadcastState(io, room);
  });

  // ── game:query ────────────────────────────────────────────────────────────────
  // Returns current lobby or game state to the requesting client without joining.
  socket.on("game:query", ({ roomId, userId }: { roomId: string; userId?: string }) => {
    const room = getRoom(roomId);
    if (!room) return;

    if (room.status === "lobby") {
      socket.emit("game:lobby_state", {
        roomId: room.id,
        players: room.players.map((p) => ({
          userId: p.userId, name: p.name, avatar: p.avatar, color: p.color, connected: p.connected,
        })),
        hostUserId: room.hostUserId,
        gameType: room.gameType,
      });
    } else if (room.status === "playing" && userId) {
      const isPlayer = room.players.some((p) => p.userId === userId);
      if (isPlayer) {
        socket.emit("game:state", buildClientState(room, userId));
      }
    }
  });

  // ── game:leave ───────────────────────────────────────────────────────────────
  socket.on("game:leave", (payload: GameLeavePayload) => {
    const { roomId, userId } = payload;
    logger.info({ roomId, userId }, "[game] game:leave");

    const room = getRoom(roomId);
    if (!room) return;

    socket.leave(`game_${roomId}`);

    if (room.status === "playing") {
      const remaining = room.players.filter((p) => p.userId !== userId);
      const winner = remaining.length === 1 ? remaining[0] : null;
      endGame(io, room, winner?.userId ?? null, "forfeit");
    } else {
      removePlayerFromRoom(room, userId);
      emitLobbyState(io, room);
    }
  });
}

// ─── Disconnect handler (called from main index.ts disconnect event) ──────────
export function handleGameDisconnect(io: SocketIOServer, socketId: string): void {
  for (const [, room] of registry) {
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) continue;

    if (room.status === "playing") {
      markPlayerDisconnected(room, player.userId);
      io.to(`game_${room.id}`).emit("game:player_left", {
        userId: player.userId,
        name: player.name,
        temporary: true,
      });

      clearTimer(room);

      scheduleReconnect(room, player.userId, () => {
        const remaining = room.players.filter((p) => p.userId !== player.userId);
        const winner = remaining.length === 1 ? remaining[0] : null;
        endGame(io, room, winner?.userId ?? null, "forfeit");
        io.to(`game_${room.id}`).emit("game:player_left", {
          userId: player.userId,
          name: player.name,
          temporary: false,
        });
      });

    } else if (room.status === "lobby") {
      removePlayerFromRoom(room, player.userId);
      io.to(`game_${room.id}`).emit("game:lobby_state", {
        roomId: room.id,
        players: room.players.map((p) => ({
          userId: p.userId, name: p.name, avatar: p.avatar, color: p.color, connected: p.connected,
        })),
        hostUserId: room.hostUserId,
        gameType: room.gameType,
      });
    }
  }
}
