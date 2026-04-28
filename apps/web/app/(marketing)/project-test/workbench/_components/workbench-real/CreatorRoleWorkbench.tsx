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

export function CreatorRoleWorkbench({
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
  const shell = getWorkbenchShellFixture("creator");
  const navGroups = navGroupsProp ?? shell.navGroups;
  const profile = profileProp ?? shell.profile;
  const showFullSpec = mode !== "app" || !pathname || pathname === "/creator";

  const topbar = useMemo(() => {
    if (mode !== "app" || !pathname) return shell.topbar;
    const r = tryResolveWorkbenchSectionTopbar(pathname);
    return r ?? shell.topbar;
  }, [mode, pathname, shell]);

  return (
    <div id={panelId} className={["role-panel", "app", isActive ? "active" : ""].filter(Boolean).join(" ")}>
      <aside className="sidebar" aria-label="创作者工作台导航">
        <WorkbenchLogo />
        <WorkbenchSideNav
          groups={navGroups}
          activeHash={activeHash}
          onNavigate={onNavigate}
          ariaLabel="创作者主导航"
          mode={mode}
          pathname={pathname}
          urlHash={urlHash}
        />
        <WorkbenchUserProfile profile={profile} />
      </aside>
      <main className="main">
        <WorkbenchTopbar topbar={topbar} homeHref="/creator" compact={mode === "app"} />
        <div className="content">
          {!showFullSpec && children ? (
            <div className="workbench-app-page-slot">{children}</div>
          ) : (
            <>
          <WorkbenchKpiOverviewSection sectionId={shell.overviewSectionId} items={shell.kpis} />

          <section className="section" id="cre-analytics">
            <div className="section-hd">经营与内容（示意）</div>
            <div className="section-bd">
              <div className="metric-dense-grid">
                <div className="metric-tile">
                  <div className="metric-head">
                    <span>浏览</span>
                    <span className="metric-kind">访问</span>
                  </div>
                  <div className="metric-number">8,920</div>
                  <div className="metric-trend-row">
                    <span className="metric-sub up">+16.7% 环比</span>
                    <WorkbenchSpark points="2,20 18,17 34,13 50,10 66,7 82,4 98,2" stroke={OK} />
                  </div>
                </div>
                <div className="metric-tile">
                  <div className="metric-head">
                    <span>点赞</span>
                    <span className="metric-kind">互动</span>
                  </div>
                  <div className="metric-number">1,346</div>
                  <div className="metric-trend-row">
                    <span className="metric-note">点赞率 15.1% · +1.2%</span>
                    <WorkbenchSpark points="2,15 22,14 42,13 62,12 82,11 98,10" stroke={OK} />
                  </div>
                </div>
                <div className="metric-tile">
                  <div className="metric-head">
                    <span>下载</span>
                    <span className="metric-kind">交付</span>
                  </div>
                  <div className="metric-number">624</div>
                  <div className="metric-trend-row">
                    <span className="metric-note">下载率 7.0% · −0.6%</span>
                    <WorkbenchSpark points="2,8 22,9 42,11 62,13 82,15 98,17" stroke={BAD} />
                  </div>
                </div>
                <div className="metric-tile">
                  <div className="metric-head">
                    <span>购买</span>
                    <span className="metric-kind">订单</span>
                  </div>
                  <div className="metric-number">126</div>
                  <div className="metric-trend-row">
                    <span className="metric-note">转化 20.2% · +2.0%</span>
                    <WorkbenchSpark points="2,18 20,15 38,12 56,9 74,6 92,4" stroke={OK} />
                  </div>
                </div>
              </div>
              <div className="dense-table">
                <div className="dense-row head">
                  <div>内容项</div>
                  <div>本期曝光</div>
                  <div>互动</div>
                  <div>趋势（环比与走势）</div>
                </div>
                <div className="dense-row">
                  <div>帖子：合同风险清单</div>
                  <div>5.2k</div>
                  <div>418</div>
                  <div className="trend-cell">
                    <span className="trend-pct up">+6.0%</span>
                    <WorkbenchSpark points="2,17 20,14 38,11 56,9 74,6 92,4" stroke={OK} />
                  </div>
                </div>
                <div className="dense-row">
                  <div>Skills：审查包 v2.1</div>
                  <div>3.1k</div>
                  <div>260</div>
                  <div className="trend-cell">
                    <span className="trend-pct up">+11.0%</span>
                    <WorkbenchSpark points="2,19 18,16 34,12 50,9 66,6 82,3 98,2" stroke={OK} />
                  </div>
                </div>
              </div>
              <div id="cre-analytics-jobs" style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: "#5c4033" }}>
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
                  <div>争议解决主办律师</div>
                  <div>4,560</div>
                  <div>38 / 56</div>
                  <div className="trend-cell">
                    <span className="trend-pct up">+9.3%</span>
                    <WorkbenchSpark points="2,19 20,16 40,12 60,9 80,5 98,3" stroke={OK} />
                  </div>
                </div>
                <div className="dense-row">
                  <div>合规顾问（兼职）</div>
                  <div>2,210</div>
                  <div>19 / 24</div>
                  <div className="trend-cell">
                    <span className="trend-pct down">−2.1%</span>
                    <WorkbenchSpark points="2,6 22,8 42,11 62,14 82,17 98,20" stroke={BAD} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section" id="cre-analytics-skills-eval">
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
                面向你在架 Skills：将用户评价、使用遥测与质检抽样映射到统一维度，定位短板并生成改版清单；同步输出招聘侧能力补强建议与对外合作打包策略（示意数据）。
              </p>
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#5c4033",
                }}
              >
                示例对象：在架「合同审查技能包 v2.1」
              </p>
              <div className="dim-grid">
                {(
                  [
                    ["效率提升", "4.3", "较 v2.0 +0.2"],
                    ["UI 界面设计", "3.5", "低于类目均值"],
                    ["架构清晰度", "4.6", "强项维持"],
                    ["成本控制", "4.1", "调用阶梯合理"],
                    ["创意新颖性", "4.0", "稳定"],
                    ["上手难易度", "4.2", "示例待扩充"],
                    ["适用法律领域普适性", "3.8", "制造业偏低"],
                    ["调用权威数据量", "4.0", "法规/案例等权威源覆盖与命中强度"],
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
                  <h4>Skills 设计针对性提升（供给侧）</h4>
                  v2.2 优先：重做引导页与模板选择器（拉升 UI 与上手）；补充「输入输出契约」与异常分支说明（巩固架构）；增加制造业专用附录或行业切换开关（拉升普适性）；扩充权威法源与案例库路由、命中日志与可解释引用，拉升「调用权威数据量」。
                </div>
                <div className="suggest-card">
                  <h4>招聘建议</h4>
                  若普适性与行业附录为短板，建议增补「行业顾问」兼职岗位或外包审读；JD 关键词与「成本控制、架构清晰度」高分维度对齐，降低培训成本；若「调用权威数据量」为短板，优先招「知识工程 / 法库对接」方向兼职。
                </div>
                <div className="suggest-card">
                  <h4>合作建议</h4>
                  以「架构清晰度 + 效率提升」为卖点寻求与企业法务系统对接；与「UI 与上手」强项团队做联名模板包；对制造业客户可捆绑咨询小时包，对冲普适性评分波动；对「调用权威数据量」可向数据方争取联合背书或白名单接口，写入 SLA。
                </div>
              </div>
            </div>
          </section>

          <div className="two-col">
            <section className="section" id="cre-studio">
              <div className="section-hd">工作画布与文件</div>
              <div className="section-bd">
                <div className="studio">
                  <div className="studio-col">
                    <div className="studio-hd">
                      <span>在架 Skills</span>
                    </div>
                    <div className="studio-bd">
                      审查包 v2.1（编辑中）
                      <br />
                      劳动包 v1.4
                    </div>
                  </div>
                  <div className="studio-col">
                    <div className="studio-hd">
                      <span>画布</span>
                    </div>
                    <div className="studio-bd">
                      <div className="studio-box">
                        与客户侧同构：材料、调用、审阅、导出；创作者多出版本与上架校验入口。
                      </div>
                    </div>
                  </div>
                  <div className="studio-col">
                    <div className="studio-hd">
                      <span>材料</span>
                    </div>
                    <div className="studio-bd">示例合同、证据包、客户上传区</div>
                  </div>
                </div>
              </div>
            </section>
            <section className="section">
              <div className="section-hd">协作四象限</div>
              <div className="section-bd">
                <div className="coop-grid">
                  <div className="coop-block" id="cre-coop-recv-c">
                    <div className="coop-block-hd">
                      <span>收到的合作邀请</span>
                      <span className="hint">3</span>
                    </div>
                    <ul className="todo">
                      <li>
                        <span>常年顾问意向</span>
                        <span className="status s1">待办</span>
                      </li>
                    </ul>
                  </div>
                  <div className="coop-block" id="cre-coop-sent-c">
                    <div className="coop-block-hd">
                      <span>发出的合作邀请</span>
                      <span className="hint">2</span>
                    </div>
                    <ul className="todo">
                      <li>
                        <span>已向企业发出联合方案</span>
                        <span className="status s1">待回复</span>
                      </li>
                    </ul>
                  </div>
                  <div className="coop-block" id="cre-coop-recv-t">
                    <div className="coop-block-hd">
                      <span>收到的试用邀请</span>
                      <span className="hint">2</span>
                    </div>
                    <p className="coop-block-desc">他人邀你试其已上架产品。</p>
                    <ul className="todo">
                      <li>
                        <span>王律师邀你试「材料包」</span>
                        <span className="status s1">待办</span>
                      </li>
                    </ul>
                  </div>
                  <div className="coop-block" id="cre-coop-sent-t">
                    <div className="coop-block-hd">
                      <span>发出的试用邀请</span>
                      <span className="hint">5</span>
                    </div>
                    <p className="coop-block-desc">你邀他人试你发布的产品。</p>
                    <ul className="todo">
                      <li>
                        <span>已向渠道发出试用批次</span>
                        <span className="status s1">跟进</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="section" id="cre-jobs-publish">
            <div className="section-hd">岗位发布（对外）</div>
            <div className="section-bd">
              与客户共用岗位发布与展示链路：草稿、发布、上下架、合规字段、曝光与转化看板入口。创作者可在经营视图中与 Skills 数据并列分析。
            </div>
          </section>
          <section className="section" id="cre-jobs-apps">
            <div className="section-hd">收到投递（针对已发出的岗位）</div>
            <div className="section-bd">
              与客户同一套投递处理流：按岗位聚合、筛选、邀约、归档；投递与岗位下的浏览、评论指标联动。
            </div>
          </section>
          <section className="section" id="cre-skills">
            <div className="section-hd">Skills 管理</div>
            <div className="section-bd">上架、版本、定价、下载包、授权策略；客户侧无此主导航。</div>
          </section>
          <section className="section" id="cre-trial">
            <div className="section-hd">试用管理</div>
            <div className="section-bd">
              配置与运营你主动发出的试用：规则、批次、配额、到期与转化；与「发出的试用邀请」衔接。
            </div>
          </section>
          <section className="section" id="cre-purchase">
            <div className="section-hd">已购与使用</div>
            <div className="section-bd">创作者亦可能购买他人 Skills：与客户同模块，权限按授权收敛。</div>
          </section>
          <section className="section" id="cre-profile">
            <div className="section-hd">个人资料</div>
            <div className="section-bd">营销与专业背书字段全开。岗位招聘为客户与创作者共有模块。</div>
          </section>
          <section className="section" id="cre-verify">
            <div className="section-hd">律师认证</div>
            <div className="section-bd">客户侧默认不展示主导航项，可在升级创作者后解锁。</div>
          </section>
          <section className="section" id="cre-settings">
            <div className="section-hd">账号设置</div>
            <div className="section-bd">含提现账户、税务与结算信息（示意）。</div>
          </section>
          <section className="section" id="cre-msg">
            <div className="section-hd">留言与通知</div>
            <div className="section-bd">审核、结算、风控、平台公告聚合。</div>
          </section>
          <p className="foot">
            {mode === "app" ? "律植 · 创作者工作台（与联调稿同构）" : "联调 React 实装 · 当前角色：创作者"}
          </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
