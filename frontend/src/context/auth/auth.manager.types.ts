import { ReactNode } from "react";

export type AuthContext = {
  token: string;
  userId: string;
  // eslint-disable-next-line
  generateToken: () => Promise<any>;
};

export type AuthManagerProps = {
  children: ReactNode;
};

export type GuestLoginResponse = {
  token: string;
  userId: string;
};
