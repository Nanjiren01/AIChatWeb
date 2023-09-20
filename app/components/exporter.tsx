import {
  ChatMessage,
  useAppConfig,
  useChatStore,
  useWebsiteConfigStore,
} from "../store";
import Locale from "../locales";
import styles from "./exporter.module.scss";
import { List, ListItem, Modal, Select, showToast } from "./ui-lib";
import { IconButton } from "./button";
import { copyToClipboard, downloadAs, useMobileScreen } from "../utils";

import CopyIcon from "../icons/copy.svg";
import LoadingIcon from "../icons/three-dots.svg";
//import ChatGptIcon from "../icons/chatgpt.png";
import ChatBotIcon from "../icons/ai-chat-bot.png";
import ShareIcon from "../icons/share.svg";
import BotIcon from "../icons/bot.png";

import DownloadIcon from "../icons/download.svg";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSelector, useMessageSelector } from "./message-selector";
import { Avatar } from "./emoji";
import dynamic from "next/dynamic";
import NextImage from "next/image";

import { toBlob, toJpeg, toPng } from "html-to-image";
import { DEFAULT_MASK_AVATAR } from "../store/mask";
import { api } from "../client/api";
import { prettyObject } from "../utils/format";
import { EXPORT_MESSAGE_CLASS_NAME } from "../constant";

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

export function ExportMessageModal(props: { onClose: () => void }) {
  return (
    <div className="modal-mask">
      <Modal title={Locale.Export.Title} onClose={props.onClose}>
        <div style={{ minHeight: "40vh" }}>
          <MessageExporter />
        </div>
      </Modal>
    </div>
  );
}

function useSteps(
  steps: Array<{
    name: string;
    value: string;
  }>,
) {
  const stepCount = steps.length;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const nextStep = () =>
    setCurrentStepIndex((currentStepIndex + 1) % stepCount);
  const prevStep = () =>
    setCurrentStepIndex((currentStepIndex - 1 + stepCount) % stepCount);

  return {
    currentStepIndex,
    setCurrentStepIndex,
    nextStep,
    prevStep,
    currentStep: steps[currentStepIndex],
  };
}

function Steps<
  T extends {
    name: string;
    value: string;
  }[],
>(props: { steps: T; onStepChange?: (index: number) => void; index: number }) {
  const steps = props.steps;
  const stepCount = steps.length;

  return (
    <div className={styles["steps"]}>
      <div className={styles["steps-progress"]}>
        <div
          className={styles["steps-progress-inner"]}
          style={{
            width: `${((props.index + 1) / stepCount) * 100}%`,
          }}
        ></div>
      </div>
      <div className={styles["steps-inner"]}>
        {steps.map((step, i) => {
          return (
            <div
              key={i}
              className={`${styles["step"]} ${
                styles[i <= props.index ? "step-finished" : ""]
              } ${i === props.index && styles["step-current"]} clickable`}
              onClick={() => {
                props.onStepChange?.(i);
              }}
              role="button"
            >
              <span className={styles["step-index"]}>{i + 1}</span>
              <span className={styles["step-name"]}>{step.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MessageExporter() {
  const steps = [
    {
      name: Locale.Export.Steps.Select,
      value: "select",
    },
    {
      name: Locale.Export.Steps.Preview,
      value: "preview",
    },
  ];
  const { currentStep, setCurrentStepIndex, currentStepIndex } =
    useSteps(steps);
  const formats = ["text", "image"] as const;
  type ExportFormat = (typeof formats)[number];

  const [exportConfig, setExportConfig] = useState({
    format: "image" as ExportFormat,
    includeContext: true,
  });

  function updateExportConfig(updater: (config: typeof exportConfig) => void) {
    const config = { ...exportConfig };
    updater(config);
    setExportConfig(config);
  }

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const { selection, updateSelection } = useMessageSelector();
  const selectedMessages = useMemo(() => {
    const ret: ChatMessage[] = [];
    if (exportConfig.includeContext) {
      ret.push(...session.mask.context);
    }
    ret.push(...session.messages.filter((m, i) => selection.has(m.id ?? i)));
    return ret;
  }, [
    exportConfig.includeContext,
    session.messages,
    session.mask.context,
    selection,
  ]);

  return (
    <>
      <Steps
        steps={steps}
        index={currentStepIndex}
        onStepChange={setCurrentStepIndex}
      />
      <div
        className={styles["message-exporter-body"]}
        style={currentStep.value !== "select" ? { display: "none" } : {}}
      >
        <List>
          <ListItem
            title={Locale.Export.Format.Title}
            subTitle={Locale.Export.Format.SubTitle}
          >
            <Select
              value={exportConfig.format}
              onChange={(e) =>
                updateExportConfig(
                  (config) =>
                    (config.format = e.currentTarget.value as ExportFormat),
                )
              }
            >
              {formats.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </ListItem>
          <ListItem
            title={Locale.Export.IncludeContext.Title}
            subTitle={Locale.Export.IncludeContext.SubTitle}
          >
            <input
              type="checkbox"
              checked={exportConfig.includeContext}
              onChange={(e) => {
                updateExportConfig(
                  (config) => (config.includeContext = e.currentTarget.checked),
                );
              }}
            ></input>
          </ListItem>
        </List>
        <MessageSelector
          selection={selection}
          updateSelection={updateSelection}
          defaultSelectAll
        />
      </div>
      {currentStep.value === "preview" && (
        <div className={styles["message-exporter-body"]}>
          {exportConfig.format === "text" ? (
            <MarkdownPreviewer
              messages={selectedMessages}
              topic={session.topic}
            />
          ) : (
            <ImagePreviewer messages={selectedMessages} topic={session.topic} />
          )}
        </div>
      )}
    </>
  );
}

export function RenderExport(props: {
  messages: ChatMessage[];
  onRender: (messages: ChatMessage[]) => void;
}) {
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!domRef.current) return;
    const dom = domRef.current;
    const messages = Array.from(
      dom.getElementsByClassName(EXPORT_MESSAGE_CLASS_NAME),
    );

    if (messages.length !== props.messages.length) {
      return;
    }

    const renderMsgs = messages.map((v) => {
      const [_, role] = v.id.split(":");
      return {
        role: role as any,
        content: v.innerHTML,
        date: "",
      };
    });

    props.onRender(renderMsgs);
  });

  return (
    <div ref={domRef}>
      {props.messages.map((m, i) => (
        <div
          key={i}
          id={`${m.role}:${i}`}
          className={EXPORT_MESSAGE_CLASS_NAME}
        >
          <Markdown content={m.content} defaultShow />
        </div>
      ))}
    </div>
  );
}

export function PreviewActions(props: {
  download: () => void;
  copy: () => void;
  showCopy?: boolean;
  messages?: ChatMessage[];
}) {
  const [loading, setLoading] = useState(false);
  const [shouldExport, setShouldExport] = useState(false);

  const onRenderMsgs = (msgs: ChatMessage[]) => {
    setShouldExport(false);

    api
      .share(msgs)
      .then((res) => {
        if (!res) return;
        copyToClipboard(res);
        setTimeout(() => {
          window.open(res, "_blank");
        }, 800);
      })
      .catch((e) => {
        console.error("[Share]", e);
        showToast(prettyObject(e));
      })
      .finally(() => setLoading(false));
  };

  const share = async () => {
    if (props.messages?.length) {
      setLoading(true);
      setShouldExport(true);
    }
  };

  return (
    <>
      <div className={styles["preview-actions"]}>
        {props.showCopy && (
          <IconButton
            text={Locale.Export.Copy}
            bordered
            shadow
            icon={<CopyIcon />}
            onClick={props.copy}
          ></IconButton>
        )}
        <IconButton
          text={Locale.Export.Download}
          bordered
          shadow
          icon={<DownloadIcon />}
          onClick={props.download}
        ></IconButton>
        <IconButton
          text={Locale.Export.Share}
          bordered
          shadow
          icon={loading ? <LoadingIcon /> : <ShareIcon />}
          onClick={share}
        ></IconButton>
      </div>
      <div
        style={{
          position: "fixed",
          right: "200vw",
          pointerEvents: "none",
        }}
      >
        {shouldExport && (
          <RenderExport
            messages={props.messages ?? []}
            onRender={onRenderMsgs}
          />
        )}
      </div>
    </>
  );
}

function ExportAvatar(props: { avatar: string }) {
  if (props.avatar === DEFAULT_MASK_AVATAR) {
    return (
      <NextImage
        src={ChatBotIcon.src}
        width={30}
        height={30}
        alt="bot"
        className="user-avatar"
      />
    );
  }

  return <Avatar avatar={props.avatar}></Avatar>;
}

export function ImagePreviewer(props: {
  messages: ChatMessage[];
  topic: string;
}) {
  const chatStore = useChatStore();
  const websiteConfigStore = useWebsiteConfigStore();
  const session = chatStore.currentSession();
  const mask = session.mask;
  const config = useAppConfig();

  const previewRef = useRef<HTMLDivElement>(null);

  const copy = () => {
    const dom = previewRef.current;
    if (!dom) return;
    toBlob(dom).then((blob) => {
      if (!blob) return;
      try {
        navigator.clipboard
          .write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ])
          .then(() => {
            showToast(Locale.Copy.Success);
          })
          .catch((e) => {
            console.error(e);
          });
      } catch (e) {
        console.error("[Copy Image] ", e);
        showToast(Locale.Copy.Failed);
      }
    });
  };

  const isMobile = useMobileScreen();

  const download = () => {
    const dom = previewRef.current;
    if (!dom) return;
    toPng(dom)
      .then((blob) => {
        if (!blob) return;

        if (isMobile) {
          const image = new Image();
          image.src = blob;
          const win = window.open("");
          win?.document.write(image.outerHTML);
        } else {
          const link = document.createElement("a");
          link.download = `${props.topic}.png`;
          link.href = blob;
          link.click();
        }
      })
      .catch((e) => console.log("[Export Image] ", e));
  };

  return (
    <div className={styles["image-previewer"]}>
      <PreviewActions
        copy={copy}
        download={download}
        showCopy={!isMobile}
        messages={props.messages}
      />
      <div
        className={`${styles["preview-body"]} ${styles["default-theme"]}`}
        ref={previewRef}
      >
        <div className={styles["chat-info"]}>
          <div className={styles["logo"] + " no-dark"}>
            <NextImage
              src={ChatBotIcon.src}
              alt="logo"
              width={44}
              height={44}
            />
          </div>

          <div style={{ zIndex: 1 }}>
            <div className={styles["main-title"]}>
              {websiteConfigStore.title || "AI Chat"}
            </div>
            <div className={styles["sub-title"]}>
              {websiteConfigStore.subTitle || "github.com/Nanjiren01/AIChatWeb"}
            </div>
            <div className={styles["icons"]}>
              <ExportAvatar avatar={config.avatar} />
              <span className={styles["icon-space"]}>&</span>
              <ExportAvatar avatar={mask.avatar} />
            </div>
          </div>
          <div>
            <div className={styles["chat-info-item"]}>
              {Locale.Exporter.Model}: {mask.modelConfig.model}
            </div>
            <div className={styles["chat-info-item"]}>
              {Locale.Exporter.Messages}: {props.messages.length}
            </div>
            <div className={styles["chat-info-item"]}>
              {Locale.Exporter.Topic}: {session.topic}
            </div>
            <div className={styles["chat-info-item"]}>
              {Locale.Exporter.Time}:{" "}
              {new Date(
                props.messages.at(-1)?.date ?? Date.now(),
              ).toLocaleString()}
            </div>
          </div>
        </div>
        {props.messages.map((m, i) => {
          return (
            <div
              className={styles["message"] + " " + styles["message-" + m.role]}
              key={i}
            >
              <div className={styles["avatar"]}>
                <ExportAvatar
                  avatar={m.role === "user" ? config.avatar : mask.avatar}
                />
              </div>

              <div className={styles["body"]}>
                <Markdown
                  content={m.content}
                  fontSize={config.fontSize}
                  defaultShow
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarkdownPreviewer(props: {
  messages: ChatMessage[];
  topic: string;
}) {
  const mdText =
    `# ${props.topic}\n\n` +
    props.messages
      .map((m) => {
        return m.role === "user"
          ? `## ${Locale.Export.MessageFromYou}:\n${m.content}`
          : `## ${Locale.Export.MessageFromChatGPT}:\n${m.content.trim()}`;
      })
      .join("\n\n");

  const copy = () => {
    copyToClipboard(mdText);
  };
  const download = () => {
    downloadAs(mdText, `${props.topic}.md`);
  };

  return (
    <>
      <PreviewActions
        copy={copy}
        download={download}
        messages={props.messages}
      />
      <div className="markdown-body">
        <pre className={styles["export-content"]}>{mdText}</pre>
      </div>
    </>
  );
}
