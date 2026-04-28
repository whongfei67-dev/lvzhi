"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getSession, clearSessionCache } from "@/lib/api/client";

const SPECIALTIES = ["合同", "诉讼", "知识产权", "劳动法", "公司法", "刑事辩护", "家事法", "税法", "合规", "并购", "其他"];
const EDUCATION_LEVELS = ["博士", "硕士", "本科", "专科", "其他"];

const roleLabel: Record<string, string> = {
  seeker: "求职方",
  creator: "创作者",
  client: "需求方",
  admin: "管理员",
  superadmin: "超管",
};

export default function ProfilePage() {
  const router = useRouter();

  const [session, setSession] = useState<{ id: string; role: string; email: string; display_name: string; bio?: string; phone?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  const [lawFirm, setLawFirm] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [specialty, setSpecialty] = useState<string[]>([]);

  const [educationLevel, setEducationLevel] = useState("");
  const [school, setSchool] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [skillTagsInput, setSkillTagsInput] = useState("");

  useEffect(() => {
    async function load() {
      const userSession = await getSession();
      if (!userSession) {
        router.push("/login");
        return;
      }
      setSession(userSession as { id: string; role: string; email: string; display_name: string; bio?: string; phone?: string });
      setDisplayName(userSession.display_name || "");
      setBio(userSession.bio || "");
      setPhone(userSession.phone || "");
      setLoading(false);
    }
    load();
  }, [router]);

  function toggleSpecialty(s: string) {
    setSpecialty((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    setSaving(true);
    setMessage(null);

    try {
      // 更新基本资料
      await api.users.updateProfile(session.id, {
        display_name: displayName,
        bio,
        phone,
      });

      setMessage({ type: "success", text: "资料已更新" });
      clearSessionCache();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "保存失败，请重试" });
    }
    setSaving(false);
  }

  async function handleSignOut() {
    try {
      await api.auth.logout();
    } catch {
      // Ignore logout errors
    }
    clearSessionCache();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center">
        <p className="text-[#9A8B78]">加载中...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const role = session.role;

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)] text-[#2C2416]">
      <main className="mx-auto max-w-2xl px-6 py-10 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-semibold text-[#B8860B]">账号设置</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#2C2416]">个人资料</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white px-4 py-2.5 text-sm font-semibold text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)] transition-colors"
          >
            退出登录
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Base info */}
          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
            {/* Avatar & role */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-xl font-bold text-white">
                {(displayName || "?")[0].toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-[#2C2416]">{displayName || "未设置姓名"}</div>
                <div className="text-xs text-[#9A8B78]">角色：{roleLabel[role] ?? role}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#D4A574]">姓名 / 昵称</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你的名字"
                  className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#D4A574]">手机号</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="13800000000"
                  className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#D4A574]">个人简介</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="介绍一下你自己..."
                  rows={3}
                  className="w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 py-3 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Creator fields */}
          {role === "creator" && (
            <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#2C2416]">专业资质</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#D4A574]">执业律所</label>
                    <input
                      type="text"
                      value={lawFirm}
                      onChange={(e) => setLawFirm(e.target.value)}
                      placeholder="律所名称"
                      className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#D4A574]">执业证号</label>
                    <input
                      type="text"
                      value={barNumber}
                      onChange={(e) => setBarNumber(e.target.value)}
                      placeholder="执业证编号"
                      className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#D4A574]">执业年限</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={yearsExp}
                    onChange={(e) => setYearsExp(e.target.value)}
                    placeholder="如：5"
                    className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="mb-3 block text-sm font-medium text-[#D4A574]">专业方向（可多选）</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSpecialty(s)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                          specialty.includes(s)
                            ? "bg-[#D4A574] text-white"
                            : "border border-[rgba(212,165,116,0.25)] text-[#5D4E3A] hover:border-[rgba(212,165,116,0.25)] hover:text-[#B8860B]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seeker fields */}
          {role === "seeker" && (
            <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[#2C2416]">求职档案</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#D4A574]">学历</label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none focus:border-blue-400"
                  >
                    <option value="">请选择</option>
                    {EDUCATION_LEVELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#D4A574]">毕业院校</label>
                    <input
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="学校名称"
                      className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#D4A574]">毕业年份</label>
                    <input
                      type="number"
                      min="1980"
                      max="2030"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="如：2024"
                      className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#D4A574]">技能标签</label>
                  <input
                    type="text"
                    value={skillTagsInput}
                    onChange={(e) => setSkillTagsInput(e.target.value)}
                    placeholder="合同审查、劳动法、法律研究（用逗号或顿号分隔）"
                    className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
                  />
                  <p className="mt-1 text-xs text-[#9A8B78]">多个技能用逗号或顿号分隔</p>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className={`rounded-2xl px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-[rgba(212,165,116,0.08)] border border-[rgba(212,165,116,0.25)] text-[#D4A574]"
                : "bg-red-50 border border-red-200 text-red-600"
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] py-3 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? "保存中..." : "保存修改"}
          </button>
        </form>
      </main>
    </div>
  );
}