#!/usr/bin/env node
/**
 * 内测工程：站内 href 与 App Router 页面路径对照
 *
 * 用法（在仓库根 律植（新）代码 下）：
 *   node scripts/audit-internal-links.mjs
 *
 * 说明：
 * - 从 apps/web 下 .tsx/.ts 提取 href="/..."（含 Link、router.push 等常见写法）
 * - 从 apps/web/app 下各层 page.tsx 生成路由（忽略 (group) 段，[param] 转为可匹配段）
 * - 输出：未匹配路径（需人工判断动态参数、middleware 301 等）
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WEB = join(ROOT, "apps", "web");
const APP = join(WEB, "app");

function walkFiles(dir, exts, out = []) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    if (name === "node_modules" || name === ".next") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkFiles(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

/** app/(group)/x/[y]/page.tsx -> /x/[y] */
function pageFileToRoute(file) {
  const normalized = file.replace(/\\/g, "/");
  const marker = "/app/";
  const i = normalized.indexOf(marker);
  const rel = (i === -1 ? normalized : normalized.slice(i + marker.length)).replace(
    /\/page\.tsx$/,
    ""
  );
  const segments = rel.split("/").filter((s) => s && !/^\([^)]+\)$/.test(s));
  if (segments.length === 0) return "/";
  return "/" + segments.join("/");
}

/** /a/[b]/c -> 可匹配正则 */
function routeToRegex(route) {
  const parts = route.split("/").filter(Boolean);
  let body = "";
  for (const part of parts) {
    body += "/";
    if (/^\[[^/]+\]$/.test(part)) body += "[^/]+";
    else body += part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${body || "/"}$`);
}

function collectRoutes() {
  const pages = walkFiles(APP, [".tsx"]);
  const routes = [];
  for (const f of pages) {
    const norm = f.replace(/\\/g, "/");
    if (!norm.endsWith("/page.tsx")) continue;
    if (norm.includes("/app/api/")) continue;
    routes.push(pageFileToRoute(f));
  }
  return [...new Set(routes)].sort();
}

const HREF_RE =
  /(?:href|router\.push)\s*=\s*["'](\/[a-zA-Z0-9/_\-]*(?:\[[^\]]*\])?)(?:\?[^"']*)?["']/g;

/** 从 middleware.ts 提取 source，这些路径由 301 承接，不视为缺页 */
function middlewareRedirectSources() {
  const mwPath = join(WEB, "middleware.ts");
  let text;
  try {
    text = readFileSync(mwPath, "utf8");
  } catch {
    return new Set();
  }
  const sources = new Set();
  const re = /source:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = m[1];
    if (raw.includes(":")) {
      // /foo/:id → 仅登记前缀 /foo 用于前缀匹配（粗略）
      const prefix = raw.split("/:")[0];
      if (prefix) sources.add(prefix);
    } else {
      sources.add(raw.replace(/\/$/, "") || "/");
    }
  }
  return sources;
}

function collectHrefs() {
  const files = walkFiles(WEB, [".tsx", ".ts"]);
  const hrefs = new Set();
  for (const file of files) {
    if (file.includes("node_modules") || file.includes(".next")) continue;
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    let m;
    const re = new RegExp(HREF_RE.source, "g");
    while ((m = re.exec(text)) !== null) {
      let path = m[1].split("?")[0];
      if (path.startsWith("//")) continue;
      if (!path.startsWith("/")) continue;
      path = path.replace(/\/$/, "") || "/";
      hrefs.add(path);
    }
  }
  return [...hrefs].sort();
}

function matchesAnyRoute(path, routeRegexes) {
  const norm = path.replace(/\/$/, "") || "/";
  for (const re of routeRegexes) {
    if (re.test(norm)) return true;
  }
  return false;
}

function main() {
  const routes = collectRoutes();
  const routeRegexes = routes.map(routeToRegex);
  const hrefs = collectHrefs();
  const middlewareSources = middlewareRedirectSources();

  const skipPrefixes = [
    "/api/",
    "/_next/",
    "/favicon",
  ];

  const suspicious = [];
  for (const h of hrefs) {
    if (skipPrefixes.some((p) => h.startsWith(p))) continue;
    if (matchesAnyRoute(h, routeRegexes)) continue;
    const norm = h.replace(/\/$/, "") || "/";
    if (middlewareSources.has(norm)) continue;
    if ([...middlewareSources].some((s) => s.startsWith("/") && norm.startsWith(s + "/"))) continue;
    suspicious.push(h);
  }

  console.log("=== 律植站内链接审计（内测）===\n");
  console.log(`页面路由数: ${routes.length}`);
  console.log(`提取的站内 path 数: ${hrefs.length}`);
  console.log(`未匹配任一 page 规则的路径数: ${suspicious.length}\n`);

  if (suspicious.length) {
    console.log("--- 需人工核对（可能为动态段、外链误抓、或真实缺页）---");
    for (const p of suspicious) console.log(p);
    console.log("");
  }

  console.log("提示：middleware 301、外部资源、以及客户端拼接的 URL 不会出现在本统计中。");
  process.exit(suspicious.length > 30 ? 0 : 0);
}

main();
