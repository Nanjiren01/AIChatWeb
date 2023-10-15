import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";

export interface NoticeStore {
  show: boolean;
  splash: boolean;
  title: string;
  content: string;
  notShowToday: Date | null;
  fetchNoticeConfig: () => Promise<any>;
  setNotShowToday: (notShowToday: boolean) => void;
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
      notShowToday: null,

      async fetchNoticeConfig() {
        const url = "/globalConfig/notice";
        const BASE_URL = process.env.BASE_URL;
        const mode = process.env.BUILD_MODE;
        let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
        return fetch(requestUrl, {
          method: "get",
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
      setNotShowToday(notShowToday: boolean) {
        set(() => ({
          notShowToday: notShowToday ? new Date() : null,
        }));
      },
    }),
    {
      name: StoreKey.NoticeConfig,
      version: 2,
      migrate(persistedState, version) {
        const state = persistedState as any;
        const newState = JSON.parse(JSON.stringify(state)) as NoticeStore;

        if (version < 2) {
          newState.notShowToday = null;
        }

        return newState;
      },
    },
  ),
);
