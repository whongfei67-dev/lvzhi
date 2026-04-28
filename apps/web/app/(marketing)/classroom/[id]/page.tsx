import Link from "next/link";
import { notFound } from "next/navigation";
import { CLASSROOM_COURSES } from "@/lib/platform-demo-data";

export default async function ClassroomCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: segment } = await params;
  const decoded = decodeURIComponent(segment);
  const base = CLASSROOM_COURSES.find(
    (item) => item.id === segment || item.id === decoded || item.title === decoded,
  );

  if (!base) notFound();

  const lessons = parseInt(String(base.duration).replace(/\D/g, ""), 10) || 12;
  const course = {
    title: base.title,
    level: "标准课程",
    desc: base.description,
    duration: base.duration,
    lessons,
    tags: ["法律", "实务", "智能体"],
  };

  return (
    <div className="page-shell max-w-4xl space-y-8 py-12">
      <Link href="/classroom" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← 返回智能体课堂
      </Link>

      <div className="card p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#D4A574]">智能体课堂 / {course.level}</p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)]">{course.title}</h1>
        <p className="mt-4 text-base leading-8 text-[var(--muted)]">{course.desc}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
            <span className="text-xs text-[var(--muted)]">课程时长</span>
            <p className="mt-1 font-semibold text-[var(--ink)]">{course.duration}</p>
          </div>
          <div className="rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
            <span className="text-xs text-[var(--muted)]">课程节数</span>
            <p className="mt-1 font-semibold text-[var(--ink)]">{course.lessons} 节</p>
          </div>
          <div className="rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
            <span className="text-xs text-[var(--muted)]">适合对象</span>
            <p className="mt-1 font-semibold text-[var(--ink)]">创作者学院新成员</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {course.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] px-3 py-1 text-sm text-[#B8860B]">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["课程目标", "帮助你明确场景定位、创作结构和适合公开演示的表达方式。"],
          ["本节重点", "围绕法律场景的提示词、服务边界和作品承接路径进行拆解。"],
          ["完成后去向", "继续进入创作者学院、发布作品或查看平台政策。"],
        ].map(([title, desc]) => (
          <div key={title} className="card p-5">
            <h2 className="font-semibold text-[var(--ink)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{desc}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-[var(--ink)]">下一步</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/creators" className="rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-2.5 text-sm font-semibold text-white">
            前往创作者学院
          </Link>
          <Link href="/creators/policies" className="rounded-2xl border border-[rgba(212,165,116,0.25)] px-4 py-2.5 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]">
            查看平台政策
          </Link>
        </div>
      </div>
    </div>
  );
}
