export type GameType = "uno" | "domino" | "ludo" | "dice";
export type GameStatus = "idle" | "selecting" | "splash" | "playing" | "finished";

export interface GamePlayer {
  id: string;
  name: string;
  avatar?: string;
  isBot?: boolean;
  color: string;
}

// ─── UNO ───
export type UnoColor = "red" | "green" | "blue" | "yellow" | "wild";
export type UnoAction = "skip" | "reverse" | "draw2" | "wild" | "wild4" | null;

export interface UnoCard {
  id: string;
  color: UnoColor;
  value: number | null;
  action: UnoAction;
}

export interface UnoState {
  hands: Record<string, UnoCard[]>;
  discardPile: UnoCard[];
  deckSize: number;
  currentColor: UnoColor;
  direction: 1 | -1;
  drawStack: number;
  skipNext: boolean;
  choosingColor: boolean;
  unoCallers: string[];
  lastAction: string;
}

// ─── DOMINO ───
export interface DominoTile {
  id: string;
  a: number;
  b: number;
}

export interface BoardTile {
  tile: DominoTile;
  flipped: boolean;
  x: number;
  y: number;
}

export interface DominoState {
  hands: Record<string, DominoTile[]>;
  board: BoardTile[];
  leftEnd: number;
  rightEnd: number;
  boneyard: DominoTile[];
  scores: Record<string, number>;
  passCount: number;
  lastAction: string;
}

// ─── LUDO ───
export interface LudoPiece {
  id: string;
  playerId: string;
  position: number;
  isHome: boolean;
  isFinished: boolean;
}

export interface LudoState {
  pieces: LudoPiece[];
  dice: number;
  diceRolled: boolean;
  movablePieces: string[];
  scores: Record<string, number>;
  lastAction: string;
}

// ─── DICE BATTLE ───
export interface DiceState {
  dice: Record<string, number[]>;
  rolling: boolean;
  scores: Record<string, number>;
  round: number;
  maxRounds: number;
  lastAction: string;
  roundWinner: string | null;
}

export interface GameState {
  id: string;
  gameType: GameType;
  status: GameStatus;
  players: GamePlayer[];
  currentTurnIndex: number;
  winner: string | null;
  startTime: number;
  uno?: UnoState;
  domino?: DominoState;
  ludo?: LudoState;
  dice?: DiceState;
}

export const GAME_INFO = {
  uno: {
    name: "أونو",
    emoji: "🃏",
    description: "العب أوراق الألوان وتخلص من يدك أولاً",
    minPlayers: 2,
    maxPlayers: 6,
    color: "#E53935",
    gradient: ["#E53935", "#B71C1C"] as [string, string],
  },
  domino: {
    name: "دومينو",
    emoji: "🀱",
    description: "طابق القطع وتخلص منها لتفوز",
    minPlayers: 2,
    maxPlayers: 4,
    color: "#1565C0",
    gradient: ["#1565C0", "#0D47A1"] as [string, string],
  },
  ludo: {
    name: "لودو",
    emoji: "🎲",
    description: "سبق قطعك للنهاية قبل خصومك",
    minPlayers: 2,
    maxPlayers: 4,
    color: "#2E7D32",
    gradient: ["#2E7D32", "#1B5E20"] as [string, string],
  },
  dice: {
    name: "نرد الحظ",
    emoji: "🎯",
    description: "من يرمي أعلى رقم في ٥ جولات يفوز",
    minPlayers: 2,
    maxPlayers: 2,
    color: "#6A1B9A",
    gradient: ["#6A1B9A", "#4A148C"] as [string, string],
  },
};

export const PLAYER_COLORS = [
  "#E53935", "#1565C0", "#2E7D32", "#F57F17",
  "#6A1B9A", "#00838F",
];
