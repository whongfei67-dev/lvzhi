/**
 * Next.js API 路由 - 代理到 Fastify 后端
 */

import { NextRequest, NextResponse } from 'next/server';
import { readUpstreamJson } from '@/lib/read-upstream-json';
import {
  getUpstreamApiBaseUrl,
  getUpstreamRequestOrigin,
  upstreamConnectionErrorPayload,
} from '@/lib/upstream-api-base';

function getTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get('lvzhi_access_token')?.value || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const token = getTokenFromCookie(request);
  const searchParams = request.nextUrl.searchParams.toString();
  
  const url = `${getUpstreamApiBaseUrl()}/api/${path.join('/')}${searchParams ? `?${searchParams}` : ''}`;
  
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const token = getTokenFromCookie(request);
  const browserCookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type") || "";
  let body: BodyInit | undefined;

  if (contentType.includes("multipart/form-data")) {
    body = await request.formData();
  } else if (contentType.includes("application/json")) {
    body = await request.text();
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    body = await request.text();
  } else {
    const buf = await request.arrayBuffer();
    body = buf.byteLength > 0 ? new Uint8Array(buf) : undefined;
  }
  
  const url = `${getUpstreamApiBaseUrl()}/api/${path.join('/')}`;
  
  const headers: Record<string, string> = {
    Origin: getUpstreamRequestOrigin(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (browserCookie) headers.Cookie = browserCookie;
  // multipart 由 fetch 自动补 boundary，不能手写 Content-Type
  if (contentType && !contentType.includes("multipart/form-data")) {
    headers["Content-Type"] = contentType;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const token = getTokenFromCookie(request);
  const body = await request.json();
  
  const url = `${getUpstreamApiBaseUrl()}/api/${path.join('/')}`;
  
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Origin: getUpstreamRequestOrigin(),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(body),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const token = getTokenFromCookie(request);
  const body = await request.json();

  const url = `${getUpstreamApiBaseUrl()}/api/${path.join('/')}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: getUpstreamRequestOrigin(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(body),
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const token = getTokenFromCookie(request);
  
  const url = `${getUpstreamApiBaseUrl()}/api/${path.join('/')}`;
  
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'DELETE',
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

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }

  return NextResponse.json(data);
}
