import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";

export interface WechatConfigStore {
  appId: string;
  state: string;
  fetchWechatConfig: () => Promise<any>;
}

export interface WechatConfig {
  appId: string;
  state: string;
}
export interface WechatConfigData {
  // wechatContent: WechatConfig;
  appId: string;
  state: string;
}

import { Response } from "../api/common";
export type WechatConfigResponse = Response<WechatConfigData>;

export const useWechatConfigStore = create<WechatConfigStore>()(
  persist(
    (set, get) => ({
      appId: "",
      state: "",

      async fetchWechatConfig() {
        const url = "/wechat/loginRequest";
        const BASE_URL = process.env.BASE_URL;
        const mode = process.env.BUILD_MODE;
        let requestUrl = mode === "export" ? BASE_URL + url : "/api" + url;
        return fetch(requestUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((res) => res.json())
          .then((res: WechatConfigResponse) => {
            console.log("[WechatConfig] got wechat config from server", res);
            const wechat = res.data;
            set(() => ({
              appId: wechat.appId,
              state: wechat.state,
            }));
            return res;
          })
          .catch(() => {
            console.error("[WechatConfig] failed to fetch config");
          });
      },
    }),
    {
      name: StoreKey.WechatConfig,
      version: 1,
    },
  ),
);
