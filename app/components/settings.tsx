import { useState, useEffect, useMemo } from "react";

import styles from "./settings.module.scss";

import ResetIcon from "../icons/reload.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import CopyIcon from "../icons/copy.svg";
import ClearIcon from "../icons/clear.svg";
import LoadingIcon from "../icons/three-dots.svg";
import EditIcon from "../icons/edit.svg";
import EyeIcon from "../icons/eye.svg";
import {
  Input,
  List,
  ListItem,
  Modal,
  PasswordInput,
  Popover,
  Select,
  showConfirm,
} from "./ui-lib";
import { ModelConfigList } from "./model-config";

import { IconButton } from "./button";
import {
  SubmitKey,
  useChatStore,
  Theme,
  useUpdateStore,
  useAccessStore,
  useAppConfig,
} from "../store";

import Locale, {
  AllLangs,
  ALL_LANG_OPTIONS,
  changeLang,
  getLang,
} from "../locales";
import { copyToClipboard } from "../utils";
import Link from "next/link";
import { Path, RELEASE_URL, UPDATE_URL } from "../constant";
import { Prompt, SearchService, usePromptStore } from "../store/prompt";
import { ErrorBoundary } from "./error";
import { InputRange } from "./input-range";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarPicker } from "./emoji";
import { getClientConfig } from "../config/client";
import { useSyncStore } from "../store/sync";

function EditPromptModal(props: { id: number; onClose: () => void }) {
  const promptStore = usePromptStore();
  const prompt = promptStore.get(props.id);

  return prompt ? (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Prompt.EditModal.Title}
        onClose={props.onClose}
        actions={[
          <IconButton
            key=""
            onClick={props.onClose}
            text={Locale.UI.Confirm}
            bordered
          />,
        ]}
      >
        <div className={styles["edit-prompt-modal"]}>
          <input
            type="text"
            value={prompt.title}
            readOnly={!prompt.isUser}
            className={styles["edit-prompt-title"]}
            onInput={(e) =>
              promptStore.update(
                props.id,
                (prompt) => (prompt.title = e.currentTarget.value),
              )
            }
          ></input>
          <Input
            value={prompt.content}
            readOnly={!prompt.isUser}
            className={styles["edit-prompt-content"]}
            rows={10}
            onInput={(e) =>
              promptStore.update(
                props.id,
                (prompt) => (prompt.content = e.currentTarget.value),
              )
            }
          ></Input>
        </div>
      </Modal>
    </div>
  ) : null;
}

function UserPromptModal(props: { onClose?: () => void }) {
  const promptStore = usePromptStore();
  const userPrompts = promptStore.getUserPrompts();
  const builtinPrompts = SearchService.builtinPrompts;
  const allPrompts = userPrompts.concat(builtinPrompts);
  const [searchInput, setSearchInput] = useState("");
  const [searchPrompts, setSearchPrompts] = useState<Prompt[]>([]);
  const prompts = searchInput.length > 0 ? searchPrompts : allPrompts;

  const [editingPromptId, setEditingPromptId] = useState<number>();

  useEffect(() => {
    if (searchInput.length > 0) {
      const searchResult = SearchService.search(searchInput);
      setSearchPrompts(searchResult);
    } else {
      setSearchPrompts([]);
    }
  }, [searchInput]);

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Prompt.Modal.Title}
        onClose={() => props.onClose?.()}
        actions={[
          <IconButton
            key="add"
            onClick={() =>
              promptStore.add({
                title: "Empty Prompt",
                content: "Empty Prompt Content",
              })
            }
            icon={<AddIcon />}
            bordered
            text={Locale.Settings.Prompt.Modal.Add}
          />,
        ]}
      >
        <div className={styles["user-prompt-modal"]}>
          <input
            type="text"
            className={styles["user-prompt-search"]}
            placeholder={Locale.Settings.Prompt.Modal.Search}
            value={searchInput}
            onInput={(e) => setSearchInput(e.currentTarget.value)}
          ></input>

          <div className={styles["user-prompt-list"]}>
            {prompts.map((v, _) => (
              <div className={styles["user-prompt-item"]} key={v.id ?? v.title}>
                <div className={styles["user-prompt-header"]}>
                  <div className={styles["user-prompt-title"]}>{v.title}</div>
                  <div className={styles["user-prompt-content"] + " one-line"}>
                    {v.content}
                  </div>
                </div>

                <div className={styles["user-prompt-buttons"]}>
                  {v.isUser && (
                    <IconButton
                      icon={<ClearIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => promptStore.remove(v.id!)}
                    />
                  )}
                  {v.isUser ? (
                    <IconButton
                      icon={<EditIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => setEditingPromptId(v.id)}
                    />
                  ) : (
                    <IconButton
                      icon={<EyeIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => setEditingPromptId(v.id)}
                    />
                  )}
                  <IconButton
                    icon={<CopyIcon />}
                    className={styles["user-prompt-button"]}
                    onClick={() => copyToClipboard(v.content)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {editingPromptId !== undefined && (
        <EditPromptModal
          id={editingPromptId!}
          onClose={() => setEditingPromptId(undefined)}
        />
      )}
    </div>
  );
}

function DangerItems() {
  const chatStore = useChatStore();
  const appConfig = useAppConfig();

  return (
    <List>
      <ListItem
        title={Locale.Settings.Danger.Reset.Title}
        subTitle={Locale.Settings.Danger.Reset.SubTitle}
      >
        <IconButton
          text={Locale.Settings.Danger.Reset.Action}
          onClick={async () => {
            if (await showConfirm(Locale.Settings.Danger.Reset.Confirm)) {
              appConfig.reset();
            }
          }}
          type="danger"
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Danger.Clear.Title}
        subTitle={Locale.Settings.Danger.Clear.SubTitle}
      >
        <IconButton
          text={Locale.Settings.Danger.Clear.Action}
          onClick={async () => {
            if (await showConfirm(Locale.Settings.Danger.Clear.Confirm)) {
              chatStore.clearAllData();
            }
          }}
          type="danger"
        />
      </ListItem>
    </List>
  );
}

function SyncItems() {
  const syncStore = useSyncStore();
  const webdav = syncStore.webDavConfig;

  // not ready: https://github.com/Yidadaa/ChatGPT-Next-Web/issues/920#issuecomment-1609866332
  return null;

  return (
    <List>
      <ListItem
        title={"上次同步：" + new Date().toLocaleString()}
        subTitle={"20 次对话，100 条消息，200 提示词，20 面具"}
      >
        <IconButton
          icon={<ResetIcon />}
          text="同步"
          onClick={() => {
            syncStore.check().then(console.log);
          }}
        />
      </ListItem>

      <ListItem
        title={"本地备份"}
        subTitle={"20 次对话，100 条消息，200 提示词，20 面具"}
      ></ListItem>

      <ListItem
        title={"Web Dav Server"}
        subTitle={Locale.Settings.AccessCode.SubTitle}
      >
        <input
          value={webdav.server}
          type="text"
          placeholder={"https://example.com"}
          onChange={(e) => {
            syncStore.update(
              (config) => (config.server = e.currentTarget.value),
            );
          }}
        />
      </ListItem>

      <ListItem title="Web Dav User Name" subTitle="user name here">
        <input
          value={webdav.username}
          type="text"
          placeholder={"username"}
          onChange={(e) => {
            syncStore.update(
              (config) => (config.username = e.currentTarget.value),
            );
          }}
        />
      </ListItem>

      <ListItem title="Web Dav Password" subTitle="password here">
        <input
          value={webdav.password}
          type="text"
          placeholder={"password"}
          onChange={(e) => {
            syncStore.update(
              (config) => (config.password = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </List>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const config = useAppConfig();
  const updateConfig = config.update;
  const chatStore = useChatStore();

  const updateStore = useUpdateStore();
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const currentVersion = updateStore.formatVersion(updateStore.version);
  const remoteId = updateStore.formatVersion(updateStore.remoteVersion);
  const hasNewVersion = currentVersion !== remoteId;
  const updateUrl = getClientConfig()?.isApp ? RELEASE_URL : UPDATE_URL;

  // function checkUpdate(force = false) {
  //   setCheckingUpdate(true);
  //   updateStore.getLatestVersion(force).then(() => {
  //     setCheckingUpdate(false);
  //   });

  //   console.log("[Update] local version ", updateStore.version);
  //   console.log("[Update] remote version ", updateStore.remoteVersion);
  // }

  const usage = {
    used: updateStore.used,
    subscription: updateStore.subscription,
  };
  const [loadingUsage, setLoadingUsage] = useState(false);
  function checkUsage(force = false) {
    setLoadingUsage(true);
    updateStore.updateUsage(force).finally(() => {
      setLoadingUsage(false);
    });
  }

  const accessStore = useAccessStore();
  const enabledAccessControl = useMemo(
    () => accessStore.enabledAccessControl(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const promptStore = usePromptStore();
  const builtinCount = SearchService.count.builtin;
  const customCount = promptStore.getUserPrompts().length ?? 0;
  const [shouldShowPromptModal, setShowPromptModal] = useState(false);

  // const showUsage = accessStore.isAuthorized();
  // useEffect(() => {
  //   // checks per minutes
  //   checkUpdate();
  //   showUsage && checkUsage();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

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

  const clientConfig = useMemo(() => getClientConfig(), []);
  const showAccessCode = enabledAccessControl && !clientConfig?.isApp;

  return (
    <ErrorBoundary>
      <div className="window-header" data-tauri-drag-region>
        <div className="window-header-title">
          <div className="window-header-main-title">
            {Locale.Settings.Title}
          </div>
          <div className="window-header-sub-title">
            {Locale.Settings.SubTitle}
          </div>
        </div>
        <div className="window-actions">
          <div className="window-action-button"></div>
          <div className="window-action-button"></div>
          <div className="window-action-button">
            <IconButton
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
            />
          </div>
        </div>
      </div>
      <div className={styles["settings"]}>
        <List>
          {/* <ListItem title={Locale.Settings.Avatar}>
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
          </ListItem> */}
          {/*
          <ListItem
            title={Locale.Settings.Update.Version(currentVersion ?? "unknown")}
            subTitle={
              checkingUpdate
                ? Locale.Settings.Update.IsChecking
                : hasNewVersion
                ? Locale.Settings.Update.FoundUpdate(remoteId ?? "ERROR")
                : Locale.Settings.Update.IsLatest
            }
          >
            {checkingUpdate ? (
              <LoadingIcon />
            ) : hasNewVersion ? (
              <Link href={updateUrl} target="_blank" className="link">
                {Locale.Settings.Update.GoToUpdate}
              </Link>
            ) : (
              <IconButton
                icon={<ResetIcon></ResetIcon>}
                text={Locale.Settings.Update.CheckUpdate}
                onClick={() => checkUpdate(true)}
              />
            )}
          </ListItem> */}

          <ListItem title={Locale.Settings.SendKey}>
            <Select
              value={config.submitKey}
              onChange={(e) => {
                updateConfig(
                  (config) =>
                    (config.submitKey = e.target.value as any as SubmitKey),
                );
              }}
            >
              {Object.values(SubmitKey).map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </Select>
          </ListItem>

          <ListItem title={Locale.Settings.Theme}>
            <Select
              value={config.theme}
              onChange={(e) => {
                updateConfig(
                  (config) => (config.theme = e.target.value as any as Theme),
                );
              }}
            >
              {Object.values(Theme).map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </Select>
          </ListItem>

          <ListItem title={Locale.Settings.Lang.Name}>
            <Select
              value={getLang()}
              onChange={(e) => {
                changeLang(e.target.value as any);
              }}
            >
              {AllLangs.map((lang) => (
                <option value={lang} key={lang}>
                  {ALL_LANG_OPTIONS[lang]}
                </option>
              ))}
            </Select>
          </ListItem>

          <ListItem
            title={Locale.Settings.FontSize.Title}
            subTitle={Locale.Settings.FontSize.SubTitle}
          >
            <InputRange
              title={`${config.fontSize ?? 14}px`}
              value={config.fontSize}
              min="12"
              max="18"
              step="1"
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.fontSize = Number.parseInt(e.currentTarget.value)),
                )
              }
            ></InputRange>
          </ListItem>
          {/*
          <ListItem
            title={Locale.Settings.SendPreviewBubble.Title}
            subTitle={Locale.Settings.SendPreviewBubble.SubTitle}
          >
            <input
              type="checkbox"
              checked={config.sendPreviewBubble}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.sendPreviewBubble = e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem> */}
          {/*
          <ListItem
            title={Locale.Settings.Mask.Title}
            subTitle={Locale.Settings.Mask.SubTitle}
          >
            <input
              type="checkbox"
              checked={!config.dontShowMaskSplashScreen}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.dontShowMaskSplashScreen =
                      !e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem> */}
        </List>

        {/* <List>
          {showAccessCode ? (
            <ListItem
              title={Locale.Settings.AccessCode.Title}
              subTitle={Locale.Settings.AccessCode.SubTitle}
            >
              <PasswordInput
                value={accessStore.accessCode}
                type="text"
                placeholder={Locale.Settings.AccessCode.Placeholder}
                onChange={(e) => {
                  accessStore.updateCode(e.currentTarget.value);
                }}
              />
            </ListItem>
          ) : (
            <></>
          )} */}

        {/* {!accessStore.hideUserApiKey ? (
            <ListItem
              title={Locale.Settings.Token.Title}
              subTitle={Locale.Settings.Token.SubTitle}
            >
              <PasswordInput
                value={accessStore.token}
                type="text"
                placeholder={Locale.Settings.Token.Placeholder}
                onChange={(e) => {
                  accessStore.updateToken(e.currentTarget.value);
                }}
              />
            </ListItem>
          ) : null} */}
        {/*
          {!accessStore.hideBalanceQuery ? (
            <ListItem
              title={Locale.Settings.Usage.Title}
              subTitle={
                showUsage
                  ? loadingUsage
                    ? Locale.Settings.Usage.IsChecking
                    : Locale.Settings.Usage.SubTitle(
                        usage?.used ?? "[?]",
                        usage?.subscription ?? "[?]",
                      )
                  : Locale.Settings.Usage.NoAccess
              }
            >
              {!showUsage || loadingUsage ? (
                <div />
              ) : (
                <IconButton
                  icon={<ResetIcon></ResetIcon>}
                  text={Locale.Settings.Usage.Check}
                  onClick={() => checkUsage(true)}
                />
              )}
            </ListItem>
          ) : null}

          {!accessStore.hideUserApiKey ? (
            <ListItem
              title={Locale.Settings.Endpoint.Title}
              subTitle={Locale.Settings.Endpoint.SubTitle}
            >
              <input
                type="text"
                value={accessStore.openaiUrl}
                placeholder="https://api.openai.com/"
                onChange={(e) =>
                  accessStore.updateOpenAiUrl(e.currentTarget.value)
                }
              ></input>
            </ListItem>
          ) : null}
        </List> */}

        <List>
          <ListItem
            title={Locale.Settings.Prompt.Disable.Title}
            subTitle={Locale.Settings.Prompt.Disable.SubTitle}
          >
            <input
              type="checkbox"
              checked={config.disablePromptHint}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.disablePromptHint = e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>

          <ListItem
            title={Locale.Settings.Prompt.List}
            subTitle={Locale.Settings.Prompt.ListCount(
              builtinCount,
              customCount,
            )}
          >
            <IconButton
              icon={<EditIcon />}
              text={Locale.Settings.Prompt.Edit}
              onClick={() => setShowPromptModal(true)}
            />
          </ListItem>
        </List>

        <SyncItems />

        <List>
          <ModelConfigList
            modelConfig={config.modelConfig}
            updateConfig={(updater) => {
              const modelConfig = { ...config.modelConfig };
              updater(modelConfig);
              config.update((config) => (config.modelConfig = modelConfig));
            }}
          />
        </List>

        <List>
          <ListItem
            title={Locale.Settings.Version.Title}
            subTitle={Locale.Settings.Version.SubTitle}
          >
            <span>v0.8</span>
          </ListItem>
        </List>

        {shouldShowPromptModal && (
          <UserPromptModal onClose={() => setShowPromptModal(false)} />
        )}

        <DangerItems />
      </div>
    </ErrorBoundary>
  );
}
