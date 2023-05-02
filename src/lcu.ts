import Axios, { AxiosInstance } from "axios";
import https from "https";

import * as LCU from "../types/lcu";

export class LCUApiController {
  private axios: AxiosInstance;
  private url: string;

  constructor(data: LCU.ConnectorData) {
    const { protocol, address, port, username, password } = data;

    this.url = `${protocol}://${address}:${port}`;
    this.axios = Axios.create({
      baseURL: this.url,
      auth: { username, password },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });
  }

  private async _request(method: LCU.HTTPMethod, endpoint: LCU.EndPoint, options?: any) {
    try {
      const { data, params } = options;
      const response = await this.axios.request({
        method,
        url: endpoint,
        data,
        params
      });

      return response.data;
    } catch (e: any) {
      console.error(e?.response?.data);
      return null;
    }
  }

  public async getAppName(): Promise<LCU.Api.GetAppName.Response> {
    const response = await this._request(LCU.HTTPMethod.Get, LCU.EndPoint.AppName);

    return response;
  }

  public async getSummoner(nickname: string): Promise<LCU.Api.GetSummoner.Response> {
    const options = { params: { name: nickname } };
    const response = await this._request(LCU.HTTPMethod.Get, LCU.EndPoint.Summoner, options);

    return response;
  }

  public async invite(summonerIds: number[]) {
    const options = { data: summonerIds.map(id => ({ toSummonerId: id })) };
    const response = await this._request(LCU.HTTPMethod.Post, LCU.EndPoint.Invitations, options);

    return response;
  }
}
