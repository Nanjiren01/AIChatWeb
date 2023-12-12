import { NextRequest } from "next/server";

import { request } from "../common";
// import type { Response } from "../common";

async function handle(req: NextRequest) {
  const ip = req.headers.get("X-Forwarded-For") || req.ip;
  req.headers.set("X-Forwarded-For", ip || "");
  return await request(req);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
export const PUT = handle;

export const runtime = "edge";
