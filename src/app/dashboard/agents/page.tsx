"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/lib/i18n/context";

interface AgentTask {
  id: string;
  type: string;
  action: string;
  status: string;
  priority: string;
  data: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

interface AgentStats {
  total: number;
  completedToday: number;
  failed: number;
  avgCompletionTime: string;
}

const typeColor: Record<string, string> = {
  scheduling: "bg-blue-100/80 text-blue-700 border-blue-200/60",
  billing: "bg-green-100/80 text-green-700 border-green-200/60",
  clinical: "bg-purple-100/80 text-purple-700 border-purple-200/60",
  marketing: "bg-pink-100/80 text-pink-700 border-pink-200/60",
  quality: "bg-amber-100/80 text-amber-700 border-amber-200/60",
};

const typeDot: Record<string, string> = {
  scheduling: "bg-blue-500",
  billing: "bg-green-500",
  clinical: "bg-purple-500",
  marketing: "bg-pink-500",
  quality: "bg-amber-500",
};

const statusColor: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-200/60",
  in_progress: "bg-blue-100/80 text-blue-700 border-blue-200/60",
  completed: "bg-green-100/80 text-green-700 border-green-200/60",
  failed: "bg-red-100/80 text-red-700 border-red-200/60",
};

const priorityColor: Record<string, string> = {
  low: "bg-gray-50 text-gray-500",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-orange-50 text-orange-600",
  urgent: "bg-red-50 text-red-600",
};

const typeFilters = ["all", "scheduling", "billing", "clinical", "marketing", "quality"];
const statusFilters = ["all", "pending", "in_progress", "completed", "failed"];

function SkeletonTask() {
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-16 h-5 bg-gray-200 rounded-full" />
        <div className="w-12 h-5 bg-gray-100 rounded-full" />
        <div className="flex-1" />
        <div className="w-20 h-4 bg-gray-100 rounded" />
      </div>
      <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-64 bg-gray-100 rounded" />
    </div>
  );
}

export default function AgentsPage() {
  const { t } = useLang();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningQueue, setRunningQueue] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchTasks = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/ai/agents?${params.toString()}`, { signal });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") setTasks([]);
    }
    setLoading(false);
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTasks(controller.signal);
    return () => controller.abort();
  }, [fetchTasks]);

  const stats: AgentStats = {
    total: tasks.length,
    completedToday: tasks.filter((tk) => tk.status === "completed").length,
    failed: tasks.filter((tk) => tk.status === "failed").length,
    avgCompletionTime: "2.3s",
  };

  const runQueue = async () => {
    setRunningQueue(true);
    try {
      const pendingTasks = tasks.filter((tk) => tk.status === "pending");
      for (const task of pendingTasks.slice(0, 5)) {
        await fetch("/api/ai/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: task.type,
            action: task.action,
            data: task.data,
            priority: task.priority,
          }),
        });
      }
      await fetchTasks();
    } catch {
      console.error("Failed to run queue");
    }
    setRunningQueue(false);
  };

  function formatTime(dateStr: string) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t("misc.justNow");
    if (diffMin < 60) return `${diffMin}${t("misc.minAgo")}`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}${t("misc.hoursAgo")}`;
    return `${Math.floor(diffHr / 24)}${t("misc.daysAgo")}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t("intelligencePage.title") ? "Autonomous Agents" : "Autonomous Agents"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">AI agents working around the clock</p>
        </div>
        <button
          onClick={runQueue}
          disabled={runningQueue}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-blue-500/20"
        >
          {runningQueue ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          Run Queue
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: stats.total, gradient: "from-blue-500 to-indigo-600", cardClass: "card-premium-blue" },
          { label: "Completed Today", value: stats.completedToday, gradient: "from-green-400 to-emerald-500", cardClass: "card-premium-green" },
          { label: "Failed", value: stats.failed, gradient: "from-red-400 to-red-500", cardClass: "card-premium-red" },
          { label: "Avg Completion", value: stats.avgCompletionTime, gradient: "from-amber-400 to-orange-500", cardClass: "card-premium-amber" },
        ].map((s, i) => (
          <div key={s.label} className={`rounded-3xl border border-white/20 p-5 ${s.cardClass}`}>
            <div className="text-2xl font-bold text-gray-900 mb-1">{s.value}</div>
            <div className="text-xs text-gray-500 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type:</span>
          {typeFilters.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                typeFilter === f
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white/80 text-gray-600 border-gray-200/60 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status:</span>
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                statusFilter === f
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white/80 text-gray-600 border-gray-200/60 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <SkeletonTask key={i} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-xl p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No tasks found</h3>
          <p className="text-sm text-gray-500">Agent tasks will appear here once created.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-xl p-4 hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${typeColor[task.type] || typeColor.scheduling}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${typeDot[task.type] || typeDot.scheduling}`} />
                  {task.type}
                </span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor[task.status] || statusColor.pending}`}>
                  {task.status === "in_progress" && (
                    <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {task.status.replace("_", " ")}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityColor[task.priority] || priorityColor.medium}`}>
                  {task.priority}
                </span>
                <span className="text-xs text-gray-400 ml-auto">{formatTime(task.created_at)}</span>
              </div>
              <div className="text-sm font-medium text-gray-900 mb-1">{task.action}</div>
              {task.result && (
                <div className="mt-2 p-3 bg-green-50/60 rounded-xl border border-green-100/60">
                  <div className="text-xs font-semibold text-green-700 mb-1">Result</div>
                  <div className="text-xs text-gray-600 font-mono break-all">{JSON.stringify(task.result, null, 2).slice(0, 200)}</div>
                </div>
              )}
              {task.error && (
                <div className="mt-2 p-3 bg-red-50/60 rounded-xl border border-red-100/60">
                  <div className="text-xs font-semibold text-red-700 mb-1">Error</div>
                  <div className="text-xs text-red-600">{task.error}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
