import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";
import { requestLogin } from "../requests";

export interface AuthStore {
  token: string;
  username: string;
  login: (username: string, password: string) => Promise<any>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      username: "",
      token: "",

      async login(username, password) {
        set(() => ({
          username,
        }));

        let result = await requestLogin(username, password, {
          onError: (err) => {
            console.error(err);
          },
        });
        set(() => ({
          username,
          token: result?.token || "",
        }));
        console.log("result", result);

        return result;
      },
    }),
    {
      name: StoreKey.Auth,
      version: 1,
    },
  ),
);
