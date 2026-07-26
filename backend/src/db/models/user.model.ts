export type AuthProvider = "google";

export type UserDocument = {
  _id: string;
  provider: AuthProvider;
  providerId: string;
  email: string;
  userName: string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

export const USERS_COLLECTION = "users";
