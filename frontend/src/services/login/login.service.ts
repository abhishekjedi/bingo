import HttpClientInstance from "../../config/httpclient";

export const apiBaseUrl =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export function guestLogin() {
  return HttpClientInstance.get({
    url: "/api/login/guest",
  });
}

export function getGoogleLoginUrl() {
  return `${apiBaseUrl}/api/auth/google`;
}

export function getGameHistory() {
  return HttpClientInstance.get({
    url: "/api/game/history",
  });
}
