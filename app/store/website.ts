import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SPEED_MAP_KEY, StoreKey } from "../constant";

export interface AiPlugin {
  id: number;
  uuid: string;
  name: string;
  logo?: string;
  alone: boolean;
  builtin: boolean;
  state: number;
}

export interface AiAssistant {
  id: number;
  uuid: string;
  modelId: number;
  apiKeyId: number;
  name: string;
  description: string;
  instructions: string;
  tools: string;
  thirdpartId: string;
  thirdpartInfo: string;
  state: number;
}

export type ModelContentType = "Text" | "Image";
export type ModelMessageStruct = "normal" | "complex";
export interface SimpleModel {
  name: string;
  contentType: ModelContentType;
  messageStruct: ModelMessageStruct;
  summarizeModel: string | null;
  processModes: SPEED_MAP_KEY[];
  processMode: SPEED_MAP_KEY | null;
  drawActions: DrawAction[];
}

export interface WebsiteConfigStore {
  title: string;
  mainTitle: string;
  subTitle: string;
  icp: string;
  globalJavaScript: string;
  loginPageSubTitle: string;
  registerPageSubTitle: string;
  pricingPageTitle: string;
  pricingPageSubTitle: string;
  payPageTitle: string;
  payPageSubTitle: string;
  chatPageSubTitle: string;
  sensitiveWordsTip: string;
  balanceNotEnough: string;
  registerTypes: string[];
  registerForInviteCodeOnly: boolean;
  redeemCodePageTitle: string;
  redeemCodePageSubTitle: string;
  redeemCodePageBanner: string;
  redeemCodePageTop: string;
  redeemCodePageIndex: string;
  redeemCodePageBottom: string;
  hideGithubIcon: boolean;
  botHello: string;
  hideChatLogWhenNotLogin: boolean;
  logoUrl?: string;
  availableModels: SimpleModel[];
  defaultSystemTemplate?: string;
  plugins?: AiPlugin[];
  assistants: AiAssistant[];
  payChannels: string[];
  fetchWebsiteConfig: () => Promise<any>;
}

export interface WebsiteConfig {
  title: string;
  mainTitle: string;
  subTitle: string;
  icp: string;
  globalJavaScript: string;
  loginPageSubTitle: string;
  registerPageSubTitle: string;
  registerTypes: string[];
  registerForInviteCodeOnly: boolean;
  redeemCodePageTitle: string;
  redeemCodePageSubTitle: string;
  redeemCodePageBanner: string;
  redeemCodePageTop: string;
  redeemCodePageIndex: string;
  redeemCodePageBottom: string;
  pricingPageTitle: string;
  pricingPageSubTitle: string;
  payPageTitle: string;
  payPageSubTitle: string;
  chatPageSubTitle: string;
  sensitiveWordsTip: string;
  balanceNotEnough: string;
  hideGithubIcon: boolean;
  botHello: string;
  hideChatLogWhenNotLogin: boolean;
  logoUuid?: string;
  defaultSystemTemplate: string;
  availableModels: SimpleModel[];
  plugins?: AiPlugin[];
  assistants: AiAssistant[];
  payChannels: string[];
}
export interface WebsiteConfigData {
  websiteContent: WebsiteConfig;
}

import { Response } from "../api/common";
import { DrawAction } from ".";
export type WebsiteConfigResponse = Response<WebsiteConfigData>;

export const useWebsiteConfigStore = create<WebsiteConfigStore>()(
  persist(
    (set, get) => ({
      title: "",
      mainTitle: "",
      subTitle: "",
      icp: "",
      globalJavaScript: "",
      loginPageSubTitle: "",
      registerPageSubTitle: "",
      registerTypes: [] as string[],
      registerForInviteCodeOnly: false as boolean,
      pricingPageTitle: "",
      pricingPageSubTitle: "",
      payPageTitle: "",
      payPageSubTitle: "",
      chatPageSubTitle: "",
      sensitiveWordsTip: "",
      balanceNotEnough: "",
      hideGithubIcon: false as boolean,
      botHello: "",
      hideChatLogWhenNotLogin: false as boolean,
      logoUrl: "",
      availableModels: [] as SimpleModel[],
      redeemCodePageTitle: "",
      redeemCodePageSubTitle: "",
      redeemCodePageBanner: "",
      redeemCodePageTop: "",
      redeemCodePageIndex: "",
      redeemCodePageBottom: "",
      defaultSystemTemplate: "",
      plugins: [] as AiPlugin[],
      assistants: [] as AiAssistant[],
      payChannels: [] as string[],

      async fetchWebsiteConfig() {
        const url = "/globalConfig/website";
        const BASE_URL = process.env.BASE_URL;
        const mode = process.env.BUILD_MODE;
        console.log("mode", mode);
        let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
        return fetch(requestUrl, {
          method: "get",
        })
          .then((res) => res.json())
          .then((res: WebsiteConfigResponse) => {
            console.log("[GlobalConfig] got website config from server", res);
            const website = res.data.websiteContent;
            // console.log('store: website.logoUuid', website.logoUuid)
            const getBaseUrl = () => {
              const BASE_URL = process?.env?.BASE_URL;
              const mode = process?.env?.BUILD_MODE;
              return mode === "export" ? BASE_URL || "" : "";
            };

            set(() => ({
              title: website.title,
              mainTitle: website.mainTitle,
              subTitle: website.subTitle,
              icp: website.icp || "",
              globalJavaScript: website.globalJavaScript || "",
              loginPageSubTitle: website.loginPageSubTitle,
              registerPageSubTitle: website.registerPageSubTitle,
              registerTypes:
                website.registerTypes && website.registerTypes.length
                  ? website.registerTypes
                  : (["OnlyUsername"] as string[]),
              registerForInviteCodeOnly: website.registerForInviteCodeOnly,
              pricingPageTitle: website.pricingPageTitle,
              pricingPageSubTitle: website.pricingPageSubTitle,
              payPageTitle: website.payPageTitle,
              payPageSubTitle: website.payPageSubTitle,
              chatPageSubTitle: website.chatPageSubTitle,
              sensitiveWordsTip: website.sensitiveWordsTip,
              balanceNotEnough: website.balanceNotEnough,
              hideGithubIcon: website.hideGithubIcon,
              botHello: website.botHello,
              hideChatLogWhenNotLogin: website.hideChatLogWhenNotLogin,
              redeemCodePageTitle: website.redeemCodePageTitle || "",
              redeemCodePageSubTitle: website.redeemCodePageSubTitle || "",
              redeemCodePageBanner: website.redeemCodePageBanner || "",
              redeemCodePageTop: website.redeemCodePageTop || "",
              redeemCodePageIndex: website.redeemCodePageIndex || "",
              redeemCodePageBottom: website.redeemCodePageBottom || "",
              logoUrl:
                website.logoUuid !== undefined &&
                website.logoUuid !== null &&
                website.logoUuid !== ""
                  ? getBaseUrl() + "/api/file/" + website.logoUuid
                  : "",
              availableModels: website.availableModels,
              defaultSystemTemplate: website.defaultSystemTemplate,
              plugins: website.plugins,
              assistants: website.assistants,
              payChannels: website.payChannels,
            }));
            return res;
          })
          .catch((e) => {
            console.error(
              "[GlobalConfig] failed to fetch website config in store/website.ts",
              e,
            );
          })
          .finally(() => {
            // fetchState = 2;
          });
      },
    }),
    {
      name: StoreKey.WebsiteConfig,
      version: 1,
    },
  ),
);
