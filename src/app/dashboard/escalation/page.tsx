"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/context";

interface Escalation {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  channel: string;
  sentiment: string;
  sentimentScore: number;
  slaStatus: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerCompany: string;
  assigneeName: string;
}

const priorityColor: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const statusColor: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  escalated: "bg-blue-100 text-blue-700",
  "in-progress": "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
};

const sentimentIcon: Record<string, string> = {
  positive: "😊",
  neutral: "😐",
  negative: "😟",
  angry: "😡",
  frustrated: "😤",
};

function timeAgo(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return t("misc.justNow");
  if (minutes < 60) return `${minutes} ${t("misc.minAgo")}`;
  if (hours < 24) return `${hours} ${t("misc.hoursAgo")}`;
  return `${days} ${t("misc.daysAgo")}`;
}

export default function EscalationPage() {
  const { t } = useLang();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [stats, setStats] = useState({ totalEscalated: 0, pending: 0, slaBreached: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/escalation")
      .then((res) => res.json())
      .then((data) => {
        setEscalations(data.escalations || []);
        setStats(data.stats || { totalEscalated: 0, pending: 0, slaBreached: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-blue-400 opacity-30" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 bg-clip-text text-transparent">
            {t("escalationPage.title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {escalations.length} {t("escalationPage.fromDatabase")}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            label: t("escalationPage.escalated"),
            value: stats.totalEscalated,
            icon: "🚨",
            gradient: "from-red-500 to-rose-600",
            cardClass: "card-premium-red",
            delay: "0",
          },
          {
            label: t("escalationPage.slaBreached"),
            value: stats.slaBreached,
            icon: "⚠️",
            gradient: "from-amber-400 to-orange-500",
            cardClass: "card-premium-amber",
            delay: "100",
          },
          {
            label: t("escalationPage.totalEscalations"),
            value: stats.totalEscalated,
            icon: "📊",
            gradient: "from-blue-500 to-indigo-600",
            cardClass: "card-premium-blue",
            delay: "200",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`hover-lift rounded-2xl p-5 group ${s.cardClass} border border-white/20 animate-slide-up`}
            style={{ animationDelay: `${s.delay}ms` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`h-11 w-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-lg text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 animate-bounce-in`}
              >
                {s.icon}
              </div>
              <span className="text-xs text-gray-600 font-semibold uppercase tracking-wider">
                {s.label}
              </span>
            </div>
            <div className="text-3xl font-extrabold text-gradient">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* AI Routing Rules */}
      <div className="glass-card rounded-2xl border border-white/30 overflow-hidden animate-slide-up" style={{ animationDelay: "300ms" }}>
        {/* Gradient Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg animate-bounce-in">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gradient">
                {t("escalationPage.aiRoutingRules")}
              </h3>
              <p className="text-xs text-gray-500">
                {t("escalationPage.aiRoutingDesc")}
              </p>
            </div>
          </div>
        </div>
        {/* Rules Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {[
            { trigger: "Sentiment < -0.5", action: "Route to senior agent", priority: "High", active: true },
            { trigger: "Billing dispute detected", action: "Route to Billing team", priority: "High", active: true },
            { trigger: "Technical bug confirmed", action: "Route to Engineering", priority: "Medium", active: true },
            { trigger: "VIP customer", action: "Priority routing", priority: "Critical", active: true },
            { trigger: "AI confidence < 60%", action: "Route to human", priority: "Medium", active: true },
            { trigger: "Legal/compliance keywords", action: "Route to Legal team", priority: "Critical", active: false },
          ].map((r, i) => (
            <div
              key={i}
              className="glass-card-inner flex items-start gap-3 p-4 rounded-xl border border-white/30 hover-lift cursor-pointer animate-fade-in"
              style={{ animationDelay: `${350 + i * 50}ms` }}
            >
              {/* Active Indicator */}
              <div className="relative mt-1 shrink-0">
                <div
                  className={`h-3 w-3 rounded-full ${
                    r.active
                      ? "bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"
                      : "bg-gray-300"
                  }`}
                />
                {r.active && (
                  <div className="absolute inset-0 h-3 w-3 rounded-full bg-green-400 animate-ping opacity-40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 mb-0.5 truncate">
                  {r.trigger}
                </div>
                <div className="text-xs text-gray-500 mb-2">{r.action}</div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    priorityColor[r.priority.toLowerCase()]
                  }`}
                >
                  {r.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Escalation Queue */}
      <div
        className="glass-card rounded-2xl border border-white/30 overflow-hidden animate-slide-up"
        style={{ animationDelay: "400ms" }}
      >
        {/* Queue Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-500/10 via-rose-500/10 to-pink-500/10 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg animate-bounce-in">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gradient">
                {t("escalationPage.queue")}
              </h3>
            </div>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100/50 px-3 py-1 rounded-full">
              {escalations.length} {t("misc.tickets")}
            </span>
          </div>
        </div>

        {/* Queue Items */}
        <div className="divide-y divide-white/10">
          {escalations.map((e) => (
            <div
              key={e.id}
              className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 px-6 py-4 hover:bg-white/30 transition-all duration-300 group cursor-pointer"
            >
              {/* Sentiment Icon */}
              <div className="text-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 shrink-0">
                {sentimentIcon[e.sentiment] || "😐"}
              </div>

              {/* Ticket Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Link
                    href={`/dashboard/tickets/${e.ticketNumber.replace(
                      "SSV-",
                      ""
                    )}`}
                    className="text-xs font-mono text-gray-400 hover:text-blue-600 transition-colors duration-200"
                  >
                    {e.ticketNumber}
                  </Link>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      priorityColor[e.priority]
                    }`}
                  >
                    {e.priority}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      statusColor[e.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {e.status}
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                  {e.subject}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {e.customerName || t("misc.unknown")} · {e.customerCompany || ""}
                </div>
              </div>

              {/* Right Side */}
              <div className="hidden sm:flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-xs text-gray-400 mb-1">
                    {timeAgo(e.createdAt, t)}
                  </div>
                  {e.assigneeName && (
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">{t("escalationPage.assigned")}</span>{" "}
                      <span className="font-semibold text-blue-600">
                        {e.assigneeName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hover Action Buttons */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <button className="btn-ghost text-xs hover:bg-white/50 rounded-lg px-3 py-1.5 transition-all duration-200">
                    {t("escalationPage.assign")}
                  </button>
                  <button className="btn-primary text-xs shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg px-3 py-1.5">
                    {t("escalationPage.accept")}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {escalations.length === 0 && (
            <div className="px-6 py-16 text-center animate-fade-in">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 text-white text-3xl shadow-lg shadow-green-500/30 mb-4 animate-bounce-in">
                ✅
              </div>
              <h3 className="text-lg font-bold text-gradient mb-2">
                {t("escalationPage.allClear")}
              </h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                {t("escalationPage.allClearDesc")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
