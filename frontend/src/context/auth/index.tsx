import { createContext, useEffect, useState } from "react";
import {
  AuthContext as AuthContextType,
  AuthManagerProps,
  GuestLoginResponse,
} from "./auth.manager.types";
import {
  getGoogleLoginUrl,
  guestLogin,
} from "../../services/login/login.service";
import {
  getItemFromLocalStorage,
  setItemInLocalStorage,
} from "../../helpers/localstorage";
import CONSTANTS from "../../constants/constants";

const defaultAuthContextValue = {
  token: "",
  userId: "",
  generateToken: () => Promise.resolve(),
  loginWithGoogle: () => {},
  userName: "",
  isGuest: true,
};

function readTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (!token) return null;

  params.delete("token");
  const query = params.toString();
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}`
  );
  return token;
}

function readTokenPayload(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

export const AuthContext = createContext<AuthContextType>(
  defaultAuthContextValue
);

const AuthManager = ({ children }: AuthManagerProps) => {
  const [token, setToken] = useState(
    getItemFromLocalStorage(CONSTANTS.LOCAL_STORAGE_KEYS.TOKEN) || ""
  );
  const [userId, setUserId] = useState(
    getItemFromLocalStorage(CONSTANTS.LOCAL_STORAGE_KEYS.USER_ID) || ""
  );

  const payload = token ? readTokenPayload(token) : {};

  function persistSession(nextToken: string, nextUserId: string) {
    setItemInLocalStorage(CONSTANTS.LOCAL_STORAGE_KEYS.TOKEN, nextToken);
    setItemInLocalStorage(CONSTANTS.LOCAL_STORAGE_KEYS.USER_ID, nextUserId);
    setToken(nextToken);
    setUserId(nextUserId);
  }

  async function generateToken() {
    const response = await guestLogin();
    if (response.isError) {
      console.error(response.msg);
      return;
    }
    const data = response.data as GuestLoginResponse;
    persistSession(data.token, data.userId);
  }

  function loginWithGoogle() {
    window.location.href = getGoogleLoginUrl();
  }

  useEffect(() => {
    const oauthToken = readTokenFromUrl();
    if (oauthToken) {
      persistSession(oauthToken, readTokenPayload(oauthToken).userId || "");
      return;
    }
    if (token !== "" && userId !== "") return;
    generateToken();
  }, [token, userId]);

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        generateToken,
        loginWithGoogle,
        userName: payload.userName || "",
        isGuest: payload.isGuest !== false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthManager;
