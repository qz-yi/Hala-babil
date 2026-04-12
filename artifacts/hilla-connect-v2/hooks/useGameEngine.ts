import { useCallback, useState } from "react";
import {
  GameState, GameType, GamePlayer,
  DominoTile, DominoState,
  TicTacToeState, TicTacToeSymbol, TicTacToeCell,
  checkTicTacToeWin,
  PLAYER_COLORS,
} from "@/components/games/gameTypes";

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

function canPlayDomino(tile: DominoTile, leftEnd: number, rightEnd: number): boolean {
  return tile.a === leftEnd || tile.b === leftEnd ||
    tile.a === rightEnd || tile.b === rightEnd;
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

// ════════════════════════════════════════════
//  Main Hook
// ════════════════════════════════════════════
export function useGameEngine(currentUserId: string) {
  const [game, setGame] = useState<GameState | null>(null);

  // ── Start / Init ──────────────────────────
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

    if (gameType === "domino") {
      baseState.domino = initDomino(players);
    } else if (gameType === "tictactoe") {
      baseState.tictactoe = initTicTacToe(players);
    }

    setGame(baseState);

    setTimeout(() => {
      setGame((g) => g ? { ...g, status: "playing" } : g);
    }, 2800);
  }, []);

  const endGame = useCallback(() => {
    setGame(null);
  }, []);

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

  // ── TIC-TAC-TOE Init ──────────────────────
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

  // ── TIC-TAC-TOE Actions ───────────────────
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
      const numPlayers = g.players.length;
      const newTurnIdx = (g.currentTurnIndex + 1) % numPlayers;

      const actionLabel = winLine
        ? `🏆 ${player.name} فاز باللعبة!`
        : isDraw
        ? "🤝 تعادل! اللعبة انتهت"
        : `${player.name} لعب في الخانة ${cellIndex + 1}`;

      const winner = winLine ? player.id : null;
      const status = winner || isDraw ? "finished" : "playing";

      return {
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
    });
  }, [currentUserId]);

  const ticTacToeReset = useCallback(() => {
    setGame((g) => {
      if (!g?.tictactoe) return g;
      return {
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
    });
  }, []);

  // ── DOMINO Init ───────────────────────────
  function initDomino(players: GamePlayer[]): DominoState {
    const tiles = buildDominoes();
    const hands: Record<string, DominoTile[]> = {};
    let idx = 0;
    const handSize = players.length <= 2 ? 7 : 5;

    for (const p of players) {
      hands[p.id] = tiles.slice(idx, idx + handSize);
      idx += handSize;
    }

    const firstTile = hands[players[0].id].find((t) => t.a === t.b && t.a === 6) ??
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
      const numPlayers = g.players.length;
      const newTurnIdx = (g.currentTurnIndex + 1) % numPlayers;

      const winner = newHand.length === 0 ? player.id : null;

      return {
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
    });
  }, [currentUserId]);

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
          const lowestPips = g.players.reduce((best, p) => {
            const pips = s.hands[p.id].reduce((sum, t) => sum + t.a + t.b, 0);
            return pips < best.pips ? { id: p.id, pips } : best;
          }, { id: g.players[0].id, pips: Infinity });
          return { ...g, winner: lowestPips.id, status: "finished" };
        }
        return { ...g, currentTurnIndex: (g.currentTurnIndex + 1) % numPlayers, domino: { ...s, passCount: newPassCount, lastAction: `${player.name} مرّر (لا يوجد قطع) ⏭️` } };
      }

      const drawn = s.boneyard[0];
      const newBoneyard = s.boneyard.slice(1);
      return {
        ...g,
        domino: {
          ...s,
          hands: { ...s.hands, [player.id]: [...s.hands[player.id], drawn] },
          boneyard: newBoneyard,
          lastAction: `${player.name} سحب من المخزون 📤`,
        },
      };
    });
  }, [currentUserId]);

  // ── Getters ───────────────────────────────
  const isMyTurn = game
    ? game.players[game.currentTurnIndex]?.id === currentUserId
    : false;

  const amIPlayer = game
    ? game.players.some((p) => p.id === currentUserId)
    : false;

  return {
    game,
    isMyTurn,
    amIPlayer,
    startGame,
    endGame,
    openSelector,
    ticTacToePlay,
    ticTacToeReset,
    dominoPlayTile,
    dominoDrawFromBoneyard,
  };
}
