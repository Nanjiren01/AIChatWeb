"use client";

require("../polyfill");

import { useState, useEffect, useCallback } from "react";

import styles from "./home.module.scss";

import ChatBotIcon from "../icons/ai-chat-bot.png";
import LoadingIcon from "../icons/three-dots.svg";
import NextImage from "next/image";

import { getCSSVar, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";

import { getLang } from "../locales";

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";
import { getClientConfig } from "../config/client";
import { useWebsiteConfigStore, BOT_HELLO } from "../store";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && (
        <NextImage
          src={ChatBotIcon.src}
          width={30}
          height={30}
          alt="bot"
          className="user-avatar"
        />
      )}
      <LoadingIcon />
    </div>
  );
}

const Login = dynamic(async () => (await import("./login")).Login, {
  loading: () => <Loading noLogo />,
});

const Register = dynamic(async () => (await import("./register")).Register, {
  loading: () => <Loading noLogo />,
});
const ForgetPassword = dynamic(
  async () => (await import("./forget-password")).ForgetPassword,
  {
    loading: () => <Loading noLogo />,
  },
);

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const Profile = dynamic(async () => (await import("./profile")).Profile, {
  loading: () => <Loading noLogo />,
});

const Pricing = dynamic(async () => (await import("./pricing")).Pricing, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

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

export function useSwitchTheme() {
  const config = useAppConfig();
  const useWebsiteConfig = useWebsiteConfigStore();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);

  useEffect(() => {
    document.title = useWebsiteConfig.title || "AI Chat";
  }, [useWebsiteConfig.title]);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=Noto+Sans+SC:wght@300;400;700;900&display=swap";
  document.head.appendChild(linkEl);
};

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isMobileScreen = useMobileScreen();

  useEffect(() => {
    loadAsyncGoogleFont();
  }, []);

  const { fetchWebsiteConfig } = useWebsiteConfigStore();
  useEffect(() => {
    fetchWebsiteConfig();
  }, [fetchWebsiteConfig]);

  const { botHello } = useWebsiteConfigStore();
  useEffect(() => {
    if (botHello) {
      // todo i18n
      BOT_HELLO.content = botHello;
    }
  }, [botHello]);

  const [noticeShow, setNoticeShow] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  useEffect(() => {
    const url = "/globalConfig/notice";
    const BASE_URL = process.env.BASE_URL;
    const mode = process.env.BUILD_MODE;
    let requestUrl = mode === "export" ? BASE_URL + url : url;
    fetch(requestUrl, {
      method: "get",
    })
      .then((res) => res.json())
      .then((res: NoticeConfigResponse) => {
        console.log("[GlobalConfig] got notice config from server", res);
        const notice = res.data.noticeContent;
        if (notice.show) {
          setNoticeTitle(notice.title);
          setNoticeContent(notice.content);
          if (notice.splash) {
            setNoticeShow(true);
          }
        }
      })
      .catch(() => {
        console.error("[GlobalConfig] failed to fetch config");
      })
      .finally(() => {
        // fetchState = 2;
      });
  }, []);

  return (
    <div
      className={
        styles.container +
        ` ${
          config.tightBorder && !isMobileScreen
            ? styles["tight-container"]
            : styles.container
        } ${getLang() === "ar" ? styles["rtl-screen"] : ""}`
      }
    >
      {isAuth ? (
        <>
          <AuthPage />
        </>
      ) : (
        <>
          <SideBar
            className={isHome ? styles["sidebar-show"] : ""}
            noticeShow={noticeShow}
            noticeTitle={noticeTitle}
            noticeContent={noticeContent}
            setNoticeShow={setNoticeShow}
          />

          <div className={styles["window-content"]} id={SlotID.AppBody}>
            <Routes>
              <Route path={Path.Home} element={<Chat />} />
              <Route path={Path.NewChat} element={<NewChat />} />
              <Route path={Path.Masks} element={<MaskPage />} />
              <Route path={Path.Chat} element={<Chat />} />
              <Route path={Path.Settings} element={<Settings />} />
              <Route path={Path.Login} element={<Login />} />
              <Route path={Path.Register} element={<Register />} />
              <Route path={Path.ForgetPassword} element={<ForgetPassword />} />
              <Route path={Path.Profile} element={<Profile />} />
              <Route path={Path.Pricing} element={<Pricing />} />
            </Routes>
          </div>
        </>
      )}
    </div>
  );
}

export function Home() {
  useSwitchTheme();

  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
  }, []);

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}
