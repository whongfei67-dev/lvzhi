"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/common/pagination";
import { Bell, Clock, CheckCircle, Sparkles, MessageSquare, Users, DollarSign } from "lucide-react";

interface Notification {
  id: string;
  notification_type?: string;
  type: "system" | "comment" | "like" | "follow" | "order" | "promotion";
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

function mapNotificationType(raw: string | undefined): Notification["type"] {
  const t = String(raw || "").toLowerCase();
  if (t.includes("comment")) return "comment";
  if (t.includes("like")) return "like";
  if (t.includes("follow")) return "follow";
  if (t.includes("order") || t.includes("withdraw") || t.includes("settlement")) return "order";
  if (t.includes("promotion")) return "promotion";
  return "system";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications();
  }, [activeTab, page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const result = await api.workspace.getNotifications({
        page,
        limit: 20,
        is_read: activeTab === "unread" ? false : undefined,
      });
      const items = ((result.items as unknown as Record<string, unknown>[]) || []).map((item) => {
        const notificationType = String(item.notification_type || item.type || "");
        const linkFromData =
          item.data && typeof item.data === "object" && !Array.isArray(item.data)
            ? String((item.data as Record<string, unknown>).link || "")
            : "";
        return {
          id: String(item.id || ""),
          notification_type: notificationType,
          type: mapNotificationType(notificationType),
          title: String(item.title || "系统通知"),
          content: String(item.content || ""),
          is_read: Boolean(item.is_read),
          created_at: String(item.created_at || ""),
          link: linkFromData || undefined,
        } as Notification;
      });
      setNotifications(items);
      setTotalPages(Math.ceil(result.total / 20));
    } catch (error) {
      console.error("获取通知失败:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "system":
        return <Bell className="h-5 w-5" />;
      case "comment":
        return <MessageSquare className="h-5 w-5" />;
      case "like":
        return <Sparkles className="h-5 w-5" />;
      case "follow":
        return <Users className="h-5 w-5" />;
      case "order":
        return <DollarSign className="h-5 w-5" />;
      case "promotion":
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getIconBg = (type: Notification["type"]) => {
    switch (type) {
      case "system":
        return "bg-[rgba(212,165,116,0.15)] text-[#D4A574]";
      case "comment":
        return "bg-[rgba(212,165,116,0.15)] text-[#D4A574]";
      case "like":
        return "bg-red-50 text-red-500";
      case "follow":
        return "bg-[rgba(212,165,116,0.15)] text-[#D4A574]";
      case "order":
        return "bg-[rgba(212,165,116,0.15)] text-[#D4A574]";
      case "promotion":
        return "bg-[rgba(212,165,116,0.15)] text-[#D4A574]";
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2C2416]">通知中心</h1>
          <p className="mt-2 text-[#5D4E3A]">
            查看系统通知、互动消息和订单动态
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => {
              // 标记全部已读
              setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            }}
            className="rounded-xl border border-[rgba(212,165,116,0.25)] px-4 py-2 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
          >
            全部标为已读
          </button>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="mb-6 flex gap-1 rounded-xl bg-[rgba(212,165,116,0.15)] p-1">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "all"
              ? "bg-white text-[#D4A574] shadow-sm"
              : "text-[#5D4E3A] hover:text-[#2C2416]"
          }`}
        >
          全部通知
        </button>
        <button
          onClick={() => setActiveTab("unread")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "unread"
              ? "bg-white text-[#D4A574] shadow-sm"
              : "text-[#5D4E3A] hover:text-[#2C2416]"
          }`}
        >
          未读
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 通知列表 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-[rgba(212,165,116,0.15)]" />
                <div className="flex-1">
                  <div className="h-5 w-1/3 rounded bg-[rgba(212,165,116,0.15)]" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-[rgba(212,165,116,0.15)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title="暂无通知"
          description={activeTab === "unread" ? "暂无未读通知" : "暂无通知消息"}
        />
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.link || "#"}
                className={`group flex items-start gap-4 rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  notification.is_read
                    ? "border-[rgba(212,165,116,0.25)] bg-white"
                    : "border-[#D4A574] bg-[rgba(212,165,116,0.15)]"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getIconBg(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${notification.is_read ? "text-[#5D4E3A]" : "text-[#2C2416]"}`}>
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <span className="h-2 w-2 rounded-full bg-[#D4A574]" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[#5D4E3A] line-clamp-2">{notification.content}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-[#9A8B78]">
                    <Clock className="h-3 w-3" />
                    {notification.created_at}
                  </div>
                </div>
                {!notification.is_read && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
                      );
                    }}
                    className="shrink-0 rounded-lg border border-[rgba(212,165,116,0.25)] px-3 py-1.5 text-xs font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
                  >
                    标为已读
                  </button>
                )}
              </Link>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-8"
          />
        </>
      )}
    </div>
  );
}
