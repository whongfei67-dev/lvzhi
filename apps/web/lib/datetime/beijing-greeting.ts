/** 当前时刻在 Asia/Shanghai 的小时数（0–23） */
export function getBeijingHour(date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === "hour")?.value;
  return Math.min(23, Math.max(0, parseInt(h || "0", 10)));
}

/** 根据北京时间返回问候前缀 +「好」已包含在返回文案中，与昵称拼接：「早上好，张三」 */
export function beijingGreetingWord(date = new Date()): string {
  const hour = getBeijingHour(date);
  if (hour >= 5 && hour < 12) return "早上好";
  if (hour >= 12 && hour < 18) return "下午好";
  if (hour >= 18 && hour < 24) return "晚上好";
  return "您好";
}
