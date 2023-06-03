import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Balance, ProfileResponse } from "../api/users/[...path]/route";
import { StoreKey } from "../constant";

export interface ProfileStore {
  id: number;
  tokens: number;
  chatCount: number;

  advanceChatCount: number;
  drawCount: number;
  balances: Balance[];

  fetchProfile: (token: string) => Promise<any>;
}

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      id: 0,
      tokens: 0,
      chatCount: 0,
      advanceChatCount: 0,
      drawCount: 0,
      balances: [],

      async fetchProfile(token: string) {
        // console.log('token ', token)
        return fetch("/api/users/profile", {
          method: "get",
          headers: {
            Authorization: "Bearer " + token,
          },
          body: null,
        })
          .then((res) => res.json())
          .then((res: ProfileResponse) => {
            console.log("[Balance] got balance from server", res);
            const data = res.data;
            set(() => ({
              id: data.id,
              tokens: data.tokens,
              chatCount: data.chatCount,
              advanceChatCount: data.advancedChatCount,
              drawCount: data.drawCount,
              balances: data.balances || [],
            }));
            return res;
          })
          .catch(() => {
            console.error("[Balance] failed to fetch config");
          })
          .finally(() => {
            // fetchState = 2;
          });
      },
    }),
    {
      name: StoreKey.Balance,
      version: 1,
    },
  ),
);
