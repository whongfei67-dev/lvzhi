import fs from "node:fs";

import { CRIMINAL_CAUSE_ALIAS_TO_LABEL } from "../apps/web/lib/recommendation/config/criminal-cause-aliases";
import { CRIMINAL_CAUSE_LIBRARY } from "../apps/web/lib/recommendation/config/criminal-cause-library";

type ScenarioPack = {
  a: string;
  b: string;
  c: string;
  d: string;
  e: string;
};

const OUTPUT_HTML_PATH =
  "/Users/jinbaowang/Desktop/律植项目/律植（新）代码/apps/web/public/criminal-cause-mapping-scenarios-v1.html";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function hashSeed(input: string): number {
  let seed = 0;
  for (const ch of input) seed = (seed * 131 + ch.charCodeAt(0)) % 65535;
  return seed;
}

const CRIMINAL_KEYWORD_LEXICON = [
  "非法低价",
  "出让",
  "国有土地使用权",
  "监管",
  "渎职",
  "失职",
  "职守",
  "滥用",
  "职权",
  "裁判",
  "枉法",
  "私放",
  "在押",
  "放纵",
  "犯罪行为",
  "制售伪劣商品",
  "放行",
  "批准",
  "不解救",
  "被拐卖",
  "被绑架",
  "犯罪分子",
  "逃避",
  "处罚",
  "偷越国边境",
  "动植物",
  "检疫",
  "失职",
  "徇私舞弊",
  "人员",
  "出入境证件",
  "妇女",
  "儿童",
  "失职被骗",
  "违规制造",
  "医疗",
  "事故",
  "危险",
  "驾驶",
  "故意",
  "伤害",
  "诈骗",
  "盗窃",
  "抢劫",
  "抢夺",
  "贩卖",
  "运输",
  "制造",
  "毒品",
  "洗钱",
  "帮信",
  "猥亵",
  "强奸",
  "行贿",
  "受贿",
  "侵占",
  "挪用",
  "伪造",
  "变造",
  "销售",
  "枪支",
  "非法",
  "持有",
  "帮助",
  "组织",
  "领导",
  "利用",
  "聚众",
  "扰乱",
  "公共",
  "秩序",
  "妨害",
  "司法",
  "金融",
  "网络",
  "信息",
  "安全",
  "交通",
  "职务",
  "损毁",
  "名胜古迹",
  "窃取",
  "国有档案",
  "盗伐",
  "林木",
  "捕捞",
  "水产品",
  "采矿",
  "狩猎",
  "农用地",
  "滥伐",
  "固体废物",
  "传播",
  "催收",
  "债务",
  "代替",
  "考试",
  "尸体",
  "尸骨",
  "骨灰",
  "赌博",
  "获取",
  "秘密",
  "污染",
  "环境",
  "文物",
  "古迹",
  "编造",
  "抢夺",
];

function splitTokens(label: string): string[] {
  const cleaned = label
    .replaceAll("罪", "")
    .replaceAll("被拐卖、绑架妇女、儿童", "被拐卖 被绑架 妇女 儿童")
    .replaceAll("、", "")
    .replaceAll("（", "")
    .replaceAll("）", "")
    .replaceAll("(", "")
    .replaceAll(")", "")
    .trim();
  const keywords: string[] = [];
  let rest = cleaned;
  const lexicon = [...CRIMINAL_KEYWORD_LEXICON].sort((a, b) => b.length - a.length);
  for (const token of lexicon) {
    if (!rest.includes(token)) continue;
    if (!keywords.includes(token)) keywords.push(token);
    rest = rest.replace(token, " ");
    if (keywords.length >= 3) break;
  }
  const fallback = rest
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
  for (const item of fallback) {
    if (keywords.length >= 3) break;
    if (!keywords.includes(item)) keywords.push(item);
  }
  if (!keywords.length && cleaned.length >= 2) {
    keywords.push(cleaned);
  }
  return keywords.slice(0, 6);
}

type SemanticSplit = {
  structure: string;
  subject?: string;
  predicate?: string;
  adverbial?: string;
  object?: string;
  attributive?: string;
  keywords: string[];
  note?: string;
};

const SUBJECT_PREFIXES = [
  "国家机关工作人员",
  "司法工作人员",
  "国家工作人员",
  "国家机关",
  "医务人员",
  "监管人员",
  "公司、企业人员",
  "负有照护职责人员",
  "军人",
] as const;

const ADVERBIAL_MARKERS = [
  "失职被骗",
  "故意",
  "过失",
  "失职",
  "被骗",
  "玩忽职守",
  "滥用职权",
  "重大责任",
  "非法",
  "违规",
  "不解救",
  "不应公开",
] as const;

const VERB_CANDIDATES = [
  "签订、履行",
  "披露、报道",
  "放行",
  "批准",
  "出让",
  "监管",
  "放",
  "玩忽",
  "滥用",
  "裁判",
  "招收",
  "执行",
  "阻碍",
  "出售",
  "骗取",
  "破坏",
  "偷越",
  "运送",
  "打击报复",
  "处置",
  "劫夺",
  "拒绝",
  "诉讼",
  "倒卖",
  "盗掘",
  "掩饰",
  "隐瞒",
  "发放",
  "移交",
  "征收",
  "发售",
  "抵扣",
  "退税",
  "减刑",
  "假释",
  "执行",
  "损毁",
  "抢夺",
  "窃取",
  "盗伐",
  "捕捞",
  "采矿",
  "狩猎",
  "占用",
  "滥伐",
  "进口",
  "危害",
  "污染",
  "编造",
  "传播",
  "催收",
  "代替",
  "赌博",
  "获取",
  "毁坏",
  "侮辱",
  "盗窃",
  "侵入",
  "窃听",
  "窃照",
  "买卖",
  "邮寄",
  "储存",
  "持有",
  "出借",
  "出租",
  "丢失",
  "报告",
  "参加",
  "准备",
  "实施",
  "资助",
  "投敌",
  "分裂",
  "煽动",
  "颠覆",
  "伪造",
  "变造",
  "纵容",
  "传授",
  "盗用",
  "抽逃",
  "开拆",
  "隐匿",
  "毁弃",
  "损害",
  "走私",
  "劫持",
  "冲击",
  "斗殴",
  "淫乱",
  "开设",
  "顶替",
  "袭警",
  "滋事",
  "撞骗",
  "种植",
  "救援",
  "虐待",
  "改变",
  "逃离",
  "投降",
  "提供",
  "损坏",
  "穿戴",
  "残害",
  "掠夺",
  "谎报",
  "开拆",
  "侵害",
  "扩散",
  "买卖",
  "参加",
  "示威",
  "游行",
  "集会",
  "叛乱",
  "暴乱",
  "投降",
  "违抗",
  "造谣",
  "惑众",
  "自伤",
  "指使",
  "虚报",
  "破产",
  "诈骗",
  "受贿",
  "行贿",
  "牟利",
  "经营",
  "发行",
  "遗弃",
  "遗失",
  "肇事",
  "救治",
  "拒救",
  "开设",
  "吸收",
  "存款",
  "倒卖",
  "挪用",
  "侵占",
  "洗钱",
  "套现",
  "伪报",
  "逃汇",
  "骗购",
  "抗税",
  "骗税",
  "偷税",
  "逃税",
  "串通",
  "招标",
  "投标",
  "中标",
  "侵害",
  "侮辱",
  "虐待",
  "歧视",
  "诽谤",
  "诬告",
  "陷害",
  "办理",
  "帮助",
  "组织",
  "强迫",
  "引诱",
  "容留",
  "介绍",
  "防治",
  "泄露",
  "扰乱",
  "妨害",
  "解救",
  "绑架",
  "拐卖",
  "脱逃",
  "窝藏",
  "包庇",
  "制造",
  "销售",
  "运输",
  "贩卖",
  "签订",
  "履行",
  "披露",
  "报道",
  "放行",
  "批准",
  "出让",
  "监管",
  "放",
  "玩忽",
  "滥用",
  "裁判",
  "办理",
  "帮助",
  "泄露",
  "脱逃",
  "窝藏",
  "包庇",
] as const;

const ACTION_VERB_LEXICON = [...new Set(VERB_CANDIDATES)].sort((a, b) => b.length - a.length);
const PREFIX_ADVERBIALS = ["战时", "非法", "违法", "违规", "故意", "过失", "擅自", "拒不", "虚假"] as const;
const TAIL_COMPACT_PREDICATES = [
  "诈骗",
  "行贿",
  "受贿",
  "牟利",
  "经营",
  "发行",
  "破产",
  "逃税",
  "抗税",
  "洗钱",
  "逃汇",
  "盗窃",
  "抢劫",
  "抢夺",
  "侵占",
  "勒索",
  "敲诈",
  "挪用",
  "套现",
  "肇事",
  "救治",
  "违抗",
  "投降",
  "自伤",
  "造谣惑众",
  "造谣",
  "惑众",
].sort((a, b) => b.length - a.length);

const PURE_VERB_LABEL_WHITELIST = new Set(["脱逃"]);

const SPECIAL_SPLITS: Array<{ label: string; split: SemanticSplit }> = [
  {
    label: "非法引进、释放、丢弃外来入侵物种",
    split: {
      structure: "三谓语+状语+宾语",
      predicate: "引进/释放/丢弃",
      adverbial: "非法",
      object: "外来入侵物种",
      keywords: ["非法", "引进", "释放", "丢弃", "外来入侵物种"],
    },
  },
  {
    label: "包庇、纵容黑社会性质组织",
    split: {
      structure: "双谓语+宾语",
      predicate: "包庇/纵容",
      object: "黑社会性质组织",
      keywords: ["包庇", "纵容", "黑社会性质组织"],
    },
  },
  {
    label: "编造、故意传播虚假恐怖信息",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "编造/传播",
      adverbial: "故意",
      object: "虚假恐怖信息",
      keywords: ["编造", "故意", "传播", "虚假恐怖信息"],
    },
  },
  {
    label: "传授犯罪方法",
    split: {
      structure: "谓语+宾语",
      predicate: "传授",
      object: "犯罪方法",
      keywords: ["传授", "犯罪方法"],
    },
  },
  {
    label: "盗窃、侮辱、故意毁坏尸体、尸骨、骨灰",
    split: {
      structure: "三谓语+状语+宾语",
      predicate: "盗窃/侮辱/毁坏",
      adverbial: "故意",
      object: "尸体/尸骨/骨灰",
      keywords: ["盗窃", "侮辱", "故意", "毁坏", "尸体", "尸骨", "骨灰"],
    },
  },
  {
    label: "非法集会、游行、示威",
    split: {
      structure: "三谓语+状语+宾语",
      predicate: "集会/游行/示威",
      adverbial: "非法",
      object: "活动（省略）",
      keywords: ["非法", "集会", "游行", "示威"],
    },
  },
  {
    label: "非法利用信息网络",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "利用",
      adverbial: "非法",
      object: "信息网络",
      keywords: ["非法", "利用", "信息网络"],
    },
  },
  {
    label: "非法生产、销售专用间谍器材、窃听、窃照专用器材",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "生产/销售",
      adverbial: "非法",
      object: "专用间谍器材/窃听专用器材/窃照专用器材",
      keywords: ["非法", "生产", "销售", "专用间谍器材", "窃听专用器材", "窃照专用器材"],
    },
  },
  {
    label: "非法使用窃听、窃照专用器材",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "使用",
      adverbial: "非法",
      object: "窃听专用器材/窃照专用器材",
      keywords: ["非法", "使用", "窃听专用器材", "窃照专用器材"],
    },
  },
  {
    label: "非法携带武器、管制刀具、爆炸物参加集会、游行、示威",
    split: {
      structure: "双谓语+状语+宾语+定语",
      predicate: "携带/参加",
      adverbial: "非法",
      object: "集会/游行/示威活动",
      attributive: "武器/管制刀具/爆炸物（携带物）",
      keywords: ["非法", "携带", "武器", "管制刀具", "爆炸物", "参加", "集会", "游行", "示威"],
    },
  },
  {
    label: "使用虚假身份证件、盗用身份证件",
    split: {
      structure: "双谓语+宾语",
      predicate: "使用/盗用",
      object: "虚假身份证件/身份证件",
      keywords: ["使用", "盗用", "虚假身份证件", "身份证件"],
    },
  },
  {
    label: "引诱、教唆、欺骗他人吸毒",
    split: {
      structure: "三谓语+宾语",
      predicate: "引诱/教唆/欺骗",
      object: "他人吸毒",
      keywords: ["引诱", "教唆", "欺骗", "他人吸毒"],
    },
  },
  {
    label: "拒传、假传军令",
    split: {
      structure: "双谓语+宾语",
      predicate: "拒传/假传",
      object: "军令",
      keywords: ["拒传", "假传", "军令"],
    },
  },
  {
    label: "擅自出卖、转让军队房地产",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "出卖/转让",
      adverbial: "擅自",
      object: "军队房地产",
      keywords: ["擅自", "出卖", "转让", "军队房地产"],
    },
  },
  {
    label: "隐瞒、谎报军情",
    split: {
      structure: "双谓语+宾语",
      predicate: "隐瞒/谎报",
      object: "军情",
      keywords: ["隐瞒", "谎报", "军情"],
    },
  },
  {
    label: "虚假出资、抽逃出资",
    split: {
      structure: "双谓语+宾语",
      predicate: "虚假出资/抽逃出资",
      object: "出资义务",
      keywords: ["虚假出资", "抽逃出资", "出资义务"],
    },
  },
  {
    label: "对违法票据承兑、付款、保证",
    split: {
      structure: "三谓语+宾语+定语",
      predicate: "承兑/付款/保证",
      object: "票据行为",
      attributive: "违法票据（修饰票据行为）",
      keywords: ["承兑", "付款", "保证", "违法票据"],
    },
  },
  {
    label: "擅自发行股票、公司、企业债券",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "发行",
      adverbial: "擅自",
      object: "股票/公司债券/企业债券",
      keywords: ["擅自", "发行", "股票", "公司债券", "企业债券"],
    },
  },
  {
    label: "诱骗投资者买卖证券、期货合约",
    split: {
      structure: "双谓语+宾语+定语",
      predicate: "诱骗/买卖",
      object: "证券/期货合约",
      attributive: "投资者（买卖主体）",
      keywords: ["诱骗", "投资者", "买卖", "证券", "期货合约"],
    },
  },
  {
    label: "私自开拆、隐匿、毁弃邮件、电报",
    split: {
      structure: "三谓语+状语+宾语",
      predicate: "开拆/隐匿/毁弃",
      adverbial: "私自",
      object: "邮件/电报",
      keywords: ["私自", "开拆", "隐匿", "毁弃", "邮件", "电报"],
    },
  },
  {
    label: "武装叛乱、暴乱",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "叛乱/暴乱",
      adverbial: "武装",
      object: "国家政权秩序（省略）",
      keywords: ["武装", "叛乱", "暴乱"],
    },
  },
  {
    label: "操纵证券、期货市场",
    split: {
      structure: "谓语+宾语",
      predicate: "操纵",
      object: "证券市场/期货市场",
      keywords: ["操纵", "证券市场", "期货市场"],
    },
  },
  {
    label: "出版歧视、侮辱少数民族作品",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "出版",
      object: "作品",
      attributive: "歧视/侮辱少数民族（修饰作品）",
      keywords: ["出版", "歧视", "侮辱少数民族", "作品"],
    },
  },
  {
    label: "强制穿戴宣扬恐怖主义、极端主义服饰、标志",
    split: {
      structure: "谓语+状语+宾语+定语",
      predicate: "穿戴",
      adverbial: "强制",
      object: "服饰/标志",
      attributive: "宣扬恐怖主义/极端主义（修饰服饰、标志）",
      keywords: ["强制", "穿戴", "宣扬恐怖主义", "极端主义", "服饰", "标志"],
    },
  },
  {
    label: "高空抛物",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "抛物",
      adverbial: "高空",
      object: "物体",
      keywords: ["高空", "抛物", "物体"],
    },
  },
  {
    label: "故意延误投递邮件",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "投递",
      adverbial: "故意延误",
      object: "邮件",
      keywords: ["故意", "延误", "投递", "邮件"],
    },
  },
  {
    label: "聚众斗殴",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "斗殴",
      adverbial: "聚众",
      object: "斗殴行为",
      keywords: ["聚众", "斗殴", "斗殴行为"],
    },
  },
  {
    label: "聚众扰乱公共场所秩序、交通秩序",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "扰乱",
      adverbial: "聚众",
      object: "公共场所秩序/交通秩序",
      keywords: ["聚众", "扰乱", "公共场所秩序", "交通秩序"],
    },
  },
  {
    label: "聚众扰乱社会秩序",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "扰乱",
      adverbial: "聚众",
      object: "社会秩序",
      keywords: ["聚众", "扰乱", "社会秩序"],
    },
  },
  {
    label: "入境发展黑社会组织",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "发展",
      adverbial: "入境",
      object: "黑社会组织",
      keywords: ["入境", "发展", "黑社会组织"],
    },
  },
  {
    label: "提供侵入、非法控制计算机信息系统程序、工具",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "提供",
      object: "程序/工具",
      attributive: "侵入计算机信息系统/非法控制计算机信息系统（用途）",
      keywords: ["提供", "侵入", "非法控制", "计算机信息系统", "程序", "工具"],
    },
  },
  {
    label: "袭警",
    split: {
      structure: "谓语+宾语",
      predicate: "袭击",
      object: "警察",
      keywords: ["袭警", "袭击", "警察"],
    },
  },
  {
    label: "组织、利用会道门、邪教组织、利用迷信致人重伤、死亡",
    split: {
      structure: "双谓语+宾语+定语",
      predicate: "组织/利用",
      object: "会道门组织/邪教组织/迷信活动",
      attributive: "致人重伤/死亡（结果）",
      keywords: ["组织", "利用", "会道门", "邪教组织", "迷信", "致人重伤", "死亡"],
    },
  },
  {
    label: "组织参与国（境）外赌博",
    split: {
      structure: "双谓语+宾语",
      predicate: "组织/参与",
      object: "国（境）外赌博活动",
      keywords: ["组织", "参与", "国境外", "赌博活动"],
    },
  },
  {
    label: "采集、供应血液、制作、供应血液制品事故",
    split: {
      structure: "多谓语+宾语+定语",
      predicate: "采集/供应/制作/供应",
      object: "血液/血液制品",
      attributive: "事故（结果）",
      keywords: ["采集", "供应", "制作", "血液", "血液制品", "事故"],
    },
  },
  {
    label: "非法采集、供应血液、制作、供应血液制品",
    split: {
      structure: "多谓语+状语+宾语",
      predicate: "采集/供应/制作/供应",
      adverbial: "非法",
      object: "血液/血液制品",
      keywords: ["非法", "采集", "供应", "制作", "血液", "血液制品"],
    },
  },
  {
    label: "非法采集人类遗传资源、走私人类遗传资源材料",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "采集/走私",
      adverbial: "非法",
      object: "人类遗传资源/人类遗传资源材料",
      keywords: ["非法", "采集", "走私", "人类遗传资源", "人类遗传资源材料"],
    },
  },
  {
    label: "非法进行节育手术",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "进行",
      adverbial: "非法",
      object: "节育手术",
      keywords: ["非法", "进行", "节育手术"],
    },
  },
  {
    label: "非法行医",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "行医",
      adverbial: "非法",
      object: "医疗活动",
      keywords: ["非法", "行医", "医疗活动"],
    },
  },
  {
    label: "非法植入基因编辑、克隆胚胎",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "植入/克隆",
      adverbial: "非法",
      object: "基因编辑胚胎/胚胎",
      keywords: ["非法", "植入", "基因编辑", "克隆", "胚胎"],
    },
  },
  {
    label: "非法组织卖血",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "组织",
      adverbial: "非法",
      object: "卖血",
      keywords: ["非法", "组织", "卖血"],
    },
  },
  {
    label: "强迫卖血",
    split: {
      structure: "谓语+宾语",
      predicate: "强迫",
      object: "卖血",
      keywords: ["强迫", "卖血"],
    },
  },
  {
    label: "制作、复制、出版、贩卖、传播淫秽物品牟利",
    split: {
      structure: "多谓语+状语+宾语",
      predicate: "制作/复制/出版/贩卖/传播",
      adverbial: "牟利",
      object: "淫秽物品",
      keywords: ["制作", "复制", "出版", "贩卖", "传播", "淫秽物品", "牟利"],
    },
  },
  {
    label: "非法买卖、运输、携带、持有毒 品原植物种子、幼苗",
    split: {
      structure: "多谓语+状语+宾语",
      predicate: "买卖/运输/携带/持有",
      adverbial: "非法",
      object: "毒品原植物种子/幼苗",
      keywords: ["非法", "买卖", "运输", "携带", "持有", "毒品原植物种子", "幼苗"],
    },
  },
  {
    label: "非法生产、买卖、运输制毒物品、走私制毒物品",
    split: {
      structure: "多谓语+状语+宾语",
      predicate: "生产/买卖/运输/走私",
      adverbial: "非法",
      object: "制毒物品",
      keywords: ["非法", "生产", "买卖", "运输", "走私", "制毒物品"],
    },
  },
  {
    label: "投降",
    split: {
      structure: "谓语+宾语",
      predicate: "投降",
      object: "军事对抗对象（省略）",
      keywords: ["投降", "军事对抗对象"],
    },
  },
  {
    label: "违令作战消极",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "作战",
      adverbial: "违令/消极",
      object: "军事任务",
      keywords: ["违令", "作战", "消极", "军事任务"],
    },
  },
  {
    label: "背信运用受托财产",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "运用",
      adverbial: "背信",
      object: "受托财产",
      keywords: ["背信", "运用", "受托财产"],
    },
  },
  {
    label: "高利转贷",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "转贷",
      adverbial: "高利",
      object: "贷款",
      keywords: ["高利", "转贷", "贷款"],
    },
  },
  {
    label: "金融工作人员购买假币、以假币换取货币",
    split: {
      structure: "主语+双谓语+宾语",
      subject: "金融工作人员",
      predicate: "购买/换取",
      object: "假币/货币",
      keywords: ["金融工作人员", "购买", "假币", "换取", "货币"],
    },
  },
  {
    label: "利用未公开信息交易",
    split: {
      structure: "双谓语+宾语",
      predicate: "利用/交易",
      object: "未公开信息",
      keywords: ["利用", "交易", "未公开信息"],
    },
  },
  {
    label: "逃汇",
    split: {
      structure: "谓语+宾语",
      predicate: "逃汇",
      object: "外汇监管秩序",
      keywords: ["逃汇", "外汇监管秩序"],
    },
  },
  {
    label: "洗钱",
    split: {
      structure: "谓语+宾语",
      predicate: "洗钱",
      object: "犯罪所得资金",
      keywords: ["洗钱", "犯罪所得资金"],
    },
  },
  {
    label: "假冒注册商标",
    split: {
      structure: "谓语+宾语",
      predicate: "假冒",
      object: "注册商标",
      keywords: ["假冒", "注册商标"],
    },
  },
  {
    label: "假冒专利",
    split: {
      structure: "谓语+宾语",
      predicate: "假冒",
      object: "专利",
      keywords: ["假冒", "专利"],
    },
  },
  {
    label: "侵犯商业秘密",
    split: {
      structure: "谓语+宾语",
      predicate: "侵犯",
      object: "商业秘密",
      keywords: ["侵犯", "商业秘密"],
    },
  },
  {
    label: "侵犯著作权",
    split: {
      structure: "谓语+宾语",
      predicate: "侵犯",
      object: "著作权",
      keywords: ["侵犯", "著作权"],
    },
  },
  {
    label: "出具证明文件重大失实",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "出具",
      adverbial: "重大失实",
      object: "证明文件",
      keywords: ["出具", "证明文件", "重大失实"],
    },
  },
  {
    label: "逃避商检",
    split: {
      structure: "谓语+宾语",
      predicate: "逃避",
      object: "商检",
      keywords: ["逃避", "商检"],
    },
  },
  {
    label: "抗税",
    split: {
      structure: "谓语+宾语",
      predicate: "抗税",
      object: "税款征收",
      keywords: ["抗税", "税款征收"],
    },
  },
  {
    label: "逃避追缴欠税",
    split: {
      structure: "谓语+宾语",
      predicate: "逃避",
      object: "追缴欠税",
      keywords: ["逃避", "追缴欠税"],
    },
  },
  {
    label: "逃税",
    split: {
      structure: "谓语+宾语",
      predicate: "逃税",
      object: "纳税义务",
      keywords: ["逃税", "纳税义务"],
    },
  },
  {
    label: "虚开发票",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "开具",
      adverbial: "虚假",
      object: "发票",
      keywords: ["虚开", "发票", "虚假"],
    },
  },
  {
    label: "盗窃",
    split: {
      structure: "谓语+宾语",
      predicate: "盗窃",
      object: "财物",
      keywords: ["盗窃", "财物"],
    },
  },
  {
    label: "聚众哄抢",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "哄抢",
      adverbial: "聚众",
      object: "财物",
      keywords: ["聚众", "哄抢", "财物"],
    },
  },
  {
    label: "抢夺",
    split: {
      structure: "谓语+宾语",
      predicate: "抢夺",
      object: "财物",
      keywords: ["抢夺", "财物"],
    },
  },
  {
    label: "抢劫",
    split: {
      structure: "谓语+宾语",
      predicate: "抢劫",
      object: "财物",
      keywords: ["抢劫", "财物"],
    },
  },
  {
    label: "侵占",
    split: {
      structure: "谓语+宾语",
      predicate: "侵占",
      object: "财物",
      keywords: ["侵占", "财物"],
    },
  },
  {
    label: "诈骗",
    split: {
      structure: "谓语+宾语",
      predicate: "诈骗",
      object: "财物",
      keywords: ["诈骗", "财物"],
    },
  },
  {
    label: "绑架",
    split: {
      structure: "谓语+宾语",
      predicate: "绑架",
      object: "他人",
      keywords: ["绑架", "他人"],
    },
  },
  {
    label: "暴力干涉婚姻自由",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "干涉",
      adverbial: "暴力",
      object: "婚姻自由",
      keywords: ["暴力", "干涉", "婚姻自由"],
    },
  },
  {
    label: "暴力取证",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "取证",
      adverbial: "暴力",
      object: "证据",
      keywords: ["暴力", "取证", "证据"],
    },
  },
  {
    label: "非法剥夺公民宗教信仰自由",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "剥夺",
      adverbial: "非法",
      object: "公民宗教信仰自由",
      keywords: ["非法", "剥夺", "公民宗教信仰自由"],
    },
  },
  {
    label: "非法拘禁",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "拘禁",
      adverbial: "非法",
      object: "他人人身自由",
      keywords: ["非法", "拘禁", "他人人身自由"],
    },
  },
  {
    label: "非法搜查",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "搜查",
      adverbial: "非法",
      object: "他人住所/人身",
      keywords: ["非法", "搜查", "住所", "人身"],
    },
  },
  {
    label: "诽谤",
    split: {
      structure: "谓语+宾语",
      predicate: "诽谤",
      object: "他人名誉",
      keywords: ["诽谤", "他人名誉"],
    },
  },
  {
    label: "故意杀人",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "杀害",
      adverbial: "故意",
      object: "他人生命",
      keywords: ["故意", "杀害", "他人生命"],
    },
  },
  {
    label: "故意伤害",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "伤害",
      adverbial: "故意",
      object: "他人人身",
      keywords: ["故意", "伤害", "他人人身"],
    },
  },
  {
    label: "雇用童工从事危重劳动",
    split: {
      structure: "双谓语+宾语",
      predicate: "雇用/从事",
      object: "童工/危重劳动",
      keywords: ["雇用", "童工", "从事", "危重劳动"],
    },
  },
  {
    label: "拐骗儿童",
    split: {
      structure: "谓语+宾语",
      predicate: "拐骗",
      object: "儿童",
      keywords: ["拐骗", "儿童"],
    },
  },
  {
    label: "虐待",
    split: {
      structure: "谓语+宾语",
      predicate: "虐待",
      object: "被扶养人",
      keywords: ["虐待", "被扶养人"],
    },
  },
  {
    label: "强奸",
    split: {
      structure: "谓语+宾语",
      predicate: "强奸",
      object: "被害人",
      keywords: ["强奸", "被害人"],
    },
  },
  {
    label: "侵犯公民个人信息",
    split: {
      structure: "谓语+宾语",
      predicate: "侵犯",
      object: "公民个人信息",
      keywords: ["侵犯", "公民个人信息"],
    },
  },
  {
    label: "侵犯少数民族风俗习惯",
    split: {
      structure: "谓语+宾语",
      predicate: "侵犯",
      object: "少数民族风俗习惯",
      keywords: ["侵犯", "少数民族风俗习惯"],
    },
  },
  {
    label: "侵犯通信自由",
    split: {
      structure: "谓语+宾语",
      predicate: "侵犯",
      object: "通信自由",
      keywords: ["侵犯", "通信自由"],
    },
  },
  {
    label: "猥亵儿童",
    split: {
      structure: "谓语+宾语",
      predicate: "猥亵",
      object: "儿童",
      keywords: ["猥亵", "儿童"],
    },
  },
  {
    label: "侮辱",
    split: {
      structure: "谓语+宾语",
      predicate: "侮辱",
      object: "他人人格尊严",
      keywords: ["侮辱", "他人人格尊严"],
    },
  },
  {
    label: "刑讯逼供",
    split: {
      structure: "谓语+宾语",
      predicate: "刑讯逼供",
      object: "供述",
      keywords: ["刑讯逼供", "供述"],
    },
  },
  {
    label: "遗弃",
    split: {
      structure: "谓语+宾语",
      predicate: "遗弃",
      object: "被扶养人",
      keywords: ["遗弃", "被扶养人"],
    },
  },
  {
    label: "重婚",
    split: {
      structure: "谓语+宾语",
      predicate: "重婚",
      object: "婚姻制度",
      keywords: ["重婚", "婚姻制度"],
    },
  },
  {
    label: "巨额财产来源不明",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "持有",
      adverbial: "来源不明",
      object: "巨额财产",
      keywords: ["持有", "来源不明", "巨额财产"],
    },
  },
  {
    label: "私分罚没财物",
    split: {
      structure: "谓语+宾语",
      predicate: "私分",
      object: "罚没财物",
      keywords: ["私分", "罚没财物"],
    },
  },
  {
    label: "私分国有资产",
    split: {
      structure: "谓语+宾语",
      predicate: "私分",
      object: "国有资产",
      keywords: ["私分", "国有资产"],
    },
  },
  {
    label: "暴力危及飞行安全",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "危及",
      adverbial: "暴力",
      object: "飞行安全",
      keywords: ["暴力", "危及", "飞行安全"],
    },
  },
  {
    label: "爆炸",
    split: {
      structure: "谓语+宾语",
      predicate: "爆炸",
      object: "公共安全",
      keywords: ["爆炸", "公共安全"],
    },
  },
  {
    label: "大型群众性活动重大安全事故",
    split: {
      structure: "谓语+宾语",
      predicate: "引发",
      object: "大型群众性活动重大安全事故",
      keywords: ["引发", "大型群众性活动", "重大安全事故"],
    },
  },
  {
    label: "非法携带枪支、弹药、管制刀具、危险物品危及公共安全",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "携带/危及",
      adverbial: "非法",
      object: "枪支/弹药/管制刀具/危险物品/公共安全",
      keywords: ["非法", "携带", "危及", "枪支", "弹药", "管制刀具", "危险物品", "公共安全"],
    },
  },
  {
    label: "工程重大安全事故",
    split: {
      structure: "谓语+宾语",
      predicate: "引发",
      object: "工程重大安全事故",
      keywords: ["引发", "工程", "重大安全事故"],
    },
  },
  {
    label: "教育设施重大安全事故",
    split: {
      structure: "谓语+宾语",
      predicate: "引发",
      object: "教育设施重大安全事故",
      keywords: ["引发", "教育设施", "重大安全事故"],
    },
  },
  {
    label: "决水",
    split: {
      structure: "谓语+宾语",
      predicate: "决水",
      object: "公共安全",
      keywords: ["决水", "公共安全"],
    },
  },
  {
    label: "抢劫枪支、弹药、爆炸物、危险物质",
    split: {
      structure: "谓语+宾语",
      predicate: "抢劫",
      object: "枪支/弹药/爆炸物/危险物质",
      keywords: ["抢劫", "枪支", "弹药", "爆炸物", "危险物质"],
    },
  },
  {
    label: "失火",
    split: {
      structure: "谓语+宾语",
      predicate: "失火",
      object: "公共安全",
      keywords: ["失火", "公共安全"],
    },
  },
  {
    label: "铁路运营安全事故",
    split: {
      structure: "谓语+宾语",
      predicate: "引发",
      object: "铁路运营安全事故",
      keywords: ["引发", "铁路运营", "安全事故"],
    },
  },
  {
    label: "危险驾驶",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "驾驶",
      adverbial: "危险",
      object: "机动车",
      keywords: ["危险", "驾驶", "机动车"],
    },
  },
  {
    label: "危险作业",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "作业",
      adverbial: "危险",
      object: "生产作业活动",
      keywords: ["危险", "作业", "生产作业活动"],
    },
  },
  {
    label: "消防责任事故",
    split: {
      structure: "谓语+宾语",
      predicate: "引发",
      object: "消防责任事故",
      keywords: ["引发", "消防责任事故"],
    },
  },
  {
    label: "重大飞行事故",
    split: {
      structure: "谓语+宾语",
      predicate: "引发",
      object: "重大飞行事故",
      keywords: ["引发", "重大飞行事故"],
    },
  },
  {
    label: "重大劳动安全事故",
    split: {
      structure: "谓语+宾语",
      predicate: "引发",
      object: "重大劳动安全事故",
      keywords: ["引发", "重大劳动安全事故"],
    },
  },
  {
    label: "重大责任事故",
    split: {
      structure: "谓语+宾语",
      predicate: "引发",
      object: "重大责任事故",
      keywords: ["引发", "重大责任事故"],
    },
  },
  {
    label: "接送不合格兵员",
    split: {
      structure: "谓语+宾语",
      predicate: "接送",
      object: "不合格兵员",
      keywords: ["接送", "不合格兵员"],
    },
  },
  {
    label: "背叛国家",
    split: {
      structure: "谓语+宾语",
      predicate: "背叛",
      object: "国家",
      keywords: ["背叛", "国家"],
    },
  },
  {
    label: "间谍",
    split: {
      structure: "谓语+宾语",
      predicate: "从事间谍活动",
      object: "国家安全",
      keywords: ["间谍活动", "国家安全"],
    },
  },
  {
    label: "叛逃",
    split: {
      structure: "谓语+宾语",
      predicate: "叛逃",
      object: "国家利益",
      keywords: ["叛逃", "国家利益"],
    },
  },
  {
    label: "资敌",
    split: {
      structure: "谓语+宾语",
      predicate: "资助",
      object: "敌对方",
      keywords: ["资助", "敌对方"],
    },
  },
  {
    label: "盗窃、抢夺枪支、弹药、爆炸物、危险物质",
    split: {
      structure: "双谓语+宾语",
      predicate: "盗窃/抢夺",
      object: "枪支/弹药/爆炸物/危险物质",
      keywords: ["盗窃", "抢夺", "枪支", "弹药", "爆炸物", "危险物质"],
    },
  },
  {
    label: "丢失枪支不报",
    split: {
      structure: "双谓语+宾语",
      predicate: "丢失/不报",
      object: "枪支",
      keywords: ["丢失", "不报", "枪支"],
    },
  },
  {
    label: "放火",
    split: {
      structure: "谓语+宾语",
      predicate: "放火",
      object: "公共安全",
      keywords: ["放火", "公共安全"],
    },
  },
  {
    label: "非法出租、出借枪支",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "出租/出借",
      adverbial: "非法",
      object: "枪支",
      keywords: ["非法", "出租", "出借", "枪支"],
    },
  },
  {
    label: "非法制造、买卖、运输、储存危险物质",
    split: {
      structure: "多谓语+状语+宾语",
      predicate: "制造/买卖/运输/储存",
      adverbial: "非法",
      object: "危险物质",
      keywords: ["非法", "制造", "买卖", "运输", "储存", "危险物质"],
    },
  },
  {
    label: "非法制造、买卖、运输、邮寄、储存枪支、弹药、爆炸物",
    split: {
      structure: "多谓语+状语+宾语",
      predicate: "制造/买卖/运输/邮寄/储存",
      adverbial: "非法",
      object: "枪支/弹药/爆炸物",
      keywords: ["非法", "制造", "买卖", "运输", "邮寄", "储存", "枪支", "弹药", "爆炸物"],
    },
  },
  {
    label: "过失爆炸",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "爆炸",
      adverbial: "过失",
      object: "公共安全",
      keywords: ["过失", "爆炸", "公共安全"],
    },
  },
  {
    label: "过失决水",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "决水",
      adverbial: "过失",
      object: "公共安全",
      keywords: ["过失", "决水", "公共安全"],
    },
  },
  {
    label: "过失投放危险物质",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "投放",
      adverbial: "过失",
      object: "危险物质",
      keywords: ["过失", "投放", "危险物质"],
    },
  },
  {
    label: "过失以危险方法危害公共安全",
    split: {
      structure: "谓语+状语+宾语+定语",
      predicate: "危害",
      adverbial: "过失",
      object: "公共安全",
      attributive: "以危险方法（行为方式）",
      keywords: ["过失", "危害", "公共安全", "危险方法"],
    },
  },
  {
    label: "以危险方法危害公共安全",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "危害",
      object: "公共安全",
      attributive: "以危险方法（行为方式）",
      keywords: ["危害", "公共安全", "危险方法"],
    },
  },
  {
    label: "利用极端主义破坏法律实施",
    split: {
      structure: "双谓语+宾语+定语",
      predicate: "利用/破坏",
      object: "法律实施秩序",
      attributive: "极端主义（工具/手段）",
      keywords: ["利用", "极端主义", "破坏", "法律实施秩序"],
    },
  },
  {
    label: "违规制造、销售枪支",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "制造/销售",
      adverbial: "违规",
      object: "枪支",
      keywords: ["违规", "制造", "销售", "枪支"],
    },
  },
  {
    label: "组织、领导、参加恐怖组织",
    split: {
      structure: "三谓语+宾语",
      predicate: "组织/领导/参加",
      object: "恐怖组织",
      keywords: ["组织", "领导", "参加", "恐怖组织"],
    },
  },
  {
    label: "盗窃、抢夺武装部队公文、证件、印章",
    split: {
      structure: "双谓语+宾语",
      predicate: "盗窃/抢夺",
      object: "武装部队公文/证件/印章",
      keywords: ["盗窃", "抢夺", "武装部队公文", "证件", "印章"],
    },
  },
  {
    label: "投敌叛变",
    split: {
      structure: "双谓语+宾语",
      predicate: "投敌/叛变",
      object: "国家利益",
      keywords: ["投敌", "叛变", "国家利益"],
    },
  },
  {
    label: "资助危害国家安全犯罪活动",
    split: {
      structure: "谓语+宾语",
      predicate: "资助",
      object: "危害国家安全犯罪活动",
      keywords: ["资助", "危害国家安全犯罪活动"],
    },
  },
  {
    label: "冒充军人招摇撞骗",
    split: {
      structure: "双谓语+宾语+定语",
      predicate: "冒充/招摇撞骗",
      object: "军人身份",
      attributive: "以军人身份为幌子",
      keywords: ["冒充", "军人", "招摇撞骗"],
    },
  },
  {
    label: "伪造、变造、买卖武装部队公文、证件、印章",
    split: {
      structure: "三谓语+宾语",
      predicate: "伪造/变造/买卖",
      object: "武装部队公文/证件/印章",
      keywords: ["伪造", "变造", "买卖", "武装部队公文", "证件", "印章"],
    },
  },
  {
    label: "伪造、盗窃、买卖、非法提供、非法使用武装部队专用标志",
    split: {
      structure: "多谓语+状语+宾语",
      predicate: "伪造/盗窃/买卖/提供/使用",
      adverbial: "非法",
      object: "武装部队专用标志",
      keywords: ["伪造", "盗窃", "买卖", "非法", "提供", "使用", "武装部队专用标志"],
    },
  },
  {
    label: "战时故意提供虚假敌情",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "提供",
      adverbial: "战时/故意",
      object: "虚假敌情",
      keywords: ["战时", "故意", "提供", "虚假敌情"],
    },
  },
  {
    label: "战时窝藏逃离部队军人",
    split: {
      structure: "谓语+状语+宾语+定语",
      predicate: "窝藏",
      adverbial: "战时",
      object: "军人",
      attributive: "逃离部队（修饰军人）",
      keywords: ["战时", "窝藏", "逃离部队", "军人"],
    },
  },
  {
    label: "阻碍军人执行职务",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "阻碍",
      object: "军人",
      attributive: "执行职务（行为状态）",
      keywords: ["阻碍", "军人", "执行职务"],
    },
  },
  {
    label: "对非国家工作人员行贿",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "行贿",
      object: "非国家工作人员",
      attributive: "对非国家（对象限定）",
      keywords: ["行贿", "非国家工作人员"],
    },
  },
  {
    label: "非法向外国人出售、赠送珍贵文物",
    split: {
      structure: "双谓语+状语+宾语+定语",
      predicate: "出售/赠送",
      adverbial: "非法",
      object: "珍贵文物",
      attributive: "向外国人（对象）",
      keywords: ["非法", "向外国人", "出售", "赠送", "珍贵文物"],
    },
  },
  {
    label: "擅自出卖、转让国有档案",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "出卖/转让",
      adverbial: "擅自",
      object: "国有档案",
      keywords: ["擅自", "出卖", "转让", "国有档案"],
    },
  },
  {
    label: "非法采矿",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "采矿",
      adverbial: "非法",
      object: "矿产资源",
      keywords: ["非法", "采矿", "矿产资源"],
    },
  },
  {
    label: "非法猎捕、收购、运输、出售陆生野生动物",
    split: {
      structure: "多谓语+状语+宾语",
      predicate: "猎捕/收购/运输/出售",
      adverbial: "非法",
      object: "陆生野生动物",
      keywords: ["非法", "猎捕", "收购", "运输", "出售", "陆生野生动物"],
    },
  },
  {
    label: "非法收购、运输盗伐、滥伐的林木",
    split: {
      structure: "双谓语+状语+宾语+定语",
      predicate: "收购/运输",
      adverbial: "非法",
      object: "林木",
      attributive: "盗伐/滥伐（修饰林木）",
      keywords: ["非法", "收购", "运输", "盗伐", "滥伐", "林木"],
    },
  },
  {
    label: "非法狩猎",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "狩猎",
      adverbial: "非法",
      object: "野生动物资源",
      keywords: ["非法", "狩猎", "野生动物资源"],
    },
  },
  {
    label: "赌博",
    split: {
      structure: "谓语+宾语",
      predicate: "赌博",
      object: "赌资活动",
      keywords: ["赌博", "赌资活动"],
    },
  },
  {
    label: "非法生产、买卖警用装备",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "生产/买卖",
      adverbial: "非法",
      object: "警用装备",
      keywords: ["非法", "生产", "买卖", "警用装备"],
    },
  },
  {
    label: "医疗事故",
    split: {
      structure: "谓语+宾语",
      predicate: "造成",
      object: "医疗事故",
      keywords: ["医疗", "事故", "造成"],
    },
  },
  {
    label: "擅离、玩忽军事职守",
    split: {
      structure: "双谓语+宾语",
      predicate: "擅离/玩忽",
      object: "军事职守",
      keywords: ["擅离", "玩忽", "军事职守"],
    },
  },
  {
    label: "组织、领导、参加黑社会性质组织",
    split: {
      structure: "三谓语+宾语",
      predicate: "组织/领导/参加",
      object: "黑社会性质组织",
      keywords: ["组织", "领导", "参加", "黑社会性质组织"],
    },
  },
  {
    label: "非法出卖、转让武器装备",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "出卖/转让",
      adverbial: "非法",
      object: "武器装备",
      keywords: ["非法", "出卖", "转让", "武器装备"],
    },
  },
  {
    label: "为境外窃取、剌探、收买、非法提供军事秘密",
    split: {
      structure: "多谓语+状语+宾语+定语",
      predicate: "窃取/刺探/收买/提供",
      adverbial: "非法",
      object: "军事秘密",
      attributive: "为境外（目的）",
      keywords: ["为境外", "窃取", "刺探", "收买", "非法", "提供", "军事秘密"],
    },
  },
  {
    label: "非法转让、倒卖土地使用权",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "转让/倒卖",
      adverbial: "非法",
      object: "土地使用权",
      keywords: ["非法", "转让", "倒卖", "土地使用权"],
    },
  },
  {
    label: "出售、购买、运输假币",
    split: {
      structure: "三谓语+宾语",
      predicate: "出售/购买/运输",
      object: "假币",
      keywords: ["出售", "购买", "运输", "假币"],
    },
  },
  {
    label: "窃取、收买、非法提供信用卡信息",
    split: {
      structure: "三谓语+状语+宾语",
      predicate: "窃取/收买/提供",
      adverbial: "非法",
      object: "信用卡信息",
      keywords: ["窃取", "收买", "非法", "提供", "信用卡信息"],
    },
  },
  {
    label: "违法运用资金",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "运用",
      adverbial: "违法",
      object: "资金",
      keywords: ["违法", "运用", "资金"],
    },
  },
  {
    label: "违规出具金融票证",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "出具",
      adverbial: "违规",
      object: "金融票证",
      keywords: ["违规", "出具", "金融票证"],
    },
  },
  {
    label: "伪造、变造、转让金融机构经营许可证、批准文件",
    split: {
      structure: "三谓语+宾语",
      predicate: "伪造/变造/转让",
      object: "金融机构经营许可证/批准文件",
      keywords: ["伪造", "变造", "转让", "金融机构经营许可证", "批准文件"],
    },
  },
  {
    label: "非法制造、销售非法制造的注册商标标识",
    split: {
      structure: "双谓语+状语+宾语+定语",
      predicate: "制造/销售",
      adverbial: "非法",
      object: "注册商标标识",
      attributive: "非法制造（修饰标识）",
      keywords: ["非法", "制造", "销售", "注册商标标识"],
    },
  },
  {
    label: "对外国公职人员、国际公共组织官员行贿",
    split: {
      structure: "谓语+宾语",
      predicate: "行贿",
      object: "外国公职人员/国际公共组织官员",
      keywords: ["行贿", "外国公职人员", "国际公共组织官员"],
    },
  },
  {
    label: "国有公司、企业、事业单位人员滥用职权",
    split: {
      structure: "主语+谓语+宾语",
      subject: "国有公司/企业/事业单位人员",
      predicate: "滥用",
      object: "职权",
      keywords: ["国有公司", "企业", "事业单位人员", "滥用", "职权"],
    },
  },
  {
    label: "国有公司、企业、事业单位人员失职",
    split: {
      structure: "主语+谓语+状语+宾语",
      subject: "国有公司/企业/事业单位人员",
      predicate: "履职",
      adverbial: "失职",
      object: "管理职责",
      keywords: ["国有公司", "企业", "事业单位人员", "失职", "履职"],
    },
  },
  {
    label: "欺诈发行证券",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "发行",
      adverbial: "欺诈",
      object: "证券",
      keywords: ["欺诈", "发行", "证券"],
    },
  },
  {
    label: "违规披露、不披露重要信息",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "披露/不披露",
      adverbial: "违规",
      object: "重要信息",
      keywords: ["违规", "披露", "不披露", "重要信息"],
    },
  },
  {
    label: "徇私舞弊低价折股、出售国有资产",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "折股/出售",
      adverbial: "徇私舞弊/低价",
      object: "国有资产",
      keywords: ["徇私舞弊", "低价", "折股", "出售", "国有资产"],
    },
  },
  {
    label: "持有、使用假币",
    split: {
      structure: "双谓语+宾语",
      predicate: "持有/使用",
      object: "假币",
      keywords: ["持有", "使用", "假币"],
    },
  },
  {
    label: "非法吸收公众存款",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "吸收",
      adverbial: "非法",
      object: "公众存款",
      keywords: ["非法", "吸收", "公众存款"],
    },
  },
  {
    label: "内幕交易、泄露内幕信息",
    split: {
      structure: "双谓语+宾语",
      predicate: "交易/泄露",
      object: "内幕信息",
      keywords: ["内幕交易", "泄露", "内幕信息"],
    },
  },
  {
    label: "擅自设立金融机构",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "设立",
      adverbial: "擅自",
      object: "金融机构",
      keywords: ["擅自", "设立", "金融机构"],
    },
  },
  {
    label: "违法发放贷款",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "发放",
      adverbial: "违法",
      object: "贷款",
      keywords: ["违法", "发放", "贷款"],
    },
  },
  {
    label: "吸收客户资金不入账",
    split: {
      structure: "双谓语+宾语",
      predicate: "吸收/不入账",
      object: "客户资金",
      keywords: ["吸收", "客户资金", "不入账"],
    },
  },
  {
    label: "为境外窃取、刺探、收买、非法提供商业秘密",
    split: {
      structure: "多谓语+状语+宾语+定语",
      predicate: "窃取/刺探/收买/提供",
      adverbial: "非法",
      object: "商业秘密",
      attributive: "为境外（目的）",
      keywords: ["为境外", "窃取", "刺探", "收买", "非法", "提供", "商业秘密"],
    },
  },
  {
    label: "强迫交易",
    split: {
      structure: "谓语+宾语",
      predicate: "强迫",
      object: "交易",
      keywords: ["强迫", "交易"],
    },
  },
  {
    label: "组织、领导传销活动",
    split: {
      structure: "双谓语+宾语",
      predicate: "组织/领导",
      object: "传销活动",
      keywords: ["组织", "领导", "传销活动"],
    },
  },
  {
    label: "生产、销售、提供假药",
    split: {
      structure: "三谓语+宾语",
      predicate: "生产/销售/提供",
      object: "假药",
      keywords: ["生产", "销售", "提供", "假药"],
    },
  },
  {
    label: "生产、销售、提供劣药",
    split: {
      structure: "三谓语+宾语",
      predicate: "生产/销售/提供",
      object: "劣药",
      keywords: ["生产", "销售", "提供", "劣药"],
    },
  },
  {
    label: "生产、销售不符合安全标准的产品",
    split: {
      structure: "双谓语+宾语",
      predicate: "生产/销售",
      object: "不符合安全标准的产品",
      keywords: ["生产", "销售", "不符合安全标准", "产品"],
    },
  },
  {
    label: "生产、销售不符合安全标准的食品",
    split: {
      structure: "双谓语+宾语",
      predicate: "生产/销售",
      object: "不符合安全标准的食品",
      keywords: ["生产", "销售", "不符合安全标准", "食品"],
    },
  },
  {
    label: "生产、销售不符合标准的医用器材",
    split: {
      structure: "双谓语+宾语",
      predicate: "生产/销售",
      object: "不符合标准的医用器材",
      keywords: ["生产", "销售", "不符合标准", "医用器材"],
    },
  },
  {
    label: "生产、销售不符合卫生标准的化妆品",
    split: {
      structure: "双谓语+宾语",
      predicate: "生产/销售",
      object: "不符合卫生标准的化妆品",
      keywords: ["生产", "销售", "不符合卫生标准", "化妆品"],
    },
  },
  {
    label: "生产、销售伪劣产品",
    split: {
      structure: "双谓语+宾语",
      predicate: "生产/销售",
      object: "伪劣产品",
      keywords: ["生产", "销售", "伪劣产品"],
    },
  },
  {
    label: "生产、销售伪劣农药、兽药、化肥、种子",
    split: {
      structure: "双谓语+宾语",
      predicate: "生产/销售",
      object: "伪劣农药/兽药/化肥/种子",
      keywords: ["生产", "销售", "伪劣农药", "兽药", "化肥", "种子"],
    },
  },
  {
    label: "生产、销售有毒、有害食品",
    split: {
      structure: "双谓语+宾语",
      predicate: "生产/销售",
      object: "有毒有害食品",
      keywords: ["生产", "销售", "有毒", "有害", "食品"],
    },
  },
  {
    label: "非法购买增值税专用发票、购买伪造的增值税专用发票",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "购买/购买",
      adverbial: "非法",
      object: "增值税专用发票/伪造的增值税专用发票",
      keywords: ["非法", "购买", "增值税专用发票", "伪造发票"],
    },
  },
  {
    label: "虚开增值税专用发票、用于骗取出口退税、抵扣税款发票",
    split: {
      structure: "三谓语+宾语+定语",
      predicate: "虚开/骗取/抵扣",
      object: "增值税专用发票/出口退税/税款发票",
      attributive: "用于（目的）",
      keywords: ["虚开", "增值税专用发票", "骗取", "出口退税", "抵扣税款发票"],
    },
  },
  {
    label: "报复陷害",
    split: {
      structure: "双谓语+宾语",
      predicate: "报复/陷害",
      object: "他人",
      keywords: ["报复", "陷害", "他人"],
    },
  },
  {
    label: "收买被拐卖的妇女、儿童",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "收买",
      object: "妇女/儿童",
      attributive: "被拐卖（修饰妇女、儿童）",
      keywords: ["收买", "被拐卖", "妇女", "儿童"],
    },
  },
  {
    label: "强令、组织他人违章冒险作业",
    split: {
      structure: "双谓语+宾语",
      predicate: "强令/组织",
      object: "他人违章冒险作业",
      keywords: ["强令", "组织", "他人", "违章冒险作业"],
    },
  },
  {
    label: "投放危险物质",
    split: {
      structure: "谓语+宾语",
      predicate: "投放",
      object: "危险物质",
      keywords: ["投放", "危险物质"],
    },
  },
  {
    label: "宣扬恐怖主义、极端主义、煽动实施恐怖活动",
    split: {
      structure: "双谓语+宾语+定语",
      predicate: "宣扬/煽动实施",
      object: "恐怖活动",
      attributive: "恐怖主义/极端主义（意识形态内容）",
      keywords: ["宣扬", "恐怖主义", "极端主义", "煽动实施", "恐怖活动"],
    },
  },
  {
    label: "准备实施恐怖活动",
    split: {
      structure: "双谓语+宾语",
      predicate: "准备/实施",
      object: "恐怖活动",
      keywords: ["准备", "实施", "恐怖活动"],
    },
  },
  {
    label: "非法生产、买卖武装部队制式服装",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "生产/买卖",
      adverbial: "非法",
      object: "武装部队制式服装",
      keywords: ["非法", "生产", "买卖", "武装部队制式服装"],
    },
  },
  {
    label: "雇用逃离部队军人",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "雇用",
      object: "军人",
      attributive: "逃离部队（修饰军人）",
      keywords: ["雇用", "逃离部队", "军人"],
    },
  },
  {
    label: "聚众冲击军事禁区",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "冲击",
      adverbial: "聚众",
      object: "军事禁区",
      keywords: ["聚众", "冲击", "军事禁区"],
    },
  },
  {
    label: "聚众扰乱军事管理区秩序",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "扰乱",
      adverbial: "聚众",
      object: "军事管理区秩序",
      keywords: ["聚众", "扰乱", "军事管理区秩序"],
    },
  },
  {
    label: "战时拒绝、故意延误军事订货",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "拒绝/延误",
      adverbial: "战时/故意",
      object: "军事订货",
      keywords: ["战时", "拒绝", "故意", "延误", "军事订货"],
    },
  },
  {
    label: "战时拒绝、逃避服役",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "拒绝/逃避",
      adverbial: "战时",
      object: "服役",
      keywords: ["战时", "拒绝", "逃避", "服役"],
    },
  },
  {
    label: "战时拒绝、逃避征召、军事训练",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "拒绝/逃避",
      adverbial: "战时",
      object: "征召/军事训练",
      keywords: ["战时", "拒绝", "逃避", "征召", "军事训练"],
    },
  },
  {
    label: "战时拒绝军事征收、征用",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "拒绝",
      adverbial: "战时",
      object: "军事征收/征用",
      keywords: ["战时", "拒绝", "军事征收", "征用"],
    },
  },
  {
    label: "战时造谣扰乱军心",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "造谣/扰乱",
      adverbial: "战时",
      object: "军心",
      keywords: ["战时", "造谣", "扰乱", "军心"],
    },
  },
  {
    label: "为境外窃取、剌探、收买、非法提供国家秘密、情报",
    split: {
      structure: "多谓语+状语+宾语+定语",
      predicate: "窃取/剌探/收买/提供",
      adverbial: "非法",
      object: "国家秘密/情报",
      attributive: "为境外（目的）",
      keywords: ["为境外", "窃取", "剌探", "收买", "非法", "提供", "国家秘密", "情报"],
    },
  },
  {
    label: "非法制造、出售非法制造的发票",
    split: {
      structure: "双谓语+状语+宾语+定语",
      predicate: "制造/出售",
      adverbial: "非法",
      object: "发票",
      attributive: "非法制造（修饰发票）",
      keywords: ["非法", "制造", "出售", "发票"],
    },
  },
  {
    label: "非法制造、出售非法制造的用于骗取出口退税、抵扣税款发票",
    split: {
      structure: "双谓语+状语+宾语+定语",
      predicate: "制造/出售",
      adverbial: "非法",
      object: "用于骗取出口退税/抵扣税款发票",
      attributive: "非法制造（修饰发票）",
      keywords: ["非法", "制造", "出售", "骗取出口退税", "抵扣税款发票"],
    },
  },
  {
    label: "强制猥亵、侮辱",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "猥亵/侮辱",
      adverbial: "强制",
      object: "被害人",
      keywords: ["强制", "猥亵", "侮辱", "被害人"],
    },
  },
  {
    label: "组织残疾人、儿童乞讨",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "组织",
      object: "乞讨活动",
      attributive: "残疾人/儿童（被组织对象）",
      keywords: ["组织", "残疾人", "儿童", "乞讨活动"],
    },
  },
  {
    label: "不报、谎报安全事故",
    split: {
      structure: "双谓语+宾语",
      predicate: "不报/谎报",
      object: "安全事故",
      keywords: ["不报", "谎报", "安全事故"],
    },
  },
  {
    label: "非法持有、私藏枪支、弹药",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "持有/私藏",
      adverbial: "非法",
      object: "枪支/弹药",
      keywords: ["非法", "持有", "私藏", "枪支", "弹药"],
    },
  },
  {
    label: "窝藏、包庇",
    split: {
      structure: "双谓语+宾语",
      predicate: "窝藏/包庇",
      object: "犯罪分子（省略）",
      keywords: ["窝藏", "包庇", "犯罪分子"],
    },
  },
  {
    label: "不解救被拐卖、绑架妇女、儿童",
    split: {
      structure: "谓语+状语+宾语+定语",
      predicate: "解救",
      adverbial: "不",
      attributive: "被拐卖/被绑架",
      object: "妇女/儿童",
      keywords: ["不解救", "被拐卖", "被绑架", "妇女", "儿童"],
    },
  },
  {
    label: "办理偷越国（边）境人员出入境证件",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "办理",
      object: "人员/出入境证件",
      attributive: "偷越国边境（修饰人员）",
      keywords: ["办理", "偷越国边境", "人员", "出入境证件"],
    },
  },
  {
    label: "动植物检疫失职",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "检疫",
      adverbial: "失职",
      object: "动植物",
      keywords: ["动植物", "检疫", "失职"],
    },
  },
  {
    label: "动植物检疫徇私舞弊",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "检疫",
      adverbial: "徇私舞弊",
      object: "动植物",
      keywords: ["动植物", "检疫", "徇私舞弊"],
    },
  },
  {
    label: "办理偷越国边境人员出入境证件",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "办理",
      object: "人员/出入境证件",
      attributive: "偷越国边境（修饰人员）",
      keywords: ["办理", "偷越国边境", "人员", "出入境证件"],
    },
  },
  {
    label: "国家机关工作人员签订、履行合同失职被骗",
    split: {
      structure: "主语+谓语+状语+宾语",
      subject: "国家机关工作人员",
      predicate: "签订、履行",
      adverbial: "失职被骗",
      object: "合同",
      keywords: ["国家机关工作人员", "签订", "履行", "合同", "失职被骗"],
    },
  },
  {
    label: "披露、报道不应公开的案件信息",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "披露、报道",
      object: "案件信息",
      attributive: "不应公开",
      keywords: ["披露", "报道", "不应公开", "案件信息"],
    },
  },
  {
    label: "招收公务员、学生徇私舞弊",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "招收",
      adverbial: "徇私舞弊",
      object: "公务员、学生",
      keywords: ["招收", "徇私舞弊", "公务员", "学生"],
    },
  },
  {
    label: "执行判决、裁定滥用职权",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "执行",
      adverbial: "滥用职权",
      object: "判决、裁定",
      keywords: ["执行", "滥用职权", "判决", "裁定"],
    },
  },
  {
    label: "执行判决、裁定失职",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "执行",
      adverbial: "失职",
      object: "判决、裁定",
      keywords: ["执行", "失职", "判决", "裁定"],
    },
  },
  {
    label: "阻碍解救被拐卖、绑架妇女、儿童",
    split: {
      structure: "谓语+状语+宾语+定语",
      predicate: "解救",
      adverbial: "阻碍",
      attributive: "被拐卖/被绑架",
      object: "妇女/儿童",
      keywords: ["阻碍", "解救", "被拐卖", "被绑架", "妇女", "儿童"],
    },
  },
  {
    label: "出售出入境证件",
    split: {
      structure: "谓语+宾语",
      predicate: "出售",
      object: "出入境证件",
      keywords: ["出售", "出入境证件"],
    },
  },
  {
    label: "骗取出境证件",
    split: {
      structure: "谓语+宾语",
      predicate: "骗取",
      object: "出境证件",
      keywords: ["骗取", "出境证件"],
    },
  },
  {
    label: "破坏界碑、界桩",
    split: {
      structure: "谓语+宾语",
      predicate: "破坏",
      object: "界碑、界桩",
      keywords: ["破坏", "界碑", "界桩"],
    },
  },
  {
    label: "破坏永久性测量标志",
    split: {
      structure: "谓语+宾语",
      predicate: "破坏",
      object: "永久性测量标志",
      keywords: ["破坏", "永久性测量标志"],
    },
  },
  {
    label: "提供伪造、变造的出入境证件",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "提供",
      object: "出入境证件",
      attributive: "伪造、变造",
      keywords: ["提供", "伪造", "变造", "出入境证件"],
    },
  },
  {
    label: "偷越国（边）境",
    split: {
      structure: "谓语+宾语",
      predicate: "偷越",
      object: "国边境",
      keywords: ["偷越", "国边境"],
    },
  },
  {
    label: "运送他人偷越国（边）境",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "运送",
      object: "他人",
      attributive: "偷越国边境（修饰他人）",
      keywords: ["运送", "他人", "偷越国边境"],
    },
  },
  {
    label: "组织他人偷越国（边）境",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "组织",
      object: "他人",
      attributive: "偷越国边境（修饰他人）",
      keywords: ["组织", "他人", "偷越国边境"],
    },
  },
  {
    label: "帮助毁灭、伪造证据",
    split: {
      structure: "谓语+宾语",
      predicate: "帮助",
      object: "毁灭、伪造证据",
      keywords: ["帮助", "毁灭", "伪造", "证据"],
    },
  },
  {
    label: "暴动越狱",
    split: {
      structure: "谓语+状语",
      predicate: "越狱",
      adverbial: "暴动",
      keywords: ["暴动", "越狱"],
    },
  },
  {
    label: "辩护人、诉讼代理人毁灭证据、伪造证据、妨害作证",
    split: {
      structure: "主语+谓语+宾语",
      subject: "辩护人、诉讼代理人",
      predicate: "毁灭/伪造/妨害",
      object: "证据/作证",
      keywords: ["辩护人", "诉讼代理人", "毁灭证据", "伪造证据", "妨害作证"],
    },
  },
  {
    label: "打击报复证人",
    split: {
      structure: "谓语+宾语",
      predicate: "打击报复",
      object: "证人",
      keywords: ["打击报复", "证人"],
    },
  },
  {
    label: "非法处置查封、扣押、冻结的财产",
    split: {
      structure: "谓语+状语+宾语+定语",
      predicate: "处置",
      adverbial: "非法",
      object: "财产",
      attributive: "查封、扣押、冻结",
      keywords: ["非法", "处置", "查封", "扣押", "冻结", "财产"],
    },
  },
  {
    label: "劫夺被押解人员",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "劫夺",
      object: "人员",
      attributive: "被押解",
      keywords: ["劫夺", "被押解", "人员"],
    },
  },
  {
    label: "拒不执行判决、裁定",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "执行",
      adverbial: "拒不",
      object: "判决、裁定",
      keywords: ["拒不", "执行", "判决", "裁定"],
    },
  },
  {
    label: "拒绝提供间谍犯罪、恐怖主义犯罪、极端主义犯罪证据",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "提供",
      adverbial: "拒绝",
      object: "间谍犯罪、恐怖主义犯罪、极端主义犯罪证据",
      keywords: ["拒绝", "提供", "间谍犯罪", "恐怖主义犯罪", "极端主义犯罪", "证据"],
    },
  },
  {
    label: "聚众持械劫狱",
    split: {
      structure: "谓语+状语",
      predicate: "劫狱",
      adverbial: "聚众持械",
      keywords: ["聚众持械", "劫狱"],
    },
  },
  {
    label: "破坏监管秩序",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "破坏",
      object: "秩序",
      attributive: "监管",
      keywords: ["破坏", "监管", "秩序"],
    },
  },
  {
    label: "伪证",
    split: {
      structure: "谓语+宾语",
      predicate: "伪",
      object: "证言（省略）",
      keywords: ["伪证", "证言"],
    },
  },
  {
    label: "失职造成珍贵文物损毁、流失",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "造成",
      adverbial: "失职",
      object: "珍贵文物损毁、流失",
      keywords: ["失职", "造成", "珍贵文物", "损毁", "流失"],
    },
  },
  {
    label: "枉法仲裁",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "仲裁",
      adverbial: "枉法",
      object: "案件（省略）",
      keywords: ["枉法", "仲裁", "案件"],
    },
  },
  {
    label: "违法发放林木采伐许可证",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "发放",
      adverbial: "违法",
      object: "林木采伐许可证",
      keywords: ["违法", "发放", "林木采伐许可证"],
    },
  },
  {
    label: "违法提供出口退税凭证",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "提供",
      adverbial: "违法",
      object: "出口退税凭证",
      keywords: ["违法", "提供", "出口退税凭证"],
    },
  },
  {
    label: "徇私枉法",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "枉法处理",
      adverbial: "徇私",
      object: "案件（省略）",
      keywords: ["徇私", "枉法", "案件"],
    },
  },
  {
    label: "徇私舞弊不移交刑事案件",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "移交",
      adverbial: "徇私舞弊/不",
      object: "刑事案件",
      keywords: ["徇私舞弊", "不移交", "刑事案件"],
    },
  },
  {
    label: "徇私舞弊不征、少征税款",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "征收",
      adverbial: "徇私舞弊/不征/少征",
      object: "税款",
      keywords: ["徇私舞弊", "不征", "少征", "税款"],
    },
  },
  {
    label: "徇私舞弊发售发票、抵扣税款、出口退税",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "发售/抵扣/退税",
      adverbial: "徇私舞弊",
      object: "发票/税款/出口退税事项",
      keywords: ["徇私舞弊", "发售发票", "抵扣税款", "出口退税"],
    },
  },
  {
    label: "徇私舞弊减刑、假释、暂予监外执行",
    split: {
      structure: "谓语+状语+宾语",
      predicate: "减刑/假释/暂予监外执行",
      adverbial: "徇私舞弊",
      object: "在押人员（省略）",
      keywords: ["徇私舞弊", "减刑", "假释", "暂予监外执行"],
    },
  },
  {
    label: "虚假诉讼",
    split: {
      structure: "谓语+宾语+定语",
      predicate: "诉讼",
      object: "诉讼行为",
      attributive: "虚假",
      keywords: ["虚假", "诉讼", "诉讼行为"],
    },
  },
  {
    label: "掩饰、隐瞒犯罪所得、犯罪所得收益",
    split: {
      structure: "双谓语+宾语",
      predicate: "掩饰/隐瞒",
      object: "犯罪所得/犯罪所得收益",
      keywords: ["掩饰", "隐瞒", "犯罪所得", "犯罪所得收益"],
    },
  },
  {
    label: "倒卖文物",
    split: {
      structure: "谓语+宾语",
      predicate: "倒卖",
      object: "文物",
      keywords: ["倒卖", "文物"],
    },
  },
  {
    label: "盗掘古人类化石、古脊椎动物化石",
    split: {
      structure: "谓语+宾语",
      predicate: "盗掘",
      object: "古人类化石/古脊椎动物化石",
      keywords: ["盗掘", "古人类化石", "古脊椎动物化石"],
    },
  },
  {
    label: "盗掘古文化遗址、古墓葬",
    split: {
      structure: "谓语+宾语",
      predicate: "盗掘",
      object: "古文化遗址/古墓葬",
      keywords: ["盗掘", "古文化遗址", "古墓葬"],
    },
  },
  {
    label: "非法出售、私赠文物藏品",
    split: {
      structure: "双谓语+状语+宾语",
      predicate: "出售/私赠",
      adverbial: "非法",
      object: "文物藏品",
      keywords: ["非法", "出售", "私赠", "文物藏品"],
    },
  },
];

function stripCrimeSuffix(label: string): string {
  return label.replace(/罪$/g, "").trim();
}

function parseVerbObject(core: string): { predicate?: string; object?: string } {
  for (const v of VERB_CANDIDATES) {
    if (core.startsWith(v)) {
      const object = core.slice(v.length).trim();
      return { predicate: v, object: object || undefined };
    }
  }
  for (const v of VERB_CANDIDATES) {
    if (core.endsWith(v)) {
      const object = core.slice(0, core.length - v.length).trim();
      return { predicate: v, object: object || undefined };
    }
  }
  for (const v of VERB_CANDIDATES) {
    const idx = core.indexOf(v);
    if (idx > 0 && idx < core.length - v.length) {
      const left = core.slice(0, idx).trim();
      const right = core.slice(idx + v.length).trim();
      const object = [left, right].filter(Boolean).join(" ");
      return { predicate: v, object: object || undefined };
    }
  }
  return { predicate: core, object: undefined };
}

function predicateHasAction(predicate: string | undefined): boolean {
  if (!predicate) return false;
  const parts = predicate.split(/[\/、]/).map((item) => item.trim()).filter(Boolean);
  return parts.some((part) => ACTION_VERB_LEXICON.some((verb) => part === verb || part.includes(verb)));
}

function extractPredicatesInOrder(text: string): string[] {
  const entries: Array<{ verb: string; idx: number }> = [];
  for (const verb of ACTION_VERB_LEXICON) {
    const idx = text.indexOf(verb);
    if (idx >= 0) entries.push({ verb, idx });
  }
  entries.sort((a, b) => a.idx - b.idx || b.verb.length - a.verb.length);
  const picked: string[] = [];
  const usedRanges: Array<{ start: number; end: number }> = [];
  for (const entry of entries) {
    const start = entry.idx;
    const end = entry.idx + entry.verb.length;
    const overlap = usedRanges.some((r) => !(end <= r.start || start >= r.end));
    if (overlap) continue;
    if (!picked.includes(entry.verb)) picked.push(entry.verb);
    usedRanges.push({ start, end });
  }
  return picked;
}

function deriveObjectFromRaw(
  rawNormalized: string,
  subject: string | undefined,
  adverbial: string | undefined,
  predicates: string[],
): string | undefined {
  let rest = rawNormalized;
  if (subject) rest = rest.replace(subject.replace(/[、，,\s]/g, ""), "");
  if (adverbial) rest = rest.replace(adverbial.replace(/[、，,\s]/g, ""), "");
  for (const p of predicates) {
    rest = rest.replace(p.replace(/[、，,\s]/g, ""), " ");
  }
  rest = rest.replace(/[、，,\s]+/g, " ").trim();
  if (!rest) return undefined;
  return rest;
}

function pickFallbackObjectFromKeywords(
  keywords: string[],
  predicate: string | undefined,
  adverbial: string | undefined,
): string | undefined {
  const p = predicate ?? "";
  const a = adverbial ?? "";
  const candidates = keywords.filter((kw) => !p.includes(kw) && !a.includes(kw));
  if (!candidates.length) return undefined;
  return candidates.join("/");
}

function applyCompactTailSplit(rawNormalized: string, split: Omit<SemanticSplit, "structure">): void {
  const currentPredicateParts = (split.predicate ?? "")
    .split(/[\/、]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (currentPredicateParts.length >= 2) return;
  const hasFallbackObject = !split.object || split.object === "相关对象（回填）" || split.object === "待复核对象";
  if (!hasFallbackObject) return;
  for (const pred of TAIL_COMPACT_PREDICATES) {
    if (!rawNormalized.endsWith(pred)) continue;
    const object = rawNormalized.slice(0, rawNormalized.length - pred.length).trim();
    if (!object) continue;
    split.predicate = pred;
    split.object = object;
    return;
  }
}

function splitAdverbialFromObjectCandidate(candidate: string): {
  object: string | undefined;
  adverbial: string | undefined;
} {
  const text = candidate.trim();
  if (!text) return { object: undefined, adverbial: undefined };
  const orderedAdverbials = [...ADVERBIAL_MARKERS].sort((a, b) => b.length - a.length);
  for (const adv of orderedAdverbials) {
    if (text === adv) return { object: undefined, adverbial: adv };
    if (text.startsWith(adv)) {
      const object = text.slice(adv.length).trim();
      return { object: object || undefined, adverbial: adv };
    }
    if (text.endsWith(adv)) {
      const object = text.slice(0, text.length - adv.length).trim();
      return { object: object || undefined, adverbial: adv };
    }
    const idx = text.indexOf(adv);
    if (idx > 0) {
      const left = text.slice(0, idx).trim();
      const right = text.slice(idx + adv.length).trim();
      const object = [left, right].filter(Boolean).join(" ");
      return { object: object || undefined, adverbial: adv };
    }
  }
  return { object: text, adverbial: undefined };
}

function inferStructureByParts(split: Omit<SemanticSplit, "structure" | "keywords"> & { keywords: string[] }): string {
  const hasSubject = Boolean(split.subject);
  const hasPredicate = Boolean(split.predicate);
  const hasAdverbial = Boolean(split.adverbial);
  const hasObject = Boolean(split.object);
  const hasAttributive = Boolean(split.attributive);
  if (hasSubject && hasPredicate && hasAdverbial && hasObject) return "主语+谓语+状语+宾语";
  if (hasPredicate && hasObject && hasAttributive) return "谓语+宾语+定语";
  if (hasPredicate && hasAdverbial && hasObject && hasAttributive) return "谓语+状语+宾语+定语";
  if (hasPredicate && hasAdverbial && hasObject) return "谓语+状语+宾语";
  if (hasPredicate && hasObject) return "谓语+宾语";
  if (hasPredicate) return "纯谓语";
  return "待人工复核";
}

function semanticSplitCrimeLabel(label: string): SemanticSplit {
  const raw = stripCrimeSuffix(label);
  const rawNormalized = raw.replace(/[、，,\s]/g, "").replace(/[（(]边[）)]/g, "边");
  const keywords = splitTokens(label);

  const normalizeLabelForSpecialMatch = (text: string): string =>
    stripCrimeSuffix(text)
      .replace(/[、，,\s]/g, "")
      .replace(/[（(]边[）)]/g, "边")
      .replaceAll("剌", "刺");

  const special =
    SPECIAL_SPLITS.find((item) => item.label === raw) ??
    SPECIAL_SPLITS.find((item) => normalizeLabelForSpecialMatch(item.label) === normalizeLabelForSpecialMatch(raw));
  if (special) return { ...special.split, keywords: special.split.keywords.length ? special.split.keywords : keywords };

  // Pattern: X监管渎职/失职/徇私舞弊
  const supervisionMatch = rawNormalized.match(/^(.+?)监管(渎职|失职|徇私舞弊)$/);
  if (supervisionMatch) {
    const objectMap: Record<string, string> = {
      食品药品: "食品/药品",
      动植物: "动植物",
      环境: "环境",
    };
    const object = objectMap[supervisionMatch[1]] ?? supervisionMatch[1];
    return {
      structure: "谓语+状语+宾语",
      predicate: "监管",
      adverbial: supervisionMatch[2],
      object,
      keywords: [object, "监管", supervisionMatch[2]],
    };
  }

  // Pattern: 商检失职 / 商检徇私舞弊
  const commodityInspectMatch = rawNormalized.match(/^(商检)(失职|徇私舞弊)$/);
  if (commodityInspectMatch) {
    return {
      structure: "谓语+状语",
      predicate: "商检",
      adverbial: commodityInspectMatch[2],
      keywords: ["商检", commodityInspectMatch[2]],
      note: "该罪名常见省略宾语，按“谓语+状语”展示。",
    };
  }

  // Pattern: 私放在押人员
  const releaseDetaineeMatch = rawNormalized.match(/^私放(.+)$/);
  if (releaseDetaineeMatch) {
    const objText = releaseDetaineeMatch[1];
    if (objText.includes("人员")) {
      const prefix = objText.replace("人员", "").trim();
      return {
        structure: "谓语+状语+宾语+定语",
        predicate: "放",
        adverbial: "私",
        object: "人员",
        attributive: prefix || "在押（修饰人员）",
        keywords: ["私放", prefix || "在押", "人员"],
      };
    }
    return {
      structure: "谓语+状语+宾语",
      predicate: "放",
      adverbial: "私",
      object: objText,
      keywords: ["私放", objText],
    };
  }

  if (rawNormalized === "玩忽职守") {
    return {
      structure: "谓语+宾语",
      predicate: "玩忽",
      object: "职守",
      keywords: ["玩忽", "职守"],
    };
  }

  // Pattern: 滥用X职权
  const abuseAuthorityMatch = rawNormalized.match(/^滥用(.+)职权$/);
  if (abuseAuthorityMatch) {
    const attr = abuseAuthorityMatch[1] === "管理公司证券" ? "管理公司、证券（修饰职权）" : `${abuseAuthorityMatch[1]}（修饰职权）`;
    return {
      structure: "谓语+宾语+定语",
      predicate: "滥用",
      object: "职权",
      attributive: attr,
      keywords: ["滥用", abuseAuthorityMatch[1], "职权"],
    };
  }

  // Pattern: 民事、行政枉法裁判
  const wrongfulJudgmentMatch = rawNormalized.match(/^(.+?)枉法裁判$/);
  if (wrongfulJudgmentMatch) {
    const attr = wrongfulJudgmentMatch[1] === "民事行政" ? "民事、行政（修饰案件）" : `${wrongfulJudgmentMatch[1]}（修饰案件）`;
    return {
      structure: "谓语+状语+宾语+定语",
      predicate: "裁判",
      adverbial: "枉法",
      object: "案件",
      attributive: attr,
      keywords: [wrongfulJudgmentMatch[1], "枉法", "裁判", "案件"],
    };
  }

  // Pattern: 非法低价出让国有土地使用权
  if (raw === "非法低价出让国有土地使用权") {
    return {
      structure: "谓语+状语+宾语",
      predicate: "出让",
      adverbial: "非法低价",
      object: "国有土地使用权",
      keywords: ["非法低价", "出让", "国有土地使用权"],
    };
  }

  // Pattern: 放纵 + X + 犯罪行为
  // e.g. 放纵制售伪劣商品犯罪行为
  const indulgeCrimeBehaviorMatch = raw.match(/^(放纵)(.+)(犯罪行为)$/);
  if (indulgeCrimeBehaviorMatch) {
    return {
      structure: "谓语+宾语+定语",
      predicate: indulgeCrimeBehaviorMatch[1],
      object: indulgeCrimeBehaviorMatch[3],
      attributive: `${indulgeCrimeBehaviorMatch[2]}（修饰犯罪行为）`,
      keywords: [indulgeCrimeBehaviorMatch[1], indulgeCrimeBehaviorMatch[2], indulgeCrimeBehaviorMatch[3]],
    };
  }

  if ((raw.startsWith("动植物检疫") || raw.includes("动植物检疫")) && raw.endsWith("失职")) {
    return {
      structure: "谓语+状语+宾语",
      predicate: "检疫",
      adverbial: "失职",
      object: "动植物",
      keywords: ["动植物", "检疫", "失职"],
    };
  }
  if ((raw.startsWith("动植物检疫") || raw.includes("动植物检疫")) && raw.endsWith("徇私舞弊")) {
    return {
      structure: "谓语+状语+宾语",
      predicate: "检疫",
      adverbial: "徇私舞弊",
      object: "动植物",
      keywords: ["动植物", "检疫", "徇私舞弊"],
    };
  }

  if (raw === "脱逃" || raw === "窝藏" || raw === "包庇") {
    return {
      structure: "纯谓语",
      predicate: raw,
      keywords,
    };
  }

  if (rawNormalized === "受贿") {
    return {
      structure: "谓语+宾语",
      predicate: "受贿",
      object: "财物",
      keywords: ["受贿", "财物"],
    };
  }
  if (rawNormalized === "贪污") {
    return {
      structure: "谓语+宾语",
      predicate: "贪污",
      object: "公共财物",
      keywords: ["贪污", "公共财物"],
    };
  }
  if (rawNormalized === "行贿") {
    return {
      structure: "谓语+宾语",
      predicate: "行贿",
      object: "财物",
      keywords: ["行贿", "财物"],
    };
  }

  const result: Omit<SemanticSplit, "structure"> = {
    subject: undefined,
    predicate: undefined,
    adverbial: undefined,
    object: undefined,
    attributive: undefined,
    keywords,
    note: undefined,
  };

  const subject = SUBJECT_PREFIXES.find((prefix) => raw.startsWith(prefix));
  let rest = raw;
  if (subject) {
    result.subject = subject;
    rest = raw.slice(subject.length).trim();
  }

  const attrMatch = rest.match(/^(.+?)((?:不应公开|被拐卖|被绑架|非法|违规).+?)的(.+)$/);
  if (attrMatch) {
    result.predicate = attrMatch[1].trim();
    result.attributive = attrMatch[2].trim();
    result.object = attrMatch[3].trim();
  }

  if (!result.predicate) {
    const { predicate, object } = parseVerbObject(rest);
    result.predicate = predicate;
    if (object) {
      const normalizedObject = object.replace(/\s+/g, " ").trim();
      const split = splitAdverbialFromObjectCandidate(normalizedObject);
      result.object = split.object;
      if (!result.adverbial && split.adverbial) result.adverbial = split.adverbial;
    }
  }

  // Prefer predicate+object first: when object includes "人员出入境证件" style,
  // split into object core + attributive that modifies the person noun.
  if (result.object?.includes("人员") && result.object.includes("出入境证件")) {
    const idx = result.object.indexOf("人员");
    const prefix = result.object.slice(0, idx).trim();
    const suffix = result.object.slice(idx + "人员".length).trim();
    if (prefix) {
      result.attributive = `${prefix}（修饰人员）`;
      result.object = suffix ? `人员/${suffix}` : "人员";
    }
  }

  // Generic pattern: <predicate> + <attributive> + 人员
  // e.g. 放行偷越国边境人员 / 批准偷越国边境人员...
  if (result.object?.endsWith("人员") && !result.attributive) {
    const prefix = result.object.slice(0, result.object.length - "人员".length).trim();
    if (prefix) {
      result.attributive = `${prefix}（修饰人员）`;
      result.object = "人员";
    }
  }

  // If object is still empty, try deriving from predicate suffix.
  // Example: "办理偷越国边境人员出入境证件" => predicate=办理, object=偷越国边境人员出入境证件
  if (result.predicate && !result.object && rest.startsWith(result.predicate)) {
    const derivedObject = rest.slice(result.predicate.length).trim();
    if (derivedObject) {
      const split = splitAdverbialFromObjectCandidate(derivedObject);
      result.object = split.object;
      if (!result.adverbial && split.adverbial) result.adverbial = split.adverbial;
    }
  }

  if (result.object && !result.attributive) {
    if (result.object.includes("法庭秩序")) {
      result.attributive = "法庭";
      result.object = "秩序";
    } else if (result.object.includes("案件信息") && rest.includes("不应公开")) {
      result.attributive = "不应公开";
      result.object = "案件信息";
    } else if (result.object.includes("妇女、儿童") && rest.includes("被拐卖")) {
      result.attributive = "被拐卖/被绑架";
      result.object = "妇女/儿童";
    }
  }

  // If we already found predicate but object is empty, try to force object extraction
  // from remaining text or semantic keywords, so "纯谓语" is only used by whitelist labels.
  if (result.predicate && !result.object) {
    let candidate = rest;
    if (candidate.startsWith(result.predicate)) candidate = candidate.slice(result.predicate.length).trim();
    if (candidate.endsWith(result.predicate)) candidate = candidate.slice(0, candidate.length - result.predicate.length).trim();
    if (candidate) {
      const split = splitAdverbialFromObjectCandidate(candidate);
      result.object = split.object;
      if (!result.adverbial && split.adverbial) result.adverbial = split.adverbial;
    }
    if (!result.object) {
      const fallbackObject = pickFallbackObjectFromKeywords(keywords, result.predicate, result.adverbial);
      if (fallbackObject) {
        result.object = fallbackObject;
        result.note = "宾语由关键词回填，建议人工复核。";
      }
    }
  }

  // Enforce predicate-first: predicate must come from action lexicon.
  // If not, re-detect predicate from raw and derive object from residual text.
  const rawActionPreds = extractPredicatesInOrder(rawNormalized);
  if (!predicateHasAction(result.predicate) && rawActionPreds.length) {
    result.predicate = rawActionPreds.join("/");
  }
  // For chained actions like "A、B、C + 宾语", prefer multi-predicate output.
  if (raw.includes("、")) {
    const currentPredCount = (result.predicate ?? "")
      .split(/[\/、]/)
      .map((item) => item.trim())
      .filter(Boolean).length;
    if (rawActionPreds.length >= 2 && (currentPredCount < 2 || (result.object ?? "").startsWith("、"))) {
      result.predicate = rawActionPreds.slice(0, 3).join("/");
    }
  }
  if (result.predicate && (!result.object || result.object === "待复核对象")) {
    const predParts = result.predicate.split(/[\/、]/).map((item) => item.trim()).filter(Boolean);
    const derived = deriveObjectFromRaw(rawNormalized, result.subject, result.adverbial, predParts);
    if (derived) result.object = derived;
  }
  if (result.object) {
    result.object = result.object.replace(/^、+/, "").trim();
  }
  if (!result.adverbial) {
    const matchedPrefix = PREFIX_ADVERBIALS.find((prefix) => raw.startsWith(prefix));
    if (matchedPrefix) result.adverbial = matchedPrefix;
  }
  if (result.adverbial) {
    const adv = result.adverbial;
    if (result.predicate?.startsWith(adv) && result.predicate.length > adv.length) {
      result.predicate = result.predicate.slice(adv.length);
    }
    if (result.object?.startsWith(adv) && result.object.length > adv.length) {
      result.object = result.object.slice(adv.length).trim();
    }
  }
  applyCompactTailSplit(rawNormalized, result);

  let structure = inferStructureByParts(result);
  if (structure === "纯谓语" && !PURE_VERB_LABEL_WHITELIST.has(raw)) {
    if (!result.object) {
      const fallbackObject = pickFallbackObjectFromKeywords(keywords, result.predicate, result.adverbial);
      result.object = fallbackObject || "相关对象（回填）";
    }
    structure = "谓语+宾语";
    result.note = result.note ?? "按规则优先保证“谓语+宾语”，宾语建议人工复核。";
  }
  return {
    structure,
    subject: result.subject,
    predicate: result.predicate,
    adverbial: result.adverbial,
    object: result.object,
    attributive: result.attributive,
    keywords,
    note: structure === "待人工复核" ? "当前规则无法稳定识别，建议人工复核。" : undefined,
  };
}

function formatSemanticSplit(label: string): string {
  const parsed = semanticSplitCrimeLabel(label);
  const parts: string[] = [];
  parts.push(`结构=${parsed.structure}`);
  if (parsed.subject) parts.push(`主语=${parsed.subject}`);
  if (parsed.predicate) parts.push(`谓语=${parsed.predicate}`);
  if (parsed.adverbial) parts.push(`状语=${parsed.adverbial}`);
  if (parsed.object) parts.push(`宾语=${parsed.object}`);
  if (parsed.attributive) parts.push(`定语=${parsed.attributive}`);
  parts.push(`关键词=${parsed.keywords.join("/")}`);
  if (parsed.note) parts.push(`备注=${parsed.note}`);
  return parts.join("；");
}

function splitComponentKeywords(value: string | undefined): string[] {
  if (!value) return [];
  const normalized = value
    .replace(/（边）/g, "边")
    .replace(/（修饰[^）]*）/g, "")
    .replace(/[、，,]/g, "/");
  return normalized
    .split("/")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function collectOrderedKeywords(parsed: SemanticSplit, fallback: string[]): string[] {
  const ordered = [
    ...splitComponentKeywords(parsed.subject),
    ...splitComponentKeywords(parsed.predicate),
    ...splitComponentKeywords(parsed.adverbial),
    ...splitComponentKeywords(parsed.attributive),
    ...splitComponentKeywords(parsed.object),
  ];
  const uniq: string[] = [];
  for (const token of ordered) {
    if (!uniq.includes(token)) uniq.push(token);
  }
  if (uniq.length) return uniq;
  return [...new Set(fallback)];
}

const SYNONYM_MAP: Record<string, string> = {
  放行: "放过",
  批准: "许可",
  办理: "经办",
  泄露: "透露",
  滥用: "越权使用",
  徇私舞弊: "以权谋私",
  帮助: "协助",
  检疫: "检验检控",
  动植物: "生物检验对象",
  失职: "未尽职责",
  故意: "主观明知",
  国家秘密: "涉密信息",
  组织: "策划召集",
  强迫: "胁迫",
  引诱: "诱导",
  容留: "收留",
  介绍: "牵线安排",
  诈骗: "骗取财物",
  盗窃: "窃取财物",
  抢劫: "暴力劫取",
  偷越国边境: "非法越境",
  人员: "相关人员",
  出入境证件: "通关证件",
  妇女: "女性对象",
  儿童: "未成年人",
  被拐卖: "被贩运",
  被绑架: "被强行控制",
  窃取: "偷拿",
  刺探: "打听套取",
  剌探: "打听套取",
  收买: "花钱打点",
  提供: "交出去",
  披露: "往外说",
  报道: "对外发布",
  伪造: "做假",
  变造: "改造作假",
  买卖: "私下交易",
  运输: "转运",
  出售: "卖出去",
  转让: "转手",
  使用: "拿来用",
  持有: "留在手里",
  赌博: "下注赌钱",
  行贿: "送钱打点",
  受贿: "收钱办事",
  贪污: "侵吞公款",
  危害: "造成风险",
  扰乱: "搅乱",
  组织: "拉人安排",
  领导: "带头操盘",
  参加: "跟着参与",
  非法: "不合规",
  违法: "踩红线",
  违规: "违规定",
  故意: "明知还做",
  过失: "疏忽导致",
  军人: "部队人员",
  国家秘密: "涉密内容",
  情报: "敏感线索",
  恐怖活动: "暴恐行为",
  解救: "救出来",
  不: "没去做",
  窝藏: "藏匿包庇",
  战时: "战备阶段",
  武器: "武装器具",
  弹药: "子弹弹药",
  爆炸物: "爆炸性物品",
  危险物质: "高危物品",
  资金: "钱款",
  运用: "调动使用",
  操纵: "人为操控",
  证券市场: "股票市场",
  期货市场: "期货交易盘",
  出卖: "卖掉",
  转让: "转手给别人",
  走私: "偷运过关",
  交易: "做交易",
  伪证: "作假证词",
  判决: "法院判项",
  裁定: "法院裁定结果",
};

function toSynonym(token: string): string {
  const direct = SYNONYM_MAP[token];
  if (direct && direct !== token) return direct;

  // Fallback: produce colloquial paraphrase without "类似/接近" wording.
  const MORPHEME_MAP: Record<string, string> = {
    非法: "不合规",
    违法: "踩红线",
    违规: "不按规定",
    故意: "明知还做",
    过失: "疏忽导致",
    组织: "拉人安排",
    领导: "带头操盘",
    参加: "跟着参与",
    提供: "交出去",
    危害: "造成风险",
    扰乱: "搅乱",
    破坏: "弄坏",
    证据: "关键材料",
    信息: "内容",
    文件: "文书材料",
    财物: "钱和东西",
    职权: "手里权力",
    合同: "约定文件",
    军人: "部队人员",
    国家: "国家层面",
    安全: "安全秩序",
    活动: "相关行为",
  };
  let morphed = token;
  for (const [k, v] of Object.entries(MORPHEME_MAP)) {
    if (!morphed.includes(k)) continue;
    morphed = morphed.replaceAll(k, v);
  }
  if (morphed !== token) return morphed;

  if (token.length <= 2) return "关键点位";
  if (token.endsWith("罪")) return "对应罪事情形";
  if (token.includes("信息")) return token.replace(/信息/g, "内容");
  if (token.includes("证据")) return token.replace(/证据/g, "材料");
  if (token.includes("合同")) return token.replace(/合同/g, "约定文件");
  if (token.includes("资金")) return token.replace(/资金/g, "钱款");
  if (token.includes("财物")) return token.replace(/财物/g, "钱和东西");
  if (token.includes("组织")) return token.replace(/组织/g, "团体");
  if (token.includes("职权")) return token.replace(/职权/g, "手里权力");
  if (/(人|人员|军人|妇女|儿童|未成年人|当事人)/.test(token)) return "相关人员";
  if (/(资金|款|财物|税|票据|发票|退税|赔偿)/.test(token)) return "相关款项";
  if (/(证|证据|证件|文件|信息|数据|材料)/.test(token)) return "相关材料";
  if (/(组织|公司|企业|机构|单位|团体|平台)/.test(token)) return "相关组织";
  if (/(行为|活动|作业|执行|履行|办理|交易|管理|操作|程序)/.test(token)) return "相关行为";
  return "关键情节";
}

function inferRole(l1: string, l3: string): string {
  const joined = `${l1} ${l3}`;
  if (joined.includes("驾驶")) return "我这边是驾驶人/车主";
  if (joined.includes("毒品")) return "我这边是被调查一方";
  if (joined.includes("诈骗") || joined.includes("财产")) return "我这边是涉财产案件当事人";
  if (joined.includes("职务")) return "我这边是单位岗位相关人员";
  return "我这边是刑事案件当事人";
}

function inferGoal(l1: string, l3: string, salt: string): string {
  const seed = hashSeed(`${salt}|${l1}|${l3}`) % 3;
  if (seed === 0) return "先判断风险轻重和下一步程序";
  if (seed === 1) return "先准备关键材料，避免说错和漏证据";
  return "先知道当下该怎么配合处理更稳";
}

function buildScenarios(l1: string, l2: string, l3: string): ScenarioPack {
  const role = inferRole(l1, l3);
  const goal = inferGoal(l1, l3, "base");
  const parsed = semanticSplitCrimeLabel(l3);
  const allKeywords = collectOrderedKeywords(parsed, splitTokens(l3));
  const synonymKeywords = allKeywords.map((item) => toSynonym(item));
  const partialKeywords = allKeywords.slice(0, Math.max(1, Math.ceil(allKeywords.length / 2)));
  const keywordBundle = allKeywords.join(" / ");
  const l2Text = l2 || l1;
  const scattered = allKeywords.map((item) => `前后都提到“${item}”`).join("，");
  const synonymBundle = synonymKeywords.join(" / ");
  const partialBundle = partialKeywords.join(" / ");
  return {
    a: `${role}，这件事基本就是“${allKeywords.join("、")}”这条线，情况我能按时间顺序讲清楚，核心目标是${goal}。`,
    b: `${role}，大方向还是${l2Text}，但我表达会比较散：${scattered}，关键词都出现了，只是没连在一起；我想先把关键事实和时间点理顺。`,
    c: `${role}，我平时会用更口语的说法，比如“${synonymBundle}”，不一定用法条词，但表达的其实是同一件事；我想${goal}。`,
    d: `${role}，我现在只能零碎说出“${partialBundle}”这些点，很多细节还没法一次讲全；我想先确认先做什么最稳妥。`,
    e: `${role}，我先给最小线索：完整关键词组是“${keywordBundle}”，实际咨询时哪怕先说出其中一个词，也应该先进入初筛；我想${goal}。`,
  };
}

function main(): void {
  const rows = new Map<string, { l1: string; l2: string; l3: string }>();
  for (const node of CRIMINAL_CAUSE_LIBRARY) {
    if (node.level !== 3) continue;
    const l1 = node.path[1] ?? "";
    const l2 = node.path.length >= 4 ? node.path[2] ?? "" : "";
    const l3 = node.path.length >= 4 ? node.path[3] ?? "" : node.path[2] ?? "";
    if (!l1 || !l3) continue;
    const key = `${l1}|${l2}|${l3}`;
    if (!rows.has(key)) rows.set(key, { l1, l2, l3 });
  }

  const ordered = [...rows.values()].sort((a, b) => {
    const c1 = a.l1.localeCompare(b.l1, "zh-CN");
    if (c1 !== 0) return c1;
    const c2 = a.l2.localeCompare(b.l2, "zh-CN");
    if (c2 !== 0) return c2;
    return a.l3.localeCompare(b.l3, "zh-CN");
  });

  const aliasRows = Object.entries(CRIMINAL_CAUSE_ALIAS_TO_LABEL)
    .sort((a, b) => a[0].localeCompare(b[0], "zh-CN"))
    .map(
      ([alias, label], idx) =>
        `<tr><td>${idx + 1}</td><td>${escapeHtml(alias)}</td><td>${escapeHtml(label)}</td></tr>`,
    )
    .join("\n");

  const scenarioRows = ordered
    .map((item, idx) => {
      const s = buildScenarios(item.l1, item.l2, item.l3);
      return `<tr>
  <td>${idx + 1}</td>
  <td>${escapeHtml(item.l1)}</td>
  <td>${escapeHtml(item.l2 || "-")}</td>
  <td>${escapeHtml(item.l3)}</td>
  <td>${escapeHtml(formatSemanticSplit(item.l3))}</td>
  <td>${escapeHtml(s.a)}</td>
  <td>${escapeHtml(s.b)}</td>
  <td>${escapeHtml(s.c)}</td>
  <td>${escapeHtml(s.d)}</td>
  <td>${escapeHtml(s.e)}</td>
</tr>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>刑事映射表与情境A-E v1</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; margin: 0; padding: 20px; color: #1f2937; }
    h1 { margin: 0 0 10px; font-size: 24px; }
    h2 { margin: 18px 0 8px; font-size: 18px; }
    p { margin: 0 0 10px; color: #4b5563; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
    th { position: sticky; top: 0; background: #f9fafb; z-index: 1; }
    .wrap { max-height: calc(100vh - 150px); overflow: auto; border: 1px solid #e5e7eb; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>刑事映射表与常见情境 A-E（v1）</h1>
  <p>包含两部分：1）刑事别名映射表；2）三级罪名常见情境 A-E（A最完整，E最少关键词）。</p>

  <h2>一、刑事别名映射表（alias -> 标准罪名）</h2>
  <div class="wrap">
    <table>
      <thead><tr><th>#</th><th>别名表达</th><th>标准罪名</th></tr></thead>
      <tbody>${aliasRows}</tbody>
    </table>
  </div>

  <h2>二、三级罪名常见情境 A-E</h2>
  <p>共 ${ordered.length} 个三级罪名。</p>
  <div class="wrap">
    <table>
      <thead>
        <tr>
          <th>#</th><th>一级罪名（章）</th><th>二级罪名（节）</th><th>三级罪名</th>
          <th>语义拆分结果</th>
          <th>情境A（完整）</th><th>情境B（较完整）</th><th>情境C（口语）</th><th>情境D（碎片）</th><th>情境E（最小关键词）</th>
        </tr>
      </thead>
      <tbody>${scenarioRows}</tbody>
    </table>
  </div>
</body>
</html>`;

  fs.writeFileSync(OUTPUT_HTML_PATH, html, "utf8");
  console.log(`Generated criminal mapping + scenarios rows=${ordered.length} -> ${OUTPUT_HTML_PATH}`);
}

main();
