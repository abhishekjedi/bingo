const GAME_ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const GAME_ID_LENGTH = 5;

export const generateGameCode = () => {
  let code = "";
  for (let i = 0; i < GAME_ID_LENGTH; i++) {
    code +=
      GAME_ID_ALPHABET[Math.floor(Math.random() * GAME_ID_ALPHABET.length)];
  }
  return code;
};
