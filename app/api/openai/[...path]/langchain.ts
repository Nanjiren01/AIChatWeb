import { NextRequest, NextResponse } from "next/server";
// import { getServerSideConfig } from "@/app/config/server";
// import { auth } from "../../../auth";

import { ChatOpenAI } from "langchain/chat_models/openai";
import { BaseCallbackHandler } from "langchain/callbacks";

import { AIMessage, HumanMessage, SystemMessage } from "langchain/schema";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
// import { ACCESS_CODE_PREFIX } from "@/app/constant";
import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

import * as langchainTools from "langchain/tools";
// import { HttpGetTool } from "@/app/api/langchain-tools/http_get";
import { DuckDuckGo } from "@/app/api/langchain-tools/duckduckgo_search";
import { WebBrowser } from "langchain/tools/webbrowser";
import { Calculator } from "langchain/tools/calculator";
import { DynamicTool, Tool } from "langchain/tools";
// import { DallEAPIWrapper } from "@/app/api/langchain-tools/dalle_image_generator";
import { BaiduSearch } from "@/app/api/langchain-tools/baidu_search";
import { GoogleSearch } from "@/app/api/langchain-tools/google_search";
import { StableDiffusionWrapper } from "@/app/api/langchain-tools/stable_diffusion_image_generator";
import { ArxivAPIWrapper } from "@/app/api/langchain-tools/arxiv";
import { getBaseUrl } from "../../common";
import { type AgentAction } from "langchain/schema";

// const serverConfig = getServerSideConfig();

const SECRET = process.env.SECRET || "";

interface RequestMessage {
  role: string;
  content: string;
}

interface RequestBody {
  messages: RequestMessage[];
  model: string;
  stream?: boolean;
  temperature: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  top_p?: number;
  baseUrl?: string;
  apiKey?: string;
  maxIterations: number;
  returnIntermediateSteps: boolean;
  useTools: (undefined | string)[];
}

class ResponseBody {
  isSuccess: boolean = true;
  message!: string;
  isToolMessage: boolean = false;
  toolName?: string;
}

interface ToolInput {
  input: string;
}

export async function handle(req: NextRequest, reqBody: RequestBody) {
  // if (req.method === "OPTIONS") {
  //   return NextResponse.json({ body: "OK" }, { status: 200 });
  // }
  try {
    const encoder = new TextEncoder();
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();
    const authToken = req.headers.get("Authorization") ?? "";
    const token = authToken.trim().replace("Bearer ", "").trim();
    // const isOpenAiKey = !token.startsWith(ACCESS_CODE_PREFIX);
    // let useTools = reqBody.useTools ?? []; // 由于目前只有1个插件，所以只要开启了插件，那么默认就有联网功能
    let apiKey = token; // serverConfig.apiKey;
    // if (isOpenAiKey && token) {
    //   apiKey = token;
    // }

    // support base url
    let baseUrl = getBaseUrl(req); // "https://api.openai.com/v1";
    const pluginsResp = await fetch(
      baseUrl + "/plugins?secret=" + encodeURI(SECRET),
      {
        headers: {
          Authorization: authToken,
        },
      },
    );
    const pluginsJson = await pluginsResp.json();
    const plugins = pluginsJson?.data || [];
    // console.log('plugins', plugins)
    const serachPlugin = plugins.filter(
      (p: any) => p.uuid === "594a90be-0f21-4f72-9a22-4403e5028f81",
    )[0];
    if (serachPlugin) {
      serachPlugin.config = JSON.parse(serachPlugin.config || "{}") || {};
    }
    // if (serverConfig.baseUrl) baseUrl = serverConfig.baseUrl;
    // if (
    //   reqBody.baseUrl?.startsWith("http://") ||
    //   reqBody.baseUrl?.startsWith("https://")
    // )
    //   baseUrl = reqBody.baseUrl;
    // if (!baseUrl.endsWith("/v1"))
    //   baseUrl = baseUrl.endsWith("/") ? `${baseUrl}v1` : `${baseUrl}/v1`;
    baseUrl += "/openai/v1";
    console.log("[baseUrl]", baseUrl);

    const handler = BaseCallbackHandler.fromMethods({
      async handleLLMNewToken(token: string) {
        console.log("[Token]", token);
        if (token) {
          var response = new ResponseBody();
          response.message = token;
          await writer.ready;
          await writer.write(
            encoder.encode(`data: ${JSON.stringify(response)}\n\n`),
          );
        }
      },
      async handleChainError(
        err: any,
        runId: any,
        parentRunId: any,
        tags: any,
      ) {
        console.log(
          "[handleChainError]",
          err,
          "writer error",
          runId,
          parentRunId,
          tags,
        );
        var response = new ResponseBody();
        response.isSuccess = false;
        response.message = err;
        await writer.ready;
        await writer.write(
          encoder.encode(`data: ${JSON.stringify(response)}\n\n`),
        );
        await writer.close();
      },
      async handleChainEnd(
        outputs: any,
        runId: any,
        parentRunId: any,
        tags: any,
      ) {
        console.log("[handleChainEnd]", outputs, runId, parentRunId, tags);
        await writer.ready;
        await writer.close();
      },
      async handleLLMEnd() {
        console.log("[handleLLMEnd]");
        // await writer.ready;
        // await writer.close();
      },
      async handleLLMError(e: Error) {
        console.log("[handleLLMError]", e, "writer error");
        var response = new ResponseBody();
        response.isSuccess = false;
        response.message = e.message;
        await writer.ready;
        await writer.write(
          encoder.encode(`data: ${JSON.stringify(response)}\n\n`),
        );
        await writer.close();
      },
      handleLLMStart(llm: any, _prompts: string[]) {
        console.log("handleLLMStart: I'm the second handler!!", { llm });
      },
      handleChainStart(chain: any) {
        console.log("handleChainStart: I'm the second handler!!", { chain });
      },
      async handleAgentAction(
        action: AgentAction,
        runId: string,
        parentRunId?: string,
        tags?: string[],
      ) {
        try {
          console.log(
            "[handleAgentAction]",
            action.tool,
            runId,
            parentRunId,
            tags,
          );
          // if (!reqBody.returnIntermediateSteps) return;
          console.log("[handleAgentAction] input: ", action.toolInput);
          var response = new ResponseBody();
          response.isToolMessage = true;
          response.message = JSON.stringify(action.toolInput);
          response.toolName = action.tool;
          await writer.ready;
          await writer.write(
            encoder.encode(`data: ${JSON.stringify(response)}\n\n`),
          );
        } catch (ex) {
          console.error("[handleAgentAction]", ex);
          var response = new ResponseBody();
          response.isSuccess = false;
          response.message = (ex as Error).message;
          await writer.ready;
          await writer.write(
            encoder.encode(`data: ${JSON.stringify(response)}\n\n`),
          );
          await writer.close();
        }
      },
      handleToolStart(tool: any, input: any) {
        console.log("[handleToolStart]", { tool, input });
      },
      async handleToolEnd(
        output: any,
        runId: any,
        parentRunId: any,
        tags: any,
      ) {
        console.log("[handleToolEnd]", { output, runId, parentRunId, tags });
      },
      handleAgentEnd(action: any, runId: any, parentRunId: any, tags: any) {
        console.log("[handleAgentEnd]", { action, runId, parentRunId, tags });
      },
    });

    let searchTool: Tool = new GoogleSearch();
    const searchEngine = serachPlugin?.config?.searchEngine || "google";
    if (["google", "baidu"].includes(searchEngine)) {
      switch (searchEngine) {
        case "google":
          searchTool = new GoogleSearch();
          console.log("now using google search engine");
          break;
        case "baidu":
          searchTool = new BaiduSearch();
          console.log("now using baidu search engine");
          break;
      }
    } else if (searchEngine === "bing") {
      let bingSearchTool = new langchainTools["BingSerpAPI"](
        serachPlugin.config?.bingApiKey,
      );
      searchTool = new DynamicTool({
        name: "bing_search",
        description: bingSearchTool.description,
        func: async (input: string) => bingSearchTool.call(input),
      });
      console.log("now using bing search engine");
    } else if (searchEngine === "serpapi") {
      let serpAPITool = new langchainTools["SerpAPI"](
        serachPlugin.config?.serpApiKey,
      );
      searchTool = new DynamicTool({
        name: "google_search",
        description: serpAPITool.description,
        func: async (input: string) => serpAPITool.call(input),
      });
      console.log("now using serpapi");
    }

    // const model = new OpenAI(
    //   {
    //     temperature: 0,
    //     modelName: reqBody.model,
    //     openAIApiKey: apiKey,
    //   },
    //   { basePath: baseUrl },
    // );
    // const embeddings = new OpenAIEmbeddings(
    //   {
    //     openAIApiKey: apiKey,
    //   },
    //   { basePath: baseUrl },
    // );

    const tools = [
      // new RequestsGetTool(),
      // new RequestsPostTool(),
    ];
    // const webBrowserTool = new WebBrowser({ model, embeddings });
    const calculatorTool = new Calculator();
    // const dallEAPITool = new DallEAPIWrapper(
    //   apiKey,
    //   baseUrl,
    //   async (data: string) => {
    //     var response = new ResponseBody();
    //     response.message = data;
    //     await writer.ready;
    //     await writer.write(
    //       encoder.encode(`data: ${JSON.stringify(response)}\n\n`),
    //     );
    //   },
    // );
    // dallEAPITool.returnDirect = true;
    // const stableDiffusionTool = new StableDiffusionWrapper();
    // const arxivAPITool = new ArxivAPIWrapper();
    // if (useTools.includes("web-search")) tools.push(searchTool);
    tools.push(searchTool);
    // if (useTools.includes(webBrowserTool.name)) tools.push(webBrowserTool);
    // tools.push(webBrowserTool);
    // if (useTools.includes(calculatorTool.name)) tools.push(calculatorTool);
    tools.push(calculatorTool);
    // if (useTools.includes(dallEAPITool.name)) tools.push(dallEAPITool);
    // if (useTools.includes(stableDiffusionTool.name))
    // tools.push(stableDiffusionTool);
    // if (useTools.includes(arxivAPITool.name)) tools.push(arxivAPITool);

    // useTools.forEach((toolName) => {
    //   if (toolName) {
    //     var tool = langchainTools[
    //       toolName as keyof typeof langchainTools
    //     ] as any;
    //     if (tool) {
    //       tools.push(new tool());
    //     }
    //   }
    // });

    const pastMessages = new Array();

    reqBody.messages
      .slice(0, reqBody.messages.length - 1)
      .forEach((message) => {
        if (message.role === "system")
          pastMessages.push(new SystemMessage(message.content));
        if (message.role === "user")
          pastMessages.push(new HumanMessage(message.content));
        if (message.role === "assistant")
          pastMessages.push(new AIMessage(message.content));
      });

    const memory = new BufferMemory({
      memoryKey: "chat_history",
      returnMessages: true,
      inputKey: "input",
      outputKey: "output",
      chatHistory: new ChatMessageHistory(pastMessages),
    });

    const llm = new ChatOpenAI(
      {
        modelName: reqBody.model,
        openAIApiKey: apiKey,
        temperature: reqBody.temperature,
        streaming: reqBody.stream,
        topP: reqBody.top_p,
        presencePenalty: reqBody.presence_penalty,
        frequencyPenalty: reqBody.frequency_penalty,
      },
      { basePath: baseUrl },
    );
    const executor = await initializeAgentExecutorWithOptions(tools, llm, {
      agentType: "openai-functions",
      returnIntermediateSteps: true, // reqBody.returnIntermediateSteps,
      maxIterations: 10, // reqBody.maxIterations,
      memory: memory,
    });

    executor.call(
      {
        input: reqBody.messages.slice(-1)[0].content,
      },
      [handler],
    );

    console.log("returning response");
    return new Response(transformStream.readable, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as any).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
