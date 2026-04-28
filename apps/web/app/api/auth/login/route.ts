/**
 * Next.js Auth API 路由 - 登录
 */

import { NextRequest, NextResponse } from 'next/server';
import { readUpstreamJson } from '@/lib/read-upstream-json';
import {
  getUpstreamApiBaseUrl,
  getUpstreamRequestOrigin,
  upstreamConnectionErrorPayload,
} from '@/lib/upstream-api-base';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体不是合法 JSON" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(`${getUpstreamApiBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: getUpstreamRequestOrigin(),
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
  } catch (e) {
    return NextResponse.json(upstreamConnectionErrorPayload(e), { status: 502 });
  }

  const data = await readUpstreamJson(response);

  const nextResponse = NextResponse.json(data, { status: response.status });
  const setCookieHeaders = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [];
  setCookieHeaders.forEach((cookie) => {
    nextResponse.headers.append('Set-Cookie', cookie);
  });

  return nextResponse;
}
