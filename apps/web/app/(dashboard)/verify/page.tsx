"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, uploadFormFile } from "@/lib/api/client";

const STEPS = [
  { id: 1, title: "手机验证",     icon: "📱" },
  { id: 2, title: "身份证上传",   icon: "🪪" },
  { id: 3, title: "执业证上传",   icon: "📜", optional: true },
  { id: 4, title: "提交审核",     icon: "✅" },
];

export default function VerifyPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [idFront, setIdFront] = useState(false);
  const [idBack, setIdBack] = useState(false);
  const [barInfoPage, setBarInfoPage] = useState(false);
  const [barStampPage, setBarStampPage] = useState(false);
  const [idFrontUrl, setIdFrontUrl] = useState<string | null>(null);
  const [idBackUrl, setIdBackUrl] = useState<string | null>(null);
  const [barInfoPageUrl, setBarInfoPageUrl] = useState<string | null>(null);
  const [barStampPageUrl, setBarStampPageUrl] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<"id_front" | "id_back" | "bar_info" | "bar_stamp" | null>(null);
  const [skipBar, setSkipBar] = useState(false);
  const [barNumber, setBarNumber] = useState("");
  const [lawFirm, setLawFirm] = useState("");
  const [specialtyText, setSpecialtyText] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionKind, setSubmissionKind] = useState<"lawyer" | "realname_only" | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  async function nextStep() {
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setSubmitError(null);
    if (!skipBar) {
      if (!barInfoPage || !barStampPage) {
        setSubmitError("请上传执业证复印件（信息页与盖章页），或勾选跳过执业证上传。");
        return;
      }
      if (!barNumber.trim() || !lawFirm.trim()) {
        setSubmitError("请填写执业证号和执业机构后再提交。");
        return;
      }
    }

    try {
      setSubmitting(true);
      if (!skipBar) {
        const specialties = specialtyText
          .split(/[,，/\s]+/)
          .map((item) => item.trim())
          .filter(Boolean);
        const response = await fetch("/api/verification/lawyer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            bar_number: barNumber.trim(),
            law_firm: lawFirm.trim(),
            specialty: specialties,
            certificate_url: [barInfoPageUrl, barStampPageUrl].filter(Boolean).join(",") || undefined,
            certificate_info_url: barInfoPageUrl || undefined,
            certificate_stamp_url: barStampPageUrl || undefined,
            id_card_url:
              idFrontUrl && idBackUrl
                ? `${idFrontUrl},${idBackUrl}`
                : idFrontUrl || idBackUrl || undefined,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as { code?: number; message?: string };
        if (!response.ok || payload.code !== 0) {
          throw new Error(payload.message || "律师认证申请提交失败");
        }
        const created = (payload as { data?: { id?: string } }).data;
        setApplicationId(created?.id || null);
        setSubmissionKind("lawyer");
      } else {
        setApplicationId(null);
        setSubmissionKind("realname_only");
      }
      setSubmitted(true);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "提交失败，请稍后重试";
      setSubmitError(`未提交认证成功：${detail}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpload(field: "id_front" | "id_back" | "bar_info" | "bar_stamp", file: File | null) {
    if (!file) return;
    try {
      setSubmitError(null);
      setUploadingField(field);
      const uploaded = await uploadFormFile(file);
      if (field === "id_front") {
        setIdFront(true);
        setIdFrontUrl(uploaded.url);
      } else if (field === "id_back") {
        setIdBack(true);
        setIdBackUrl(uploaded.url);
      } else if (field === "bar_info") {
        setBarInfoPage(true);
        setBarInfoPageUrl(uploaded.url);
      } else {
        setBarStampPage(true);
        setBarStampPageUrl(uploaded.url);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "材料上传失败，请稍后重试";
      setSubmitError(msg);
    } finally {
      setUploadingField(null);
    }
  }

  if (submitted) {
    const isLawyerSubmission = submissionKind === "lawyer";
    return (
      <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-10 text-center space-y-5 shadow-sm">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-bold text-[#2C2416]">
            {isLawyerSubmission ? "提交认证成功，等待审核" : "提交认证成功（仅完成实名认证）"}
          </h1>
          <p className="text-[#9A8B78] leading-7">
            {isLawyerSubmission ? (
              <>
                我们将在 <strong className="text-[#2C2416]">1-3 个工作日</strong>内完成审核，
                结果将通过注册邮箱通知你。
              </>
            ) : (
              <>你本次选择了“跳过执业证上传”，因此不会生成律师认证待审申请记录。</>
            )}
          </p>
          {isLawyerSubmission && applicationId ? (
            <div className="rounded-2xl border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] p-3 text-xs text-[#5D4E3A]">
              申请单号：<span className="font-semibold text-[#2C2416]">{applicationId}</span>
            </div>
          ) : null}
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700 text-left leading-relaxed">
            {isLawyerSubmission
              ? "审核通过后，你将进入后台认证记录，并在发现律师页按认证结果展示。"
              : "若你需要进入认证审批台待审列表，请不要跳过执业证上传，重新提交律师认证申请。"}
          </div>
          <Link
            href="/creator"
            className="block w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] py-3 text-sm font-semibold text-white"
          >
            返回工作台
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      <div className="mx-auto max-w-2xl px-6 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/creator" className="text-sm text-[#9A8B78] hover:text-[#5D4E3A]">← 返回工作台</Link>
          <h1 className="mt-4 text-2xl font-bold text-[#2C2416]">实名认证</h1>
          <p className="mt-1 text-sm text-[#9A8B78]">
            完成认证后可发布智能体、发起付费帖、申请提现。
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-between gap-2">
          {STEPS.map((s, i) => {
            const done = s.id < step;
            const active = s.id === step;
            return (
              <div key={s.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                      done
                        ? "border-emerald-500 bg-[#B8860B] text-white"
                        : active
                        ? "border-[#B8860B] bg-[#B8860B] text-white"
                        : "border-[rgba(212,165,116,0.25)] bg-white text-[#9A8B78]"
                    }`}
                  >
                    {done ? "✓" : s.icon}
                  </div>
                  <p className={`text-xs text-center leading-tight ${active ? "font-semibold text-[#2C2416]" : "text-[#9A8B78]"}`}>
                    {s.title}
                    {s.optional && <span className="block text-[#9A8B78]">（可选）</span>}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mt-[-18px] ${done ? "bg-[#D4A574]400" : "bg-[rgba(212,165,116,0.2)]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-8 shadow-sm space-y-6">

          {/* Step 1 — Phone */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-[#2C2416]">验证手机号</h2>
                <p className="mt-1 text-sm text-[#9A8B78]">请绑定你的真实手机号，每个手机号只能绑定一个账号。</p>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    maxLength={11}
                    className="h-12 flex-1 rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none focus:border-blue-400"
                  />
                  <button
                    onClick={() => setCodeSent(true)}
                    disabled={phone.length < 11}
                    className="h-12 rounded-2xl bg-[rgba(212,165,116,0.15)] px-4 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.2)] disabled:opacity-40 transition-colors whitespace-nowrap"
                  >
                    {codeSent ? "已发送" : "获取验证码"}
                  </button>
                </div>
                {codeSent && (
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="输入 6 位验证码"
                    maxLength={6}
                    className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none focus:border-blue-400"
                  />
                )}
              </div>
              {codeSent && (
                <div className="rounded-2xl border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] p-3 text-xs text-[#B8860B]">
                  演示模式：输入任意 6 位数字即可继续
                </div>
              )}
            </>
          )}

          {/* Step 2 — ID */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-[#2C2416]">上传身份证</h2>
                <p className="mt-1 text-sm text-[#9A8B78]">请上传清晰的身份证正反面照片，用于实名认证。</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "正面（头像面）", done: idFront, key: "id_front" as const },
                  { label: "背面（国徽面）", done: idBack, key: "id_back" as const },
                ].map(({ label, done, key }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => document.getElementById(`verify-upload-${key}`)?.click()}
                    className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-8 transition-colors ${
                      done
                        ? "border-emerald-300 bg-[rgba(212,165,116,0.08)] text-[#D4A574]"
                        : "border-[rgba(212,165,116,0.25)] hover:border-[rgba(212,165,116,0.25)] hover:bg-[rgba(212,165,116,0.08)] text-[#9A8B78]"
                    }`}
                  >
                    <input
                      id={`verify-upload-${key}`}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        void handleUpload(key, file);
                        e.currentTarget.value = "";
                      }}
                    />
                    <span className="text-3xl">{done ? "✅" : "📷"}</span>
                    <span className="text-xs font-medium">
                      {uploadingField === key ? "上传中..." : done ? "已上传" : label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#9A8B78]">
                身份证信息仅用于实名审核，平台将依法保护你的隐私，不对外公开。
              </p>
            </>
          )}

          {/* Step 3 — Bar card (optional) */}
          {step === 3 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-[#2C2416]">律师认证材料（两项）<span className="text-sm font-normal text-[#9A8B78]">（可选）</span></h2>
                <p className="mt-1 text-sm text-[#9A8B78]">
                  请上传执业证复印件的两类材料：信息页与盖章页。审核通过后可获得「律师认证」徽章。
                </p>
                <div className="mt-3 rounded-2xl border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] px-4 py-3 text-xs text-[#5D4E3A]">
                  <div>必传材料清单：</div>
                  <div>1）执业证复印件（信息页）</div>
                  <div>2）执业证复印件（盖章页）</div>
                </div>
              </div>
              {!skipBar && (
                <div className="space-y-3">
                  {[
                    {
                      key: "bar_info" as const,
                      done: barInfoPage,
                      icon: "📄",
                      label: "执业证复印件（信息页）",
                      url: barInfoPageUrl,
                    },
                    {
                      key: "bar_stamp" as const,
                      done: barStampPage,
                      icon: "🧾",
                      label: "执业证复印件（盖章页）",
                      url: barStampPageUrl,
                    },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => document.getElementById(`verify-upload-${item.key}`)?.click()}
                      className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-8 transition-colors ${
                        item.done
                          ? "border-emerald-300 bg-[rgba(212,165,116,0.08)] text-[#D4A574]"
                          : "border-[rgba(212,165,116,0.25)] hover:border-[rgba(212,165,116,0.25)] hover:bg-[rgba(212,165,116,0.08)] text-[#9A8B78]"
                      }`}
                    >
                      <input
                        id={`verify-upload-${item.key}`}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          void handleUpload(item.key, file);
                          e.currentTarget.value = "";
                        }}
                      />
                      <span className="text-4xl">{item.done ? "✅" : item.icon}</span>
                      <span className="text-sm font-medium">
                        {uploadingField === item.key ? "上传中..." : item.done ? `已上传：${item.label}` : `点击上传：${item.label}`}
                      </span>
                      {item.url ? (
                        <span className="max-w-[90%] truncate rounded-xl border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] px-3 py-1 text-xs text-[#5D4E3A]">
                          {item.url}
                        </span>
                      ) : null}
                    </button>
                  ))}
                  <input
                    value={barNumber}
                    onChange={(e) => setBarNumber(e.target.value)}
                    placeholder="执业证号（必填）"
                    className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none focus:border-blue-400"
                  />
                  <input
                    value={lawFirm}
                    onChange={(e) => setLawFirm(e.target.value)}
                    placeholder="执业机构 / 律所（必填）"
                    className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none focus:border-blue-400"
                  />
                  <input
                    value={specialtyText}
                    onChange={(e) => setSpecialtyText(e.target.value)}
                    placeholder="专业方向（可选，多个用逗号分隔）"
                    className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none focus:border-blue-400"
                  />
                </div>
              )}
              {skipBar ? (
                <div className="rounded-2xl border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] p-4 text-sm text-[#9A8B78]">
                  已选择跳过，仅完成实名认证，不获得律师认证徽章。
                </div>
              ) : (
                <button
                  onClick={() => setSkipBar(true)}
                  className="text-sm text-[#9A8B78] hover:text-[#5D4E3A] underline"
                >
                  跳过，我不是执业律师
                </button>
              )}
            </>
          )}

          {/* Step 4 — Confirm */}
          {step === 4 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-[#2C2416]">确认提交</h2>
                <p className="mt-1 text-sm text-[#9A8B78]">请确认以下信息无误后提交审核。</p>
              </div>
              <ul className="space-y-3">
                {[
                  { label: "手机验证",   value: phone || "已验证" },
                  { label: "身份证",     value: idFront && idBack ? "已上传正反面" : "部分上传" },
                  {
                    label: "律师执业证复印件",
                    value: skipBar ? "已跳过" : barInfoPage && barStampPage ? "信息页 + 盖章页已上传" : "材料未齐",
                  },
                ].map(({ label, value }) => (
                  <li key={label} className="flex items-center justify-between rounded-2xl border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] px-4 py-3">
                    <span className="text-sm text-[#9A8B78]">{label}</span>
                    <span className="text-sm font-semibold text-[#2C2416]">{value}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-700 leading-relaxed">
                提交即表示你确认所提供信息真实有效，平台有权对虚假信息账号进行封禁处理。
              </div>
              {submitError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 leading-relaxed">
                  {submitError}
                </div>
              ) : null}
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-[rgba(212,165,116,0.2)]">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="rounded-2xl border border-[rgba(212,165,116,0.25)] px-5 py-2.5 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)] disabled:opacity-30 transition-colors"
            >
              上一步
            </button>
            <button
              onClick={nextStep}
              type="button"
              disabled={
                submitting ||
                uploadingField !== null ||
                (step === 1 && (!codeSent || code.length < 6)) ||
                (step === 2 && (!idFront || !idBack)) ||
                (step === 3 && !skipBar && (!barInfoPage || !barStampPage || !barNumber.trim() || !lawFirm.trim()))
              }
              className="rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40 transition-all hover:-translate-y-0.5"
            >
              {submitting ? "提交中..." : step === 4 ? "提交审核" : "下一步"}
            </button>
          </div>
        </div>

        {/* Badge preview */}
        <div className="mt-6 rounded-3xl border border-[rgba(212,165,116,0.2)] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#D4A574] mb-4">认证后你将获得</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 py-2">
              <span className="text-sm">🪪</span>
              <span className="text-xs font-semibold text-[#D4A574]">实名认证</span>
            </div>
            {!skipBar && (
              <div className="flex items-center gap-2 rounded-full border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 py-2">
                <span className="text-sm">⚖️</span>
                <span className="text-xs font-semibold text-[#D4A574]">律师认证</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] px-4 py-2">
              <span className="text-sm">✅</span>
              <span className="text-xs font-semibold text-[#B8860B]">提现权限</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
