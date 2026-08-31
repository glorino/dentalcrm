"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";

interface ClinicPulse {
  activePatients: number;
  appointmentsToday: number;
  avgWaitTime: number;
  occupancyRate: number;
  revenueToday: number;
  ticketsOpen: number;
  aiResolutionRate: number;
  patientSatisfaction: number;
}

interface AIPerformance {
  totalConversations: number;
  autoResolved: number;
  escalated: number;
  avgConfidence: number;
  avgResponseTime: string;
  topIntents: { intent: string; count: number }[];
}

interface NoShowRiskItem {
  patient: string;
  risk: number;
  appointment: string;
}

interface ChurnRiskItem {
  patient: string;
  risk: number;
  lastVisit: string;
}

interface PredictiveInsights {
  noShowRisk: NoShowRiskItem[];
  churnRisk: ChurnRiskItem[];
  revenueForecast: number[];
  alerts: PredictiveAlert[];
}

interface PredictiveAlert {
  type: string;
  message: string;
  urgency: string;
}

interface PatientLifecycle {
  newPatientsThisMonth: number;
  returningPatients: number;
  atRiskPatients: number;
  loyaltyDistribution: { tier: string; count: number }[];
  recallDue: number;
}

interface IntelligenceData {
  clinicPulse: ClinicPulse;
  aiPerformance: AIPerformance;
  predictiveInsights: PredictiveInsights;
  patientLifecycle: PatientLifecycle;
}

const urgencyColor: Record<string, string> = {
  critical: "bg-red-100/80 text-red-700 border-red-200/60",
  high: "bg-orange-100/80 text-orange-700 border-orange-200/60",
  medium: "bg-amber-100/80 text-amber-700 border-amber-200/60",
  low: "bg-green-100/80 text-green-700 border-green-200/60",
};

const urgencyDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

const alertIcon: Record<string, string> = {
  no_show: "⚠️",
  churn: "🔴",
  revenue: "💰",
  recall: "📋",
  sentiment: "😊",
  sla: "⏰",
  default: "🔔",
};

const riskColor = (risk: number) => {
  if (risk >= 70) return { bg: "bg-red-50", text: "text-red-700", bar: "from-red-400 to-red-600", dot: "bg-red-500" };
  if (risk >= 40) return { bg: "bg-amber-50", text: "text-amber-700", bar: "from-amber-400 to-orange-500", dot: "bg-amber-500" };
  return { bg: "bg-green-50", text: "text-green-700", bar: "from-green-400 to-emerald-500", dot: "bg-green-500" };
};

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-200" />
        <div className="w-8 h-8 rounded-full bg-gray-100" />
      </div>
      <div className="h-8 w-20 bg-gray-200 rounded-lg mb-2" />
      <div className="h-4 w-32 bg-gray-100 rounded" />
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gray-200" />
        <div>
          <div className="h-5 w-40 bg-gray-200 rounded mb-1" />
          <div className="h-3 w-56 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function IntelligencePage() {
  const { t } = useLang();
  const { user } = useAuth();
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ai/intelligence", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(true);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-9 w-64 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-80 bg-gray-100 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonSection />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <SkeletonSection key={i} />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No data available</h3>
        <p className="text-sm text-gray-500">Intelligence data will appear here once available.</p>
      </div>
    );
  }

  const { clinicPulse, aiPerformance, predictiveInsights, patientLifecycle } = data;

  const clinicPulseCards = [
    {
      label: t("intelligencePage.activePatients"),
      value: clinicPulse.activePatients.toLocaleString(),
      trend: "+12%",
      trendUp: true,
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      cardClass: "card-premium-blue",
    },
    {
      label: t("intelligencePage.appointmentsToday"),
      value: clinicPulse.appointmentsToday.toLocaleString(),
      trend: `${Math.min(clinicPulse.appointmentsToday * 12, 100)}% occupancy`,
      trendUp: true,
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      gradient: "from-emerald-500 via-green-500 to-teal-600",
      cardClass: "card-premium-green",
    },
    {
      label: t("intelligencePage.revenueToday"),
      value: `₦${clinicPulse.revenueToday.toLocaleString()}`,
      trend: "+8% vs yesterday",
      trendUp: true,
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      gradient: "from-amber-400 via-orange-500 to-red-500",
      cardClass: "card-premium-amber",
    },
    {
      label: t("intelligencePage.aiResolution"),
      value: `${clinicPulse.aiResolutionRate}%`,
      trend: clinicPulse.aiResolutionRate >= 60 ? "Healthy" : "Needs attention",
      trendUp: clinicPulse.aiResolutionRate >= 60,
      icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      gradient: "from-cyan-500 via-blue-500 to-indigo-600",
      cardClass: "card-premium-cyan",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t("intelligencePage.title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t("intelligencePage.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50/80 border border-green-200/60">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-700">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {clinicPulseCards.map((card, i) => (
          <div
            key={card.label}
            className={`rounded-3xl border border-white/20 p-5 group hover:-translate-y-1 hover:shadow-2xl transition-all duration-500 ${card.cardClass}`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${card.trendUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                <svg className={`w-3 h-3 ${card.trendUp ? "" : "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {card.trend}
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{card.value}</div>
            <div className="text-xs text-gray-500 font-medium">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/20 p-6 bg-white/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{t("intelligencePage.aiPerformance")}</h3>
            <p className="text-xs text-gray-500">Last 30 days</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Conversations</div>
            <div className="text-2xl font-bold text-gray-900">{aiPerformance.totalConversations.toLocaleString()}</div>
          </div>
          <div className="relative">
            <div className="text-sm text-gray-500 mb-1">Auto-Resolved vs Escalated</div>
            <div className="flex items-center gap-4 mt-3">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" className="stroke-gray-100" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    className="stroke-emerald-500"
                    strokeWidth="3"
                    strokeDasharray={`${aiPerformance.totalConversations > 0 ? (aiPerformance.autoResolved / aiPerformance.totalConversations) * 94.25 : 0} 94.25`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">
                  {aiPerformance.totalConversations > 0 ? Math.round((aiPerformance.autoResolved / aiPerformance.totalConversations) * 100) : 0}%
                </div>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Auto: {aiPerformance.autoResolved}</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Escalated: {aiPerformance.escalated}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Avg Confidence</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{Math.round(aiPerformance.avgConfidence)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${aiPerformance.avgConfidence}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Top Intents</div>
            <div className="space-y-2 mt-3">
              {aiPerformance.topIntents.slice(0, 4).map((item) => {
                const maxCount = Math.max(...aiPerformance.topIntents.map((i) => i.count));
                return (
                  <div key={item.intent} className="flex items-center gap-2">
                    <div className="w-20 text-xs text-gray-600 truncate">{item.intent}</div>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                        style={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 w-6 text-right">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-white/20 p-6 bg-white/80 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">{t("intelligencePage.noShowRisk")}</h3>
          </div>
          <div className="space-y-3">
            {predictiveInsights.noShowRisk.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-4">No upcoming appointments</div>
            )}
            {predictiveInsights.noShowRisk.slice(0, 5).map((item, idx) => {
              const rc = riskColor(item.risk);
              return (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${rc.bg} border border-white/40`}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{item.patient}</div>
                    <div className="text-xs text-gray-500">{new Date(item.appointment).toLocaleDateString()}</div>
                  </div>
                  <div className={`text-sm font-bold ${rc.text}`}>{item.risk}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-white/20 p-6 bg-white/80 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">{t("intelligencePage.churnRisk")}</h3>
          </div>
          <div className="space-y-3">
            {predictiveInsights.churnRisk.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-4">No churn risk data</div>
            )}
            {predictiveInsights.churnRisk.slice(0, 5).map((item, idx) => {
              const rc = riskColor(item.risk);
              return (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${rc.bg} border border-white/40`}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{item.patient}</div>
                    <div className="text-xs text-gray-500">Last visit: {item.lastVisit !== "Unknown" ? new Date(item.lastVisit).toLocaleDateString() : "N/A"}</div>
                  </div>
                  <div className={`text-sm font-bold ${rc.text}`}>{item.risk}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-white/20 p-6 bg-white/80 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">{t("intelligencePage.revenueForecast")}</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-4">
            ₦{(predictiveInsights.revenueForecast.reduce((a, b) => a + b, 0)).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mb-3">7-day forecast</div>
          <div className="flex items-end gap-1 h-24">
            {predictiveInsights.revenueForecast.slice(0, 7).map((val, idx) => {
              const maxVal = Math.max(...predictiveInsights.revenueForecast.slice(0, 7), 1);
              const height = (val / maxVal) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-500 hover:from-blue-600 hover:to-cyan-500"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[9px] text-gray-400">D{idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/20 p-6 bg-white/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900">{t("intelligencePage.patientLifecycle")}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-3">New vs Returning</div>
            <div className="relative w-20 h-20 mx-auto">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" className="stroke-blue-100" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  className="stroke-blue-500"
                  strokeWidth="3"
                  strokeDasharray={`${(patientLifecycle.newPatientsThisMonth / Math.max(patientLifecycle.newPatientsThisMonth + patientLifecycle.returningPatients, 1)) * 94.25} 94.25`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">
                {patientLifecycle.newPatientsThisMonth + patientLifecycle.returningPatients}
              </div>
            </div>
            <div className="text-center mt-3 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs"><span className="w-2 h-2 rounded-full bg-blue-500" />New: {patientLifecycle.newPatientsThisMonth}</div>
              <div className="flex items-center justify-center gap-1.5 text-xs"><span className="w-2 h-2 rounded-full bg-blue-100" />Returning: {patientLifecycle.returningPatients}</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-3">At-Risk Patients</div>
            <div className="text-3xl font-bold text-red-600 text-center">{patientLifecycle.atRiskPatients}</div>
            <div className="text-xs text-gray-500 text-center mt-1">needing attention</div>
          </div>

          <div className="sm:col-span-2">
            <div className="text-sm text-gray-500 mb-3">Loyalty Distribution</div>
            <div className="space-y-3">
              {patientLifecycle.loyaltyDistribution.map((tier) => {
                const total = patientLifecycle.loyaltyDistribution.reduce((sum, t) => sum + t.count, 0);
                const pct = total > 0 ? Math.round((tier.count / total) * 100) : 0;
                const tierColors: Record<string, string> = {
                  Platinum: "from-slate-300 to-slate-400",
                  Gold: "from-amber-400 to-yellow-500",
                  Silver: "from-gray-300 to-gray-400",
                  Bronze: "from-orange-300 to-orange-400",
                };
                return (
                  <div key={tier.tier}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{tier.tier}</span>
                      <span className="text-gray-500">{tier.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${tierColors[tier.tier] || "from-gray-300 to-gray-400"} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {patientLifecycle.recallDue > 0 && (
          <div className="mt-6 flex items-center justify-between p-4 bg-amber-50/80 rounded-2xl border border-amber-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{patientLifecycle.recallDue} patients due for recall</div>
                <div className="text-xs text-gray-500">Action needed</div>
              </div>
            </div>
            <button className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors">
              View List
            </button>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/20 p-6 bg-white/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900">{t("intelligencePage.alerts")}</h3>
        </div>
        <div className="space-y-3">
          {predictiveInsights.alerts.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-6">No alerts at this time</div>
          )}
          {predictiveInsights.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-4 p-4 rounded-xl border ${urgencyColor[alert.urgency] || urgencyColor.medium} transition-all duration-300 hover:shadow-md`}
            >
              <span className="text-2xl">{alertIcon[alert.type] || alertIcon.default}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{alert.message}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`w-2 h-2 rounded-full ${urgencyDot[alert.urgency] || urgencyDot.medium} animate-pulse`} />
                <span className="text-xs font-semibold capitalize">{alert.urgency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
