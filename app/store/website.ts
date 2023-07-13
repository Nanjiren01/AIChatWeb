import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";

export interface WebsiteConfigStore {
  title: string;
  mainTitle: string;
  subTitle: string;
  icp: string;
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
  hideGithubIcon: boolean;
  botHello: string;
  logoUrl?: string;
  availableModelNames: string[];
  fetchWebsiteConfig: () => Promise<any>;
}

export interface WebsiteConfig {
  title: string;
  mainTitle: string;
  subTitle: string;
  icp: string;
  loginPageSubTitle: string;
  registerPageSubTitle: string;
  registerTypes: string[];
  pricingPageTitle: string;
  pricingPageSubTitle: string;
  payPageTitle: string;
  payPageSubTitle: string;
  chatPageSubTitle: string;
  sensitiveWordsTip: string;
  balanceNotEnough: string;
  hideGithubIcon: boolean;
  botHello: string;
  logoUuid?: string;
  availableModelNames: string[];
}
export interface WebsiteConfigData {
  websiteContent: WebsiteConfig;
}

import { Response } from "../api/common";
export type WebsiteConfigResponse = Response<WebsiteConfigData>;

export const useWebsiteConfigStore = create<WebsiteConfigStore>()(
  persist(
    (set, get) => ({
      title: "",
      mainTitle: "",
      subTitle: "",
      icp: "",
      loginPageSubTitle: "",
      registerPageSubTitle: "",
      registerTypes: [],
      pricingPageTitle: "",
      pricingPageSubTitle: "",
      payPageTitle: "",
      payPageSubTitle: "",
      chatPageSubTitle: "",
      sensitiveWordsTip: "",
      balanceNotEnough: "",
      hideGithubIcon: false,
      botHello: "",
      logoUrl: "",
      availableModelNames: [],

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
            set(() => ({
              title: website.title,
              mainTitle: website.mainTitle,
              subTitle: website.subTitle,
              icp: website.icp || "",
              loginPageSubTitle: website.loginPageSubTitle,
              registerPageSubTitle: website.registerPageSubTitle,
              registerTypes:
                website.registerTypes && website.registerTypes.length
                  ? website.registerTypes
                  : ["OnlyUsername"],
              pricingPageTitle: website.pricingPageTitle,
              pricingPageSubTitle: website.pricingPageSubTitle,
              payPageTitle: website.payPageTitle,
              payPageSubTitle: website.payPageSubTitle,
              chatPageSubTitle: website.chatPageSubTitle,
              sensitiveWordsTip: website.sensitiveWordsTip,
              balanceNotEnough: website.balanceNotEnough,
              hideGithubIcon: website.hideGithubIcon,
              botHello: website.botHello,
              logoUrl:
                website.logoUuid !== undefined &&
                website.logoUuid !== null &&
                website.logoUuid !== ""
                  ? "/api/file/" + website.logoUuid
                  : "",
              availableModelNames: website.availableModelNames,
            }));
            return res;
          })
          .catch(() => {
            console.error("[GlobalConfig] failed to fetch config");
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
