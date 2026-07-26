export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
};

export type GoogleProfile = {
  sub: string;
  email: string;
  name?: string;
  given_name?: string;
  picture?: string;
};

export type OAuthProfile = {
  providerId: string;
  email: string;
  userName: string;
  avatarUrl: string;
};
