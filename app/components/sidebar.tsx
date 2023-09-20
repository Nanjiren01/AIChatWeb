import { useState, useEffect, useRef } from "react";

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
import MaskIcon from "../icons/mask.svg";
import PluginIcon from "../icons/plugin.svg";
import NextImage from "next/image";

import Locale from "../locales";

import { Modal } from "./ui-lib";

import { useAppConfig, useChatStore } from "../store";
import { useWebsiteConfigStore, useNoticeConfigStore } from "../store";

import {
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  REPO_URL,
} from "../constant";

import { Link, useNavigate } from "react-router-dom";
import { useMobileScreen } from "../utils";
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
  const startDragWidth = useRef(config.sidebarWidth ?? 300);
  const lastUpdateTime = useRef(Date.now());

  const handleMouseMove = useRef((e: MouseEvent) => {
    if (Date.now() < lastUpdateTime.current + 50) {
      return;
    }
    lastUpdateTime.current = Date.now();
    const d = e.clientX - startX.current;
    const nextWidth = limit(startDragWidth.current + d);
    config.update((config) => (config.sidebarWidth = nextWidth));
  });

  const handleMouseUp = useRef(() => {
    startDragWidth.current = config.sidebarWidth ?? 300;
    window.removeEventListener("mousemove", handleMouseMove.current);
    window.removeEventListener("mouseup", handleMouseUp.current);
  });

  const onDragMouseDown = (e: MouseEvent) => {
    startX.current = e.clientX;

    window.addEventListener("mousemove", handleMouseMove.current);
    window.addEventListener("mouseup", handleMouseUp.current);
  };
  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? 300);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragMouseDown,
    shouldNarrow,
  };
}

export function NoticeModel(props: {
  title: string;
  content: string;
  onClose: () => void;
}) {
  const noticeConfigStore = useNoticeConfigStore();

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Sidebar.Title}
        onClose={() => props.onClose()}
        actions={[
          <IconButton
            key="reset"
            bordered
            text={Locale.Sidebar.Close}
            onClick={() => {
              props.onClose();
            }}
          />,
        ]}
      >
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
      </Modal>
    </div>
  );
}

export function SideBar(props: {
  className?: string;
  noticeShow: boolean;
  noticeTitle: string;
  noticeContent: string;
  setNoticeShow: (show: boolean) => void;
}) {
  const chatStore = useChatStore();

  // drag side bar
  const { onDragMouseDown, shouldNarrow } = useDragSideBar();
  const navigate = useNavigate();
  const config = useAppConfig();

  useHotKey();

  const websiteConfigStore = useWebsiteConfigStore();
  const noticeConfigStore = useNoticeConfigStore();

  return (
    <div
      className={`${styles.sidebar} ${props.className} ${
        shouldNarrow && styles["narrow-sidebar"]
      }`}
    >
      <div className={styles["sidebar-header"]} data-tauri-drag-region>
        <div
          className={styles["sidebar-title"]}
          dangerouslySetInnerHTML={{
            __html: websiteConfigStore.mainTitle || "AI Chat",
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
          <NextImage src={ChatBotIcon.src} width={44} height={44} alt="bot" />
        </div>
      </div>

      <div className={styles["sidebar-header-bar"]}>
        <IconButton
          icon={<MaskIcon />}
          text={shouldNarrow ? undefined : Locale.Mask.Name}
          className={styles["sidebar-bar-button"]}
          onClick={() => navigate(Path.NewChat, { state: { fromHome: true } })}
          shadow
        />
        <IconButton
          icon={<PluginIcon />}
          text={shouldNarrow ? undefined : Locale.Plugin.Name}
          className={styles["sidebar-bar-button"]}
          onClick={() => showToast(Locale.WIP)}
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
              icon={<CloseIcon />}
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
                  props.setNoticeShow(true);
                }}
                shadow
              />
            </div>
          ) : (
            <></>
          )}
          {!websiteConfigStore.hideGithubIcon ? (
            <div className={styles["sidebar-action"]}>
              <a href={REPO_URL} target="_blank">
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
        onMouseDown={(e) => onDragMouseDown(e as any)}
      ></div>

      {props.noticeShow && (
        <NoticeModel
          title={props.noticeTitle}
          content={props.noticeContent}
          onClose={() => props.setNoticeShow(false)}
        />
      )}
    </div>
  );
}
