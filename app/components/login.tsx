import { useState, useEffect } from "react";

import styles from "./login.module.scss";

import CloseIcon from "../icons/close.svg";
import WechatIcon from "../icons/wechat.svg";
import ReturnIcon from "../icons/return.svg";

import { SingleInput, List, ListItem, PasswordInput } from "./ui-lib";

import { IconButton } from "./button";
import {
  useAuthStore,
  useAccessStore,
  useWebsiteConfigStore,
  useWechatConfigStore,
} from "../store";

import Locale from "../locales";
import { Path } from "../constant";
import { ErrorBoundary } from "./error";
import { useNavigate } from "react-router-dom";
import { showToast } from "../components/ui-lib";
import { Response } from "../api/common";
import "../../scripts/wxLogin.js";

export interface WechatConfigData {
  appId: string;
  state: string;
}
export type WechatConfigResponse = Response<WechatConfigData>;

export function Login() {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const accessStore = useAccessStore();
  const wechatStore = useWechatConfigStore();
  const { loginPageSubTitle, registerTypes } = useWebsiteConfigStore();
  const registerType = registerTypes[0];
  const REG_TYPE_USERNAME_AND_EMAIL_WITH_CAPTCHA_AND_CODE =
    "UsernameAndEmailWithCaptchaAndCode";

  const [loadingUsage, setLoadingUsage] = useState(false);
  const [showWechatCode, setShowWechatCode] = useState(false);
  const [showWechatLogin, setShowWechatLogin] = useState(false);

  useEffect(() => {
    wechatStore.fetchWechatConfig().then((res) => {
      const wechat = res.data;
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
    setShowWechatLogin(!!wechatStore.appId);
  }, [wechatStore.appId, setShowWechatLogin]);

  useEffect(() => {
    if (showWechatCode) {
      const url = "/wechatLoginCallback";
      const BASE_URL = process.env.BASE_URL;
      const mode = process.env.BUILD_MODE;
      const redirect_uri =
        mode === "export"
          ? BASE_URL + url
          : `${window.location.origin}/#${url}`;
      // @ts-ignore
      const obj = new WxLogin({
        self_redirect: true,
        id: "wx_login_container",
        appid: wechatStore.appId,
        scope: "snsapi_login",
        redirect_uri: encodeURIComponent(redirect_uri),
        state: wechatStore.state,
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
      .then((result) => {
        if (result && result.code == 0) {
          showToast(Locale.LoginPage.Toast.Success);
          navigate(Path.Chat);
        } else if (result && result.message) {
          showToast(result.message);
        }
      })
      .finally(() => {
        setLoadingUsage(false);
      });
  }
  function logout() {
    setTimeout(() => authStore.logout(), 500);
  }

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
          <div className="window-action-button">
            <IconButton
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
              title={Locale.LoginPage.Actions.Close}
            />
          </div>
        </div>
      </div>
      <div className={styles["login"]}>
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

          {showWechatLogin && !showWechatCode ? (
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
                  onClick={() => {
                    setShowWechatCode(true);
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
              <ListItem>
                <IconButton
                  text={Locale.LoginPage.GoToRegister}
                  type="second"
                  onClick={() => {
                    navigate(Path.Register);
                  }}
                />
              </ListItem>
            </>
          )}
        </List>
      </div>
    </ErrorBoundary>
  );
}
