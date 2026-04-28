import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "web",
    runtime: "vercel-nextjs",
    timestamp: new Date().toISOString(),
  });
}
