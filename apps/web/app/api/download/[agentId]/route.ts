/**
 * 智能体文件下载 API 路由 - 代理到 Fastify 后端
 */

import { NextRequest, NextResponse } from "next/server";
import { readUpstreamJson } from "@/lib/read-upstream-json";
import {
  getUpstreamApiBaseUrl,
  getUpstreamRequestOrigin,
  upstreamConnectionErrorPayload,
} from "@/lib/upstream-api-base";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;

  let response: Response;
  try {
    response = await fetch(`${getUpstreamApiBaseUrl()}/api/download/${agentId}`, {
      method: "POST",
      headers: {
        Origin: getUpstreamRequestOrigin(),
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
