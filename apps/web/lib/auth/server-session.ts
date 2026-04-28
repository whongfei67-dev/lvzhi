import { cookies } from "next/headers";
import { cache } from "react";

import { getUpstreamApiBaseUrl, getUpstreamRequestOrigin } from "@/lib/upstream-api-base";

import type { Session } from "./session-types";

interface BackendResponse<T> {
  code: number;
  message: string;
  data?: T;
}

async function fetchServerSessionUncached(): Promise<Session | null> {
  try {
    const c = await cookies();
    const cookieStr = c.getAll().map((x) => `${x.name}=${x.value}`).join("; ");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (cookieStr) headers.Cookie = cookieStr;
    headers.Origin = getUpstreamRequestOrigin();
    const base = getUpstreamApiBaseUrl();
    const response = await fetch(`${base}/api/auth/me`, {
      headers,
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) return null;

    const text = await response.text();
    let result: BackendResponse<Session>;
    try {
      result = text ? (JSON.parse(text) as BackendResponse<Session>) : { code: -1, message: "" };
    } catch {
      return null;
    }

    if (result.code === 0 && result.data) return result.data;
    return null;
  } catch {
    return null;
  }
}

/** 同一 RSC 请求内去重，且不把整份 `client.ts` 拉进布局 chunk（避免 dev 下 webpack 异常） */
export const getServerSession = cache(fetchServerSessionUncached);
