import React, { useState, useEffect, useRef, useMemo } from "react";

import styles from "./home.module.scss";

import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import GithubIcon from "../icons/github.svg";
import BookOpenIcon from "../icons/book-open.svg";
import NoticeIcon from "../icons/notice.svg";
// import LoginIcon from "../icons/login.svg";
// import ChatGptIcon from "../icons/chatgpt.svg";
import ChatBotIcon from "../icons/ai-chat-bot.png";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import MaskIcon from "../icons/app.svg";
import PluginIcon from "../icons/plugin.svg";
import DragIcon from "../icons/drag.svg";
import NextImage from "next/image";
import UserIcon from "../icons/user.svg";
import CartIcon from "../icons/cart-outline.svg";

import Locale from "../locales";

import { Modal } from "./ui-lib";

import { useAppConfig, useAuthStore, useChatStore } from "../store";
import { useWebsiteConfigStore, useNoticeConfigStore } from "../store";

import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  REPO_URL,
} from "../constant";

import { Link, useNavigate } from "react-router-dom";
import { isIOS, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import { showConfirm, showToast } from "./ui-lib";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === "ArrowUp") {
          chatStore.nextSession(-1);
        } else if (e.key === "ArrowDown") {
          chatStore.nextSession(1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const toggleSideBar = () => {
    config.update((config) => {
      if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
        config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      } else {
        config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
      }
    });
  };

  const onDragStart = (e: MouseEvent) => {
    // Remembers the initial width each time the mouse is pressed
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;
    const dragStartTime = Date.now();

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      const d = e.clientX - startX.current;
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth < MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
        } else {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      // In useRef the data is non-responsive, so `config.sidebarWidth` can't get the dynamic sidebarWidth
      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", handleDragEnd);

      // if user click the drag icon, should toggle the sidebar
      const shouldFireClick = Date.now() - dragStartTime < 300;
      if (shouldFireClick) {
        toggleSideBar();
      }
    };

    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragStart,
    shouldNarrow,
  };
}

export const NoticeModelBody = React.memo(
  (props: { title: string; content: string }) => {
    return (
      <div>
        <div
          style={{
            textAlign: "center",
            fontSize: "20px",
            lineHeight: "40px",
            marginBottom: "10px",
          }}
          dangerouslySetInnerHTML={{ __html: props.title || "" }}
        ></div>
        <div
          dangerouslySetInnerHTML={{
            __html: props.content || "",
          }}
        ></div>
      </div>
    );
  },
);
NoticeModelBody.displayName = "NoticeModelBody";

function sameDate(d1: Date, d2: Date) {
  if (d1.constructor.name === "String") {
    d1 = new Date(d1);
  }
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}
export function NoticeModel(props: {
  title: string;
  content: string;
  noticeNotShowToday: Date | null;
  onClose: (notShowToday: boolean) => void;
}) {
  const init =
    props.noticeNotShowToday === null
      ? false
      : sameDate(props.noticeNotShowToday, new Date());
  const [notShowToday, setNotShowToday] = useState(init);

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Sidebar.Title}
        onClose={() => props.onClose(notShowToday)}
        actions={[
          <IconButton
            key="reset"
            bordered
            text={Locale.Sidebar.Close}
            onClick={() => {
              props.onClose(notShowToday);
            }}
          />,
        ]}
        footer={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "20px",
            }}
          >
            <input
              type="checkbox"
              checked={notShowToday}
              onChange={() => setNotShowToday(!notShowToday)}
            />
            今日不再弹出
          </div>
        }
      >
        <NoticeModelBody title={props.title} content={props.content} />
      </Modal>
    </div>
  );
}

export function SideBar(props: {
  className?: string;
  noticeShow: boolean;
  noticeTitle: string;
  noticeContent: string;
  noticeNotShowToday: Date | null;
  showNotice: () => void;
  setNoticeShow: (show: boolean, notShowToday: boolean) => void;
  logoLoading: boolean;
  logoUrl?: string;
}) {
  const chatStore = useChatStore();

  // drag side bar
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const navigate = useNavigate();
  const config = useAppConfig();
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );

  useHotKey();

  const websiteConfigStore = useWebsiteConfigStore();
  const noticeConfigStore = useNoticeConfigStore();

  const logoLoading = props.logoLoading;
  const logoUrl = props.logoUrl;

  return (
    <div
      className={`${styles.sidebar} ${props.className} ${
        shouldNarrow && styles["narrow-sidebar"]
      }`}
      style={{
        // #3016 disable transition on ios mobile screen
        transition: isMobileScreen && isIOSMobile ? "none" : undefined,
      }}
    >
      <div className={styles["sidebar-header"]} data-tauri-drag-region>
        <div
          className={styles["sidebar-title"]}
          dangerouslySetInnerHTML={{
            __html: websiteConfigStore.mainTitle || "AIChat Next Web",
          }}
          data-tauri-drag-region
        ></div>
        <div
          className={styles["sidebar-sub-title"]}
          dangerouslySetInnerHTML={{
            __html:
              websiteConfigStore.subTitle || "Build your own AI assistant.",
          }}
        ></div>
        <div className={styles["sidebar-logo"] + " no-dark"}>
          {logoLoading ? (
            <></>
          ) : !logoUrl ? (
            <NextImage src={ChatBotIcon.src} width={44} height={44} alt="bot" />
          ) : (
            <img src={logoUrl} width={44} height={44} />
          )}
        </div>
      </div>

      <div className={styles["sidebar-header-bar"]}>
        <IconButton
          icon={<UserIcon />}
          text={shouldNarrow ? undefined : Locale.User.Name}
          className={styles["sidebar-bar-button"]}
          onClick={() => navigate(Path.Profile)}
          shadow
        />
        <IconButton
          icon={<CartIcon />}
          text={shouldNarrow ? undefined : Locale.Shop.Name}
          className={styles["sidebar-bar-button"]}
          onClick={() => navigate(Path.Pricing)}
          shadow
        />
      </div>

      <div
        className={styles["sidebar-body"]}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            navigate(Path.Home);
          }
        }}
      >
        <ChatList narrow={shouldNarrow} />
      </div>

      <div className={styles["sidebar-tail"]}>
        <div className={styles["sidebar-actions"]}>
          <div className={styles["sidebar-action"] + " " + styles.mobile}>
            <IconButton
              icon={<DeleteIcon />}
              onClick={async () => {
                if (await showConfirm(Locale.Home.DeleteChat)) {
                  chatStore.deleteSession(chatStore.currentSessionIndex);
                }
              }}
            />
          </div>
          <div className={styles["sidebar-action"]}>
            <Link to={Path.Settings}>
              <IconButton icon={<SettingsIcon />} shadow />
            </Link>
          </div>
          {props.noticeTitle || props.noticeContent ? (
            <div className={styles["sidebar-action"]}>
              <IconButton
                icon={<NoticeIcon />}
                onClick={() => {
                  props.showNotice();
                }}
                shadow
              />
            </div>
          ) : (
            <></>
          )}
          {!websiteConfigStore.hideGithubIcon ? (
            <div className={styles["sidebar-action"]}>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                <IconButton icon={<GithubIcon />} shadow />
              </a>
            </div>
          ) : (
            <></>
          )}
        </div>
        <div>
          <IconButton
            icon={<AddIcon />}
            text={shouldNarrow ? undefined : Locale.Home.NewChat}
            onClick={() => {
              if (config.dontShowMaskSplashScreen) {
                chatStore.newSession();
                navigate(Path.Chat);
              } else {
                navigate(Path.NewChat);
              }
            }}
            shadow
          />
        </div>
      </div>

      <div
        className={styles["sidebar-drag"]}
        onPointerDown={(e) => onDragStart(e as any)}
      >
        <DragIcon />
      </div>

      {props.noticeShow && (
        <NoticeModel
          title={props.noticeTitle}
          content={props.noticeContent}
          noticeNotShowToday={props.noticeNotShowToday}
          onClose={(notShowToday: boolean) =>
            props.setNoticeShow(false, notShowToday)
          }
        />
      )}
    </div>
  );
}
