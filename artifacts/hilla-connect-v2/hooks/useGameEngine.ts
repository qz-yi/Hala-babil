import { useCallback, useEffect, useState } from "react";
import {
  ClientGameState,
  DominoState,
  DominoTile,
  GamePlayer,
  GameState,
  GameStatus,
} from "@/components/games/gameTypes";
import { useGameSocket } from "@/hooks/useGameSocket";

const TURN_SECONDS = 30;

function transformServerState(
  serverState: ClientGameState,
  currentUserId: string,
): GameState {
  const players: GamePlayer[] = serverState.players.map((p) => ({
    id: p.userId,
    name: p.name,
    avatar: p.avatar,
    color: p.color,
  }));

  const statusMap: Record<string, GameStatus> = {
    lobby: "splash",
    playing: "playing",
    finished: "finished",
  };

  let domino: DominoState | undefined;
  if (serverState.domino) {
    const sd = serverState.domino;
    const hands: Record<string, DominoTile[]> = {
      [currentUserId]: sd.myHand,
    };
    for (const [opId, size] of Object.entries(sd.opponentHandSizes)) {
      hands[opId] = Array.from({ length: size }, (_, i) => ({
        id: `hidden-${opId}-${i}`,
        a: -1,
        b: -1,
      }));
    }
    domino = {
      hands,
      board: sd.board,
      leftEnd: sd.leftEnd,
      rightEnd: sd.rightEnd,
      boneyard: Array.from({ length: sd.boneyardSize }, (_, i) => ({
        id: `bone-${i}`,
        a: -1,
        b: -1,
      })),
      scores: sd.scores,
      passCount: sd.passCount,
      lastAction: sd.lastAction,
    };
  }

  return {
    id: serverState.roomId,
    gameType: serverState.gameType,
    status: statusMap[serverState.status] ?? "idle",
    players,
    currentTurnIndex: serverState.currentTurnIndex,
    winner: serverState.winner,
    startTime: Date.now(),
    tictactoe: serverState.tictactoe,
    domino,
  };
}

function computeFlipped(
  tile: DominoTile,
  end: "left" | "right",
  leftEnd: number,
  rightEnd: number,
): boolean {
  if (end === "left") return tile.a === leftEnd;
  return tile.b === rightEnd;
}

export function useGameEngine(
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar: string | undefined,
  roomId?: string,
) {
  const {
    serverState,
    lobbyState,
    endedResult,
    playerLeft,
    gameError,
    drewTile,
    actions,
  } = useGameSocket(currentUserId, currentUserName, currentUserAvatar, roomId);

  const [turnTimeLeft, setTurnTimeLeft] = useState(TURN_SECONDS);

  const game = serverState ? transformServerState(serverState, currentUserId) : null;

  useEffect(() => {
    if (!serverState || serverState.status !== "playing" || !serverState.turnDeadline) {
      setTurnTimeLeft(TURN_SECONDS);
      return;
    }
    const update = () => {
      const remaining = Math.max(
        0,
        Math.ceil((serverState.turnDeadline - Date.now()) / 1000),
      );
      setTurnTimeLeft(remaining);
    };
    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [serverState?.turnDeadline, serverState?.status]);

  const isMyTurn = game
    ? game.players[game.currentTurnIndex]?.id === currentUserId
    : false;

  const amIPlayer = game
    ? game.players.some((p) => p.id === currentUserId)
    : false;

  const isHost = lobbyState
    ? lobbyState.hostUserId === currentUserId
    : serverState?.players[0]?.userId === currentUserId;

  const ticTacToePlay = useCallback(
    (cellIndex: number) => {
      actions.makeMove({ kind: "tictactoe", cellIndex });
    },
    [actions],
  );

  const ticTacToeReset = useCallback(() => {
    actions.leaveGame();
  }, [actions]);

  const dominoPlayTile = useCallback(
    (tileId: string, side: "left" | "right") => {
      if (!serverState?.domino) return;
      const sd = serverState.domino;
      const tile = sd.myHand.find((t) => t.id === tileId);
      if (!tile) return;
      const flipped = computeFlipped(tile, side, sd.leftEnd, sd.rightEnd);
      actions.makeMove({ kind: "domino", tileId, end: side, flipped });
    },
    [actions, serverState],
  );

  const dominoDrawFromBoneyard = useCallback(() => {
    if (!serverState?.domino) return;
    if (serverState.domino.boneyardSize > 0) {
      actions.drawTile();
    } else {
      actions.passTurn();
    }
  }, [actions, serverState]);

  return {
    game,
    isMyTurn,
    amIPlayer,
    turnTimeLeft,
    isHost,
    lobbyState,
    endedResult,
    playerLeft,
    gameError,
    drewTile,
    serverState,
    startGame: actions.startGame,
    createGame: actions.createGame,
    joinGame: actions.joinGame,
    endGame: actions.leaveGame,
    queryRoom: actions.queryRoom,
    clearError: actions.clearError,
    clearEnded: actions.clearEnded,
    ticTacToePlay,
    ticTacToeReset,
    dominoPlayTile,
    dominoDrawFromBoneyard,
  };
}
