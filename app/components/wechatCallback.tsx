import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NextImage from "next/image";
import WechatPayLogo from "../icons/wechat-pay-logo.png";

import styles from "./wechatCallback.module.scss";

import CloseIcon from "../icons/close.svg";
import { ErrorBoundary } from "./error";
import { useAuthStore, useWebsiteConfigStore } from "../store";

import { IconButton } from "./button";
import { Path } from "../constant";

import Locale from "../locales";
import { showToast } from "./ui-lib";
import { Loading } from "./home";

export function WechatCallback() {
  const navigate = useNavigate();
  const authStore = useAuthStore();

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const code = params.get("code") || "";
  const state = params.get("state") || "";

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    authStore
      .wechatLogin(code, state)
      .then((resp) => {
        console.log("resp", resp);
        if (resp.code === 0) {
          navigate(Path.Chat);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <ErrorBoundary>
      <div className="window-header">
        <div className="window-header-title">
          <div className="window-header-main-title">微信登录中</div>
        </div>
        <div className="window-actions">
          <div className="window-action-button">
            <IconButton
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
              title={Locale.PayPage.Actions.Close}
            />
          </div>
        </div>
      </div>
      <div className={styles["wechat-callback"]}>
        <div style={{ marginTop: "100px" }}>
          <Loading noLogo logoLoading />
        </div>
      </div>
    </ErrorBoundary>
  );
}
