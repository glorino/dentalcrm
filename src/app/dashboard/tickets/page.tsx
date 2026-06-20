"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/context";

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  channel: string;
  aiConfidence: number;
  slaStatus: string;
  slaDue: string;
  sentiment: string;
  sentimentScore: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
}

const statusColor: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 ring-1 ring-blue-200/60",
  pending: "bg-amber-100 text-amber-700 ring-1 ring-amber-200/60",
  escalated: "bg-red-100 text-red-700 ring-1 ring-red-200/60",
  resolved: "bg-green-100 text-green-700 ring-1 ring-green-200/60",
};

const priorityColor: Record<string, string> = {
  low: "text-gray-500",
  medium: "text-amber-600",
  high: "text-orange-600 font-semibold",
  urgent: "text-red-600 font-semibold",
};

const slaColor: Record<string, string> = {
  ok: "text-green-600",
  warning: "text-amber-600 font-semibold",
  breached: "text-red-600 font-semibold",
  done: "text-gray-400",
};

const sentimentIcon: Record<string, string> = {
  positive: "😊",
  neutral: "😐",
  negative: "😟",
  angry: "😡",
  frustrated: "😤",
};

const channelColor: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-700 ring-1 ring-green-200/60",
  email: "bg-purple-100 text-purple-700 ring-1 ring-purple-200/60",
  web: "bg-blue-100 text-blue-700 ring-1 ring-blue-200/60",
  sms: "bg-amber-100 text-amber-700 ring-1 ring-amber-200/60",
  messenger: "bg-blue-100 text-blue-600 ring-1 ring-blue-200/60",
  instagram: "bg-pink-100 text-pink-700 ring-1 ring-pink-200/60",
};

const getChannelDisplayNames = (t: (key: string) => string): Record<string, string> => ({
  whatsapp: t("dashboardPage.channels.whatsapp"),
  email: t("dashboardPage.channels.email"),
  web: t("dashboardPage.channels.web"),
  sms: t("dashboardPage.channels.sms"),
  messenger: t("dashboardPage.channels.messenger"),
  instagram: t("dashboardPage.channels.instagram"),
});

function TicketsContent() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlChannel = searchParams.get("channel") || "all";
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState(urlChannel);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (channelFilter !== "all") params.set("channel", channelFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);

    fetch(`/api/tickets?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setTickets(data.tickets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [channelFilter, statusFilter, search]);

  useEffect(() => {
    setChannelFilter(urlChannel);
  }, [urlChannel]);

  const filteredTickets = tickets;

  const handleChannelChange = (value: string) => {
    setChannelFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("channel");
    } else {
      params.set("channel", value);
    }
    router.push(`/dashboard/tickets?${params.toString()}`);
  };

  const toggleTicket = (id: string) => {
    setSelectedTickets((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const openCount = tickets.filter((t) => t.status === "open").length;
  const pendingCount = tickets.filter((t) => t.status === "pending").length;
  const escalatedCount = tickets.filter((t) => t.status === "escalated").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;
  const breachedCount = tickets.filter((t) => t.slaStatus === "breached").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute inset-0"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: t("dashboardPage.status.open"), count: openCount, gradient: "from-blue-500 via-blue-600 to-indigo-600", cardClass: "card-premium-blue", icon: "📂", filter: "open" },
    { label: t("dashboardPage.status.pending"), count: pendingCount, gradient: "from-amber-400 via-amber-500 to-orange-500", cardClass: "card-premium-amber", icon: "⏳", filter: "pending" },
    { label: t("dashboardPage.status.escalated"), count: escalatedCount, gradient: "from-red-500 via-red-600 to-rose-600", cardClass: "card-premium-red", icon: "🚨", filter: "escalated" },
    { label: t("dashboardPage.status.resolved"), count: resolvedCount, gradient: "from-green-500 via-green-600 to-emerald-600", cardClass: "card-premium-green", icon: "✅", filter: "resolved" },
    { label: `${t("ticketsPage.sla")} ${t("ticketsPage.breached")}`, count: breachedCount, gradient: "from-red-600 via-red-700 to-red-800", cardClass: "card-premium-red", icon: "⚠️", filter: "breached" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gradient">{t("ticketsPage.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{tickets.length} {t("ticketsPage.fromDatabase")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary hover-lift">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {t("ticketsPage.export")}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(s.filter)}
            className={`animate-scale-in stagger-${i + 1} hover-lift rounded-3xl p-5 text-left transition-all duration-300 ${
              statusFilter === s.filter
                ? `bg-gradient-to-br ${s.gradient} text-white shadow-xl shadow-black/10 scale-[1.03]`
                : `${s.cardClass} hover:shadow-xl`
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-lg ${
                statusFilter === s.filter
                  ? "bg-white/20 backdrop-blur-sm"
                  : "bg-gradient-to-br " + s.gradient + " text-white shadow-md"
              }`}>
                {s.icon}
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${
                statusFilter === s.filter ? "text-white/80" : "text-gray-500"
              }`}>{s.label}</span>
            </div>
            <div className={`text-3xl font-bold ${statusFilter === s.filter ? "text-white" : "text-gray-900"}`}>
              {s.count}
            </div>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder={t("ticketsPage.searchPlaceholder")}
            className="input-premium pl-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={channelFilter}
          onChange={(e) => handleChannelChange(e.target.value)}
          className="rounded-2xl border-2 border-gray-100 bg-white/80 backdrop-blur-sm px-4 py-3.5 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
        >
          <option value="all">{t("ticketsPage.allChannels")}</option>
          <option value="whatsapp">{t("dashboardPage.channels.whatsapp")}</option>
          <option value="email">{t("dashboardPage.channels.email")}</option>
          <option value="web">{t("dashboardPage.channels.web")}</option>
          <option value="sms">{t("dashboardPage.channels.sms")}</option>
          <option value="messenger">{t("dashboardPage.channels.messenger")}</option>
          <option value="instagram">{t("dashboardPage.channels.instagram")}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border-2 border-gray-100 bg-white/80 backdrop-blur-sm px-4 py-3.5 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
        >
          <option value="all">{t("ticketsPage.allStatus")}</option>
          <option value="open">{t("dashboardPage.status.open")}</option>
          <option value="pending">{t("dashboardPage.status.pending")}</option>
          <option value="escalated">{t("dashboardPage.status.escalated")}</option>
          <option value="resolved">{t("dashboardPage.status.resolved")}</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedTickets.length > 0 && (
        <div className="flex flex-wrap gap-3 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-2xl border border-blue-200/60 shadow-lg shadow-blue-500/5 animate-slide-up">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{selectedTickets.length}</span>
            </div>
            <span className="text-sm text-blue-700 font-semibold">{selectedTickets.length} {t("ticketsPage.selected")}</span>
          </div>
          <button className="btn-ghost text-xs hover:bg-blue-100/80">{t("ticketsPage.assignTo")}</button>
          <button className="btn-ghost text-xs hover:bg-blue-100/80">{t("ticketsPage.changeStatus")}</button>
          <button className="btn-ghost text-xs text-red-600 hover:bg-red-50">{t("ticketsPage.closeTickets")}</button>
        </div>
      )}

      {/* Ticket Table */}
      <div className="glass-card rounded-3xl overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-white/50">
                <th className="w-12 px-5 py-4">
                  <input type="checkbox" className="rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500/20" />
                </th>
                <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("dashboardPage.th.ticket")}</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("dashboardPage.th.customer")}</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("dashboardPage.th.status")}</th>
                <th className="hidden sm:table-cell text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("dashboardPage.th.priority")}</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("ticketsPage.sla")}</th>
                <th className="hidden sm:table-cell text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("ticketsPage.ai")}</th>
                <th className="text-right px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("ticketsPage.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {filteredTickets.map((tk, i) => (
                <tr key={tk.id} className={`animate-fade-in stagger-${(i % 6) + 1} hover:bg-blue-50/30 transition-all duration-200 group`}>
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={selectedTickets.includes(tk.id)}
                      onChange={() => toggleTicket(tk.id)}
                      className="rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500/20"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/tickets/${tk.ticketNumber.replace("SSV-", "")}`} className="block hover-lift rounded-xl p-1 -m-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400">{tk.ticketNumber}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${channelColor[tk.channel] || "bg-gray-100 text-gray-600"}`}>{getChannelDisplayNames(t)[tk.channel] || tk.channel}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-xs">{tk.subject}</div>
                      {tk.tags && tk.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {tk.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100/80 text-gray-500 font-medium">{tag}</span>
                          ))}
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
                        {(tk.customerName || "U").split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{tk.customerName || t("misc.unknown")}</div>
                        <div className="text-xs text-gray-400">{tk.customerCompany || ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor[tk.status] || "bg-gray-100 text-gray-700"}`}>
                      {t(`dashboardPage.status.${tk.status}`)}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-4">
                    <span className={`text-xs capitalize font-medium ${priorityColor[tk.priority] || "text-gray-500"}`}>{tk.priority.charAt(0).toUpperCase() + tk.priority.slice(1)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className={`text-xs font-semibold ${slaColor[tk.slaStatus] || "text-gray-400"}`}>
                      {tk.slaStatus === "breached" ? t("ticketsPage.breached") : tk.slaStatus === "ok" ? t("ticketsPage.ok") : tk.slaStatus}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{sentimentIcon[tk.sentiment] || "😐"}</span>
                      <span className="text-xs text-gray-500 font-medium">{tk.aiConfidence}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button className="h-8 w-8 rounded-xl hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </button>
                      <button className="h-8 w-8 rounded-xl hover:bg-amber-50 flex items-center justify-center text-gray-400 hover:text-amber-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl">
                        📭
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">{t("ticketsPage.notFound")}</p>
                        <p className="text-sm text-gray-400 mt-1">{channelFilter !== "all" ? t("ticketsPage.notFoundForChannel") : t("ticketsPage.createSome")}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white/30">
          <span className="text-sm text-gray-500 font-medium">{t("ticketsPage.showing")} {filteredTickets.length} {t("ticketsPage.fromDatabase")}</span>
        </div>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute inset-0"></div>
        </div>
      </div>
    }>
      <TicketsContent />
    </Suspense>
  );
}
