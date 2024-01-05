import { type OpenAIListModelResponse } from "@/app/client/platforms/openai";
import { getServerSideConfig } from "@/app/config/server";
import { OpenaiPath } from "@/app/constant";
import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
// import { auth } from "../../auth";
import { requestOpenai } from "../../common";

const ALLOWD_PATH = new Set(Object.values(OpenaiPath));

import { handle as langchainHandle } from "./langchain";
import { handle as assistantHandle } from "./assistant";

function getModels(remoteModelRes: OpenAIListModelResponse) {
  const config = getServerSideConfig();

  if (config.disableGPT4) {
    remoteModelRes.data = remoteModelRes.data.filter(
      (m) => !m.id.startsWith("gpt-4"),
    );
  }

  return remoteModelRes;
}

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  console.log("[OpenAI Route] params ", params);

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  const subpath = params.path.join("/");

  // if (!ALLOWD_PATH.has(subpath)) {
  //   console.log("[OpenAI Route] forbidden path ", subpath);
  //   return NextResponse.json(
  //     {
  //       error: true,
  //       msg: "you are not allowed to request " + subpath,
  //     },
  //     {
  //       status: 403,
  //     },
  //   );
  // }

  // const authResult = auth(req);
  // if (authResult.error) {
  //   return NextResponse.json(authResult, {
  //     status: 401,
  //   });
  // }

  try {
    const reqBody = await req.json();
    if (
      reqBody.plugins &&
      reqBody.plugins.length > 0 &&
      reqBody.plugins[0].value
    ) {
      return await langchainHandle(req, reqBody);
    } else if (reqBody.assistantUuid) {
      return await assistantHandle(req, reqBody);
    } else {
      const response = await requestOpenai(req, reqBody);

      // list models
      if (subpath === OpenaiPath.ListModelPath && response.status === 200) {
        const resJson = (await response.json()) as OpenAIListModelResponse;
        const availableModels = getModels(resJson);
        return NextResponse.json(availableModels, {
          status: response.status,
        });
      }

      return response;
    }
  } catch (e) {
    console.error("[OpenAI] ", e);
    return NextResponse.json(prettyObject(e));
  }
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
