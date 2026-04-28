/**
 * 安全解析上游 HTTP 响应体为 JSON，避免 `response.json()` 在非 JSON 时抛错导致 Next 路由 500。
 */
export async function readUpstreamJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: "Upstream returned non-JSON body", snippet: text.slice(0, 400) };
  }
}
