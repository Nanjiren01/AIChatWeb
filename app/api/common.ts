import { NextRequest, NextResponse } from "next/server";

export const OPENAI_URL = "api.openai.com";
const DEFAULT_PROTOCOL = "https";
const PROTOCOL = process.env.PROTOCOL ?? DEFAULT_PROTOCOL;
const BASE_URL = process.env.BASE_URL ?? OPENAI_URL;
const DISABLE_GPT4 = !!process.env.DISABLE_GPT4;

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

export async function requestOpenai(req: NextRequest) {
  const controller = new AbortController();
  const authValue = req.headers.get("Authorization") ?? "";
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

  // if (process.env.OPENAI_ORG_ID) {
  //   console.log("[Org ID]", process.env.OPENAI_ORG_ID);
  // }

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10 * 60 * 1000);

  const fetchUrl = `${baseUrl}/${openaiPath}`;
  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      Authorization: authValue,
      ...(process.env.OPENAI_ORG_ID && {
        "OpenAI-Organization": process.env.OPENAI_ORG_ID,
      }),
    },
    cache: "no-store",
    method: req.method,
    body: req.body,
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };

  try {
    const res = await fetch(fetchUrl, fetchOptions);

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

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10 * 60 * 1000);

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

  data: T;
}
