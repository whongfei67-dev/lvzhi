"use client";

import { useState } from "react";
import { User, Mail, Phone, Lock, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "notification" | "security">("profile");

  const tabs = [
    { id: "profile", label: "个人资料", icon: User },
    { id: "account", label: "账号设置", icon: Mail },
    { id: "notification", label: "通知设置", icon: Bell },
    { id: "security", label: "安全设置", icon: Shield },
  ] as const;
  type TabId = (typeof tabs)[number]["id"];

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C2416]">账号设置</h1>
        <p className="mt-2 text-[#5D4E3A]">管理你的个人信息和账号设置</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* 侧边导航 */}
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#D4A574] text-white"
                    : "text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.15)] hover:text-[#D4A574]"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 内容区 */}
        <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "account" && <WorkspaceAccountTabSettings />}
          {activeTab === "notification" && <NotificationSettings />}
          {activeTab === "security" && <SecuritySettings />}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const [formData, setFormData] = useState({
    display_name: "用户",
    bio: "",
    location: "",
    website: "",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#2C2416]">个人资料</h2>
        <p className="mt-1 text-sm text-[#5D4E3A]">设置你的公开个人资料</p>
      </div>

      {/* 头像 */}
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-2xl font-bold text-white">
          用
        </div>
        <div>
          <button className="rounded-xl border border-[rgba(212,165,116,0.25)] px-4 py-2 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]">
            更换头像
          </button>
          <p className="mt-1 text-xs text-[#9A8B78]">支持 JPG、PNG 格式，最大 2MB</p>
        </div>
      </div>

      {/* 表单 */}
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#5D4E3A]">显示名称</label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            className="w-full rounded-xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-3 py-2 text-sm text-[#2C2416] placeholder:text-[#9A8B78] focus:border-[#D4A574] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#5D4E3A]">个人简介</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            placeholder="介绍一下你自己..."
            className="w-full resize-none rounded-xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-3 py-2 text-sm text-[#2C2416] placeholder:text-[#9A8B78] focus:border-[#D4A574] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#5D4E3A]">所在地区</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="例如：北京"
            className="w-full rounded-xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-3 py-2 text-sm text-[#2C2416] placeholder:text-[#9A8B78] focus:border-[#D4A574] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <button className="rounded-xl bg-[#D4A574] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]">
        保存修改
      </button>
    </div>
  );
}

function WorkspaceAccountTabSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#2C2416]">账号设置</h2>
        <p className="mt-1 text-sm text-[#5D4E3A]">管理你的账号基本信息</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#5D4E3A]">邮箱地址</label>
          <input
            type="email"
            defaultValue="user@example.com"
            className="w-full rounded-xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-3 py-2 text-sm text-[#2C2416] focus:border-[#D4A574] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#5D4E3A]">手机号码</label>
          <input
            type="tel"
            defaultValue="138 **** 8888"
            className="w-full rounded-xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-3 py-2 text-sm text-[#2C2416] focus:border-[#D4A574] focus:bg-white focus:outline-none"
          />
          <button className="mt-2 text-sm text-[#D4A574]">更换手机号</button>
        </div>
      </div>

      <div className="border-t border-[rgba(212,165,116,0.25)] pt-6">
        <h3 className="font-medium text-[#2C2416]">账号类型</h3>
        <p className="mt-1 text-sm text-[#5D4E3A]">当前账号：普通用户</p>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h3 className="font-medium text-red-800">危险区域</h3>
        <p className="mt-1 text-sm text-red-600">注销账号后，所有数据将被永久删除</p>
        <button className="mt-3 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100">
          注销账号
        </button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    email_notification: true,
    push_notification: true,
    comment_notification: true,
    like_notification: true,
    follow_notification: false,
    order_notification: true,
    promotion_notification: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#2C2416]">通知设置</h2>
        <p className="mt-1 text-sm text-[#5D4E3A]">选择你希望接收的通知类型</p>
      </div>

      <div className="space-y-4">
        {[
          { key: "email_notification", label: "邮件通知", description: "通过邮件接收重要通知" },
          { key: "push_notification", label: "推送通知", description: "通过浏览器接收推送通知" },
          { key: "comment_notification", label: "评论通知", description: "有人评论你的内容时通知" },
          { key: "like_notification", label: "点赞通知", description: "有人点赞你的内容时通知" },
          { key: "follow_notification", label: "关注通知", description: "有人关注你时通知" },
          { key: "order_notification", label: "订单通知", description: "订单相关的重要通知" },
          { key: "promotion_notification", label: "活动通知", description: "平台活动和促销信息" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-xl border border-[rgba(212,165,116,0.25)] p-4">
            <div>
              <h3 className="font-medium text-[#2C2416]">{item.label}</h3>
              <p className="text-sm text-[#5D4E3A]">{item.description}</p>
            </div>
            <button
              onClick={() => toggleSetting(item.key as keyof typeof settings)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings[item.key as keyof typeof settings] ? "bg-[#D4A574]" : "bg-[rgba(212,165,116,0.2)]"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                  settings[item.key as keyof typeof settings] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <button className="rounded-xl bg-[#D4A574] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]">
        保存设置
      </button>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#2C2416]">安全设置</h2>
        <p className="mt-1 text-sm text-[#5D4E3A]">保护你的账号安全</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-[rgba(212,165,116,0.25)] p-4">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-[#5D4E3A]" />
            <div>
              <h3 className="font-medium text-[#2C2416]">登录密码</h3>
              <p className="text-sm text-[#5D4E3A]">上次修改于 30 天前</p>
            </div>
          </div>
          <button className="rounded-xl border border-[rgba(212,165,116,0.25)] px-4 py-2 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]">
            修改密码
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[rgba(212,165,116,0.25)] p-4">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-[#5D4E3A]" />
            <div>
              <h3 className="font-medium text-[#2C2416]">手机绑定</h3>
              <p className="text-sm text-[#5D4E3A]">138 **** 8888</p>
            </div>
          </div>
          <button className="rounded-xl border border-[rgba(212,165,116,0.25)] px-4 py-2 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]">
            更换手机
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[rgba(212,165,116,0.25)] p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[#5D4E3A]" />
            <div>
              <h3 className="font-medium text-[#2C2416]">两步验证</h3>
              <p className="text-sm text-[#5D4E3A]">未开启</p>
            </div>
          </div>
          <button className="rounded-xl bg-[#D4A574] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#B8860B]">
            立即开启
          </button>
        </div>
      </div>

      <div className="border-t border-[rgba(212,165,116,0.25)] pt-6">
        <h3 className="font-medium text-[#2C2416]">登录设备管理</h3>
        <p className="mt-1 text-sm text-[#5D4E3A]">查看并管理已登录的设备</p>
        <button className="mt-3 rounded-xl border border-[rgba(212,165,116,0.25)] px-4 py-2 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]">
          查看设备列表
        </button>
      </div>
    </div>
  );
}
