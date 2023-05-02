export interface ConnectorData {
  protocol: string;
  address: string;
  port: number;
  username: string;
  password: string;
}

export enum HTTPMethod {
  Get = "get",
  Post = "post",
  Put = "put",
  Delete = "delete"
}

export enum EndPoint {
  AppName = "/riotclient/app-name",
  Invitations = "/lol-lobby/v2/lobby/invitations",
  Lobby = "/lol-lobby/v2/lobby",
  Summoner = "/lol-summoner/v1/summoners"
}

export namespace Api {
  export namespace GetAppName {
    export type Response = string;
  }

  export namespace GetSummoner {
    export interface Response {
      accountId: number;
      displayName: string;
      internalName: string;
      nameChangeFlag: boolean;
      percentCompleteForNextLevel: 95;
      privacy: "PRIVATE" | "PUBLIC";
      profileIconId: number;
      puuid: string;
      rerollPoints: {
        currentPoints: number;
        maxRolls: number;
        numberOfRolls: number;
        pointsCostToRoll: number;
        pointsToReroll: number;
      };
      summonerId: number;
      summonerLevel: number;
      unnamed: boolean;
      xpSinceLastLevel: number;
      xpUntilNextLevel: number;
    }
  }
}
