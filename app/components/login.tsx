import { useState, useEffect } from "react";

import styles from "./login.module.scss";

import CloseIcon from "../icons/close.svg";
import WechatIcon from "../icons/wechat.svg";
import ReturnIcon from "../icons/return.svg";

import { SingleInput, List, ListItem, PasswordInput } from "./ui-lib";

import { IconButton } from "./button";
import { useAuthStore, useAccessStore, useWebsiteConfigStore } from "../store";

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
  const { loginPageSubTitle } = useWebsiteConfigStore();

  const [loadingUsage, setLoadingUsage] = useState(false);
  const [showWechatLogin, setShowWechatLogin] = useState(false);

  useEffect(() => {
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
    if (showWechatLogin) {
      fetch("/api/wechat/loginRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((res: WechatConfigResponse) => {
          const obj = new WxLogin({
            self_redirect: true,
            id: "wx_login_container",
            appid: res.data.appId,
            scope: "snsapi_login",
            redirect_uri: `${window.location.origin}/api/wechat/loginCallback`,
            state: res.data.state,
          });
        })
        .catch(() => {
          console.error("[WechatConfig] failed to fetch config");
        });
    }
  }, [showWechatLogin]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  function login() {
    // if (username.length <)
    setLoadingUsage(true);
    showToast(Locale.LoginPage.Toast.Logining);
    authStore
      .login(username, password)
      .then((result) => {
        console.log("result", result);
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
      <div className="window-header">
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
          {!showWechatLogin ? (
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

          {authStore.token || showWechatLogin ? (
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

          {!showWechatLogin ? (
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

          {showWechatLogin ? (
            <div
              style={{ display: "flex", justifyContent: "center" }}
              id="wx_login_container"
            ></div>
          ) : undefined}

          {authStore.token ? (
            <></>
          ) : (
            <ListItem>
              <div style={{ marginLeft: "80px" }}>
                <IconButton
                  icon={<WechatIcon />}
                  onClick={() => {
                    setShowWechatLogin(true);
                  }}
                />
              </div>
              {!showWechatLogin ? (
                <IconButton
                  text={Locale.LoginPage.GoToRegister}
                  onClick={() => {
                    navigate(Path.Register);
                  }}
                />
              ) : (
                <IconButton
                  icon={<ReturnIcon />}
                  onClick={() => {
                    setShowWechatLogin(false);
                  }}
                />
              )}
            </ListItem>
          )}
        </List>
      </div>
    </ErrorBoundary>
  );
}
