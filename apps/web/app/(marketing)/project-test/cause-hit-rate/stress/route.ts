import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function buildSearchStarts() {
  return [process.cwd(), path.dirname(fileURLToPath(import.meta.url))];
}

function resolveStressReportPath(sampleSize: number) {
  const fileCandidates = [`recommendation-stress-${sampleSize}.json`];
  if (sampleSize !== 100) fileCandidates.push("recommendation-stress-100.json");
  const candidates = new Set<string>();

  for (const start of buildSearchStarts()) {
    let current = start;
    for (let depth = 0; depth < 10; depth += 1) {
      for (const fileName of fileCandidates) {
        candidates.add(path.resolve(current, "data-exports", fileName));
      }
      const parent = path.dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const size = Number(new URL(request.url).searchParams.get("size") ?? "100");
    const sampleSize = Number.isFinite(size) && size > 0 ? Math.floor(size) : 100;
    const filePath = resolveStressReportPath(sampleSize);
    if (!filePath) {
      return NextResponse.json({ error: "stress report not found" }, { status: 404 });
    }
    const raw = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(raw) as unknown;
    return NextResponse.json(json, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to load stress report" },
      { status: 500 },
    );
  }
}
