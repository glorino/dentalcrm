"use client";

import { Sidebar } from "@/components/sidebar";
import { AuthProvider, useAuth, getInitials } from "@/lib/auth/context";
import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/lib/i18n/context";
import { ChatWidget } from "@/components/chat-widget";

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-[268px] bg-white/95 backdrop-blur-2xl shadow-2xl">
        <Sidebar />
      </div>
    </div>
  );
}

function DashboardHeader() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleBadge: Record<string, { label: string; color: string; gradient: string }> = {
    super_admin: { label: t("roles.superAdmin"), color: "bg-purple-100/80 text-purple-700 border-purple-200/60", gradient: "from-violet-500 to-indigo-600" },
    admin: { label: t("roles.admin"), color: "bg-blue-100/80 text-blue-700 border-blue-200/60", gradient: "from-blue-500 to-indigo-600" },
    manager: { label: t("roles.manager"), color: "bg-emerald-100/80 text-emerald-700 border-emerald-200/60", gradient: "from-emerald-500 to-teal-600" },
    agent: { label: t("roles.agent"), color: "bg-amber-100/80 text-amber-700 border-amber-200/60", gradient: "from-amber-500 to-orange-600" },
    viewer: { label: t("roles.viewer"), color: "bg-gray-100/80 text-gray-600 border-gray-200/60", gradient: "from-gray-500 to-slate-600" },
  };

  const badge = roleBadge[user?.role || "agent"] || roleBadge.agent;

  return (
    <>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <header className="sticky top-0 z-30 h-[68px] border-b border-gray-200/50 bg-white/70 backdrop-blur-2xl">
        <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-10 w-10 rounded-xl hover:bg-gray-100/80 flex items-center justify-center text-gray-500 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="relative max-w-md w-full">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t("dashboard.search")}
                className="w-full rounded-2xl border border-gray-200/60 bg-gray-50/50 pl-10 pr-4 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-gray-200/60 bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 hidden sm:inline-flex">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-green-50/80 to-emerald-50/60 border border-green-200/60 mr-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50" />
              <span className="text-xs font-semibold text-green-700">{t("dashboard.aiActive")}</span>
              <span className="text-[10px] text-green-600/60">·</span>
              <span className="text-[10px] text-green-600 font-medium">67% {t("dashboard.autoResolved")}</span>
            </div>

            <LangToggleMinimal />

            <button className="h-10 w-10 rounded-xl hover:bg-gray-100/80 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-200 relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 min-w-[18px] rounded-full bg-gradient-to-br from-red-500 to-red-600 text-[9px] font-bold text-white flex items-center justify-center shadow-sm">3</span>
            </button>

            <button className="h-10 w-10 rounded-xl hover:bg-gray-100/80 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-200 relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 min-w-[18px] rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-[9px] font-bold text-white flex items-center justify-center shadow-sm">5</span>
            </button>

            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200/60">
              <button onClick={logout} className="flex items-center gap-2.5 rounded-2xl p-1.5 hover:bg-gray-100/80 transition-all duration-300 group" title={t("dashboard.logout")}>
                <div className={`relative h-10 w-10 rounded-xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center text-white text-xs font-bold shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  {user ? getInitials(user.name) : "U"}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-semibold text-gray-900">{user?.name || t("misc.user")}</div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold border ${badge.color}`}>{badge.label}</span>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

function LangToggleMinimal() {
  const { locale, setLocale } = useLang();
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
      {(["en", "fr"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
            locale === l
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="fixed inset-0 pointer-events-none opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
        
        <div className="relative">
          <Sidebar />
          <div className="lg:pl-[268px]">
            <DashboardHeader />
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
        <ChatWidget />
      </div>
    </AuthProvider>
  );
}
