import { useState, useEffect } from "react";

import styles from "./profile.module.scss";

import CloseIcon from "../icons/close.svg";
import { Input, List, ListItem, Modal, PasswordInput } from "./ui-lib";

import { IconButton } from "./button";
import {
  useAuthStore,
  useAccessStore,
  useAppConfig,
  useProfileStore,
} from "../store";

import Locale from "../locales";
import { Path } from "../constant";
import { ErrorBoundary } from "./error";
import { useNavigate } from "react-router-dom";
import { showToast, Popover } from "./ui-lib";
import { Avatar, AvatarPicker } from "./emoji";

export function Profile() {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const accessStore = useAccessStore();
  const profileStore = useProfileStore();

  const config = useAppConfig();
  const updateConfig = config.update;

  const [loadingUsage, setLoadingUsage] = useState(false);

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

  const { fetchProfile } = profileStore;
  const { token } = authStore;
  useEffect(() => {
    fetchProfile(token).then((res) => {
      // console.log('profile res', res)
      if (!res.data || !res.data.id) {
        navigate(Path.Login);
      }
    });
  }, [fetchProfile, token, navigate]);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  function logout() {
    setTimeout(() => {
      authStore.logout();
      navigate(Path.Login);
    }, 500);
  }

  return (
    <ErrorBoundary>
      <div className="window-header">
        <div className="window-header-title">
          <div className="window-header-main-title">{Locale.Profile.Title}</div>
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
              title={Locale.Profile.Actions.Close}
            />
          </div>
        </div>
      </div>
      <div className={styles["profile"]}>
        <List>
          <ListItem title={Locale.Settings.Avatar}>
            <Popover
              onClose={() => setShowEmojiPicker(false)}
              content={
                <AvatarPicker
                  onEmojiClick={(avatar: string) => {
                    updateConfig((config) => (config.avatar = avatar));
                    setShowEmojiPicker(false);
                  }}
                />
              }
              open={showEmojiPicker}
            >
              <div
                className={styles.avatar}
                onClick={() => setShowEmojiPicker(true)}
              >
                <Avatar avatar={config.avatar} />
              </div>
            </Popover>
          </ListItem>

          <ListItem title={Locale.Profile.Username}>
            <span>{authStore.username}</span>
          </ListItem>
        </List>

        <List>
          {profileStore.balances && profileStore.balances.length > 0 ? (
            <ListItem
              title={Locale.Profile.BalanceItem.Title}
              subTitle={Locale.Profile.BalanceItem.SubTitle}
            >
              <span>
                {profileStore.balances[0].calcType == "Total"
                  ? Locale.Profile.BalanceItem.CalcTypes.Total
                  : profileStore.balances[0].calcType == "Daily"
                  ? Locale.Profile.BalanceItem.CalcTypes.Daily
                  : profileStore.balances[0].calcType == "Hourly"
                  ? Locale.Profile.BalanceItem.CalcTypes.Hourly
                  : profileStore.balances[0].calcType == "ThreeHourly"
                  ? Locale.Profile.BalanceItem.CalcTypes.ThreeHourly
                  : ""}
              </span>
            </ListItem>
          ) : (
            <></>
          )}
          <ListItem
            title={Locale.Profile.Tokens.Title}
            subTitle={Locale.Profile.Tokens.SubTitle}
          >
            <span>
              {profileStore.tokens == -1 ? "无限制" : profileStore.tokens}
            </span>
          </ListItem>

          <ListItem
            title={Locale.Profile.ChatCount.Title}
            subTitle={Locale.Profile.ChatCount.SubTitle}
          >
            <span>
              {profileStore.chatCount == -1 ? "无限制" : profileStore.chatCount}
            </span>
          </ListItem>

          <ListItem
            title={Locale.Profile.AdvanceChatCount.Title}
            subTitle={Locale.Profile.AdvanceChatCount.SubTitle}
          >
            <span>
              {profileStore.advanceChatCount == -1
                ? "无限制"
                : profileStore.advanceChatCount}
            </span>
          </ListItem>

          <ListItem
            title={Locale.Profile.DrawCount.Title}
            subTitle={Locale.Profile.DrawCount.SubTitle}
          >
            <span>
              {profileStore.drawCount == -1 ? "无限制" : profileStore.drawCount}
            </span>
          </ListItem>

          {profileStore.balances && profileStore.balances.length > 0 ? (
            <ListItem
              title={Locale.Profile.ExpireList.Title}
              subTitle={Locale.Profile.ExpireList.SubTitle}
            >
              <span>{profileStore.balances[0].expireTime}</span>
            </ListItem>
          ) : (
            <></>
          )}
          {profileStore.balances && profileStore.balances.length > 1 ? (
            <ListItem>
              <IconButton
                text={Locale.Profile.Actions.GoToBalanceList}
                onClick={() => {
                  showToast(Locale.Profile.Actions.ConsultAdministrator);
                }}
              />
            </ListItem>
          ) : (
            <></>
          )}
        </List>

        <List>
          <ListItem>
            <IconButton
              text={Locale.Profile.Actions.Pricing}
              block={true}
              type="primary"
              onClick={() => {
                navigate(Path.Pricing);
              }}
            />
          </ListItem>

          <ListItem>
            <IconButton
              text={Locale.Profile.Actions.Order}
              block={true}
              type="second"
              onClick={() => {
                navigate(Path.Order);
              }}
            />
          </ListItem>

          <ListItem>
            <IconButton
              text={Locale.LoginPage.Actions.Logout}
              block={true}
              onClick={() => {
                logout();
              }}
            />
          </ListItem>
        </List>
      </div>
    </ErrorBoundary>
  );
}
