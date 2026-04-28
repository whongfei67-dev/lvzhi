/** 侧栏项 `appRoute` 是否与当前 URL 匹配（用于生产工作台高亮） */
export function workbenchAppRouteActive(appRoute: string, pathname: string, urlHash: string): boolean {
  const [pathPart, frag] = appRoute.split("#");
  const base = pathPart || "/";
  const normHash = urlHash.startsWith("#") ? urlHash : urlHash ? `#${urlHash}` : "";
  if (pathname !== base && !pathname.startsWith(`${base}/`)) return false;
  if (frag) return normHash === `#${frag}`;
  return pathname === base && normHash === "";
}
