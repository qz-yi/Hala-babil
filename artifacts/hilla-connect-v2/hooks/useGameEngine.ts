import { useCallback, useState } from "react";
import {
  GameState, GameType, GamePlayer, UnoCard, UnoColor, UnoState,
  DominoTile, DominoState, LudoState, LudoPiece, DiceState,
  PLAYER_COLORS,
} from "@/components/games/gameTypes";

// ════════════════════════════════════════════
//  UNO helpers
// ════════════════════════════════════════════
function buildUnoDeck(): UnoCard[] {
  const colors: UnoColor[] = ["red", "green", "blue", "yellow"];
  const cards: UnoCard[] = [];
  let idx = 0;

  for (const color of colors) {
    cards.push({ id: `${idx++}`, color, value: 0, action: null });
    for (let v = 1; v <= 9; v++) {
      cards.push({ id: `${idx++}`, color, value: v, action: null });
      cards.push({ id: `${idx++}`, color, value: v, action: null });
    }
    for (const action of ["skip", "reverse", "draw2"] as const) {
      cards.push({ id: `${idx++}`, color, value: null, action });
      cards.push({ id: `${idx++}`, color, value: null, action });
    }
  }
  for (let i = 0; i < 4; i++) {
    cards.push({ id: `${idx++}`, color: "wild", value: null, action: "wild" });
    cards.push({ id: `${idx++}`, color: "wild", value: null, action: "wild4" });
  }
  return shuffle(cards);
}

function canPlayUno(card: UnoCard, topCard: UnoCard, currentColor: UnoColor): boolean {
  if (card.action === "wild" || card.action === "wild4") return true;
  if (card.color === currentColor) return true;
  if (card.action !== null && card.action === topCard.action) return true;
  if (card.value !== null && card.value === topCard.value) return true;
  return false;
}

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
//  LUDO constants
// ════════════════════════════════════════════
const LUDO_PATH_LENGTH = 52;
const LUDO_HOME_STRETCH = 6;
const LUDO_SAFE = [0, 8, 13, 21, 26, 34, 39, 47];

function getPlayerStartPos(playerIndex: number): number {
  return [0, 13, 26, 39][playerIndex] ?? 0;
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

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
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

    if (gameType === "uno") {
      baseState.uno = initUno(players);
    } else if (gameType === "domino") {
      baseState.domino = initDomino(players);
    } else if (gameType === "ludo") {
      baseState.ludo = initLudo(players);
    } else if (gameType === "dice") {
      baseState.dice = initDice(players);
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

  // ── UNO Init ──────────────────────────────
  function initUno(players: GamePlayer[]): UnoState {
    const deck = buildUnoDeck();
    const hands: Record<string, UnoCard[]> = {};
    let deckIdx = 0;

    for (const p of players) {
      hands[p.id] = deck.slice(deckIdx, deckIdx + 7);
      deckIdx += 7;
    }

    let topCard = deck[deckIdx++];
    while (topCard.action === "wild4") {
      deck.push(topCard);
      topCard = deck[deckIdx++];
    }

    return {
      hands,
      discardPile: [topCard],
      deckSize: deck.length - deckIdx,
      currentColor: topCard.color === "wild" ? "red" : topCard.color,
      direction: 1,
      drawStack: 0,
      skipNext: false,
      choosingColor: false,
      unoCallers: [],
      lastAction: "بدأت اللعبة! 🃏",
    };
  }

  // ── UNO Actions ───────────────────────────
  const unoPlayCard = useCallback((cardId: string, chosenColor?: UnoColor) => {
    setGame((g) => {
      if (!g?.uno || g.status !== "playing") return g;
      const s = g.uno;
      const player = g.players[g.currentTurnIndex];
      if (player.id !== currentUserId) return g;

      const hand = s.hands[player.id];
      const cardIdx = hand.findIndex((c) => c.id === cardId);
      if (cardIdx === -1) return g;
      const card = hand[cardIdx];
      const topCard = s.discardPile[s.discardPile.length - 1];

      if (s.drawStack > 0 && card.action !== "draw2" && card.action !== "wild4") return g;
      if (!canPlayUno(card, topCard, s.currentColor)) return g;

      const newHand = hand.filter((_, i) => i !== cardIdx);
      const newDiscard = [...s.discardPile, card];
      let newColor = card.color === "wild" ? (chosenColor ?? "red") : card.color;
      let newDirection = s.direction;
      let newDrawStack = s.drawStack;
      let skipNext = false;
      let choosingColor = false;
      let newTurnIdx = g.currentTurnIndex;
      const numPlayers = g.players.length;

      if (card.action === "wild" || card.action === "wild4") {
        if (!chosenColor) {
          choosingColor = true;
        } else {
          newColor = chosenColor;
          if (card.action === "wild4") newDrawStack = (newDrawStack || 0) + 4;
        }
      } else if (card.action === "reverse") {
        newDirection = (newDirection === 1 ? -1 : 1) as 1 | -1;
        if (numPlayers === 2) skipNext = true;
      } else if (card.action === "skip") {
        skipNext = true;
      } else if (card.action === "draw2") {
        newDrawStack = (newDrawStack || 0) + 2;
      }

      if (!choosingColor) {
        newTurnIdx = (g.currentTurnIndex + newDirection + numPlayers) % numPlayers;
        if (skipNext) {
          newTurnIdx = (newTurnIdx + newDirection + numPlayers) % numPlayers;
        }
      }

      const winner = newHand.length === 0 ? player.id : null;
      const actionLabel = card.action
        ? `${player.name} لعب ${card.action === "wild" ? "وايلد" : card.action === "wild4" ? "+4 وايلد" : card.action === "draw2" ? "+2" : card.action === "reverse" ? "عكس" : "تخطي"} 🎴`
        : `${player.name} لعب ${card.value} ${card.color} 🎴`;

      return {
        ...g,
        currentTurnIndex: newTurnIdx,
        winner,
        status: winner ? "finished" : "playing",
        uno: {
          ...s,
          hands: { ...s.hands, [player.id]: newHand },
          discardPile: newDiscard,
          currentColor: newColor,
          direction: newDirection,
          drawStack: newDrawStack,
          skipNext: false,
          choosingColor,
          lastAction: actionLabel,
        },
      };
    });
  }, [currentUserId]);

  const unoChooseColor = useCallback((color: UnoColor) => {
    setGame((g) => {
      if (!g?.uno) return g;
      const s = g.uno;
      const topCard = s.discardPile[s.discardPile.length - 1];
      const isWild4 = topCard.action === "wild4";
      const numPlayers = g.players.length;
      const newStack = isWild4 ? (s.drawStack || 0) : s.drawStack;
      const newTurnIdx = (g.currentTurnIndex + s.direction + numPlayers) % numPlayers;

      return {
        ...g,
        currentTurnIndex: newTurnIdx,
        uno: { ...s, currentColor: color, choosingColor: false, drawStack: newStack, lastAction: `اختار اللون: ${color} 🎨` },
      };
    });
  }, []);

  const unoDrawCard = useCallback(() => {
    setGame((g) => {
      if (!g?.uno || g.status !== "playing") return g;
      const s = g.uno;
      const player = g.players[g.currentTurnIndex];
      if (player.id !== currentUserId) return g;

      const drawCount = s.drawStack > 0 ? s.drawStack : 1;
      const drawnCards: UnoCard[] = [];
      const colors: UnoColor[] = ["red", "green", "blue", "yellow"];
      for (let i = 0; i < drawCount; i++) {
        const c = Math.floor(Math.random() * 4);
        const v = Math.floor(Math.random() * 10);
        drawnCards.push({ id: uid(), color: colors[c], value: v, action: null });
      }

      const numPlayers = g.players.length;
      const newTurnIdx = (g.currentTurnIndex + s.direction + numPlayers) % numPlayers;

      return {
        ...g,
        currentTurnIndex: newTurnIdx,
        uno: {
          ...s,
          hands: { ...s.hands, [player.id]: [...s.hands[player.id], ...drawnCards] },
          drawStack: 0,
          deckSize: Math.max(0, s.deckSize - drawCount),
          lastAction: `${player.name} سحب ${drawCount} ورقة${drawCount > 1 ? "ات" : ""} 📤`,
        },
      };
    });
  }, [currentUserId]);

  const callUno = useCallback(() => {
    setGame((g) => {
      if (!g?.uno) return g;
      const s = g.uno;
      const player = g.players.find((p) => p.id === currentUserId);
      if (!player) return g;
      return { ...g, uno: { ...s, unoCallers: [...s.unoCallers, player.id], lastAction: `${player.name} صرخ UNO! 🗣️` } };
    });
  }, [currentUserId]);

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

      const totalPips = Object.entries({ ...s.hands, [player.id]: newHand })
        .reduce((sum, [, h]) => sum + h.reduce((s2, t) => s2 + t.a + t.b, 0), 0);

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

  // ── LUDO Init ─────────────────────────────
  function initLudo(players: GamePlayer[]): LudoState {
    const pieces: LudoPiece[] = [];
    players.forEach((p, pi) => {
      for (let i = 0; i < 4; i++) {
        pieces.push({ id: `${p.id}-${i}`, playerId: p.id, position: -1, isHome: true, isFinished: false });
      }
    });
    return {
      pieces,
      dice: 0,
      diceRolled: false,
      movablePieces: [],
      scores: Object.fromEntries(players.map((p) => [p.id, 0])),
      lastAction: "اضغط النرد لتبدأ! 🎲",
    };
  }

  const ludoRollDice = useCallback(() => {
    setGame((g) => {
      if (!g?.ludo || g.status !== "playing") return g;
      const s = g.ludo;
      const player = g.players[g.currentTurnIndex];
      if (player.id !== currentUserId || s.diceRolled) return g;

      const die = rollDie();
      const playerPieces = s.pieces.filter((p) => p.playerId === player.id);
      const startPos = getPlayerStartPos(g.currentTurnIndex);

      const movable = playerPieces
        .filter((p) => {
          if (p.isFinished) return false;
          if (p.isHome) return die === 6;
          const newPos = (p.position + die) % LUDO_PATH_LENGTH;
          return newPos <= LUDO_PATH_LENGTH + LUDO_HOME_STRETCH;
        })
        .map((p) => p.id);

      if (movable.length === 0) {
        const numPlayers = g.players.length;
        const newTurnIdx = (g.currentTurnIndex + 1) % numPlayers;
        return { ...g, currentTurnIndex: newTurnIdx, ludo: { ...s, dice: die, diceRolled: false, movablePieces: [], lastAction: `${player.name} رمى ${die} — لا حركة ممكنة ⏭️` } };
      }

      return { ...g, ludo: { ...s, dice: die, diceRolled: true, movablePieces: movable, lastAction: `${player.name} رمى ${die} 🎲` } };
    });
  }, [currentUserId]);

  const ludoMovePiece = useCallback((pieceId: string) => {
    setGame((g) => {
      if (!g?.ludo || g.status !== "playing") return g;
      const s = g.ludo;
      const player = g.players[g.currentTurnIndex];
      if (player.id !== currentUserId) return g;
      if (!s.movablePieces.includes(pieceId)) return g;

      const pieceIdx = s.pieces.findIndex((p) => p.id === pieceId);
      if (pieceIdx === -1) return g;
      const piece = s.pieces[pieceIdx];
      const startPos = getPlayerStartPos(g.currentTurnIndex);

      let newPos: number;
      let isHome = false;
      if (piece.isHome) {
        newPos = startPos;
        isHome = false;
      } else {
        newPos = (piece.position + s.dice) % LUDO_PATH_LENGTH;
      }

      let newPieces = [...s.pieces];
      newPieces[pieceIdx] = { ...piece, position: newPos, isHome };

      const killed: string[] = [];
      if (!LUDO_SAFE.includes(newPos)) {
        newPieces = newPieces.map((p) => {
          if (p.playerId !== player.id && p.position === newPos && !p.isHome && !p.isFinished) {
            killed.push(p.id);
            return { ...p, position: -1, isHome: true };
          }
          return p;
        });
      }

      const playerFinished = newPieces.filter((p) => p.playerId === player.id && p.isFinished).length;
      const winner = playerFinished === 4 ? player.id : null;

      const numPlayers = g.players.length;
      const giveExtraTurn = s.dice === 6 || killed.length > 0;
      const newTurnIdx = giveExtraTurn ? g.currentTurnIndex : (g.currentTurnIndex + 1) % numPlayers;

      const actionLabel = killed.length > 0
        ? `${player.name} قتل قطعة! 💀 — على ${newPos}`
        : `${player.name} حرك إلى ${newPos} 🏃`;

      return {
        ...g,
        currentTurnIndex: newTurnIdx,
        winner,
        status: winner ? "finished" : "playing",
        ludo: { ...s, pieces: newPieces, diceRolled: false, movablePieces: [], lastAction: actionLabel },
      };
    });
  }, [currentUserId]);

  // ── DICE BATTLE Init ──────────────────────
  function initDice(players: GamePlayer[]): DiceState {
    return {
      dice: Object.fromEntries(players.map((p) => [p.id, [0, 0]])),
      rolling: false,
      scores: Object.fromEntries(players.map((p) => [p.id, 0])),
      round: 1,
      maxRounds: 5,
      lastAction: "اضغط رمي النرد لتبدأ! 🎯",
      roundWinner: null,
    };
  }

  const diceRoll = useCallback(() => {
    setGame((g) => {
      if (!g?.dice || g.status !== "playing") return g;
      const s = g.dice;
      const player = g.players[g.currentTurnIndex];
      if (player.id !== currentUserId) return g;

      const d1 = rollDie();
      const d2 = rollDie();
      const total = d1 + d2;

      const newDice = { ...s.dice, [player.id]: [d1, d2] };
      const numPlayers = g.players.length;
      const nextTurn = (g.currentTurnIndex + 1) % numPlayers;

      const allRolled = Object.values(newDice).every((d) => d[0] > 0);
      let newScores = { ...s.scores };
      let roundWinner: string | null = null;
      let newRound = s.round;
      let newTurnIdx = nextTurn;
      let winner: string | null = null;

      if (allRolled) {
        const totals = g.players.map((p) => ({ id: p.id, total: (newDice[p.id][0] ?? 0) + (newDice[p.id][1] ?? 0) }));
        const maxTotal = Math.max(...totals.map((t) => t.total));
        const winners = totals.filter((t) => t.total === maxTotal);
        if (winners.length === 1) {
          roundWinner = winners[0].id;
          newScores[roundWinner] = (newScores[roundWinner] ?? 0) + 1;
        }

        newRound = s.round + 1;
        const resetDice = Object.fromEntries(g.players.map((p) => [p.id, [0, 0]]));

        if (newRound > s.maxRounds) {
          const topScore = Math.max(...Object.values(newScores));
          const leaders = g.players.filter((p) => newScores[p.id] === topScore);
          winner = leaders.length === 1 ? leaders[0].id : null;
        }

        return {
          ...g,
          currentTurnIndex: 0,
          winner,
          status: winner ? "finished" : "playing",
          dice: { ...s, dice: newRound > s.maxRounds ? newDice : resetDice, scores: newScores, round: newRound, roundWinner, lastAction: roundWinner ? `فاز ${g.players.find((p) => p.id === roundWinner)?.name} بالجولة ${s.round}! 🏆` : `تعادل في الجولة ${s.round}! 🤝` },
        };
      }

      return {
        ...g,
        currentTurnIndex: nextTurn,
        dice: { ...s, dice: newDice, roundWinner: null, lastAction: `${player.name} رمى ${d1}+${d2}=${total} 🎲` },
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
    unoPlayCard,
    unoChooseColor,
    unoDrawCard,
    callUno,
    dominoPlayTile,
    dominoDrawFromBoneyard,
    ludoRollDice,
    ludoMovePiece,
    diceRoll,
  };
}
