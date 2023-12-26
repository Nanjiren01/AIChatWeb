import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "../config/server";
import { DEFAULT_MODELS, OPENAI_BASE_URL } from "../constant";
import { collectModelTable } from "../utils/model";
import { makeAzurePath } from "../azure";

export const OPENAI_URL = "api.openai.com";
const DEFAULT_PROTOCOL = "https";
const PROTOCOL = process.env.PROTOCOL || DEFAULT_PROTOCOL;
const BASE_URL = process.env.BASE_URL || OPENAI_URL;

const serverConfig = getServerSideConfig();

export function getBaseUrl(req: NextRequest) {
  const openaiPath = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
    "/api/",
    "",
  );
  let baseUrl = BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `${PROTOCOL}://${baseUrl}`;
  }

  console.log("[Proxy] ", openaiPath);
  console.log("[Base Url]", baseUrl);
  return baseUrl;
}

export async function requestOpenai(req: NextRequest, reqBody: any) {
  const controller = new AbortController();

  const authValue = req.headers.get("Authorization") ?? "";
  const authHeaderName = serverConfig.isAzure ? "api-key" : "Authorization";

  let path = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
    "/api/",
    "",
  );

  let baseUrl =
    serverConfig.azureUrl ?? serverConfig.baseUrl ?? OPENAI_BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  console.log("[Proxy] ", path);
  console.log("[Base Url]", baseUrl);
  console.log("[Org ID]", serverConfig.openaiOrgId);

  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    10 * 60 * 1000,
  );

  if (serverConfig.isAzure) {
    if (!serverConfig.azureApiVersion) {
      return NextResponse.json({
        error: true,
        message: `missing AZURE_API_VERSION in server env vars`,
      });
    }
    path = makeAzurePath(path, serverConfig.azureApiVersion);
  }

  const fetchUrl = `${baseUrl}/${path}`;
  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      [authHeaderName]: authValue,
      ...(serverConfig.openaiOrgId && {
        "OpenAI-Organization": serverConfig.openaiOrgId,
      }),
    },
    method: req.method,
    body: JSON.stringify(reqBody),
    // to fix #2485: https://stackoverflow.com/questions/55920957/cloudflare-worker-typeerror-one-time-use-body
    redirect: "manual",
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };

  try {
    const res = await fetch(fetchUrl, fetchOptions);

    // to prevent browser prompt for credentials
    const newHeaders = new Headers(res.headers);
    newHeaders.delete("www-authenticate");
    // to disable nginx buffering
    newHeaders.set("X-Accel-Buffering", "no");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function request(req: NextRequest) {
  const controller = new AbortController();
  let baseUrl = BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `${PROTOCOL}://${baseUrl}`;
  }
  const authValue = req.headers.get("Authorization") ?? "";
  const uri = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
    "/api/",
    "",
  );

  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    10 * 60 * 1000,
  );

  try {
    console.log(`url = ${baseUrl}/${uri}`);
    // console.log('req.headers', req.headers)
    const contentType =
      req.headers.get("Content-Type") ||
      req.headers.get("content-type") ||
      "application/json";
    const newContentType = contentType.startsWith("multipart/form-data")
      ? contentType
      : "application/json";
    // console.log('contentType = ' + contentType + ', newContentType = ' + newContentType)
    const res = await fetch(`${baseUrl}/${uri}`, {
      headers: {
        "Content-Type": newContentType,
        Authorization: authValue,
      },
      cache: "no-store",
      method: req.method,
      body: req.body,
      // @ts-ignore
      duplex: "half",
      signal: controller.signal,
    });

    // to prevent browser prompt for credentials
    const newHeaders = new Headers(res.headers);
    newHeaders.delete("www-authenticate");

    // to disbale ngnix buffering
    newHeaders.set("X-Accel-Buffering", "no");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface Response<T> {
  code: number;

  message: string;

  cnMessage?: string;

  data: T;
}
