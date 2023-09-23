import { NextRequest } from "next/server";

import { request } from "../../common";
import type { Response } from "../../common";

async function handle(req: NextRequest) {
  return await request(req);
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";

export interface Balance {
  id: number;
  title?: string;
  calcType: string;
  calcTypeId: number;
  source: string;
  sourceId: number;
  expireTime: string;
  createTime: string;
  updateTime: string;
  tokens: number;
  chatCount: number;
  advancedChatCount: number;
  drawCount: number;
  state: number;
  userId: number;
  expired?: boolean;
}

export interface ProfileData {
  id: number;
  name: string;
  username: string;
  state: number;
  inviteCode: string;
  invitorId: number;
  role: number;
  tokens: number;
  chatCount: number;
  advancedChatCount: number;
  drawCount: number;
  balances: Balance[];
}

export type ProfileResponse = Response<ProfileData>;
