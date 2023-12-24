import { OpenAI as OpenAIClient, APIError } from "openai";
import { ChatOpenAI } from "langchain/chat_models/openai";
// import { wrapOpenAIClientError } from "langchain/util/openai";
import { OpenAICoreRequestOptions } from "langchain/dist/types/openai-types.js";

import { APIConnectionTimeoutError, APIUserAbortError } from "openai";
export function wrapOpenAIClientError(e: any) {
  let error;
  if (e.constructor.name === APIConnectionTimeoutError.name) {
    error = new Error(e.message);
    error.name = "TimeoutError";
  } else if (e.constructor.name === APIUserAbortError.name) {
    error = new Error(e.message);
    error.name = "AbortError";
  } else {
    error = e;
  }
  return error;
}
export function getEndpoint(config: any) {
  const {
    azureOpenAIApiDeploymentName,
    azureOpenAIApiInstanceName,
    azureOpenAIApiKey,
    azureOpenAIBasePath,
    baseURL,
  } = config;
  if (
    azureOpenAIApiKey &&
    azureOpenAIBasePath &&
    azureOpenAIApiDeploymentName
  ) {
    return `${azureOpenAIBasePath}/${azureOpenAIApiDeploymentName}`;
  }
  if (azureOpenAIApiKey) {
    if (!azureOpenAIApiInstanceName) {
      throw new Error(
        "azureOpenAIApiInstanceName is required when using azureOpenAIApiKey",
      );
    }
    if (!azureOpenAIApiDeploymentName) {
      throw new Error(
        "azureOpenAIApiDeploymentName is a required parameter when using azureOpenAIApiKey",
      );
    }
    return `https://${azureOpenAIApiInstanceName}.openai.azure.com/openai/deployments/${azureOpenAIApiDeploymentName}`;
  }
  return baseURL;
}

export class AIChatResponseError extends APIError {
  private response: any;
  constructor(status: number | undefined, response: any) {
    super(status, response, response, undefined);
    this.response = response;
  }
  public getResponse() {
    return this.response;
  }
}

export const castToError = (err: any): Error => {
  if (err instanceof Error) return err;
  return new Error(err);
};

class AIOpenAIClient extends OpenAIClient {
  async fetchWithTimeout(
    url: RequestInfo,
    init: RequestInit | undefined,
    ms: number,
    controller: AbortController,
  ): Promise<Response> {
    const { signal, ...options } = init || {};
    if (signal) signal.addEventListener("abort", () => controller.abort());

    const timeout = setTimeout(() => controller.abort(), ms);

    const response = await this.getRequestClient()
      .fetch(url, { signal: controller.signal as any, ...options })
      .finally(() => {
        clearTimeout(timeout);
      })
      .catch(castToError);
    if (response instanceof Response && response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.startsWith("application/json")) {
        const resp = new Response(response.body, {
          headers: response.headers,
          status: 400,
          statusText: "client error",
        });
        return Promise.resolve(resp);
      }
    }
    if (response instanceof Response) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(response);
    }
  }

  protected makeStatusError(
    status: number | undefined,
    error: Object | any | undefined,
    message: string | undefined,
    headers: any,
  ) {
    if (error && error.from === "aichat") {
      console.log("[AIOpenAIClient] error", error);
      return new AIChatResponseError(status, error);
    }
    return super.makeStatusError(status, error, message, headers);
  }
}

export class AIChatOpenAI extends ChatOpenAI {
  // @ts-ignore
  private client: AIOpenAIClient;
  private clientConfig: any;
  static lc_name() {
    return "AIChatOpenAI";
  }
  constructor(fields: any, /** @deprecated */ configuration: any) {
    super(fields ?? {}, configuration);
  }
  // @ts-ignore
  async completionWithRetry(request: any, options: any) {
    const requestOptions = this._getClientOptions(options);
    return this.caller.call(async () => {
      try {
        const res = await this.client.chat.completions.create(
          request,
          requestOptions,
        );
        return res;
      } catch (e) {
        const error = wrapOpenAIClientError(e);
        throw error;
      }
    });
  }
  _getClientOptions(options: any) {
    if (!this.client) {
      const openAIEndpointConfig = {
        azureOpenAIApiDeploymentName: this.azureOpenAIApiDeploymentName,
        azureOpenAIApiInstanceName: this.azureOpenAIApiInstanceName,
        azureOpenAIApiKey: this.azureOpenAIApiKey,
        azureOpenAIBasePath: this.azureOpenAIBasePath,
        baseURL: this.clientConfig.baseURL,
      };
      const endpoint = getEndpoint(openAIEndpointConfig);
      const params = {
        ...this.clientConfig,
        baseURL: endpoint,
        timeout: this.timeout,
        maxRetries: 0,
      };
      if (!params.baseURL) {
        delete params.baseURL;
      }
      this.client = new AIOpenAIClient(params);
    }
    const requestOptions = {
      ...this.clientConfig,
      ...options,
    };
    if (this.azureOpenAIApiKey) {
      requestOptions.headers = {
        "api-key": this.azureOpenAIApiKey,
        ...requestOptions.headers,
      };
      requestOptions.query = {
        "api-version": this.azureOpenAIApiVersion,
        ...requestOptions.query,
      };
    }
    return requestOptions;
  }
}
