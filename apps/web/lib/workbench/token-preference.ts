export type WorkbenchTokenMode = "off" | "partner";

export type WorkbenchTokenProvider =
  | "lvzhi_partner_default"
  | "aliyun_bailian"
  | "dashscope"
  | "zhipu"
  | "deepseek";

export type WorkbenchTokenPreference = {
  mode: WorkbenchTokenMode;
  provider: WorkbenchTokenProvider;
  updatedAt: string;
};

const WB_TOKEN_PREF_KEY = "lvzhi:workbench:token-preference:v1";

const DEFAULT_PREF: WorkbenchTokenPreference = {
  mode: "partner",
  provider: "lvzhi_partner_default",
  updatedAt: "",
};

export function readWorkbenchTokenPreference(): WorkbenchTokenPreference {
  if (typeof window === "undefined") return DEFAULT_PREF;
  try {
    const raw = window.localStorage.getItem(WB_TOKEN_PREF_KEY);
    if (!raw) return DEFAULT_PREF;
    const parsed = JSON.parse(raw) as Partial<WorkbenchTokenPreference>;
    const mode: WorkbenchTokenMode = parsed.mode === "off" || parsed.mode === "partner" ? parsed.mode : DEFAULT_PREF.mode;
    const providerRaw = String(parsed.provider || DEFAULT_PREF.provider);
    const provider: WorkbenchTokenProvider =
      providerRaw === "lvzhi_partner_default" ||
      providerRaw === "aliyun_bailian" ||
      providerRaw === "dashscope" ||
      providerRaw === "zhipu" ||
      providerRaw === "deepseek"
        ? providerRaw
        : DEFAULT_PREF.provider;
    return {
      mode,
      provider,
      updatedAt: String(parsed.updatedAt || ""),
    };
  } catch {
    return DEFAULT_PREF;
  }
}

export function saveWorkbenchTokenPreference(pref: WorkbenchTokenPreference): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WB_TOKEN_PREF_KEY, JSON.stringify(pref));
    window.dispatchEvent(new CustomEvent("lvzhi-wb-token-pref-updated"));
  } catch {
    // ignore
  }
}

export function tokenProviderLabel(provider: WorkbenchTokenProvider): string {
  if (provider === "lvzhi_partner_default") return "律植合作池（默认）";
  if (provider === "aliyun_bailian") return "阿里云百炼";
  if (provider === "dashscope") return "DashScope";
  if (provider === "zhipu") return "智谱";
  if (provider === "deepseek") return "DeepSeek";
  if (provider === "openai") return "OpenAI";
  if (provider === "anthropic") return "Anthropic";
  return "自定义供应商";
}

export function tokenModeLabel(mode: WorkbenchTokenMode): string {
  if (mode === "off") return "不使用 Token";
  return "使用平台合作 Token";
}

