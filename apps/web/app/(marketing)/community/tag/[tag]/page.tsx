import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buildTwoCommunityAutoPosts } from "@/lib/community-auto-posts";
import { CommunityPostCard } from "@/components/community/community-post-card";

interface PageProps {
  params: Promise<{ tag: string }>;
}

export const dynamic = "force-dynamic";

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const tagPosts = buildTwoCommunityAutoPosts({
    tag: decodedTag,
    seed: `tag-${decodedTag}`,
  });

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      {/* Hero */}
      <section className="bg-white border-b border-[rgba(212,165,116,0.25)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm text-[#9A8B78] hover:text-[#D4A574] mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            返回社区
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C2416] sm:text-4xl">
            #{decodedTag}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#5D4E3A]">
            浏览带有 #{decodedTag} 标签的所有帖子
          </p>
        </div>
      </section>

      {/* Posts：每页两条，围绕当前标签与法律 Skills */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="space-y-4">
          {tagPosts.map((post) => (
            <CommunityPostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
