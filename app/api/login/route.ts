import { NextRequest } from "next/server";
// import { getServerSideConfig } from "../config/server";
// import md5 from "spark-md5";
// import { ACCESS_CODE_PREFIX } from "../constant";
import { request } from "../common";
import type { Response } from "../common";

async function handle(req: NextRequest) {
  return await request(req);
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";

export interface LoginData {
  token: string;
}

export type LoginResponse = Response<LoginData>;
