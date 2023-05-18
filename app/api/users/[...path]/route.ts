import { NextRequest } from "next/server";

import { request } from "../../common";
import type { Response } from "../../common";

async function handle(req: NextRequest) {
  return await request(req);
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";

export interface ProfileData {
  id: number;
  name: string;
  username: string;
  state: number;
  role: number;
  tokens: number;
  chatCount: number;
  advancedChatCount: number;
  drawCount: number;
}

export type ProfileResponse = Response<ProfileData>;
