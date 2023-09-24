import { useState, useEffect, useCallback } from "react";

import styles from "./invitation.module.scss";

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

interface Invitation {
  id: number;
  username?: string;
  email?: string;
  phone?: string;
  createTime: string;
}

interface InvitationListResponse {
  code: number;
  message?: string;
  data: Invitation[];
}

interface UniversalResponse {
  code: number;
  message?: string;
}

export function Invitation() {
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
      navigate(Path.Login);
    }
  }, [profileStore, navigate]);

  const [invitationList, setInvitationList] = useState<Invitation[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const reloadInvitationList = useCallback((token: string) => {
    setLoading(true);
    const url = "/users/myInvitations";
    const BASE_URL = process.env.BASE_URL;
    const mode = process.env.BUILD_MODE;
    let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
    fetch(requestUrl, {
      method: "get",
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        const balancesResp = res as unknown as InvitationListResponse;
        if (balancesResp.code !== 0) {
          setErrorMessage(balancesResp.message || "");
          return;
        }
        const balances = balancesResp.data || [];
        setInvitationList(balances);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    reloadInvitationList(authStore.token);
  }, [authStore.token, reloadInvitationList]);

  function createInviteCode() {
    setLoading(true);
    profileStore
      .createInviteCode(authStore)
      .then((resp) => {
        console.log("resp", resp);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <ErrorBoundary>
      <div className="window-header">
        <div className="window-header-title">
          <div className="window-header-main-title">
            {Locale.InvitationPage.Title}
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
              title={Locale.InvitationPage.Actions.Close}
            />
          </div>
        </div>
      </div>
      <div className={styles["invitation"]}>
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
            onClick={() => {
              reloadInvitationList(authStore.token);
            }}
          />
        </div>

        {invitationList.length === 0 ? (
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
                ? Locale.InvitationPage.Loading
                : Locale.InvitationPage.NoInvitation}
            </div>
            <div
              style={{
                height: "100px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {authStore.inviteCode ? (
                <>
                  <span>
                    <span
                      className={styles["copy-action"]}
                      onClick={() => {
                        copyToClipboard(authStore.inviteCode);
                      }}
                    >
                      {authStore.inviteCode}
                    </span>
                    <span
                      className={styles["copy-action"]}
                      onClick={() => {
                        copyToClipboard(
                          location.origin +
                            Path.Register +
                            "?code=" +
                            authStore.inviteCode,
                        );
                      }}
                    >
                      {Locale.Profile.Actions.Copy}
                    </span>
                  </span>
                </>
              ) : (
                <IconButton
                  text={Locale.Profile.Actions.CreateInviteCode}
                  type="second"
                  disabled={loading}
                  onClick={() => {
                    createInviteCode();
                  }}
                />
              )}
            </div>
          </List>
        ) : (
          <></>
        )}
        {invitationList.length ? (
          <List>
            {invitationList.map((invitation) => {
              const id =
                ((invitation.id || "") as string) ||
                invitation.username ||
                "" ||
                invitation.email ||
                invitation.phone;
              const title =
                (invitation.username ||
                  "" ||
                  invitation.email ||
                  invitation.phone) + `(#${invitation.id})`;
              return (
                <DangerousListItem key={id} title={title}>
                  <span>邀请时间：{invitation.createTime}</span>
                </DangerousListItem>
              );
            })}
          </List>
        ) : (
          <></>
        )}

        <List>
          <ListItem>
            <IconButton
              text={Locale.InvitationPage.Actions.Profile}
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
