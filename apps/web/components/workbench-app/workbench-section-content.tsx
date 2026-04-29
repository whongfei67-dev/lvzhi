"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { WorkbenchAxisChart, WorkbenchSpark, type WorkbenchAxisPoint } from "@/components/workbench-app/WorkbenchSpark";
import { api, ApiError, auth, invitations, trials, uploadAvatarFile, uploadFormFile } from "@/lib/api/client";
import { withPublicMediaProxy } from "@/lib/media-url";
import {
  readAnalyticsBoardCache,
  writeAnalyticsBoardCache,
} from "@/lib/workbench/analytics-board-cache";
import { readExtraPurchasedSkills } from "@/lib/workbench/extra-purchased-skills";
import {
  readWorkbenchTokenPreference,
  saveWorkbenchTokenPreference,
  tokenModeLabel,
  tokenProviderLabel,
  type WorkbenchTokenMode,
  type WorkbenchTokenProvider,
} from "@/lib/workbench/token-preference";

type RoleMode = "client" | "creator";

type Props = {
  role: RoleMode;
  section: string;
  session: { id: string; display_name: string; email: string };
};

function Card({ title, children, compact }: { title: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <section className={compact ? "section section--compact" : "section"}>
      <div className="section-hd"><span>{title}</span></div>
      <div className="section-bd">{children}</div>
    </section>
  );
}

export function WorkbenchSectionContent({ role, section, session }: Props) {
  const [msg, setMsg] = useState<string>("");

  const profileSections = new Set(["cli-profile", "cre-profile"]);
  const settingsSections = new Set(["cli-settings", "cre-settings"]);
  const verifySections = new Set(["cli-verify-apply", "cre-verify"]);
  const studioSections = new Set(["cli-studio", "cre-studio"]);
  const jobSections = new Set(["cli-job-manage", "cre-job-manage"]);
  const analyticsSections = new Set(["cli-analytics-jobs", "cli-analytics-skills-eval", "cre-analytics", "cre-analytics-skills-eval"]);
  /** 合作邀请为留言子类型：与 cli-msg / cre-msg 同一入口（保留 #cli-coop / #cre-coop 旧锚点兼容） */
  const messageHubSections = new Set(["cli-msg", "cre-msg", "cli-coop", "cre-coop"]);
  /** 含历史路由 cre-trial-recv / cre-trial-sent，统一进入合并页 */
  const trialSections = new Set(["cre-trial", "cre-trial-recv", "cre-trial-sent"]);
  const skillsSections = new Set(["cre-skills"]);
  const postsSections = new Set(["cli-posts", "cre-posts"]);
  const noticeSections = new Set(["cli-notice", "cre-notice"]);

  if (profileSections.has(section)) return <ProfileForm session={session} role={role} onDone={setMsg} msg={msg} />;
  if (settingsSections.has(section)) return <AccountSettings email={session.email} onDone={setMsg} msg={msg} />;
  if (verifySections.has(section)) return <VerifyApply role={role} session={session} onDone={setMsg} msg={msg} />;
  if (studioSections.has(section)) return <StudioAndPurchased role={role} />;
  if (jobSections.has(section)) return <JobManage />;
  if (analyticsSections.has(section)) return <AnalyticsBoard section={section} sessionId={session.id} />;
  if (skillsSections.has(section)) return <CreatorSkillsManage sessionId={session.id} />;
  if (trialSections.has(section)) return <TrialInvitations role={role} />;
  if (postsSections.has(section)) return <MyPostsPanel title="帖子管理" />;
  if (messageHubSections.has(section)) return <MessagesAndCoopHub />;
  if (noticeSections.has(section)) return <NoticeBoard />;

  return <Card title="功能建设中">该模块正在对齐联调页，马上补齐。</Card>;
}

function formatProfileJsonField(raw: unknown): string {
  if (raw == null || raw === "") return "";
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return "";
    try {
      return JSON.stringify(JSON.parse(t), null, 2);
    } catch {
      return t;
    }
  }
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return "";
  }
}

function ProfileForm({ session, role, msg, onDone }: { session: Props["session"]; role: RoleMode; msg: string; onDone: (m: string) => void }) {
  const [displayName, setDisplayName] = useState(session.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadTip, setAvatarUploadTip] = useState("");
  const [nickname, setNickname] = useState("");
  const [workOrganization, setWorkOrganization] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [practiceYears, setPracticeYears] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [firm, setFirm] = useState("");
  const [expertiseCsv, setExpertiseCsv] = useState("");
  const [clientsLabel, setClientsLabel] = useState("");
  const [consultPrice, setConsultPrice] = useState("");
  const [consultUnit, setConsultUnit] = useState("");
  const [firmAddress, setFirmAddress] = useState("");
  const [firmLandline, setFirmLandline] = useState("");
  const [casesJson, setCasesJson] = useState("");
  const [workHistoryJson, setWorkHistoryJson] = useState("");
  const [educationJson, setEducationJson] = useState("");
  const [articlesJson, setArticlesJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.users
      .getProfile(session.id)
      .then((p) => {
        if (cancelled || !p) return;
        const o = p as Record<string, unknown>;
        setDisplayName(String(o.display_name ?? session.display_name ?? ""));
        setAvatarUrl(String(o.avatar_url ?? ""));
        setNickname(String(o.nickname ?? ""));
        setWorkOrganization(String(o.work_organization ?? ""));
        setContact(String(o.phone ?? ""));
        setAddress(String(o.contact_address ?? ""));
        setBio(String(o.bio ?? ""));
        setCity(String(o.city ?? ""));
        setPracticeYears(
          o.practice_years != null && String(o.practice_years).trim() !== ""
            ? String(o.practice_years)
            : ""
        );
        setJobTitle(String(o.title ?? ""));
        setFirm(String(o.firm ?? o.law_firm ?? ""));
        if (Array.isArray(o.expertise)) {
          setExpertiseCsv((o.expertise as string[]).map((x) => String(x).trim()).filter(Boolean).join("、"));
        } else {
          setExpertiseCsv(typeof o.expertise === "string" ? o.expertise : "");
        }
        setClientsLabel(String(o.clients_label ?? ""));
        setConsultPrice(String(o.consult_price ?? o.consultPrice ?? ""));
        setConsultUnit(String(o.consult_unit ?? o.consultUnit ?? ""));
        setFirmAddress(String(o.firm_address ?? o.office_address ?? ""));
        setFirmLandline(String(o.firm_landline ?? o.office_phone ?? o.landline ?? ""));
        setCasesJson(formatProfileJsonField(o.cases_json ?? o.cases_detail ?? o.cases));
        setWorkHistoryJson(formatProfileJsonField(o.work_history_json ?? o.work_history));
        setEducationJson(formatProfileJsonField(o.education_detail ?? o.education_json));
        setArticlesJson(formatProfileJsonField(o.articles_json ?? o.articles));
      })
      .catch(() => {
        if (!cancelled) setLoadErr(true);
      });
    return () => {
      cancelled = true;
    };
  }, [session.id, session.display_name]);

  return (
    <div className="wb-page-stack">
      <Card title={role === "creator" ? "个人资料与公开档案" : "个人资料"} compact>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const patch: Record<string, unknown> = {
                display_name: displayName.trim(),
                nickname: nickname.trim(),
                work_organization: workOrganization.trim() || null,
                phone: contact.trim() || null,
                contact_address: address.trim() || null,
                bio: bio.trim() || null,
              };
              if (role === "creator") {
                const parseJsonOrEmpty = (raw: string, label: string): unknown => {
                  const t = raw.trim();
                  if (!t) return [];
                  try {
                    return JSON.parse(t) as unknown;
                  } catch {
                    throw new Error(label);
                  }
                };
                let casesVal: unknown;
                let workVal: unknown;
                let eduVal: unknown;
                let artVal: unknown;
                try {
                  casesVal = parseJsonOrEmpty(casesJson, "代表性案例");
                  workVal = parseJsonOrEmpty(workHistoryJson, "工作背景");
                  eduVal = parseJsonOrEmpty(educationJson, "教育背景");
                  artVal = parseJsonOrEmpty(articlesJson, "实务文章");
                } catch (err) {
                  onDone(err instanceof Error ? `${err.message}：JSON 格式不正确` : "JSON 格式不正确");
                  setLoading(false);
                  return;
                }
                patch.city = city.trim() || null;
                patch.title = jobTitle.trim() || null;
                patch.firm = firm.trim() || null;
                patch.law_firm = firm.trim() || null;
                patch.practice_years = practiceYears.trim() ? Number(practiceYears) : null;
                patch.expertise = expertiseCsv
                  .split(/[,，、]/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                patch.clients_label = clientsLabel.trim() || null;
                patch.consult_price = consultPrice.trim() || null;
                patch.consult_unit = consultUnit.trim() || null;
                patch.firm_address = firmAddress.trim() || null;
                patch.firm_landline = firmLandline.trim() || null;
                patch.cases_json = casesVal;
                patch.work_history_json = workVal;
                patch.education_detail = eduVal;
                patch.articles_json = artVal;
              }
              await api.users.updateProfile(session.id, patch);
              onDone(role === "creator" ? "公开档案已保存，律师详情页将在刷新或返回页面后展示最新内容" : "个人资料已保存");
            } catch {
              onDone("保存失败，请重试");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loadErr ? <p className="wb-hint" style={{ color: "var(--danger, #b42318)" }}>资料未能从服务器加载，仍可编辑后保存。</p> : null}
          <div
            style={{
              margin: "8px 0 12px",
              padding: "10px 12px",
              border: "1px solid rgba(212,165,116,0.28)",
              borderRadius: 10,
              background: "rgba(255,248,240,0.55)",
            }}
          >
            <p className="wb-hint" style={{ marginBottom: 8, color: "var(--text)" }}>
              头像上传（个人资料）
            </p>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  avatarUrl
                    ? withPublicMediaProxy(avatarUrl)
                    : `https://i.pravatar.cc/80?u=${encodeURIComponent(displayName || session.id)}`
                }
                alt=""
                className="h-12 w-12 rounded-full border border-[rgba(212,165,116,0.28)] object-cover"
              />
              <label className="social-btn wb-btn-compact cursor-pointer">
                {avatarUploading ? "上传中…" : "上传头像"}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={avatarUploading}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    setAvatarUploading(true);
                    setAvatarUploadTip("");
                    try {
                      let row = await uploadAvatarFile(f).catch(async () => {
                        // 兜底：当专用头像接口失败时，回退到通用上传并回写 profiles.avatar_url
                        const uploaded = await uploadFormFile(f);
                        await api.users.updateProfile(session.id, { avatar_url: uploaded.url });
                        return { url: uploaded.url };
                      });
                      const previewUrl = `${row.url}${row.url.includes("?") ? "&" : "?"}v=${Date.now()}`;
                      setAvatarUrl(previewUrl);
                      window.dispatchEvent(new CustomEvent("lvzhi:avatar-updated", { detail: { url: previewUrl } }));
                      setAvatarUploadTip("上传成功");
                      onDone("头像已更新，律师列表/详情页会同步显示");
                    } catch (err) {
                      const m = err instanceof ApiError ? err.message : "上传失败，请重试";
                      setAvatarUploadTip(m);
                      onDone(`头像上传失败：${m}`);
                    } finally {
                      setAvatarUploading(false);
                    }
                  }}
                />
              </label>
              <span className="wb-hint">保存后无需额外操作，前台会读 profiles.avatar_url</span>
              {avatarUploadTip ? (
                <span className="wb-hint" style={{ color: avatarUploadTip.includes("成功") ? "#2FA863" : "#D94D4D" }}>
                  {avatarUploadTip}
                </span>
              ) : null}
            </div>
          </div>
          {role === "creator" ? (
            <p className="wb-hint">
              以下「公开档案」字段与律师/创作者详情页模块一一对应（简介、案例、工作/教育背景、侧栏文章、机构与座机、咨询价等）；保存后由接口落库，详情页通过{" "}
              <code className="wb-hint">buildLawyerDetailView</code> 合并展示。
            </p>
          ) : null}
          <table className="wb-form-table">
            <tbody>
              <tr>
                <th scope="row">姓名</th>
                <td>
                  <input
                    className="form-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="与证件或实名信息一致"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">昵称</th>
                <td>
                  <input
                    className="form-input"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="站内展示用"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">工作单位</th>
                <td>
                  <input
                    className="form-input"
                    value={workOrganization}
                    onChange={(e) => setWorkOrganization(e.target.value)}
                    placeholder="选填，可与下方「执业机构」一致"
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">联系方式</th>
                <td>
                  <input
                    className="form-input"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="手机等，选填"
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">联系地址</th>
                <td>
                  <input
                    className="form-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="选填"
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">个人简介</th>
                <td>
                  <textarea
                    className="form-input"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={role === "creator" ? "详情页「个人简介」主文案，可多段；换行将拆为段落" : "选填，建议 80 字内"}
                    rows={role === "creator" ? 5 : 2}
                  />
                </td>
              </tr>
              {role === "creator" ? (
                <>
                  <tr>
                    <th scope="row">常驻城市</th>
                    <td>
                      <input className="form-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="如 北京市" />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">执业年限</th>
                    <td>
                      <input
                        className="form-input"
                        value={practiceYears}
                        onChange={(e) => setPracticeYears(e.target.value)}
                        placeholder="数字，如 8"
                        inputMode="numeric"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">对外职位</th>
                    <td>
                      <input className="form-input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="详情页副标题，如 高级合伙人" />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">执业机构</th>
                    <td>
                      <input className="form-input" value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="详情页抬头律所/机构名称" />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">擅长领域</th>
                    <td>
                      <input
                        className="form-input"
                        value={expertiseCsv}
                        onChange={(e) => setExpertiseCsv(e.target.value)}
                        placeholder="逗号、顿号分隔，如 劳动争议、企业合规"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">服务客户文案</th>
                    <td>
                      <input
                        className="form-input"
                        value={clientsLabel}
                        onChange={(e) => setClientsLabel(e.target.value)}
                        placeholder="如 100+ 客户"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">咨询价格</th>
                    <td>
                      <input className="form-input" value={consultPrice} onChange={(e) => setConsultPrice(e.target.value)} placeholder="如 500" />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">计价单位</th>
                    <td>
                      <input className="form-input" value={consultUnit} onChange={(e) => setConsultUnit(e.target.value)} placeholder="如 / 小时" />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">律所地址</th>
                    <td>
                      <textarea
                        className="form-input"
                        value={firmAddress}
                        onChange={(e) => setFirmAddress(e.target.value)}
                        placeholder="详情页侧栏「律所地址」"
                        rows={2}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">机构座机</th>
                    <td>
                      <input className="form-input" value={firmLandline} onChange={(e) => setFirmLandline(e.target.value)} placeholder="对外登记总机" />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">代表性案例（JSON）</th>
                    <td>
                      <textarea
                        className="form-input"
                        value={casesJson}
                        onChange={(e) => setCasesJson(e.target.value)}
                        placeholder='[{"title":"…","role":"…","summary":"…"}]'
                        rows={6}
                        style={{ fontFamily: "ui-monospace, monospace", fontSize: "12px" }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">工作背景（JSON）</th>
                    <td>
                      <textarea
                        className="form-input"
                        value={workHistoryJson}
                        onChange={(e) => setWorkHistoryJson(e.target.value)}
                        placeholder='[{"title":"…","org":"…","period":"…","summary":"…"}]'
                        rows={6}
                        style={{ fontFamily: "ui-monospace, monospace", fontSize: "12px" }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">教育背景（JSON）</th>
                    <td>
                      <textarea
                        className="form-input"
                        value={educationJson}
                        onChange={(e) => setEducationJson(e.target.value)}
                        placeholder='[{"title":"学校 · 学位","sub":"年份与方向"}]'
                        rows={6}
                        style={{ fontFamily: "ui-monospace, monospace", fontSize: "12px" }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">实务文章（JSON）</th>
                    <td>
                      <textarea
                        className="form-input"
                        value={articlesJson}
                        onChange={(e) => setArticlesJson(e.target.value)}
                        placeholder='[{"title":"…","href":"/inspiration","date":"2026-01-01"}]'
                        rows={5}
                        style={{ fontFamily: "ui-monospace, monospace", fontSize: "12px" }}
                      />
                    </td>
                  </tr>
                </>
              ) : null}
            </tbody>
          </table>
          <div className="wb-form-actions">
            <button type="submit" className="btn-slide primary wb-btn-compact" disabled={loading}>
              {loading ? "保存中..." : "保存资料"}
            </button>
            {msg ? <span className="wb-hint" style={{ color: "var(--text)" }}>{msg}</span> : null}
          </div>
          {role === "client" ? <p className="wb-hint">客户提交资料后，可在「认证申请」发起创作者升级。</p> : null}
        </form>
      </Card>
      <Card title="资料完整度" compact>
        <div className="dense-table">
          <div className="dense-row head"><div>字段</div><div>状态</div><div>最近更新</div><div>备注</div></div>
          <div className="dense-row"><div>基础信息</div><div className="up">已完善</div><div>今天</div><div>姓名/邮箱已同步</div></div>
          <div className="dense-row"><div>执业信息</div><div>待补充</div><div>—</div><div>认证审核用</div></div>
          <div className="dense-row"><div>展示简介</div><div className="up">已提交</div><div>今天</div><div>管理员复核</div></div>
          <div className="dense-row"><div>附件材料</div><div>待上传</div><div>—</div><div>PDF/JPG</div></div>
        </div>
      </Card>
    </div>
  );
}

type AttachmentKind = "cert_info" | "cert_stamp" | "id_front" | "id_back" | "other";
type AttachmentRow = { id: string; kind?: AttachmentKind; url: string; original_name?: string; uploaded_at?: string };
type CreatorVerificationLevel = "excellent" | "master";
type CreatorVerificationApplication = {
  id: string;
  verification_type: CreatorVerificationLevel;
  status: string;
  created_at?: string;
  updated_at?: string;
  reviewed_at?: string;
  review_note?: string;
};

const VERIFY_MATERIAL_LABEL: Record<AttachmentKind, string> = {
  cert_info: "执业证复印件（信息页）",
  cert_stamp: "执业证复印件（盖章页）",
  id_front: "身份证（正面）",
  id_back: "身份证（背面）",
  other: "其他材料",
};

const CREATOR_LEVEL_LABEL: Record<CreatorVerificationLevel, string> = {
  excellent: "优秀创作者认证",
  master: "大师级创作者认证",
};

function formatCreatorVerificationStatus(status: string): string {
  if (status === "approved") return "已通过";
  if (status === "pending") return "待审核";
  if (status === "rejected") return "已驳回";
  return status || "未申请";
}

function VerifyApply({ role, session, msg, onDone }: { role: RoleMode; session: Props["session"]; msg: string; onDone: (m: string) => void }) {
  const [reason, setReason] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [lawFirm, setLawFirm] = useState("");
  const [specialtyText, setSpecialtyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<AttachmentKind | null>(null);
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [applicationSubmittedAt, setApplicationSubmittedAt] = useState<string | null>(null);
  const [existingVerificationStatus, setExistingVerificationStatus] = useState<string | null>(null);
  const [reviewedAt, setReviewedAt] = useState<string | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [creatorLevelReason, setCreatorLevelReason] = useState<Record<CreatorVerificationLevel, string>>({
    excellent: "",
    master: "",
  });
  const [creatorLevelLatest, setCreatorLevelLatest] = useState<Partial<Record<CreatorVerificationLevel, CreatorVerificationApplication>>>({});
  const [creatorLevelSubmitLoading, setCreatorLevelSubmitLoading] = useState<Partial<Record<CreatorVerificationLevel, boolean>>>({});
  const [creatorLevelFeedback, setCreatorLevelFeedback] = useState<Partial<Record<CreatorVerificationLevel, { type: "success" | "error"; text: string }>>>({});
  const compactInputStyle = { height: 34, padding: "0 10px", fontSize: 13 };
  const compactTextAreaStyle = { padding: "8px 10px", fontSize: 13, lineHeight: 1.5 };
  const compactFileStyle = { fontSize: 12, maxWidth: 320 };
  const compactSmallButtonStyle = {
    padding: "4px 8px",
    fontSize: 12,
    minHeight: 26,
    lineHeight: 1.2,
    width: "fit-content" as const,
    minWidth: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const tinyGhostButtonStyle = {
    padding: "2px 8px",
    fontSize: 12,
    lineHeight: 1.2,
    width: "auto" as const,
    minWidth: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--line)",
    borderRadius: 8,
    background: "transparent",
    color: "var(--text)",
    cursor: "pointer",
  };

  function upsertAttachment(kind: AttachmentKind, fileRow: { id: string; url: string; original_name?: string }) {
    setAttachments((prev) => {
      const next = prev.filter((item) => item.kind !== kind);
      next.push({
        id: String(fileRow.id),
        kind,
        url: fileRow.url,
        original_name: fileRow.original_name,
        uploaded_at: new Date().toISOString(),
      });
      return next;
    });
  }

  function removeAttachment(kind: AttachmentKind) {
    setAttachments((prev) => prev.filter((item) => item.kind !== kind));
  }

  function attachmentByKind(kind: AttachmentKind): AttachmentRow | undefined {
    return attachments.find((item) => item.kind === kind);
  }

  useEffect(() => {
    if (role !== "creator") return;
    let cancelled = false;
    fetch("/api/verification/lawyer", { credentials: "include" })
      .then((r) => r.json().catch(() => ({})))
      .then((payload) => {
        if (cancelled || !payload || payload.code !== 0 || !payload.data) return;
        const data = payload.data as Record<string, unknown>;
        const bar = String(data.bar_number || "");
        const firm = String(data.law_firm || "");
        const note = String(data.application_note || data.review_note || "");
        const specialty = Array.isArray(data.specialty) ? data.specialty.map(String).join(", ") : "";
        const submittedAt = String(data.updated_at || data.created_at || "");
        setBarNumber(bar);
        setLawFirm(firm);
        if (specialty) setSpecialtyText(specialty);
        if (note) setReason(note);
        const status = String(data.status || "");
        if (status) setExistingVerificationStatus(status);
        if (status === "pending" && submittedAt) {
          setApplicationSubmittedAt(submittedAt);
        } else {
          setApplicationSubmittedAt(null);
        }
        if (data.reviewed_at) setReviewedAt(String(data.reviewed_at));

        const mapped: AttachmentRow[] = [];
        const certInfo = String(data.certificate_info_url || "").trim();
        const certStamp = String(data.certificate_stamp_url || "").trim();
        const idCardRaw = String(data.id_card_url || "");
        const idParts = idCardRaw
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        if (certInfo) mapped.push({ id: `seed-cert-info-${session.id}`, kind: "cert_info", url: certInfo, original_name: "信息页", uploaded_at: submittedAt });
        if (certStamp) mapped.push({ id: `seed-cert-stamp-${session.id}`, kind: "cert_stamp", url: certStamp, original_name: "盖章页", uploaded_at: submittedAt });
        if (idParts[0]) mapped.push({ id: `seed-id-front-${session.id}`, kind: "id_front", url: idParts[0], original_name: "身份证正面", uploaded_at: submittedAt });
        if (idParts[1]) mapped.push({ id: `seed-id-back-${session.id}`, kind: "id_back", url: idParts[1], original_name: "身份证背面", uploaded_at: submittedAt });
        if (mapped.length) setAttachments(mapped);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [role, session.id]);

  useEffect(() => {
    if (role === "creator") return;
    let cancelled = false;
    api.users
      .getProfile(session.id)
      .then((p) => {
        if (cancelled || !p) return;
        const raw = (p as Record<string, unknown>).verification_attachments;
        if (typeof raw === "string" && raw.trim()) {
          try {
            const parsed = JSON.parse(raw) as unknown;
            if (Array.isArray(parsed)) {
              setAttachments(parsed as AttachmentRow[]);
            }
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [role, session.id]);

  const loadCreatorLevelApplications = useCallback(async () => {
    if (role !== "creator") return;
    try {
      const response = await fetch("/api/verification/creator-level", { credentials: "include" });
      const payload = (await response.json().catch(() => ({}))) as {
        code?: number;
        data?: {
          latest?: Partial<Record<CreatorVerificationLevel, CreatorVerificationApplication>>;
        };
      };
      if (!response.ok || payload.code !== 0) return;
      setCreatorLevelLatest(payload.data?.latest || {});
    } catch {
      // ignore
    }
  }, [role]);

  useEffect(() => {
    void loadCreatorLevelApplications();
  }, [loadCreatorLevelApplications]);

  const submitCreatorLevelApply = useCallback(async (level: CreatorVerificationLevel) => {
    if (role !== "creator") return;
    setCreatorLevelSubmitLoading((prev) => ({ ...prev, [level]: true }));
    setCreatorLevelFeedback((prev) => ({ ...prev, [level]: undefined }));
    const note = String(creatorLevelReason[level] || "").trim();
    try {
      const response = await fetch("/api/verification/creator-level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          verification_type: level,
          materials: {
            application_note: note || undefined,
            source: "creator_workbench",
          },
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { code?: number; message?: string };
      if (!response.ok || payload.code !== 0) {
        throw new Error(payload.message || "认证申请提交失败");
      }
      setCreatorLevelFeedback((prev) => ({
        ...prev,
        [level]: { type: "success", text: `${CREATOR_LEVEL_LABEL[level]}提交成功，已进入审核队列` },
      }));
      onDone(`${CREATOR_LEVEL_LABEL[level]}提交成功`);
      await loadCreatorLevelApplications();
    } catch (err) {
      const detail = err instanceof Error ? err.message : "认证申请提交失败";
      setCreatorLevelFeedback((prev) => ({
        ...prev,
        [level]: { type: "error", text: detail },
      }));
      onDone(`${CREATOR_LEVEL_LABEL[level]}提交失败：${detail}`);
    } finally {
      setCreatorLevelSubmitLoading((prev) => ({ ...prev, [level]: false }));
    }
  }, [creatorLevelReason, loadCreatorLevelApplications, onDone, role]);

  return (
    <div className="wb-page-stack">
      <Card title={role === "client" ? "认证申请" : "律师认证"} compact>
        {role === "creator" && existingVerificationStatus ? (
          <div
            className="wb-hint"
            style={{
              marginBottom: 10,
              color:
                existingVerificationStatus === "approved"
                  ? "#166534"
                  : existingVerificationStatus === "rejected"
                    ? "#b91c1c"
                    : "var(--text-muted)",
            }}
          >
            当前认证状态：
            {existingVerificationStatus === "approved"
              ? `已通过${reviewedAt ? `（审核时间：${formatLocalDateTime(reviewedAt)}）` : ""}`
              : existingVerificationStatus === "pending"
                ? "待审核"
                : existingVerificationStatus === "rejected"
                  ? "已驳回"
                  : existingVerificationStatus}
            {existingVerificationStatus === "approved"
              ? "。你仍可重新提交，系统会新增一条申请记录供后台审核。"
              : ""}
          </div>
        ) : null}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setSubmitFeedback(null);
            try {
              if (role === "creator") {
                const certInfo = attachments.find((a) => a.kind === "cert_info")?.url || "";
                const certStamp = attachments.find((a) => a.kind === "cert_stamp")?.url || "";
                const idFront = attachments.find((a) => a.kind === "id_front")?.url || "";
                const idBack = attachments.find((a) => a.kind === "id_back")?.url || "";
                if (!barNumber.trim() || !lawFirm.trim()) {
                  setSubmitFeedback({ type: "error", text: "未提交认证成功：请先填写执业证号和执业机构。" });
                  onDone("请先填写执业证号和执业机构");
                  return;
                }
                if (!certInfo || !certStamp) {
                  setSubmitFeedback({ type: "error", text: "未提交认证成功：请上传两项执业证复印件（信息页和盖章页）。" });
                  onDone("请上传两项执业证复印件：信息页和盖章页");
                  return;
                }
                const specialty = specialtyText
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
                    specialty,
                    certificate_info_url: certInfo,
                    certificate_stamp_url: certStamp,
                    certificate_url: `${certInfo},${certStamp}`,
                    id_card_url: [idFront, idBack].filter(Boolean).join(",") || undefined,
                    application_note: reason.trim() || undefined,
                  }),
                });
                const payload = (await response.json().catch(() => ({}))) as {
                  code?: number;
                  message?: string;
                  data?: { id?: string; created_at?: string; updated_at?: string };
                };
                if (!response.ok || payload.code !== 0) {
                  throw new Error(payload.message || "律师认证提交失败");
                }
                const appId = payload.data?.id;
                const submitAt = payload.data?.updated_at || payload.data?.created_at || new Date().toISOString();
                setExistingVerificationStatus("pending");
                setApplicationSubmittedAt(submitAt);
                setSubmitFeedback({
                  type: "success",
                  text: "提交认证成功，已生成新的申请记录",
                });
                onDone(
                  `提交认证成功${appId ? `（单号：${appId}）` : ""}，已生成新的申请记录`
                );
              } else {
                await api.users.updateProfile(session.id, {
                  verification_status: "pending",
                  creator_application_reason: reason,
                  requested_role: "creator",
                  verification_attachments: JSON.stringify(attachments),
                });
                setApplicationSubmittedAt(new Date().toISOString());
                setSubmitFeedback({ type: "success", text: "提交认证成功" });
                onDone("提交认证成功");
              }
            } catch (err) {
              const detail = err instanceof Error ? err.message : "申请提交失败";
              setSubmitFeedback({ type: "error", text: `未提交认证成功：${detail}` });
              onDone(`未提交认证成功：${detail}`);
            } finally {
              setLoading(false);
            }
          }}
        >
          <table className="wb-form-table">
            <tbody>
              {role === "creator" ? (
                <>
                  <tr>
                    <th scope="row">执业证号</th>
                    <td>
                      <input
                        className="form-input"
                        value={barNumber}
                        onChange={(e) => setBarNumber(e.target.value)}
                        placeholder="必填"
                        style={compactInputStyle}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">执业机构</th>
                    <td>
                      <input
                        className="form-input"
                        value={lawFirm}
                        onChange={(e) => setLawFirm(e.target.value)}
                        placeholder="必填"
                        style={compactInputStyle}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">专业方向</th>
                    <td>
                      <input
                        className="form-input"
                        value={specialtyText}
                        onChange={(e) => setSpecialtyText(e.target.value)}
                        placeholder="多个方向可用逗号分隔（可选）"
                        style={compactInputStyle}
                      />
                    </td>
                  </tr>
                  {([
                    { kind: "cert_info", label: "执业证复印件（信息页）" },
                    { kind: "cert_stamp", label: "执业证复印件（盖章页）" },
                    { kind: "id_front", label: "身份证（正面，可选）" },
                    { kind: "id_back", label: "身份证（背面，可选）" },
                  ] as Array<{ kind: AttachmentKind; label: string }>).map((item) => (
                    <tr key={item.kind}>
                      <th scope="row">{item.label}</th>
                      <td>
                        {(() => {
                          const current = attachmentByKind(item.kind);
                          return (
                            <>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf"
                          disabled={uploading}
                          style={compactFileStyle}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (!f) return;
                            setUploading(true);
                            setUploadingKind(item.kind);
                            try {
                              const row = await uploadFormFile(f);
                              upsertAttachment(item.kind, row);
                              onDone(`${item.label}已上传`);
                            } catch {
                              onDone("上传失败，请重试");
                            } finally {
                              setUploading(false);
                              setUploadingKind(null);
                            }
                          }}
                        />
                        <p className="wb-hint" style={{ marginTop: 6 }}>
                          {uploading && uploadingKind === item.kind
                            ? "上传中…"
                            : current
                              ? `已上传：${item.label}`
                              : `请上传${item.label}，支持 PDF / 图片`}
                        </p>
                        {current ? (
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <a
                              href={withPublicMediaProxy(current.url)}
                              target="_blank"
                              rel="noreferrer"
                              title="查看已上传材料"
                              className="wb-hint"
                              style={{ color: "var(--brand)", textDecoration: "underline", cursor: "pointer" }}
                            >
                              查看已上传材料
                            </a>
                            <button
                              type="button"
                              className="wb-btn-compact"
                              onClick={() => removeAttachment(item.kind)}
                              style={tinyGhostButtonStyle}
                            >
                              移除
                            </button>
                          </div>
                        ) : null}
                            </>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">补充说明</th>
                    <td>
                      <textarea
                        className="form-input"
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="可选：补充机构、履历、审核说明"
                        style={compactTextAreaStyle}
                      />
                    </td>
                  </tr>
                </>
              ) : (
                <>
                  <tr>
                    <th scope="row">说明</th>
                    <td>
                      <textarea
                        className="form-input"
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="执业信息、机构、材料要点（表格字段，便于审核）"
                        style={compactTextAreaStyle}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">材料上传</th>
                    <td>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf"
                        disabled={uploading}
                        style={compactFileStyle}
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (!f) return;
                          setUploading(true);
                          try {
                            const row = await uploadFormFile(f);
                            setAttachments((prev) => [
                              ...prev,
                              {
                                id: String(row.id),
                                kind: "other",
                                url: row.url,
                                original_name: row.original_name,
                                uploaded_at: new Date().toISOString(),
                              },
                            ]);
                            onDone("文件已上传，记得提交认证");
                          } catch {
                            onDone("上传失败，请重试");
                          } finally {
                            setUploading(false);
                          }
                        }}
                      />
                      <p className="wb-hint" style={{ marginTop: 6 }}>
                        {uploading ? "正在上传…" : "支持 PDF / 图片，可多份。上传后出现在下表，提交认证时一并保存。"}
                      </p>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
          <div className="wb-form-actions">
            <button
              type="submit"
              className="btn-slide primary wb-btn-compact"
              disabled={loading || uploading}
            >
              {loading ? "提交中..." : uploading ? "文件上传中..." : "提交认证"}
            </button>
            {submitFeedback ? (
              <span
                className="wb-hint"
                style={{ color: submitFeedback.type === "success" ? "#166534" : "#b91c1c", fontWeight: 600 }}
              >
                {submitFeedback.text}
              </span>
            ) : null}
            {msg ? <span className="wb-hint" style={{ color: "var(--text)" }}>{msg}</span> : null}
          </div>
        </form>
      </Card>
      {role === "creator" ? (
        <Card title="创作者等级认证" compact>
          <div className="dense-table">
            <div className="dense-row head">
              <div>认证类型</div>
              <div>当前状态</div>
              <div>最近时间</div>
              <div>申请操作</div>
            </div>
            {(["excellent", "master"] as CreatorVerificationLevel[]).map((level) => {
              const latest = creatorLevelLatest[level];
              const status = String(latest?.status || "");
              const busy = Boolean(creatorLevelSubmitLoading[level]);
              const feedback = creatorLevelFeedback[level];
              const latestTime = latest?.reviewed_at || latest?.updated_at || latest?.created_at || "";
              return (
                <div key={level} className="dense-row" style={{ alignItems: "start" }}>
                  <div>{CREATOR_LEVEL_LABEL[level]}</div>
                  <div
                    style={{
                      color:
                        status === "approved"
                          ? "#166534"
                          : status === "rejected"
                            ? "#b91c1c"
                            : "var(--text)",
                      fontWeight: 600,
                    }}
                  >
                    {formatCreatorVerificationStatus(status)}
                  </div>
                  <div>{latestTime ? formatLocalDateTime(latestTime) : "—"}</div>
                  <div style={{ display: "grid", gap: 6, minWidth: 300 }}>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={creatorLevelReason[level] || ""}
                      onChange={(e) =>
                        setCreatorLevelReason((prev) => ({
                          ...prev,
                          [level]: e.target.value,
                        }))
                      }
                      placeholder="补充说明（可选）：作品成果、代表案例、推荐信息等"
                      style={compactTextAreaStyle}
                    />
                    {latest?.review_note ? (
                      <div className="wb-hint" style={{ color: "#7c3a00" }}>
                        最近审核说明：{latest.review_note}
                      </div>
                    ) : null}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn-slide primary wb-btn-compact"
                        onClick={() => void submitCreatorLevelApply(level)}
                        disabled={busy}
                      >
                        {busy ? "提交中..." : `申请${CREATOR_LEVEL_LABEL[level]}`}
                      </button>
                      {feedback ? (
                        <span
                          className="wb-hint"
                          style={{ color: feedback.type === "success" ? "#166534" : "#b91c1c", fontWeight: 600 }}
                        >
                          {feedback.text}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="wb-hint" style={{ marginTop: 10 }}>
            申请链路与执业律师认证一致：提交申请 → 后台认证审核台审批 → 审计留痕与站内通知回传。
          </p>
        </Card>
      ) : null}
      <Card title="申请记录" compact>
        {existingVerificationStatus === "pending" && applicationSubmittedAt ? (
          <div className="wb-hint" style={{ marginBottom: 8 }}>
            当前申请提交时间：{formatLocalDateTime(applicationSubmittedAt)}
          </div>
        ) : null}
        <div className="dense-table">
          <div className="dense-row head">
            <div>材料名称</div>
            <div>提交时间</div>
            <div>操作</div>
            <div>预览</div>
          </div>
          {attachments.length ? (
            attachments.map((a) => (
              <div key={a.id} className="dense-row">
                <div>{VERIFY_MATERIAL_LABEL[a.kind || "other"]}{a.original_name ? `：${a.original_name}` : ""}</div>
                <div>{formatLocalDateTime(a.uploaded_at || applicationSubmittedAt)}</div>
                <div>
                  <button
                    type="button"
                    className="wb-btn-compact"
                    onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                    style={tinyGhostButtonStyle}
                  >
                    移除
                  </button>
                </div>
                <div>
                  <a
                    href={withPublicMediaProxy(a.url)}
                    target="_blank"
                    rel="noreferrer"
                    title="查看已上传材料"
                    className="wb-hint"
                    style={{ color: "var(--brand)", textDecoration: "underline", cursor: "pointer" }}
                  >
                    查看已上传材料
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="dense-row">
              <div>—</div>
              <div>—</div>
              <div>—</div>
              <div className="wb-hint">暂无材料，请使用上方「材料上传」添加。</div>
            </div>
          )}
        </div>
      </Card>
      <Card title="认证进度（示意）" compact>
        <div className="dense-table">
          <div className="dense-row head"><div>检查项</div><div>状态</div><div>责任方</div><div>备注</div></div>
          <div className="dense-row"><div>实名信息核验</div><div className="up">通过</div><div>系统</div><div>与账号信息一致</div></div>
          <div className="dense-row">
            <div>执业证复印件上传</div>
            <div>
              {attachments.find((a) => a.kind === "cert_info") && attachments.find((a) => a.kind === "cert_stamp")
                ? "信息页+盖章页已提交"
                : "待提交"}
            </div>
            <div>申请人</div>
            <div>需同时提交信息页与盖章页</div>
          </div>
          <div className="dense-row"><div>机构信息复核</div><div>待审核</div><div>管理员</div><div>1-2 工作日</div></div>
          <div className="dense-row"><div>角色升级</div><div>未开始</div><div>管理员</div><div>通过后执行</div></div>
        </div>
      </Card>
    </div>
  );
}

function AccountSettings({ email, msg, onDone }: { email: string; msg: string; onDone: (m: string) => void }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [tokenMode, setTokenMode] = useState<WorkbenchTokenMode>("partner");
  const [tokenProvider, setTokenProvider] = useState<WorkbenchTokenProvider>("lvzhi_partner_default");

  useEffect(() => {
    const pref = readWorkbenchTokenPreference();
    setTokenMode(pref.mode);
    setTokenProvider(pref.provider);
  }, []);

  const saveTokenPolicy = useCallback(() => {
    saveWorkbenchTokenPreference({
      mode: tokenMode,
      provider: tokenProvider,
      updatedAt: new Date().toISOString(),
    });
    onDone("工作画布 Token 策略已保存");
  }, [onDone, tokenMode, tokenProvider]);
  return (
    <div className="wb-page-stack">
      <Card title="账号与密码" compact>
        <table className="wb-form-table">
          <tbody>
            <tr>
              <th scope="row">登录邮箱</th>
              <td><span className="wb-hint" style={{ color: "var(--text)" }}>{email}</span></td>
            </tr>
            <tr>
              <th scope="row">旧密码</th>
              <td><input className="form-input" type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} placeholder="请输入" autoComplete="current-password" /></td>
            </tr>
            <tr>
              <th scope="row">新密码</th>
              <td><input className="form-input" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="不少于 8 位" autoComplete="new-password" /></td>
            </tr>
          </tbody>
        </table>
        <div className="wb-form-actions">
          <button
            type="button"
            className="btn-slide primary"
            onClick={async () => {
              try {
                await auth.changePassword(oldPwd, newPwd);
                onDone("密码修改成功");
              } catch {
                onDone("密码修改失败");
              }
            }}
          >保存密码</button>
          <button
            type="button"
            className="social-btn"
            onClick={async () => {
              try {
                await auth.forgotPassword(email);
                onDone("重置密码邮件已发送");
              } catch {
                onDone("发送失败");
              }
            }}
          >忘记密码</button>
          {msg ? <span className="wb-hint" style={{ color: "var(--text)" }}>{msg}</span> : null}
        </div>
      </Card>
      <Card title="安全与登录" compact>
        <div className="dense-table">
          <div className="dense-row head"><div>策略/记录</div><div>当前状态</div><div>最近发生</div><div>说明</div></div>
          <div className="dense-row"><div>密码强度</div><div className="up">良好</div><div>今天</div><div>建议 90 天轮换</div></div>
          <div className="dense-row"><div>最近登录设备</div><div>Mac mini</div><div>今天 09:14</div><div>本地网络</div></div>
          <div className="dense-row"><div>异常登录拦截</div><div>0 次</div><div>近30天</div><div>无告警</div></div>
          <div className="dense-row"><div>找回流程</div><div>邮箱可用</div><div>—</div><div>可发重置邮件</div></div>
        </div>
      </Card>
      <Card title="工作画布 Token 策略" compact>
        <table className="wb-form-table">
          <tbody>
            <tr>
              <th scope="row">调用策略</th>
              <td>
                <select
                  className="form-input"
                  value={tokenMode}
                  onChange={(e) => setTokenMode(e.target.value as WorkbenchTokenMode)}
                >
                  <option value="off">不用 Token（仅本地/规则流程）</option>
                  <option value="partner">使用律植合作供应商</option>
                </select>
              </td>
            </tr>
            <tr>
              <th scope="row">Token 供应商</th>
              <td>
                <select
                  className="form-input"
                  value={tokenProvider}
                  onChange={(e) => setTokenProvider(e.target.value as WorkbenchTokenProvider)}
                  disabled={tokenMode === "off"}
                >
                  <option value="lvzhi_partner_default">律植合作池（默认）</option>
                  <option value="aliyun_bailian">阿里云百炼</option>
                  <option value="dashscope">DashScope</option>
                  <option value="zhipu">智谱</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </td>
            </tr>
            <tr>
              <th scope="row">策略说明</th>
              <td>
                <p className="wb-hint">
                  当前策略：{tokenModeLabel(tokenMode)}
                  {tokenMode !== "off" ? ` · ${tokenProviderLabel(tokenProvider)}` : ""}
                </p>
                <p className="wb-hint" style={{ marginTop: 4 }}>
                  选择“不用 Token”后，工作画布的技能调用与 Skills 多维评价会关闭。
                </p>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="wb-form-actions">
          <button type="button" className="btn-slide primary" onClick={saveTokenPolicy}>保存 Token 策略</button>
          <span className="wb-hint">该策略会应用到工作画布技能调用与 Skills 多维评价。</span>
        </div>
      </Card>
      <Card title="近5次登录记录" compact>
        <div className="dense-table">
          <div className="dense-row head"><div>登录状态</div><div>时间</div><div>设备/IP</div><div>说明</div></div>
          <div className="dense-row"><div className="up">成功</div><div>2026-04-21 09:14</div><div>Mac mini / 192.168.1.36</div><div>工作台访问</div></div>
          <div className="dense-row"><div className="up">成功</div><div>2026-04-20 21:37</div><div>iPhone / 192.168.1.22</div><div>移动端查看消息</div></div>
          <div className="dense-row"><div>失败</div><div>2026-04-20 10:52</div><div>Chrome / 223.104.*.*</div><div>密码错误 1 次</div></div>
          <div className="dense-row"><div className="up">成功</div><div>2026-04-19 18:06</div><div>Mac mini / 192.168.1.36</div><div>更新账号设置</div></div>
          <div className="dense-row"><div className="up">成功</div><div>2026-04-18 08:41</div><div>Safari / 192.168.1.36</div><div>常规登录</div></div>
        </div>
      </Card>
    </div>
  );
}

const WB_HIDDEN_PURCHASE_IDS_KEY = "lvzhi_wb_hidden_purchase_order_ids";

function orderSkillLabel(o: Record<string, unknown>) {
  return String(o.skill_title || o.agent_name || o.name || o.title || "未命名");
}

function StudioAndPurchased({ role }: { role: RoleMode }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [files, setFiles] = useState<Record<string, unknown>[]>([]);
  const [trialItems, setTrialItems] = useState<Record<string, unknown>[]>([]);
  const [uploading, setUploading] = useState(false);
  const [hiddenPurchaseIds, setHiddenPurchaseIds] = useState<string[]>([]);
  const [stripMode, setStripMode] = useState<null | "remove">(null);
  const [extraPurchasedSync, setExtraPurchasedSync] = useState(0);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [skillRuns, setSkillRuns] = useState<Record<string, unknown>[]>([]);
  const [runBusy, setRunBusy] = useState(false);
  const [runHint, setRunHint] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setExtraPurchasedSync((n) => n + 1);
    window.addEventListener("lvzhi-wb-extra-purchased", bump);
    return () => window.removeEventListener("lvzhi-wb-extra-purchased", bump);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WB_HIDDEN_PURCHASE_IDS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) setHiddenPurchaseIds(parsed.map(String));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    api.workspace.getPurchased({ page: 1, limit: 20 }).then((r) => setItems(r.items || [])).catch(() => setItems([]));
  }, []);
  useEffect(() => {
    api.uploads
      .listMine({ page: 1, pageSize: 30 })
      .then((r) => setFiles(r.items || []))
      .catch(() => setFiles([]));
  }, []);
  useEffect(() => {
    trials
      .getReceived({ page: 1, limit: 20 })
      .then((r) => setTrialItems(r.items || []))
      .catch(() => setTrialItems([]));
  }, []);

  const refreshSkillRuns = useCallback(() => {
    return api.workspace
      .getSkillRuns({ page: 1, limit: 30 })
      .then((r) => {
        setSkillRuns(r.items || []);
      })
      .catch(() => {
        setSkillRuns([]);
      });
  }, []);

  useEffect(() => {
    refreshSkillRuns();
  }, [refreshSkillRuns]);

  const executeSkillRun = useCallback(async () => {
    if (!selectedSkillId || selectedFileIds.length === 0) {
      setRunHint("请先选择技能并勾选至少一份上传文件。");
      return;
    }
    const pref = readWorkbenchTokenPreference();
    if (pref.mode === "off") {
      setRunHint("你已选择“不使用相关功能”，请到账号设置切换为“使用律植合作供应商”后再执行技能。");
      return;
    }
    setRunBusy(true);
    setRunHint(null);
    try {
      await api.workspace.startSkillRun({
        skill_id: selectedSkillId,
        input_file_ids: selectedFileIds,
        token_policy: {
          mode: pref.mode,
          provider: pref.provider,
        },
      });
      setRunHint(
        `运行完成（${tokenModeLabel(pref.mode)} · ${tokenProviderLabel(pref.provider)}），产出已出现在下方列表；可下载报告文件。`
      );
      await Promise.all([
        refreshSkillRuns(),
        api.uploads.listMine({ page: 1, pageSize: 30 }).then((r) => setFiles(r.items || [])).catch(() => {}),
      ]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "运行失败，请稍后重试";
      setRunHint(msg);
    } finally {
      setRunBusy(false);
    }
  }, [selectedSkillId, selectedFileIds, refreshSkillRuns]);

  const mergedPurchased = (() => {
    void extraPurchasedSync;
    const apiIds = new Set(items.map((o) => String(o.id)));
    const extras = readExtraPurchasedSkills()
      .filter((e) => !apiIds.has(e.id))
      .map(
        (e) =>
          ({
            id: e.id,
            skill_title: e.skill_title,
            purchased_at: e.purchased_at,
            _lvzhi_extra_purchase: true,
          }) as Record<string, unknown>,
      );
    return [...items, ...extras];
  })();

  const visiblePurchased = mergedPurchased.filter((o) => !hiddenPurchaseIds.includes(String(o.id)));

  return (
    <div className="wb-page-stack">
      <Card title="工作画布与文件" compact>
        <div className="studio">
          <div className="studio-col">
            <div className="studio-hd">
              <span>已购买技能</span>
              <span className="wb-purchased-hd-actions">
                <Link href="/inspiration" className="wb-skill-nav-plus" title="前往灵感广场继续选购" aria-label="前往灵感广场选购技能">
                  +
                </Link>
                <button
                  type="button"
                  className="wb-skill-nav-minus"
                  title={stripMode === "remove" ? "取消移除" : "点击后，再点选下方一项技能名称即可从列表移除"}
                  aria-label="从列表移除已购技能"
                  onClick={() => setStripMode((m) => (m === "remove" ? null : "remove"))}
                >
                  −
                </button>
                <span className="wb-purchased-count">{visiblePurchased.length}</span>
              </span>
            </div>
            <div className="studio-bd">
              {stripMode === "remove" ? (
                <p className="wb-hint" style={{ marginBottom: 8 }}>
                  请点选下方一项技能名称，将从本机列表隐藏（不影响订单数据）。
                </p>
              ) : (
                <p className="wb-hint" style={{ marginBottom: 8 }}>
                  点击技能名称可选中/取消，用于下方「执行技能」。
                </p>
              )}
              {visiblePurchased.length ? (
                visiblePurchased.map((o) => {
                  const id = String(o.id);
                  return (
                    <div
                      key={id}
                      className={`wb-purchased-skill-row${stripMode === "remove" ? " wb-purchased-skill-row--pick" : ""}${stripMode !== "remove" && selectedSkillId === id ? " wb-purchased-skill-row--selected" : ""}`}
                      onClick={() => {
                        if (stripMode === "remove") {
                          setHiddenPurchaseIds((h) => {
                            if (h.includes(id)) return h;
                            const next = [...h, id];
                            try {
                              localStorage.setItem(WB_HIDDEN_PURCHASE_IDS_KEY, JSON.stringify(next));
                            } catch {
                              /* ignore */
                            }
                            return next;
                          });
                          setStripMode(null);
                          return;
                        }
                        setSelectedSkillId((prev) => (prev === id ? null : id));
                      }}
                      onKeyDown={(e) => {
                        if (stripMode !== "remove") return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setHiddenPurchaseIds((h) => {
                            if (h.includes(id)) return h;
                            const next = [...h, id];
                            try {
                              localStorage.setItem(WB_HIDDEN_PURCHASE_IDS_KEY, JSON.stringify(next));
                            } catch {
                              /* ignore */
                            }
                            return next;
                          });
                          setStripMode(null);
                        }
                      }}
                      role={stripMode === "remove" ? "button" : undefined}
                      tabIndex={stripMode === "remove" ? 0 : undefined}
                    >
                      {orderSkillLabel(o)}
                    </div>
                  );
                })
              ) : (
                <p className="wb-hint">暂无已购技能展示。点击「+」前往灵感广场选购。</p>
              )}
            </div>
          </div>
          <div className="studio-col studio-col--upload">
            <div className="studio-hd">
              <span>工作画布上传</span>
              <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 400 }}>PDF / Word / 图片</span>
            </div>
            <div className="studio-bd">
              <div className="studio-box">
                上传材料、审阅与回写。当前角色：{role === "creator" ? "创作者" : "客户"}。
              </div>
              <input
                type="file"
                className="mt-2"
                disabled={uploading}
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setUploading(true);
                  try {
                    await uploadFormFile(f);
                    const r = await api.uploads.listMine({ page: 1, pageSize: 30 });
                    setFiles(r.items || []);
                  } catch {
                    /* ignore */
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <p className="wb-hint" style={{ marginTop: 6 }}>{uploading ? "上传中…" : "上传后出现在右侧「我的上传文件」表格。"}</p>
            </div>
          </div>
          <div className="studio-col">
            <div className="studio-hd">
              <span>我的上传文件</span>
              <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 400 }}>{files.length}</span>
            </div>
            <div className="studio-bd" style={{ maxHeight: 220, overflow: "auto" }}>
              <div className="dense-table">
                <div className="dense-row head">
                  <div>输入</div>
                  <div>原名</div>
                  <div>大小</div>
                  <div>时间</div>
                  <div>链接</div>
                </div>
                {files.length ? (
                  files.map((u, i) => {
                    const fid = String(u.id ?? "");
                    return (
                      <div key={fid || i} className="dense-row">
                        <div>
                          {fid ? (
                            <input
                              type="checkbox"
                              checked={selectedFileIds.includes(fid)}
                              onChange={() => {
                                setSelectedFileIds((prev) =>
                                  prev.includes(fid) ? prev.filter((x) => x !== fid) : [...prev, fid],
                                );
                              }}
                              aria-label="作为技能运行输入"
                            />
                          ) : (
                            "—"
                          )}
                        </div>
                        <div>{String(u.original_name || u.filename || "—")}</div>
                        <div>{String(u.size ?? "—")}</div>
                        <div>{formatLocalDateTime(u.created_at)}</div>
                        <div>
                          <a href={String(u.url || "#")} target="_blank" rel="noreferrer" className="wb-hint">
                            打开
                          </a>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="dense-row">
                    <div>—</div>
                    <div>—</div>
                    <div>—</div>
                    <div>—</div>
                    <div className="wb-hint">暂无上传</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="wb-skill-exec-block">
          <div className="studio-hd">运行技能</div>
          <p className="wb-hint" style={{ marginBottom: 8 }}>
            ① 左侧点选一条已购技能 · ② 勾选「我的上传文件」中至少一份材料 · ③ 执行后产出出现在下方（客户与创作者工作台逻辑一致）。
          </p>
          <div className="wb-skill-exec-actions">
            <button
              type="button"
              className="wb-text-action wb-text-action--primary"
              disabled={
                runBusy ||
                !selectedSkillId ||
                selectedFileIds.length === 0 ||
                readWorkbenchTokenPreference().mode === "off"
              }
              onClick={() => void executeSkillRun()}
            >
              {runBusy ? "执行中…" : "执行技能"}
            </button>
            {runHint ? (
              <span className="wb-hint" style={{ marginLeft: 8 }}>
                {runHint}
              </span>
            ) : null}
          </div>
        </div>

        <div className="wb-skill-runs-block">
          <div className="studio-hd">生成结果与运行记录</div>
          <div className="dense-table" style={{ marginTop: 6 }}>
            <div className="dense-row head">
              <div>时间</div>
              <div>技能</div>
              <div>状态</div>
              <div>Token策略</div>
              <div>输入摘要</div>
              <div>产出</div>
            </div>
            {skillRuns.length ? (
              skillRuns.map((run) => {
                const rid = String(run.id ?? "");
                const outUrl = String(run.output_file_url ?? "");
                const outName = String(run.output_original_name ?? "报告.txt");
                return (
                  <div key={rid} className="dense-row">
                    <div>{formatLocalDateTime(run.created_at)}</div>
                    <div>{String(run.skill_title_snapshot ?? "—")}</div>
                    <div>{String(run.status ?? "—")}</div>
                    <div className="wb-hint">
                      {String(run.token_mode ?? "partner")}
                      {run.token_provider ? ` / ${String(run.token_provider)}` : ""}
                    </div>
                    <div className="wb-hint" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(run.input_names_snapshot ?? "")}>
                      {String(run.input_names_snapshot ?? "—")}
                    </div>
                    <div>
                      {outUrl ? (
                        <a href={outUrl} target="_blank" rel="noreferrer" className="wb-hint" download={outName}>
                          下载
                        </a>
                      ) : (
                        <span className="wb-hint" title={String(run.result_text ?? "").slice(0, 400)}>
                          见文本
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="dense-row">
                <div>—</div>
                <div>—</div>
                <div>—</div>
                <div>—</div>
                <div className="wb-hint">尚无运行记录</div>
                <div>—</div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card title="已购与试用" compact>
        <div className="wb-subcard-hd">已购与试用记录</div>
        <div className="dense-table">
          <div className="dense-row dense-row--5 head">
            <div>类型</div>
            <div>名称</div>
            <div>最近使用</div>
            <div>调用/下载</div>
            <div>状态</div>
          </div>
          {visiblePurchased.length || trialItems.length ? (
            <>
              {visiblePurchased.slice(0, 12).map((o, idx) => (
                <div key={`p-${String(o.id)}`} className="dense-row dense-row--5">
                  <div>已购</div>
                  <div>{orderSkillLabel(o)}</div>
                  <div>近7天</div>
                  <div>{Math.max(1, 20 - idx * 2)}</div>
                  <div className="up">可用</div>
                </div>
              ))}
              {trialItems.slice(0, 8).map((t) => (
                <div key={`t-${String(t.id)}`} className="dense-row dense-row--5">
                  <div>试用</div>
                  <div>{String(t.source_title || "未命名")}</div>
                  <div>近7天</div>
                  <div>—</div>
                  <div>{String(t.status || "—")}</div>
                </div>
              ))}
            </>
          ) : (
            <div className="dense-row dense-row--5">
              <div>—</div>
              <div className="wb-hint">暂无记录</div>
              <div>—</div>
              <div>—</div>
              <div>—</div>
            </div>
          )}
        </div>

        <div className="wb-subcard-hd wb-subcard-hd--spaced">已完成文件列表</div>
        <div className="dense-table">
          <div className="dense-row head">
            <div>文件名</div>
            <div>大小</div>
            <div>上传时间</div>
            <div>下载</div>
          </div>
          {files.length ? (
            files.map((u, i) => {
              const href = String(u.url || "#");
              const name = String(u.original_name || u.filename || "文件");
              return (
                <div key={i} className="dense-row">
                  <div>{name}</div>
                  <div>{String(u.size ?? "—")}</div>
                  <div>{formatLocalDateTime(u.created_at)}</div>
                  <div>
                    <a href={href} download={name} target="_blank" rel="noreferrer" className="wb-hint">
                      下载
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="dense-row">
              <div className="wb-hint">暂无已完成上传</div>
              <div>—</div>
              <div>—</div>
              <div>—</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function jobOppDetailHref(o: Record<string, unknown>) {
  const slug = String(o.slug || o.id || "");
  return `/opportunities/${encodeURIComponent(slug)}`;
}

function jobOppEditHref(o: Record<string, unknown>) {
  const slug = String(o.slug || o.id || "");
  const id = String(o.id || "");
  return `/opportunities/${encodeURIComponent(slug)}/edit${id ? `?id=${encodeURIComponent(id)}` : ""}`;
}

function jobSubmissionEditHref(row: Record<string, unknown>) {
  const id = String(row.id || "");
  return `/opportunities/submissions/${encodeURIComponent(id)}/edit`;
}

const OA_COMMUNITY_TEXT_FILE = "community:text-only";

function applicationIsCommunity(row: Record<string, unknown>): boolean {
  return row.application_source === "community_post" || Boolean(row.community_post_id);
}

function submissionDetailHref(row: Record<string, unknown>): string {
  if (applicationIsCommunity(row)) {
    const pid = String(row.community_post_id ?? "");
    return pid ? `/community/post/${encodeURIComponent(pid)}` : "/community";
  }
  return jobOppDetailHref({ slug: row.opportunity_slug, id: row.opportunity_id });
}

function submissionModifyHref(row: Record<string, unknown>): string {
  if (applicationIsCommunity(row)) {
    return submissionDetailHref(row);
  }
  return jobSubmissionEditHref(row);
}

/** 发布侧：岗位在架状态展示 */
function jobPublishStatusLabel(status: string) {
  const s = status.toLowerCase();
  if (s === "published") return "发布中";
  if (s === "paused") return "已下架";
  if (s === "pending_review") return "处理中";
  return status || "—";
}

function jobHasPublisherReply(row: Record<string, unknown>) {
  const reply = row.publisher_reply;
  return reply != null && String(reply).trim() !== "";
}

/** 投递侧：是否已有发布方回复 */
function jobApplyStatusLabel(row: Record<string, unknown>) {
  return jobHasPublisherReply(row) ? "已回复" : "已投递";
}

function formatLocalDateTime(raw: unknown): string {
  const text = raw != null ? String(raw) : "";
  if (!text) return "—";
  const dt = new Date(text);
  if (Number.isNaN(dt.getTime())) {
    return text.slice(0, 19).replace("T", " ");
  }
  return dt.toLocaleString("zh-CN", { hour12: false });
}

function formatJobReplyTime(row: Record<string, unknown>) {
  const raw = row.publisher_replied_at ?? row.updated_at;
  return formatLocalDateTime(raw);
}

function trendFromTotal(total: number): WorkbenchAxisPoint[] {
  const labels = ["04-15", "04-16", "04-17", "04-18", "04-19", "04-20", "04-21"];
  const safe = Math.max(0, total);
  const ratios = [0.48, 0.56, 0.62, 0.74, 0.82, 0.9, 1];
  return labels.map((label, i) => ({
    label,
    value: Math.max(0, Math.round(safe * ratios[i])),
  }));
}

/** 接口无数据时用于预览按钮与版面（id 以 wb-demo- 开头，不会请求真实接口） */
const WB_JOB_DEMO_PUBLISH: Record<string, unknown>[] = [
  {
    id: "wb-demo-pub-1",
    slug: "demo-legal-counsel",
    title: "【示例】驻场法律顾问",
    status: "published",
    view_count: 128,
    application_count: 3,
  },
  {
    id: "wb-demo-pub-2",
    slug: "demo-contract-review",
    title: "【示例】合同审查兼职",
    status: "paused",
    view_count: 56,
    application_count: 0,
  },
];

const WB_JOB_DEMO_SUBS: Record<string, unknown>[] = [
  {
    id: "wb-demo-sub-1",
    opportunity_id: "00000000-0000-4000-8000-000000000101",
    opportunity_slug: "demo-ip-litigation",
    opportunity_title: "【示例】知产诉讼协办",
    publisher_reply: null,
    created_at: "2026-04-18T10:00:00.000Z",
    updated_at: "2026-04-18T10:00:00.000Z",
  },
  {
    id: "wb-demo-sub-2",
    opportunity_id: "00000000-0000-4000-8000-000000000102",
    opportunity_slug: "demo-compliance-review",
    opportunity_title: "【示例】企业合规评估",
    publisher_reply: "感谢您的材料，请补充尽调清单。",
    publisher_reply_name: "王律师（示例发布方）",
    publisher_replied_at: "2026-04-20T09:15:00.000Z",
    created_at: "2026-04-19T14:30:00.000Z",
    updated_at: "2026-04-20T09:15:00.000Z",
  },
];

function isJobWorkbenchDemoId(id: string) {
  return id.startsWith("wb-demo-");
}

function JobManage() {
  const [apps, setApps] = useState<Record<string, unknown>[]>([]);
  const [mine, setMine] = useState<Record<string, unknown>[]>([]);
  const [mySubs, setMySubs] = useState<Record<string, unknown>[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [applyReplyOpenId, setApplyReplyOpenId] = useState<string | null>(null);

  const reload = () => {
    api.workspace.getOpportunityApplications({ page: 1, limit: 50 }).then((r) => setApps(r.items || [])).catch(() => setApps([]));
    api.opportunities.getMyOpportunities({ page: 1, limit: 50 }).then((r) => setMine(r.items || [])).catch(() => setMine([]));
    api.workspace.getMyOpportunitySubmissions({ page: 1, limit: 50 }).then((r) => setMySubs(r.items || [])).catch(() => setMySubs([]));
  };

  useEffect(() => {
    reload();
  }, []);

  const setPublished = async (id: string, next: "published" | "paused") => {
    if (isJobWorkbenchDemoId(id)) {
      window.alert("当前为示例岗位，仅用于预览界面，不会调用上架/下架接口。");
      return;
    }
    setBusy(id + next);
    try {
      await api.opportunities.update(id, { status: next });
      if (next === "published") {
        window.alert("岗位已上架并公开展示。");
      } else {
        window.alert("岗位已下架。");
      }
      reload();
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  const withdrawPublishedOpportunity = async (id: string) => {
    if (isJobWorkbenchDemoId(id)) {
      window.alert("当前为示例岗位，仅用于预览界面，不会调用撤回接口。");
      return;
    }
    if (!window.confirm("确定撤回该岗位？撤回后将从我的岗位列表删除。")) return;
    setBusy(id + "opp-delete");
    try {
      await api.opportunities.delete(id);
      reload();
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  const withdrawSubmission = async (applicationId: string) => {
    if (isJobWorkbenchDemoId(applicationId)) {
      window.alert("当前为示例投递，仅用于预览界面，不会调用撤回接口。");
      return;
    }
    if (!window.confirm("确定撤回该投递？撤回后可在岗位详情页再次「新增投递」或重新上传材料。")) return;
    setBusy(applicationId + "sub-withdraw");
    try {
      await api.workspace.deleteMyOpportunitySubmission(applicationId);
      reload();
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  const sendReply = async (applicationId: string) => {
    const text = (replyDrafts[applicationId] || "").trim();
    if (!text) return;
    setBusy(applicationId);
    try {
      await api.workspace.replyToOpportunityApplication(applicationId, text);
      setReplyDrafts((d) => ({ ...d, [applicationId]: "" }));
      reload();
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  const publishRows = mine.length > 0 ? mine : WB_JOB_DEMO_PUBLISH;
  const subRows = mySubs.length > 0 ? mySubs : WB_JOB_DEMO_SUBS;
  const publishIsDemoFill = mine.length === 0;
  const subIsDemoFill = mySubs.length === 0;

  return (
    <div className="space-y-3">
      <Card title="我的岗位">
        <div className="wb-subcard-hd">发布岗位</div>
        <p className="wb-hint" style={{ marginBottom: 10 }}>
          我发布的合作机会：<strong>发布中</strong>、<strong>已下架</strong>。岗位发布无需后台预审；平台可按规则对违规岗位执行下架并通知发布者。
        </p>
        {publishIsDemoFill ? (
          <p className="wb-hint" style={{ marginBottom: 8 }}>
            当前暂无真实发布记录，下方为<strong>示例数据</strong>（标题带「【示例】」），便于查看「撤回修改岗位」等按钮；有数据后将自动替换。
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 10 }}>
          <Link href="/opportunities/create" className="btn-slide primary wb-btn-compact">
            新增上架
          </Link>
        </div>
        <div className="dense-table">
          <div className="dense-row head">
            <div>标题</div>
            <div>状态</div>
            <div>浏览 / 投递</div>
            <div>操作</div>
          </div>
          {publishRows.map((o) => {
            const id = String(o.id);
            const st = String(o.status || "");
            return (
              <div key={id} className="dense-row">
                <div>{String(o.title || "—")}</div>
                <div>{jobPublishStatusLabel(st)}</div>
                <div>
                  {String(o.view_count ?? 0)} / {String(o.application_count ?? 0)}
                </div>
                <div className="wb-table-actions">
                  <Link href={jobOppEditHref(o)} className="wb-text-action">
                    修改
                  </Link>
                  <button
                    type="button"
                    className="wb-text-action"
                    disabled={!!busy}
                    onClick={() => void withdrawPublishedOpportunity(id)}
                  >
                    撤回
                  </button>
                  {st === "published" ? (
                    <button
                      type="button"
                      className="wb-text-action"
                      disabled={!!busy}
                      onClick={() => void setPublished(id, "paused")}
                    >
                      下架
                    </button>
                  ) : st === "pending_review" ? (
                    <span className="wb-text-action" style={{ opacity: 0.7, cursor: "default" }}>
                      审核中
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="wb-text-action wb-text-action--primary"
                      disabled={!!busy}
                      onClick={() => void setPublished(id, "published")}
                    >
                      上架申请
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="wb-subcard-hd wb-subcard-hd--spaced">投递岗位</div>
        <p className="wb-hint" style={{ marginBottom: 10 }}>
          我作为求职者投递的记录：<strong>已投递</strong>（发布方未回复）与<strong>已回复</strong>两种状态；可前往机会列表新增投递，或修改后重新提交材料。
        </p>
        {subIsDemoFill ? (
          <p className="wb-hint" style={{ marginBottom: 8 }}>
            当前暂无真实投递记录，下方为<strong>示例数据</strong>，便于查看「撤回修改」「撤回投递」；有数据后将自动替换。
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 10 }}>
          <Link href="/opportunities" className="btn-slide primary wb-btn-compact">
            新增投递
          </Link>
        </div>
        <div className="dense-table">
          <div className="dense-row head">
            <div>岗位</div>
            <div>状态</div>
            <div>最近更新</div>
            <div>操作</div>
          </div>
          {subRows.map((row) => {
            const sid = String(row.id);
            const title = String(row.opportunity_title || "—");
            const updated = formatLocalDateTime(row.updated_at || row.created_at);
            const hasReply = jobHasPublisherReply(row);
            return (
              <div key={sid} className="dense-row">
                <div>
                  <Link href={submissionDetailHref(row)} className="wb-hint">
                    {title}
                  </Link>
                </div>
                <div>{jobApplyStatusLabel(row)}</div>
                <div>{updated || "—"}</div>
                <div className="wb-table-actions">
                  <Link href={submissionModifyHref(row)} className="wb-text-action">
                    {applicationIsCommunity(row) ? "查看帖子" : "修改"}
                  </Link>
                  <button
                    type="button"
                    className="wb-text-action"
                    disabled={!!busy}
                    onClick={() => void withdrawSubmission(sid)}
                  >
                    撤回
                  </button>
                  {hasReply ? (
                    <button
                      type="button"
                      className="wb-text-action wb-text-action--primary"
                      onClick={() => setApplyReplyOpenId((id) => (id === sid ? null : sid))}
                    >
                      {applyReplyOpenId === sid ? "收起回复" : "查看回复"}
                    </button>
                  ) : null}
                  {applyReplyOpenId === sid && hasReply ? (
                    <div className="wb-reply-card wb-reply-card--block">
                      <div className="wb-reply-card__label">回复人</div>
                      <div className="wb-reply-card__value">{String(row.publisher_reply_name || "岗位发布方")}</div>
                      <div className="wb-reply-card__label">回复时间</div>
                      <div className="wb-reply-card__value">{formatJobReplyTime(row)}</div>
                      <div className="wb-reply-card__label">回复内容</div>
                      <div className="wb-reply-card__body">{String(row.publisher_reply)}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="收到的投递与回复">
        <div className="dense-table">
          <div className="dense-row head">
            <div>岗位</div>
            <div>投递人</div>
            <div>材料</div>
            <div>留言</div>
          </div>
          {apps.length ? (
            apps.map((a) => {
              const aid = String(a.id);
              const comm = applicationIsCommunity(a);
              const postId = String(a.community_post_id ?? "");
              const oppSlug = String(a.opportunity_slug || a.opportunity_id || "");
              const oppHref = oppSlug ? `/opportunities/${encodeURIComponent(oppSlug)}` : "/opportunities";
              const detailHref =
                comm && postId ? `/community/post/${encodeURIComponent(postId)}` : oppHref;
              const textOnly = String(a.file_url || "") === OA_COMMUNITY_TEXT_FILE;
              return (
                <div key={aid} className="dense-row" style={{ alignItems: "start" }}>
                  <div>
                    <Link href={detailHref} className="wb-hint">
                      {String(a.opportunity_title || "岗位")}
                    </Link>
                  </div>
                  <div>{String(a.applicant_name || "-")}</div>
                  <div>
                    {textOnly ? (
                      <span className="wb-hint">正文投递（无附件）</span>
                    ) : a.file_url ? (
                      <a href={String(a.file_url)} target="_blank" rel="noreferrer" className="wb-hint">
                        {String(a.original_name || "下载材料")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <div className="wb-hint">申请人：{String(a.message || "—")}</div>
                    {a.publisher_reply ? (
                      <div style={{ marginTop: 6 }}>
                        <strong>我的回复：</strong>
                        {String(a.publisher_reply)}
                      </div>
                    ) : null}
                    <textarea
                      className="form-input mt-2"
                      rows={2}
                      placeholder="向投递人回复（站内通知）"
                      value={replyDrafts[aid] || ""}
                      onChange={(e) => setReplyDrafts((d) => ({ ...d, [aid]: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="btn-slide primary wb-btn-compact mt-1"
                      disabled={!!busy}
                      onClick={() => sendReply(aid)}
                    >
                      发送回复
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="dense-row">
              <div className="wb-hint">—</div>
              <div className="wb-hint">—</div>
              <div className="wb-hint">—</div>
              <div className="wb-hint">暂无他人向您发布的岗位投递。</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

const CHART_OK = "#3c8c5a";
const CHART_BAD = "#c15a4a";
const CHART_GRAY = "#9a8b78";

/** 避免在「岗位数据 / Skills 多维评价」间切换时重复打满接口；同一浏览器会话内短期复用 */
const ANALYTICS_BOARD_CACHE_TTL_MS = 120_000;
type AnalyticsBoardCache = {
  ts: number;
  postAgg: {
    post_count: number;
    total_views: number;
    total_comments: number;
    total_likes: number;
    total_dislikes: number;
    total_skill_downloads: number;
    top_posts: Record<string, unknown>[];
  } | null;
  publishViewTotal: number;
  applyViewTotal: number;
};
let analyticsBoardCache: AnalyticsBoardCache | null = null;

function sumSubmissionOpportunityViews(rows: Record<string, unknown>[]): number {
  let s = 0;
  for (const x of rows) {
    const nested = x.opportunity as Record<string, unknown> | undefined;
    if (nested && nested.view_count != null) {
      s += Number(nested.view_count || 0);
      continue;
    }
    s += Number(
      x.opportunity_view_count ?? x.opportunity_views ?? x.job_view_count ?? x.listing_view_count ?? 0,
    );
  }
  return s;
}

/** 数据分析区示意：横轴为日期，纵轴为对应指标 */
const WB_AXIS_ACTIVE: WorkbenchAxisPoint[] = [
  { label: "04-15", value: 12 },
  { label: "04-16", value: 18 },
  { label: "04-17", value: 14 },
  { label: "04-18", value: 22 },
  { label: "04-19", value: 19 },
  { label: "04-20", value: 26 },
  { label: "04-21", value: 23 },
];
const WB_AXIS_ENGAGE: WorkbenchAxisPoint[] = [
  { label: "04-15", value: 38 },
  { label: "04-16", value: 42 },
  { label: "04-17", value: 36 },
  { label: "04-18", value: 45 },
  { label: "04-19", value: 41 },
  { label: "04-20", value: 48 },
  { label: "04-21", value: 44 },
];
const WB_AXIS_SPEND: WorkbenchAxisPoint[] = [
  { label: "04-15", value: 120 },
  { label: "04-16", value: 180 },
  { label: "04-17", value: 150 },
  { label: "04-18", value: 210 },
  { label: "04-19", value: 175 },
  { label: "04-20", value: 240 },
  { label: "04-21", value: 198 },
];
const WB_AXIS_CALLS: WorkbenchAxisPoint[] = [
  { label: "04-15", value: 320 },
  { label: "04-16", value: 410 },
  { label: "04-17", value: 380 },
  { label: "04-18", value: 520 },
  { label: "04-19", value: 460 },
  { label: "04-20", value: 610 },
  { label: "04-21", value: 540 },
];

function WbBarChart({ heights }: { heights: string[] }) {
  return (
    <div className="wb-bar-chart">
      {heights.map((h, i) => (
        <div key={i} className="wb-bar" style={{ height: h }} />
      ))}
    </div>
  );
}

/** 创作者「Skills 多维评价」独立页：A=创作者风格判断，B=同一作品八维打分（按类型/上传时间筛选） */
function CreatorSkillsEvalPanel({ sessionId }: { sessionId: string }) {
  type EvalDimension = { name: string; score: number; trend: string; advice: string };
  type EvalWork = {
    id: string;
    title: string;
    type: "法律模块" | "合规工具" | "AI技能" | "智能体";
    uploadAt: string; // YYYY-MM-DD（上传时间）
    publishStatus: "未上架" | "已上架" | "审核中" | "已下架";
    styleTag: string;
    dimensions: EvalDimension[];
  };
  const [works, setWorks] = useState<EvalWork[]>([]);
  const [loadingWorks, setLoadingWorks] = useState(true);
  const [worksErr, setWorksErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingWorks(true);
        setWorksErr("");
        const pref = readWorkbenchTokenPreference();
        if (pref.mode === "off") {
          if (!cancelled) {
            setWorks([]);
            setWorksErr("你已选择“不使用相关功能”，Skills 多维评价已关闭。");
            setLoadingWorks(false);
          }
          return;
        }
        const query = new URLSearchParams({
          page_size: "200",
          token_mode: pref.mode,
          token_provider: pref.provider,
        });
        const resp = await fetch(`/api/workbench/creator/skills?${query.toString()}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
        const raw = (await resp.json().catch(() => ({}))) as {
          code?: number;
          data?: { items?: Record<string, unknown>[] };
          items?: Record<string, unknown>[];
        };
        const res =
          raw && typeof raw === "object" && raw.code === 0 && raw.data && typeof raw.data === "object"
            ? raw.data
            : raw;
        if (cancelled) return;
        const rows = (res.items || []) as Record<string, unknown>[];
        const statusAllowed = new Set(["active", "published"]);
        const mapType = (c: string): EvalWork["type"] => {
          if (c === "legal_module" || c === "skill_pack") return "法律模块";
          if (c === "compliance_tool" || c === "template") return "合规工具";
          if (c === "ai_skill" || c === "code") return "AI技能";
          return "智能体";
        };
        const styleByType: Record<EvalWork["type"], string> = {
          法律模块: "清单体 · 法条密",
          合规工具: "流程图 + 表格混排",
          AI技能: "扫描型 · 批注导向",
          智能体: "问答式 · 证据导向",
        };
        const dimensionsFor = (type: EvalWork["type"]): EvalDimension[] => {
          const base =
            type === "法律模块" ? 4.4 : type === "合规工具" ? 4.1 : type === "AI技能" ? 4.3 : 4.0;
          return [
            { name: "效率提升", score: base, trend: "+0.2", advice: "补默认参数与快捷模板" },
            { name: "UI 界面设计", score: base - 0.5, trend: "+0.1", advice: "补空状态与引导说明" },
            { name: "架构清晰度", score: base + 0.2, trend: "+0.1", advice: "补输入输出契约图" },
            { name: "成本控制", score: base - 0.2, trend: "持平", advice: "增加高成本流程阈值" },
            { name: "创意新颖性", score: base - 0.3, trend: "+0.1", advice: "增加场景策略组合" },
            { name: "上手难易度", score: base - 0.4, trend: "+0.2", advice: "新增首次使用三步指引" },
            { name: "适用法律领域普适性", score: base - 0.1, trend: "+0.1", advice: "补多行业适配模板" },
            { name: "调用权威数据量", score: base + 0.1, trend: "+0.2", advice: "强化法源引用与留痕" },
          ];
        };
        const parsed: EvalWork[] = rows
          .filter((r) => statusAllowed.has(String(r.status || "").toLowerCase()))
          .map((r): EvalWork => {
            const category = String(r.category ?? "");
            const t = mapType(category);
            const rawDate = String(r.created_at || r.updated_at || "");
            const date = rawDate && rawDate.length >= 10 ? rawDate.slice(0, 10) : "1970-01-01";
            return {
              id: String(r.id || ""),
              title: String(r.title || "未命名作品"),
              type: t,
              uploadAt: date,
              publishStatus: "已上架",
              styleTag: styleByType[t],
              dimensions: dimensionsFor(t),
            };
          })
          .filter((w) => w.id);
        setWorks(parsed);
      } catch {
        if (!cancelled) setWorksErr("作品数据加载失败，请稍后重试。");
      } finally {
        if (!cancelled) setLoadingWorks(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const [selectedType, setSelectedType] = useState<"all" | EvalWork["type"]>("all");
  const [uploadedAfter, setUploadedAfter] = useState("");
  const [workNameKeyword, setWorkNameKeyword] = useState("");

  const filteredWorks = works
    .filter((w) => (selectedType === "all" ? true : w.type === selectedType))
    .filter((w) => (uploadedAfter ? w.uploadAt >= uploadedAfter : true))
    .filter((w) =>
      selectedType === "all" || !workNameKeyword.trim()
        ? true
        : w.title.toLowerCase().includes(workNameKeyword.trim().toLowerCase())
    )
    .sort((a, b) => (a.uploadAt > b.uploadAt ? -1 : 1));
  const activeWork = filteredWorks[0] || null;

  return (
    <div className="space-y-3">
      <Card title="模块 A：创作者总体风格判断（跨作品）">
        <p className="text-sm leading-relaxed text-[#5D4E3A]">
          综合你在架全部 Skills/智能体样本：整体呈现<strong>「结构化交付 + 法条锚点前置」</strong>风格；说明文字偏短句、清单体；
          合同类条目引用密度高于站内均值约 18%，劳动类更偏「流程节点 + 风险提示」叙述。
        </p>
      </Card>
      <Card title="模块 B：同一作品八维打分（按筛选出现）">
        <p className="mb-2 text-xs text-[#9A8B78]">
          仅评价「已通过审核并上架」的 Skills，作品池与 Skills 管理中的我的 Skills 同源。
        </p>
        <div className="wb-form-actions" style={{ marginTop: 0, marginBottom: 8 }}>
          <label className="wb-hint" style={{ minWidth: 72 }}>作品类型</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as "all" | EvalWork["type"])}
            className="rounded-xl border border-[rgba(212,165,116,0.35)] bg-white px-3 py-2 text-sm text-[#2C2416]"
          >
            <option value="all">全部</option>
            <option value="法律模块">法律模块</option>
            <option value="合规工具">合规工具</option>
            <option value="AI技能">AI技能</option>
            <option value="智能体">智能体</option>
          </select>
          <label className="wb-hint" style={{ minWidth: 72 }}>上传时间</label>
          <input
            type="date"
            value={uploadedAfter}
            onChange={(e) => setUploadedAfter(e.target.value)}
            className="rounded-xl border border-[rgba(212,165,116,0.35)] bg-white px-3 py-2 text-sm text-[#2C2416]"
          />
          <label className="wb-hint" style={{ minWidth: 84 }}>子筛选（作品名）</label>
          <input
            type="text"
            value={workNameKeyword}
            onChange={(e) => setWorkNameKeyword(e.target.value)}
            placeholder={selectedType === "all" ? "请先选择作品类型" : "输入作品名称关键词"}
            disabled={selectedType === "all"}
            className="rounded-xl border border-[rgba(212,165,116,0.35)] bg-white px-3 py-2 text-sm text-[#2C2416] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {loadingWorks ? (
          <p className="wb-hint">正在加载我的 Skills…</p>
        ) : worksErr ? (
          <p className="wb-hint" style={{ color: "#D94D4D" }}>{worksErr}</p>
        ) : activeWork ? (
          <>
            <p className="mb-2 text-xs text-[#9A8B78]">
              当前评分对象：<strong>{activeWork.title}</strong>（{activeWork.type} · 上传 {activeWork.uploadAt} · {activeWork.publishStatus} · {activeWork.styleTag}）
            </p>
            <p className="mb-2 text-xs text-[#9A8B78]">当前筛选命中：{filteredWorks.length} 个作品</p>
            <div className="dense-table">
              <div className="dense-row head"><div>维度</div><div>评分</div><div>趋势</div><div>建议</div></div>
              {activeWork.dimensions.map((d) => (
                <div key={d.name} className="dense-row">
                  <div>{d.name}</div>
                  <div>{d.score.toFixed(1)}</div>
                  <div className={d.trend.startsWith("+") ? "up" : undefined}>{d.trend}</div>
                  <div>{d.advice}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="wb-hint">当前筛选条件下没有已上架作品，无法展示八个维度打分。</p>
        )}
      </Card>
    </div>
  );
}

function AnalyticsBoard({ section, sessionId }: { section: string; sessionId: string }) {
  const [postAgg, setPostAgg] = useState<{
    post_count: number;
    total_views: number;
    total_comments: number;
    total_likes: number;
    total_dislikes: number;
    total_skill_downloads: number;
    top_posts: Record<string, unknown>[];
  } | null>(null);
  const [publishViewTotal, setPublishViewTotal] = useState(0);
  const [applyViewTotal, setApplyViewTotal] = useState(0);

  useEffect(() => {
    const cached = readAnalyticsBoardCache();
    if (cached) {
      setPostAgg(cached.postAgg);
      setPublishViewTotal(cached.publishViewTotal);
      setApplyViewTotal(cached.applyViewTotal);
      return;
    }

    let cancelled = false;
    (async () => {
      const [postRes, oppRes, subRes] = await Promise.all([
        api.workspace.getPostAnalytics().catch(() => null),
        api.opportunities.getMyOpportunities({ page: 1, limit: 100 }).catch(() => ({ items: [] as Record<string, unknown>[] })),
        api.workspace.getMyOpportunitySubmissions({ page: 1, limit: 60 }).catch(() => ({ items: [] as Record<string, unknown>[] })),
      ]);
      if (cancelled) return;

      const publish = (oppRes.items || []).reduce((s, x) => s + Number((x as Record<string, unknown>).view_count || 0), 0);
      const rows = (subRes.items || []) as Record<string, unknown>[];
      let apply = sumSubmissionOpportunityViews(rows);
      if (apply === 0 && rows.length) {
        const uniqueIds = [...new Set(rows.map((x) => String(x.opportunity_id || "").trim()).filter(Boolean))].slice(0, 10);
        const details = await Promise.all(uniqueIds.map((id) => api.opportunities.getById(id).catch(() => null)));
        if (!cancelled) {
          apply = details.reduce((s, x) => s + Number((x as Record<string, unknown> | null)?.view_count || 0), 0);
        }
      }

      if (cancelled) return;
      setPostAgg(postRes);
      setPublishViewTotal(publish);
      setApplyViewTotal(apply);
      writeAnalyticsBoardCache({
        postAgg: postRes,
        publishViewTotal: publish,
        applyViewTotal: apply,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const publishTrend = trendFromTotal(publishViewTotal);
  const applyTrend = trendFromTotal(applyViewTotal);
  const postTrend = trendFromTotal(postAgg?.total_views || 0);

  if (section === "cre-analytics-skills-eval") {
    return <CreatorSkillsEvalPanel sessionId={sessionId} />;
  }

  const isCreatorOps = section === "cre-analytics";
  const showSkillsEvalDimensionCard = section.startsWith("cli-");

  return (
    <div className="space-y-3">
      <Card title="工作台趋势（近7日）">
        <div className="wb-analytics-charts">
          <div className="wb-chart-card">
            <div className="wb-chart-card-hd">上架岗位浏览量趋势</div>
            <WorkbenchAxisChart points={publishTrend} stroke={CHART_OK} yAxisLabel="浏览" />
          </div>
          <div className="wb-chart-card">
            <div className="wb-chart-card-hd">投递岗位浏览量趋势</div>
            <WorkbenchAxisChart points={applyTrend} stroke={CHART_BAD} yAxisLabel="浏览" />
          </div>
          <div className="wb-chart-card">
            <div className="wb-chart-card-hd">帖子浏览量趋势</div>
            <WorkbenchAxisChart points={postTrend} stroke={CHART_GRAY} yAxisLabel="浏览" />
          </div>
        </div>
      </Card>
      <div className="wb-analytics-charts">
        <div className="wb-chart-card">
          <div className="wb-chart-card-hd">业务活跃（近7日）</div>
          <WorkbenchAxisChart points={WB_AXIS_ACTIVE} stroke={CHART_OK} yAxisLabel="活跃" />
        </div>
        <div className="wb-chart-card">
          <div className="wb-chart-card-hd">互动与触达（近7日）</div>
          <WorkbenchAxisChart points={WB_AXIS_ENGAGE} stroke={CHART_GRAY} yAxisLabel="互动" />
        </div>
        <div className="wb-chart-card">
          <div className="wb-chart-card-hd">平台支出（元，示意）</div>
          <WorkbenchAxisChart points={WB_AXIS_SPEND} stroke={CHART_BAD} yAxisLabel="元" />
        </div>
        <div className="wb-chart-card">
          <div className="wb-chart-card-hd">实际调用数（次，示意）</div>
          <WorkbenchAxisChart points={WB_AXIS_CALLS} stroke={CHART_OK} yAxisLabel="次" />
        </div>
      </div>
      <Card title="我的帖子数据（客户可发帖，纳入分析）">
        {postAgg ? (
          <div className="dense-table">
            <div className="dense-row head"><div>指标</div><div>数值</div><div>说明</div><div>备注</div></div>
            <div className="dense-row"><div>帖子数</div><div>{postAgg.post_count}</div><div>我发布的社区帖</div><div>来自 community_posts</div></div>
            <div className="dense-row"><div>总浏览</div><div>{postAgg.total_views}</div><div>累计 view_count</div><div>—</div></div>
            <div className="dense-row"><div>总评论</div><div>{postAgg.total_comments}</div><div>累计 comment_count</div><div>含他人回复</div></div>
            <div className="dense-row"><div>总点赞</div><div>{postAgg.total_likes}</div><div>累计 like_count</div><div>—</div></div>
            <div className="dense-row"><div>总点踩</div><div>{postAgg.total_dislikes}</div><div>累计 dislike_count</div><div>社区帖子维度</div></div>
            <div className="dense-row"><div>技能包下载量</div><div>{postAgg.total_skill_downloads}</div><div>我发布 Skills 累计下载</div><div>来自 skills.download_count</div></div>
          </div>
        ) : (
          <p className="wb-hint">帖子统计数据暂不可用（请确认已登录且后端已启动）。</p>
        )}
        {postAgg && postAgg.top_posts?.length ? (
          <div className="dense-table mt-3">
            <div className="dense-row head"><div>热门帖（按浏览+评论加权）</div><div>浏览</div><div>评论</div><div>点赞 / 点踩</div></div>
            {postAgg.top_posts.map((p) => (
              <div key={String(p.id)} className="dense-row">
                <div>{String(p.title || "—")}</div>
                <div>{String(p.view_count ?? 0)}</div>
                <div>{String(p.comment_count ?? 0)}</div>
                <div>{String(p.like_count ?? 0)} / {String(p.dislike_count ?? 0)}</div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
      {isCreatorOps ? (
        <Card title="Skills 产品流量与收益（创作者专版）">
          <p className="wb-hint mb-2">较客户工作台增加「作品级」浏览、下载与分成口径；数据接入后按 SKU 与结算批次对齐。</p>
          <div className="dense-table">
            <div className="dense-row head"><div>作品</div><div>浏览量（30d）</div><div>下载/交付次数</div><div>产生收益（含税示意）</div></div>
            <div className="dense-row"><div>劳动争议证据清单生成器</div><div>12,480</div><div>1,902</div><div>¥ 18,620</div></div>
            <div className="dense-row"><div>合同风险快扫</div><div>8,210</div><div>964</div><div>¥ 6,340</div></div>
            <div className="dense-row"><div>企业规章民主程序清单</div><div>5,640</div><div>412</div><div>¥ 2,880</div></div>
            <div className="dense-row"><div>智能体 · 仲裁请求草拟助手</div><div>22,300</div><div>3,410</div><div>¥ 31,050</div></div>
          </div>
        </Card>
      ) : null}
      <Card title={isCreatorOps ? "经营与内容（创作者扩展）" : "数据分析"}>
        <div className="dense-table">
          <div className="dense-row head"><div>数据域</div><div>当期</div><div>环比</div><div>说明</div></div>
          <div className="dense-row"><div>业务活跃</div><div>8,920</div><div className="up">+16.7%</div><div>访问与触达</div></div>
          <div className="dense-row"><div>互动品质</div><div>1,346</div><div className="up">+1.2%</div><div>点赞/评论/收藏</div></div>
          <div className="dense-row"><div>交付效率</div><div>316</div><div className="up">+4.1%</div><div>文档处理与下载</div></div>
          <div className="dense-row"><div>异常告警</div><div>5</div><div className="down">+2</div><div>需人工复核</div></div>
          {isCreatorOps ? (
            <>
              <div className="dense-row"><div>Skills 总浏览（全作品）</div><div>48.6 万</div><div className="up">+9.4%</div><div>含未登录预览去重</div></div>
              <div className="dense-row"><div>Skills 付费转化</div><div>3.8%</div><div className="up">+0.4pt</div><div>试用→付费</div></div>
              <div className="dense-row"><div>内容复购率</div><div>22%</div><div className="up">+1.1pt</div><div>同客户 90 天内二次购买</div></div>
              <div className="dense-row"><div>分成后净收益</div><div>¥ 58,890</div><div className="up">+12.6%</div><div>已扣平台服务费（示意）</div></div>
            </>
          ) : null}
        </div>
      </Card>
      <Card title="使用与消费">
        <div className="dense-table">
          <div className="dense-row head"><div>指标</div><div>当前值</div><div>环比</div><div>说明</div></div>
          <div className="dense-row"><div>调用次数</div><div>1,024</div><div className="up">+9.2%</div><div>近30天</div></div>
          <div className="dense-row"><div>处理页数</div><div>316</div><div className="up">+4.1%</div><div>文档处理</div></div>
          <div className="dense-row"><div>支出</div><div>¥1,280</div><div className="down">-3.0%</div><div>本月消费</div></div>
          <div className="dense-row"><div>留存任务</div><div>5</div><div className="down">1 将到期</div><div>进行中</div></div>
        </div>
      </Card>
      {showSkillsEvalDimensionCard ? (
        <Card title="模块 A：创作者总体风格判断（跨作品）">
          <p className="text-sm leading-relaxed text-[#5D4E3A]">
            综合该创作者已公开作品，当前风格偏向<strong>结构化清单 + 风险前置提示</strong>，强项在架构清晰度与效率提升；
            弱项集中在新手上手引导与界面反馈一致性。
          </p>
        </Card>
      ) : null}
      {showSkillsEvalDimensionCard ? (
        <Card title="模块 B：作品维度打分（逐作品）">
          <div className="dense-table">
            <div className="dense-row head"><div>作品</div><div>维度</div><div>评分</div><div>建议</div></div>
            <div className="dense-row"><div>劳动争议证据清单生成器</div><div>效率提升</div><div>4.4</div><div>默认参数改为行业预设</div></div>
            <div className="dense-row"><div>劳动争议证据清单生成器</div><div>上手难易度</div><div>3.9</div><div>补首屏引导与示例输入</div></div>
            <div className="dense-row"><div>合同风险快扫</div><div>架构清晰度</div><div>4.6</div><div>维持结构并补版本差异说明</div></div>
            <div className="dense-row"><div>企业规章民主程序清单</div><div>适用法律领域普适性</div><div>3.8</div><div>补多行业场景适配模板</div></div>
          </div>
        </Card>
      ) : null}
      {section.includes("jobs") ? (
        <Card title="岗位数据">
          <p className="mb-2" style={{ fontSize: 12, color: "var(--muted)" }}>
            岗位浏览、评论、投递、转化等指标在此聚合展示。
          </p>
          <div className="wb-chart-card" style={{ margin: 0 }}>
            <div className="wb-chart-card-hd">投递与浏览（示意）</div>
            <WorkbenchSpark points="2,18 18,14 34,16 50,10 66,12 82,8 98,6" stroke={CHART_BAD} />
            <div className="mt-2">
              <WbBarChart heights={["55%", "40%", "70%", "48%", "62%"]} />
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function MessagesAndCoopHub() {
  return (
    <div className="space-y-3">
      <p className="wb-hint" style={{ marginBottom: 4 }}>
        合作邀请为平台<strong>留言</strong>中的协作子类型，与帖子、一般留言在同一入口查看与处理。
      </p>
      <CoopInvitations />
      <MyPostsPanel title="帖子与留言" />
    </div>
  );
}

function CoopInvitations() {
  const [recv, setRecv] = useState<Record<string, unknown>[]>([]);
  const [sent, setSent] = useState<Record<string, unknown>[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    invitations.getReceived({ page: 1, limit: 20 }).then((r) => setRecv(r.items || [])).catch(() => setRecv([]));
    invitations.getSent({ page: 1, limit: 20 }).then((r) => setSent(r.items || [])).catch(() => setSent([]));
  };

  useEffect(() => {
    load();
  }, []);

  const withdraw = async (id: string) => {
    setBusy(id);
    try {
      await invitations.delete(id);
      load();
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <Card title="合作邀请（留言 · 协作类）">
        <div className="two-col">
          <div>
            <h4 className="mb-2">收到的合作邀请</h4>
            <div className="dense-table">
              <div className="dense-row head"><div>摘要</div><div>状态</div><div>时间</div><div>操作</div></div>
              {recv.map((x) => (
                <div key={String(x.id)} className="dense-row">
                  <div>{String(x.message || x.invitation_type || "邀请")}</div>
                  <div>{String(x.status || "—")}</div>
                  <div>{formatLocalDateTime(x.created_at)}</div>
                  <div>—</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-2">发出的合作邀请</h4>
            <div className="dense-table">
              <div className="dense-row head"><div>摘要</div><div>状态</div><div>时间</div><div>操作</div></div>
              {sent.map((x) => {
                const id = String(x.id);
                const st = String(x.status || "");
                const canWithdraw = st === "pending" || st === "negotiating";
                return (
                  <div key={id} className="dense-row">
                    <div>{String(x.message || x.invitation_type || "邀请")}</div>
                    <div>{st}</div>
                    <div>{formatLocalDateTime(x.created_at)}</div>
                    <div>
                      {canWithdraw ? (
                        <button type="button" className="social-btn wb-btn-compact" disabled={busy === id} onClick={() => withdraw(id)}>
                          撤回
                        </button>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TrialInvitations({ role }: { role: RoleMode }) {
  const [recv, setRecv] = useState<Record<string, unknown>[]>([]);
  const [sent, setSent] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      trials.getReceived({ page: 1, limit: 20 }).catch(() => ({ items: [] as Record<string, unknown>[] })),
      trials.getSent({ page: 1, limit: 20 }).catch(() => ({ items: [] as Record<string, unknown>[] })),
    ]).then(([r1, r2]) => {
      if (cancelled) return;
      setRecv(r1.items || []);
      setSent(r2.items || []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (role !== "creator") {
    return (
      <Card title="试用邀请">
        <p className="wb-hint">
          试用邀请仅<strong>创作者</strong>可发起；客户工作台不展示试用发出入口。若需试用他人 Skills，请留意创作者发来的试用邀请。
        </p>
      </Card>
    );
  }

  const trialRow = (x: Record<string, unknown>, i: number) => (
    <div key={i} className="dense-row">
      <div>{String(x.target_name || x.user_name || "试用对象")}</div>
      <div>{String(x.source_type || "skill")}</div>
      <div>{String(x.status || "pending")}</div>
      <div>{String(x.expires_at || "-")}</div>
    </div>
  );

  return (
    <div className="space-y-3">
      <Card title="试用邀请">
        <p className="wb-hint mb-3">
          同一页查看<strong>收到</strong>与<strong>发出</strong>的试用：前者为他方邀你试用已上架作品，后者为你向他人发出的试用批次与卡片。
        </p>
        <div className="two-col">
          <div>
            <h4 className="mb-2 font-semibold text-[#5C4033]">收到的试用邀请</h4>
            <div className="dense-table">
              <div className="dense-row head">
                <div>对象</div>
                <div>类型</div>
                <div>状态</div>
                <div>截止时间</div>
              </div>
              {recv.length ? recv.map(trialRow) : (
                <div className="dense-row"><div>—</div><div>—</div><div>—</div><div className="wb-hint">暂无</div></div>
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-[#5C4033]">发出的试用邀请</h4>
            <div className="dense-table">
              <div className="dense-row head">
                <div>对象</div>
                <div>类型</div>
                <div>状态</div>
                <div>截止时间</div>
              </div>
              {sent.length ? sent.map(trialRow) : (
                <div className="dense-row"><div>—</div><div>—</div><div>—</div><div className="wb-hint">暂无</div></div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

type DemoSkillRow = {
  id: string;
  title: string;
  submissionType: "legal_module" | "compliance_tool" | "ai_skill" | "agent";
  coverImage: string;
  packageFileUrl: string;
  packageFileName: string;
  packageFileId: string;
  status: "已报审" | "已上架" | "已下架" | "未通过";
  price: string;
  /** 创作背景 */
  background: string;
  /** 架构说明 / 详图占位 */
  architecture: string;
  tools: string;
  scenarios: string;
};

const CREATOR_SKILLS_SEED: DemoSkillRow[] = [
  {
    id: "sk-1",
    title: "劳动争议证据清单生成器",
    submissionType: "legal_module",
    coverImage: "",
    packageFileUrl: "",
    packageFileName: "",
    packageFileId: "",
    status: "已上架",
    price: "¥ 199 / 年",
    background: "面向 HR 与律师助理：从常见争议点反推证据组织顺序，减少遗漏。",
    architecture: "输入：案由标签、用工形态、争议阶段 → 输出：分组清单 + 备注字段。详见流程图（上架后可在详情维护 SVG/图）。",
    tools: "Claude、内部规则库、裁判文书摘要（示意）",
    scenarios: "裁员协商、仲裁前整理、集团性用工事件",
  },
  {
    id: "sk-2",
    title: "合同风险快扫（Skills）",
    submissionType: "compliance_tool",
    coverImage: "",
    packageFileUrl: "",
    packageFileName: "",
    packageFileId: "",
    status: "已下架",
    price: "¥ 0 试用",
    background: "批量扫描高亮风险段落，适配采购/销售双模板。",
    architecture: "段落级向量检索 + 规则树；支持导出批注版 Word。",
    tools: "自研解析器、第三方 OCR（示意）",
    scenarios: "采购框架合同、NDA、经销商协议",
  },
];

function creatorSkillsStorageKey(sessionId: string) {
  return `lvzhi:workbench:creator-skills:v1:${sessionId}`;
}

function parseCreatorSkillsStored(raw: string | null): DemoSkillRow[] | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v) || !v.length) return null;
    const out: DemoSkillRow[] = [];
    for (const item of v) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const id = String(o.id ?? "");
      const title = String(o.title ?? "");
      const status = ["已报审", "已上架", "已下架", "未通过"].includes(String(o.status))
        ? (String(o.status) as DemoSkillRow["status"])
        : "已下架";
      if (!id || !title) continue;
      out.push({
        id,
        title,
        submissionType: (() => {
          const t = String(o.submissionType || "");
          if (t === "legal_module") return "legal_module";
          if (t === "compliance_tool") return "compliance_tool";
          if (t === "ai_skill") return "ai_skill";
          if (t === "agent") return "agent";
          // 兼容旧值
          if (t === "skill_pack") return "legal_module";
          if (t === "template") return "compliance_tool";
          if (t === "code") return "ai_skill";
          return "legal_module";
        })(),
        coverImage: String(o.coverImage ?? ""),
        packageFileUrl: String(o.packageFileUrl ?? ""),
        packageFileName: String(o.packageFileName ?? ""),
        packageFileId: String(o.packageFileId ?? ""),
        status,
        price: String(o.price ?? ""),
        background: String(o.background ?? ""),
        architecture: String(o.architecture ?? ""),
        tools: String(o.tools ?? ""),
        scenarios: String(o.scenarios ?? ""),
      });
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}

function skillRowFromApi(row: Record<string, unknown> | null | undefined): DemoSkillRow {
  if (!row || typeof row !== "object") {
    return {
      id: "",
      title: "",
      submissionType: "legal_module",
      coverImage: "",
      packageFileUrl: "",
      packageFileName: "",
      packageFileId: "",
      status: "已下架",
      price: "",
      background: "",
      architecture: "",
      tools: "",
      scenarios: "",
    };
  }
  const id = String(row.id ?? "");
  const st = String(row.status ?? "");
  const status: DemoSkillRow["status"] =
    st === "pending_review"
      ? "已报审"
      : st === "published" || st === "active"
        ? "已上架"
        : st === "draft" || st === "hidden"
          ? "已下架"
          : st === "rejected"
            ? "未通过"
            : "已下架";
  let tools = "";
  let scenarios = "";
  let priceLabel = "";
  let packageFileUrl = "";
  let packageFileName = "";
  let packageFileId = "";
  const content = row.content;
  if (content && typeof content === "object" && !Array.isArray(content)) {
    const c = content as Record<string, unknown>;
    const wb = c.workbench;
    if (wb && typeof wb === "object" && !Array.isArray(wb)) {
      const w = wb as Record<string, unknown>;
      tools = String(w.tools ?? "");
      scenarios = String(w.scenarios ?? "");
      priceLabel = String(w.price_label ?? "");
      const wbFileUrl = w.package_file_url;
      const wbFileName = w.package_file_name;
      const wbFileId = w.package_file_id;
      packageFileUrl = typeof wbFileUrl === "string" ? wbFileUrl.trim() : "";
      packageFileName = typeof wbFileName === "string" ? wbFileName.trim() : "";
      packageFileId = typeof wbFileId === "string" ? wbFileId.trim() : "";
    }
  }
  if (!packageFileUrl && Array.isArray(row.files) && row.files.length > 0) {
    const first = row.files[0];
    if (first && typeof first === "object") {
      const f = first as Record<string, unknown>;
      packageFileUrl = typeof f.url === "string" ? f.url.trim() : "";
      packageFileName = typeof f.original_name === "string" ? f.original_name.trim() : "";
      packageFileId = typeof f.id === "string" ? f.id.trim() : "";
    }
  }
  const pt = String(row.price_type ?? "paid");
  const priceNum = row.price != null ? Number(row.price) : 0;
  const price =
    priceLabel ||
    (pt === "free" ? "免费" : `¥ ${Number.isFinite(priceNum) ? priceNum : 0}`);
  const coverRaw = row.cover_image ?? row["coverImage"];
  const coverStr =
    typeof coverRaw === "string" ? coverRaw.trim() : coverRaw != null ? String(coverRaw).trim() : "";
  return {
    id,
    title: String(row.title ?? ""),
    submissionType: (() => {
      const c = String(row.category ?? "");
      if (c === "legal_module") return "legal_module";
      if (c === "compliance_tool") return "compliance_tool";
      if (c === "ai_skill") return "ai_skill";
      if (c === "agent") return "agent";
      // 兼容旧值
      if (c === "skill_pack") return "legal_module";
      if (c === "template") return "compliance_tool";
      if (c === "code") return "ai_skill";
      return "legal_module";
    })(),
    coverImage: coverStr,
    packageFileUrl,
    packageFileName,
    packageFileId,
    status,
    price: price || "待定",
    background: String(row.summary ?? ""),
    architecture: String(row.description ?? ""),
    tools,
    scenarios,
  };
}

/** 上传预览会加 ?v= 防缓存；落库只存干净 URL，避免超长或重复参数。 */
function coverImageForPersist(url: string): string | null {
  let s = url.trim();
  if (s.startsWith("/api/media?")) {
    try {
      const parsed = new URL(s, "http://localhost");
      const raw = parsed.searchParams.get("url");
      if (raw?.trim()) s = raw.trim();
    } catch {
      // keep original string when parse fails
    }
  }
  if (!s) return null;
  const q = s.indexOf("?");
  if (q === -1) return s;
  const base = s.slice(0, q);
  const rest = s.slice(q + 1);
  const parts = rest.split("&").filter((p) => !/^v=\d+$/.test(p));
  if (!parts.length) return base;
  return `${base}?${parts.join("&")}`;
}

function skillPatchFromDraft(d: DemoSkillRow): Record<string, unknown> {
  const packageUrl = d.packageFileUrl.trim();
  const packageName = d.packageFileName.trim();
  const packageId = d.packageFileId.trim();
  const files =
    packageUrl
      ? [{ id: packageId || null, url: packageUrl, original_name: packageName || null }]
      : [];
  return {
    title: d.title.trim(),
    category: d.submissionType,
    cover_image: coverImageForPersist(d.coverImage),
    summary: d.background,
    description: d.architecture,
    status: d.status === "已报审" ? "pending_review" : "draft",
    files,
    workbench: {
      tools: d.tools,
      scenarios: d.scenarios,
      price_label: d.price,
      package_file_url: packageUrl || null,
      package_file_name: packageName || null,
      package_file_id: packageId || null,
    },
  };
}

function CreatorSkillsManage({ sessionId }: { sessionId: string }) {
  const [rows, setRows] = useState<DemoSkillRow[]>(CREATOR_SKILLS_SEED);
  const [selectedId, setSelectedId] = useState<string | null>(CREATOR_SKILLS_SEED[0]?.id ?? null);
  const [detailEdit, setDetailEdit] = useState(false);
  const [draft, setDraft] = useState<DemoSkillRow | null>(null);
  const [apiLive, setApiLive] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listHint, setListHint] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [ipApplying, setIpApplying] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadTip, setCoverUploadTip] = useState("");
  const [packageUploading, setPackageUploading] = useState(false);
  const [packageUploadTip, setPackageUploadTip] = useState("");

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListHint("");
    (async () => {
      try {
        const res = await api.creator.getSkills({ limit: 80 });
        if (cancelled) return;
        const items = res.items || [];
        setApiLive(true);
        setRows(items.length ? items.map((x) => skillRowFromApi(x as Record<string, unknown>)) : []);
        setSelectedId((prev) => {
          if (items.length === 0) return null;
          const ids = items.map((x) => String((x as Record<string, unknown>).id));
          if (prev && ids.includes(prev)) return prev;
          return ids[0] ?? null;
        });
      } catch (err) {
        if (cancelled) return;
        const isApiError = err instanceof ApiError;
        const statusCode = isApiError ? err.statusCode : undefined;
        const isAuthError = statusCode === 401 || statusCode === 403;

        if (isAuthError) {
          setApiLive(true);
          setRows([]);
          setSelectedId(null);
          setListHint(
            statusCode === 401
              ? "登录态已失效，无法读取真实 Skills。请重新登录创作者账号后刷新。"
              : "当前账号暂无创作者权限，无法读取真实 Skills。请切换创作者账号。"
          );
          return;
        }

        setApiLive(false);
        try {
          const stored = parseCreatorSkillsStored(localStorage.getItem(creatorSkillsStorageKey(sessionId)));
          if (stored?.length) {
            setRows(stored);
            setSelectedId((prev) => (stored.some((r) => r.id === prev) ? prev : stored[0]!.id));
            setListHint(
              isApiError
                ? `服务暂不可用（${err.message || "未知错误"}），已加载本机备份数据。`
                : "未连上服务端，已加载本机备份数据。"
            );
          } else {
            setRows(CREATOR_SKILLS_SEED);
            setSelectedId(CREATOR_SKILLS_SEED[0]?.id ?? null);
            setListHint(
              isApiError
                ? `服务暂不可用（${err.message || "未知错误"}），已使用本地演示数据。`
                : "未连上服务端，已使用本地演示数据。"
            );
          }
        } catch {
          setRows(CREATOR_SKILLS_SEED);
          setSelectedId(CREATOR_SKILLS_SEED[0]?.id ?? null);
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
          setStorageReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (apiLive || !storageReady || listLoading) return;
    try {
      localStorage.setItem(creatorSkillsStorageKey(sessionId), JSON.stringify(rows));
    } catch {
      /* ignore */
    }
  }, [rows, sessionId, storageReady, apiLive]);

  useEffect(() => {
    if (!detailEdit || !selectedId) {
      setDraft(null);
    }
  }, [detailEdit, selectedId]);

  const patchRow = (id: string, patch: Partial<DemoSkillRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const patchDraft = (patch: Partial<DemoSkillRow>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const selectRowOnly = (id: string) => {
    setSelectedId(id);
    setDetailEdit(false);
    setDraft(null);
    setSaveMsg("");
  };

  const openEdit = (id: string) => {
    const row = rows.find((r) => r.id === id);
    setSelectedId(id);
    setDetailEdit(true);
    setSaveMsg("");
    if (row) setDraft({ ...row });
    else setDraft(null);
  };

  const setStatus = async (id: string, status: DemoSkillRow["status"]) => {
    const apiStatus = status === "已报审" ? "pending_review" : "draft";
    if (apiLive) {
      try {
        const source =
          detailEdit && draft?.id === id
            ? draft
            : (rows.find((r) => r.id === id) ?? null);
        if (!source) {
          setSaveMsg("提交失败：未找到对应 Skills");
          return;
        }
        if (status === "已报审") {
          const missing: string[] = [];
          if (!source.packageFileUrl.trim()) missing.push("上传材料（作品文件）");
          if (!source.price.trim()) missing.push("价格");
          if (!source.background.trim()) missing.push("简介/创作背景");
          if (!source.architecture.trim()) missing.push("架构简图/说明");
          if (!source.scenarios.trim()) missing.push("领域/业务场景");
          if (missing.length) {
            setSaveMsg(`提交失败：请补充 ${missing.join("、")}`);
            return;
          }
        }
        const payload =
          status === "已报审"
            ? skillPatchFromDraft({ ...source, status: "已报审" })
            : { status: apiStatus };
        const res = await api.creator.updateSkill(id, payload);
        const next = skillRowFromApi(res as Record<string, unknown>);
        setRows((prev) => prev.map((r) => (r.id === id ? next : r)));
        if (detailEdit && draft?.id === id) setDraft(next);
        setSaveMsg(status === "已报审" ? "已提交审核，报审内容已打包并进入后台内容审核台" : "已下架");
      } catch (e) {
        setSaveMsg(e instanceof ApiError ? e.message : "状态更新失败");
      }
      return;
    }
    patchRow(id, { status });
    if (detailEdit && draft?.id === id) setDraft((d) => (d ? { ...d, status } : d));
  };

  const saveMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashSave = (msg: string) => {
    setSaveMsg(msg);
    if (saveMsgTimer.current) clearTimeout(saveMsgTimer.current);
    saveMsgTimer.current = setTimeout(() => setSaveMsg(""), 3600);
  };

  const handleSaveClick = async () => {
    const source = draft ?? (detailEdit && selected ? { ...selected } : null);
    if (!source) {
      flashSave("请先点击「修改」，并确保已选中一条 Skills");
      return;
    }
    const title = source.title.trim();
    if (!title) {
      flashSave("请先填写 Skills 名称");
      return;
    }
    if (apiLive) {
      setSaveLoading(true);
      try {
        const payload = skillPatchFromDraft({ ...source, title });
        const res = await api.creator.updateSkill(source.id, payload);
        let next = skillRowFromApi(res as Record<string, unknown>);
        if (!next.id) {
          flashSave("保存成功但未返回有效数据，请刷新列表");
          return;
        }
        const sent =
          typeof payload.cover_image === "string" && payload.cover_image.trim()
            ? payload.cover_image.trim()
            : "";
        if (sent && !next.coverImage.trim()) {
          next = { ...next, coverImage: sent };
        }
        setRows((prev) => prev.map((r) => (r.id === next.id ? next : r)));
        setDetailEdit(false);
        setDraft(null);
        flashSave("已保存至服务器");
      } catch (e) {
        flashSave(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "保存失败");
      } finally {
        setSaveLoading(false);
      }
      return;
    }
    const nextRows = rows.map((r) => (r.id === source.id ? { ...source, title } : r));
    setRows(nextRows);
    try {
      localStorage.setItem(creatorSkillsStorageKey(sessionId), JSON.stringify(nextRows));
      setDetailEdit(false);
      setDraft(null);
      flashSave("已保存（本机演示数据）");
    } catch {
      flashSave("保存失败：无法写入本机存储");
    }
  };

  const applyIpForSelectedSkill = async () => {
    const target = draft ?? selected;
    if (!target?.id) {
      flashSave("请先选择一条 Skills 再提交知产申请");
      return;
    }
    if (ipApplying) return;
    setIpApplying(true);
    try {
      await api.creator.applyIp({
        source_type: "skill",
        source_id: target.id,
        materials: {
          title: target.title,
          submission_type: target.submissionType,
          status: target.status,
          price: target.price,
          background: target.background,
          architecture: target.architecture,
        },
      });
      window.alert("知识产权申请已提交，稍后工作人员将与您取得联系。");
      flashSave("知产申请已提交，已进入后台知产审核台等待人工处理");
    } catch (e) {
      flashSave(e instanceof ApiError ? e.message : "提交知产申请失败，请稍后重试");
    } finally {
      setIpApplying(false);
    }
  };

  const uploadSkillCover = async () => {
    const source = draft ?? (detailEdit && selected ? { ...selected } : null);
    if (!source) {
      flashSave("请先选中一条 Skills 并进入修改状态");
      return;
    }
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif";
    fileInput.onchange = async (ev) => {
      const f = (ev.currentTarget as HTMLInputElement | null)?.files?.[0];
      if (!f) return;
      setCoverUploading(true);
      setCoverUploadTip("");
      try {
        const row = await uploadFormFile(f);
        const url = String(row.url || "");
        if (!url) throw new Error("上传成功但未返回地址");
        const previewUrl = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
        patchDraft({ coverImage: previewUrl });
        patchRow(source.id, { coverImage: previewUrl });
        setCoverUploadTip("上传成功，点击保存后前台生效");
        flashSave("封面已上传，记得点击保存");
      } catch (e) {
        const m = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "封面上传失败";
        setCoverUploadTip(m);
        flashSave(m);
      } finally {
        setCoverUploading(false);
      }
    };
    fileInput.click();
  };

  const uploadSkillPackage = async () => {
    const source = draft ?? (detailEdit && selected ? { ...selected } : null);
    if (!source) {
      flashSave("请先选中一条 Skills 并进入修改状态");
      return;
    }
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept =
      ".zip,.rar,.7z,.pdf,.doc,.docx,.md,.txt,.json,.csv,.jpg,.jpeg,.png,.webp,application/zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/json";
    fileInput.onchange = async (ev) => {
      const f = (ev.currentTarget as HTMLInputElement | null)?.files?.[0];
      if (!f) return;
      setPackageUploading(true);
      setPackageUploadTip("");
      try {
        const row = await uploadFormFile(f);
        const url = String(row.url || "");
        if (!url) throw new Error("上传成功但未返回文件地址");
        patchDraft({
          packageFileUrl: url,
          packageFileName: String(row.original_name || f.name || ""),
          packageFileId: String(row.id || ""),
        });
        patchRow(source.id, {
          packageFileUrl: url,
          packageFileName: String(row.original_name || f.name || ""),
          packageFileId: String(row.id || ""),
        });
        setPackageUploadTip("作品文件上传成功，点击保存后前台下载生效");
        flashSave("作品文件已上传，记得点击保存");
      } catch (e) {
        const m = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "作品文件上传失败";
        setPackageUploadTip(m);
        flashSave(m);
      } finally {
        setPackageUploading(false);
      }
    };
    fileInput.click();
  };

  const handleCreate = async () => {
    if (apiLive) {
      try {
        const res = await api.creator.createSkill({ title: "未命名 Skills" });
        const row = skillRowFromApi(res as Record<string, unknown>);
        setRows((p) => [row, ...p]);
        setSelectedId(row.id);
        setDetailEdit(false);
        setDraft(null);
        flashSave("已在服务端创建草稿");
      } catch (e) {
        flashSave(e instanceof ApiError ? e.message : "创建失败");
      }
      return;
    }
    const id = `sk-${Date.now()}`;
    const row: DemoSkillRow = {
      id,
      title: "未命名 Skills",
      submissionType: "legal_module",
      coverImage: "",
      packageFileUrl: "",
      packageFileName: "",
      packageFileId: "",
      status: "已下架",
      price: "待定",
      background: "",
      architecture: "",
      tools: "",
      scenarios: "",
    };
    setRows((p) => [row, ...p]);
    setSelectedId(id);
    setDetailEdit(false);
    setDraft(null);
  };

  const renderField = (label: string, children: React.ReactNode) => (
    <tr>
      <th scope="row">{label}</th>
      <td>{children}</td>
    </tr>
  );

  return (
    <div className="wb-page-stack">
      <Card title="我的 Skills" compact>
        <p className="wb-hint mb-3">
          列表数据来自 <strong>{apiLive ? "服务端 /api/creator/skills" : "本机演示或备份"}</strong>。
          点击下方<strong>修改</strong>后，详情区进入可编辑状态；保存时调用 <strong>PUT /api/creator/skills/:id</strong> 写入数据库。
        </p>
        {listHint ? <p className="wb-hint mb-2" style={{ color: "var(--danger, #b42318)" }}>{listHint}</p> : null}
        <div className="wb-form-actions mb-3">
          <button type="button" className="btn-slide primary wb-btn-compact" disabled={listLoading} onClick={handleCreate}>
            {listLoading ? "加载中…" : "新建"}
          </button>
        </div>
        <div className="dense-table">
          <div className="dense-row head">
            <div>名称</div>
            <div>状态</div>
            <div>定价</div>
            <div>操作</div>
          </div>
          {listLoading ? (
            <div className="dense-row">
              <div className="wb-hint">加载中…</div>
              <div>—</div>
              <div>—</div>
              <div>—</div>
            </div>
          ) : rows.length === 0 ? (
            <div className="dense-row">
              <div className="wb-hint">暂无 Skills，可点击「新建」创建草稿。</div>
              <div>—</div>
              <div>—</div>
              <div>—</div>
            </div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="dense-row">
                <div>
                  <button
                    type="button"
                    className={`text-left font-medium underline-offset-2 hover:underline ${selectedId === r.id ? "text-[#D4A574]" : "text-[#5C4033]"}`}
                    onClick={() => selectRowOnly(r.id)}
                  >
                    {r.title}
                  </button>
                </div>
                <div>{r.status}</div>
                <div>{r.price}</div>
                <div className="flex flex-wrap gap-1">
                  {r.status === "已上架" ? (
                    <button type="button" className="social-btn wb-btn-compact" onClick={() => void setStatus(r.id, "已下架")}>
                      下架
                    </button>
                  ) : r.status === "已报审" ? (
                    <button type="button" className="social-btn wb-btn-compact" disabled>
                      已报审
                    </button>
                  ) : (
                    <button type="button" className="social-btn wb-btn-compact" onClick={() => void setStatus(r.id, "已报审")}>
                      提交审核
                    </button>
                  )}
                  <button type="button" className="social-btn wb-btn-compact" onClick={() => openEdit(r.id)}>
                    修改
                  </button>
                  <button
                    type="button"
                    className="social-btn wb-btn-compact"
                    disabled={ipApplying}
                    onClick={async () => {
                      if (ipApplying) return;
                      const current = rows.find((x) => x.id === r.id) ?? null;
                      if (!current) {
                        flashSave("未找到对应 Skills，无法提交知产申请");
                        return;
                      }
                      setSelectedId(r.id);
                      setIpApplying(true);
                      try {
                        await api.creator.applyIp({
                          source_type: "skill",
                          source_id: current.id,
                          materials: {
                            title: current.title,
                            submission_type: current.submissionType,
                            status: current.status,
                            price: current.price,
                            background: current.background,
                            architecture: current.architecture,
                          },
                        });
                        flashSave(`《${current.title || "该 Skills"}》知产申请已提交`);
                      } catch (e) {
                        flashSave(e instanceof ApiError ? e.message : "提交知产申请失败，请稍后重试");
                      } finally {
                        setIpApplying(false);
                      }
                    }}
                  >
                    {ipApplying && selectedId === r.id ? "提交中…" : "一键知识产权申请"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
      {selected ? (
        <Card title={detailEdit ? "Skills 详情（编辑中）" : "Skills 详情（只读）"} compact>
          <p className="wb-hint mb-3">
            {detailEdit ? (
              <>
                正在编辑 <strong>{draft?.title || selected.title || "（未命名）"}</strong>，完成后请点「保存」写入
                {apiLive ? "服务器" : "本机"}；可点「取消」放弃未保存修改。
              </>
            ) : (
              <>
                已选中 <strong>{selected.title || "（未命名）"}</strong>。点击列表中的<strong>修改</strong>进入编辑。
              </>
            )}
          </p>
          {detailEdit && draft ? (
            <div
              style={{
                margin: "0 0 12px",
                padding: "10px 12px",
                border: "1px solid rgba(212,165,116,0.28)",
                borderRadius: 10,
                background: "rgba(255,248,240,0.55)",
              }}
            >
              <p className="wb-hint" style={{ marginBottom: 8, color: "var(--text)" }}>
                Skills 封面图上传（编辑态）
              </p>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    draft.coverImage
                      ? withPublicMediaProxy(draft.coverImage)
                      : `https://picsum.photos/seed/${encodeURIComponent(draft.id || draft.title || "skill")}/120/80`
                  }
                  alt=""
                  className="h-14 w-20 rounded border border-[rgba(212,165,116,0.25)] object-cover"
                />
                <button
                  type="button"
                  className="social-btn wb-btn-compact"
                  disabled={coverUploading}
                  onClick={() => void uploadSkillCover()}
                >
                  {coverUploading ? "上传中…" : "上传封面"}
                </button>
                <span className="wb-hint">上传后点「保存修改」才会写入并映射前台</span>
                {coverUploadTip ? (
                  <span className="wb-hint" style={{ color: coverUploadTip.includes("成功") ? "#2FA863" : "#D94D4D" }}>
                    {coverUploadTip}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
          {detailEdit && draft ? (
            <div
              style={{
                margin: "0 0 12px",
                padding: "10px 12px",
                border: "1px solid rgba(212,165,116,0.28)",
                borderRadius: 10,
                background: "rgba(255,248,240,0.55)",
              }}
            >
              <p className="wb-hint" style={{ marginBottom: 8, color: "var(--text)" }}>
                Skills 作品文件上传（用于下载交付）
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  className="social-btn wb-btn-compact"
                  disabled={packageUploading}
                  onClick={() => void uploadSkillPackage()}
                >
                  {packageUploading ? "上传中…" : "上传作品文件"}
                </button>
                {draft.packageFileUrl ? (
                  <a
                    href={draft.packageFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="wb-hint underline"
                    title={draft.packageFileUrl}
                  >
                    {draft.packageFileName || "查看当前文件"}
                  </a>
                ) : (
                  <span className="wb-hint">尚未上传作品文件</span>
                )}
                <span className="wb-hint">上传后点「保存修改」才会写入并用于前台下载</span>
                {packageUploadTip ? (
                  <span className="wb-hint" style={{ color: packageUploadTip.includes("成功") ? "#2FA863" : "#D94D4D" }}>
                    {packageUploadTip}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
          <table className="wb-form-table">
            <tbody>
              {detailEdit && draft
                ? (
                  <>
                    {renderField(
                      "名称",
                      <input
                        className="form-input"
                        value={draft.title}
                        onChange={(e) => patchDraft({ title: e.target.value })}
                        placeholder="Skills 名称"
                        required
                      />
                    )}
                    {renderField(
                      "类型",
                      <select
                        className="form-input"
                        value={draft.submissionType}
                        onChange={(e) =>
                          patchDraft({
                            submissionType: (e.target.value as DemoSkillRow["submissionType"]) || "legal_module",
                          })
                        }
                      >
                        <option value="legal_module">法律模块</option>
                        <option value="compliance_tool">合规工具</option>
                        <option value="ai_skill">AI技能</option>
                        <option value="agent">智能体</option>
                      </select>
                    )}
                    {renderField(
                      "封面地址",
                      <p className="wb-hint" style={{ color: "var(--text)" }}>
                        {draft.coverImage || "未设置（请在上方“Skills 封面图上传”区块上传）"}
                      </p>
                    )}
                    {renderField(
                      "文件下载路径",
                      <div className="space-y-1">
                        <input
                          className="form-input"
                          value={draft.packageFileUrl}
                          onChange={(e) => patchDraft({ packageFileUrl: e.target.value })}
                          placeholder="https://...（上传后自动回填）"
                        />
                        <input
                          className="form-input"
                          value={draft.packageFileName}
                          onChange={(e) => patchDraft({ packageFileName: e.target.value })}
                          placeholder="文件名称（可选）"
                        />
                        <p className="wb-hint">可手动粘贴路径，也可点上方“上传作品文件”自动回填。</p>
                      </div>
                    )}
                    {renderField(
                      "审核状态",
                      <select
                        className="form-input"
                        value={draft.status}
                        onChange={(e) => patchDraft({ status: e.target.value as DemoSkillRow["status"] })}
                      >
                        <option value="已下架">已下架</option>
                        <option value="已报审">已报审</option>
                      </select>
                    )}
                    {renderField(
                      "定价",
                      <input
                        className="form-input"
                        value={draft.price}
                        onChange={(e) => patchDraft({ price: e.target.value })}
                        placeholder="如 ¥ 199 / 年"
                      />
                    )}
                    {renderField(
                      "创作背景",
                      <textarea
                        className="form-input"
                        value={draft.background}
                        onChange={(e) => patchDraft({ background: e.target.value })}
                        placeholder="创作背景、解决的问题"
                        rows={3}
                      />
                    )}
                    {renderField(
                      "架构详图",
                      <textarea
                        className="form-input"
                        value={draft.architecture}
                        onChange={(e) => patchDraft({ architecture: e.target.value })}
                        placeholder="流程、模块、输入输出说明"
                        rows={4}
                      />
                    )}
                    {renderField(
                      "采用工具",
                      <textarea
                        className="form-input"
                        value={draft.tools}
                        onChange={(e) => patchDraft({ tools: e.target.value })}
                        placeholder="模型、数据源、依赖服务等"
                        rows={2}
                      />
                    )}
                    {renderField(
                      "适用业务场景",
                      <textarea
                        className="form-input"
                        value={draft.scenarios}
                        onChange={(e) => patchDraft({ scenarios: e.target.value })}
                        placeholder="典型客户与使用情境"
                        rows={2}
                      />
                    )}
                  </>
                )
                : (
                  <>
                    {renderField("名称", <p className="text-sm leading-relaxed text-[#5D4E3A]">{selected.title || "—"}</p>)}
                    {renderField(
                      "类型",
                      <p className="text-sm leading-relaxed text-[#5D4E3A]">
                        {selected.submissionType === "compliance_tool"
                          ? "合规工具"
                          : selected.submissionType === "ai_skill"
                            ? "AI技能"
                            : selected.submissionType === "agent"
                              ? "智能体"
                              : "法律模块"}
                      </p>
                    )}
                    {renderField(
                      "封面",
                      selected.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={withPublicMediaProxy(selected.coverImage)}
                          alt=""
                          className="h-14 w-20 rounded border border-[rgba(212,165,116,0.25)] object-cover"
                        />
                      ) : (
                        <p className="wb-hint">未设置，前台会回退占位图标</p>
                      )
                    )}
                    {renderField(
                      "文件下载路径",
                      selected.packageFileUrl ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={selected.packageFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="wb-hint underline"
                            title={selected.packageFileUrl}
                          >
                            {selected.packageFileName || "下载作品文件"}
                          </a>
                          <span className="wb-hint">{selected.packageFileUrl}</span>
                        </div>
                      ) : (
                        <p className="wb-hint">未设置，前台无法提供真实下载文件</p>
                      )
                    )}
                    {renderField("审核状态", <p className="text-sm text-[#5D4E3A]">{selected.status}</p>)}
                    {renderField("定价", <p className="text-sm font-semibold text-[#5C4033]">{selected.price || "—"}</p>)}
                    {renderField("创作背景", <p className="text-sm leading-relaxed text-[#5D4E3A]">{selected.background || "—"}</p>)}
                    {renderField("架构详图", <p className="text-sm leading-relaxed text-[#5D4E3A]">{selected.architecture || "—"}</p>)}
                    {renderField("采用工具", <p className="text-sm leading-relaxed text-[#5D4E3A]">{selected.tools || "—"}</p>)}
                    {renderField("适用业务场景", <p className="text-sm leading-relaxed text-[#5D4E3A]">{selected.scenarios || "—"}</p>)}
                  </>
                )}
            </tbody>
          </table>
          {detailEdit ? (
            <div className="wb-form-actions mt-3">
              <button
                type="button"
                className="btn-slide primary wb-btn-compact"
                disabled={saveLoading}
                onClick={() => void handleSaveClick()}
              >
                {saveLoading ? "保存中…" : "保存修改"}
              </button>
              <button
                type="button"
                className="social-btn wb-btn-compact"
                disabled={saveLoading}
                onClick={() => {
                  setDetailEdit(false);
                  setDraft(null);
                  setSaveMsg("");
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="social-btn wb-btn-compact"
                disabled={saveLoading || !selected}
                onClick={() => {
                  if (selected) void setStatus(selected.id, "已报审");
                }}
              >
                一键打包并提交审核
              </button>
              <button
                type="button"
                className="social-btn wb-btn-compact"
                disabled={saveLoading || ipApplying || !selected}
                onClick={() => void applyIpForSelectedSkill()}
              >
                {ipApplying ? "提交中…" : "一键知识产权申请"}
              </button>
              {saveMsg ? <span className="wb-hint" style={{ color: "var(--text)" }}>{saveMsg}</span> : null}
            </div>
          ) : saveMsg ? (
            <p className="wb-hint mt-2">{saveMsg}</p>
          ) : null}
          {!detailEdit ? (
            <div className="wb-form-actions mt-3">
              <button
                type="button"
                className="social-btn wb-btn-compact"
                disabled={ipApplying || !selected}
                onClick={() => void applyIpForSelectedSkill()}
              >
                {ipApplying ? "提交中…" : "一键知识产权申请"}
              </button>
              <span className="wb-hint">提交后将进入后台知产审核台，人工处理。</span>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

function MyPostsPanel({ title }: { title: string }) {
  const [posts, setPosts] = useState<Record<string, unknown>[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Record<string, unknown>[]>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const loadPosts = () => {
    api.workspace.getCommunity({ page: 1, limit: 30 }).then((r) => setPosts(r.items || [])).catch(() => setPosts([]));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const loadComments = async (postId: string) => {
    const res = await api.community.listComments(postId, { page: 1, limit: 80 });
    setCommentsByPost((m) => ({ ...m, [postId]: res.items || [] }));
  };

  const toggle = async (postId: string) => {
    if (openId === postId) {
      setOpenId(null);
      return;
    }
    setOpenId(postId);
    await loadComments(postId);
  };

  const sendTopComment = async (postId: string) => {
    const t = (replyText[`p-${postId}`] || "").trim();
    if (!t) return;
    await api.community.comment(postId, t);
    setReplyText((s) => ({ ...s, [`p-${postId}`]: "" }));
    await loadComments(postId);
  };

  const sendReply = async (postId: string, parentId: string) => {
    const key = `c-${parentId}`;
    const t = (replyText[key] || "").trim();
    if (!t) return;
    await api.community.comment(postId, t, parentId);
    setReplyText((s) => ({ ...s, [key]: "" }));
    await loadComments(postId);
  };

  return (
    <Card title={title}>
      <p className="wb-hint mb-2">以下为「我发布的帖子」。可展开查看评论，并对评论进行回复（回复会以子评论形式展示）。</p>
      <div className="dense-table">
        <div className="dense-row head"><div>标题</div><div>浏览</div><div>评论</div><div>操作</div></div>
        {posts.map((p) => {
          const id = String(p.id);
          const tags = Array.isArray(p.tags) ? (p.tags as string[]).join(", ") : String(p.tags || "");
          return (
            <div key={id} className="mb-2 border-b border-[rgba(212,165,116,0.15)] pb-2 last:border-0">
              <div className="dense-row">
                <div>{String(p.title || "—")}</div>
                <div>{String(p.view_count ?? 0)}</div>
                <div>{String(p.comment_count ?? 0)}</div>
                <div>
                  <button type="button" className="social-btn wb-btn-compact" onClick={() => toggle(id)}>
                    {openId === id ? "收起" : "留言 / 回复"}
                  </button>
                </div>
              </div>
              {openId === id ? (
                <div className="p-3" style={{ background: "var(--surface-2, rgba(0,0,0,0.03))", fontSize: 12 }}>
                  <div className="wb-hint mb-1">标签：{tags || "—"}</div>
                  <div className="mb-2" style={{ whiteSpace: "pre-wrap" }}>{String(p.content || "").slice(0, 800)}{String(p.content || "").length > 800 ? "…" : ""}</div>
                  <div className="dense-table mb-2">
                    <div className="dense-row head"><div>评论人</div><div>内容</div><div>时间</div><div>回复</div></div>
                    {(commentsByPost[id] || []).map((c) => (
                      <div key={String(c.id)} className="dense-row">
                        <div>{String(c.author_name || "用户")}</div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{String(c.content)}</div>
                        <div>{formatLocalDateTime(c.created_at)}</div>
                        <div>
                          <input
                            className="form-input"
                            placeholder="回复该评论"
                            value={replyText[`c-${String(c.id)}`] || ""}
                            onChange={(e) => setReplyText((s) => ({ ...s, [`c-${String(c.id)}`]: e.target.value }))}
                          />
                          <button type="button" className="btn-slide primary wb-btn-compact mt-1" onClick={() => sendReply(id, String(c.id))}>
                            发送回复
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="发表新评论（对帖子）"
                    value={replyText[`p-${id}`] || ""}
                    onChange={(e) => setReplyText((s) => ({ ...s, [`p-${id}`]: e.target.value }))}
                  />
                  <button type="button" className="btn-slide primary wb-btn-compact mt-1" onClick={() => sendTopComment(id)}>
                    发表评论
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function NoticeBoard() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    api.workspace.getNotifications({ page: 1, limit: 30 }).then((r) => setItems(r.items || [])).catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, []);

  const markOne = async (id: string) => {
    setBusy(id);
    try {
      await api.workspace.markNotificationRead(id);
      load();
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  const markAll = async () => {
    setBusy("all");
    try {
      await api.workspace.markAllNotificationsRead();
      load();
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card title="通知">
      <div className="wb-form-actions mb-2">
        <button type="button" className="social-btn wb-btn-compact" disabled={busy === "all"} onClick={markAll}>
          全部标记已读
        </button>
        <span className="wb-hint">未单独标记的，列表中以「未读」展示（依赖服务端 is_read）。</span>
      </div>
      <div className="dense-table">
        <div className="dense-row head"><div>状态</div><div>主题</div><div>时间</div><div>内容摘要</div><div>操作</div></div>
        {items.map((x) => {
          const id = String(x.id);
          const read = Boolean(x.is_read);
          return (
            <div key={id} className="dense-row">
              <div>{read ? <span className="wb-hint">已读</span> : <strong>未读</strong>}</div>
              <div>{String(x.title || x.notification_type || "通知")}</div>
              <div>{formatLocalDateTime(x.created_at)}</div>
              <div style={{ fontSize: 12 }}>{String(x.content || "-").slice(0, 80)}{String(x.content || "").length > 80 ? "…" : ""}</div>
              <div>
                {!read ? (
                  <button type="button" className="btn-slide primary wb-btn-compact" disabled={busy === id} onClick={() => markOne(id)}>
                    标为已读
                  </button>
                ) : (
                  "—"
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
