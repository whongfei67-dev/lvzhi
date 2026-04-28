"use client"

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const categoryOptions = [
  { value: "contract", label: "合同" },
  { value: "litigation", label: "诉讼" },
  { value: "consultation", label: "咨询" },
  { value: "compliance", label: "合规" },
  { value: "ip", label: "知识产权" },
  { value: "labor", label: "劳动" },
  { value: "family", label: "家庭" },
  { value: "criminal", label: "刑事" },
  { value: "other", label: "其他" },
];

interface AgentData {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  is_free_trial: boolean;
  status: string;
  avatar_url?: string;
  view_count?: number;
  trial_count?: number;
  favorite_count?: number;
  rating?: number;
  created_at: string;
}

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [category, setCategory] = useState("other");
  const [isFreeTrial, setIsFreeTrial] = useState(true);
  const [status, setStatus] = useState("pending_review");
  const [agent, setAgent] = useState<AgentData | null>(null);

  useEffect(() => {
    async function load() {
      if (!agentId) {
        router.push("/creator");
        return;
      }

      try {
        const data = await api.agents.getById(agentId) as unknown as AgentData;
        if (!data) {
          router.push("/creator");
          return;
        }

        setAgent(data);
        setName(data.name);
        setDescription(data.description ?? "");
        setPrice(String(data.price ?? 0));
        setCategory(data.category ?? "other");
        setIsFreeTrial(data.is_free_trial ?? true);
        setStatus(data.status || "pending_review");
      } catch (error) {
        console.error('Failed to load agent:', error);
        router.push("/creator");
        return;
      }
      setLoading(false);
    }
    load();
  }, [agentId, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await api.agents.update(agentId, {
        name,
        description,
        price: parseFloat(price) || 0,
        category,
        is_free_trial: isFreeTrial,
      });
      setMessage({ type: "success", text: "已保存" });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "保存失败，请重试" });
    }
    setSaving(false);
  }

  async function handleUnpublish() {
    setSaving(true);
    try {
      await api.agents.update(agentId, { status: "pending_review" });
      setStatus("pending_review");
      setMessage({ type: "success", text: "已转为提交审核状态，等待平台复审" });
    } catch (error) {
      setMessage({ type: "error", text: "操作失败" });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center">
        <p className="text-[#9A8B78]">加载中...</p>
      </div>
    );
  }

  const conversionRate = agent && agent.trial_count && agent.trial_count > 0
    ? Math.round(((agent.favorite_count || 0) / agent.trial_count) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)] py-6">
      <div className="mx-auto max-w-2xl px-6 space-y-8">
        <Link href="/creator" className="text-sm text-[#9A8B78] hover:text-[#D4A574]">
          ← 返回工作台
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-[#9A8B78]">编辑智能体</p>
            <h1 className="text-2xl font-bold text-[#2C2416]">{name}</h1>
          </div>
          <Badge
            variant={
              ["approved", "active", "published"].includes(status) ? "default" : status === "rejected" ? "destructive" : "secondary"
            }
          >
            {({
              pending: "审核中",
              pending_review: "审核中",
              approved: "审核通过已上架",
              active: "审核通过已上架",
              published: "审核通过已上架",
              rejected: "已拒绝",
              hidden: "已下架",
              inactive: "已下架",
            } as Record<string, string>)[status] ?? status}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-center">
            <p className="text-2xl font-bold text-[#2C2416]">{agent?.trial_count || 0}</p>
            <p className="text-xs text-[#9A8B78]">试用次数</p>
          </div>
          <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-center">
            <p className="text-2xl font-bold text-[#D4A574]">{conversionRate}%</p>
            <p className="text-xs text-[#9A8B78]">转化率</p>
          </div>
          <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-center">
            <p className="text-2xl font-bold text-[#D4A574]">{agent?.favorite_count || 0}</p>
            <p className="text-xs text-[#9A8B78]">收藏次数</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">智能体名称</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="介绍这个智能体能做什么..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] text-sm text-[#2C2416] focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">定价（元，0 为免费）</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="freeTrial"
              type="checkbox"
              checked={isFreeTrial}
              onChange={(e) => setIsFreeTrial(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <Label htmlFor="freeTrial">允许免费试用</Label>
          </div>

          {message && (
            <p className={`text-sm px-3 py-2 rounded-lg ${
              message.type === "success"
                ? "text-[#D4A574] bg-[rgba(212,165,116,0.08)]"
                : "text-red-600 bg-red-50"
            }`}>
              {message.text}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "保存中..." : "保存修改"}
            </Button>
            {["approved", "active", "published"].includes(status) && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleUnpublish}
                disabled={saving}
              >
                提交下架审核
              </Button>
            )}
            <Link
              href={`/agents/${agentId}`}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white px-4 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)] transition-colors"
            >
              查看公开页面
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}