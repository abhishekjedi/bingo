export type GuestLoginResponse = {
  token: string;
  userId: string;
};

export type HomeState = {
  isError: boolean;
  isLoading: boolean;
};
