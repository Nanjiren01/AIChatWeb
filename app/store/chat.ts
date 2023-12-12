import { trimTopic } from "../utils";

import Locale, { getLang } from "../locales";
import { showToast } from "../components/ui-lib";
import { ModelConfig, ModelType, useAppConfig } from "./config";
import { createEmptyMask, Mask, RemoteMask } from "./mask";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_SYSTEM_TEMPLATE,
  KnowledgeCutOffDate,
  StoreKey,
  SUMMARIZE_MODEL,
} from "../constant";
import { api, ChatSubmitResult, RequestMessage } from "../client/api";
import { ChatControllerPool } from "../client/controller";
import { prettyObject } from "../utils/format";
import { estimateTokenLength } from "../utils/token";
import { nanoid } from "nanoid";
import { createPersistStore } from "../utils/store";
import { AiPlugin, WebsiteConfigStore } from "./website";
import { AuthStore, useAuthStore } from "./auth";

export interface ChatToolMessage {
  toolName: string;
  toolInput?: string;
}

export type ChatMessage = RequestMessage & {
  uuid?: string;
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id: string;
  model?: ModelType;
  toolMessages?: ChatToolMessage[];
  attr?: any;
};

export interface MessageEntity {
  uuid: string;
  id: string;
  role: string;
  content: string;
  contentStruct: string;
  date: string;
  state: number;
  order: number;
}

export interface SessionEntity {
  uuid: string;
  userId: number;
  id: string;
  topic: string;
  messageStruct: string;
  lastSummarizeIndex: number;
  lastUpdate: number;
  mask: RemoteMask;
  stat: ChatStat;
}

import { Response } from "../api/common";
export type SessionCreateResponse = Response<SessionEntity>;

type SessionMessageQueryResponse = Response<any>;

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
  return {
    id: nanoid(),
    date: new Date().toLocaleString(),
    role: "user",
    content: "",
    toolMessages: [] as ChatToolMessage[],
    attr: {},
    ...override,
  };
}

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

export interface ChatSession {
  uuid?: string;
  id: string;
  topic: string;

  memoryPrompt: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number;

  mask: Mask;
}

export const DEFAULT_TOPIC = Locale.Store.DefaultTopic;
export const BOT_HELLO: ChatMessage = createMessage({
  role: "assistant",
  content: Locale.Store.BotHello,
  toolMessages: [] as ChatToolMessage[],
});

function createEmptySession(): ChatSession {
  return {
    id: nanoid(),
    topic: DEFAULT_TOPIC,
    memoryPrompt: "",
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: Date.now(),
    lastSummarizeIndex: 0,

    mask: createEmptyMask(),
  };
}

function getSummarizeModel(currentModel: string) {
  // if it is using gpt-* models, force to use 3.5 to summarize
  return currentModel.startsWith("gpt") ? SUMMARIZE_MODEL : currentModel;
}

export interface PluginActionModel {
  plugin: AiPlugin;
  value: boolean;
}

function countMessages(msgs: ChatMessage[]) {
  return msgs.reduce((pre, cur) => pre + estimateTokenLength(cur.content), 0);
}

function fillTemplateWith(input: string, modelConfig: ModelConfig) {
  let cutoff =
    KnowledgeCutOffDate[modelConfig.model] ?? KnowledgeCutOffDate.default;

  const vars = {
    cutoff,
    model: modelConfig.model,
    time: new Date().toLocaleString(),
    lang: getLang(),
    input: input,
  };

  let output = modelConfig.template ?? DEFAULT_INPUT_TEMPLATE;

  // must contains {{input}}
  const inputVar = "{{input}}";
  if (!output.includes(inputVar)) {
    output += "\n" + inputVar;
  }

  Object.entries(vars).forEach(([name, value]) => {
    output = output.replaceAll(`{{${name}}}`, value);
  });

  return output;
}

const DEFAULT_CHAT_STATE = {
  sessions: [createEmptySession()],
  currentSessionIndex: 0,
};

export const useChatStore = createPersistStore(
  DEFAULT_CHAT_STATE,
  (set, _get) => {
    function get() {
      return {
        ..._get(),
        ...methods,
      };
    }

    const methods = {
      clearSessions() {
        set(() => ({
          sessions: [createEmptySession()],
          currentSessionIndex: 0,
        }));
      },

      selectSession(index: number) {
        set({
          currentSessionIndex: index,
        });
      },

      moveSession(from: number, to: number) {
        set((state) => {
          const { sessions, currentSessionIndex: oldIndex } = state;

          // move the session
          const newSessions = [...sessions];
          const session = newSessions[from];
          newSessions.splice(from, 1);
          newSessions.splice(to, 0, session);

          // modify current session id
          let newIndex = oldIndex === from ? to : oldIndex;
          if (oldIndex > from && oldIndex <= to) {
            newIndex -= 1;
          } else if (oldIndex < from && oldIndex >= to) {
            newIndex += 1;
          }

          return {
            currentSessionIndex: newIndex,
            sessions: newSessions,
          };
        });
      },

      newSession(
        token: string,
        logout: () => void,
        mask?: Mask,
        callback?: (session: ChatSession) => void,
      ) {
        const session = createEmptySession();

        if (mask) {
          const config = useAppConfig.getState();
          const globalModelConfig = config.modelConfig;

          session.mask = {
            ...mask,
            modelConfig: {
              ...globalModelConfig,
              ...mask.modelConfig,
            },
          };
          session.topic = mask.name;
        } else {
          session.topic = "新的聊天";
        }

        const url = "/session";
        const BASE_URL = process.env.BASE_URL;
        const mode = process.env.BUILD_MODE;
        let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
        return fetch(requestUrl, {
          method: "post",
          headers: {
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            id: session.id,
            topic: session.topic,
            lastUpdate: session.lastUpdate,
            lastSummarizeIndex: session.lastSummarizeIndex,
            maskJson: JSON.stringify(session.mask),
            statJson: JSON.stringify(session.stat),
          }),
        })
          .then((res) => res.json())
          .then((res: SessionCreateResponse) => {
            console.log("[SessionEntity] create session", res);
            if (res.code !== 0) {
              if (Math.floor(res.code / 100) === 100) {
                logout();
              }
              showToast(res.message);
              return false;
            }
            const sessionEntity = res.data;
            session.uuid = sessionEntity.uuid;

            if (callback) {
              callback(session);
            } else {
              set((state) => ({
                currentSessionIndex: 0,
                sessions: [session].concat(state.sessions),
              }));
            }

            return session;
          })
          .catch((e) => {
            console.error("[SessionEntity] failed to create session", e);
            return false;
          });
      },

      nextSession(delta: number) {
        const n = get().sessions.length;
        const limit = (x: number) => (x + n) % n;
        const i = get().currentSessionIndex;
        get().selectSession(limit(i + delta));
      },

      async deleteSession(index: number, token: string, logout: () => void) {
        const deletingLastSession = get().sessions.length === 1;
        const deletedSession = get().sessions.at(index);

        if (!deletedSession) return;

        const deleteRemoteSession = (session: ChatSession) => {
          const url = "/session/" + session.uuid;
          const BASE_URL = process.env.BASE_URL;
          const mode = process.env.BUILD_MODE;
          let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
          return fetch(requestUrl, {
            method: "delete",
            headers: {
              Authorization: "Bearer " + token,
            },
          })
            .then((res) => res.json())
            .then((res: Response<any>) => {
              console.log("[deleteRemoteSession] get messages", res);
              if (res.code !== 0) {
                showToast(res.message);
                return false;
              }
              return res;
            })
            .catch((e) => {
              console.error("[deleteRemoteSession] failed to get messages", e);
              return false;
            });
        };

        const deleteLocalSession = async () => {
          const sessions = get().sessions.slice();
          sessions.splice(index, 1);

          const currentIndex = get().currentSessionIndex;
          let nextIndex = Math.min(
            currentIndex - Number(index < currentIndex),
            sessions.length - 1,
          );

          if (deletingLastSession) {
            nextIndex = 0;
            const result = await this.newSession(
              token,
              logout,
              undefined,
              (session) => {},
            );
            if (result === false) {
              return false;
            }
            sessions.push(result as ChatSession);
          }

          // for undo delete action
          const restoreState = {
            currentSessionIndex: get().currentSessionIndex,
            sessions: get().sessions.slice(),
          };

          set(() => ({
            currentSessionIndex: nextIndex,
            sessions,
          }));
          showToast(
            Locale.Home.DeleteToast,
            {
              text: Locale.Home.Revert,
              onClick() {
                set(() => restoreState);
              },
            },
            5000,
          );
        };

        if (deletedSession.uuid) {
          const result = await deleteRemoteSession(deletedSession);
          if (result) {
            await deleteLocalSession();
          }
        } else {
          await deleteLocalSession();
        }
      },

      currentSession() {
        let index = get().currentSessionIndex;
        const sessions = get().sessions;

        if (index < 0 || index >= sessions.length) {
          index = Math.min(sessions.length - 1, Math.max(0, index));
          set(() => ({ currentSessionIndex: index }));
        }

        const session = sessions[index];

        return session;
      },

      onNewMessage(message: ChatMessage) {
        get().updateCurrentSession((session) => {
          session.messages = session.messages.concat();
          session.lastUpdate = Date.now();
        });
        get().updateStat(message);
        get().summarizeSession();
      },

      async onUserInput(
        session: ChatSession,
        content: string,
        plugins: PluginActionModel[],
        imageMode: string,
        baseImages: any[],
        websiteConfigStore: WebsiteConfigStore,
        authStore: AuthStore,
        mask: Mask,
        resend: boolean,
        token: string,
        navigateToLogin: () => void,
      ) {
        // const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;
        const sensitiveWordsTip = websiteConfigStore.sensitiveWordsTip;
        const balanceNotEnough = websiteConfigStore.balanceNotEnough;

        let userContent: string;
        if (imageMode && (baseImages?.length ?? 0) > 0) {
          if (imageMode === "IMAGINE") {
            userContent = content;
          } else {
            // DESCRIBE || BLEND
            userContent = `${imageMode}`;
            baseImages.forEach((img: any, index: number) => {
              userContent += `::[${index + 1}]${img.filename}`;
            });
          }
        } else {
          userContent = fillTemplateWith(content, modelConfig);
          console.log("[User Input] after template: ", userContent);
        }

        const userMessage: ChatMessage = createMessage({
          role: "user",
          content: userContent,
        });
        userMessage.attr.imageMode = imageMode;
        userMessage.attr.baseImages = baseImages;

        const botMessage: ChatMessage = createMessage({
          role: "assistant",
          streaming: true,
          model: modelConfig.model,
          toolMessages: [] as ChatToolMessage[],
        });
        botMessage.attr.contentType = session.mask?.modelConfig?.contentType;

        // get recent messages
        const recentMessages = get().getMessagesWithMemory(websiteConfigStore);
        const sendMessages = recentMessages.concat(userMessage);
        const messageIndex = get().currentSession().messages.length + 1;

        // save user's and bot's message
        get().updateCurrentSession((session) => {
          const savedUserMessage = {
            ...userMessage,
            content: userContent,
          };
          session.messages = session.messages.concat([
            savedUserMessage,
            botMessage,
          ]);
        });

        const fetchServerMessageId = this.fetchServerMessageId;

        // make request
        return api.llm.chat({
          sessionUuid: session.uuid, // 携带上session uuuid，系统才会云同步
          messages: sendMessages,
          userMessage: userMessage,
          botMessage: botMessage,
          content: userContent,
          config: { ...modelConfig, stream: true },
          plugins: plugins,
          mask,
          resend,
          imageMode,
          baseImages,
          onUpdate(message) {
            console.log("onUpdate", message);
            botMessage.streaming = true;
            if (message) {
              botMessage.content = message;
            }
            get().updateCurrentSession((session) => {
              session.messages = session.messages.concat();
            });
          },
          onToolUpdate(toolName, toolInput) {
            botMessage.streaming = true;
            if (toolName && toolInput) {
              botMessage.toolMessages!.push({
                toolName,
                toolInput,
              });
            }
            get().updateCurrentSession((session) => {
              session.messages = session.messages.concat();
            });
          },
          onFinish(message) {
            console.log("onFinish", message);
            botMessage.streaming = false;
            let logout = false;
            if (message) {
              try {
                let jsonContent = JSON.parse(message);
                if (jsonContent && jsonContent.code === 10302) {
                  // 敏感词判断
                  message = sensitiveWordsTip
                    ? sensitiveWordsTip.replace(
                        "${question}",
                        jsonContent.message,
                      )
                    : Locale.Chat.SensitiveWordsTip(jsonContent.message);
                } else if (jsonContent && jsonContent.code === 10401) {
                  message = balanceNotEnough
                    ? balanceNotEnough
                    : Locale.Chat.BalanceNotEnough;
                } else if (
                  jsonContent &&
                  (jsonContent.code === 10001 || jsonContent.code === 10002)
                ) {
                  logout = true;
                  authStore.removeToken();
                  message = Locale.Error.Unauthorized;
                } else if (jsonContent?.code === 10301) {
                  message = Locale.Chat.TooFrequently;
                } else {
                  message = prettyObject(jsonContent);
                }
              } catch (e) {
                // ignore
              }
              botMessage.content = message;
              if (session.uuid) {
                setTimeout(() => {
                  fetchServerMessageId(
                    session,
                    [userMessage, botMessage],
                    token,
                  );
                }, 2000);
              }
              get().onNewMessage(botMessage);
            }
            ChatControllerPool.remove(session.id, botMessage.id);
            if (logout) {
              navigateToLogin();
            }
          },
          onError(error) {
            const isAborted = error.message.includes("aborted");
            botMessage.content +=
              "\n\n" +
              prettyObject({
                error: true,
                message: error.message,
              });
            botMessage.streaming = false;
            userMessage.isError = !isAborted;
            botMessage.isError = !isAborted;
            get().updateCurrentSession((session) => {
              session.messages = session.messages.concat();
            });
            ChatControllerPool.remove(
              session.id,
              botMessage.id ?? messageIndex,
            );

            console.error("[Chat] failed ", error);
          },
          onController(controller) {
            // collect controller for stop/retry
            ChatControllerPool.addController(
              session.id,
              botMessage.id ?? messageIndex,
              controller,
            );
          },
        });
      },

      fetchServerMessageId(
        session: ChatSession,
        messages: ChatMessage[],
        token: string,
      ) {
        const url = "/session/message/query";
        const BASE_URL = process.env.BASE_URL;
        const mode = process.env.BUILD_MODE;
        let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
        return fetch(requestUrl, {
          method: "post",
          headers: {
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            ids: session.messages.filter((m) => !m.uuid).map((m) => m.id),
          }),
        })
          .then((res) => res.json())
          .then((res: SessionMessageQueryResponse) => {
            console.log("[fetchServerMessageId] get messages", res);
            if (res.code !== 0) {
              showToast(res.message);
              return false;
            }
            const map = res.data;
            for (let id in map) {
              const msg = map[id];
              const message = session.messages.find((m) => m.id === id);
              if (message) {
                message.uuid = msg.uuid;
                console.log("set message uuid=" + msg.uuid);
              }
            }
            get().updateCurrentSession((session) => {
              session.messages = session.messages.concat();
            });
            return res;
          })
          .catch((e) => {
            console.error("[fetchServerMessageId] failed to get messages", e);
          });
      },

      async getDrawTaskProgress(
        message: ChatMessage,
        websiteConfigStore: WebsiteConfigStore,
        authStore: AuthStore,
      ) {
        const botMessage = message;
        const sensitiveWordsTip = websiteConfigStore.sensitiveWordsTip;
        const balanceNotEnough = websiteConfigStore.balanceNotEnough;
        return api.llm.fetchDrawStatus(
          (message) => {
            botMessage.streaming = true;
            if (message) {
              botMessage.content = message;
            }
            get().updateCurrentSession((session) => {
              session.messages = session.messages.concat();
            });
          },
          (message) => {
            botMessage.streaming = false;
            //let logout = false;
            if (message) {
              try {
                let jsonContent = JSON.parse(message);
                if (jsonContent && jsonContent.code === 10302) {
                  // 敏感词判断
                  message = sensitiveWordsTip
                    ? sensitiveWordsTip.replace(
                        "${question}",
                        jsonContent.message,
                      )
                    : Locale.Chat.SensitiveWordsTip(jsonContent.message);
                } else if (jsonContent && jsonContent.code === 10401) {
                  message = balanceNotEnough
                    ? balanceNotEnough
                    : Locale.Chat.BalanceNotEnough;
                } else if (
                  jsonContent &&
                  (jsonContent.code === 10001 || jsonContent.code === 10002)
                ) {
                  //logout = true;
                  authStore.removeToken();
                  message = Locale.Error.Unauthorized;
                } else if (jsonContent?.code === 10301) {
                  message = Locale.Chat.TooFrequently;
                } else {
                  message = prettyObject(jsonContent);
                }
              } catch (e) {
                // ignore
              }
              botMessage.content = message;
              get().onNewMessage(botMessage);
            }
            // ChatControllerPool.remove(
            //   sessionIndex,
            //   botMessage.id ?? messageIndex,
            // );
            // if (logout) {
            //   navigateToLogin();
            // }
          },
          botMessage,
        );
      },

      getMemoryPrompt() {
        const session = get().currentSession();

        return {
          role: "system",
          content:
            session.memoryPrompt.length > 0
              ? Locale.Store.Prompt.History(session.memoryPrompt)
              : "",
          date: "",
        } as ChatMessage;
      },

      getMessagesWithMemory(websiteConfigStore: WebsiteConfigStore) {
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;
        const clearContextIndex = session.clearContextIndex ?? 0;
        const messages = session.messages.slice();
        const totalMessageCount = session.messages.length;

        // in-context prompts
        const contextPrompts = session.mask.context.slice();

        // system prompts, to get close to OpenAI Web ChatGPT
        const shouldInjectSystemPrompts = modelConfig.enableInjectSystemPrompts;
        const systemPrompts = shouldInjectSystemPrompts
          ? [
              createMessage({
                role: "system",
                content: fillTemplateWith("", {
                  ...modelConfig,
                  template:
                    websiteConfigStore.defaultSystemTemplate ??
                    DEFAULT_SYSTEM_TEMPLATE,
                }),
              }),
            ]
          : [];
        if (shouldInjectSystemPrompts) {
          console.log(
            "[Global System Prompt] ",
            systemPrompts.at(0)?.content ?? "empty",
          );
        }

        // long term memory
        const shouldSendLongTermMemory =
          modelConfig.sendMemory &&
          session.memoryPrompt &&
          session.memoryPrompt.length > 0 &&
          session.lastSummarizeIndex > clearContextIndex;
        const longTermMemoryPrompts = shouldSendLongTermMemory
          ? [get().getMemoryPrompt()]
          : [];
        const longTermMemoryStartIndex = session.lastSummarizeIndex;

        // short term memory
        const shortTermMemoryStartIndex = Math.max(
          0,
          totalMessageCount - modelConfig.historyMessageCount,
        );

        // lets concat send messages, including 4 parts:
        // 0. system prompt: to get close to OpenAI Web ChatGPT
        // 1. long term memory: summarized memory messages
        // 2. pre-defined in-context prompts
        // 3. short term memory: latest n messages
        // 4. newest input message
        const memoryStartIndex = shouldSendLongTermMemory
          ? Math.min(longTermMemoryStartIndex, shortTermMemoryStartIndex)
          : shortTermMemoryStartIndex;
        // and if user has cleared history messages, we should exclude the memory too.
        const contextStartIndex = Math.max(clearContextIndex, memoryStartIndex);
        const maxTokenThreshold = modelConfig.max_tokens;

        // get recent messages as much as possible
        const reversedRecentMessages = [];
        for (
          let i = totalMessageCount - 1, tokenCount = 0;
          i >= contextStartIndex && tokenCount < maxTokenThreshold;
          i -= 1
        ) {
          const msg = messages[i];
          if (!msg || msg.isError) continue;
          tokenCount += estimateTokenLength(msg.content);
          reversedRecentMessages.push(msg);
        }

        // concat all messages
        const recentMessages = [
          ...systemPrompts,
          ...longTermMemoryPrompts,
          ...contextPrompts,
          ...reversedRecentMessages.reverse(),
        ];

        return recentMessages;
      },

      updateMessage(
        sessionIndex: number,
        messageIndex: number,
        updater: (message?: ChatMessage) => void,
      ) {
        const sessions = get().sessions;
        const session = sessions.at(sessionIndex);
        const messages = session?.messages;
        updater(messages?.at(messageIndex));
        set(() => ({ sessions }));
      },

      resetSession() {
        get().updateCurrentSession((session) => {
          session.messages = [];
          session.memoryPrompt = "";
        });
      },

      summarizeSession() {
        const config = useAppConfig.getState();
        const session = get().currentSession();
        if (session.mask.modelConfig?.contentType !== "Text") {
          return;
        }

        // remove error messages if any
        const messages = session.messages;

        // should summarize topic after chating more than 50 words
        const SUMMARIZE_MIN_LEN = 50;
        if (
          config.enableAutoGenerateTitle &&
          session.topic === DEFAULT_TOPIC &&
          countMessages(messages) >= SUMMARIZE_MIN_LEN
        ) {
          const content = Locale.Store.Prompt.Topic;
          const topicMessages = messages.concat(
            createMessage({
              role: "user",
              content,
            }),
          );
          api.llm.chat({
            messages: topicMessages,
            botMessage: topicMessages[topicMessages.length - 1],
            content,
            plugins: [],
            mask: null,
            resend: false,
            imageMode: "",
            baseImages: [],
            config: {
              model: getSummarizeModel(session.mask.modelConfig.model),
            },
            onFinish(message) {
              get().updateCurrentSession(
                (session) =>
                  (session.topic =
                    message.length > 0 ? trimTopic(message) : DEFAULT_TOPIC),
              );
            },
          });
        }

        const modelConfig = session.mask.modelConfig;
        const summarizeIndex = Math.max(
          session.lastSummarizeIndex,
          session.clearContextIndex ?? 0,
        );
        let toBeSummarizedMsgs = messages
          .filter((msg) => !msg.isError)
          .slice(summarizeIndex);

        const historyMsgLength = countMessages(toBeSummarizedMsgs);

        if (historyMsgLength > modelConfig?.max_tokens ?? 4000) {
          const n = toBeSummarizedMsgs.length;
          toBeSummarizedMsgs = toBeSummarizedMsgs.slice(
            Math.max(0, n - modelConfig.historyMessageCount),
          );
        }

        // add memory prompt
        toBeSummarizedMsgs.unshift(get().getMemoryPrompt());

        const lastSummarizeIndex = session.messages.length;

        console.log(
          "[Chat History] ",
          toBeSummarizedMsgs,
          historyMsgLength,
          modelConfig.compressMessageLengthThreshold,
        );

        if (
          historyMsgLength > modelConfig.compressMessageLengthThreshold &&
          modelConfig.sendMemory
        ) {
          const content = Locale.Store.Prompt.Summarize;
          api.llm.chat({
            messages: toBeSummarizedMsgs.concat(
              createMessage({
                role: "system",
                content,
                date: "",
              }),
            ),
            botMessage: toBeSummarizedMsgs[toBeSummarizedMsgs.length - 1],
            content,
            plugins: [],
            mask: null,
            resend: false,
            imageMode: "",
            baseImages: [],
            config: {
              ...modelConfig,
              stream: true,
              model: getSummarizeModel(session.mask.modelConfig.model),
            },
            onUpdate(message) {
              session.memoryPrompt = message;
            },
            onFinish(message) {
              console.log("[Memory] ", message);
              session.lastSummarizeIndex = lastSummarizeIndex;
            },
            onError(err) {
              console.error("[Summarize] ", err);
            },
          });
        }
      },

      updateStat(message: ChatMessage) {
        get().updateCurrentSession((session) => {
          session.stat.charCount += message.content.length;
          // TODO: should update chat count and word count
        });
      },

      deleteMessageInCurrentSession(message: ChatMessage, token: string) {
        if (!message.uuid) {
          this.updateCurrentSession((session) => {
            session.messages = session.messages.filter(
              (m) => m.id !== message.id,
            );
          });
          return true;
        }
        // const sessions = get().sessions;
        // const index = get().currentSessionIndex;
        // const session = sessions[index]

        const url = "/session/message/" + message.uuid;
        const BASE_URL = process.env.BASE_URL;
        const mode = process.env.BUILD_MODE;
        let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
        return fetch(requestUrl, {
          method: "delete",
          headers: {
            Authorization: "Bearer " + token,
          },
        })
          .then((res) => res.json())
          .then((res: Response<any>) => {
            console.log("[SessionEntity] delete session message", res);
            if (res.code !== 0) {
              showToast(res.message);
              return false;
            }
            this.updateCurrentSession((session) => {
              session.messages = session.messages.filter(
                (m) => m.id !== message.id,
              );
            });
          })
          .catch((e) => {
            console.error(
              "[SessionEntity] failed to delete session message",
              e,
            );
          });
      },

      updateCurrentSessionTopic(
        topic: string,
        token: string,
        logout: () => void,
      ) {
        const sessions = get().sessions;
        const index = get().currentSessionIndex;
        const session = sessions[index];

        if (!session.uuid) {
          console.log(
            "session.uuid is empty, just change local topic",
            session,
          );
          session.topic = topic;
          set(() => ({ sessions }));
          return Promise.resolve(true);
        }

        const url = "/session";
        const BASE_URL = process.env.BASE_URL;
        const mode = process.env.BUILD_MODE;
        let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
        return fetch(requestUrl, {
          method: "put",
          headers: {
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            uuid: session.uuid,
            topic: topic,
          }),
        })
          .then((res) => res.json())
          .then((res: Response<any>) => {
            console.log("[SessionEntity] update session topic", res);
            if (res.code !== 0) {
              showToast(res.message);
              return false;
            }
            session.topic = topic;
            set(() => ({ sessions }));
            return true;
          })
          .catch((e) => {
            console.error("[SessionEntity] failed to update session topic", e);
            return false;
          });
      },

      // 仅更新某个message的content字段，可能是面具中的
      updateCurrentSessionMessageContent(
        message: ChatMessage,
        token: string,
        logout: () => void,
      ) {
        const sessions = get().sessions;
        const index = get().currentSessionIndex;
        const session = sessions[index];
        let msg = session.mask.context.find((m) => m.id === message.id);

        if (msg) {
          // 面具中的
          if (!session.uuid) {
            msg.content = message.content;
            set(() => ({ sessions }));
            return Promise.resolve(true);
          }
          // todo 更新服务器的面具
        }

        msg = session.messages.find((m) => m.id === message.id);
        if (!msg) {
          console.warn("can not find the msg by id", message.id);
          return Promise.resolve(true);
        }

        if (!session.uuid) {
          msg.content = message.content;
          set(() => ({ sessions }));
          return Promise.resolve(true);
        }
        const url = "/session/message";
        const BASE_URL = process.env.BASE_URL;
        const mode = process.env.BUILD_MODE;
        let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
        return fetch(requestUrl, {
          method: "put",
          headers: {
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            sessionUuid: session.uuid,
            messages: [
              {
                uuid: msg.uuid,
                // role: msg.role,
                content: message.content,
              },
            ],
          }),
        })
          .then((res) => res.json())
          .then((res: Response<any>) => {
            console.log("[SessionEntity] update session message", res);
            if (res.code !== 0) {
              showToast(res.message);
              return false;
            }
            // console.log(JSON.stringify(session))
            msg!.content = message.content;
            set(() => ({ sessions }));
            return true;
          })
          .catch((e) => {
            console.error(
              "[SessionEntity] failed to update session message",
              e,
            );
            return false;
          });
        // chatStore.updateCurrentSession((session) => {
        //   const m = session.mask.context
        //     .concat(session.messages)
        //     .find((m) => m.id === message.id);
        //   if (m) {
        //     m.content = newMessage;
        //   }
        // });
      },

      // 全量更新，messages不是面具中的
      updateCurrentSessionMessages(
        messages: ChatMessage[],
        token: string,
        logout: () => void,
      ) {
        const sessions = get().sessions;
        const index = get().currentSessionIndex;
        const session = sessions[index];

        if (!session.uuid) {
          console.log(
            "session.uuid is empty, just change local messages",
            session,
          );
          session.messages = messages;
          set(() => ({ sessions }));
          return Promise.resolve(true);
        }

        const url = "/session/message";
        const BASE_URL = process.env.BASE_URL;
        const mode = process.env.BUILD_MODE;
        let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
        return fetch(requestUrl, {
          method: "put",
          headers: {
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            sessionUuid: session.uuid,
            all: true,
            messages: messages.map((m) => {
              return {
                uuid: m.uuid,
                id: m.id,
                role: m.role,
                content: m.content,
              };
            }),
          }),
        })
          .then((res) => res.json())
          .then((res: Response<any>) => {
            console.log("[SessionEntity] update session messages", res);
            if (res.code !== 0) {
              showToast(res.message);
              return false;
            }
            messages.forEach((message) => {
              if (message.uuid) {
                return;
              }
              const msg = res.data.find((m: any) => m.id === message.id);
              if (msg) {
                message.uuid = msg.uuid;
              }
            });
            session.messages = messages;
            set(() => ({ sessions }));
            return true;
          })
          .catch((e) => {
            console.error(
              "[SessionEntity] failed to update session messages",
              e,
            );
            return false;
          });
      },

      updateCurrentSessionClearContextIndex(token: string, logout: () => void) {
        const sessions = get().sessions;
        const index = get().currentSessionIndex;
        const session = sessions[index];

        const newValue =
          session.clearContextIndex === session.messages.length
            ? -1
            : session.messages.length;

        if (!session.uuid) {
          this.updateCurrentSession((session) => {
            if (newValue === -1) {
              session.clearContextIndex = undefined;
            } else {
              session.clearContextIndex = newValue;
              session.memoryPrompt = ""; // will clear memory
            }
          });
          return Promise.resolve(true);
        }

        const url = "/session";
        const BASE_URL = process.env.BASE_URL;
        const mode = process.env.BUILD_MODE;
        let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
        return fetch(requestUrl, {
          method: "put",
          headers: {
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            uuid: session.uuid,
            clearContextIndex: newValue,
          }),
        })
          .then((res) => res.json())
          .then((res: Response<any>) => {
            console.log("[SessionEntity] update session messages", res);
            if (res.code !== 0) {
              showToast(res.message);
              return false;
            }
            if (newValue === -1) {
              session.clearContextIndex = undefined;
            } else {
              session.clearContextIndex = newValue;
              session.memoryPrompt = ""; // will clear memory
            }
            set(() => ({ sessions }));
            return true;
          })
          .catch((e) => {
            console.error(
              "[SessionEntity] failed to update session messages",
              e,
            );
            return false;
          });
      },

      updateCurrentSession(updater: (session: ChatSession) => void) {
        const sessions = get().sessions;
        const index = get().currentSessionIndex;
        updater(sessions[index]);
        set(() => ({ sessions }));
      },

      clearAllData() {
        localStorage.clear();
        location.reload();
      },
    };

    return methods;
  },
  {
    name: StoreKey.Chat,
    version: 3.1,
    migrate(persistedState, version) {
      const state = persistedState as any;
      const newState = JSON.parse(
        JSON.stringify(state),
      ) as typeof DEFAULT_CHAT_STATE;

      if (version < 2) {
        newState.sessions = [];

        const oldSessions = state.sessions;
        for (const oldSession of oldSessions) {
          const newSession = createEmptySession();
          newSession.topic = oldSession.topic;
          newSession.messages = [...oldSession.messages];
          newSession.mask.modelConfig.sendMemory = true;
          newSession.mask.modelConfig.historyMessageCount = 4;
          newSession.mask.modelConfig.compressMessageLengthThreshold = 1000;
          newState.sessions.push(newSession);
        }
      }

      if (version < 3) {
        // migrate id to nanoid
        newState.sessions.forEach((s) => {
          s.id = nanoid();
          s.messages.forEach((m) => (m.id = nanoid()));
        });
      }

      // Enable `enableInjectSystemPrompts` attribute for old sessions.
      // Resolve issue of old sessions not automatically enabling.
      if (version < 3.1) {
        newState.sessions.forEach((s) => {
          if (
            // Exclude those already set by user
            !s.mask.modelConfig.hasOwnProperty("enableInjectSystemPrompts")
          ) {
            // Because users may have changed this configuration,
            // the user's current configuration is used instead of the default
            const config = useAppConfig.getState();
            s.mask.modelConfig.enableInjectSystemPrompts =
              config.modelConfig.enableInjectSystemPrompts;
          }
        });
      }

      return newState as any;
    },
  },
);
