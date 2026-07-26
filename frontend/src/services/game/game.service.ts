import HttpClientInstance from "../../config/httpclient";

export function createGameId() {
  return HttpClientInstance.get({
    url: "/api/game/id",
  });
}

export function getGameHistory() {
  return HttpClientInstance.get({
    url: "/api/game/history",
  });
}
