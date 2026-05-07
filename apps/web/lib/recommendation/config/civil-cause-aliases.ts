/**
 * Common user expressions mapped to standard civil cause labels.
 * Keep this list conservative to avoid over-mapping.
 */
export const CIVIL_CAUSE_ALIAS_TO_LABEL: Record<string, string> = {
  欠款纠纷: "民间借贷纠纷",
  借款纠纷: "民间借贷纠纷",
  货款纠纷: "买卖合同纠纷",
  拖欠货款纠纷: "买卖合同纠纷",
  合同欠款纠纷: "买卖合同纠纷",
  网购合同纠纷: "信息网络买卖合同纠纷",
  商标侵权纠纷: "侵害商标权纠纷",
  劳动赔偿纠纷: "追索劳动报酬纠纷",
  名誉被网上诽谤: "名誉权纠纷",
  网上诽谤: "名誉权纠纷",
  网络诽谤: "名誉权纠纷",
  交通事故: "机动车交通事故责任纠纷",
  车祸: "机动车交通事故责任纠纷",
  交通事故赔偿: "机动车交通事故责任纠纷",
};
