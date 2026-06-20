"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n/context";

interface AnalyticsData {
  stats: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    escalatedTickets: number;
    avgConfidence: number;
    avgCsat: number;
    slaBreached: number;
    totalCustomers: number;
  };
  channelCounts: { channel: string; count: number }[];
  sentimentCounts: { sentiment: string; count: number }[];
  priorityCounts: { priority: string; count: number }[];
}

const getChannelDisplayNames = (t: (key: string) => string): Record<string, string> => ({
  whatsapp: t("dashboardPage.channels.whatsapp"),
  email: t("dashboardPage.channels.email"),
  web: t("dashboardPage.channels.web"),
  sms: t("dashboardPage.channels.sms"),
  messenger: t("dashboardPage.channels.messenger"),
  instagram: t("dashboardPage.channels.instagram"),
});

const channelColors: Record<string, string> = {
  whatsapp: "bg-green-500",
  email: "bg-purple-500",
  web: "bg-blue-500",
  sms: "bg-amber-500",
  messenger: "bg-blue-400",
  instagram: "bg-pink-500",
};

export default function AnalyticsPage() {
  const { t } = useLang();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-blue-600 border-r-purple-600 shadow-lg shadow-blue-500/20" />
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-transparent border-t-blue-400 opacity-30" />
        </div>
      </div>
    );
  }

  const { stats, channelCounts, sentimentCounts } = data;
  const totalTickets = stats.totalTickets;
  const resolutionRate = totalTickets > 0 ? Math.round((stats.resolvedTickets / totalTickets) * 100) : 0;
  const totalChannelTickets = channelCounts.reduce((sum, c) => sum + c.count, 0);
  const totalSentiment = sentimentCounts.reduce((sum, s) => sum + s.count, 0);

  const kpis = [
    { label: t("analyticsPage.totalTickets"), value: totalTickets.toLocaleString(), icon: "🎫", cardBg: "card-premium-blue" },
    { label: t("analyticsPage.openTickets"), value: stats.openTickets.toLocaleString(), icon: "📂", cardBg: "card-premium-green" },
    { label: t("analyticsPage.resolutionRate"), value: `${resolutionRate}%`, icon: "✅", cardBg: "card-premium-purple" },
    { label: t("analyticsPage.csatScore"), value: `${(stats.avgCsat || 0).toFixed(1)}/5`, icon: "⭐", cardBg: "card-premium-amber" },
    { label: t("analyticsPage.aiConfidence"), value: `${Math.round(stats.avgConfidence || 0)}%`, icon: "🤖", cardBg: "card-premium-red" },
    { label: t("analyticsPage.slaBreached"), value: stats.slaBreached.toLocaleString(), icon: "⚠️", cardBg: "card-premium-cyan" },
  ];

  const sentimentLabels: Record<string, string> = {
    positive: t("dashboardPage.sentiment.positive"),
    neutral: t("dashboardPage.sentiment.neutral"),
    negative: t("dashboardPage.sentiment.negative"),
  };

  const sentimentEmojis: Record<string, string> = {
    positive: "😊",
    neutral: "😐",
    negative: "😟",
    angry: "😠",
    frustrated: "😤",
  };

  const sentimentGradients: Record<string, string> = {
    positive: "from-green-400 to-emerald-500",
    neutral: "from-gray-300 to-gray-400",
    negative: "from-amber-400 to-orange-500",
    angry: "from-red-400 to-rose-600",
    frustrated: "from-orange-400 to-red-500",
  };

  const aiMetrics = [
    {
      label: t("analyticsPage.aiConfidence"),
      value: `${Math.round(stats.avgConfidence || 0)}%`,
      width: `${stats.avgConfidence || 0}%`,
      gradient: "from-blue-500 to-indigo-600",
      glow: "shadow-blue-500/30",
    },
    {
      label: t("analyticsPage.csatScore"),
      value: `${(stats.avgCsat || 0).toFixed(1)}/5`,
      width: `${((stats.avgCsat || 0) / 5) * 100}%`,
      gradient: "from-purple-500 to-pink-600",
      glow: "shadow-purple-500/30",
    },
    {
      label: t("analyticsPage.resolutionRate"),
      value: `${resolutionRate}%`,
      width: `${resolutionRate}%`,
      gradient: "from-green-400 to-emerald-500",
      glow: "shadow-green-500/30",
    },
    {
      label: t("analyticsPage.slaCompliance"),
      value: `${totalTickets > 0 ? Math.round(((totalTickets - stats.slaBreached) / totalTickets) * 100) : 100}%`,
      width: `${totalTickets > 0 ? ((totalTickets - stats.slaBreached) / totalTickets) * 100 : 100}%`,
      gradient: "from-teal-400 to-cyan-500",
      glow: "shadow-teal-500/30",
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t("analyticsPage.title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t("analyticsPage.subtitle")}</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((s, i) => (
          <div
            key={s.label}
            className={`animate-fade-in-up ${s.cardBg} rounded-3xl border border-white/20 p-5 group hover-lift cursor-default transition-all duration-300`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">
                {s.icon}
              </span>
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1 drop-shadow-md">{s.value}</div>
            <div className="text-xs text-white/70 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Channel Performance */}
      {channelCounts.length > 0 && (
        <div className="rounded-3xl border border-white/20 p-6 card-premium-blue backdrop-blur-xl bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent shadow-xl hover-lift transition-all duration-300">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{t("analyticsPage.channelPerformance")}</h3>
              <p className="text-xs text-gray-500">{t("analyticsPage.channelPerformanceDesc")}</p>
            </div>
          </div>
          <div className="space-y-3 mt-5">
            {channelCounts.map((ch, idx) => {
              const pct = totalChannelTickets > 0 ? Math.round((ch.count / totalChannelTickets) * 100) : 0;
              return (
                <div
                  key={ch.channel}
                  className="flex items-center gap-3 group"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="hidden sm:flex w-28 items-center gap-2 shrink-0">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      {getChannelDisplayNames(t)[ch.channel] || ch.channel}
                    </span>
                  </div>
                  <div className="flex-1 h-10 bg-gray-100/80 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      className={`h-full ${channelColors[ch.channel] || "bg-gray-500"} rounded-full flex items-center pl-3 transition-all duration-700 ease-out shadow-inner`}
                      style={{ width: `${Math.max(pct * 3.5, 12)}%` }}
                    >
                      <span className="text-xs font-bold text-white drop-shadow-md">{ch.count}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-500 w-12 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sentiment & AI Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sentiment Distribution */}
        {sentimentCounts.length > 0 && (
          <div className="rounded-3xl border border-white/20 p-6 card-premium-purple backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-transparent shadow-xl hover-lift transition-all duration-300">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{t("analyticsPage.sentimentDistribution")}</h3>
              <p className="text-xs text-gray-500">{t("analyticsPage.sentimentDesc")}</p>
            </div>
            </div>
            <div className="space-y-3 mt-5">
              {sentimentCounts.map((s) => {
                const pct = totalSentiment > 0 ? Math.round((s.count / totalSentiment) * 100) : 0;
                return (
                  <div key={s.sentiment} className="flex items-center gap-3 group">
                    <span className="w-24 text-sm font-medium text-gray-600 capitalize flex items-center gap-1.5">
                      <span className="text-lg">{sentimentEmojis[s.sentiment] || "😐"}</span>
                      <span className="group-hover:text-gray-900 transition-colors">{sentimentLabels[s.sentiment] || s.sentiment}</span>
                    </span>
                    <div className="flex-1 h-10 bg-gray-100/80 rounded-full overflow-hidden backdrop-blur-sm">
                      <div
                        className={`h-full bg-gradient-to-r ${sentimentGradients[s.sentiment] || "from-gray-300 to-gray-400"} rounded-full flex items-center pl-3 transition-all duration-700 ease-out shadow-inner`}
                        style={{ width: `${Math.max(pct * 2.2, 12)}%` }}
                      >
                        <span className="text-xs font-bold text-white drop-shadow-md">{s.count}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-500 w-12 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Performance */}
        <div className="rounded-3xl border border-white/20 p-6 card-premium-green backdrop-blur-xl bg-gradient-to-br from-green-500/10 via-emerald-600/5 to-transparent shadow-xl hover-lift transition-all duration-300">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{t("analyticsPage.aiPerformance")}</h3>
              <p className="text-xs text-gray-500">{t("analyticsPage.agentMetrics")}</p>
            </div>
          </div>
          <div className="space-y-4 mt-5">
            {aiMetrics.map((m) => (
              <div key={m.label} className="group">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">{m.label}</span>
                  <span className="font-bold text-gray-900">{m.value}</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100/80 overflow-hidden backdrop-blur-sm">
                  <div
                    className={`h-full bg-gradient-to-r ${m.gradient} rounded-full transition-all duration-700 ease-out shadow-lg ${m.glow}`}
                    style={{ width: m.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
