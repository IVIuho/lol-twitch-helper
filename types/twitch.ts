export const TokenUri = "https://id.twitch.tv/oauth2/token";
export const TokenValidateUri = "https://id.twitch.tv/oauth2/validate";

export interface Client {
  adminId: string;
  username: string;
  clientId: string;
  clientSecret: string;
}

export interface Token {
  accessToken: string;
  refreshToken: string;
  scope: string[];
  tokenType: string;
}

export interface User {
  uid: string;
  nickname: string;
}

export interface WaitingUser extends User {
  gameNick: string;
}

export namespace Api {
  export namespace RefreshToken {
    export interface Request {
      client_id: string;
      client_secret: string;
      grant_type: string;
      refresh_token: string;
    }

    export interface Response {
      access_token: string;
      refresh_token: string;
      scope: string[];
      token_type: string;
    }
  }
}
