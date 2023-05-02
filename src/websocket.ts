import { WebSocket } from "ws";

import * as LCU from "../types/lcu";
import * as RiotProtocol from "../types/riot";

export class LeagueClientSocket {
  private connection: WebSocket;
  private url: string;

  constructor(data: LCU.ConnectorData) {
    const { address, port, username, password } = data;
    const url = `wss://${username}:${password}@${address}:${port}`;

    this.url = url;
    this.connect(url);
  }

  get state() {
    return this.connection.readyState;
  }

  private onMessage(message: Buffer) {
    if (!message.toString()) return;

    const [type, topic, payload] = JSON.parse(message.toString());

    switch (type) {
      case RiotProtocol.MessageType.Event:
        console.log(topic, payload.eventType, payload.uri);
        this.connection.emit(topic, payload);
        break;
      case RiotProtocol.MessageType.Welcome:
      case RiotProtocol.MessageType.Prefix:
      case RiotProtocol.MessageType.Call:
      case RiotProtocol.MessageType.CallResult:
      case RiotProtocol.MessageType.CallError:
      case RiotProtocol.MessageType.Subscribe:
      case RiotProtocol.MessageType.Unsubscribe:
      case RiotProtocol.MessageType.Publish:
      default:
        console.log(`_onMessage - ${RiotProtocol.MessageType[type]}, ${payload}`);
        break;
    }
  }

  private connect(url: string) {
    if (this.connection) {
      this.connection.close();
      console.log("Try to reconnect websocket");
    }

    this.connection = new WebSocket(url, {
      rejectUnauthorized: false,
      timeout: 3000
    });

    this.connection.on("open", () => console.log("Websocket opened"));
    this.connection.on("close", code => {
      console.log("Websocket closed:", code);

      switch (code) {
        case 1006:
          setTimeout(this.connect.bind(this), 1000, this.url);
          break;
      }
    });

    this.connection.on("message", this.onMessage.bind(this));
  }

  public onOpen(listener: () => void) {
    return this.connection.on("open", listener);
  }

  // eslint-disable-next-line no-unused-vars
  public subscribe(topic: string, handler: (payload: any) => void) {
    this.connection.on(topic, handler);
    this.sendData(RiotProtocol.MessageType.Subscribe, topic);
  }

  public unsubscribe(topic: string) {
    this.connection.off(topic, () => {
      console.log(`Unsubscribe topic ${topic}`);
    });

    this.sendData(RiotProtocol.MessageType.Unsubscribe, topic);
  }

  public sendData(type: RiotProtocol.MessageType, message: string) {
    this.connection.send(JSON.stringify([type, message]), e => {
      if (e) console.log("Websocket send error:", RiotProtocol.MessageType[type], message);
      else console.log("Websocket send success:", RiotProtocol.MessageType[type], message);
    });
  }
}
