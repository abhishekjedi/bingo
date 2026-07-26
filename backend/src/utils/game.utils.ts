export const BOARD_SIDE = 5;
export const TOTAL_CELLS = BOARD_SIDE * BOARD_SIDE;
export const EMPTY_CELL = "0";
export const LINES_TO_WIN = 5;

export const parseMoves = (moves: string) =>
  moves.split("|").filter((move) => move !== "");

export const createEmptyBoard = () => Array<string>(TOTAL_CELLS).fill(EMPTY_CELL);

export const isValidNumber = (value: string) => {
  const parsed = Number(value);
  return (
    /^\d+$/.test(value) && Number.isInteger(parsed) && parsed >= 1 && parsed <= TOTAL_CELLS
  );
};

export const isValidMove = (moves: string, move: string) => {
  if (!isValidNumber(move)) {
    return false;
  }
  return !parseMoves(moves).includes(move);
};

export const countCompletedLines = (
  movesPlayed: string,
  playersBoard: string[]
) => {
  const played = new Set(parseMoves(movesPlayed));

  const marked: boolean[][] = Array(BOARD_SIDE)
    .fill(false)
    .map(() => Array<boolean>(BOARD_SIDE).fill(false));

  for (let row = 0; row < BOARD_SIDE; row++) {
    for (let col = 0; col < BOARD_SIDE; col++) {
      marked[row][col] = played.has(playersBoard[row * BOARD_SIDE + col]);
    }
  }

  let completedLines = 0;

  for (let i = 0; i < BOARD_SIDE; i++) {
    let rowCount = 0;
    let colCount = 0;
    for (let j = 0; j < BOARD_SIDE; j++) {
      rowCount += Number(marked[i][j]);
      colCount += Number(marked[j][i]);
    }
    completedLines += Number(rowCount === BOARD_SIDE);
    completedLines += Number(colCount === BOARD_SIDE);
  }

  let mainDiagonal = 0;
  let antiDiagonal = 0;
  for (let i = 0; i < BOARD_SIDE; i++) {
    mainDiagonal += Number(marked[i][i]);
    antiDiagonal += Number(marked[BOARD_SIDE - 1 - i][i]);
  }
  completedLines += Number(mainDiagonal === BOARD_SIDE);
  completedLines += Number(antiDiagonal === BOARD_SIDE);

  return completedLines;
};

export const isBingoDone = (movesPlayed: string, playersBoard: string[]) => {
  if (!playersBoard || playersBoard.length !== TOTAL_CELLS) {
    return false;
  }
  return countCompletedLines(movesPlayed, playersBoard) >= LINES_TO_WIN;
};

export const isAllNumbersFilled = (playersBoard: string[]) => {
  return (
    !!playersBoard &&
    playersBoard.length === TOTAL_CELLS &&
    playersBoard.every((value) => value !== EMPTY_CELL)
  );
};
