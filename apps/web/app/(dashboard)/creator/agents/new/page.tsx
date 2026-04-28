"use client"

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentCategory } from "@/lib/api/types";

const CREATOR_RISK_ITEMS = [
  { type: "paid", text: "商用智能体：若发生外泄或盗用，平台将协助向相关渠道申请下架类似侵权产品，但平台不承诺赔偿任何损失。" },
  { type: "free", text: "免费智能体：若发生外泄，平台将提供必要维权协助，具体责任由创作者自行承担。" },
  { type: "all",  text: "所有智能体：创作者对智能体内容的准确性及合规性负责，平台不对咨询内容产生的法律结果承担任何责任。" },
  { type: "all",  text: "提交前请确保内容不涉及虚假信息、违法建议或侵犯第三方权益的内容，否则将被驳回并可能影响账号状态。" },
];

export default function NewAgentPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<AgentCategory | "">("");
  const [price, setPrice] = useState("0");
  const [isFreeTrial, setIsFreeTrial] = useState(true);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [showRisk, setShowRisk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!riskAcknowledged) { setError("请先确认风险告知声明后再提交"); return; }
    setError(null);
    setLoading(true);

    try {
      await api.agents.create({
        name,
        description,
        category: category || undefined,
        price: parseFloat(price) || 0,
        is_free_trial: isFreeTrial,
      });

      router.push("/creator");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
      setLoading(false);
    }
  }

  return (
    <div className="page-shell py-6 max-w-2xl space-y-8">
      <Link href="/creator" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← 返回工作台
      </Link>

      <div>
        <p className="text-sm text-[var(--muted)]">律师工作台</p>
        <h1 className="text-2xl font-bold text-[var(--ink)]">创建智能体</h1>
        <p className="text-sm text-[var(--muted)] mt-1">提交后需等待平台审核，审核通过后上线</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">智能体名称 *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="如：合同风险审查助手"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">分类</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as AgentCategory)}>
            <SelectTrigger id="category">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contract">合同</SelectItem>
              <SelectItem value="litigation">诉讼</SelectItem>
              <SelectItem value="consultation">咨询</SelectItem>
              <SelectItem value="compliance">合规</SelectItem>
              <SelectItem value="other">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">功能描述</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述这个智能体能为用户做什么..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">定价（元）</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0 = 免费"
            />
          </div>
          <div className="space-y-2">
            <Label>免费试用</Label>
            <div className="flex items-center gap-3 h-10">
              <button
                type="button"
                onClick={() => setIsFreeTrial(!isFreeTrial)}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  isFreeTrial ? "bg-[var(--accent)]" : "bg-[var(--line)]"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    isFreeTrial ? "left-5" : "left-1"
                  }`}
                />
              </button>
              <span className="text-sm text-[var(--muted)]">
                {isFreeTrial ? "允许试用" : "不允许试用"}
              </span>
            </div>
          </div>
        </div>

        {/* Creator risk notice */}
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-orange-500 shrink-0">🔔</span>
            <p className="text-sm font-semibold text-orange-800">发布前风险提示</p>
          </div>
          {showRisk && (
            <ul className="space-y-2 pl-2">
              {CREATOR_RISK_ITEMS.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#5D4E3A] leading-relaxed">
                  <span className="shrink-0 text-orange-400 font-bold">·</span>
                  {item.text}
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setShowRisk(!showRisk)}
              className="text-xs text-orange-700 underline"
            >
              {showRisk ? "收起" : "展开查看完整说明"}
            </button>
            <label className="flex items-center gap-2 text-xs text-[#D4A574] cursor-pointer">
              <input
                type="checkbox"
                checked={riskAcknowledged}
                onChange={(e) => setRiskAcknowledged(e.target.checked)}
                className="h-4 w-4 rounded border-[#B8A88A]"
              />
              我已阅读并同意上述风险提示
            </label>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            取消
          </Button>
          <Button type="submit" disabled={loading || !name || !riskAcknowledged}>
            {loading ? "提交中..." : "提交审核"}
          </Button>
        </div>
      </form>
    </div>
  );
}
