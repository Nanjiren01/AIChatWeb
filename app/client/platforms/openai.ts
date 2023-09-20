import {
  DEFAULT_API_HOST,
  OpenaiPath,
  REQUEST_TIMEOUT_MS,
} from "@/app/constant";
import {
  ChatMessage,
  useAccessStore,
  useAppConfig,
  useChatStore,
} from "@/app/store";

import { ChatOptions, getHeaders, LLMApi, LLMUsage } from "../api";
import Locale from "../../locales";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@fortaine/fetch-event-source";
import { prettyObject } from "@/app/utils/format";

const ChatFetchTaskPool: Record<string, any> = {};

export class ChatGPTApi implements LLMApi {
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
      /^(UPSCALE|VARIATION)::\d::/.test(options.content)
    ) {
      this.handleDraw(options, modelConfig);
      return;
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
            if (msg.data === "[DONE]" || finished) {
              return finish();
            }
            const text = msg.data;
            if (text === "") {
              return;
            }
            try {
              const json = JSON.parse(text);
              const delta = json.choices?.at(0)?.delta.content;
              if (delta) {
                responseText += delta;
                options.onUpdate?.(responseText, delta);
              }
            } catch (e) {
              console.error("[Request] parse error", text, msg);
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
      console.log("[Request] failed to make a chat reqeust", e);
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
  async handleDraw(options: ChatOptions, modelConfig: any) {
    options.onUpdate?.("正在绘制……", "");
    const botMessage = options.botMessage;
    const content = options.content;
    const startFn = async () => {
      const prompt = content; // .substring(3).trim();
      let action: string = "IMAGINE";
      const firstSplitIndex = prompt.indexOf("::");
      if (firstSplitIndex > 0) {
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
        ].includes(action)
      ) {
        options.onFinish(Locale.Midjourney.TaskErrUnknownType);
        return;
      }
      botMessage.attr.action = action;
      let actionIndex: any = null;
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
      }
      try {
        let res = null;
        const reqFn = (path: string, method: string, body?: any) => {
          return fetch("/api/" + path, {
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
              // base64: extAttr?.useImages?.[0]?.base64 ?? null,
            });
            break;
          }
          // case "DESCRIBE": {
          //     res = await reqFn(
          //         "submit/describe",
          //         "POST",
          //         JSON.stringify({
          //             base64: extAttr.useImages[0].base64,
          //         }),
          //     );
          //     break;
          // }
          // case "BLEND": {
          //     const base64Array = extAttr.useImages.map((ui: any) => ui.base64)
          //     res = await reqFn(
          //         "submit/blend",
          //         "POST",
          //         JSON.stringify({base64Array}),
          //     );
          //     break;
          // }
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
          default:
        }
        if (res == null) {
          options.onFinish(Locale.Midjourney.TaskErrNotSupportType(action));
          return;
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
          options.onFinish(JSON.stringify(resJson));
          botMessage.attr.code = resJson.code;
        } else {
          const data = resJson.data;
          const taskId: string = data.uuid;
          const prefixContent = Locale.Midjourney.TaskPrefix(prompt, taskId);
          options.onUpdate?.(
            prefixContent +
              `[${new Date().toLocaleString()}] - ${
                Locale.Midjourney.TaskSubmitOk
              }: ` +
              Locale.Midjourney.PleaseWait,
            "",
          );
          botMessage.attr.taskId = taskId;
          botMessage.attr.status = "NOT_START";
          this.fetchMidjourneyStatus(options, botMessage);
        }
      } catch (e: any) {
        console.error(e);
        options.onError?.(e);
        // botMessage.content = Locale.Midjourney.TaskSubmitErr(
        //     e?.error || e?.message || Locale.Midjourney.UnknownError,
        // );
      } finally {
        // ChatControllerPool.remove(
        //     sessionIndex,
        //     botMessage.id ?? messageIndex,
        // );
        // botMessage.streaming = false;
      }
    };
    await startFn();
  }
  fetchMidjourneyStatus(options: ChatOptions, botMessage: ChatMessage) {
    const taskId = botMessage?.attr?.taskId;
    if (
      !taskId ||
      ["SUCCESS", "FAILURE"].includes(botMessage?.attr?.status) ||
      ChatFetchTaskPool[taskId]
    )
      return;
    ChatFetchTaskPool[taskId] = setTimeout(async () => {
      ChatFetchTaskPool[taskId] = null;
      const statusRes = await fetch(`/api/draw/info?uuid=${taskId}`, {
        method: "GET",
        headers: getHeaders(),
      });
      const statusResJson = await statusRes.json();
      console.log("statusResJson", statusResJson);
      if (statusRes.status < 200 || statusRes.status >= 300) {
        options.onFinish(
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
              : ""),
          taskId,
        );
        const state = statusResJson?.data?.state;
        switch (state) {
          case 30: {
            const result = JSON.parse(statusResJson.data.result);
            const imgUrl = result.url;

            const entireContent =
              prefixContent + `[![${taskId}](${imgUrl})](${imgUrl})`;
            isFinished = true;
            options.onFinish(entireContent);

            botMessage.attr.imgUrl = imgUrl;
            // if (statusResJson.action === "DESCRIBE" && statusResJson.prompt) {
            //     botMessage.content += `\n${statusResJson.prompt}`;
            // }
            botMessage.attr.status = "SUCCESS";
            botMessage.attr.finished = true;
            break;
          }
          case 40:
            content =
              statusResJson.data.error || Locale.Midjourney.UnknownReason;
            isFinished = true;
            options.onFinish(
              prefixContent +
                `**${
                  Locale.Midjourney.TaskStatus
                }:** [${new Date().toLocaleString()}] - ${content}`,
            );
            botMessage.attr.status = "FAILURE";
            botMessage.attr.finished = true;
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
        console.log("isFinished", isFinished);
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
          options.onUpdate?.(entireContent, "");
          this.fetchMidjourneyStatus(options, botMessage);
        }
        // set(() => ({}));
        // if (isFinished) {
        //     extAttr?.setAutoScroll(true);
        // }
      }
    }, 3000);
  }
}
export { OpenaiPath };
