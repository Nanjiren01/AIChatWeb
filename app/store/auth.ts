import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";
import {
  requestLogin,
  requestSendPhoneCode,
  requestWechatLogin,
} from "../requests";
import {
  requestRegister,
  requestSendEmailCode,
  requestResetPassword,
} from "../requests";

export interface AuthStore {
  token: string;
  username: string;
  email: string;
  inviteCode: string;
  login: (username: string, password: string) => Promise<any>;
  logout: () => void;
  sendEmailCode: (email: string) => Promise<any>;
  sendPhoneCode: (phone: string) => Promise<any>;
  sendEmailCodeForResetPassword: (email: string) => Promise<any>;
  register: (
    name: string,
    username: string,
    password: string,
    captchaId: string,
    captchaInput: string,
    email: string,
    phone: string,
    code: string,
    inviteCode: string,
  ) => Promise<any>;
  resetPassword: (
    password: string,
    email: string,
    code: string,
  ) => Promise<any>;
  wechatLogin: (code: string, state: string) => Promise<any>;
  removeToken: () => void;
  updateInviteCode: (code: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      name: "",
      username: "",
      email: "",
      token: "",
      inviteCode: "",

      async login(username, password) {
        // set(() => ({
        //   username,
        // }));

        let result: any = await requestLogin(username, password, {
          onError: (err) => {
            console.error(err);
          },
        });
        console.log("result", result);
        if (result && result.code == 0) {
          set(() => ({
            username,
            email: result.data?.userEntity?.email || "",
            token: result.data?.token || "",
            inviteCode: result.data?.userEntity?.inviteCode || "",
          }));
        }

        return result;
      },
      logout() {
        set(() => ({
          username: "",
          email: "",
          token: "",
          inviteCode: "",
        }));
      },
      removeToken() {
        set(() => ({ token: "" }));
      },
      updateInviteCode(code: string) {
        set(() => ({
          inviteCode: code,
        }));
      },
      async sendEmailCodeForResetPassword(email) {
        let result = await requestSendEmailCode(email, true, {
          onError: (err) => {
            console.error(err);
          },
        });
        return result;
      },
      async sendEmailCode(email) {
        let result = await requestSendEmailCode(email, false, {
          onError: (err) => {
            console.error(err);
          },
        });
        return result;
      },
      async sendPhoneCode(phone: string) {
        let result = await requestSendPhoneCode(phone, false, {
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
        phone,
        code,
        inviteCode,
      ) {
        let result = await requestRegister(
          name,
          username,
          password,
          captchaId,
          captchaInput,
          email,
          phone,
          code,
          inviteCode,
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
            email: result.data?.userEntity?.email || "",
            token: result.data?.token || "",
            inviteCode: result.data?.userEntity?.inviteCode || "",
          }));
        }

        return result;
      },
      async resetPassword(password, email, code) {
        let result = await requestResetPassword(password, email, code, {
          onError: (err) => {
            console.error(err);
          },
        });
        //console.log("result", result);
        if (result && result.code == 0 && result.data) {
          const data = result.data;
          const user = data.userEntity;
          set(() => ({
            name: user.name || "",
            username: user.username || "",
            email: user.email || "",
            token: data.token || "",
            inviteCode: user.inviteCode || "",
          }));
        }
        return result;
      },
      async wechatLogin(code, state) {
        let result = await requestWechatLogin(code, state, {
          onError: (err) => {
            console.error(err);
          },
        });
        if (result && result.code == 0 && result.data) {
          const data = result.data;
          const user = data.userEntity;
          set(() => ({
            name: user.name || "",
            username: user.username || "",
            email: user.email || "",
            token: data.token || "",
            inviteCode: user.inviteCode || "",
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
