import CONSTANTS from "../constants/constants";

const { SIDE, TOTAL_CELLS, LINES_TO_WIN } = CONSTANTS.BOARD;

export const EMPTY_CELL = "0";

export function countCompletedLines(board: string[], movesPlayed: string[]) {
  if (!board || board.length !== TOTAL_CELLS) return 0;

  const played = new Set(movesPlayed);
  const marked = board.map((value) => played.has(value));

  let lines = 0;

  for (let i = 0; i < SIDE; i++) {
    let row = 0;
    let column = 0;
    for (let j = 0; j < SIDE; j++) {
      row += Number(marked[i * SIDE + j]);
      column += Number(marked[j * SIDE + i]);
    }
    lines += Number(row === SIDE);
    lines += Number(column === SIDE);
  }

  let main = 0;
  let anti = 0;
  for (let i = 0; i < SIDE; i++) {
    main += Number(marked[i * SIDE + i]);
    anti += Number(marked[(SIDE - 1 - i) * SIDE + i]);
  }
  lines += Number(main === SIDE);
  lines += Number(anti === SIDE);

  return lines;
}

export function hasBingo(board: string[], movesPlayed: string[]) {
  return countCompletedLines(board, movesPlayed) >= LINES_TO_WIN;
}

export function isBoardComplete(board: string[]) {
  return (
    board.length === TOTAL_CELLS &&
    board.every((value) => value && value !== EMPTY_CELL)
  );
}

export function nextNumberToPlace(board: string[]) {
  for (let candidate = 1; candidate <= TOTAL_CELLS; candidate++) {
    if (!board.includes(`${candidate}`)) return `${candidate}`;
  }
  return null;
}

export function emptyBoard() {
  return Array<string>(TOTAL_CELLS).fill(EMPTY_CELL);
}
