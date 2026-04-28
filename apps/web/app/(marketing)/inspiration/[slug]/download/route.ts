import { NextRequest, NextResponse } from "next/server";

/**
 * 演示环境：免费作品「获取产品 / 产品说明书」占位下载。
 * 正式环境应由订单与授权接口返回真实文件地址或流。
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug: rawSlug } = await context.params;
  const slug = decodeURIComponent(rawSlug);
  const kind = req.nextUrl.searchParams.get("kind") === "manual" ? "manual" : "product";
  const title = kind === "manual" ? "产品说明书" : "产品包";
  const body = `【律植演示】\n作品：${slug}\n类型：${title}\n\n本文件为占位下载，仅供演示与权限验收。正式上线后，以订单与授权记录为准。\n`;
  const asciiName = kind === "manual" ? "manual-demo.txt" : "product-demo.txt";

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${asciiName}"`,
    },
  });
}
