import { ReactNode } from "react";

export type AuthContext = {
  token: string;
  userId: string;
  // eslint-disable-next-line
  generateToken: () => Promise<any>;
  loginWithGoogle: () => void;
  userName: string;
  isGuest: boolean;
};

export type AuthManagerProps = {
  children: ReactNode;
};

export type GuestLoginResponse = {
  token: string;
  userId: string;
  userName: string;
};
