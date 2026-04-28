"use client";

import { useMemo, type ReactNode } from "react";

import { getWorkbenchShellFixture, tryResolveWorkbenchSectionTopbar } from "@/lib/workbench";
import type { NavGroupDef, WorkbenchShellFixture } from "@/lib/workbench/types";

import { WorkbenchSpark } from "@/components/workbench-app/WorkbenchSpark";
import {
  WorkbenchKpiOverviewSection,
  WorkbenchLogo,
  WorkbenchSideNav,
  WorkbenchTopbar,
  WorkbenchUserProfile,
} from "./WorkbenchShellPrimitives";
import type { WorkbenchNavProps } from "./types";

const MUTED = "var(--muted)";
const OK = "#3c8c5a";
const BAD = "#c15a4a";
const GRAY = "#9a8b78";

type Props = WorkbenchNavProps & {
  panelId: string;
  isActive: boolean;
  mode?: "demo" | "app";
  pathname?: string;
  urlHash?: string;
  navGroups?: NavGroupDef[];
  profile?: WorkbenchShellFixture["profile"];
  children?: ReactNode;
};

export function ClientRoleWorkbench({
  panelId,
  isActive,
  activeHash,
  onNavigate,
  mode = "demo",
  pathname = "",
  urlHash = "",
  navGroups: navGroupsProp,
  profile: profileProp,
  children,
}: Props) {
  const shell = getWorkbenchShellFixture("client");
  const navGroups = navGroupsProp ?? shell.navGroups;
  const profile = profileProp ?? shell.profile;
  const showFullSpec = mode !== "app" || !pathname || pathname === "/workspace";

  const topbar = useMemo(() => {
    if (mode !== "app" || !pathname) return shell.topbar;
    const r = tryResolveWorkbenchSectionTopbar(pathname);
    return r ?? shell.topbar;
  }, [mode, pathname, shell]);

  return (
    <div id={panelId} className={["role-panel", "app", isActive ? "active" : ""].filter(Boolean).join(" ")}>
      <aside className="sidebar" aria-label="客户工作台导航">
        <WorkbenchLogo />
        <WorkbenchSideNav
          groups={navGroups}
          activeHash={activeHash}
          onNavigate={onNavigate}
          ariaLabel="客户主导航"
          mode={mode}
          pathname={pathname}
          urlHash={urlHash}
        />
        <WorkbenchUserProfile profile={profile} />
      </aside>
      <main className="main">
        <WorkbenchTopbar topbar={topbar} homeHref="/workspace" compact={mode === "app"} />
        <div className="content">
          {!showFullSpec && children ? (
            <div className="workbench-app-page-slot">{children}</div>
          ) : (
            <>
          <WorkbenchKpiOverviewSection sectionId={shell.overviewSectionId} items={shell.kpis} />

          <div className="callout">
            子集规则：隐藏「Skills 上架供给、收益结算、经营级数据分析、发出的试用邀请」等创作者域；保留「购买后使用、文件处理、协作消息、岗位招聘与投递」闭环。说明：客户无上架与供给能力，不能向他人发出试用邀请；仍可收到他人邀请试用对方已上架产品。
          </div>

          <div className="stack-col">
            <section className="section" id="cli-studio">
              <div className="section-hd">
                <span>工作画布与文件（示意）</span>
                <span className="pill" style={{ height: 24, fontSize: 11 }}>
                  任务 T-204
                </span>
              </div>
              <div className="section-bd">
                <div className="studio">
                  <div className="studio-col">
                    <div className="studio-hd">
                      <span>已购 Skills</span>
                      <span style={{ fontSize: 10, color: MUTED, fontWeight: 400 }}>3</span>
                    </div>
                    <div className="studio-bd">
                      合同审查包 v2.1（当前）
                      <br />
                      劳动流程包
                      <br />
                      合规清单
                    </div>
                  </div>
                  <div className="studio-col">
                    <div className="studio-hd">
                      <span>画布</span>
                      <span style={{ fontSize: 10, color: MUTED, fontWeight: 400 }}>
                        上传 / API / 导出
                      </span>
                    </div>
                    <div className="studio-bd">
                      <div className="studio-box">
                        上传材料、调用处理、审阅结果、下载回写。与创作者侧同一交互骨架，仅收敛配置项。
                      </div>
                    </div>
                  </div>
                  <div className="studio-col">
                    <div className="studio-hd">
                      <span>本案材料</span>
                      <span style={{ fontSize: 10, color: MUTED, fontWeight: 400 }}>
                        只读
                      </span>
                    </div>
                    <div className="studio-bd">
                      委托合同.pdf
                      <br />
                      证据目录.xlsx
                      <br />
                      沟通摘录.docx
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="section" id="cli-coop-hub">
              <div className="section-hd">消息与协作（拆分）</div>
              <div className="section-bd">
                <div className="coop-grid coop-grid--three">
                  <div className="coop-block" id="cli-coop-recv-c">
                    <div className="coop-block-hd">
                      <span>收到的合作邀请</span>
                      <span className="hint">待办 2</span>
                    </div>
                    <ul className="todo">
                      <li>
                        <span>某所请求联合办案</span>
                        <span className="status s1">待办</span>
                      </li>
                    </ul>
                  </div>
                  <div className="coop-block" id="cli-coop-sent-c">
                    <div className="coop-block-hd">
                      <span>发出的合作邀请</span>
                      <span className="hint">跟进 1</span>
                    </div>
                    <ul className="todo">
                      <li>
                        <span>已向客户发出协作方案</span>
                        <span className="status s3">已读</span>
                      </li>
                    </ul>
                  </div>
                  <div className="coop-block" id="cli-coop-recv-t">
                    <div className="coop-block-hd">
                      <span>收到的试用邀请</span>
                      <span className="hint">新到 1</span>
                    </div>
                    <p className="coop-block-desc">他人邀请你试用其在平台已上架产品。</p>
                    <ul className="todo">
                      <li>
                        <span>李律师邀你试用其「尽调助手」</span>
                        <span className="status s1">待办</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="callout" style={{ marginTop: 8 }}>
                  客户无上架与供给能力：不提供「发出的试用邀请」入口。试用仅保留「收到的试用邀请」。
                </div>
              </div>
            </section>
          </div>

          <section className="section" id="cli-analytics">
            <div className="section-hd">使用与消费（高密度示意）</div>
            <div className="section-bd">
              <div className="metric-dense-grid">
                <div className="metric-tile">
                  <div className="metric-head">
                    <span>调用次数</span>
                    <span className="metric-kind">API</span>
                  </div>
                  <div className="metric-number">1,024</div>
                  <div className="metric-trend-row">
                    <span className="metric-sub up">+9.2% 环比</span>
                    <WorkbenchSpark points="2,19 20,16 38,13 56,9 74,6 92,3" stroke={OK} />
                  </div>
                </div>
                <div className="metric-tile">
                  <div className="metric-head">
                    <span>处理页数</span>
                    <span className="metric-kind">文档</span>
                  </div>
                  <div className="metric-number">316</div>
                  <div className="metric-trend-row">
                    <span className="metric-note">近30天 · +4.1%</span>
                    <WorkbenchSpark points="2,16 20,14 38,15 56,12 74,10 92,8" stroke={OK} />
                  </div>
                </div>
                <div className="metric-tile">
                  <div className="metric-head">
                    <span>支出</span>
                    <span className="metric-kind">消费</span>
                  </div>
                  <div className="metric-number">¥ 1,280</div>
                  <div className="metric-trend-row">
                    <span className="metric-note">本月 · −3.0%</span>
                    <WorkbenchSpark points="2,5 20,8 38,11 56,14 74,17 92,20" stroke={BAD} />
                  </div>
                </div>
                <div className="metric-tile">
                  <div className="metric-head">
                    <span>留存任务</span>
                    <span className="metric-kind">项目</span>
                  </div>
                  <div className="metric-number">5</div>
                  <div className="metric-trend-row">
                    <span className="metric-sub down">1 将到期</span>
                    <WorkbenchSpark points="2,8 22,10 42,12 62,15 82,18 98,21" stroke={BAD} />
                  </div>
                </div>
              </div>
              <div className="dense-table">
                <div className="dense-row head">
                  <div>已购 Skills</div>
                  <div>本期调用</div>
                  <div>最近使用</div>
                  <div>趋势（环比与走势）</div>
                </div>
                <div className="dense-row">
                  <div>合同审查包</div>
                  <div>412</div>
                  <div>今天</div>
                  <div className="trend-cell">
                    <span className="trend-pct up">+8.1%</span>
                    <WorkbenchSpark points="2,18 18,15 34,12 50,9 66,6 82,4 98,2" stroke={OK} />
                  </div>
                </div>
                <div className="dense-row">
                  <div>劳动流程包</div>
                  <div>198</div>
                  <div>3天前</div>
                  <div className="trend-cell">
                    <span className="trend-pct up">+2.4%</span>
                    <WorkbenchSpark points="2,16 22,14 42,13 62,12 82,10 98,9" stroke={OK} />
                  </div>
                </div>
                <div className="dense-row">
                  <div>合规清单</div>
                  <div>64</div>
                  <div>12天前</div>
                  <div className="trend-cell">
                    <span className="trend-pct down">−6.2%</span>
                    <WorkbenchSpark points="2,6 20,9 38,12 56,15 74,18 92,21" stroke={BAD} />
                  </div>
                </div>
              </div>
              <div id="cli-analytics-jobs" style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: "#5c4033" }}>
                岗位数据（示意）
              </div>
              <div className="dense-table" style={{ marginTop: 6 }}>
                <div className="dense-row head">
                  <div>已发岗位</div>
                  <div>本期浏览</div>
                  <div>评论 / 投递</div>
                  <div>趋势（环比与走势）</div>
                </div>
                <div className="dense-row">
                  <div>驻场法务（上海）</div>
                  <div>1,842</div>
                  <div>26 / 14</div>
                  <div className="trend-cell">
                    <span className="trend-pct up">+12.0%</span>
                    <WorkbenchSpark points="2,20 20,17 40,13 60,10 80,6 98,3" stroke={OK} />
                  </div>
                </div>
                <div className="dense-row">
                  <div>争议解决实习生</div>
                  <div>920</div>
                  <div>11 / 32</div>
                  <div className="trend-cell">
                    <span className="trend-pct down">−4.5%</span>
                    <WorkbenchSpark points="2,7 22,9 42,12 62,15 82,18 98,20" stroke={BAD} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section" id="cli-analytics-skills-eval">
            <div className="section-hd">Skills 多维评价与建议（示意）</div>
            <div className="section-bd">
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 11,
                  color: MUTED,
                  lineHeight: 1.55,
                }}
              >
                平台以 Skills 为交付单元：对已购或深度使用的产品，从多维度评分与文本反馈聚合为创作者能力画像，用于你侧招聘筛选、合作风险评估与对创作者的改进诉求表达（示意数据）。
              </p>
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#5c4033",
                }}
              >
                示例对象：已购「合同审查技能包 v2.1」关联创作者
              </p>
              <div className="dim-grid">
                {(
                  [
                    ["效率提升", "4.2", "综合耗时下降感知"],
                    ["UI 界面设计", "3.6", "可读性与一致性"],
                    ["架构清晰度", "4.5", "步骤与边界是否清楚"],
                    ["成本控制", "4.0", "调用与人工替代成本"],
                    ["创意新颖性", "3.9", "方法论与模板新意"],
                    ["上手难易度", "4.4", "说明与示例充分度"],
                    ["适用法律领域普适性", "4.1", "跨行业/法域适配"],
                    ["调用权威数据量", "4.4", "法规/案例等权威源覆盖与命中强度"],
                  ] as const
                ).map(([dn, ds, dt]) => (
                  <div key={dn} className="dim-tile">
                    <div className="dn">{dn}</div>
                    <div className="ds">{ds}</div>
                    <div className="dt">{dt}</div>
                  </div>
                ))}
              </div>
              <div className="suggest-grid">
                <div className="suggest-card">
                  <h4>Skills 设计针对性提升（使用侧）</h4>
                  优先补齐「UI 引导与空状态说明」；在「架构清晰度」维度增加一页式流程图与输入输出契约；对高频场景提供默认参数预设，巩固「效率提升」与「上手难易度」；要求输出中显式标注权威数据来源与引用路径，便于复核「调用权威数据量」。
                </div>
                <div className="suggest-card">
                  <h4>招聘建议</h4>
                  岗位 JD 建议突出「合同审查自动化 + 结构化交付」；面试题库侧重「成本控制与质量平衡」案例；对「适用法律领域普适性」偏低项，可配置行业顾问复试；对「调用权威数据量」偏低项，增加「法源核验与证据链」实操题。
                </div>
                <div className="suggest-card">
                  <h4>合作建议</h4>
                  适合与「架构清晰度高」的争议解决团队做打包联售；对「创意新颖性」强项可做内容共创；合作合同中建议约定调用上限与版本升级节奏，对冲「成本控制」波动；对「调用权威数据量」可约定权威库范围、更新频率与留痕审计条款。
                </div>
              </div>
            </div>
          </section>

          <section className="section" id="cli-jobs-publish">
            <div className="section-hd">岗位发布（对外）</div>
            <div className="section-bd">
              创建与编辑对外岗位信息、上下架、渠道展示开关、合规字段校验；与客户身份无关，创作者与客户共用同一套岗位编辑器与发布流程（权限在字段级收敛）。
            </div>
          </section>
          <section className="section" id="cli-jobs-apps">
            <div className="section-hd">收到投递（针对已发出的岗位）</div>
            <div className="section-bd">
              按岗位聚合简历与附件、初筛状态、邀约面试、标记不合适与归档；与「岗位数据」中的浏览、评论、投递统计联动。
            </div>
          </section>

          <section className="section" id="cli-profile">
            <div className="section-hd">个人资料</div>
            <div className="section-bd">
              与创作者侧字段同源；不包含 Skills 上架、收益结算、发出的试用邀请等供给端能力。岗位招聘为共有模块。
            </div>
          </section>
          <section className="section" id="cli-settings">
            <div className="section-hd">账号设置</div>
            <div className="section-bd">安全、通知、隐私、发票抬头等，与创作者共用组件库。</div>
          </section>
          <section className="section" id="cli-purchase">
            <div className="section-hd">已购与使用</div>
            <div className="section-bd">授权范围、版本、下载记录、绑定项目；无「上架与分成」视图。</div>
          </section>
          <section className="section" id="cli-msg">
            <div className="section-hd">留言与通知</div>
            <div className="section-bd">系统通知、审核结果、订单与风控提示聚合收件箱。</div>
          </section>
          <p className="foot">
            {mode === "app" ? "律植 · 客户工作台（与联调稿同构）" : "联调 React 实装 · 当前角色：客户"}
          </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
