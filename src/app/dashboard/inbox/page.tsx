"use client";

import { useState, useEffect, useCallback } from "react";
import { useRealtimeInbox } from "@/hooks/use-sse";
import { useLang } from "@/lib/i18n/context";

interface Conversation {
  id: string;
  ticketNumber: string;
  subject: string;
  lastMessage: string;
  status: "open" | "pending" | "escalated" | "resolved";
  priority: "low" | "medium" | "high" | "urgent";
  channel: "whatsapp" | "email" | "web" | "sms" | "messenger" | "instagram";
  sentiment: "positive" | "neutral" | "negative" | "angry" | "frustrated";
  sentimentScore: number;
  aiConfidence: number;
  tags: string[];
  slaStatus: "ok" | "warning" | "breached" | "done";
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  unreadCount: number;
}

interface ChannelCount {
  channel: string;
  count: number;
}

interface InboxData {
  conversations: Conversation[];
  channelCounts: ChannelCount[];
  total: number;
}

const getChannelMeta = (t: (key: string) => string) => ({
  all: { name: t("inboxPage.allChannels"), icon: "📥", gradient: "from-slate-500 to-gray-600" },
  whatsapp: { name: "WhatsApp", icon: "📱", gradient: "from-green-500 to-emerald-600" },
  email: { name: "Email", icon: "📧", gradient: "from-purple-500 to-violet-600" },
  web: { name: t("dashboardPage.channels.web"), icon: "💬", gradient: "from-blue-500 to-indigo-600" },
  sms: { name: "SMS", icon: "💬", gradient: "from-amber-500 to-orange-600" },
  messenger: { name: "Messenger", icon: "💬", gradient: "from-blue-400 to-blue-600" },
  instagram: { name: "Instagram", icon: "📸", gradient: "from-pink-500 to-rose-600" },
});

const sentimentColor: Record<string, string> = {
  positive: "text-emerald-500",
  neutral: "text-gray-400",
  negative: "text-amber-500",
  angry: "text-red-500",
  frustrated: "text-orange-500",
};

const sentimentDot: Record<string, string> = {
  positive: "bg-emerald-500",
  neutral: "bg-gray-400",
  negative: "bg-amber-500",
  angry: "bg-red-500",
  frustrated: "bg-orange-500",
};

const sentimentBg: Record<string, string> = {
  positive: "bg-emerald-50 border-emerald-200",
  neutral: "bg-gray-50 border-gray-200",
  negative: "bg-amber-50 border-amber-200",
  angry: "bg-red-50 border-red-200",
  frustrated: "bg-orange-50 border-orange-200",
};

const getPriorityConfig = (t: (key: string) => string) => ({
  low: { bg: "bg-gray-100 text-gray-600", text: "text-gray-600", label: t("inboxPage.low") },
  medium: { bg: "bg-blue-100 text-blue-700", text: "text-blue-600", label: t("inboxPage.med") },
  high: { bg: "bg-orange-100 text-orange-700", text: "text-orange-600", label: t("inboxPage.high") },
  urgent: { bg: "bg-red-100 text-red-700", text: "text-red-600", label: t("inboxPage.urgent") },
});

const getStatusConfig = (t: (key: string) => string) => ({
  open: { bg: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", label: t("dashboardPage.status.open") },
  pending: { bg: "bg-amber-100 text-amber-700", dot: "bg-amber-500", label: t("dashboardPage.status.pending") },
  escalated: { bg: "bg-red-100 text-red-700", dot: "bg-red-500", label: t("dashboardPage.status.escalated") },
  resolved: { bg: "bg-gray-100 text-gray-600", dot: "bg-gray-400", label: t("dashboardPage.status.resolved") },
});

const getSlaConfig = (t: (key: string) => string) => ({
  ok: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: t("inboxPage.onTrack"), icon: "✓" },
  warning: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: t("inboxPage.atRisk"), icon: "⚠" },
  breached: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: t("inboxPage.breached"), icon: "✕" },
  done: { bg: "bg-gray-50 border-gray-200", text: "text-gray-600", label: t("inboxPage.completed"), icon: "✓" },
});

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string, t: (key: string) => string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return t("misc.justNow");
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

export default function InboxPage() {
  const { t } = useLang();
  const channelMeta = getChannelMeta(t);
  const priorityConfig = getPriorityConfig(t);
  const statusConfig = getStatusConfig(t);
  const slaConfig = getSlaConfig(t);
  const [inboxData, setInboxData] = useState<InboxData>({
    conversations: [],
    channelCounts: [],
    total: 0,
  });
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const realtimeUpdates = useRealtimeInbox();

  const fetchInbox = useCallback(async (channel?: string, search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (channel && channel !== "all") params.set("channel", channel);
      if (search) params.set("search", search);
      const res = await fetch(`/api/inbox${params.toString() ? `?${params}` : ""}`);
      const data: InboxData = await res.json();
      setInboxData(data);
      if (data.conversations.length > 0 && !selectedConversation) {
        setSelectedConversation(data.conversations[0]);
      }
    } catch {
      setInboxData({ conversations: [], channelCounts: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox(selectedChannel, searchQuery);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInbox(selectedChannel, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedChannel, searchQuery]);

  const handleRealtimeMessage = useCallback(
    (data: { conversationId?: string; message?: string }) => {
      if (data.conversationId) {
        setInboxData((prev) => ({
          ...prev,
          conversations: prev.conversations.map((c) =>
            c.id === data.conversationId
              ? { ...c, lastMessage: data.message || c.lastMessage, unreadCount: c.unreadCount + 1, updatedAt: new Date().toISOString() }
              : c
          ),
        }));
      }
    },
    []
  );

  realtimeUpdates.forEach(handleRealtimeMessage);

  const channelCounts: Record<string, number> = {};
  inboxData.channelCounts.forEach((cc) => {
    channelCounts[cc.channel] = cc.count;
  });
  const totalCount = inboxData.channelCounts.reduce((sum, cc) => sum + Number(cc.count), 0);

  const filteredConversations = inboxData.conversations;

  const handleSelectConversation = (c: Conversation) => {
    setSelectedConversation(c);
    if (c.unreadCount > 0) {
      setInboxData((prev) => ({
        ...prev,
        conversations: prev.conversations.map((conv) =>
          conv.id === c.id ? { ...conv, unreadCount: 0 } : conv
        ),
      }));
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-8 overflow-hidden animate-fade-in">
      {/* Left Panel - Channel Sidebar */}
      <div className="w-[72px] flex flex-col items-center py-5 gap-1.5 glassmorphism border-r border-white/30 shrink-0">
        {Object.entries(channelMeta).map(([id, meta]) => {
          const count = id === "all" ? totalCount : (channelCounts[id] || 0);
          const isActive = selectedChannel === id;
          return (
            <button
              key={id}
              onClick={() => setSelectedChannel(id)}
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition-all duration-300 hover-lift ${
                isActive
                  ? `bg-gradient-to-br ${meta.gradient} text-white shadow-lg shadow-blue-500/20 scale-110 animate-scale-in`
                  : "hover:bg-white/60 text-gray-500 hover:text-gray-700"
              }`}
              title={id === "all" ? t("inboxPage.allChannels") : meta.name}
            >
              {meta.icon}
              {count > 0 && (
                <span
                  className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 ${
                    isActive ? "bg-white/90 text-gray-800" : "bg-blue-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Middle Panel - Conversation List */}
      <div className="w-[340px] flex flex-col border-r border-white/30 glassmorphism shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-white/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gradient">{t("inboxPage.title")}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">{filteredConversations.length} {t("inboxPage.conversations")}</span>
              <button className="h-7 w-7 rounded-xl hover:bg-white/60 flex items-center justify-center text-gray-400 transition-all hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t("inboxPage.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-search"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`rounded-2xl bg-white/40 p-4 animate-pulse animate-stagger-in stagger-${i}`}>
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-full bg-gray-200/60 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200/60 rounded-full w-3/4" />
                      <div className="h-2.5 bg-gray-200/40 rounded-full w-full" />
                      <div className="h-2 bg-gray-200/30 rounded-full w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl mb-4">
                📭
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">{t("inboxPage.noConversations")}</p>
              <p className="text-xs text-gray-400">{t("inboxPage.adjustFilters")}</p>
            </div>
          ) : (
            filteredConversations.map((c, idx) => {
              const isSelected = selectedConversation?.id === c.id;
              const prio = priorityConfig[c.priority];
              const stat = statusConfig[c.status];
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectConversation(c)}
                  className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer border-b border-white/20 transition-all duration-200 animate-fade-in animate-stagger-in stagger-${Math.min(idx + 1, 8)} ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border-l-[3px] border-l-blue-600 shadow-sm"
                      : "hover:bg-white/40 border-l-[3px] border-l-transparent"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                        : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600"
                    }`}>
                      {getInitials(c.customerName)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-gradient-to-br ${
                      channelMeta[c.channel]?.gradient || "from-gray-400 to-gray-500"
                    }`} />
                    {c.status === "open" && (
                      <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-gray-900 truncate">{c.customerName}</span>
                      <span className="text-[11px] text-gray-400 shrink-0 ml-2 font-medium">{timeAgo(c.updatedAt, t)}</span>
                    </div>
                    <div className="text-xs text-gray-500 truncate mb-1.5 leading-relaxed">{c.lastMessage}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`h-2 w-2 rounded-full ${sentimentDot[c.sentiment]}`} />
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${prio.bg}`}>{prio.label}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${stat.bg}`}>{stat.label}</span>
                      {c.tags.slice(0, 1).map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/60 text-gray-500 font-medium">{tag}</span>
                      ))}
                    </div>
                  </div>
                  {c.unreadCount > 0 && (
                    <div className="h-5 min-w-[20px] rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 px-1.5 shadow-lg shadow-blue-500/30">
                      {c.unreadCount}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Panel - Conversation View */}
      <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-sm min-w-0">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/30 glassmorphism animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                    {getInitials(selectedConversation.customerName)}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-gradient-to-br ${
                    channelMeta[selectedConversation.channel]?.gradient || "from-gray-400 to-gray-500"
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{selectedConversation.customerName}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-500 font-medium">{selectedConversation.customerCompany}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{selectedConversation.customerEmail}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${
                        channelMeta[selectedConversation.channel]?.gradient || "from-gray-400 to-gray-500"
                      }`} />
                      {selectedConversation.channel}
                    </span>
                    <span>·</span>
                    <span className="text-gray-300">{selectedConversation.ticketNumber}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${sentimentBg[selectedConversation.sentiment]}`}>
                  <span className={sentimentColor[selectedConversation.sentiment]}>●</span>{" "}
                  {selectedConversation.sentiment} ({selectedConversation.sentimentScore > 0 ? "+" : ""}{selectedConversation.sentimentScore})
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
                  AI: {selectedConversation.aiConfidence}%
                </div>
                <button className="btn-ghost text-xs">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {t("inboxPage.assign")}
                </button>
                <button className="btn-ghost text-xs">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  {t("inboxPage.save")}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin gradient-mesh">
              <div className="flex justify-start animate-fade-in animate-stagger-in stagger-1">
                <div className="max-w-[70%]">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-white/60">
                    <div className="text-sm text-gray-900 leading-relaxed">{selectedConversation.lastMessage}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[11px] text-gray-400">{timeAgo(selectedConversation.updatedAt, t)} ago</span>
                    <span className="text-[11px] text-gray-300">·</span>
                    <span className="text-[11px] text-gray-400 capitalize">{selectedConversation.channel}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end animate-fade-in animate-stagger-in stagger-2">
                <div className="max-w-[70%]">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg shadow-blue-500/20">
                    <div className="flex items-center gap-1.5 text-xs text-blue-200 mb-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-300 animate-pulse" />
                      {t("inboxPage.aiResolutionAgent")}
                    </div>
                    <div className="text-sm leading-relaxed">
                      {t("inboxPage.aiDemoResponse")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1 justify-end">
                    <span className="text-[11px] text-emerald-500 font-semibold">{t("inboxPage.qaVerified")}</span>
                    <span className="text-[11px] text-gray-400">{t("misc.justNow")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-white/30 p-4 glassmorphism">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    rows={1}
                    placeholder={t("inboxPage.messagePlaceholder")}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <button className="h-7 w-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    <button className="h-7 w-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary text-xs">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t("inboxPage.aiAssist")}
                  </button>
                  <button className="btn-primary text-xs">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {t("inboxPage.send")}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 px-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {t("inboxPage.aiSuggestions")}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t("inboxPage.autoSave")}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center animate-fade-in">
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-3xl mx-auto mb-4 animate-scale-in">
                💬
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">{t("inboxPage.selectConversation")}</p>
              <p className="text-xs text-gray-400">{t("inboxPage.chooseFromList")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - AI Insights & Customer Info */}
      <div className="w-[300px] flex flex-col overflow-y-auto scrollbar-thin border-l border-white/30 glassmorphism shrink-0">
        {selectedConversation && (
          <>
            {/* Customer Info */}
            <div className="p-4 border-b border-white/30 animate-fade-in animate-stagger-in stagger-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t("misc.customer")}</div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                  {getInitials(selectedConversation.customerName)}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{selectedConversation.customerName}</div>
                  <div className="text-xs text-gray-500">{selectedConversation.customerEmail}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl p-2.5 card-premium-blue">
                  <div className="text-gray-400 mb-0.5 text-[10px] font-medium">{t("inboxPage.company")}</div>
                  <div className="font-bold text-gray-900 truncate">{selectedConversation.customerCompany}</div>
                </div>
                <div className="rounded-xl p-2.5 card-premium-green">
                  <div className="text-gray-400 mb-0.5 text-[10px] font-medium">{t("dashboardPage.th.status")}</div>
                  <div className="font-bold text-gray-900 capitalize">{selectedConversation.status}</div>
                </div>
                <div className="rounded-xl p-2.5 card-premium-purple">
                  <div className="text-gray-400 mb-0.5 text-[10px] font-medium">{t("dashboardPage.th.priority")}</div>
                  <div className="font-bold text-gray-900 capitalize">{selectedConversation.priority}</div>
                </div>
                <div className="rounded-xl p-2.5 card-premium-amber">
                  <div className="text-gray-400 mb-0.5 text-[10px] font-medium">{t("ticketsPage.title")}</div>
                  <div className="font-bold text-gray-900">1</div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="p-4 border-b border-white/30 animate-fade-in animate-stagger-in stagger-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t("inboxPage.aiInsights")}</div>
              <div className="space-y-2.5">
                <div className={`rounded-xl p-3 border ${sentimentBg[selectedConversation.sentiment]} hover-lift`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{t("inboxPage.sentiment")}</span>
                    <span className={`text-sm font-bold ${sentimentColor[selectedConversation.sentiment]}`}>
                      {selectedConversation.sentimentScore > 0 ? "+" : ""}{selectedConversation.sentimentScore}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 capitalize">{selectedConversation.sentiment} · {t("inboxPage.trendStable")}</div>
                </div>
                <div className="rounded-xl card-premium-blue p-3 hover-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{t("dashboardPage.aiConfidence")}</span>
                    <span className="text-sm font-bold text-blue-700">{selectedConversation.aiConfidence}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-blue-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000"
                      style={{ width: `${selectedConversation.aiConfidence}%` }}
                    />
                  </div>
                </div>
                <div className={`rounded-xl p-3 border ${slaConfig[selectedConversation.slaStatus]?.bg || "bg-gray-50 border-gray-200"} hover-lift`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{t("inboxPage.slaStatus")}</span>
                    <span className={`text-sm font-bold ${slaConfig[selectedConversation.slaStatus]?.text || "text-gray-600"}`}>
                      {slaConfig[selectedConversation.slaStatus]?.icon} {slaConfig[selectedConversation.slaStatus]?.label || selectedConversation.slaStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggested Actions */}
            <div className="p-4 border-b border-white/30 animate-fade-in animate-stagger-in stagger-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t("inboxPage.suggestedActions")}</div>
              <div className="space-y-2">
                <button className="w-full text-left rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-3 text-sm hover:bg-white/80 hover:border-blue-200 transition-all duration-300 group hover-lift">
                  <div className="flex items-center gap-2.5">
                    <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">🔑</span>
                    <div>
                      <div className="font-semibold text-gray-900">{t("inboxPage.actionPasswordReset")}</div>
                      <div className="text-xs text-gray-400">{t("inboxPage.actionPasswordResetDesc")}</div>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-3 text-sm hover:bg-white/80 hover:border-purple-200 transition-all duration-300 group hover-lift">
                  <div className="flex items-center gap-2.5">
                    <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-sm shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">💰</span>
                    <div>
                      <div className="font-semibold text-gray-900">{t("inboxPage.actionBillingCredit")}</div>
                      <div className="text-xs text-gray-400">{t("inboxPage.actionBillingCreditDesc")}</div>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-3 text-sm hover:bg-white/80 hover:border-amber-200 transition-all duration-300 group hover-lift">
                  <div className="flex items-center gap-2.5">
                    <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">📋</span>
                    <div>
                      <div className="font-semibold text-gray-900">{t("inboxPage.actionBillingHistory")}</div>
                      <div className="text-xs text-gray-400">{t("inboxPage.actionBillingHistoryDesc")}</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Conversation Tags */}
            <div className="p-4 animate-fade-in animate-stagger-in stagger-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t("inboxPage.tags")}</div>
              <div className="flex flex-wrap gap-2">
                {selectedConversation.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 px-2.5 py-1 text-xs font-semibold text-gray-600 hover-lift">
                    {tag}
                    <button className="hover:text-gray-900 transition-colors">×</button>
                  </span>
                ))}
                <button className="inline-flex items-center gap-1 rounded-xl border border-dashed border-gray-300/60 px-2.5 py-1 text-xs font-medium text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-all duration-300">
                  {t("inboxPage.addTag")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
