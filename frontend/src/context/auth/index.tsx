import { createContext, useEffect, useState } from "react";
import {
  AuthContext as AuthContextType,
  AuthManagerProps,
  GuestLoginResponse,
} from "./auth.context.types";
import { guestLogin } from "../../services/login/login.service";
import {
  getItemFromLocalStorage,
  setItemInLocalStorage,
} from "../../helpers/localstorage";
import CONSTANTS from "../../constants/constants";

const defaultAuthContextValue = {
  token: "",
  userId: "",
  generateToken: () => Promise.resolve(),
};

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

  async function generateToken() {
    const response = await guestLogin();
    console.log("response is ", response);
    if (response.isError) {
      console.log(response.msg);
      return;
    }
    const data = response.data as GuestLoginResponse;
    setItemInLocalStorage(CONSTANTS.LOCAL_STORAGE_KEYS.TOKEN, data.token);
    setItemInLocalStorage(CONSTANTS.LOCAL_STORAGE_KEYS.USER_ID, data.userId);
    setToken(data.token);
    setUserId(data.userId);
  }

  useEffect(() => {
    if (token !== "" && userId !== "") return;
    generateToken();
  }, [token, userId]);

  return (
    <AuthContext.Provider value={{ token, userId, generateToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthManager;
