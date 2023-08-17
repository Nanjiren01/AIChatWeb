import { useEffect, useRef, useState } from "react";
import { Path, SlotID } from "../constant";
import { IconButton } from "./button";
import { EmojiAvatar } from "./emoji";
import styles from "./new-chat.module.scss";

import LeftIcon from "../icons/left.svg";
import LightningIcon from "../icons/lightning.svg";
import EyeIcon from "../icons/eye.svg";

import { useLocation, useNavigate } from "react-router-dom";
import { RemoteMask, Mask, useMaskStore } from "../store/mask";
import Locale from "../locales";
import { useAppConfig, useChatStore } from "../store";
import { MaskAvatar } from "./mask";
import { useCommand } from "../command";
import { showConfirm } from "./ui-lib";
import { BUILTIN_MASK_STORE } from "../masks";

function getIntersectionArea(aRect: DOMRect, bRect: DOMRect) {
  const xmin = Math.max(aRect.x, bRect.x);
  const xmax = Math.min(aRect.x + aRect.width, bRect.x + bRect.width);
  const ymin = Math.max(aRect.y, bRect.y);
  const ymax = Math.min(aRect.y + aRect.height, bRect.y + bRect.height);
  const width = xmax - xmin;
  const height = ymax - ymin;
  const intersectionArea = width < 0 || height < 0 ? 0 : width * height;
  return intersectionArea;
}

function MaskItem(props: { mask: RemoteMask; onClick?: () => void }) {
  return (
    <div className={styles["mask"]} onClick={props.onClick}>
      <MaskAvatar mask={props.mask} />
      <div className={styles["mask-name"] + " one-line"}>{props.mask.name}</div>
    </div>
  );
}

function useMaskGroup(masks: RemoteMask[] | Mask[]) {
  const [groups, setGroups] = useState<(Mask | RemoteMask)[][]>([]);

  useEffect(() => {
    const computeGroup = () => {
      const appBody = document.getElementById(SlotID.AppBody);
      if (!appBody || masks.length === 0) return;

      const rect = appBody.getBoundingClientRect();
      const maxWidth = rect.width;
      const maxHeight = rect.height * 0.6;
      const maskItemWidth = 120;
      const maskItemHeight = 50;

      const randomMask = () => masks[Math.floor(Math.random() * masks.length)];
      let maskIndex = 0;
      const nextMask = () => masks[maskIndex++ % masks.length];

      const rows = Math.ceil(maxHeight / maskItemHeight);
      const cols = Math.ceil(maxWidth / maskItemWidth);

      const newGroups = new Array(rows)
        .fill(0)
        .map((_, _i) =>
          new Array(cols)
            .fill(0)
            .map((_, j) => (j < 1 || j > cols - 2 ? randomMask() : nextMask())),
        );

      setGroups(newGroups);
    };

    computeGroup();

    window.addEventListener("resize", computeGroup);
    return () => window.removeEventListener("resize", computeGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masks]);

  return groups;
}

function useMaskTypes(masks: RemoteMask[] | Mask[]) {
  const [maskTypes, setMaskTypes] = useState<string[]>([]);
  useEffect(() => {
    const newTypes = [] as string[];
    masks.forEach((mask) => {
      if (mask.type !== "") {
        if (mask.type && !newTypes.includes(mask.type)) {
          newTypes.push(mask.type);
        }
      }
    });
    newTypes.splice(0, 0, "全部");
    // newTypes.push('其他')
    console.log("newTypes", newTypes);
    setMaskTypes(newTypes);
  }, [masks]);
  return maskTypes;
}

export function NewChat() {
  const chatStore = useChatStore();
  const maskStore = useMaskStore();

  let [masks, setMasks] = useState<RemoteMask[] | Mask[]>([]);
  const maskTypes = useMaskTypes(masks);
  const [hotType, setHotType] = useState("全部");
  const [showMasks, setShowMasks] = useState<RemoteMask[] | Mask[]>([]);
  const groups = useMaskGroup(showMasks);
  useEffect(() => {
    maskStore.fetch().then((remoteMasks) => {
      if (remoteMasks.length === 0) {
        setMasks(maskStore.getAll());
      } else {
        setMasks(remoteMasks);
      }
    });
  }, [maskStore]);
  useEffect(() => {
    setShowMasks(
      masks.filter(
        (m) =>
          hotType === "全部" ||
          m.type === hotType ||
          (hotType === "其他" && (m.type === null || m.type === "")),
      ),
    );
  }, [hotType, masks]);

  const navigate = useNavigate();
  const config = useAppConfig();

  const maskRef = useRef<HTMLDivElement>(null);

  const { state } = useLocation();

  const startChat = (mask?: Mask | RemoteMask) => {
    setTimeout(() => {
      chatStore.newSession(mask);
      navigate(Path.Chat);
    }, 10);
  };

  useCommand({
    mask: (id) => {
      try {
        const mask = maskStore.get(id) ?? BUILTIN_MASK_STORE.get(id);
        startChat(mask ?? undefined);
      } catch {
        console.error("[New Chat] failed to create chat from mask id=", id);
      }
    },
  });

  useEffect(() => {
    if (maskRef.current) {
      maskRef.current.scrollLeft =
        (maskRef.current.scrollWidth - maskRef.current.clientWidth) / 2;
    }
  }, [groups]);

  return (
    <div className={styles["new-chat"]}>
      <div className={styles["mask-header"]}>
        <IconButton
          icon={<LeftIcon />}
          text={Locale.NewChat.Return}
          onClick={() => navigate(Path.Home)}
        ></IconButton>
        {!state?.fromHome && (
          <IconButton
            text={Locale.NewChat.NotShow}
            onClick={async () => {
              if (await showConfirm(Locale.NewChat.ConfirmNoShow)) {
                startChat();
                config.update(
                  (config) => (config.dontShowMaskSplashScreen = true),
                );
              }
            }}
          ></IconButton>
        )}
      </div>
      <div className={styles["mask-cards"]}>
        <div className={styles["mask-card"]}>
          <EmojiAvatar avatar="1f606" size={24} />
        </div>
        <div className={styles["mask-card"]}>
          <EmojiAvatar avatar="1f916" size={24} />
        </div>
        <div className={styles["mask-card"]}>
          <EmojiAvatar avatar="1f479" size={24} />
        </div>
      </div>

      <div className={styles["title"]}>{Locale.NewChat.Title}</div>
      <div className={styles["sub-title"]}>{Locale.NewChat.SubTitle}</div>

      <div className={styles["actions"]}>
        <IconButton
          text={Locale.NewChat.More}
          onClick={() => navigate(Path.Masks)}
          icon={<EyeIcon />}
          bordered
          shadow
        />

        <IconButton
          text={Locale.NewChat.Skip}
          onClick={() => startChat()}
          icon={<LightningIcon />}
          type="primary"
          shadow
          className={styles["skip"]}
        />
      </div>

      {maskTypes.length > 1 && (
        <div className={styles["mask-type-container"]}>
          <ul className={styles["mask-type-ul"]}>
            {maskTypes.map((mt) => {
              const active = hotType === mt;
              return (
                <li
                  key={mt}
                  className={
                    styles["mask-type-li"] +
                    " " +
                    styles["clickable"] +
                    " clickable " +
                    (active ? styles["active"] : "")
                  }
                  onClick={() => {
                    setHotType(mt);
                  }}
                >
                  {mt}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className={styles["masks"]} ref={maskRef}>
        {groups.map((masks, i) => (
          <div key={i} className={styles["mask-row"]}>
            {masks.map((mask, index) => (
              <MaskItem
                key={index}
                mask={mask}
                onClick={() => startChat(mask)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
