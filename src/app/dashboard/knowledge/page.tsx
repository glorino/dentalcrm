"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n/context";

interface Article {
  id: string;
  title: string;
  content: string;
  collection: string;
  status: string;
  views: number;
  aiUsed: number;
  helpful: number;
  tags: string[];
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

interface Collection {
  name: string;
  count: number;
}

const collectionIcons: Record<string, string> = {
  "Getting Started": "🚀",
  "Account & Billing": "💰",
  "Technical Docs": "🔧",
  "Integrations": "🔗",
  "API Reference": "📡",
  "Troubleshooting": "🛠️",
};

const statusColor: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm shadow-emerald-100",
  draft: "bg-gray-100 text-gray-600 border border-gray-200/60",
  review: "bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm shadow-amber-100",
};

const statusDot: Record<string, string> = {
  published: "bg-emerald-500",
  draft: "bg-gray-400",
  review: "bg-amber-500",
};

export default function KnowledgePage() {
  const { t } = useLang();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [articles, setArticles] = useState<Article[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stats, setStats] = useState({ totalArticles: 0, published: 0, totalViews: 0, totalAiUsed: 0, avgHelpful: 0 });
  const [loading, setLoading] = useState(true);

  function formatDate(dateStr: string): string {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return t("misc.justNow");
    if (hours < 24) return `${hours}${t("misc.hoursAgo")}`;
    if (days < 7) return `${days}${t("misc.daysAgo")}`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCollection) params.set("collection", selectedCollection);

    fetch(`/api/knowledge?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles || []);
        setCollections(data.collections || []);
        setStats(data.stats || { totalArticles: 0, published: 0, totalViews: 0, totalAiUsed: 0, avgHelpful: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [searchQuery, selectedCollection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-indigo-500" style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
          </div>
          <div className="text-sm font-medium text-gray-500">{t("knowledgePage.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="animate-slide-up">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            <span className="text-gradient">{t("knowledgePage.title")}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">{articles.length} {t("knowledgePage.fromDatabase")}</p>
        </div>
        <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <button className="btn-primary hover-lift group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
            <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t("knowledgePage.newArticle")}
          </button>
        </div>
      </div>

      {/* AI Search */}
      <div className="rounded-2xl border border-white/20 p-6 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 backdrop-blur-xl shadow-xl shadow-blue-100/20 animate-slide-up" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <svg className="w-5 h-5 animate-pulse-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white animate-bounce-subtle" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{t("knowledgePage.aiSearch")}</h3>
            <p className="text-xs text-gray-500">{t("knowledgePage.aiSearchDesc")}</p>
          </div>
        </div>
        <div className="relative group">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 group-focus-within:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder={t("knowledgePage.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-blue-200/60 bg-white/80 backdrop-blur-sm pl-12 pr-4 py-4 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 shadow-sm hover:shadow-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        {[
          { label: t("knowledgePage.totalArticles"), value: stats.totalArticles, icon: "📚", gradient: "from-blue-500 via-blue-600 to-indigo-600", bgGradient: "from-blue-50 to-indigo-50", borderColor: "border-blue-200/50" },
          { label: t("knowledgePage.published"), value: stats.published, icon: "✅", gradient: "from-emerald-500 via-green-500 to-teal-600", bgGradient: "from-emerald-50 to-green-50", borderColor: "border-emerald-200/50" },
          { label: t("knowledgePage.totalViews"), value: stats.totalViews, icon: "👁️", gradient: "from-purple-500 via-violet-500 to-indigo-600", bgGradient: "from-purple-50 to-violet-50", borderColor: "border-purple-200/50" },
          { label: t("knowledgePage.helpfulRating"), value: `${Math.round(stats.avgHelpful)}%`, icon: "👍", gradient: "from-amber-400 via-orange-500 to-red-500", bgGradient: "from-amber-50 to-orange-50", borderColor: "border-amber-200/50" },
        ].map((s) => (
          <div key={s.label} className={`card-premium rounded-2xl border ${s.borderColor} bg-gradient-to-br ${s.bgGradient} p-5 hover-lift group cursor-default`}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-base text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                {s.icon}
              </div>
              <span className="text-xs text-gray-600 font-semibold tracking-wide uppercase">{s.label}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Collections */}
      {collections.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
              {t("knowledgePage.collections")}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {collections.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedCollection(selectedCollection === c.name ? null : c.name)}
                className={`hover-lift rounded-2xl border p-5 text-left transition-all duration-300 group ${
                  selectedCollection === c.name
                    ? "border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-200/40 ring-2 ring-blue-500/20 scale-[1.03]"
                    : "border-gray-200/80 bg-white/80 backdrop-blur-sm hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/30"
                }`}
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl mb-3 transition-all duration-300 ${
                  selectedCollection === c.name
                    ? "bg-gradient-to-br from-blue-100 to-indigo-100 shadow-inner"
                    : "bg-gray-50 group-hover:bg-blue-50 group-hover:scale-110"
                }`}>
                  {collectionIcons[c.name] || "📄"}
                </div>
                <div className="text-sm font-bold text-gray-900 mb-0.5 truncate">{c.name}</div>
                <div className="text-xs text-gray-500 font-medium">{c.count} {t("knowledgePage.articles")}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Articles */}
      <div className="rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl shadow-gray-200/20 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/80 to-white/50">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            {t("knowledgePage.articlesTitle")}
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{articles.length}</span>
          </h3>
          <div className="flex items-center gap-1.5 bg-gray-100/80 rounded-xl p-1">
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                view === "grid"
                  ? "bg-white text-gray-900 shadow-md shadow-gray-200/50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                view === "list"
                  ? "bg-white text-gray-900 shadow-md shadow-gray-200/50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {view === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100/80 bg-gradient-to-r from-gray-50/60 to-transparent">
                  <th className="text-left px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t("knowledgePage.th.article")}</th>
                  <th className="text-left px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t("knowledgePage.th.collection")}</th>
                  <th className="text-left px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t("knowledgePage.th.status")}</th>
                  <th className="hidden sm:table-cell text-left px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t("knowledgePage.th.views")}</th>
                  <th className="hidden sm:table-cell text-left px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t("knowledgePage.th.aiUsed")}</th>
                  <th className="text-left px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t("knowledgePage.th.helpful")}</th>
                  <th className="hidden sm:table-cell text-right px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t("knowledgePage.th.updated")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {articles.map((a) => (
                  <tr key={a.id} className="hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-indigo-50/20 transition-all duration-300 group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{a.title}</div>
                      {a.tags && a.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {a.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">{tag}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{a.collection || t("knowledgePage.uncategorized")}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor[a.status] || "bg-gray-100 text-gray-600"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDot[a.status] || "bg-gray-400"}`} />
                        {a.status}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-sm text-gray-600 font-medium">{a.views}</td>
                    <td className="hidden sm:table-cell px-6 py-4 text-sm text-blue-600 font-bold">{a.aiUsed}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{a.helpful > 0 ? `${a.helpful}%` : "—"}</td>
                    <td className="hidden sm:table-cell px-6 py-4 text-xs text-gray-400 text-right font-medium">{formatDate(a.updatedAt)}</td>
                  </tr>
                ))}
                {articles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 animate-fade-in">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-3xl">
                          📭
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{t("knowledgePage.notFound")}</p>
                          <p className="text-xs text-gray-500 mt-1">{t("knowledgePage.createFirst")}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((a) => (
              <div key={a.id} className="hover-lift rounded-2xl border border-gray-200/80 p-5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/30 transition-all duration-500 cursor-pointer group bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor[a.status] || "bg-gray-100 text-gray-600"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDot[a.status] || "bg-gray-400"}`} />
                    {a.status}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{formatDate(a.updatedAt)}</span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 mb-2 line-clamp-2">{a.title}</h4>
                <p className="text-xs text-gray-500 font-medium mb-4 flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded bg-gray-100 flex items-center justify-center text-[10px]">{collectionIcons[a.collection] || "📄"}</span>
                  {a.collection || t("knowledgePage.uncategorized")}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    {a.views}
                  </span>
                  <span className="flex items-center gap-1 text-blue-500 font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    AI: {a.aiUsed}
                  </span>
                  {a.helpful > 0 && (
                    <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                      {a.helpful}%
                    </span>
                  )}
                </div>
                {a.tags && a.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3.5 pt-3.5 border-t border-gray-100/80">
                    {a.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {articles.length === 0 && (
              <div className="col-span-full text-center py-16 animate-fade-in">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-4xl">
                    📭
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">{t("knowledgePage.notFound")}</p>
                    <p className="text-sm text-gray-500 mt-1">{t("dashboardPageExtra.knowledge.emptyState")}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
