import { useCallback, useEffect, useState } from "react";
import { getSocket } from "@/hooks/useSocket";
import type {
  ClientGameState,
  ClientLobbyState,
  GameType,
  DominoTile,
} from "@/components/games/gameTypes";

export interface GameEndedPayload {
  roomId: string;
  winnerId: string | null;
  winnerName: string | null;
  reason: "win" | "draw" | "forfeit" | "blocked";
  finalScores: Record<string, number>;
}

export interface PlayerLeftPayload {
  userId: string;
  name: string;
  temporary: boolean;
}

export type GameMove =
  | { kind: "tictactoe"; cellIndex: number }
  | { kind: "domino"; tileId: string; end: "left" | "right"; flipped: boolean };

export interface GameSocketActions {
  createGame: (gameType: GameType) => void;
  joinGame: () => void;
  startGame: () => void;
  makeMove: (move: GameMove) => void;
  drawTile: () => void;
  passTurn: () => void;
  leaveGame: () => void;
  queryRoom: () => void;
  clearError: () => void;
  clearEnded: () => void;
}

export function useGameSocket(
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar: string | undefined,
  roomId: string | undefined,
) {
  const [serverState, setServerState] = useState<ClientGameState | null>(null);
  const [lobbyState, setLobbyState] = useState<ClientLobbyState | null>(null);
  const [endedResult, setEndedResult] = useState<GameEndedPayload | null>(null);
  const [playerLeft, setPlayerLeft] = useState<PlayerLeftPayload | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [drewTile, setDrewTile] = useState<DominoTile | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    const onGameState = (state: ClientGameState) => {
      setServerState(state);
    };
    const onLobbyState = (state: ClientLobbyState) => {
      if (state.roomId !== roomId) return;
      setLobbyState(state);
    };
    const onGameEnded = (result: GameEndedPayload) => {
      setEndedResult(result);
    };
    const onGameError = ({ message }: { message: string }) => {
      setGameError(message);
    };
    const onPlayerLeft = (data: PlayerLeftPayload) => {
      setPlayerLeft(data);
    };
    const onPlayerReconnected = ({ userId }: { userId: string }) => {
      setPlayerLeft((prev) => (prev?.userId === userId ? null : prev));
    };
    const onDrewTile = ({ tile }: { tile: DominoTile }) => {
      setDrewTile(tile);
      setTimeout(() => setDrewTile(null), 2500);
    };

    socket.on("game:state", onGameState);
    socket.on("game:lobby_state", onLobbyState);
    socket.on("game:ended", onGameEnded);
    socket.on("game:error", onGameError);
    socket.on("game:player_left", onPlayerLeft);
    socket.on("game:player_reconnected", onPlayerReconnected);
    socket.on("game:drew_tile", onDrewTile);

    return () => {
      socket.off("game:state", onGameState);
      socket.off("game:lobby_state", onLobbyState);
      socket.off("game:ended", onGameEnded);
      socket.off("game:error", onGameError);
      socket.off("game:player_left", onPlayerLeft);
      socket.off("game:player_reconnected", onPlayerReconnected);
      socket.off("game:drew_tile", onDrewTile);
    };
  }, [roomId]);

  const COLORS = ["#E53935", "#1565C0", "#2E7D32", "#F57F17", "#6A1B9A", "#00838F"];
  const myColor = currentUserId
    ? COLORS[currentUserId.charCodeAt(0) % COLORS.length]
    : COLORS[0];

  const createGame = useCallback(
    (gameType: GameType) => {
      if (!roomId || !currentUserId) return;
      getSocket().emit("game:create", {
        roomId,
        gameType,
        userId: currentUserId,
        name: currentUserName,
        avatar: currentUserAvatar,
        color: myColor,
      });
    },
    [roomId, currentUserId, currentUserName, currentUserAvatar, myColor],
  );

  const joinGame = useCallback(() => {
    if (!roomId || !currentUserId) return;
    getSocket().emit("game:join", {
      roomId,
      userId: currentUserId,
      name: currentUserName,
      avatar: currentUserAvatar,
      color: myColor,
    });
  }, [roomId, currentUserId, currentUserName, currentUserAvatar, myColor]);

  const startGame = useCallback(() => {
    if (!roomId || !currentUserId) return;
    getSocket().emit("game:start", { roomId, userId: currentUserId });
  }, [roomId, currentUserId]);

  const makeMove = useCallback(
    (move: GameMove) => {
      if (!roomId || !currentUserId) return;
      getSocket().emit("game:move", { roomId, userId: currentUserId, move });
    },
    [roomId, currentUserId],
  );

  const drawTile = useCallback(() => {
    if (!roomId || !currentUserId) return;
    getSocket().emit("game:draw", { roomId, userId: currentUserId });
  }, [roomId, currentUserId]);

  const passTurn = useCallback(() => {
    if (!roomId || !currentUserId) return;
    getSocket().emit("game:pass", { roomId, userId: currentUserId });
  }, [roomId, currentUserId]);

  const leaveGame = useCallback(() => {
    if (!roomId || !currentUserId) return;
    getSocket().emit("game:leave", { roomId, userId: currentUserId });
    setServerState(null);
    setLobbyState(null);
    setEndedResult(null);
    setPlayerLeft(null);
  }, [roomId, currentUserId]);

  const queryRoom = useCallback(() => {
    if (!roomId) return;
    getSocket().emit("game:query", { roomId, userId: currentUserId });
  }, [roomId, currentUserId]);

  const clearError = useCallback(() => setGameError(null), []);
  const clearEnded = useCallback(() => {
    setEndedResult(null);
    setServerState(null);
    setLobbyState(null);
  }, []);

  return {
    serverState,
    lobbyState,
    endedResult,
    playerLeft,
    gameError,
    drewTile,
    actions: {
      createGame,
      joinGame,
      startGame,
      makeMove,
      drawTile,
      passTurn,
      leaveGame,
      queryRoom,
      clearError,
      clearEnded,
    } satisfies GameSocketActions,
  };
}
