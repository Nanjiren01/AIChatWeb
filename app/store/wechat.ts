import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";

export interface WechatConfigStore {
  webstiteAppAppId: string;
  webstiteAppState: string;
  webAppAppId: string;
  webAppState: string;
  fetchWechatConfig: () => Promise<any>;
}

export interface WechatConfig {
  webstiteAppAppId: string;
  webstiteAppState: string;
  webAppAppId: string;
  webAppState: string;
}
export interface WechatConfigData {
  // wechatContent: WechatConfig;
  appType: string;
  appId: string;
  state: string;
}

import { Response } from "../api/common";
export type WechatConfigResponse = Response<WechatConfigData>;

export const useWechatConfigStore = create<WechatConfigStore>()(
  persist(
    (set, get) => ({
      webstiteAppAppId: "",
      webstiteAppState: "",
      webAppAppId: "",
      webAppState: "",

      async fetchWechatConfig() {
        const url = "/wechat/loginRequest";
        const BASE_URL = process.env.BASE_URL;
        const mode = process.env.BUILD_MODE;
        let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
        const webstiteAppResp = await fetch(requestUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }).then((res) => res.json());
        console.log(
          "[WechatConfig] got webstiteApp config from server",
          webstiteAppResp?.data,
        );

        const webAppResp = await fetch(requestUrl + "?appType=webApp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }).then((res) => res.json());

        set(() => ({
          webstiteAppAppId: webstiteAppResp?.data?.appId,
          webstiteAppState: webstiteAppResp?.data?.state,
          webAppAppId: webAppResp?.data?.appId,
          webAppState: webAppResp?.data?.state,
        }));
        console.log(
          "[webAppResp] got webstiteApp config from server",
          webAppResp?.data,
        );
      },
    }),
    {
      name: StoreKey.WechatConfig,
      version: 1,
    },
  ),
);
