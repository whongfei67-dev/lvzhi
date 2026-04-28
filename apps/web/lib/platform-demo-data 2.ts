export const LAWYER_REGIONS = [
  "全国",
  "北京",
  "上海",
  "广州",
  "深圳",
  "杭州",
  "成都",
] as const;

export const LAWYER_DOMAINS = [
  "全部领域",
  "合同审查",
  "企业合规",
  "劳动争议",
  "知识产权",
  "婚姻家事",
  "刑事辩护",
] as const;

export const LAWYER_WEIGHT_LABELS = [
  "专业匹配",
  "服务响应",
  "平台履约",
  "用户反馈",
] as const;

export type InvitationStatus = "closed" | "submitted" | "approved" | "declined";

export interface DemoLawyer {
  id: string;
  realName: string;
  displayName: string;
  city: string;
  region: string;
  institution: string;
  avatarSeed: string;
  specialties: string[];
  primaryDomain: string;
  verified: boolean;
  platformSelected: boolean;
  rankScore: number;
  rankLabel: string;
  summary: string;
  contactFlowNote: string;
  contactButtonLabel: string;
}

export interface DemoCreator {
  id: string;
  realName: string;
  creatorDisplayName: string;
  creatorAlias?: string;
  avatarSeed: string;
  city: string;
  organization: string;
  publicOrganization?: string;
  specialty: string[];
  verified: boolean;
  isEmployedCreator: boolean;
  hideRealIdentity: boolean;
  allowContactByInvitation: boolean;
  identityRevealAfterApproval: boolean;
  publicIdentityLabel?: string;
  creatorTagline: string;
  bio: string;
  sanitizedBio: string;
  worksPublished: number;
  agentsPublished: number;
  coursePublished: number;
  policyFocus?: string;
  invitationStatus: InvitationStatus;
  nextStepCopy: string;
}

export interface PolicyPageSection {
  title: string;
  body: string[];
}

export interface PolicyPageData {
  slug: string;
  title: string;
  summary: string;
  sections: PolicyPageSection[];
  faq: Array<{ question: string; answer: string }>;
  ctaLabel: string;
  ctaHref: string;
}

export const DEMO_LAWYERS: DemoLawyer[] = [
  {
    id: "creator-shen-contract",
    realName: "沈知远",
    displayName: "沈知远律师",
    city: "上海",
    region: "上海",
    institution: "申衡律师事务所",
    avatarSeed: "深",
    specialties: ["合同审查", "企业合规", "股权协议"],
    primaryDomain: "合同审查",
    verified: true,
    platformSelected: true,
    rankScore: 98,
    rankLabel: "综合排序靠前",
    summary: "擅长企业合同审查、交易结构梳理与合规风控，适合企业客户与创业团队。",
    contactFlowNote: "提交申请后，平台将引导你进入付费获取联系方式流程，主页面默认不展示价格。",
    contactButtonLabel: "付费获取联系方式",
  },
  {
    id: "creator-lin-labor",
    realName: "林叙白",
    displayName: "林叙白律师",
    city: "北京",
    region: "北京",
    institution: "君衡律师事务所",
    avatarSeed: "林",
    specialties: ["劳动争议", "人力合规", "员工激励"],
    primaryDomain: "劳动争议",
    verified: true,
    platformSelected: true,
    rankScore: 96,
    rankLabel: "平台精选",
    summary: "长期服务互联网与制造业企业，擅长劳动争议处理与员工关系制度搭建。",
    contactFlowNote: "你可以先提交需求要点，再决定是否进入联系方式获取流程。",
    contactButtonLabel: "获取联系方式",
  },
  {
    id: "creator-zhou-ip",
    realName: "周闻笙",
    displayName: "周闻笙律师",
    city: "深圳",
    region: "深圳",
    institution: "前海知衡律师事务所",
    avatarSeed: "周",
    specialties: ["知识产权", "数据合规", "平台治理"],
    primaryDomain: "知识产权",
    verified: true,
    platformSelected: true,
    rankScore: 95,
    rankLabel: "综合排序靠前",
    summary: "专注知识产权与数据安全保护，适合内容平台、科技企业与出海团队。",
    contactFlowNote: "平台会先核对业务方向，再进入付费获取联系方式说明页。",
    contactButtonLabel: "获取联系方式",
  },
  {
    id: "creator-he-family",
    realName: "何清越",
    displayName: "何清越律师",
    city: "广州",
    region: "广州",
    institution: "南粤家事法律中心",
    avatarSeed: "何",
    specialties: ["婚姻家事", "继承规划", "财产分割"],
    primaryDomain: "婚姻家事",
    verified: true,
    platformSelected: true,
    rankScore: 93,
    rankLabel: "平台精选",
    summary: "在婚姻家事与继承规划方向有丰富经验，擅长把复杂问题讲清楚。",
    contactFlowNote: "联系方式获取流程包含服务边界说明，帮助用户先判断是否适合进一步沟通。",
    contactButtonLabel: "获取联系方式",
  },
  {
    id: "creator-jiang-criminal",
    realName: "蒋砚成",
    displayName: "蒋砚成律师",
    city: "成都",
    region: "成都",
    institution: "西部刑辩研究中心",
    avatarSeed: "蒋",
    specialties: ["刑事辩护", "企业刑事风险", "取保候审"],
    primaryDomain: "刑事辩护",
    verified: true,
    platformSelected: true,
    rankScore: 92,
    rankLabel: "综合排序靠前",
    summary: "关注企业家与高管刑事风险防控，适合风险预警与程序咨询场景。",
    contactFlowNote: "你提交场景后，将看到下一步联系方式获取说明与服务提示。",
    contactButtonLabel: "付费获取联系方式",
  },
  {
    id: "creator-qiu-compliance",
    realName: "邱明舒",
    displayName: "邱明舒律师",
    city: "杭州",
    region: "杭州",
    institution: "云衡合规律师事务所",
    avatarSeed: "邱",
    specialties: ["企业合规", "合同审查", "跨境业务"],
    primaryDomain: "企业合规",
    verified: true,
    platformSelected: true,
    rankScore: 91,
    rankLabel: "平台精选",
    summary: "擅长制度搭建、业务流程风控与跨部门合规协同，适合成长型企业。",
    contactFlowNote: "平台先展示服务匹配说明，再引导用户进入联系方式获取流程。",
    contactButtonLabel: "获取联系方式",
  },
  {
    id: "lawyer-beijing-contract-2",
    realName: "宋承礼",
    displayName: "宋承礼律师",
    city: "北京",
    region: "北京",
    institution: "京衡律师事务所",
    avatarSeed: "宋",
    specialties: ["合同审查", "投融资协议"],
    primaryDomain: "合同审查",
    verified: true,
    platformSelected: false,
    rankScore: 89,
    rankLabel: "综合排序入榜",
    summary: "侧重投融资、商业合作协议与争议预防。",
    contactFlowNote: "先提交需求，再查看下一步联系方式获取说明。",
    contactButtonLabel: "获取联系方式",
  },
  {
    id: "lawyer-beijing-labor-2",
    realName: "冯栖然",
    displayName: "冯栖然律师",
    city: "北京",
    region: "北京",
    institution: "北禾律师事务所",
    avatarSeed: "冯",
    specialties: ["劳动争议", "组织调整"],
    primaryDomain: "劳动争议",
    verified: true,
    platformSelected: false,
    rankScore: 88,
    rankLabel: "综合排序入榜",
    summary: "擅长企业人力争议处置与制度重建。",
    contactFlowNote: "平台将引导你进入下一步流程说明页。",
    contactButtonLabel: "获取联系方式",
  },
  {
    id: "lawyer-shanghai-contract-2",
    realName: "叶观澜",
    displayName: "叶观澜律师",
    city: "上海",
    region: "上海",
    institution: "浦江律师事务所",
    avatarSeed: "叶",
    specialties: ["合同审查", "供应链合作"],
    primaryDomain: "合同审查",
    verified: true,
    platformSelected: false,
    rankScore: 87,
    rankLabel: "综合排序入榜",
    summary: "聚焦供应链、采购和长期合作协议的风险控制。",
    contactFlowNote: "先看服务说明，再决定是否继续。",
    contactButtonLabel: "获取联系方式",
  },
  {
    id: "lawyer-shanghai-ip-2",
    realName: "施南意",
    displayName: "施南意律师",
    city: "上海",
    region: "上海",
    institution: "知本律师事务所",
    avatarSeed: "施",
    specialties: ["知识产权", "著作权", "数据合规"],
    primaryDomain: "知识产权",
    verified: true,
    platformSelected: false,
    rankScore: 86,
    rankLabel: "综合排序入榜",
    summary: "擅长内容版权、平台治理与数据资产保护。",
    contactFlowNote: "平台会先确认你的场景，再展示下一步说明。",
    contactButtonLabel: "付费获取联系方式",
  },
  {
    id: "lawyer-shenzhen-ip-2",
    realName: "高宁川",
    displayName: "高宁川律师",
    city: "深圳",
    region: "深圳",
    institution: "深知律师事务所",
    avatarSeed: "高",
    specialties: ["知识产权", "商业秘密"],
    primaryDomain: "知识产权",
    verified: true,
    platformSelected: false,
    rankScore: 85,
    rankLabel: "综合排序入榜",
    summary: "服务科技团队与产品公司，关注商业秘密与研发成果保护。",
    contactFlowNote: "你可以先看流程说明，再决定是否提交信息。",
    contactButtonLabel: "获取联系方式",
  },
  {
    id: "lawyer-shenzhen-compliance-2",
    realName: "顾妍宁",
    displayName: "顾妍宁律师",
    city: "深圳",
    region: "深圳",
    institution: "南山合规律师事务所",
    avatarSeed: "顾",
    specialties: ["企业合规", "数据出境"],
    primaryDomain: "企业合规",
    verified: true,
    platformSelected: false,
    rankScore: 84,
    rankLabel: "综合排序入榜",
    summary: "擅长科技企业合规流程与数据合规机制搭建。",
    contactFlowNote: "平台将展示付费获取联系方式的流程说明，不在主页面直接显示价格。",
    contactButtonLabel: "付费获取联系方式",
  },
  {
    id: "lawyer-guangzhou-family-2",
    realName: "苏微澜",
    displayName: "苏微澜律师",
    city: "广州",
    region: "广州",
    institution: "越秀家事事务所",
    avatarSeed: "苏",
    specialties: ["婚姻家事", "家族财富"],
    primaryDomain: "婚姻家事",
    verified: true,
    platformSelected: false,
    rankScore: 83,
    rankLabel: "综合排序入榜",
    summary: "关注家事争议和财富安排，沟通风格细致稳健。",
    contactFlowNote: "点击后可查看服务流程与下一步联系说明。",
    contactButtonLabel: "获取联系方式",
  },
  {
    id: "lawyer-guangzhou-labor-2",
    realName: "韩修齐",
    displayName: "韩修齐律师",
    city: "广州",
    region: "广州",
    institution: "岭南劳动法团队",
    avatarSeed: "韩",
    specialties: ["劳动争议", "薪酬绩效"],
    primaryDomain: "劳动争议",
    verified: true,
    platformSelected: false,
    rankScore: 82,
    rankLabel: "综合排序入榜",
    summary: "熟悉企业组织调整、劳动仲裁与用工制度设计。",
    contactFlowNote: "页面会先说明下一步流程，再进入联系方式获取。",
    contactButtonLabel: "获取联系方式",
  },
  {
    id: "lawyer-hangzhou-compliance-2",
    realName: "顾行舟",
    displayName: "顾行舟律师",
    city: "杭州",
    region: "杭州",
    institution: "湖滨合规律师事务所",
    avatarSeed: "顾",
    specialties: ["企业合规", "平台规则"],
    primaryDomain: "企业合规",
    verified: true,
    platformSelected: false,
    rankScore: 81,
    rankLabel: "综合排序入榜",
    summary: "擅长平台规则、内容审核制度与业务边界设计。",
    contactFlowNote: "你会先看到流程说明与材料准备建议。",
    contactButtonLabel: "付费获取联系方式",
  },
  {
    id: "lawyer-hangzhou-contract-2",
    realName: "唐景修",
    displayName: "唐景修律师",
    city: "杭州",
    region: "杭州",
    institution: "西湖商事律师事务所",
    avatarSeed: "唐",
    specialties: ["合同审查", "商业合作"],
    primaryDomain: "合同审查",
    verified: true,
    platformSelected: false,
    rankScore: 80,
    rankLabel: "综合排序入榜",
    summary: "擅长互联网业务合作、采购和商业化协议审查。",
    contactFlowNote: "平台将先说明下一步流程，再进入联系方式获取。",
    contactButtonLabel: "获取联系方式",
  },
  {
    id: "lawyer-chengdu-criminal-2",
    realName: "卢见川",
    displayName: "卢见川律师",
    city: "成都",
    region: "成都",
    institution: "天府刑辩团队",
    avatarSeed: "卢",
    specialties: ["刑事辩护", "企业刑事风险"],
    primaryDomain: "刑事辩护",
    verified: true,
    platformSelected: false,
    rankScore: 79,
    rankLabel: "综合排序入榜",
    summary: "关注企业合规与刑事风险交叉场景。",
    contactFlowNote: "联系方式会在下一步流程中按规则展示。",
    contactButtonLabel: "获取联系方式",
  },
  {
    id: "lawyer-chengdu-family-2",
    realName: "姚知夏",
    displayName: "姚知夏律师",
    city: "成都",
    region: "成都",
    institution: "蓉城家事法律中心",
    avatarSeed: "姚",
    specialties: ["婚姻家事", "监护安排"],
    primaryDomain: "婚姻家事",
    verified: true,
    platformSelected: false,
    rankScore: 78,
    rankLabel: "综合排序入榜",
    summary: "适合家庭纠纷前置沟通与长期关系安排。",
    contactFlowNote: "你可以在下一层页面中了解流程说明。",
    contactButtonLabel: "获取联系方式",
  },
];

export const DEMO_CREATORS: DemoCreator[] = [
  {
    id: "creator-shen-contract",
    realName: "沈知远",
    creatorDisplayName: "沈知远律师",
    avatarSeed: "深",
    city: "上海",
    organization: "申衡律师事务所",
    specialty: ["合同审查", "企业合规", "交易结构"],
    verified: true,
    isEmployedCreator: false,
    hideRealIdentity: false,
    allowContactByInvitation: false,
    identityRevealAfterApproval: false,
    creatorTagline: "专注合同审查与企业合规场景",
    bio: "长期面向企业客户提供合同审查、交易文本优化与制度型合规支持，已发布多款适用于法务与律师团队的智能体。",
    sanitizedBio: "长期面向企业客户提供合同审查与合规支持，已发布多款适用于法务与律师团队的智能体。",
    worksPublished: 8,
    agentsPublished: 4,
    coursePublished: 2,
    invitationStatus: "closed",
    nextStepCopy: "直接查看其公开主页与作品内容。",
  },
  {
    id: "creator-lin-labor",
    realName: "林叙白",
    creatorDisplayName: "林叙白律师",
    avatarSeed: "林",
    city: "北京",
    organization: "君衡律师事务所",
    specialty: ["劳动争议", "组织调整", "员工激励"],
    verified: true,
    isEmployedCreator: false,
    hideRealIdentity: false,
    allowContactByInvitation: false,
    identityRevealAfterApproval: false,
    creatorTagline: "把复杂劳动争议拆解成可执行流程",
    bio: "聚焦劳动争议和组织调整场景，擅长把纠纷处置路径、证据准备与风险提示融入创作型智能体。",
    sanitizedBio: "聚焦劳动争议和组织调整场景，擅长把纠纷处置路径融入创作型智能体。",
    worksPublished: 6,
    agentsPublished: 3,
    coursePublished: 1,
    invitationStatus: "closed",
    nextStepCopy: "直接查看其作品与公开联系方式说明。",
  },
  {
    id: "creator-zhou-ip",
    realName: "周闻笙",
    creatorDisplayName: "周闻笙律师",
    avatarSeed: "周",
    city: "深圳",
    organization: "前海知衡律师事务所",
    specialty: ["知识产权", "数据安全", "平台治理"],
    verified: true,
    isEmployedCreator: false,
    hideRealIdentity: false,
    allowContactByInvitation: false,
    identityRevealAfterApproval: false,
    creatorTagline: "让知识产权与数据安全问题更容易被理解",
    bio: "围绕知识产权、平台治理和数据安全进行内容创作与智能体设计，适合法务、内容平台与科技创业团队使用。",
    sanitizedBio: "围绕知识产权与数据安全进行内容创作与智能体设计。",
    worksPublished: 7,
    agentsPublished: 3,
    coursePublished: 2,
    invitationStatus: "closed",
    nextStepCopy: "可直接浏览其公开创作档案。",
  },
  {
    id: "creator-employed-iris",
    realName: "程奕宁",
    creatorDisplayName: "合规实验室 Z",
    creatorAlias: "合规实验室 Z",
    avatarSeed: "Z",
    city: "深圳",
    organization: "某头部企业法务团队",
    publicOrganization: "华南企业法务团队",
    specialty: ["合同审查", "企业合规", "知识库搭建"],
    verified: false,
    isEmployedCreator: true,
    hideRealIdentity: true,
    allowContactByInvitation: true,
    identityRevealAfterApproval: true,
    publicIdentityLabel: "某企业法务创作者",
    creatorTagline: "在不脱离当前工作状态的前提下持续创作",
    bio: "目前在大型企业法务岗位工作，重点创作合同审查、企业流程治理和内部知识协同相关的智能体与实务内容。",
    sanitizedBio: "在职创作者，专注合同审查与企业合规创作，已发布多款面向企业场景的智能体作品。",
    worksPublished: 5,
    agentsPublished: 3,
    coursePublished: 1,
    policyFocus: "隐私保护与邀请联系",
    invitationStatus: "submitted",
    nextStepCopy: "如需进一步了解其真实身份或建立联系，请先发起获取邀请。",
  },
  {
    id: "creator-employed-noah",
    realName: "赵见澄",
    creatorDisplayName: "企业法务创作组 N",
    creatorAlias: "企业法务创作组 N",
    avatarSeed: "N",
    city: "北京",
    organization: "某上市公司法务部",
    publicOrganization: "北京企业法务团队",
    specialty: ["劳动争议", "用工制度", "合规培训"],
    verified: false,
    isEmployedCreator: true,
    hideRealIdentity: true,
    allowContactByInvitation: true,
    identityRevealAfterApproval: true,
    publicIdentityLabel: "某企业法务创作者",
    creatorTagline: "以匿名方式沉淀实务知识与创作作品",
    bio: "在职法务，希望先以匿名方式沉淀劳动争议和制度设计相关作品，在不影响本职工作的前提下逐步建立个人创作影响力。",
    sanitizedBio: "在职创作者，专注劳动争议与合规培训，当前以匿名方式展示作品。",
    worksPublished: 4,
    agentsPublished: 2,
    coursePublished: 1,
    policyFocus: "邀请联系与身份保护",
    invitationStatus: "declined",
    nextStepCopy: "当前未开放直接身份披露，如需联系请等待创作者同意。",
  },
  {
    id: "creator-employed-mira",
    realName: "顾闻希",
    creatorDisplayName: "某企业法务创作者",
    creatorAlias: "某企业法务创作者",
    avatarSeed: "顾",
    city: "杭州",
    organization: "某科技公司法务与合规部",
    publicOrganization: "杭州科技企业法务团队",
    specialty: ["数据安全", "知识产权", "内部培训"],
    verified: false,
    isEmployedCreator: true,
    hideRealIdentity: true,
    allowContactByInvitation: true,
    identityRevealAfterApproval: true,
    publicIdentityLabel: "某企业法务创作者",
    creatorTagline: "专注合同审查与企业合规",
    bio: "在职法务，希望先以匿名或半匿名方式展示创作身份与作品成果，待双方确认合作意向后再决定是否公开真实身份。",
    sanitizedBio: "在职创作者，专注合同审查与企业合规，已发布 3 个智能体。",
    worksPublished: 3,
    agentsPublished: 3,
    coursePublished: 0,
    policyFocus: "身份隐藏与分阶段披露",
    invitationStatus: "approved",
    nextStepCopy: "创作者已同意进入下一步，你现在可以查看更多可公开信息。",
  },
];

export const POLICY_PAGES: PolicyPageData[] = [
  {
    slug: "creator-rights",
    title: "创作者权责声明",
    summary: "明确创作者在平台发布智能体、内容与课程时的基本权利、责任边界与平台协作方式。",
    sections: [
      {
        title: "创作者享有的基本权利",
        body: [
          "你可以在创作者学院中发布符合规则的智能体、内容与课程作品，并对作品的公开展示方式进行管理。",
          "平台会为作品提供标准化展示、基础审核支持和必要的投诉处理机制，帮助创作者稳定开展创作。",
        ],
      },
      {
        title: "创作者需要承担的责任",
        body: [
          "创作者需确保作品内容不侵犯他人权益，不发布虚假、误导或超出专业边界的说明。",
          "涉及执业、咨询和身份披露的内容，应与实际资质、服务边界和平台政策保持一致。",
        ],
      },
      {
        title: "平台协作说明",
        body: [
          "平台会根据用户反馈、投诉记录和运营规则，对作品进行复核、提醒或下架处理。",
          "当出现争议时，平台优先推动沟通与补充说明，并为创作者提供明确的整改入口。",
        ],
      },
    ],
    faq: [
      {
        question: "平台会直接修改我的作品吗？",
        answer: "不会。平台会给出审核意见或整改建议，由创作者决定如何调整并重新提交。",
      },
      {
        question: "我能否申请隐藏部分公开信息？",
        answer: "可以，尤其是“在职创作者”身份支持按规则隐藏真实姓名和敏感身份信息。",
      },
    ],
    ctaLabel: "查看在职创作者路径",
    ctaHref: "/creators/employed",
  },
  {
    slug: "identity-and-privacy",
    title: "身份认证与隐私政策",
    summary: "说明创作者身份展示、认证方式、隐私保护规则，以及在职创作者的匿名展示机制。",
    sections: [
      {
        title: "身份认证原则",
        body: [
          "平台会根据创作者身份类型提供不同的认证与展示方案，保障信息真实与展示适度之间的平衡。",
          "对于律师、学生和在职创作者，平台会采用不同的公开字段策略，以兼顾信任建立和个人隐私保护。",
        ],
      },
      {
        title: "在职创作者隐私保护",
        body: [
          "在职创作者可以选择“隐藏真实姓名和个人信息”，公开页默认仅展示昵称、创作方向、作品和非敏感标签。",
          "若用户希望进一步联系或获取更多身份信息，需先发起获取邀请，待创作者同意后才进入下一步。",
        ],
      },
      {
        title: "信息处理与公开边界",
        body: [
          "平台不会在未经同意的情况下公开创作者联系方式、真实单位和其他可直接识别个人身份的敏感信息。",
          "创作者可在后台随时调整公开展示策略，平台将同步更新前台展示规则。",
        ],
      },
    ],
    faq: [
      {
        question: "开启身份隐藏后，用户还能联系我吗？",
        answer: "可以，但需要先通过邀请流程，由你决定是否开放更多信息。",
      },
      {
        question: "普通创作者也能使用邀请机制吗？",
        answer: "当前主要面向在职创作者和有隐私保护需求的创作者场景。",
      },
    ],
    ctaLabel: "查看隐私保护说明",
    ctaHref: "/creators/employed",
  },
  {
    slug: "upload-and-takedown",
    title: "智能体上传与下架规则",
    summary: "帮助创作者理解作品上架前后的审核机制、更新要求和下架触发条件。",
    sections: [
      {
        title: "上传前准备",
        body: [
          "请确保智能体说明、标签、示例输出与实际能力一致，避免使用夸大表述。",
          "涉及收费、服务边界、身份信息或合规提示的内容，应在提交前完成校对。",
        ],
      },
      {
        title: "平台审核与提醒",
        body: [
          "平台会对作品进行基础审核，重点关注误导性承诺、违规内容和敏感信息暴露风险。",
          "当作品需要整改时，平台会提供明确原因与建议，并保留再次提交入口。",
        ],
      },
      {
        title: "下架与恢复",
        body: [
          "若作品持续违规、投诉集中或存在明显风险，平台可临时下架并通知创作者处理。",
          "完成整改后，创作者可再次发起审核，符合要求后即可恢复展示。",
        ],
      },
    ],
    faq: [
      {
        question: "下架后作品会被删除吗？",
        answer: "通常不会，平台会先保留草稿或历史版本，方便创作者补充修改。",
      },
      {
        question: "我能主动暂时下架作品吗？",
        answer: "可以，创作者可按需将作品设置为暂不展示或等待更新。",
      },
    ],
    ctaLabel: "回到创作者学院",
    ctaHref: "/creators",
  },
  {
    slug: "ip-and-data-security",
    title: "知识产权与数据安全保护",
    summary: "说明平台如何处理作品权属、内容引用、敏感数据与用户资料保护。",
    sections: [
      {
        title: "作品权属与授权",
        body: [
          "创作者对自行创作并合法拥有权利的内容保有相应权利，平台仅获得必要的展示与运营授权。",
          "若作品包含第三方资料、模板或受保护内容，创作者需确保具备合法使用基础。",
        ],
      },
      {
        title: "数据安全底线",
        body: [
          "平台不鼓励在公开页展示用户敏感信息、企业内部材料或未经脱敏处理的数据样本。",
          "涉及真实业务材料时，应优先使用脱敏示例、抽象案例或经授权的公开材料。",
        ],
      },
      {
        title: "风险响应机制",
        body: [
          "当出现侵权或数据安全投诉时，平台会快速标记内容、启动复核并与创作者确认处理方案。",
          "必要时，平台会先采取限制展示措施，以降低继续传播的风险。",
        ],
      },
    ],
    faq: [
      {
        question: "平台能帮我处理侵权投诉吗？",
        answer: "可以，平台会提供基础协助，包括记录、复核和必要的展示限制。",
      },
      {
        question: "上传案例时必须脱敏吗？",
        answer: "涉及真实人物、企业、联系方式或业务细节时，默认应先脱敏处理。",
      },
    ],
    ctaLabel: "联系平台政策支持",
    ctaHref: "/creators/policies/manual-support",
  },
  {
    slug: "complaints-and-feedback",
    title: "投诉与反馈",
    summary: "为用户与创作者提供清晰的投诉、申诉、反馈与跟进机制。",
    sections: [
      {
        title: "可受理的问题类型",
        body: [
          "包括内容误导、侵权投诉、身份信息暴露、合作体验反馈、规则理解问题等。",
          "若问题涉及在职创作者隐私或邀请联系争议，平台会优先核查披露流程是否合规。",
        ],
      },
      {
        title: "处理流程",
        body: [
          "提交后，平台会先完成初步分类，再进入复核、补充材料、处理反馈等步骤。",
          "对于可快速处理的问题，平台会在演示版中给出明确的状态说明与下一步建议。",
        ],
      },
      {
        title: "跟进建议",
        body: [
          "提交反馈时建议附上页面链接、问题描述和希望的平台协助方向，以加快处理效率。",
          "若涉及邀请联系结果，建议同时说明是否希望继续等待、撤回申请或转人工协助。",
        ],
      },
    ],
    faq: [
      {
        question: "多久能收到回复？",
        answer: "演示版会先展示状态回执，真实运营场景中平台会根据问题类型安排处理时效。",
      },
      {
        question: "我可以补充材料吗？",
        answer: "可以，平台鼓励在处理过程中补充截图、说明或期望的处理结果。",
      },
    ],
    ctaLabel: "进入投诉与反馈页",
    ctaHref: "/creators/policies/complaints-and-feedback",
  },
  {
    slug: "manual-support",
    title: "人工服务",
    summary: "当你需要进一步沟通、协助或人工判断时，这里提供清晰的前台演示承接。",
    sections: [
      {
        title: "适合进入人工服务的场景",
        body: [
          "包括复杂的身份展示问题、邀请联系争议、规则解释需求和重点作品运营支持。",
          "当自动化流程无法清晰回应你的问题时，平台会建议转入人工服务。",
        ],
      },
      {
        title: "服务说明",
        body: [
          "演示版会展示人工服务适用范围、常见处理方向和标准联系路径，方便前台演示。",
          "平台会根据问题类型将请求分流到政策支持、作品审核支持或合作沟通支持。",
        ],
      },
      {
        title: "联系建议",
        body: [
          "联系前可先准备页面链接、问题摘要和期待结果，便于人工服务更快判断。",
          "涉及在职创作者的邀请联系问题，建议同时说明你当前的邀请状态与希望了解的信息边界。",
        ],
      },
    ],
    faq: [
      {
        question: "人工服务会直接暴露创作者真实身份吗？",
        answer: "不会。人工服务仍会遵守创作者隐私设置和邀请联系规则。",
      },
      {
        question: "平台会帮我联系在职创作者吗？",
        answer: "平台可协助转达邀请或补充说明，但是否披露更多信息仍由创作者决定。",
      },
    ],
    ctaLabel: "发起联系邀请",
    ctaHref: "/creators/employed",
  },
];

export const CLASSROOM_COURSES = [
  {
    id: "intro",
    level: "入门",
    title: "什么是法律 AI 智能体？",
    desc: "了解智能体的基本概念、工作原理与在法律场景中的应用边界，适合零基础创作者。",
    duration: "15 分钟",
    lessons: 3,
    tags: ["概念入门", "适用场景"],
  },
  {
    id: "prompt-basic",
    level: "入门",
    title: "提示词设计基础",
    desc: "掌握 System Prompt 的结构设计，学会设定角色、约束输出格式与控制回答边界。",
    duration: "25 分钟",
    lessons: 5,
    tags: ["提示词", "System Prompt"],
  },
  {
    id: "contract-agent",
    level: "进阶",
    title: "合同审查智能体实战",
    desc: "手把手构建一个合同风险识别智能体，涵盖场景定义、提示词调优与演示内容配置全流程。",
    duration: "40 分钟",
    lessons: 8,
    tags: ["合同法", "实战案例"],
  },
  {
    id: "qa-agent",
    level: "进阶",
    title: "法律问答智能体设计",
    desc: "构建支持多轮对话的法律咨询智能体，学习如何处理模糊问题、引导用户描述并合规给出建议。",
    duration: "35 分钟",
    lessons: 7,
    tags: ["问答设计", "多轮对话"],
  },
  {
    id: "pricing",
    level: "进阶",
    title: "免费版 vs 商用版发布策略",
    desc: "对比两种发布模式的适用场景，学会结合自身定位选择定价策略与试用设置。",
    duration: "20 分钟",
    lessons: 4,
    tags: ["运营策略", "定价"],
  },
  {
    id: "compliance",
    level: "高级",
    title: "智能体合规设计与风险边界",
    desc: "深入讲解法律智能体的合规要求、免责声明设计与不可逾越的输出边界。",
    duration: "30 分钟",
    lessons: 6,
    tags: ["合规", "风险控制"],
  },
  {
    id: "seo-growth",
    level: "高级",
    title: "智能体曝光与增长方法",
    desc: "通过关键词优化、社区运营与案例分享提升智能体发现率，积累用户与转化。",
    duration: "25 分钟",
    lessons: 5,
    tags: ["增长", "社区运营"],
  },
  {
    id: "monetize",
    level: "高级",
    title: "智能体变现路径全解析",
    desc: "系统梳理按次付费、订阅制、咨询导流等变现模式，结合真实案例拆解转化路径。",
    duration: "35 分钟",
    lessons: 7,
    tags: ["变现", "商业化"],
  },
] as const;

export function normalizeLawyerFilter(
  value: string | undefined,
  options: readonly string[],
  fallback: string
) {
  if (!value) return fallback;
  return options.includes(value) ? value : fallback;
}

export function getFilteredLawyers({
  region = "全国",
  domain = "全部领域",
  query = "",
}: {
  region?: string;
  domain?: string;
  query?: string;
}) {
  const keyword = query.trim();
  return DEMO_LAWYERS.filter((lawyer) => {
    const matchesRegion = region === "全国" || lawyer.region === region;
    const matchesDomain = domain === "全部领域" || lawyer.primaryDomain === domain;
    const haystack = [lawyer.displayName, lawyer.city, lawyer.institution, lawyer.specialties.join(" ")].join(" ");
    const matchesQuery = !keyword || haystack.includes(keyword);
    return matchesRegion && matchesDomain && matchesQuery;
  }).sort((a, b) => b.rankScore - a.rankScore);
}

export function getLawyerLeaderboard(region?: string, domain?: string) {
  return getFilteredLawyers({ region, domain }).slice(0, 15);
}

export function getPlatformSelectedLawyers(region?: string, domain?: string) {
  return getFilteredLawyers({ region, domain }).filter((lawyer) => lawyer.platformSelected).slice(0, 6);
}

export function getLawyerById(id: string) {
  return DEMO_LAWYERS.find((lawyer) => lawyer.id === id) ?? null;
}

export function getCreatorById(id: string) {
  return DEMO_CREATORS.find((creator) => creator.id === id) ?? null;
}

export function getFeaturedCreators() {
  return DEMO_CREATORS.slice(0, 6);
}

export function getEmployedCreators() {
  return DEMO_CREATORS.filter((creator) => creator.isEmployedCreator);
}

export function getPolicyBySlug(slug: string) {
  return POLICY_PAGES.find((item) => item.slug === slug) ?? null;
}
