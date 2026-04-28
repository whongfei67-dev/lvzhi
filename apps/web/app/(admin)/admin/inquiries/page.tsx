export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth/roles";
import { getServerSession } from "@/lib/auth/server-session";
import { admin } from "@/lib/api/client";
const TYPE_LABEL: Record<string, string> = {
  patent_request: "专利申请",
  cooperation: "商业合作",
  feedback: "用户反馈",
  other: "其他",
};

function statusBadge(status: string) {
  if (status === "processed") return "bg-[#E9FAF4] text-[#437365]";
  return "bg-[#FFF8E1] text-[#C8912A]";
}
function statusLabel(status: string) {
  if (status === "processed") return "已处理";
  return "待处理";
}

export default async function AdminInquiriesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // 权限检查：只有 admin 和 superadmin 可以访问
  if (!isAdmin(session)) {
    redirect("/workspace");
  }

  const isSuperadmin = session.role === "superadmin";

  // 获取咨询列表
  let inquiries: { id: string; type: string; status: string; note: string | null; created_at: string; applicant?: { display_name: string | null } }[] = [];

  try {
    const result = await admin.getInquiries({ limit: 50 });
    inquiries = result.items as typeof inquiries;
  } catch (error) {
    console.error("Failed to fetch inquiries:", error);
  }

  const pending = inquiries.filter((i) => i.status !== "processed").length;

  return (
    <div className="min-h-screen bg-[#F7FBFE]">
      <main className="mx-auto max-w-7xl px-6 py-6 lg:px-6">
        <div className="space-y-6">
            {/* Header */}
            <section className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
              <p className="text-sm font-semibold text-[#5C9EEB]">管理端</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#26363D]">申请管理</h1>
              <p className="mt-3 text-[#55656D]">
                查看平台用户提交的申请信息，包括专利申请、商业合作等。当前待处理：
                <span className="ml-1 font-semibold text-[#C8912A]">{pending} 条</span>
              </p>
            </section>

            {/* Inquiry list */}
            <div className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-[#26363D]">全部申请</h2>
              {!inquiries.length ? (
                <p className="py-4 text-sm text-[#87949B]">暂无申请记录</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#F7FBFE] text-[#87949B]">
                      <tr>
                        {["申请人", "申请类型", "状态", "提交时间", "备注", "操作"].map((h) => (
                          <th key={h} className="px-4 py-3 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.map((item) => (
                        <tr key={item.id} className="border-t border-[#EDF3F6] hover:bg-[#F7FBFE]">
                          <td className="px-4 py-3 font-medium text-[#26363D]">
                            {item.applicant?.display_name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-[#55656D]">
                            {TYPE_LABEL[item.type] ?? item.type}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(item.status)}`}>
                              {statusLabel(item.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#87949B]">
                            {new Date(item.created_at).toLocaleString("zh-CN")}
                          </td>
                          <td className="px-4 py-3 text-[#87949B] max-w-[160px] truncate">
                            {item.note ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {item.status !== "processed" && (
                              <MarkProcessedButton inquiryId={item.id} />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
        </div>
      </main>
    </div>
  );
}

// 标记已处理按钮组件
async function MarkProcessedButton({ inquiryId }: { inquiryId: string }) {
  "use server";

  async function markProcessed() {
    "use server";
    try {
      await admin.markInquiryProcessed(inquiryId);
      revalidatePath("/admin/inquiries");
    } catch (error) {
      console.error("Failed to mark inquiry as processed:", error);
    }
  }

  return (
    <form action={markProcessed}>
      <button className="rounded-xl border border-[#DFE9EE] bg-[#F7FBFE] px-3 py-1.5 text-xs font-medium text-[#55656D] hover:bg-[#EDF3F6] transition-colors">
        标记已处理
      </button>
    </form>
  );
}
