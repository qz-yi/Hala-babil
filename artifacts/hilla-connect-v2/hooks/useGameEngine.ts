import { useCallback, useEffect, useRef, useState } from "react";
import {
  GameState, GameType, GamePlayer, GameStatus,
  DominoTile, DominoState,
  TicTacToeState, TicTacToeSymbol, TicTacToeCell,
  checkTicTacToeWin,
  PLAYER_COLORS,
} from "@/components/games/gameTypes";
import { getSocket } from "@/hooks/useSocket";

const TURN_SECONDS = 30;

// ════════════════════════════════════════════
//  DOMINO helpers
// ════════════════════════════════════════════
function buildDominoes(): DominoTile[] {
  const tiles: DominoTile[] = [];
  let idx = 0;
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      tiles.push({ id: `d${idx++}`, a, b });
    }
  }
  return shuffle(tiles);
}

// ════════════════════════════════════════════
//  Utility
// ════════════════════════════════════════════
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function emitMove(roomId: string, newState: GameState, playerId: string, moveType: string) {
  try {
    getSocket().emit("game:move", { roomId, newState, playerId, moveType });
  } catch {
    // socket not connected — local-only mode
  }
}

function emitReset(roomId: string, newState: GameState) {
  try {
    getSocket().emit("game:reset", { roomId, newState });
  } catch {
    // socket not connected — local-only mode
  }
}

// ════════════════════════════════════════════
//  Main Hook
// ════════════════════════════════════════════
export function useGameEngine(currentUserId: string, roomId?: string) {
  const [game, setGame] = useState<GameState | null>(null);
  const [turnTimeLeft, setTurnTimeLeft] = useState(TURN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMyTurnRef = useRef(false);
  const gameRef = useRef<GameState | null>(null);

  // Keep gameRef in sync for use in timer callbacks
  useEffect(() => { gameRef.current = game; }, [game]);

  // ── Socket: join game room + listen for remote state ──────────────────────
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    const rejoinRoom = () => {
      socket.emit("game:join-room", roomId);
    };
    rejoinRoom();

    const onGameState = (newState: GameState) => {
      setGame(newState);
    };
    const onGameEnded = () => {
      setGame(null);
    };

    socket.on("game:state", onGameState);
    socket.on("game:ended", onGameEnded);
    socket.on("reconnect", rejoinRoom);

    return () => {
      socket.off("game:state", onGameState);
      socket.off("game:ended", onGameEnded);
      socket.off("reconnect", rejoinRoom);
    };
  }, [roomId]);

  // ── Turn timer: resets whenever currentTurnIndex or game ID changes ────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!game || game.status !== "playing") {
      setTurnTimeLeft(TURN_SECONDS);
      return;
    }

    setTurnTimeLeft(TURN_SECONDS);

    timerRef.current = setInterval(() => {
      setTurnTimeLeft((t) => {
        if (t <= 1) return 0;
        return t - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [game?.currentTurnIndex, game?.id, game?.status]);

  // ── Auto-pass when timer expires (domino only) ────────────────────────────
  useEffect(() => {
    if (turnTimeLeft !== 0) return;
    const g = gameRef.current;
    if (!g || g.status !== "playing") return;
    const isMyT = g.players[g.currentTurnIndex]?.id === currentUserId;
    if (!isMyT) return;

    if (g.gameType === "domino") {
      // Trigger draw/pass via a micro-timeout to avoid setState-in-setState
      setTimeout(() => dominoDrawFromBoneyard(), 0);
    }
    // Reset timer regardless
    setTurnTimeLeft(TURN_SECONDS);
  }, [turnTimeLeft]);

  // ── Start / Init ──────────────────────────────────────────────────────────
  const startGame = useCallback((gameType: GameType, players: GamePlayer[]) => {
    const baseState: GameState = {
      id: uid(),
      gameType,
      status: "splash",
      players,
      currentTurnIndex: 0,
      winner: null,
      startTime: Date.now(),
    };

    if (gameType === "domino") baseState.domino = initDomino(players);
    else if (gameType === "tictactoe") baseState.tictactoe = initTicTacToe(players);

    setGame(baseState);

    if (roomId) {
      try { getSocket().emit("game:start", { roomId, gameState: baseState }); } catch { /* offline */ }
    }

    setTimeout(() => {
      setGame((g) => {
        if (!g) return g;
        const updated: GameState = { ...g, status: "playing" };
        if (roomId) {
          try { getSocket().emit("game:start", { roomId, gameState: updated }); } catch { /* offline */ }
        }
        return updated;
      });
    }, 2800);
  }, [roomId]);

  const endGame = useCallback(() => {
    setGame(null);
    if (roomId) {
      try { getSocket().emit("game:end", roomId); } catch { /* offline */ }
    }
  }, [roomId]);

  const openSelector = useCallback((gameType: GameType, players: GamePlayer[]) => {
    setGame({
      id: uid(),
      gameType,
      status: "selecting",
      players,
      currentTurnIndex: 0,
      winner: null,
      startTime: Date.now(),
    });
  }, []);

  // ── TIC-TAC-TOE Init ──────────────────────────────────────────────────────
  function initTicTacToe(players: GamePlayer[]): TicTacToeState {
    const symbols: Record<string, TicTacToeSymbol> = {};
    symbols[players[0].id] = "X";
    symbols[players[1].id] = "O";
    return {
      board: Array(9).fill(null),
      symbols,
      currentSymbol: "X",
      winLine: null,
      isDraw: false,
      lastAction: "بدأت اللعبة! اضغط على خانة للعب ⭕",
    };
  }

  // ── TIC-TAC-TOE Actions ───────────────────────────────────────────────────
  const ticTacToePlay = useCallback((cellIndex: number) => {
    setGame((g) => {
      if (!g?.tictactoe || g.status !== "playing") return g;
      const s = g.tictactoe;
      const player = g.players[g.currentTurnIndex];
      if (player.id !== currentUserId) return g;
      if (s.board[cellIndex] !== null) return g;

      const mySymbol = s.symbols[player.id];
      if (mySymbol !== s.currentSymbol) return g;

      const newBoard: TicTacToeCell[] = [...s.board];
      newBoard[cellIndex] = mySymbol;

      const winLine = checkTicTacToeWin(newBoard, mySymbol);
      const isDraw = !winLine && newBoard.every((c) => c !== null);
      const nextSymbol: TicTacToeSymbol = mySymbol === "X" ? "O" : "X";
      const newTurnIdx = (g.currentTurnIndex + 1) % g.players.length;
      const winner = winLine ? player.id : null;
      const status: GameStatus = winner || isDraw ? "finished" : "playing";

      const actionLabel = winLine
        ? `🏆 ${player.name} فاز باللعبة!`
        : isDraw ? "🤝 تعادل! اللعبة انتهت"
        : `${player.name} لعب في الخانة ${cellIndex + 1}`;

      const newGame: GameState = {
        ...g,
        currentTurnIndex: newTurnIdx,
        winner,
        status,
        tictactoe: {
          ...s,
          board: newBoard,
          currentSymbol: nextSymbol,
          winLine: winLine ?? null,
          isDraw,
          lastAction: actionLabel,
        },
      };

      if (roomId) emitMove(roomId, newGame, currentUserId, "tictactoe:play");
      return newGame;
    });
  }, [currentUserId, roomId]);

  const ticTacToeReset = useCallback(() => {
    setGame((g) => {
      if (!g?.tictactoe) return g;
      const newGame: GameState = {
        ...g,
        status: "playing",
        winner: null,
        currentTurnIndex: 0,
        tictactoe: {
          ...g.tictactoe,
          board: Array(9).fill(null),
          currentSymbol: "X",
          winLine: null,
          isDraw: false,
          lastAction: "لعبة جديدة! ⭕",
        },
      };
      if (roomId) emitReset(roomId, newGame);
      return newGame;
    });
  }, [roomId]);

  // ── DOMINO Init ───────────────────────────────────────────────────────────
  function initDomino(players: GamePlayer[]): DominoState {
    const tiles = buildDominoes();
    const hands: Record<string, DominoTile[]> = {};
    let idx = 0;
    const handSize = players.length <= 2 ? 7 : 5;

    for (const p of players) {
      hands[p.id] = tiles.slice(idx, idx + handSize);
      idx += handSize;
    }

    const firstTile =
      hands[players[0].id].find((t) => t.a === t.b && t.a === 6) ??
      hands[players[0].id][0];

    const updHand = hands[players[0].id].filter((t) => t.id !== firstTile.id);

    return {
      hands: { ...hands, [players[0].id]: updHand },
      board: [{ tile: firstTile, flipped: false, x: 0, y: 0 }],
      leftEnd: firstTile.a,
      rightEnd: firstTile.b,
      boneyard: tiles.slice(idx),
      scores: Object.fromEntries(players.map((p) => [p.id, 0])),
      passCount: 0,
      lastAction: `${players[0].name} بدأ بقطعة ${firstTile.a}|${firstTile.b} 🀱`,
    };
  }

  // ── DOMINO Actions ────────────────────────────────────────────────────────
  const dominoPlayTile = useCallback((tileId: string, side: "left" | "right") => {
    setGame((g) => {
      if (!g?.domino || g.status !== "playing") return g;
      const s = g.domino;
      const player = g.players[g.currentTurnIndex];
      if (player.id !== currentUserId) return g;

      const hand = s.hands[player.id];
      const tileIdx = hand.findIndex((t) => t.id === tileId);
      if (tileIdx === -1) return g;
      const tile = hand[tileIdx];

      let newLeft = s.leftEnd;
      let newRight = s.rightEnd;
      let flipped = false;

      if (side === "left") {
        if (tile.b === s.leftEnd) { newLeft = tile.a; }
        else if (tile.a === s.leftEnd) { newLeft = tile.b; flipped = true; }
        else return g;
      } else {
        if (tile.a === s.rightEnd) { newRight = tile.b; }
        else if (tile.b === s.rightEnd) { newRight = tile.a; flipped = true; }
        else return g;
      }

      const newHand = hand.filter((_, i) => i !== tileIdx);
      const newTurnIdx = (g.currentTurnIndex + 1) % g.players.length;
      const winner = newHand.length === 0 ? player.id : null;

      const newGame: GameState = {
        ...g,
        currentTurnIndex: newTurnIdx,
        winner,
        status: winner ? "finished" : "playing",
        domino: {
          ...s,
          hands: { ...s.hands, [player.id]: newHand },
          board: [...s.board, { tile, flipped, x: s.board.length, y: 0 }],
          leftEnd: newLeft,
          rightEnd: newRight,
          passCount: 0,
          lastAction: `${player.name} لعب ${tile.a}|${tile.b} 🀱`,
        },
      };

      if (roomId) emitMove(roomId, newGame, currentUserId, "domino:play");
      return newGame;
    });
  }, [currentUserId, roomId]);

  const dominoDrawFromBoneyard = useCallback(() => {
    setGame((g) => {
      if (!g?.domino || g.status !== "playing") return g;
      const s = g.domino;
      const player = g.players[g.currentTurnIndex];
      if (player.id !== currentUserId) return g;

      if (s.boneyard.length === 0) {
        const numPlayers = g.players.length;
        const newPassCount = s.passCount + 1;
        if (newPassCount >= numPlayers) {
          const lowestPips = g.players.reduce(
            (best, p) => {
              const pips = s.hands[p.id].reduce((sum, t) => sum + t.a + t.b, 0);
              return pips < best.pips ? { id: p.id, pips } : best;
            },
            { id: g.players[0].id, pips: Infinity },
          );
          const newGame: GameState = { ...g, winner: lowestPips.id, status: "finished" };
          if (roomId) emitMove(roomId, newGame, currentUserId, "domino:end");
          return newGame;
        }
        const newGame: GameState = {
          ...g,
          currentTurnIndex: (g.currentTurnIndex + 1) % g.players.length,
          domino: { ...s, passCount: newPassCount, lastAction: `${player.name} مرّر (لا يوجد قطع) ⏭️` },
        };
        if (roomId) emitMove(roomId, newGame, currentUserId, "domino:pass");
        return newGame;
      }

      const drawn = s.boneyard[0];
      const newGame: GameState = {
        ...g,
        domino: {
          ...s,
          hands: { ...s.hands, [player.id]: [...s.hands[player.id], drawn] },
          boneyard: s.boneyard.slice(1),
          lastAction: `${player.name} سحب من المخزون 📤`,
        },
      };
      if (roomId) emitMove(roomId, newGame, currentUserId, "domino:draw");
      return newGame;
    });
  }, [currentUserId, roomId]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const isMyTurn = game
    ? game.players[game.currentTurnIndex]?.id === currentUserId
    : false;

  const amIPlayer = game
    ? game.players.some((p) => p.id === currentUserId)
    : false;

  isMyTurnRef.current = isMyTurn;

  return {
    game,
    isMyTurn,
    amIPlayer,
    turnTimeLeft,
    startGame,
    endGame,
    openSelector,
    ticTacToePlay,
    ticTacToeReset,
    dominoPlayTile,
    dominoDrawFromBoneyard,
  };
}
