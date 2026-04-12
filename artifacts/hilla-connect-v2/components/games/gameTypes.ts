export type GameType = "tictactoe" | "domino";
export type GameStatus = "idle" | "selecting" | "splash" | "playing" | "finished";

export interface GamePlayer {
  id: string;
  name: string;
  avatar?: string;
  isBot?: boolean;
  color: string;
}

// ─── TIC-TAC-TOE ───
export type TicTacToeSymbol = "X" | "O";
export type TicTacToeCell = TicTacToeSymbol | null;

export interface TicTacToeState {
  board: TicTacToeCell[];
  symbols: Record<string, TicTacToeSymbol>;
  currentSymbol: TicTacToeSymbol;
  winLine: number[] | null;
  isDraw: boolean;
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

export interface GameState {
  id: string;
  gameType: GameType;
  status: GameStatus;
  players: GamePlayer[];
  currentTurnIndex: number;
  winner: string | null;
  startTime: number;
  tictactoe?: TicTacToeState;
  domino?: DominoState;
}

export const GAME_INFO = {
  tictactoe: {
    name: "إكس أو",
    emoji: "⭕",
    description: "أكمل صف أو عمود أو قطر قبل خصمك",
    minPlayers: 2,
    maxPlayers: 2,
    color: "#6366F1",
    gradient: ["#6366F1", "#4F46E5"] as [string, string],
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
};

export const PLAYER_COLORS = [
  "#E53935", "#1565C0", "#2E7D32", "#F57F17",
  "#6A1B9A", "#00838F",
];

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function checkTicTacToeWin(board: TicTacToeCell[], symbol: TicTacToeSymbol): number[] | null {
  for (const line of WIN_LINES) {
    if (line.every((i) => board[i] === symbol)) return line;
  }
  return null;
}
