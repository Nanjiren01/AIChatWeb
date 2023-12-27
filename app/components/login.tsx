import { useState, useEffect, useMemo } from "react";

import NextImage from "next/image";

import styles from "./login.module.scss";

import CloseIcon from "../icons/close.svg";
import WechatIcon from "../icons/wechat.svg";
import ReturnIcon from "../icons/return.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import ChatBotIcon from "../icons/chat-mj-bot.png";

import { SingleInput, List, ListItem, PasswordInput } from "./ui-lib";

import { IconButton } from "./button";
import {
  useAuthStore,
  useAccessStore,
  useWebsiteConfigStore,
  useWechatConfigStore,
  useAppConfig,
  useChatStore,
} from "../store";

import Locale from "../locales";
import { Path } from "../constant";
import { ErrorBoundary } from "./error";
import { useNavigate } from "react-router-dom";
import { showToast } from "../components/ui-lib";
import { Response } from "../api/common";
import "../../scripts/wxLogin.js";
import { useMobileScreen } from "../utils";
import { getClientConfig } from "../config/client";
import { isInWechat } from "../utils/wechat";

export function Login(props: { logoLoading: boolean; logoUrl?: string }) {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const accessStore = useAccessStore();
  const chatStore = useChatStore();
  const wechatStore = useWechatConfigStore();
  const {
    loginPageSubTitle,
    registerTypes,
    mainTitle,
    hideChatLogWhenNotLogin,
  } = useWebsiteConfigStore();
  const registerType = registerTypes[0];
  const REG_TYPE_USERNAME_AND_EMAIL_WITH_CAPTCHA_AND_CODE =
    "UsernameAndEmailWithCaptchaAndCode";
  const REG_TYPE_CLOSE = "Close";

  const [loadingUsage, setLoadingUsage] = useState(false);
  const [showWechatCode, setShowWechatCode] = useState(false);
  const [showWechatLogin, setShowWechatLogin] = useState(false);

  useEffect(() => {
    wechatStore.fetchWechatConfig().then((res) => {
      const wechat = res?.data;
      if (wechat?.appId) {
        setShowWechatLogin(true);
      }
    });
    const keydownEvent = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(Path.Home);
      }
    };
    document.addEventListener("keydown", keydownEvent);
    return () => {
      document.removeEventListener("keydown", keydownEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setShowWechatLogin(
      !!wechatStore.webstiteAppAppId || !!wechatStore.webAppAppId,
    );
  }, [
    wechatStore.webstiteAppAppId,
    wechatStore.webAppAppId,
    setShowWechatLogin,
  ]);

  useEffect(() => {
    if (showWechatCode) {
      const url = "/wechatCallback";
      const BASE_URL = process.env.BASE_URL;
      const mode = process.env.BUILD_MODE;
      const redirect_uri = `${window.location.origin}${url}`;
      // @ts-ignore
      const obj = new WxLogin({
        self_redirect: false,
        id: "wx_login_container",
        appid: wechatStore.webstiteAppAppId,
        scope: "snsapi_login",
        redirect_uri: encodeURIComponent(redirect_uri),
        state: wechatStore.webstiteAppState,
      });
    }
  }, [showWechatCode, wechatStore]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  function login() {
    if (username === "") {
      showToast(Locale.LoginPage.Toast.EmptyUserName);
      return;
    }
    if (password === "") {
      showToast(Locale.LoginPage.Toast.EmptyPassword);
      return;
    }
    setLoadingUsage(true);
    showToast(Locale.LoginPage.Toast.Logining);
    authStore
      .login(username, password)
      .then(async (result) => {
        if (result && result.code == 0) {
          showToast(Locale.LoginPage.Toast.Success);
          // console.log('result', authStore.token, result)
          const syncResult = await chatStore.syncSessions(result.data.token);
          if (syncResult) {
            navigate(Path.Chat);
          } else {
            authStore.logout();
          }
        } else if (result && result.code == 11151) {
          showToast(result.cnMessage || result.message);
        } else if (result && result.message) {
          showToast(result.cnMessage || result.message);
        }
      })
      .finally(() => {
        setLoadingUsage(false);
      });
  }
  function logout() {
    setTimeout(() => authStore.logout(), 500);
  }

  function clickWechatLoginButton() {
    if (
      (isInWechat() && !!wechatStore.webAppAppId) ||
      !wechatStore.webstiteAppAppId
    ) {
      // 微信公众号应用，不支持扫码登录，只能通过
      const url = "/wechatCallback?appType=webApp";
      const BASE_URL = process.env.BASE_URL;
      const mode = process.env.BUILD_MODE;
      const redirect_uri = encodeURIComponent(
        `${window.location.origin}${url}`,
      );

      location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${wechatStore.webAppAppId}&redirect_uri=${redirect_uri}&response_type=code&scope=snsapi_base&state=${wechatStore.webAppState}#wechat_redirect`;
      return;
    }
    setShowWechatCode(true);
  }

  const config = useAppConfig();
  const isMobileScreen = useMobileScreen();
  const clientConfig = useMemo(() => getClientConfig(), []);
  const showMaxIcon = !isMobileScreen && !clientConfig?.isApp;

  return (
    <ErrorBoundary>
      <div className="window-header" data-tauri-drag-region>
        <div className="window-header-title">
          <div className="window-header-main-title">
            {Locale.LoginPage.Title}
          </div>
          <div className="window-header-sub-title">{loginPageSubTitle}</div>
        </div>
        <div className="window-actions">
          {showMaxIcon && (
            <div className="window-action-button">
              <IconButton
                icon={config.tightBorder ? <MinIcon /> : <MaxIcon />}
                bordered
                onClick={() => {
                  config.update(
                    (config) => (config.tightBorder = !config.tightBorder),
                  );
                }}
              />
            </div>
          )}
          {/* <div className="window-action-button">
            <IconButton
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
              title={Locale.LoginPage.Actions.Close}
            />
          </div> */}
        </div>
      </div>
      <div className={styles["login"]}>
        {hideChatLogWhenNotLogin && (
          <div style={{ textAlign: "center" }}>
            <div className={styles["sidebar-logo"] + " no-dark"}>
              {props.logoLoading ? (
                <></>
              ) : !props.logoUrl ? (
                <NextImage
                  src={ChatBotIcon.src}
                  width={64}
                  height={64}
                  alt="bot"
                />
              ) : (
                <img src={props.logoUrl} width={64} height={64} />
              )}
            </div>
            <div
              style={{ lineHeight: "100px" }}
              dangerouslySetInnerHTML={{
                __html: mainTitle || "ChatMJ",
              }}
              data-tauri-drag-region
            ></div>
          </div>
        )}
        <List>
          {!showWechatCode ? (
            <ListItem
              title={Locale.LoginPage.Username.Title}
              subTitle={Locale.LoginPage.Username.SubTitle}
            >
              {authStore.token ? (
                <span>{authStore.username}</span>
              ) : (
                <SingleInput
                  value={username}
                  placeholder={Locale.LoginPage.Username.Placeholder}
                  onChange={(e) => {
                    setUsername(e.currentTarget.value);
                    //console.log(e)
                    //accessStore.updateCode(e.currentTarget.value);
                  }}
                />
              )}
            </ListItem>
          ) : undefined}

          {authStore.token || showWechatCode ? (
            <></>
          ) : (
            <ListItem
              title={Locale.LoginPage.Password.Title}
              subTitle={Locale.LoginPage.Password.SubTitle}
            >
              <PasswordInput
                value={password}
                type="text"
                placeholder={Locale.LoginPage.Password.Placeholder}
                onChange={(e) => {
                  // console.log(e)
                  setPassword(e.currentTarget.value);
                  // accessStore.updateCode(e.currentTarget.value);
                }}
              />
            </ListItem>
          )}

          {!showWechatCode ? (
            <ListItem>
              <IconButton
                type="primary"
                text={
                  authStore.token
                    ? Locale.LoginPage.Actions.Logout
                    : Locale.LoginPage.Actions.Login
                }
                block={true}
                onClick={() => {
                  if (authStore.token) {
                    logout();
                  } else {
                    // console.log(username, password);
                    login();
                  }
                }}
              />
            </ListItem>
          ) : undefined}

          {!authStore.token && showWechatLogin && !showWechatCode ? (
            <div
              style={{
                borderBottom: "var(--border-in-light)",
                minHeight: "40px",
                lineHeight: "40px",
                padding: "10px 20px",
                textAlign: "center",
              }}
            >
              <div style={{ margin: "0 auto", display: "inline-block" }}>
                <IconButton
                  icon={<WechatIcon />}
                  type="second"
                  text="微信登录"
                  onClick={() => {
                    clickWechatLoginButton();
                  }}
                />
              </div>
            </div>
          ) : (
            <></>
          )}

          {showWechatCode ? (
            <div
              style={{ display: "flex", justifyContent: "center" }}
              id="wx_login_container"
            ></div>
          ) : undefined}

          {showWechatLogin && showWechatCode ? (
            <div
              style={{
                borderBottom: "var(--border-in-light)",
                minHeight: "40px",
                lineHeight: "40px",
                padding: "10px 20px",
                textAlign: "center",
              }}
            >
              <div style={{ margin: "0 auto", display: "inline-block" }}>
                <IconButton
                  icon={<ReturnIcon />}
                  type="second"
                  text="返回"
                  onClick={() => {
                    setShowWechatCode(false);
                  }}
                />
              </div>
            </div>
          ) : (
            <></>
          )}

          {authStore.token || showWechatCode ? (
            <></>
          ) : (
            <>
              {registerType ==
                REG_TYPE_USERNAME_AND_EMAIL_WITH_CAPTCHA_AND_CODE && (
                <ListItem>
                  <IconButton
                    text={Locale.LoginPage.ForgetPassword}
                    type="second"
                    onClick={() => {
                      navigate(Path.ForgetPassword);
                    }}
                  />
                </ListItem>
              )}
              {registerType !== REG_TYPE_CLOSE && (
                <ListItem>
                  <IconButton
                    text={Locale.LoginPage.GoToRegister}
                    type="second"
                    onClick={() => {
                      navigate(Path.Register);
                    }}
                  />
                </ListItem>
              )}
            </>
          )}
        </List>
      </div>
    </ErrorBoundary>
  );
}
