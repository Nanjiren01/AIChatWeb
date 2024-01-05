import {
  RunEntity,
  RunStepEntity,
  ThreadMessageEntity,
} from "../api/openai/[...path]/assistant";
import { SimpleChatMessage } from "../components/exporter";
import { getClientConfig } from "../config/client";
import { ACCESS_CODE_PREFIX, Azure, ServiceProvider } from "../constant";
import {
  ChatMessage,
  ImageMode,
  MessageAction,
  ModelContentType,
  ModelType,
  PluginActionModel,
  useAccessStore,
  useAuthStore,
} from "../store";
import { Mask } from "../store/mask";
import { ChatGPTApi } from "./platforms/openai";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export type ChatModel = ModelType;

export type ContentType = "Text" | "Image";

export interface RequestMessage {
  id?: string;
  role: MessageRole;
  content: string;
}

export interface LLMConfig {
  model: string;
  contentType?: ContentType;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface ChatOptions {
  sessionUuid?: string;
  messages: RequestMessage[];
  userMessage?: ChatMessage;
  botMessage: ChatMessage;
  content: string;

  config: LLMConfig;
  plugins: PluginActionModel[];
  mask: Mask | null;
  resend: boolean;
  imageMode: ImageMode;
  baseImages: any[];
  assistantUuid?: string;
  threadUuid?: string;

  onUpdate?: (message: string, chunk: string) => void;
  onToolUpdate?: (toolName: string, toolInput: string) => void;
  onFinish: (message: string) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;

  onCreateRun?: (run: RunEntity) => void;
  onUpdateRun?: (run: RunEntity) => void;
  onUpdateRunStep?: (runSteps: RunStepEntity[]) => void;
  onUpdateMessages?: (messages: ThreadMessageEntity[]) => void;
}

export interface LLMUsage {
  used: number;
  total: number;
}

export interface LLMModel {
  name: string;
  available: boolean;
  contentType?: ModelContentType;
}

export interface ChatSubmitResult {
  userMessage?: ChatMessage;
  botMessage: ChatMessage;
  fetch: boolean;
}
export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<ChatSubmitResult | void>;
  abstract usage(): Promise<LLMUsage>;
  abstract models(): Promise<LLMModel[]>;
  abstract fetchDrawStatus: (
    onUpdate: (message: string, chunk: string) => void,
    onFinish: (message: string) => void,
    botMessage: ChatMessage,
  ) => Promise<boolean | void>;
}

// type ProviderName = "openai" | "azure" | "claude" | "palm";

// interface Model {
//   name: string;
//   provider: ProviderName;
//   ctxlen: number;
// }

// interface ChatProvider {
//   name: ProviderName;
//   apiConfig: {
//     baseUrl: string;
//     apiKey: string;
//     summaryModel: Model;
//   };
//   models: Model[];

//   chat: () => void;
//   usage: () => void;
// }

export class ClientApi {
  public llm: LLMApi;

  constructor() {
    this.llm = new ChatGPTApi();
  }

  config() {}

  prompts() {}

  masks() {}

  async share(messages: SimpleChatMessage[], avatarUrl: string | null = null) {
    const msgs = messages
      .map((m) => ({
        from: m.role === "user" ? "human" : "gpt",
        value: m.content,
      }))
      .concat([
        {
          from: "human",
          value:
            "Share from [AIChatWeb]: https://github.com/Nanjiren01/AIChatWeb",
        },
      ]);
    // 敬告二开开发者们，为了开源大模型的发展，请不要修改上述消息，此消息用于后续数据清洗使用
    // Please do not modify this message

    console.log("[Share]", messages, msgs);
    const clientConfig = getClientConfig();
    const proxyUrl = "/sharegpt";
    const rawUrl = "https://sharegpt.com/api/conversations";
    const shareUrl = clientConfig?.isApp ? rawUrl : proxyUrl;
    const res = await fetch(shareUrl, {
      body: JSON.stringify({
        avatarUrl,
        items: msgs,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const resJson = await res.json();
    console.log("[Share]", resJson);
    if (resJson.id) {
      return `https://shareg.pt/${resJson.id}`;
    }
  }
}

export const api = new ClientApi();

export function getHeaders() {
  const authStore = useAuthStore.getState();
  const accessStore = useAccessStore.getState();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-requested-with": "XMLHttpRequest",
  };

  const isAzure = accessStore.provider === ServiceProvider.Azure;
  const authHeader = isAzure ? "api-key" : "Authorization";
  const apiKey = isAzure ? accessStore.azureApiKey : accessStore.openaiApiKey;

  const makeBearer = (s: string) => `${isAzure ? "" : "Bearer "}${s.trim()}`;
  const validString = (x: string) => x && x.length > 0;

  if (validString(authStore.token)) {
    headers.Authorization = makeBearer(authStore.token);
  }
  // use user's api key first
  else if (validString(apiKey)) {
    headers[authHeader] = makeBearer(apiKey);
  } else if (
    accessStore.enabledAccessControl() &&
    validString(accessStore.accessCode)
  ) {
    headers[authHeader] = makeBearer(
      ACCESS_CODE_PREFIX + accessStore.accessCode,
    );
  }

  return headers;
}
