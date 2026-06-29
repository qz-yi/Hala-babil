import type { GameRoom, GameType, ServerGamePlayer } from "./gameTypes.js";

const TURN_DURATION_MS = 30_000;
const CLEANUP_DELAY_MS = 60_000;
const RECONNECT_GRACE_MS = 30_000;

export const PLAYER_COLORS = [
  "#E53935", "#1565C0", "#2E7D32", "#F57F17",
  "#6A1B9A", "#00838F",
];

export const registry = new Map<string, GameRoom>();

export function getRoom(roomId: string): GameRoom | undefined {
  return registry.get(roomId);
}

export function createRoom(
  roomId: string,
  gameType: GameType,
  host: Omit<ServerGamePlayer, "connected">,
): GameRoom {
  const existing = registry.get(roomId);
  if (existing && existing.status === "lobby") return existing;

  const room: GameRoom = {
    id: roomId,
    gameType,
    status: "lobby",
    players: [{ ...host, connected: true }],
    hostUserId: host.userId,
    currentTurnIndex: 0,
    turnDeadline: 0,
    timer: null,
    winner: null,
    createdAt: Date.now(),
    reconnectTimers: new Map(),
  };

  registry.set(roomId, room);
  return room;
}

export function addPlayerToRoom(
  room: GameRoom,
  player: Omit<ServerGamePlayer, "connected" | "color">,
): { error?: string } {
  const MAX_PLAYERS = room.gameType === "tictactoe" ? 2 : 4;
  if (room.status !== "lobby") return { error: "اللعبة جارية بالفعل" };
  if (room.players.length >= MAX_PLAYERS) return { error: "الغرفة ممتلئة" };
  if (room.players.some((p) => p.userId === player.userId)) {
    return {};
  }
  const color = PLAYER_COLORS[room.players.length % PLAYER_COLORS.length] ?? "#fff";
  room.players.push({ ...player, connected: true, color });
  return {};
}

export function removePlayerFromRoom(room: GameRoom, userId: string): void {
  room.players = room.players.filter((p) => p.userId !== userId);
  if (room.players.length === 0) {
    scheduleCleanup(room.id, 0);
  } else if (room.hostUserId === userId && room.players[0]) {
    room.hostUserId = room.players[0].userId;
  }
}

export function markPlayerConnected(room: GameRoom, userId: string, socketId: string): void {
  const p = room.players.find((pl) => pl.userId === userId);
  if (p) {
    p.connected = true;
    p.socketId = socketId;
  }
}

export function markPlayerDisconnected(room: GameRoom, userId: string): void {
  const p = room.players.find((pl) => pl.userId === userId);
  if (p) p.connected = false;
}

export function clearTimer(room: GameRoom): void {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
}

export function setTurnTimer(
  room: GameRoom,
  onExpire: () => void,
): void {
  clearTimer(room);
  room.turnDeadline = Date.now() + TURN_DURATION_MS;
  room.timer = setTimeout(onExpire, TURN_DURATION_MS);
}

export function scheduleCleanup(roomId: string, delayMs = CLEANUP_DELAY_MS): void {
  setTimeout(() => {
    registry.delete(roomId);
  }, delayMs);
}

export function scheduleReconnect(
  room: GameRoom,
  userId: string,
  onForfeit: () => void,
): void {
  const existing = room.reconnectTimers.get(userId);
  if (existing) clearTimeout(existing);
  const t = setTimeout(() => {
    room.reconnectTimers.delete(userId);
    onForfeit();
  }, RECONNECT_GRACE_MS);
  room.reconnectTimers.set(userId, t);
}

export function cancelReconnectTimer(room: GameRoom, userId: string): void {
  const t = room.reconnectTimers.get(userId);
  if (t) {
    clearTimeout(t);
    room.reconnectTimers.delete(userId);
  }
}
