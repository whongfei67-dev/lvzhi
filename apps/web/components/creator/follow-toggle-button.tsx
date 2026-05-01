"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, api, getSession } from "@/lib/api/client";

type Props = {
  targetUserId: string;
  className?: string;
};

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim());
}

export function FollowToggleButton({ targetUserId, className }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSession();
        if (cancelled) return;
        if (!s?.id) {
          setAuthed(false);
          setLoading(false);
          return;
        }
        setAuthed(true);
        if (String(s.id) === String(targetUserId)) {
          setIsSelf(true);
          setLoading(false);
          return;
        }
        const state = await api.users.getFollowStatus(targetUserId);
        if (cancelled) return;
        setIsFollowing(Boolean(state?.is_following));
      } catch {
        if (!cancelled) {
          setAuthed(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetUserId]);

  if (isSelf || !isUuid(targetUserId)) return null;

  const onToggle = async () => {
    if (busy) return;
    if (!authed) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const res = await api.users.toggleFollow(targetUserId);
      setIsFollowing(Boolean(res.is_following));
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        router.push("/login");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading || busy}
      className={
        className ??
        `inline-flex h-10 items-center rounded-2xl px-4 text-sm font-semibold transition ${
          isFollowing
            ? "border border-[rgba(212,165,116,0.35)] text-[#B8860B] hover:bg-[rgba(212,165,116,0.08)]"
            : "bg-gradient-to-r from-[#D4A574] to-[#B8860B] text-white"
        } disabled:cursor-not-allowed disabled:opacity-60`
      }
    >
      {loading ? "加载中..." : isFollowing ? "取消关注" : "关注"}
    </button>
  );
}
