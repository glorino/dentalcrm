"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/context";

interface Customer {
  id: string;
  email: string;
  name: string;
  company: string;
  segment: string;
  plan: string;
  ltv: number;
  csat: number;
  totalTickets: number;
  status: string;
  sourceChannel: string;
  firstTicketDate: string;
  createdAt: string;
}

const segmentColor: Record<string, string> = {
  enterprise: "bg-purple-100 text-purple-700",
  business: "bg-blue-100 text-blue-700",
  pro: "bg-green-100 text-green-700",
  starter: "bg-gray-100 text-gray-600",
};

const channelIcon: Record<string, string> = {
  whatsapp: "📱",
  email: "📧",
  web: "💬",
  sms: "💬",
  messenger: "💬",
  instagram: "📸",
};

const channelDisplayNames: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  web: "Web Chat",
  sms: "SMS",
  messenger: "Messenger",
  instagram: "Instagram",
};

function formatNaira(amount: number | string): string {
  return `₦${Number(amount || 0).toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CustomersPage() {
  const { t } = useLang();
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (segmentFilter !== "all") params.set("segment", segmentFilter);

    fetch(`/api/customers?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data.customers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [searchQuery, segmentFilter]);

  const enterpriseCount = customers.filter((c) => c.segment === "enterprise").length;
  const businessCount = customers.filter((c) => c.segment === "business").length;
  const proCount = customers.filter((c) => c.segment === "pro").length;
  const starterCount = customers.filter((c) => c.segment === "starter").length;

  const enterpriseRevenue = customers.filter((c) => c.segment === "enterprise").reduce((sum, c) => sum + Number(c.ltv || 0), 0);
  const businessRevenue = customers.filter((c) => c.segment === "business").reduce((sum, c) => sum + Number(c.ltv || 0), 0);
  const proRevenue = customers.filter((c) => c.segment === "pro").reduce((sum, c) => sum + Number(c.ltv || 0), 0);
  const starterRevenue = customers.filter((c) => c.segment === "starter").reduce((sum, c) => sum + Number(c.ltv || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-blue-400 opacity-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gradient-premium">{t("customersPage.title")}</h1>
          <p className="text-sm text-gray-500 mt-1.5">{customers.length} {t("customersPage.fromDatabase")}</p>
        </div>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[
          { label: t("customersPage.enterprise"), count: enterpriseCount, revenue: formatNaira(enterpriseRevenue), icon: "🏢", gradient: "from-purple-500 via-violet-500 to-indigo-600", cardClass: "card-premium-purple" },
          { label: t("customersPage.business"), count: businessCount, revenue: formatNaira(businessRevenue), icon: "📈", gradient: "from-blue-500 via-blue-600 to-cyan-600", cardClass: "card-premium-blue" },
          { label: t("customersPage.pro"), count: proCount, revenue: formatNaira(proRevenue), icon: "⭐", gradient: "from-green-500 via-emerald-500 to-teal-600", cardClass: "card-premium-green" },
          { label: t("customersPage.starter"), count: starterCount, revenue: formatNaira(starterRevenue), icon: "🚀", gradient: "from-amber-400 via-orange-500 to-red-500", cardClass: "card-premium-amber" },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`rounded-3xl p-5 hover-lift cursor-pointer group animate-slide-up animate-delay-${(i + 1) * 100} ${s.cardClass}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {s.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{s.label}</div>
                <div className="text-xs text-gray-500">{s.count} {t("customersPage.customers")}</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{s.revenue}</div>
            <div className="text-xs text-gray-500">{t("customersPage.totalLtv")}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t("customersPage.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium"
          />
        </div>
        <select
          value={segmentFilter}
          onChange={(e) => setSegmentFilter(e.target.value)}
          className="rounded-2xl border-2 border-gray-100 bg-white/80 backdrop-blur-sm px-4 py-3.5 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
        >
          <option value="all">{t("customersPage.allSegments")}</option>
          <option value="enterprise">{t("customersPage.enterprise")}</option>
          <option value="business">{t("customersPage.business")}</option>
          <option value="pro">{t("customersPage.pro")}</option>
          <option value="starter">{t("customersPage.starter")}</option>
        </select>
      </div>

      {/* Customer Table */}
      <div className="overflow-x-auto">
        <div className="rounded-3xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl shadow-black/[0.03] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-gray-100/50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("customersPage.source")}</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("customersPage.segment")}</th>
                <th className="hidden sm:table-cell text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("customersPage.plan")}</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("customersPage.ltv")}</th>
                <th className="hidden sm:table-cell text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tickets</th>
                <th className="hidden sm:table-cell text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">CSAT</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((c, i) => (
                <tr
                  key={c.id}
                  className="hover:bg-white/80 hover:backdrop-blur-sm transition-all duration-300 group cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/customers/${c.id}`} className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                        {c.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {c.sourceChannel ? (
                      <Link href={`/dashboard/tickets?channel=${encodeURIComponent(c.sourceChannel)}`} className="flex items-center gap-2 group/source">
                        <span className="text-lg">{channelIcon[c.sourceChannel] || "💬"}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover/source:text-blue-600 transition-colors">{channelDisplayNames[c.sourceChannel] || c.sourceChannel}</div>
                          {c.firstTicketDate && (
                            <div className="text-[10px] text-gray-400">{t("customersPage.since")} {formatDate(c.firstTicketDate)}</div>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">{t("customersPage.noTickets")}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${segmentColor[c.segment] || "bg-gray-100 text-gray-600"}`}>
                      {c.segment}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 text-sm text-gray-600 capitalize">{c.plan}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatNaira(c.ltv || 0)}</td>
                  <td className="hidden sm:table-cell px-6 py-4 text-sm text-gray-600">{c.totalTickets}</td>
                  <td className="hidden sm:table-cell px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-900">{c.csat || 0}</span>
                      <span className="text-amber-400 text-sm">★</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${c.status === "active" ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className="text-xs font-medium text-gray-600 capitalize">{c.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="text-5xl mb-4">🔍</div>
                    <div className="text-lg font-bold text-gradient-premium mb-1">{t("customersPage.notFound")}</div>
                    <p className="text-sm text-gray-400">{t("customersPage.adjustFilters")}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
