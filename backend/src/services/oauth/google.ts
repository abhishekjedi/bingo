import { randomUUID } from "crypto";
import { redis } from "../../clients/redis";
import env from "../../utils/environment";
import { badRequest } from "../../utils/http.errors";
import { GoogleProfile, GoogleTokenResponse, OAuthProfile } from "./oauth.types";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const PROFILE_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

const STATE_KEY = (state: string) => `bingo:oauth:state:${state}`;
const STATE_TTL_SECONDS = 600;

export const isGoogleConfigured = () =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const createAuthUrl = async () => {
  if (!isGoogleConfigured()) {
    throw badRequest("Google login is not configured");
  }

  const state = randomUUID();
  await redis.set(STATE_KEY(state), "1", "EX", STATE_TTL_SECONDS);

  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.GOOGLE_REDIRECT_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");

  return url.toString();
};

export const consumeState = async (state: string) => {
  if (!state) {
    return false;
  }
  const removed = await redis.del(STATE_KEY(state));
  return removed === 1;
};

const exchangeCodeForToken = async (code: string) => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URL,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("google token exchange failed", response.status, detail);
    throw badRequest("Could not exchange the Google authorization code");
  }

  return (await response.json()) as GoogleTokenResponse;
};

const fetchProfile = async (accessToken: string) => {
  const response = await fetch(PROFILE_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw badRequest("Could not read the Google profile");
  }

  return (await response.json()) as GoogleProfile;
};

export const authenticateWithCode = async (
  code: string
): Promise<OAuthProfile> => {
  const token = await exchangeCodeForToken(code);
  const profile = await fetchProfile(token.access_token);

  if (!profile.sub) {
    throw badRequest("Google profile is missing an identifier");
  }

  return {
    providerId: profile.sub,
    email: profile.email || "",
    userName: profile.name || profile.given_name || profile.email || "Player",
    avatarUrl: profile.picture || "",
  };
};
