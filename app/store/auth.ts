import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";
import { requestLogin } from "../requests";
import { requestRegister } from "../requests";

export interface AuthStore {
  token: string;
  username: string;
  login: (username: string, password: string) => Promise<any>;
  logout: () => void;
  register: (name: string, username: string, password: string) => Promise<any>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      name: "",
      username: "",
      token: "",

      async login(username, password) {
        // set(() => ({
        //   username,
        // }));

        let result = await requestLogin(username, password, {
          onError: (err) => {
            console.error(err);
          },
        });
        console.log("result", result);
        if (result && result.code == 0) {
          set(() => ({
            username,
            token: result.data?.token || "",
          }));
        }

        return result;
      },
      logout() {
        set(() => ({
          username: "",
          token: "",
        }));
      },
      async register(name, username, password) {
        let result = await requestRegister(name, username, password, {
          onError: (err) => {
            console.error(err);
          },
        });
        console.log("result", result);
        if (result && result.code == 0) {
          set(() => ({
            name,
            username,
            token: result.data?.token || "",
          }));
        }

        return result;
      },
    }),
    {
      name: StoreKey.Auth,
      version: 1,
    },
  ),
);
