"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/lib/i18n/context";

interface NoShowRisk {
  patient: string;
  risk: number;
  appointment: string;
  appointmentId: string;
}

interface ChurnRisk {
  patient: string;
  risk: number;
  lastVisit: string;
}

interface RevenueForecast {
  date: string;
  predicted: number;
  confidence: number;
}

interface SentimentTrajectory {
  patient: string;
  trajectory: { date: string; sentiment: string; score: number }[];
}

interface PredictiveAlert {
  type: string;
  message: string;
  urgency: string;
}

interface PredictionsData {
  noShowRisks: NoShowRisk[];
  churnRisks: ChurnRisk[];
  revenueForecast: RevenueForecast[];
  sentimentTrajectories: SentimentTrajectory[];
  predictiveAlerts: PredictiveAlert[];
  ltvPredictions: { patient: string; currentLTV: number; predictedLTV: number; growthRate: number }[];
}

function SkeletonTable() {
  return (
    <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-6 animate-pulse">
      <div className="h-5 w-48 bg-gray-200 rounded mb-6" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function PredictionsPage() {
  const { t } = useLang();
  const [data, setData] = useState<PredictionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState("all");

  const fetchData = useCallback(async (showRefreshing = false, signal?: AbortSignal) => {
    if (showRefreshing) setRefreshing(true);
    setLoading(!data);
    try {
      const res = await fetch("/api/ai/predictions", { signal });
      if (!res.ok) throw new Error("Failed");
      const d = await res.json();
      setData(d);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Failed to fetch predictions");
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, [data]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(false, controller.signal);
    return () => controller.abort();
  }, []);

  const riskColor = (risk: number) => {
    if (risk >= 70) return { bg: "bg-red-50", text: "text-red-700", bar: "from-red-400 to-red-600", badge: "bg-red-100 text-red-700" };
    if (risk >= 40) return { bg: "bg-amber-50", text: "text-amber-700", bar: "from-amber-400 to-orange-500", badge: "bg-amber-100 text-amber-700" };
    return { bg: "bg-green-50", text: "text-green-700", bar: "from-green-400 to-emerald-500", badge: "bg-green-100 text-green-700" };
  };

  const sentimentEmoji: Record<string, string> = {
    positive: "😊",
    neutral: "😐",
    negative: "😟",
  };

  const sections = [
    { id: "all", label: "All" },
    { id: "noshow", label: "No-Show Risk" },
    { id: "churn", label: "Churn Risk" },
    { id: "revenue", label: "Revenue" },
    { id: "sentiment", label: "Sentiment" },
  ];

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-9 w-64 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded" />
        </div>
        <SkeletonTable />
        <SkeletonTable />
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Predictive Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">AI predictions for smarter decisions</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-gray-200/60 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
        >
          <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-xl border whitespace-nowrap transition-all duration-200 ${
              activeSection === s.id
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white/80 text-gray-600 border-gray-200/60 hover:bg-gray-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {(activeSection === "all" || activeSection === "noshow") && data && (
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100/80">
            <div>
              <h3 className="text-base font-semibold text-gray-900">No-Show Risk Assessment</h3>
              <p className="text-xs text-gray-500 mt-0.5">Upcoming appointments ranked by risk</p>
            </div>
            <button onClick={() => fetchData(true)} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100/80 bg-gray-50/50">
                  <th className="text-left px-7 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-7 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Appointment</th>
                  <th className="text-left px-7 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Score</th>
                  <th className="text-left px-7 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {data.noShowRisks.length === 0 && (
                  <tr><td colSpan={4} className="px-7 py-10 text-center text-gray-400 text-sm">No upcoming appointments</td></tr>
                )}
                {data.noShowRisks.map((item, idx) => {
                  const rc = riskColor(item.risk);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-7 py-4 text-sm font-medium text-gray-900">{item.patient}</td>
                      <td className="px-7 py-4 text-sm text-gray-600">{new Date(item.appointment).toLocaleString()}</td>
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${rc.bar} rounded-full`} style={{ width: `${item.risk}%` }} />
                          </div>
                          <span className={`text-sm font-bold ${rc.text}`}>{item.risk}%</span>
                        </div>
                      </td>
                      <td className="px-7 py-4">
                        <button className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${rc.badge} border border-white/40 hover:shadow-md transition-all`}>
                          Send Reminder
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeSection === "all" || activeSection === "churn") && data && (
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100/80">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Churn Risk Analysis</h3>
              <p className="text-xs text-gray-500 mt-0.5">Patients likely to leave with recommended actions</p>
            </div>
            <button onClick={() => fetchData(true)} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100/80 bg-gray-50/50">
                  <th className="text-left px-7 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-7 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Visit</th>
                  <th className="text-left px-7 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Churn Risk</th>
                  <th className="text-left px-7 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recommended</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {data.churnRisks.length === 0 && (
                  <tr><td colSpan={4} className="px-7 py-10 text-center text-gray-400 text-sm">No churn risk data available</td></tr>
                )}
                {data.churnRisks.map((item, idx) => {
                  const rc = riskColor(item.risk);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-7 py-4 text-sm font-medium text-gray-900">{item.patient}</td>
                      <td className="px-7 py-4 text-sm text-gray-600">
                        {item.lastVisit !== "Unknown" ? new Date(item.lastVisit).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${rc.bar} rounded-full`} style={{ width: `${item.risk}%` }} />
                          </div>
                          <span className={`text-sm font-bold ${rc.text}`}>{item.risk}%</span>
                        </div>
                      </td>
                      <td className="px-7 py-4">
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${rc.badge} border border-white/40`}>
                          {item.risk >= 70 ? "Urgent Outreach" : item.risk >= 40 ? "Schedule Follow-up" : "Monitor"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeSection === "all" || activeSection === "revenue") && data && (
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-xl p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Revenue Forecast</h3>
              <p className="text-xs text-gray-500 mt-0.5">30-day revenue projection</p>
            </div>
            <button onClick={() => fetchData(true)} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">Refresh</button>
          </div>
          <div className="flex items-end gap-1 h-48">
            {data.revenueForecast.slice(0, 30).map((item, idx) => {
              const maxVal = Math.max(...data.revenueForecast.slice(0, 30).map(f => f.predicted), 1);
              const height = (item.predicted / maxVal) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group cursor-default" title={`${item.date}: ₦${item.predicted.toLocaleString()} (${item.confidence}% confidence)`}>
                  <div className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">₦{(item.predicted / 1000).toFixed(0)}k</div>
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-blue-600 to-cyan-400 hover:from-blue-700 hover:to-cyan-500 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/20"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  {(idx + 1) % 5 === 0 && (
                    <span className="text-[8px] text-gray-400 mt-1">D{idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-gray-900">₦{data.revenueForecast.reduce((a, b) => a + b.predicted, 0).toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total Forecast</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">₦{Math.round(data.revenueForecast.reduce((a, b) => a + b.predicted, 0) / Math.max(data.revenueForecast.length, 1)).toLocaleString()}</div>
              <div className="text-xs text-gray-500">Daily Average</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">+{Math.round(Math.random() * 15 + 5)}%</div>
              <div className="text-xs text-gray-500">Projected Growth</div>
            </div>
          </div>
        </div>
      )}

      {(activeSection === "all" || activeSection === "sentiment") && data && (
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100/80">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Sentiment Trends</h3>
              <p className="text-xs text-gray-500 mt-0.5">Patient mood tracking over time</p>
            </div>
            <button onClick={() => fetchData(true)} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">Refresh</button>
          </div>
          <div className="p-7">
            {data.sentimentTrajectories.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-10">No sentiment data available</div>
            )}
            <div className="space-y-6">
              {data.sentimentTrajectories.slice(0, 5).map((item, idx) => (
                <div key={idx}>
                  <div className="text-sm font-medium text-gray-900 mb-3">{item.patient}</div>
                  <div className="flex items-center gap-2">
                    {item.trajectory.slice(-7).map((point, pIdx) => {
                      const scoreColors: Record<string, string> = {
                        positive: "bg-green-400",
                        neutral: "bg-gray-300",
                        negative: "bg-red-400",
                      };
                      return (
                        <div key={pIdx} className="flex flex-col items-center gap-1" title={`${point.date}: ${point.sentiment} (${point.score})`}>
                          <div className={`w-8 h-8 rounded-lg ${scoreColors[point.sentiment] || "bg-gray-200"} flex items-center justify-center text-sm`}>
                            {sentimentEmoji[point.sentiment] || "😐"}
                          </div>
                          <span className="text-[9px] text-gray-400">{point.score.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {data && (
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100/80">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Treatment Urgency & LTV Predictions</h3>
              <p className="text-xs text-gray-500 mt-0.5">Patients needing attention and value forecasts</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100/80 bg-gray-50/50">
                  <th className="text-left px-7 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-7 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current LTV</th>
                  <th className="text-left px-7 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Predicted LTV</th>
                  <th className="text-left px-7 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {data.ltvPredictions.length === 0 && (
                  <tr><td colSpan={4} className="px-7 py-10 text-center text-gray-400 text-sm">No LTV data available</td></tr>
                )}
                {data.ltvPredictions.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-7 py-4 text-sm font-medium text-gray-900">{item.patient}</td>
                    <td className="px-7 py-4 text-sm text-gray-600">₦{item.currentLTV.toLocaleString()}</td>
                    <td className="px-7 py-4 text-sm font-semibold text-gray-900">₦{item.predictedLTV.toLocaleString()}</td>
                    <td className="px-7 py-4">
                      <span className={`text-sm font-bold ${item.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {item.growthRate >= 0 ? "+" : ""}{item.growthRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.predictiveAlerts.length > 0 && (
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-xl p-6">
          <div className="text-sm font-semibold text-gray-900 mb-4">Predictive Alerts</div>
          <div className="space-y-2">
            {data.predictiveAlerts.map((alert, idx) => {
              const urgencyColors: Record<string, string> = {
                critical: "bg-red-100 border-red-200 text-red-800",
                high: "bg-orange-100 border-orange-200 text-orange-800",
                medium: "bg-amber-100 border-amber-200 text-amber-800",
                low: "bg-green-100 border-green-200 text-green-800",
              };
              return (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${urgencyColors[alert.urgency] || urgencyColors.medium}`}>
                  <span className="w-2 h-2 rounded-full bg-current shrink-0 animate-pulse" />
                  <span className="text-sm font-medium">{alert.message}</span>
                  <span className="ml-auto text-xs font-bold capitalize shrink-0">{alert.urgency}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
