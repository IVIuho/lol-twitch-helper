export interface Client {
  username: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface UserAccessToken {
  accessToken: string;
  refreshToken: string;
  scope: string[];
}

export interface User {
  uid: string;
  nickname: string;
}

export interface WaitingUser extends User {
  gameNick: string;
}

export namespace Uri {
  export const GetUsers = "https://api.twitch.tv/helix/users";
  export const Auth = "https://id.twitch.tv/oauth2/authorize";
  export const Token = "https://id.twitch.tv/oauth2/token";
  export const ValidateToken = "https://id.twitch.tv/oauth2/validate";
}

export namespace Api {
  export namespace GetUsers {
    export interface Response {
      data: {
        id: string;
        login: string;
        display_name: string;
        type: string;
        broadcaster_type: string;
        description: string;
        profile_image_url: string;
        offline_image_url: string;
        view_count: number;
        email: string;
        created_at: string;
      }[];
    }
  }

  export namespace AuthUser {
    export interface Request {
      client_id: string;
      force_verify?: boolean;
      redirect_uri: string;
      response_type: "code";
      scope: string;
      state?: string;
    }
  }

  export namespace GenerateToken {
    export interface Request {
      client_id: string;
      client_secret: string;
      code: string;
      grant_type: "authorization_code";
      redirect_uri: string;
    }

    export interface Response {
      access_token: string;
      expires_in: number;
      refresh_token: string;
      scope: string[];
      token_type: "bearer";
    }
  }

  export namespace ValidateToken {
    export interface Request {}

    export interface Response {}
  }

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
