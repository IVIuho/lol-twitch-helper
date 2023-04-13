import * as Twitch from "../types/twitch";

export class UserQueue {
  private queue: Twitch.WaitingUser[];

  constructor() {
    this.queue = [];
    // this.queue = [{ gameNick: "22222222del", nickname: "22222222del", uid: "123" }];
  }

  private _getUser(std: keyof Twitch.WaitingUser, target: string) {
    return this.queue.find(user => user[std] === target);
  }

  private _getIndex(std: keyof Twitch.WaitingUser, target: string) {
    return this.queue.findIndex(user => user[std] === target);
  }

  public info() {
    return this.queue;
  }

  public isExists(target: Twitch.User) {
    return this.queue.some(user => user.uid === target.uid);
  }

  public getUserById(target: string) {
    return this._getUser("uid", target) || null;
  }

  public getUserByNickname(target: string) {
    return this._getUser("nickname", target) || null;
  }

  public getUserByGameNick(target: string) {
    return this._getUser("gameNick", target) || null;
  }

  public getIndexById(target: string) {
    return this._getIndex("uid", target);
  }

  public getIndexByNickname(target: string) {
    return this._getIndex("nickname", target);
  }

  public getIndexByGameNick(target: string) {
    return this._getIndex("gameNick", target);
  }

  public push(target: Twitch.User, gameNick: string) {
    return this.queue.push({ ...target, gameNick });
  }

  public update(target: Twitch.User, newNick: string) {
    const prev = this.queue.find(user => user.uid === target.uid) as Twitch.WaitingUser;
    const index = this.queue.findIndex(user => user.uid === target.uid);

    const next: Twitch.WaitingUser = { ...prev, gameNick: newNick };

    this.queue[index] = next;
    return { prev, next, index };
  }

  public remove(target: Twitch.User) {
    const removed = this.queue.find(user => user.uid === target.uid);
    this.queue = this.queue.filter(user => user.uid !== target.uid);

    return removed;
  }

  public removeByGameNick(target: string) {
    this.queue = this.queue.filter(user => {
      user.gameNick.trim().toLowerCase() !== target.trim().toLowerCase();
    });
  }

  public changeOrder(from: number, to: number) {
    const [target] = this.queue.splice(from, 1);
    return this.queue.splice(to, 0, target);
  }
}
