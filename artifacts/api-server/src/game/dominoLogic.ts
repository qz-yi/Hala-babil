import type { BoardTile, DominoState, DominoTile } from "./gameTypes.js";

function generateFullSet(): DominoTile[] {
  const tiles: DominoTile[] = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      tiles.push({ id: `${a}-${b}`, a, b });
    }
  }
  return tiles;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function initDomino(playerIds: string[]): DominoState {
  const tiles = shuffle(generateFullSet());
  const tilesPerPlayer = playerIds.length <= 2 ? 7 : 5;
  const hands: Record<string, DominoTile[]> = {};
  let idx = 0;
  for (const pid of playerIds) {
    hands[pid] = tiles.slice(idx, idx + tilesPerPlayer);
    idx += tilesPerPlayer;
  }
  const scores: Record<string, number> = {};
  for (const pid of playerIds) scores[pid] = 0;
  return {
    hands,
    board: [],
    leftEnd: -1,
    rightEnd: -1,
    boneyard: tiles.slice(idx),
    scores,
    passCount: 0,
    lastAction: "اللعبة بدأت",
  };
}

export function playerCanPlay(state: DominoState, playerId: string): boolean {
  const hand = state.hands[playerId];
  if (!hand || hand.length === 0) return false;
  if (state.board.length === 0) return true;
  return hand.some(
    (t) =>
      t.a === state.leftEnd || t.b === state.leftEnd ||
      t.a === state.rightEnd || t.b === state.rightEnd,
  );
}

export function applyDominoMove(
  state: DominoState,
  playerId: string,
  tileId: string,
  end: "left" | "right",
  flipped: boolean,
  playerName: string,
  _turnIndex: number,
): { newState: DominoState; winnerId: string | null; error?: string } {
  const hand = state.hands[playerId];
  if (!hand) return { newState: state, winnerId: null, error: "لاعب غير معروف" };

  const tileIdx = hand.findIndex((t) => t.id === tileId);
  if (tileIdx === -1) return { newState: state, winnerId: null, error: "القطعة غير موجودة في يدك" };

  const rawTile = hand[tileIdx]!;
  const newHand = hand.filter((_, i) => i !== tileIdx);
  const newHands = { ...state.hands, [playerId]: newHand };

  let effectiveTile = flipped ? { ...rawTile, a: rawTile.b, b: rawTile.a } : rawTile;
  let newLeftEnd = state.leftEnd;
  let newRightEnd = state.rightEnd;

  if (state.board.length === 0) {
    newLeftEnd = effectiveTile.a;
    newRightEnd = effectiveTile.b;
  } else if (end === "left") {
    if (effectiveTile.b !== state.leftEnd) {
      if (effectiveTile.a !== state.leftEnd) {
        return { newState: state, winnerId: null, error: "القطعة لا تتطابق مع الطرف الأيسر" };
      }
      effectiveTile = { ...effectiveTile, a: effectiveTile.b, b: effectiveTile.a };
    }
    newLeftEnd = effectiveTile.a;
  } else {
    if (effectiveTile.a !== state.rightEnd) {
      if (effectiveTile.b !== state.rightEnd) {
        return { newState: state, winnerId: null, error: "القطعة لا تتطابق مع الطرف الأيمن" };
      }
      effectiveTile = { ...effectiveTile, a: effectiveTile.b, b: effectiveTile.a };
    }
    newRightEnd = effectiveTile.b;
  }

  const boardTile: BoardTile = {
    tile: effectiveTile,
    flipped: false,
    x: end === "left" ? -state.board.length - 1 : state.board.length + 1,
    y: 0,
  };
  const newBoard: BoardTile[] = end === "left"
    ? [boardTile, ...state.board]
    : [...state.board, boardTile];

  const winnerId = newHand.length === 0 ? playerId : null;

  let scores = state.scores;
  if (winnerId) {
    scores = computeScores({ ...state, hands: newHands }, playerId);
  }

  return {
    newState: {
      hands: newHands,
      board: newBoard,
      leftEnd: newLeftEnd,
      rightEnd: newRightEnd,
      boneyard: state.boneyard,
      scores,
      passCount: 0,
      lastAction: winnerId
        ? `${playerName} فاز بالجولة!`
        : `${playerName} لعب قطعة [${effectiveTile.a}|${effectiveTile.b}]`,
    },
    winnerId,
  };
}

export function applyDominoDraw(
  state: DominoState,
  playerId: string,
  playerName: string,
): { newState: DominoState; drawnTile: DominoTile | null; error?: string } {
  if (state.boneyard.length === 0) return { newState: state, drawnTile: null, error: "المخزن فارغ" };
  const hand = state.hands[playerId];
  if (!hand) return { newState: state, drawnTile: null, error: "لاعب غير معروف" };
  if (playerCanPlay(state, playerId)) {
    return { newState: state, drawnTile: null, error: "يجب اللعب قبل السحب" };
  }
  const [drawnTile, ...newBoneyard] = state.boneyard;
  return {
    newState: {
      ...state,
      hands: { ...state.hands, [playerId]: [...hand, drawnTile!] },
      boneyard: newBoneyard,
      lastAction: `${playerName} سحب قطعة من المخزن`,
    },
    drawnTile: drawnTile!,
  };
}

export function applyDominoPass(
  state: DominoState,
  playerId: string,
  playerName: string,
  playerCount: number,
): { newState: DominoState; isBlocked: boolean; error?: string } {
  if (state.boneyard.length > 0) {
    return { newState: state, isBlocked: false, error: "يجب السحب من المخزن أولاً" };
  }
  if (playerCanPlay(state, playerId)) {
    return { newState: state, isBlocked: false, error: "يجب اللعب وليس التمرير" };
  }
  const newPassCount = state.passCount + 1;
  return {
    newState: { ...state, passCount: newPassCount, lastAction: `${playerName} مرّر دوره` },
    isBlocked: newPassCount >= playerCount,
  };
}

function computeScores(state: DominoState, winnerId: string): Record<string, number> {
  const scores = { ...state.scores };
  let total = 0;
  for (const [pid, hand] of Object.entries(state.hands)) {
    if (pid !== winnerId) total += hand.reduce((s, t) => s + t.a + t.b, 0);
  }
  scores[winnerId] = (scores[winnerId] ?? 0) + total;
  return scores;
}

export function computeBlockedWinner(state: DominoState, playerIds: string[]): string {
  let minPips = Infinity;
  let winnerId = playerIds[0]!;
  for (const pid of playerIds) {
    const pips = (state.hands[pid] ?? []).reduce((s, t) => s + t.a + t.b, 0);
    if (pips < minPips) { minPips = pips; winnerId = pid; }
  }
  return winnerId;
}
