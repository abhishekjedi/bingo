// move structure ---- 1|2|3
export const isValidMove = (moves: string, move: string) => {
  const moveArray = moves.split("|");
  return !moveArray.includes(move);
};

export const isBingoDone = (movesPlayed: string, playersBoard: string[]) => {
  const moveArray = movesPlayed.split("|");
  const board = Array(5)
    .fill(0)
    .map(() => Array(5).fill(0));

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const playersNumberOnGivenCell = playersBoard[i * 5 + j];
      board[i][j] = moveArray.includes(playersNumberOnGivenCell);
    }
  }

  let numOfColAndRowsFilled = 0;

  for (let i = 0; i < 5; i++) {
    let isCurrentRowFilled = 0,
      isCurrentColumnFilled = 0;
    for (let j = 0; j < 5; j++) {
      isCurrentColumnFilled += board[i][j];
      isCurrentRowFilled += board[j][i];
    }

    numOfColAndRowsFilled += Number(isCurrentColumnFilled === 5);
    numOfColAndRowsFilled += Number(isCurrentRowFilled === 5);
  }

  let i = 0,
    j = 0,
    isCurrentDiagonalFilled = 0;
  while (i < 5 && j < 5) {
    isCurrentDiagonalFilled += board[i][j];
    i++;
    j++;
  }
  numOfColAndRowsFilled += Number(isCurrentDiagonalFilled === 5);
  i = 4;
  j = 0;
  isCurrentDiagonalFilled = 0;
  while (i >= 0 && j < 5) {
    isCurrentDiagonalFilled += board[i][j];
    i--;
    j++;
  }
  numOfColAndRowsFilled += Number(isCurrentDiagonalFilled === 5);

  if (numOfColAndRowsFilled >= 5) {
    return true;
  }
  return false;
};

export const isAllNumbersFilled = (playersBoard: string[]) => {
  return playersBoard.every((value) => value !== "0");
};
