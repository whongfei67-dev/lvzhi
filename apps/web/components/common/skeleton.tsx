export function AgentCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="h-6 w-16 rounded-full bg-slate-200" />
        <div className="h-4 w-12 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function LawyerCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center space-y-1">
            <div className="h-5 w-8 mx-auto rounded bg-slate-200" />
            <div className="h-3 w-12 mx-auto rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-5/6 rounded bg-slate-100" />
        </div>
      </div>
      <div className="flex items-center gap-4 pl-11">
        <div className="h-3 w-16 rounded bg-slate-100" />
        <div className="h-3 w-16 rounded bg-slate-100" />
        <div className="h-3 w-16 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, type = "agent" }: { count?: number; type?: "agent" | "lawyer" | "post" }) {
  const Skeleton = type === "agent" ? AgentCardSkeleton : type === "lawyer" ? LawyerCardSkeleton : PostCardSkeleton;

  return (
    <div className={`grid gap-4 ${type === "post" ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{ animationDelay: `${i * 50}ms` }}
          className="opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]"
        >
          <Skeleton />
        </div>
      ))}
    </div>
  );
}
