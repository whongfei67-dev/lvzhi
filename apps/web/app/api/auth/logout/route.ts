/**
 * Next.js Auth API 路由 - 登出
 */

import { NextRequest, NextResponse } from 'next/server';
import { readUpstreamJson } from '@/lib/read-upstream-json';
import {
  getUpstreamApiBaseUrl,
  getUpstreamRequestOrigin,
  upstreamConnectionErrorPayload,
} from '@/lib/upstream-api-base';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('lvzhi_access_token')?.value || null;

  let response: Response;
  try {
    response = await fetch(`${getUpstreamApiBaseUrl()}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: getUpstreamRequestOrigin(),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
  } catch (e) {
    return NextResponse.json(upstreamConnectionErrorPayload(e), { status: 502 });
  }

  const data = await readUpstreamJson(response);

  const nextResponse = NextResponse.json(data, { status: response.status });
  nextResponse.cookies.delete('lvzhi_access_token');
  nextResponse.cookies.delete('lvzhi_refresh_token');
  nextResponse.cookies.delete('lvzhi_user_role');

  return nextResponse;
}
