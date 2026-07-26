import {
  countCompletedLines,
  EMPTY_CELL,
  isBingoDone,
} from "../../utils/game.utils";
import { BotView } from "./bot.types";

class BingoBot {
  chooseMove({ board, movesPlayed }: BotView) {
    const played = new Set(movesPlayed);

    const candidates = board.filter(
      (value) => value !== EMPTY_CELL && !played.has(value)
    );

    if (!candidates.length) {
      return null;
    }

    let bestLines = -1;
    let best: string[] = [];

    candidates.forEach((value) => {
      const lines = countCompletedLines([...played, value].join("|"), board);

      if (lines > bestLines) {
        bestLines = lines;
        best = [value];
      } else if (lines === bestLines) {
        best.push(value);
      }
    });

    return best[Math.floor(Math.random() * best.length)];
  }

  shouldClaimBingo({ board, movesPlayed }: BotView) {
    return isBingoDone(movesPlayed.join("|"), board);
  }
}

export const bingoBot = new BingoBot();
