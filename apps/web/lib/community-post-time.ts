/** 社区帖子发布时间：统一 Asia/Shanghai，便于展示与按日筛选对齐 */

const SHANGHAI = "Asia/Shanghai";

/** 用于与 `<input type="date">` 比对：上海时区日历日 YYYY-MM-DD */
export function postPublishedYmdInShanghai(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** 今天（上海）YYYY-MM-DD，用于日期控件 max */
export function todayYmdInShanghai(): string {
  return postPublishedYmdInShanghai(new Date().toISOString());
}

/**
 * 展示用：上海时区 YYYY-MM-DD HH:mm:ss（24h），与按日筛选同一时区
 */
export function formatPostPublishedAtDisplay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const g = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  const y = g("year");
  const mo = g("month");
  const day = g("day");
  const h = g("hour");
  const mi = g("minute");
  const s = g("second");
  if (!y) return "—";
  return `${y}-${mo}-${day} ${h}:${mi}:${s}`;
}

/** `<time datetime>` 使用 UTC ISO，便于程序解析 */
export function postPublishedAtIsoAttribute(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}
