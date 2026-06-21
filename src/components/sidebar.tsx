"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, getInitials } from "@/lib/auth/context";
import { useLang } from "@/lib/i18n/context";

const mainNav = [
  { label: "Dashboard", tKey: "dashboard.dashboard", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", badge: null, roles: ["super_admin", "admin", "manager", "agent", "viewer"] },
  { label: "Inbox", tKey: "dashboard.inbox", href: "/dashboard/inbox", icon: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4", badge: "24", roles: ["super_admin", "admin", "manager", "agent"] },
  { label: "Tickets", tKey: "dashboard.tickets", href: "/dashboard/tickets", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", badge: "8", roles: ["super_admin", "admin", "manager", "agent"] },
  { label: "Customers", tKey: "dashboard.customers", href: "/dashboard/customers", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", badge: null, roles: ["super_admin", "admin", "manager", "agent"] },
  { label: "Knowledge Base", tKey: "dashboard.knowledge", href: "/dashboard/knowledge", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", badge: null, roles: ["super_admin", "admin", "manager", "agent"] },
];

const analyticsNav = [
  { label: "Analytics", tKey: "dashboard.analytics", href: "/dashboard/analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", badge: null, roles: ["super_admin", "admin", "manager"] },
  { label: "Teams", tKey: "dashboard.teams", href: "/dashboard/teams", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", badge: null, roles: ["super_admin", "admin", "manager"] },
  { label: "Escalation", tKey: "dashboard.escalation", href: "/dashboard/escalation", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", badge: null, roles: ["super_admin", "admin", "manager", "agent"] },
];

const settingsNav = [
  { label: "Settings", tKey: "dashboard.settings", href: "/dashboard/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", badge: null, roles: ["super_admin", "admin"] },
];

const getRoleConfig = (t: (key: string) => string): Record<string, { label: string; color: string; gradient: string }> => ({
  super_admin: { label: t("roles.superAdmin"), color: "bg-purple-100/80 text-purple-700 border-purple-200/60", gradient: "from-violet-500 to-indigo-600" },
  admin: { label: t("roles.admin"), color: "bg-blue-100/80 text-blue-700 border-blue-200/60", gradient: "from-blue-500 to-indigo-600" },
  manager: { label: t("roles.manager"), color: "bg-emerald-100/80 text-emerald-700 border-emerald-200/60", gradient: "from-emerald-500 to-teal-600" },
  agent: { label: t("roles.agent"), color: "bg-amber-100/80 text-amber-700 border-amber-200/60", gradient: "from-amber-500 to-orange-600" },
  viewer: { label: t("roles.viewer"), color: "bg-gray-100/80 text-gray-600 border-gray-200/60", gradient: "from-gray-500 to-slate-600" },
});

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLang();
  const userRole = user?.role || "agent";
  const roleConfigMap = getRoleConfig(t);
  const config = roleConfigMap[userRole] || roleConfigMap.agent;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const filterByRole = (items: typeof mainNav) => items.filter(item => item.roles.includes(userRole));

  const renderNavItem = (item: typeof mainNav[0], activeGradient?: string, activeText?: string, activeIcon?: string, activeBorder?: string, badgeGradient?: string) => {
    const label = t(item.tKey) || item.label;
    const ag = activeGradient || "from-blue-50 to-indigo-50/80";
    const at = activeText || "text-blue-700";
    const ai = activeIcon || "text-blue-600";
    const ab = activeBorder || "border-blue-100/80";
    const bg = badgeGradient || "bg-blue-600";
    const bgLight = badgeGradient || "bg-blue-100/80";
    const textLight = at.replace("700", "600");
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300 ${
          isActive(item.href)
            ? `bg-gradient-to-r ${ag} ${at} shadow-md ${at.replace("text-", "shadow-")}/5 border ${ab}`
            : "text-gray-500 hover:bg-gray-50/80 hover:text-gray-900 hover:shadow-sm"
        }`}
      >
        <div className={`flex items-center justify-center w-5 h-5 ${isActive(item.href) ? ai : "text-gray-400 group-hover:text-gray-600"} transition-colors duration-300`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
          </svg>
        </div>
        <span className="flex-1">{label}</span>
        {item.badge && (
          <span className={`h-5 min-w-[20px] rounded-full text-[10px] font-bold flex items-center justify-center px-1.5 ${
            isActive(item.href) ? `${bg} text-white` : `${bgLight} ${textLight}`
          } transition-colors duration-300`}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-[268px] border-r border-gray-200/60 bg-white/80 backdrop-blur-2xl hidden lg:flex flex-col">
      {/* Logo */}
      <div className="flex h-[68px] items-center gap-3 border-b border-gray-100/80 px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <img src="/industries/healthcare/logo.svg" alt="DentalCRM" className="h-9 w-9 group-hover:scale-105 transition-transform duration-300" />
          <div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">Dental</span>
            <span className="text-lg font-bold text-blue-600 ml-1">CRM</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {/* Main Section */}
        <div className="mb-5">
          <div className="px-3.5 mb-2.5 text-[10px] font-bold text-gray-400/80 uppercase tracking-[0.15em]">{t("sidebar.main")}</div>
          {filterByRole(mainNav).map((item) => renderNavItem(item))}
        </div>

        {/* Analytics Section */}
        <div className="mb-5">
          <div className="px-3.5 mb-2.5 text-[10px] font-bold text-gray-400/80 uppercase tracking-[0.15em]">{t("sidebar.analytics")}</div>
          {filterByRole(analyticsNav).map((item) => renderNavItem(item, "from-purple-50 to-violet-50/80", "text-purple-700", "text-purple-600", "border-purple-100/80", "bg-purple-600"))}
        </div>

        {/* System Section */}
        <div>
          <div className="px-3.5 mb-2.5 text-[10px] font-bold text-gray-400/80 uppercase tracking-[0.15em]">{t("sidebar.system")}</div>
          {filterByRole(settingsNav).map((item) => renderNavItem(item, "from-amber-50 to-orange-50/80", "text-amber-700", "text-amber-600", "border-amber-100/80", "bg-amber-600"))}
        </div>
      </nav>

      {/* Main Site Link */}
      <div className="px-3 pb-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50/80 hover:text-gray-900 hover:shadow-sm transition-all duration-300 border border-gray-200/60"
        >
          <div className="flex items-center justify-center w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <span className="flex-1">{t("sidebar.mainSite")}</span>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-gray-100/80">
        {user && (
          <div className="rounded-2xl bg-gradient-to-r from-gray-50/80 to-gray-100/40 border border-gray-200/60 p-3.5 hover:shadow-md transition-all duration-300 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                  {getInitials(user.name)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold border ${config.color}`}>
                    {config.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
