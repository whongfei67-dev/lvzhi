/**
 * 律植 UI 预演方案配置
 *
 * 视觉方向：琥珀咖啡色系 + 思源宋体 + 丝绒质感
 * 设计来源：UI预演/base.css 和 HTML 页面
 *
 * 颜色体系：
 * - amber: 琥珀色 - 强调色、hover状态、高亮
 * - coffee: 咖啡色 - 主色、按钮、标题
 * - cream: 奶油白 - 页面背景
 * - 文字三级：text / text-secondary / text-muted
 */

export const uiPreset = {
  // ─── 颜色系统 ─────────────────────────────────────────────────────────────
  colors: {
    amber: '#D4A574',
    'amber-dark': '#B8860B',
    'amber-light': '#E8CDB5',
    coffee: '#5C4033',
    'coffee-light': '#8B7355',
    cream: '#FFF8F0',
    text: '#2C2416',
    'text-secondary': '#5D4E3A',
    'text-muted': '#9A8B78',
  },

  // ─── 阴影系统 ─────────────────────────────────────────────────────────────
  shadows: {
    sm: '0 2px 8px rgba(92,64,51,0.08)',
    md: '0 8px 24px rgba(92,64,51,0.12)',
    lg: '0 16px 48px rgba(92,64,51,0.16)',
  },

  // ─── 圆角系统 ─────────────────────────────────────────────────────────────
  borderRadius: {
    sm: '8px',      // tag / chip / badge
    md: '10px',     // button / input / select
    lg: '16px',     // card / panel / modal
    xl: '24px',     // hero / large container
  },

  // ─── 动画时长 ─────────────────────────────────────────────────────────────
  transitions: {
    fast: '0.15s',
    normal: '0.3s',
    slow: '0.5s',
  },
} as const;

// ─── 导出类型 ────────────────────────────────────────────────────────────────
export type UIPresetColors = keyof typeof uiPreset.colors;
export type UIPresetShadows = keyof typeof uiPreset.shadows;
export type UIPresetBorderRadius = keyof typeof uiPreset.borderRadius;

// ─── Feather Icons 映射到 Lucide React ─────────────────────────────────────
// 用于兼容当前代码中使用的 lucide-react 图标
export const iconMap: Record<string, string> = {
  search: "Search",
  bell: "Bell",
  heart: "Heart",
  eye: "Eye",
  "message-square": "MessageSquare",
  bookmark: "Bookmark",
  share: "Share2",
  edit: "Edit",
  trash: "Trash2",
  plus: "Plus",
  minus: "Minus",
  x: "X",
  check: "Check",
  "check-circle": "CheckCircle",
  "arrow-right": "ArrowRight",
  "arrow-left": "ArrowLeft",
  "arrow-up": "ArrowUp",
  "arrow-down": "ArrowDown",
  "chevron-right": "ChevronRight",
  "chevron-left": "ChevronLeft",
  "chevron-down": "ChevronDown",
  "chevron-up": "ChevronUp",
  menu: "Menu",
  home: "Home",
  user: "User",
  users: "Users",
  mail: "Mail",
  lock: "Lock",
  unlock: "Unlock",
  settings: "Settings",
  star: "Star",
  clock: "Clock",
  calendar: "Calendar",
  map: "Map",
  "map-pin": "MapPin",
  phone: "Phone",
  link: "Link",
  copy: "Copy",
  download: "Download",
  upload: "Upload",
  image: "Image",
  file: "File",
  "file-text": "FileText",
  folder: "Folder",
  grid: "LayoutGrid",
  list: "List",
  filter: "Filter",
  sort: "ArrowUpDown",
  refresh: "RefreshCw",
  "zoom-in": "ZoomIn",
  "zoom-out": "ZoomOut",
  zap: "Zap",
  bot: "Bot",
  sparkles: "Sparkles",
  briefcase: "Briefcase",
  scale: "Scale",
  gavel: "Gavel",
  award: "Award",
  crown: "Crown",
  "thumbs-up": "ThumbsUp",
  "thumbs-down": "ThumbsDown",
  comment: "MessageSquare",
  send: "Send",
  "x-circle": "XCircle",
  "alert-circle": "AlertCircle",
  "alert-triangle": "AlertTriangle",
  info: "Info",
  "help-circle": "HelpCircle",
  "log-in": "LogIn",
  "log-out": "LogOut",
  save: "Save",
  "trending-up": "TrendingUp",
  "trending-down": "TrendingDown",
  activity: "Activity",
  "bar-chart": "BarChart",
  "pie-chart": "PieChart",
  "line-chart": "LineChart",
  "dollar-sign": "DollarSign",
  "credit-card": "CreditCard",
  wallet: "Wallet",
  coins: "Coins",
  receipt: "Receipt",
  compass: "Compass",
  globe: "Globe",
  timer: "Timer",
  tag: "Tag",
  tags: "Tags",
  box: "Box",
  archive: "Archive",
  package: "Package",
  inbox: "Inbox",
  sun: "Sun",
  moon: "Moon",
  cloud: "Cloud",
  umbrella: "Umbrella",
  thermometer: "Thermometer",
  coffee: "Coffee",
  food: "UtensilsCrossed",
};

// ─── 动画 keyframes ─────────────────────────────────────────────────────────
// 来自 UI预演 的 CSS 动画定义
export const animations = {
  fadeInUp: {
    from: { opacity: 0, transform: 'translateY(40px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  fadeInDown: {
    from: { opacity: 0, transform: 'translateY(-40px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  fadeInLeft: {
    from: { opacity: 0, transform: 'translateX(-40px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  fadeInRight: {
    from: { opacity: 0, transform: 'translateX(40px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  slowZoom: {
    from: { transform: 'scale(1)' },
    to: { transform: 'scale(1.1)' },
  },
  pulse: {
    from: { opacity: 1 },
    to: { opacity: 0.5 },
  },
  bounce: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  slideIn: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
  },
};

export default uiPreset;
