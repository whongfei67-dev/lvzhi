/**
 * Next.js Auth API 路由 - 代理到 Fastify 后端
 */

import { NextRequest, NextResponse } from 'next/server';
import { readUpstreamJson } from '@/lib/read-upstream-json';
import { getUpstreamApiBaseUrl, upstreamConnectionErrorPayload } from '@/lib/upstream-api-base';

function getTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get('lvzhi_access_token')?.value || null;
}

export async function GET(request: NextRequest) {
  const token = getTokenFromCookie(request);
  const browserCookie = request.headers.get("cookie");

  let response: Response;
  try {
    response = await fetch(`${getUpstreamApiBaseUrl()}/api/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        ...(browserCookie ? { Cookie: browserCookie } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });
  } catch (e) {
    return NextResponse.json(upstreamConnectionErrorPayload(e), { status: 502 });
  }

  const data = await readUpstreamJson(response);

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }

  return NextResponse.json(data);
}
