import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";
import { requestLogin } from "../requests";
import { requestRegister, requestSendEmailCode } from "../requests";

export interface AuthStore {
  token: string;
  username: string;
  login: (username: string, password: string) => Promise<any>;
  logout: () => void;
  sendEmailCode: (email: string) => Promise<any>;
  register: (
    name: string,
    username: string,
    password: string,
    captchaId: string,
    captchaInput: string,
    email: string,
    code: string,
  ) => Promise<any>;
  removeToken: () => void;
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
      removeToken() {
        set(() => ({ token: "" }));
      },
      async sendEmailCode(email) {
        let result = await requestSendEmailCode(email, {
          onError: (err) => {
            console.error(err);
          },
        });
        return result;
      },
      async register(
        name,
        username,
        password,
        captchaId,
        captchaInput,
        email,
        code,
      ) {
        let result = await requestRegister(
          name,
          username,
          password,
          captchaId,
          captchaInput,
          email,
          code,
          {
            onError: (err) => {
              console.error(err);
            },
          },
        );
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
