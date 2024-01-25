// import type { ChatRequest, ChatResponse } from "./api/openai/typing";
// import type { LoginResponse } from "./api/login/route";
// import type { RegisterResponse } from "./api/register/route";
import type { Response } from "./api/common";
// const BASE_URL = process.env.BASE_URL
// console.log('BASE_URL', BASE_URL)

export interface CallResult {
  code: number;
  message: string;
  data?: any;
}
export interface LoginResult {
  code: number;
  message: string;
  data?: any;
}
export interface RegisterResult {
  code: number;
  message: string;
  data?: any;
}

export async function request(
  url: string,
  method: string,
  body: any,
  options?: {
    onError: (error: Error, statusCode?: number) => void;
  },
): Promise<CallResult> {
  try {
    const BASE_URL = process.env.BASE_URL;
    const mode = process.env.BUILD_MODE;
    // console.log('BASE_URL', BASE_URL)
    // console.log('mode', mode)
    let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
    const res = await fetch(requestUrl, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body === null ? null : JSON.stringify(body),
      // // @ts-ignore
      // duplex: "half",
    });
    if (res.status == 200) {
      let json: Response<any>;
      try {
        json = (await res.json()) as Response<any>;
      } catch (e) {
        console.error("json formatting failure", e);
        options?.onError({
          name: "json formatting failure",
          message: "json formatting failure",
        });
        return {
          code: -1,
          message: "json formatting failure",
        };
      }
      if (json.code != 0) {
        options?.onError({
          name: json.message,
          message: json.message,
        });
      }
      return json;
    }
    console.error("register result error(1)", res);
    options?.onError({
      name: "unknown error(1)",
      message: "unknown error(1)",
    });
    return {
      code: -1,
      message: "unknown error(2)",
    };
  } catch (err) {
    console.error("NetWork Error(3)", err);
    options?.onError(err as Error);
    return {
      code: -1,
      message: "NetWork Error(3)",
    };
  }
}

export function requestResetPassword(
  password: string,
  email: string,
  code: string,
  options?: {
    onError: (error: Error, statusCode?: number) => void;
  },
): Promise<RegisterResult> {
  return request("/resetPassword", "POST", { password, code, email }, options);
}

export async function requestLogin(
  username: string,
  password: string,
  options?: {
    onError: (error: Error, statusCode?: number) => void;
  },
): Promise<LoginResult> {
  return request("/login", "POST", { username, password }, options);
}

export async function requestRegister(
  name: string,
  username: string,
  password: string,
  captchaId: string,
  captchaInput: string,
  email: string,
  phone: string,
  code: string,
  inviteCode: string,
  options?: {
    onError: (error: Error, statusCode?: number) => void;
  },
): Promise<RegisterResult> {
  return request(
    "/register",
    "POST",
    {
      name,
      username,
      password,
      captchaId,
      captcha: captchaInput,
      email,
      phone,
      code,
      inviteCode,
    },
    options,
  );
}

export async function requestSendEmailCode(
  email: string,
  captchaId: string,
  captchaInput: string,
  resetPassword: boolean,
  options?: {
    onError: (error: Error, statusCode?: number) => void;
  },
): Promise<RegisterResult> {
  return request(
    "/sendRegisterEmailCode",
    "POST",
    {
      email,
      captchaId,
      captcha: captchaInput,
      type: resetPassword ? "resetPassword" : "register",
    },
    options,
  );
}
export async function requestSendPhoneCode(
  phone: string,
  captchaId: string,
  captchaInput: string,
  resetPassword: boolean,
  options?: {
    onError: (error: Error, statusCode?: number) => void;
  },
): Promise<RegisterResult> {
  return request(
    "/sendRegisterPhoneCode",
    "POST",
    {
      phone,
      captchaId,
      captcha: captchaInput,
      type: resetPassword ? "resetPassword" : "register",
    },
    options,
  );
}

export function requestWechatLogin(
  code: string,
  state: string,
  appType: string,
  options?: {
    onError: (error: Error, statusCode?: number) => void;
  },
): Promise<RegisterResult> {
  return request(
    `/wechat/loginCallback?code=${code}&state=${state}&appType=${appType}`,
    "GET",
    null,
    options,
  );
}
