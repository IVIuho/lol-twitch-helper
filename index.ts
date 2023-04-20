import LCUConnector from "lcu-connector";

import clientInfo from "./static/client.json";
import * as LCU from "./types/lcu";
import * as RiotProtocol from "./types/riot";
import { LCUController } from "./src/lcu";
import { SuperSocket } from "./src/websocket";
import { TwitchManager } from "./src/twitch";

const connector = new LCUConnector();

connector.on("connect", async (data: LCU.ConnectorData) => {
  const lcuApi = new LCUController(data);
  const socket = new SuperSocket(data);
  const twitch = new TwitchManager(clientInfo);

  await twitch.init(lcuApi);

  console.log("LCU data loaded");
  console.log(data);

  socket.on("open", () => {
    console.log("websocket open");

    socket.subscribe(RiotProtocol.Topic.Lobby, async (payload: RiotProtocol.Payload) => {
      const { eventType, uri } = payload;

      if (uri === RiotProtocol.Uri.Lobby) {
        switch (eventType) {
          case RiotProtocol.PayloadEventType.Create:
            console.log("로비 생성");

            const summonerList = await Promise.all(
              twitch.getNextQueue().map(async user => {
                const summoner = await lcuApi.getSummoner(user.gameNick);
                return summoner.summonerId;
              })
            );

            const invites = await lcuApi.invite(summonerList);
            console.dir(invites);

            break;
          case RiotProtocol.PayloadEventType.Delete:
            console.log("로비 삭제");
            break;
        }
      }
    });

    socket.subscribe(RiotProtocol.Topic.Session, (payload: RiotProtocol.Payload) => {
      const data: RiotProtocol.GameflowSession = payload.data;

      if (data) {
        const { phase, gameData } = data;

        switch (phase) {
          case RiotProtocol.GameflowPhase.Lobby:
            // if (payload?.data?.gameData?.queue?.id) console.log("로비 생성");
            // console.dir(payload, { depth: Infinity });
            break;
          case RiotProtocol.GameflowPhase.None:
            // console.log("로비 삭제");
            break;
          case RiotProtocol.GameflowPhase.Matchmaking:
            console.log("매칭 중");
            break;
          case RiotProtocol.GameflowPhase.ReadyCheck:
            console.log("매칭 수락");
            break;
          case RiotProtocol.GameflowPhase.GameStart:
            console.log("게임 시작");
            const nicknameList = [...gameData.teamOne, ...gameData.teamTwo].map(player =>
              player.summonerInternalName?.trim().toLowerCase()
            );

            const nextQueue = twitch.getNextQueue();
            const playingUsers = nextQueue.filter(user => nicknameList.includes(user.gameNick.trim().toLowerCase()));
            const removed = twitch.removeUsersFromQueue(playingUsers);
            removed.forEach(r => console.log(`Removed ${r?.nickname}(${r?.gameNick}) from queue`));
            break;
          case RiotProtocol.GameflowPhase.EndOfGame:
            console.log("게임 종료");
            break;
        }
      }
    });
  });
});

connector.start();
