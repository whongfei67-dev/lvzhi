import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_ACCESS_COOKIE_NAME, isProtectedAppPath } from "@/lib/auth/protected-app-paths";

/**
 * 律植项目路由重定向配置（对齐《律植项目蓝图 v6.4》）
 *
 * 目的：旧 URL 301、蓝图路径别名到当前 App Router 实现
 * HTTP 状态码：301 (永久重定向)
 */

const redirects: Array<{ source: string; destination: string; permanent: boolean }> = [
  { source: "/auth/login", destination: "/login", permanent: true },

  // ─── 蓝图 11.4：/dashboard/* → 当前 (dashboard) 组内短路径 ─────────────────
  { source: "/dashboard/payment/callback", destination: "/payment/callback", permanent: true },
  { source: "/dashboard/recruiter/jobs/new", destination: "/opportunities/create", permanent: true },
  { source: "/dashboard/recruiter/jobs/:id/applicants", destination: "/workspace/invitations", permanent: true },
  { source: "/dashboard/recruiter", destination: "/workspace/invitations", permanent: true },
  { source: "/dashboard/user", destination: "/user", permanent: true },
  { source: "/dashboard/profile", destination: "/profile", permanent: true },
  { source: "/dashboard/verify", destination: "/verify", permanent: true },
  { source: "/dashboard/recharge", destination: "/recharge", permanent: true },
  { source: "/dashboard/seeker", destination: "/opportunities", permanent: true },
  { source: "/dashboard", destination: "/workspace", permanent: true },

  // ─── Agents → Inspiration ────────────────────────────────────────────────
  { source: "/agents", destination: "/inspiration", permanent: true },
  { source: "/agents/featured", destination: "/inspiration/featured", permanent: true },
  { source: "/agents/category/:slug", destination: "/inspiration/category/:slug", permanent: true },
  { source: "/agents/topic/:slug", destination: "/inspiration/tag/:slug", permanent: true },
  { source: "/agents/:id", destination: "/inspiration/:id/agent", permanent: true },

  // ─── Jobs → Opportunities ────────────────────────────────────────────────
  { source: "/jobs", destination: "/opportunities", permanent: true },
  { source: "/jobs/:id", destination: "/opportunities/jobs/:id", permanent: true },
  { source: "/jobs/category/:slug", destination: "/opportunities/:category/:slug", permanent: true },
  { source: "/jobs/path/:slug", destination: "/opportunities/:category/:slug", permanent: true },

  // ─── Classroom → 创作指南下课堂（蓝图 §7.4）────────────────────────────────
  { source: "/classroom", destination: "/creator-guide/classroom", permanent: true },
  { source: "/classroom/topics/:slug", destination: "/creator-guide/tutorials", permanent: true },
  { source: "/classroom/templates", destination: "/creator-guide/classroom/templates", permanent: true },
  { source: "/classroom/templates/:slug", destination: "/creator-guide/classroom/templates", permanent: true },
  { source: "/classroom/cases", destination: "/creator-guide/classroom/cases", permanent: true },
  { source: "/classroom/cases/:slug", destination: "/creator-guide/classroom/cases", permanent: true },
  { source: "/classroom/:slug", destination: "/creator-guide/classroom/:slug", permanent: true },

  // ─── Lawyers ──────────────────────────────────────────────────────────────
  { source: "/find-lawyer/contact/:id", destination: "/lawyers/contact/:id", permanent: true },
  { source: "/find-lawyer/contact", destination: "/lawyers/contact", permanent: true },
  { source: "/find-lawyer", destination: "/lawyers", permanent: true },
  { source: "/find-lawyer/:id", destination: "/lawyers/:id", permanent: true },
  { source: "/lawyers/domain/:practiceArea", destination: "/lawyers/category/:practiceArea", permanent: true },

  // ─── Community ─────────────────────────────────────────────────────────────
  { source: "/community/new", destination: "/community/create", permanent: true },

  // ─── Creators → Creator Guide ─────────────────────────────────────────────
  { source: "/creators/policies", destination: "/creator-guide/policies", permanent: true },
  { source: "/creators/policies/:slug", destination: "/creator-guide/policies/:slug", permanent: true },
  { source: "/creators/policy", destination: "/creator-guide/policies", permanent: true },
  { source: "/creators/policy/:slug", destination: "/creator-guide/policies/:slug", permanent: true },
  { source: "/creators/:id", destination: "/inspiration/creators/:id", permanent: true },
  { source: "/creators", destination: "/inspiration", permanent: true },

  // ─── Legacy Pages (删除) ──────────────────────────────────────────────────
  { source: "/enterprise", destination: "/inspiration", permanent: true },
  { source: "/enterprise/contact", destination: "/contact", permanent: true },
  { source: "/enterprise/services", destination: "/inspiration", permanent: true },
  { source: "/marketplace", destination: "/inspiration", permanent: true },
  { source: "/marketplace/all", destination: "/inspiration", permanent: true },
  { source: "/academy", destination: "/creator-guide", permanent: true },
  { source: "/academy/courses", destination: "/creator-guide/tutorials", permanent: true },
  { source: "/creator/guide", destination: "/creator-guide", permanent: true },
  { source: "/creator-guide/contribute", destination: "/creator-guide/getting-started", permanent: true },
  { source: "/creator-center", destination: "/creator-guide/center", permanent: true },
  { source: "/creator-center/template", destination: "/creator-guide/template", permanent: true },
  { source: "/creator-center/case", destination: "/creator-guide/case", permanent: true },
  { source: "/creator-center/guide", destination: "/creator-guide/center/guide", permanent: true },
  { source: "/creator-center/template/:slug", destination: "/creator-guide/template", permanent: true },
  { source: "/creator-center/case/:slug", destination: "/creator-guide/case", permanent: true },
  { source: "/creator-center/guide/:slug", destination: "/creator-guide/center/guide", permanent: true },

  // ─── Cooperation → Opportunities ──────────────────────────────────────────
  { source: "/cooperation", destination: "/opportunities", permanent: true },
  { source: "/cooperation/enterprise", destination: "/opportunities", permanent: true },
  { source: "/cooperation/tech", destination: "/opportunities", permanent: true },
  { source: "/cooperation/law-firm", destination: "/opportunities", permanent: true },
  { source: "/cooperation/promotion", destination: "/opportunities", permanent: true },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  for (const redirect of redirects) {
    // 简单模式匹配
    const sourcePattern = redirect.source.replace(/:(\w+)/g, "([^/]+)");
    const regex = new RegExp(`^${sourcePattern}$`);

    if (regex.test(pathname)) {
      // 替换路径参数
      let destination = redirect.destination;
      const matches = pathname.match(regex);

      if (matches) {
        // 获取参数名
        const paramNames = redirect.source.match(/:(\w+)/g) || [];
        paramNames.forEach((param, index) => {
          const paramName = param.slice(1); // 移除冒号
          destination = destination.replace(`:${paramName}`, matches[index + 1]);
        });
      }

      return NextResponse.redirect(
        new URL(destination, request.url),
        redirect.permanent ? 301 : 302
      );
    }
  }

  /** 无 access_token 时不进入需登录区，避免 RSC 布局链反复阻塞上游 `/api/auth/me` */
  if (isProtectedAppPath(pathname) && !request.cookies.get(AUTH_ACCESS_COOKIE_NAME)?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 匹配所有路径，排除 API、内部文件和静态资源
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
