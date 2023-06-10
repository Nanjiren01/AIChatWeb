import { NextRequest } from "next/server";

import { request } from "../common";
// import type { Response } from "../common";

async function handle(req: NextRequest) {
  return await request(req);
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
