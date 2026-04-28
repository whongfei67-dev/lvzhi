import { NextRequest, NextResponse } from "next/server";

import { readUpstreamJson } from "@/lib/read-upstream-json";
import {
  getUpstreamApiBaseUrl,
  getUpstreamRequestOrigin,
  upstreamConnectionErrorPayload,
} from "@/lib/upstream-api-base";

type RouteParams = { params: Promise<{ path: string[] }> };

function getTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get("lvzhi_access_token")?.value || null;
}

async function forward(request: NextRequest, params: RouteParams, method: string) {
  const { path } = await params.params;
  const token = getTokenFromCookie(request);
  const browserCookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type") || "";
  const search = request.nextUrl.searchParams.toString();
  const url = `${getUpstreamApiBaseUrl()}/api/${path.join("/")}${search ? `?${search}` : ""}`;

  const headers: Record<string, string> = {
    Origin: getUpstreamRequestOrigin(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (browserCookie) headers.Cookie = browserCookie;
  if (contentType && !contentType.includes("multipart/form-data")) {
    headers["Content-Type"] = contentType;
  }

  let body: BodyInit | undefined;
  if (!["GET", "DELETE"].includes(method)) {
    if (contentType.includes("multipart/form-data")) {
      body = await request.formData();
    } else if (contentType.includes("application/json") || contentType.includes("application/x-www-form-urlencoded")) {
      body = await request.text();
    } else {
      const buf = await request.arrayBuffer();
      body = buf.byteLength > 0 ? new Uint8Array(buf) : undefined;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: "include",
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

export async function GET(request: NextRequest, params: RouteParams) {
  return forward(request, params, "GET");
}

export async function POST(request: NextRequest, params: RouteParams) {
  return forward(request, params, "POST");
}

export async function PUT(request: NextRequest, params: RouteParams) {
  return forward(request, params, "PUT");
}

export async function PATCH(request: NextRequest, params: RouteParams) {
  return forward(request, params, "PATCH");
}

export async function DELETE(request: NextRequest, params: RouteParams) {
  return forward(request, params, "DELETE");
}
