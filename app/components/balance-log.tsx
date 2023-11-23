import { useState, useEffect, useCallback } from "react";

import styles from "./balance-log.module.scss";

import CloseIcon from "../icons/close.svg";
import { List, ListItem, DangerousListItem } from "./ui-lib";

import { IconButton } from "./button";
import { useAuthStore, useProfileStore } from "../store";

import { copyToClipboard } from "../utils";

import Locale from "../locales";
import { Path } from "../constant";
import { ErrorBoundary } from "./error";
import { useNavigate } from "react-router-dom";
// import { showToast, Popover } from "./ui-lib";
// import { Avatar, AvatarPicker } from "./emoji";

import { useRouter } from "next/navigation";
// import { Balance } from "../api/users/[...path]/route";

interface BalanceLog {
  id: number;
  type: string;
  typeId: number;
  source: string;
  sourceId: number;
  inputTokens: number;
  outputTokens: number;
  delta: number;
  state: number;
  balanceId: number;
  createTime: string;
}

interface BalanceLogResponse {
  code: number;
  message?: string;
  data: BalanceLog[];
}

// interface PageInfo<T> {
//   list: T[];
// }

export function BalanceLog() {
  const router = useRouter();
  const navigate = useNavigate();
  const authStore = useAuthStore();
  // const accessStore = useAccessStore();
  const profileStore = useProfileStore();

  // const config = useAppConfig();
  // const updateConfig = config.update;

  const [loading, setLoading] = useState(false);

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
    if (profileStore.id === 0) {
      console.log("profileStore.id", profileStore.id);
      authStore.logout();
      navigate(Path.Login);
    }
  }, [profileStore, navigate, authStore]);

  const [balanceLogList, setBalanceLogList] = useState<BalanceLog[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const reloadList = useCallback((token: string) => {
    setLoading(true);
    const url = "/my/balances/records";
    const BASE_URL = process.env.BASE_URL;
    const mode = process.env.BUILD_MODE;
    let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
    fetch(requestUrl, {
      method: "post",
      headers: {
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ page: 1, size: 50 }),
    })
      .then((res) => res.json())
      .then((res) => {
        const balancesResp = res as unknown as BalanceLogResponse;
        if (balancesResp.code !== 0) {
          setErrorMessage(balancesResp.message || "");
          return;
        }
        const balances = balancesResp.data || [];
        setBalanceLogList(balances);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    reloadList(authStore.token);
  }, [authStore.token, reloadList]);

  return (
    <ErrorBoundary>
      <div className="window-header">
        <div className="window-header-title">
          <div className="window-header-main-title">
            {Locale.BalanceLogPage.Title}
          </div>
          <div className="window-header-sub-title">
            {/* {Locale.Profile.SubTitle} */}
          </div>
        </div>
        <div className="window-actions">
          <div className="window-action-button">
            <IconButton
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
              title={Locale.BalanceLogPage.Actions.Close}
            />
          </div>
        </div>
      </div>

      <div className={styles["balance-log"]}>
        <div
          style={{
            marginBottom: "10px",
            display: "flex",
            justifyContent: "end",
          }}
        >
          <IconButton
            text={
              loading
                ? Locale.InvitationPage.Actions.Refreshing
                : Locale.InvitationPage.Actions.Refresh
            }
            type="second"
            disabled={loading}
            style={{ marginRight: "10px" }}
            onClick={() => {
              reloadList(authStore.token);
            }}
          />
          <IconButton
            text={Locale.BalanceLogPage.Actions.Profile}
            type="second"
            style={{ marginRight: "10px" }}
            disabled={loading}
            onClick={() => {
              navigate(Path.Profile);
            }}
          />

          <IconButton
            text={Locale.BalanceLogPage.Actions.Balance}
            type="second"
            disabled={loading}
            onClick={() => {
              navigate(Path.Balance);
            }}
          />
        </div>

        {balanceLogList.length === 0 ? (
          <List>
            <div
              className={errorMessage ? styles["danger-text"] : ""}
              style={{
                height: "100px",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {errorMessage
                ? errorMessage
                : loading
                  ? Locale.BalanceLogPage.Loading
                  : Locale.BalanceLogPage.NoBalance}
            </div>
          </List>
        ) : (
          <></>
        )}
        {balanceLogList.length ? (
          <div style={{ maxWidth: "400px", margin: "0 auto 20px" }}>
            <List>
              {balanceLogList.map((invitation) => {
                const typeName =
                  {
                    1: "普通聊天",
                    2: "高级聊天",
                    3: "tokens",
                    4: "绘图",
                  }[invitation.typeId] || "未知";
                const sourceName =
                  {
                    1: "聊天消耗",
                    2: "绘图消耗",
                    3: "后台管理员操作",
                    4: "注册赠送",
                  }[invitation.sourceId] || "未知";
                const title = `${typeName}: ${invitation.delta}`;
                const subTitle = `
                <div>变动原因：${sourceName}<div>
                <div>套餐ID：${invitation.balanceId}<div>`;
                return (
                  <DangerousListItem
                    key={invitation.id}
                    title={title}
                    subTitle={subTitle}
                  >
                    <span
                      style={{
                        flexGrow: 0,
                        fontSize: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {invitation.createTime}
                    </span>
                  </DangerousListItem>
                );
              })}
            </List>
          </div>
        ) : (
          <></>
        )}

        <List>
          <ListItem>
            <IconButton
              text={Locale.BalanceLogPage.Actions.Profile}
              block={true}
              type="primary"
              onClick={() => {
                navigate(Path.Profile);
              }}
            />
          </ListItem>
        </List>
      </div>
    </ErrorBoundary>
  );
}
