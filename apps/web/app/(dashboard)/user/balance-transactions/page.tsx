"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api/client";
import { Wallet } from "lucide-react";

export default function BalanceTransactionsPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.balance.getTransactions({ page: 1, limit: 50 });
        if (!cancelled) {
          setRows(res.items);
          setTotal(res.total);
        }
      } catch (e) {
        if (e instanceof ApiError && (e.statusCode === 401 || e.statusCode === 403)) {
          window.location.href = "/login";
          return;
        }
        if (!cancelled) setError("暂时无法加载流水");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)] text-[#2C2416]">
      <main className="mx-auto max-w-4xl px-6 py-10 lg:px-8 space-y-6">
        <Link href="/user" className="text-sm text-[#9A8B78] hover:text-[#D4A574]">
          ← 返回个人中心
        </Link>
        <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <Wallet className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold">积分流水</h1>
              <p className="text-sm text-[#9A8B78]">共 {total} 条记录（当前页最多 50 条）</p>
            </div>
          </div>
          {loading && <p className="text-sm text-[#9A8B78]">加载中…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && rows.length === 0 && (
            <p className="text-sm text-[#9A8B78]">暂无流水，去充值或体验智能体后即可产生记录。</p>
          )}
          {!loading && !error && rows.length > 0 && (
            <ul className="divide-y divide-[rgba(212,165,116,0.15)] rounded-2xl border border-[rgba(212,165,116,0.15)]">
              {rows.map((item, i) => (
                <li key={(item.id as string) ?? i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="text-[#5D4E3A]">
                    {(item.description as string) || (item.type as string) || "变动"}
                  </span>
                  <span className="font-medium text-[#2C2416]">
                    {item.amount != null ? String(item.amount) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/recharge"
            className="inline-flex rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-2 text-sm font-semibold text-white"
          >
            去充值
          </Link>
        </div>
      </main>
    </div>
  );
}
