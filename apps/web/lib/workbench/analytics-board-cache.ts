export type AnalyticsBoardCachePayload = {
  postAgg: {
    post_count: number;
    total_views: number;
    total_comments: number;
    total_likes: number;
    total_dislikes: number;
    total_skill_downloads: number;
    top_posts: Record<string, unknown>[];
  } | null;
  publishViewTotal: number;
  applyViewTotal: number;
};

const TTL_MS = 120_000;

let store: { ts: number; data: AnalyticsBoardCachePayload } | null = null;

export function readAnalyticsBoardCache(now = Date.now()): AnalyticsBoardCachePayload | null {
  if (!store || now - store.ts >= TTL_MS) return null;
  return store.data;
}

export function writeAnalyticsBoardCache(data: AnalyticsBoardCachePayload, now = Date.now()) {
  store = { ts: now, data };
}

export function clearAnalyticsBoardCache() {
  store = null;
}
