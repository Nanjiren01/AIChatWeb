import {
  ApiPath,
  DEFAULT_API_HOST,
  DEFAULT_MODELS,
  OpenaiPath,
  REQUEST_TIMEOUT_MS,
  ServiceProvider,
} from "@/app/constant";
import {
  ChatMessage,
  useAccessStore,
  useAppConfig,
  useChatStore,
} from "@/app/store";

import {
  ChatOptions,
  ChatSubmitResult,
  getHeaders,
  LLMApi,
  LLMModel,
  LLMUsage,
} from "../api";
import Locale from "../../locales";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@fortaine/fetch-event-source";
import { toYYYYMMDD_HHMMSS } from "@/app/utils";
// import { prettyObject } from "@/app/utils/format";
import { getClientConfig } from "@/app/config/client";
import { makeAzurePath } from "@/app/azure";

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

export class ChatGPTApi implements LLMApi {
  private disableListModels = true;

  path(path: string): string {
    const BASE_URL = process.env.BASE_URL;
    const mode = process.env.BUILD_MODE;
    let baseUrl =
      mode === "export" ? (BASE_URL ?? DEFAULT_API_HOST) + "/api" : "/api";

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    return res.choices?.at(0)?.message?.content ?? "";
  }

  async chat(options: ChatOptions) {
    const plugins = options.plugins;
    const messages = options.messages.map((v) => ({
      role: v.role,
      content: v.content,
    }));

    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
        contentType: options.config.contentType,
      },
    };
    if (
      modelConfig.contentType === "Image" ||
      /^(UPSCALE|VARIATION|ZOOMOUT|PAN|SQUARE|BLEND|DESCRIBE|IMAGINE)::([\d\w]+)::/.test(
        options.content,
      )
    ) {
      const result = await this.handleDraw(options, modelConfig);
      return {
        userMessage: options.userMessage,
        botMessage: options.botMessage,
        fetch: result,
      };
    }

    const requestPayload = {
      messages,
      stream: options.config.stream,
      model: modelConfig.model,
      contentType: modelConfig.contentType || "Text",
      temperature: modelConfig.temperature,
      presence_penalty: modelConfig.presence_penalty,
      frequency_penalty: modelConfig.frequency_penalty,
      plugins: plugins.map((p) => {
        return {
          id: p.plugin.id,
          uuid: p.plugin.uuid,
          name: p.plugin.name,
          value: p.value,
        };
      }),
      top_p: modelConfig.top_p,
      // max_tokens: Math.max(modelConfig.max_tokens, 1024),
      // Please do not ask me why not send max_tokens, no reason, this param is just shit, I dont want to explain anymore.
      // baseUrl: useAccessStore.getState().openaiUrl,
      // maxIterations: options.agentConfig.maxIterations,
      // returnIntermediateSteps: options.agentConfig.returnIntermediateSteps,
      // useTools: options.agentConfig.useTools,
    };

    console.log("[Request] openai payload: ", requestPayload);

    const shouldStream = !!options.config.stream;
    console.log("shouldStream", shouldStream);
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const chatPath = this.path(OpenaiPath.ChatPath);
      console.log("chatPath", chatPath);
      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: getHeaders(),
      };

      // make a fetch request
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      if (shouldStream) {
        let responseText = "";
        let finished = false;

        const finish = () => {
          if (!finished) {
            options.onFinish(responseText);
            finished = true;
          }
        };

        controller.signal.onabort = finish;

        fetchEventSource(chatPath, {
          ...chatPayload,
          async onopen(res) {
            clearTimeout(requestTimeoutId);
            const contentType = res.headers.get("content-type");
            console.log(
              "[OpenAI] request response content type: ",
              contentType,
            );

            if (contentType?.startsWith("text/plain")) {
              responseText = await res.clone().text();
              return finish();
            }

            if (
              !res.ok ||
              !res.headers
                .get("content-type")
                ?.startsWith(EventStreamContentType) ||
              res.status !== 200
            ) {
              const responseTexts = [responseText];
              let extraInfo = await res.clone().text();
              // console.log('extraInfo', extraInfo)
              // try {
              //   const resJson = await res.clone().json();
              //   console.log('resJson', resJson)
              //   extraInfo = prettyObject(resJson);
              //   console.log('extraInfo', extraInfo)
              // } catch {}

              if (res.status === 401) {
                responseTexts.push(Locale.Error.Unauthorized);
              }

              if (extraInfo) {
                responseTexts.push(extraInfo);
              }

              responseText = responseTexts.join("\n\n");

              return finish();
            }
          },
          onmessage(msg) {
            console.log("msg", msg);
            if (msg.data === "[DONE]" || finished) {
              return finish();
            }
            const text = msg.data;
            if (text === "") {
              return;
            }
            try {
              const json = JSON.parse(text);
              if (json && json.isToolMessage) {
                if (!json.isSuccess) {
                  console.error("[Request]", msg.data);
                  responseText = msg.data;
                  throw Error(json.message);
                }
                options.onToolUpdate?.(json.toolName!, json.message);
                return;
              }
              if (json.choices) {
                const delta = (
                  json as {
                    choices: Array<{
                      delta: {
                        content: string;
                      };
                    }>;
                  }
                ).choices?.at(0)?.delta.content;
                if (delta) {
                  responseText += delta;
                  options.onUpdate?.(responseText, delta);
                }
              } else {
                responseText += json.message;
                options.onUpdate?.(responseText, json.message);
              }
            } catch (e) {
              console.error("[Request] parse error", text);
            }
          },
          onclose() {
            finish();
          },
          onerror(e) {
            options.onError?.(e);
            throw e;
          },
          openWhenHidden: true,
        });
      } else {
        const res = await fetch(chatPath, chatPayload);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
        const message = this.extractMessage(resJson);
        options.onFinish(message);
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error);
    }
  }
  async usage() {
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
        .getDate()
        .toString()
        .padStart(2, "0")}`;
    const ONE_DAY = 1 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = formatDate(startOfMonth);
    const endDate = formatDate(new Date(Date.now() + ONE_DAY));

    const [used, subs] = await Promise.all([
      fetch(
        this.path(
          `${OpenaiPath.UsagePath}?start_date=${startDate}&end_date=${endDate}`,
        ),
        {
          method: "GET",
          headers: getHeaders(),
        },
      ),
      fetch(this.path(OpenaiPath.SubsPath), {
        method: "GET",
        headers: getHeaders(),
      }),
    ]);

    if (used.status === 401) {
      throw new Error(Locale.Error.Unauthorized);
    }

    if (!used.ok || !subs.ok) {
      throw new Error("Failed to query usage from openai");
    }

    const response = (await used.json()) as {
      total_usage?: number;
      error?: {
        type: string;
        message: string;
      };
    };

    const total = (await subs.json()) as {
      hard_limit_usd?: number;
    };

    if (response.error && response.error.type) {
      throw Error(response.error.message);
    }

    if (response.total_usage) {
      response.total_usage = Math.round(response.total_usage) / 100;
    }

    if (total.hard_limit_usd) {
      total.hard_limit_usd = Math.round(total.hard_limit_usd * 100) / 100;
    }

    return {
      used: response.total_usage,
      total: total.hard_limit_usd,
    } as LLMUsage;
  }

  async models(): Promise<LLMModel[]> {
    if (this.disableListModels) {
      return DEFAULT_MODELS.slice();
    }

    const res = await fetch(this.path(OpenaiPath.ListModelPath), {
      method: "GET",
      headers: {
        ...getHeaders(),
      },
    });

    const resJson = (await res.json()) as OpenAIListModelResponse;
    const chatModels = resJson.data?.filter((m) => m.id.startsWith("gpt-"));
    console.log("[Models]", chatModels);

    if (!chatModels) {
      return [];
    }

    return chatModels.map((m) => ({
      name: m.id,
      available: true,
    }));
  }
  async handleDraw(options: ChatOptions, modelConfig: any): Promise<boolean> {
    options.onUpdate?.("请稍候……", "");
    const userMessage = options.userMessage;
    const botMessage = options.botMessage;
    const content = options.content;
    const startFn = async (): Promise<boolean> => {
      const prompt = content; // .substring(3).trim();
      let action: string = "IMAGINE";
      const firstSplitIndex = prompt.indexOf("::");
      if (options.imageMode) {
        action = options.imageMode; // IMAGINE | BLEND | DESCRIBE
      } else if (firstSplitIndex > 0) {
        action = prompt.substring(0, firstSplitIndex);
      }
      if (
        ![
          "UPSCALE",
          "VARIATION",
          "IMAGINE",
          "DESCRIBE",
          "BLEND",
          "REROLL",
          "ZOOMOUT",
          "PAN",
          "SQUARE",
          "VARY",
          "DESCRIBE",
          "BLEND",
        ].includes(action)
      ) {
        options.onFinish(Locale.Midjourney.TaskErrUnknownType);
        return false;
      }
      botMessage.attr.action = action;
      let actionIndex: any = null;
      let actionDirection: string | null = null;
      let actionStrength: string | null = null;
      let actionUseTaskId: any = null;
      let zoomRatio: any = null;
      if (action === "VARIATION" || action == "UPSCALE" || action == "REROLL") {
        actionIndex = parseInt(
          prompt.substring(firstSplitIndex + 2, firstSplitIndex + 3),
        );
        actionUseTaskId = prompt.substring(firstSplitIndex + 5);
      } else if (action === "ZOOMOUT") {
        const temp = prompt.substring(firstSplitIndex + 2);
        const index = temp.indexOf("::");
        zoomRatio = temp.substring(0, index);
        actionUseTaskId = temp.substring(index + 2);
      } else if (action == "PAN") {
        const temp = prompt.substring(firstSplitIndex + 2);
        const index = temp.indexOf("::");
        actionDirection = temp.substring(0, index);
        actionDirection = actionDirection.toLocaleLowerCase();
        actionUseTaskId = temp.substring(index + 2);
      } else if (action == "SQUARE") {
        // actionIndex没啥用
        actionIndex = parseInt(
          prompt.substring(firstSplitIndex + 2, firstSplitIndex + 3),
        );
        actionUseTaskId = prompt.substring(firstSplitIndex + 5);
      } else if (action == "VARY") {
        const temp = prompt.substring(firstSplitIndex + 2);
        const index = temp.indexOf("::");
        actionStrength = temp.substring(0, index);
        actionStrength = actionStrength.toLocaleLowerCase();
        actionUseTaskId = temp.substring(index + 2);
      }
      try {
        let res = null;
        const reqFn = (path: string, method: string, body?: any) => {
          const url = this.path(path);
          return fetch(url, {
            method: method,
            headers: getHeaders(),
            body: JSON.stringify({
              ...body,
              model: modelConfig.model,
            }),
          });
        };
        switch (action) {
          case "IMAGINE": {
            res = await reqFn("draw/imagine", "POST", {
              prompt: prompt,
              fileUuid: options.baseImages?.[0]?.uuid ?? null,
            });
            break;
          }
          case "DESCRIBE": {
            res = await reqFn("draw/describe", "POST", {
              fileUuid: options.baseImages[0].uuid,
            });
            break;
          }
          case "BLEND": {
            const fileUuidArray = options.baseImages.map((ui: any) => ui.uuid);
            res = await reqFn("draw/blend", "POST", {
              fileUuidArray,
            });
            botMessage.attr.prompt = prompt;
            break;
          }
          case "UPSCALE": {
            res = await reqFn("draw/upscale", "POST", {
              targetIndex: actionIndex,
              targetUuid: actionUseTaskId,
            });
            botMessage.attr.targetIndex = actionIndex;
            botMessage.attr.targetUuid = actionUseTaskId;
            break;
          }
          case "VARIATION": {
            res = await reqFn("draw/variation", "POST", {
              targetIndex: actionIndex,
              targetUuid: actionUseTaskId,
            });
            botMessage.attr.targetIndex = actionIndex;
            botMessage.attr.targetUuid = actionUseTaskId;
            break;
          }
          case "REROLL": {
            res = await reqFn("draw/reroll", "POST", {
              targetIndex: actionIndex,
              targetUuid: actionUseTaskId,
            });
            break;
          }
          case "ZOOMOUT": {
            res = await reqFn("draw/zoomOut", "POST", {
              zoomRatio: zoomRatio,
              targetUuid: actionUseTaskId,
            });
            botMessage.attr.zoomRatio = zoomRatio;
            botMessage.attr.targetUuid = actionUseTaskId;
            break;
          }
          case "PAN": {
            res = await reqFn("draw/pan", "POST", {
              panDirection: actionDirection,
              targetUuid: actionUseTaskId,
            });
            botMessage.attr.panDirection = actionDirection;
            botMessage.attr.targetUuid = actionUseTaskId;
            break;
          }
          case "SQUARE": {
            res = await reqFn("draw/square", "POST", {
              targetUuid: actionUseTaskId,
            });
            botMessage.attr.targetUuid = actionUseTaskId;
            break;
          }
          case "VARY": {
            res = await reqFn("draw/vary", "POST", {
              strength: actionStrength,
              targetUuid: actionUseTaskId,
            });
            botMessage.attr.strength = actionStrength;
            botMessage.attr.targetUuid = actionUseTaskId;
            break;
          }
          default:
        }
        if (res == null) {
          options.onFinish(Locale.Midjourney.TaskErrNotSupportType(action));
          return false;
        }
        if (!res.ok) {
          console.error(res);
          const text = await res.text();
          throw new Error(
            `\n${Locale.Midjourney.StatusCode(
              res.status,
            )}\n${Locale.Midjourney.RespBody(text || Locale.Midjourney.None)}`,
          );
        }
        const resJson = await res.json();
        console.log("resJson", resJson);
        if (res.status < 200 || res.status >= 300 || resJson.code != 0) {
          // options.onUpdate?.(Locale.Midjourney.TaskSubmitErr(
          //   resJson?.message ||
          //   resJson?.error ||
          //   resJson?.description ||
          //   Locale.Midjourney.UnknownError,
          // ), '');
          botMessage.attr.code = resJson.code;
          options.onFinish(JSON.stringify(resJson));
          return false;
        } else {
          const data = resJson.data;
          const taskId: string = data.uuid;
          const prefixContent = Locale.Midjourney.TaskPrefix(prompt, taskId);
          botMessage.attr.taskId = taskId;
          botMessage.attr.status = "NOT_START";
          botMessage.attr.submitTime = toYYYYMMDD_HHMMSS(new Date());
          options.onUpdate?.(
            prefixContent +
              `[${new Date().toLocaleString()}] - ${
                Locale.Midjourney.TaskSubmitOk
              }: ` +
              Locale.Midjourney.PleaseWait,
            "",
          );
          return true;
          // this.fetchDrawStatus(options.onUpdate, options.onFinish, botMessage);
        }
      } catch (e: any) {
        console.error(e);
        options.onError?.(e);
        // botMessage.content = Locale.Midjourney.TaskSubmitErr(
        //     e?.error || e?.message || Locale.Midjourney.UnknownError,
        // );
        return false;
      } finally {
        // ChatControllerPool.remove(
        //     sessionIndex,
        //     botMessage.id ?? messageIndex,
        // );
        // botMessage.streaming = false;
      }
    };
    return await startFn();
  }
  async fetchDrawStatus(
    onUpdate: ((message: string, chunk: string) => void) | undefined,
    onFinish: (message: string) => void,
    botMessage: ChatMessage,
  ) {
    const taskId = botMessage?.attr?.taskId;
    if (!taskId || ["SUCCESS", "FAILURE"].includes(botMessage?.attr?.status)) {
      return;
    }

    const url = this.path(`draw/info?uuid=${taskId}`);
    const statusRes = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });
    const statusResJson = await statusRes.json();
    console.log("statusResJson", statusResJson);
    if (statusRes.status < 200 || statusRes.status >= 300) {
      onFinish(
        Locale.Midjourney.TaskStatusFetchFail +
          ": " +
          (statusResJson?.message ||
            statusResJson?.error ||
            statusResJson?.description) || Locale.Midjourney.UnknownReason,
      );
    } else {
      let isFinished = false;
      let content;
      if (!botMessage.attr.prompt || botMessage.attr.prompt === "") {
        botMessage.attr.prompt = statusResJson.data.prompt;
      }
      const prefixContent = Locale.Midjourney.TaskPrefix(
        botMessage.attr.prompt +
          (statusResJson.data.type === "upscale"
            ? "(UPSCALE::" +
              botMessage.attr.targetIndex +
              "::" +
              botMessage.attr.targetUuid +
              ")"
            : statusResJson.data.type === "variation"
            ? "(VARIATION::" +
              botMessage.attr.targetIndex +
              "::" +
              botMessage.attr.targetUuid +
              ")"
            : statusResJson.data.type === "zoomOut"
            ? "(ZOOMOUT::" +
              botMessage.attr.zoomRatio +
              "::" +
              botMessage.attr.targetUuid +
              ")"
            : statusResJson.data.type === "pan"
            ? "(PAN::" +
              botMessage.attr.panDirection.toLocaleUpperCase() +
              "::" +
              botMessage.attr.targetUuid +
              ")"
            : statusResJson.data.type === "square"
            ? "(SQUARE::1::" + botMessage.attr.targetUuid + ")"
            : statusResJson.data.type === "vary"
            ? "(VARY::" +
              botMessage.attr.strength.toLocaleUpperCase() +
              "::" +
              botMessage.attr.targetUuid +
              ")"
            : ""),
        taskId,
      );
      const state = statusResJson?.data?.state;
      switch (state) {
        case 30: {
          const result = JSON.parse(statusResJson.data.result);
          let imgUrl = result.url;
          if (imgUrl.startsWith("/")) {
            imgUrl = "/api" + imgUrl;
          }
          const prompt = result.prompt; // 图生文

          const entireContent =
            statusResJson.data.type === "describe"
              ? prefixContent + "\n" + prompt
              : prefixContent + `[![${taskId}](${imgUrl})](${imgUrl})`;
          isFinished = true;

          botMessage.attr.imgUrl = imgUrl;
          botMessage.attr.prompt = prompt;
          botMessage.attr.status = "SUCCESS";
          botMessage.attr.finished = true;
          botMessage.attr.direction = statusResJson.data.direction;
          onFinish(entireContent);
          break;
        }
        case 40:
          content = statusResJson.data.error || Locale.Midjourney.UnknownReason;
          isFinished = true;
          botMessage.attr.status = "FAILURE";
          botMessage.attr.finished = true;
          onFinish(
            prefixContent +
              `**${
                Locale.Midjourney.TaskStatus
              }:** [${new Date().toLocaleString()}] - ${content}`,
          );
          break;
        case 0:
          content = Locale.Midjourney.TaskNotStart;
          botMessage.attr.status = "NOT_START";
          break;
        case 20:
          content = Locale.Midjourney.TaskProgressTip(
            statusResJson.data.progress,
          );
          botMessage.attr.status = "IN_PROGRESS";
          break;
        case 10:
          content = Locale.Midjourney.TaskRemoteSubmit;
          botMessage.attr.status = "SUBMITTED";
          break;
        default:
          content = statusResJson.status;
      }
      if (!isFinished) {
        let entireContent =
          prefixContent +
          `**${
            Locale.Midjourney.TaskStatus
          }:** [${new Date().toLocaleString()}] - ${content}`;
        if (statusResJson.data.state === 20 && statusResJson.data.result) {
          const result = JSON.parse(statusResJson.data.result);
          let imgUrl = result.url;
          // useGetMidjourneySelfProxyUrl(
          //     statusResJson.imageUrl,
          // );
          botMessage.attr.imgUrl = imgUrl;
          entireContent += `\n[![${taskId}](${imgUrl})](${imgUrl})`;
        }
        onUpdate?.(entireContent, "");
        // this.fetchDrawStatus(onUpdate, onFinish, botMessage);
        return true;
      }
      // set(() => ({}));
      // if (isFinished) {
      //     extAttr?.setAutoScroll(true);
      // }
    }
  }
}
export { OpenaiPath };
