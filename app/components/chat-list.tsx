import DeleteIcon from "../icons/delete.svg";
// import BotIcon from "../icons/bot.svg";

import styles from "./home.module.scss";
import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";

import {
  ChatSession,
  useAuthStore,
  useChatStore,
  useWebsiteConfigStore,
} from "../store";

import Locale from "../locales";
import { Link, useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { MaskAvatar } from "./mask";
import { Mask } from "../store/mask";
import { useRef, useEffect } from "react";
import { showConfirm, showToast } from "./ui-lib";
import { useMobileScreen } from "../utils";

export function ChatItem(props: {
  onClick?: () => void;
  onDelete?: () => void;
  title: string;
  count: number;
  time: string;
  selected: boolean;
  id: string;
  index: number;
  narrow?: boolean;
  mask: Mask;
  logoUrl?: string;
}) {
  return (
    <div
      className={`${styles["chat-item"]} ${
        props.selected && styles["chat-item-selected"]
      }`}
      onClick={props.onClick}
      title={`${props.title}\n${Locale.ChatItem.ChatItemCount(props.count)}`}
    >
      {props.narrow ? (
        <div className={styles["chat-item-narrow"]}>
          <div className={styles["chat-item-avatar"] + " no-dark"}>
            <MaskAvatar mask={props.mask} logoUrl={props.logoUrl} />
          </div>
          <div className={styles["chat-item-narrow-count"]}>{props.count}</div>
        </div>
      ) : (
        <>
          <div className={styles["chat-item-title"]}>{props.title}</div>
          <div className={styles["chat-item-info"]}>
            <div className={styles["chat-item-count"]}>
              {Locale.ChatItem.ChatItemCount(props.count)}
            </div>
            <div className={styles["chat-item-date"]}>{props.time}</div>
          </div>
        </>
      )}

      <div
        className={styles["chat-item-delete"]}
        onClickCapture={(e) => {
          props.onDelete?.();
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <DeleteIcon />
      </div>
    </div>
  );
}

export function ChatList(props: {
  narrow?: boolean;
  requestingSession: ChatSession | null;
}) {
  const [sessions, selectedIndex, selectSession] = useChatStore((state) => [
    state.sessions,
    state.currentSessionIndex,
    state.selectSession,
    //state.moveSession,
  ]);
  const authStore = useAuthStore();
  const chatStore = useChatStore();
  const navigate = useNavigate();
  const isMobileScreen = useMobileScreen();
  const { logoUrl } = useWebsiteConfigStore();

  // const onDragEnd: OnDragEndResponder = (result) => {
  //   const { destination, source } = result;
  //   if (!destination) {
  //     return;
  //   }

  //   if (
  //     destination.droppableId === source.droppableId &&
  //     destination.index === source.index
  //   ) {
  //     return;
  //   }

  //   moveSession(source.index, destination.index);
  // };

  return (
    <div className={styles["chat-list"]}>
      {sessions.map((item, i) => (
        <ChatItem
          title={item.topic}
          time={new Date(item.lastUpdate).toLocaleString()}
          count={item.messages.length}
          key={item.id}
          id={item.id}
          index={i}
          selected={i === selectedIndex}
          logoUrl={logoUrl}
          onClick={() => {
            if (
              props.requestingSession !== null &&
              props.requestingSession !== item
            ) {
              showToast(Locale.Chat.PleaseWaitForFinished);
              return;
            }
            navigate(Path.Chat);
            selectSession(i);
          }}
          onDelete={async () => {
            if (props.requestingSession === item) {
              showToast(Locale.Chat.PleaseWaitForFinished);
              return;
            }
            if (
              (!props.narrow && !isMobileScreen) ||
              (await showConfirm(Locale.Home.DeleteChat))
            ) {
              chatStore.deleteSession(i, authStore.token, () => {
                authStore.logout();
                navigate(Path.Login);
              });
            }
          }}
          narrow={props.narrow}
          mask={item.mask}
        />
      ))}
    </div>
  );
}
