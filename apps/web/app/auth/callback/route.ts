/**
 * Next.js Auth Callback 路由 - 处理 OAuth 回调
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next') || '/workspace';

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (response.ok) {
      // 复制 Set-Cookie 头
      const setCookieHeaders = response.headers.getSetCookie();
      const nextResponse = NextResponse.redirect(`${origin}${next}`);
      setCookieHeaders.forEach(cookie => {
        nextResponse.headers.append('Set-Cookie', cookie);
      });
      return nextResponse;
    } else {
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(data.message || 'OAuth failed')}`);
    }
  } catch {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('OAuth callback failed')}`);
  }
}
