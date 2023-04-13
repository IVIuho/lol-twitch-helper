import { WebSocket } from "ws";

import * as LCU from "../types/lcu";
import * as RiotProtocol from "../types/riot";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export class SuperSocket extends WebSocket {
  constructor(data: LCU.ConnectorData) {
    const { address, port, username, password } = data;
    const url = `wss://${username}:${password}@${address}:${port}`;

    super(url, {
      rejectUnauthorized: false,
      timeout: 5000
    });

    this.on("message", this._onMessage.bind(this));
  }

  private _onMessage(message: Buffer) {
    if (!message.toString()) return;

    const [type, topic, payload] = JSON.parse(message.toString());

    switch (type) {
      case RiotProtocol.MessageType.Event:
        console.log(topic, payload.eventType, payload.uri);
        this.emit(topic, payload);
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

  public subscribe(topic: string, handler: (payload: any) => void) {
    this.on(topic, handler);
    this.sendData(RiotProtocol.MessageType.Subscribe, topic);
  }

  public unsubscribe(topic: string) {
    this.off(topic, () => {
      console.log(`Unsubscribe topic ${topic}`);
    });

    this.sendData(RiotProtocol.MessageType.Unsubscribe, topic);
  }

  public sendData(type: RiotProtocol.MessageType, message: string) {
    this.send(JSON.stringify([type, message]), e => {
      if (e) console.log("websocket send error:", RiotProtocol.MessageType[type], message);
      else console.log("websocket send success:", RiotProtocol.MessageType[type], message);
    });
  }
}
