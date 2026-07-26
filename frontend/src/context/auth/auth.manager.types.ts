import { ReactNode } from "react";

export type AuthContext = {
  token: string;
  userId: string;
  // eslint-disable-next-line
  generateToken: () => Promise<any>;
  loginWithGoogle: () => void;
};

export type AuthManagerProps = {
  children: ReactNode;
};

export type GuestLoginResponse = {
  token: string;
  userId: string;
  userName: string;
};
