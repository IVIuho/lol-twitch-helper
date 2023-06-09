import Axios from "axios";
import http from "http";
import qs from "querystring";
import * as fs from "fs";
import * as path from "path";
import * as tmi from "tmi.js";

import * as Twitch from "../types/twitch";
import { LCUApiController } from "./lcu";
import { UserQueue } from "./queue";

class TokenManager {
  private clientInfo: Twitch.Client;
  private tokenPath: string;
  private userAccessToken: Twitch.UserAccessToken;

  constructor(clientInfo: Twitch.Client) {
    this.clientInfo = this.validateClientInfo(clientInfo);
    this.tokenPath = path.join(process.cwd(), "static", "token.json");
    this.readTokenFile().then(token => {
      if (token !== null) {
        this.userAccessToken = token;
        console.dir(this.userAccessToken);
      }
    });
  }

  private validateClientInfo(clientInfo: Twitch.Client) {
    // eslint-disable-next-line no-unused-vars
    const { channels, ...data } = clientInfo;

    if (clientInfo === undefined || Object.values(data).some(v => v === undefined || v === "")) {
      throw Error("client info is invalid");
    }

    return clientInfo;
  }

  private async readTokenFile(): Promise<Twitch.UserAccessToken | null> {
    const isExists = fs.existsSync(this.tokenPath);

    if (isExists) {
      const token: Twitch.UserAccessToken = JSON.parse(fs.readFileSync(this.tokenPath, "utf-8"));

      console.log("Load token from file");
      return token;
    } else {
      console.log("Token file doesn't exists");
      return null;
    }
  }

  private writeTokenFile(data: Twitch.UserAccessToken) {
    console.log("write token file");
    fs.writeFileSync(this.tokenPath, JSON.stringify(data));
  }

  private getUserAuthUrl() {
    const params: Twitch.Api.AuthUser.Request = {
      client_id: this.clientInfo.clientId,
      redirect_uri: this.clientInfo.redirectUri,
      response_type: "code",
      scope: ["chat:read", "chat:edit"].join(" "),
      force_verify: true
    };

    return Twitch.Uri.Auth + `?${qs.stringify(Object.assign(params))}`;
  }

  private getUserAuthCode(): Promise<string> {
    return new Promise(resolve => {
      const server = new http.Server(async (req, res) => {
        if (req.url) {
          const { code, error } = qs.parse(req.url.replace("/?", ""));

          if (error || code === undefined) {
            return;
          } else if (Array.isArray(code)) {
            console.error(`auth code is not a string: ${code}`);
            return;
          }

          res.writeHead(200).end();
          server.close();
          resolve(code);
        }
      });

      const redirectUri = new URL(this.clientInfo.redirectUri);
      const { hostname, port } = redirectUri;

      server.listen({ host: hostname, port }, () => {
        console.log(this.getUserAuthUrl());
        console.log(`Port ${port} is listening`);
      });
    });
  }

  public async generateToken(code: string): Promise<Twitch.UserAccessToken> {
    const data: Twitch.Api.GenerateToken.Request = {
      client_id: this.clientInfo.clientId,
      client_secret: this.clientInfo.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: this.clientInfo.redirectUri
    };

    const response = await Axios.postForm(Twitch.Uri.Token, data);

    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      scope
    } = response.data as Twitch.Api.GenerateToken.Response;

    const token = { accessToken, refreshToken, scope };

    this.writeTokenFile(token);
    return token;
  }

  public async getToken(): Promise<Twitch.UserAccessToken> {
    if (this.userAccessToken) {
      const validation = await this.validateToken();

      if (!validation) {
        console.log("Try to refresh token in getting token progress");
        this.userAccessToken = await this.refreshToken();
      }

      return this.userAccessToken;
    } else {
      console.log("Try to generate token in getting token progress");

      const code = await this.getUserAuthCode();
      this.userAccessToken = await this.generateToken(code);

      return this.userAccessToken;
    }
  }

  private async validateToken(): Promise<boolean> {
    try {
      const response = await Axios.get(Twitch.Uri.ValidateToken, {
        headers: { Authorization: `OAuth ${this.userAccessToken.accessToken}` }
      });

      return response.status === 200;
    } catch (e: any) {
      console.error(e?.response?.data);
      return false;
    }
  }

  private async refreshToken(): Promise<Twitch.UserAccessToken> {
    if (this.userAccessToken === undefined || this.userAccessToken.refreshToken === "") {
      throw new Error(`token is empty: ${this.userAccessToken}`);
    }

    const data: Twitch.Api.RefreshToken.Request = {
      client_id: this.clientInfo.clientId,
      client_secret: this.clientInfo.clientSecret,
      grant_type: "refresh_token",
      refresh_token: this.userAccessToken.refreshToken
    };

    const response = await Axios.postForm(Twitch.Uri.Token, data);

    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      scope
    } = response.data as Twitch.Api.RefreshToken.Response;

    const token = { accessToken, refreshToken, scope };

    this.writeTokenFile(token);
    return token;
  }
}

export class TwitchManager {
  private adminId: string;
  private clientInfo: Twitch.Client;
  private tokenManager: TokenManager;
  private chatClient!: tmi.Client;
  private queue: UserQueue;
  private lcuApi: LCUApiController;

  constructor(clientInfo: Twitch.Client) {
    this.clientInfo = clientInfo;
    this.tokenManager = new TokenManager(this.clientInfo);
    this.queue = new UserQueue();
  }

  public async init(lcuApi: LCUApiController) {
    const token = await this.tokenManager.getToken();

    this.adminId = await this.getUserId(token, this.clientInfo.username);
    console.log("adminId:", this.adminId);

    this.lcuApi = lcuApi;
    this.chatClient = new tmi.Client({
      identity: {
        username: this.clientInfo.username,
        password: token.accessToken
      },
      channels: this.clientInfo.channels
    });

    this.chatClient.on("connected", (address, port) => {
      console.log(`Connected to ${address}:${port}`);
    });

    this.chatClient.on("disconnected", reason => {
      console.log(`Disconnected: ${reason}`);
    });

    this.chatClient.on("message", (channel, { "display-name": nickname, "user-id": uid }, message, self) => {
      if (self) return;
      if (!nickname || !uid) return;

      const isCommand = message.startsWith("!");

      if (isCommand) {
        const [command, ...args] = message.slice(1).split(" ");
        const user: Twitch.User = { uid, nickname };

        switch (command) {
          case "핑":
            this.ping(channel, user);
            break;
          case "시참":
            this.joinQueue(channel, user, args.join(" "));
            break;
          case "시참취소":
            this.leaveQueue(channel, user);
            break;
          case "대기열":
            this.getQueueInfo(channel, user);
            break;
          case "컷":
            this.kickUser(channel, user, args.join(" "));
            break;
          case "순서변경":
            this.changeOrder(channel, user, args);
            break;
          case "초대":
            this.invite(channel, user);
            break;
        }

        console.log(`${channel}: ${message}`);
      }
    });

    await this.chatClient.connect();

    return this;
  }

  public async close() {
    const state = this.chatClient.readyState();
    const channels = this.chatClient.getChannels();

    if (state !== "CLOSED") {
      await Promise.all(
        channels.map(channel => {
          this.chatClient.say(channel, `채팅과 연결이 끊겼습니다.`);
        })
      );

      await this.chatClient.disconnect();
    }
  }

  public async getUserId(token: Twitch.UserAccessToken, login: string): Promise<string> {
    const uri = Twitch.Uri.GetUsers + `?${qs.stringify({ login })}`;
    const data = await Axios.get(uri, {
      headers: { Authorization: `Bearer ${token.accessToken}`, "Client-Id": this.clientInfo.clientId }
    });
    const { data: response }: { data: Twitch.Api.GetUsers.Response } = data;

    return response.data[0].id;
  }

  public getNextQueue() {
    return this.queue.info().slice(0, 4);
  }

  public removeUsersFromQueue(users: Twitch.User[]) {
    return users.map(user => this.queue.remove(user));
  }

  private ping(channel: string, author: Twitch.User) {
    this.chatClient.say(channel, `@${author.nickname} 퐁`);
  }

  private getQueueInfo(channel: string, author: Twitch.User) {
    const queueInfo = this.queue.info();
    const { length } = queueInfo;

    if (author.uid === this.adminId) {
      queueInfo.forEach((user, index) => {
        console.log(index, user.uid, user.nickname, user.gameNick);
      });
    }

    const head = queueInfo
      .slice(0, 4)
      .map(user => user.nickname)
      .join(", ");

    const user = this.queue.getUserById(author.uid);
    let message: string;

    if (length > 4) {
      message = `${head}님 외 ${length - 4}명으로, 총 ${length}명이 대기 중입니다.`;
    } else if (length === 0) {
      message = "현재 대기열은 비어있습니다.";
    } else {
      message = `${head}님으로, 총 ${length}명이 대기 중입니다.`;
    }

    if (user) {
      const index = this.queue.getIndexById(author.uid);
      message += ` @${author.nickname} 님의 순서는 ${index + 1}번입니다.`;
    }

    this.chatClient.say(channel, message);
  }

  private joinQueue(channel: string, author: Twitch.User, gameNick: string) {
    if (gameNick) {
      if (this.queue.isExists(author)) {
        const { prev, next, index } = this.queue.update(author, gameNick);

        if (prev.gameNick === next.gameNick) {
          this.chatClient.say(channel, `@${author.nickname} 대기열에 이미 "${next.gameNick}"으로 등록되어 있습니다.`);
        } else {
          this.chatClient.say(
            channel,
            `@${author.nickname} 대기열의 닉네임을 "${prev.gameNick}"에서 "${
              next.gameNick
            }"으로 수정했습니다. 현재 대기 번호는 ${index + 1}번입니다.`
          );
        }
      } else {
        const order = this.queue.push(author, gameNick);

        this.chatClient.say(
          channel,
          `@${author.nickname} "${gameNick}"이 대기열에 추가됐습니다. 현재 대기 번호는 ${order}번입니다.`
        );
      }
    } else {
      this.chatClient.say(channel, `@${author.nickname} 게임 닉네임을 입력해주세요. ex) !시참 Hide on bush`);
    }
  }

  private leaveQueue(channel: string, author: Twitch.User) {
    const isExists = this.queue.isExists(author);

    if (isExists) {
      this.queue.remove(author);
      this.chatClient.say(channel, `@${author.nickname} 대기열에서 제외됐습니다.`);
    } else {
      this.chatClient.say(channel, `@${author.nickname} 대기열에 존재하지 않습니다.`);
    }
  }

  private kickUser(channel: string, author: Twitch.User, nickname: string) {
    if (author.uid !== this.adminId) return;

    const target = this.queue.getUserByNickname(nickname);

    if (target) {
      this.queue.remove(target);
      this.chatClient.say(channel, `대기열에서 ${nickname}(${target.gameNick})님이 제외되었습니다.`);
    } else {
      this.chatClient.say(channel, `대기열에 ${nickname}님이 존재하지 않습니다.`);
    }
  }

  private changeOrder(channel: string, author: Twitch.User, args: string[]) {
    if (author.uid !== this.adminId) return;

    const [from, to] = args.map(Number);

    if (from && to) {
      const target = this.queue.changeOrder(from - 1, to - 1);

      this.chatClient.say(channel, `${from}번째 대기자(${target.nickname})를 ${to}번째 순서로 옮겼습니다.`);
    } else {
      this.chatClient.say(channel, `@${author.nickname} 똑바로 써라`);
    }
  }

  private async invite(channel: string, author: Twitch.User) {
    const user = this.getNextQueue().find(user => user.uid === author.uid);

    if (user) {
      const summoner = await this.lcuApi.getSummoner(user.gameNick);
      this.lcuApi.invite([summoner.summonerId]);
      this.chatClient.say(channel, `@${author.nickname} "${summoner.displayName}"으로 초대를 보냈습니다.`);
    } else {
      this.chatClient.say(channel, `@${author.nickname} 참여 권한이 없습니다.`);
    }
  }
}

/* 무슨 이벤트인지 파악
join
logon
notice
roomstate
*/
// chatClient.action
// chatClient.commercial
// chatClient.deletemessage
