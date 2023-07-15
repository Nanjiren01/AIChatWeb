import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";

export interface NoticeStore {
  show: boolean;
  splash: boolean;
  title: string;
  content: string;
  fetchNoticeConfig: (token: string) => Promise<any>;
}

export interface NoticeConfig {
  show: boolean;
  splash: boolean;
  title: string;
  content: string;
}
export interface NoticeConfigData {
  noticeContent: NoticeConfig;
}

import { Response } from "../api/common";
export type NoticeConfigResponse = Response<NoticeConfigData>;

export const useNoticeConfigStore = create<NoticeStore>()(
  persist(
    (set, get) => ({
      show: false,
      splash: false,
      title: "",
      content: "",

      async fetchNoticeConfig(token: string) {
        const url = "/globalConfig/notice";
        const BASE_URL = process.env.BASE_URL;
        const mode = process.env.BUILD_MODE;
        let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
        return fetch(requestUrl, {
          method: "get",
          headers: {
            Authorization: "Bearer " + token,
          },
        })
          .then((res) => res.json())
          .then((res: NoticeConfigResponse) => {
            console.log("[GlobalConfig] got notice config from server", res);
            const notice = res.data.noticeContent;
            set(() => ({
              show: notice.show,
              splash: notice.splash,
              title: notice.title,
              content: notice.content,
            }));
            return res;
          })
          .catch(() => {
            console.error(
              "[GlobalConfig] failed to fetch notice config in store/notice.ts",
            );
          })
          .finally(() => {
            // fetchState = 2;
          });
      },
    }),
    {
      name: StoreKey.NoticeConfig,
      version: 1,
    },
  ),
);
