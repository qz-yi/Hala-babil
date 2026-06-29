import type { TicTacToeCell, TicTacToeState, TicTacToeSymbol } from "./gameTypes.js";

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function checkWin(board: TicTacToeCell[], symbol: TicTacToeSymbol): number[] | null {
  for (const line of WIN_LINES) {
    if (line.every((i) => board[i] === symbol)) return line;
  }
  return null;
}

export function initTicTacToe(playerIds: string[]): TicTacToeState {
  const symbols: Record<string, TicTacToeSymbol> = {};
  symbols[playerIds[0]!] = "X";
  symbols[playerIds[1]!] = "O";
  return {
    board: Array(9).fill(null),
    symbols,
    currentSymbol: "X",
    winLine: null,
    isDraw: false,
    lastAction: "",
  };
}

export function applyTicTacToeMove(
  state: TicTacToeState,
  playerId: string,
  cellIndex: number,
  playerName: string,
): { newState: TicTacToeState; winnerId: string | null; isDraw: boolean; error?: string } {
  if (cellIndex < 0 || cellIndex > 8) {
    return { newState: state, winnerId: null, isDraw: false, error: "خانة غير صالحة" };
  }
  const expectedSymbol = state.symbols[playerId];
  if (!expectedSymbol) {
    return { newState: state, winnerId: null, isDraw: false, error: "لاعب غير معروف" };
  }
  if (expectedSymbol !== state.currentSymbol) {
    return { newState: state, winnerId: null, isDraw: false, error: "ليس دورك" };
  }
  if (state.board[cellIndex] !== null) {
    return { newState: state, winnerId: null, isDraw: false, error: "الخانة مشغولة بالفعل" };
  }

  const newBoard = [...state.board] as TicTacToeCell[];
  newBoard[cellIndex] = expectedSymbol;

  const winLine = checkWin(newBoard, expectedSymbol);
  const isDraw = !winLine && newBoard.every((c) => c !== null);
  const nextSymbol: TicTacToeSymbol = expectedSymbol === "X" ? "O" : "X";

  const newState: TicTacToeState = {
    board: newBoard,
    symbols: state.symbols,
    currentSymbol: isDraw || winLine ? state.currentSymbol : nextSymbol,
    winLine: winLine ?? null,
    isDraw,
    lastAction: `${playerName} لعب في خانة ${cellIndex + 1}`,
  };

  return { newState, winnerId: winLine ? playerId : null, isDraw };
}
