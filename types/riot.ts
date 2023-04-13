export enum MessageType {
  Welcome,
  Prefix,
  Call,
  CallResult,
  CallError,
  Subscribe,
  Unsubscribe,
  Publish,
  Event
}

export enum PayloadEventType {
  Create = "Create",
  Update = "Update",
  Delete = "Delete"
}

export interface Payload {
  data: any | null;
  eventType: PayloadEventType;
  uri: string;
}

export interface Message {
  type: MessageType;
  event: string;
  data: Payload;
}

export enum Topic {
  Lobby = "OnJsonApiEvent_lol-lobby_v2_lobby",
  Session = "OnJsonApiEvent_lol-gameflow_v1_session"
}

export enum Uri {
  Inviations = "/lol-lobby/v2/lobby/invitations",
  Lobby = "/lol-lobby/v2/lobby",
  Session = "/lol-gameflow/v1/session"
}

export enum GameflowPhase {
  None = "None",
  Lobby = "Lobby",
  Matchmaking = "Matchmaking",
  CheckedIntoTournament = "CheckedIntoTournament",
  ReadyCheck = "ReadyCheck",
  ChampSelect = "ChampSelect",
  GameStart = "GameStart",
  FailedToLaunch = "FailedToLaunch",
  InProgress = "InProgress",
  Reconnect = "Reconnect",
  WaitingForStats = "WaitingForStats",
  PreEndOfGame = "PreEndOfGame",
  EndOfGame = "EndOfGame",
  TerminatedInError = "TerminatedInError"
}

export interface GamePlayer {
  championId: number;
  lastSelectedSkinIndex: number;
  profileIconId: number;
  puuid?: string;
  selectedPosition?: string;
  selectedRole?: string;
  summonerId?: number;
  summonerInternalName?: string;
  summonerName?: string;
  teamOwner: boolean;
  teamParticipantId: number;
}

export enum GameflowQueueGameCategory {
  None = "None",
  Custom = "Custom",
  PvP = "PvP",
  VersusAi = "VersusAi",
  Alpha = "Alpha"
}

export interface GameflowSession {
  phase: GameflowPhase;
  gameData: {
    gameId: number;
    queue: {
      id: number;
      mapId: number;
      name: string;
      shortName: string;
      description: string;
      detailedDescription: string;
      type: string;
      gameMode: string;
      assetMutator: string;
      category: GameflowQueueGameCategory;
      gameTypeConfig: {
        id: number;
        name: string;
        maxAllowableBans: number;
        allowTrades: boolean;
        exclusivePick: boolean;
        duplicatePick: boolean;
        teamChampionPool: boolean;
        crossTeamChampionPool: boolean;
        advancedLearningQuests: boolean;
        battleBoost: boolean;
        deathMatch: boolean;
        doNotRemove: boolean;
        learningQuests: boolean;
        onboardCoopBeginner: boolean;
        reroll: boolean;
        mainPickTimerDuration: number;
        postPickTimerDuration: number;
        banTimerDuration: number;
        pickMode: string;
        banMode: string;
      };
      numPlayersPerTeam: number;
      minimumParticipantListSize: number;
      maximumParticipantListSize: number;
      minLevel: number;
      isRanked: boolean;
      areFreeChampionsAllowed: boolean;
      isTeamBuilderManaged: boolean;
      queueAvailability: "Available" | "PlatformDisabled" | "DoesntMeetRequirements";
      queueRewards: {
        isIpEnabled: boolean;
        isXpEnabled: boolean;
        isChampionPointsEnabled: boolean;
        partySizeIpRewards: number;
      };
      spectatorEnabled: boolean;
      championsRequiredToPlay: number;
      allowablePremadeSizes: number[];
      showPositionSelector: boolean;
      lastToggledOffTime: number;
      lastToggledOnTime: number;
      removalFromGameAllowed: boolean;
      removalFromGameDelayMinutes: number;
    };
    isCustomGame: boolean;
    gameName: string;
    password: string;
    teamOne: GamePlayer[];
    teamTwo: GamePlayer[];
    playerChampionSelections: {
      championId: number;
      selectedSkinIndex: number;
      spell1Id: number;
      spell2Id: number;
      summonerInternalName: string;
    };
    spectatorsAllowed: boolean;
  };
  gameClient: {
    serverIp: string;
    serverPort: number;
    observerServerIp: string;
    observerServerPort: number;
    running: boolean;
    visible: boolean;
  };
  map: {
    id: number;
    name: string;
    mapStringId: string;
    gameMode: string;
    gameModeName: string;
    gameModeShortName: string;
    gameMutator: string;
    isRGM: boolean;
    description: string;
    platformId: string;
    platformName: string;
    assets: { [key: string]: string };
    categorizedContentBundles: object;
    properties: object;
    perPositionRequiredSummonerSpells: object;
    perPositionDisallowedSummonerSpells: object;
  };
  gameDodge: {
    state: "Invalid" | "PartyDodged" | "StrangerDodged" | "TournamentDodged";
    dodgeIds: number[];
    phase: GameflowPhase;
  };
}
