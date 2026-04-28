export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth/roles";
import { getServerSession } from "@/lib/auth/server-session";
import { admin } from "@/lib/api/client";
export default async function AdminCommunityPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // 权限检查：只有 admin 和 superadmin 可以访问
  if (!isAdmin(session)) {
    redirect("/workspace");
  }

  const isSuperadmin = session.role === "superadmin";

  // 获取帖子列表
  let posts: { id: string; content: string | null; created_at: string; user_id: string | null; author?: { display_name: string | null } }[] = [];

  try {
    const result = await admin.getPosts({ limit: 50 });
    posts = result.items as typeof posts;
  } catch (error) {
    console.error("Failed to fetch posts:", error);
  }

  return (
    <div className="min-h-screen bg-[#F7FBFE]">
      <main className="mx-auto max-w-7xl px-6 py-6 lg:px-6">
        <div className="space-y-6">
            {/* Header */}
            <section className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
              <p className="text-sm font-semibold text-[#5C9EEB]">管理端</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#26363D]">社区内容管理</h1>
              <p className="mt-3 text-[#55656D]">查看并删除违规或不当的社区帖子。删除操作不可撤销。</p>
            </section>

            {/* Post list */}
            <div className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-[#26363D]">最新帖子（最近 50 条）</h2>
              {!posts.length ? (
                <p className="py-4 text-sm text-[#87949B]">暂无社区帖子</p>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div key={post.id} className="flex items-start justify-between gap-4 rounded-2xl border border-[#EDF3F6] p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[#26363D]">
                            {post.author?.display_name ?? "匿名用户"}
                          </span>
                          <span className="text-xs text-[#87949B]">
                            {new Date(post.created_at).toLocaleString("zh-CN")}
                          </span>
                        </div>
                        <p className="text-sm text-[#55656D] line-clamp-3 leading-relaxed">
                          {post.content ?? "（无内容）"}
                        </p>
                      </div>
                      <DeletePostButton postId={post.id} />
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>
      </main>
    </div>
  );
}

// 删除帖子按钮组件
async function DeletePostButton({ postId }: { postId: string }) {
  "use server";

  async function deletePost() {
    "use server";
    try {
      await admin.deletePost(postId);
      revalidatePath("/admin/community");
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  }

  return (
    <form action={deletePost} className="shrink-0">
      <button className="rounded-xl border border-[#FDF1EC] bg-[#FDF1EC] px-3 py-2 text-xs font-medium text-[#A46D5D] hover:bg-[#F5E0D8] transition-colors">
        删除
      </button>
    </form>
  );
}
