"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n/context";

interface TeamUser {
  id: string;
  email: string;
  name: string;
  role: string;
  team: string;
  avatarUrl: string;
  status: string;
  activeTickets: number;
  resolvedTickets: number;
  createdAt: string;
}

interface TeamInfo {
  name: string;
  memberCount: number;
  openTickets: number;
}

const teamColors: Record<string, string> = {
  "AI Operations": "from-cyan-500 to-blue-600",
  "Support Engineering": "from-blue-500 to-indigo-600",
  "Billing & Accounts": "from-green-500 to-emerald-600",
  "Customer Success": "from-purple-500 to-indigo-600",
};

const teamCardClasses: Record<string, string> = {
  "AI Operations": "card-premium-cyan",
  "Support Engineering": "card-premium-blue",
  "Billing & Accounts": "card-premium-green",
  "Customer Success": "card-premium-purple",
};

const roleColor: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700 border border-purple-200/60",
  admin: "bg-purple-100 text-purple-700 border border-purple-200/60",
  manager: "bg-blue-100 text-blue-700 border border-blue-200/60",
  agent: "bg-gray-100 text-gray-600 border border-gray-200/60",
  viewer: "bg-gray-100 text-gray-500 border border-gray-200/60",
};

const statusColor: Record<string, string> = {
  active: "bg-green-500",
  inactive: "bg-gray-300",
};

const statusBadge: Record<string, string> = {
  active: "bg-green-50 text-green-700 border border-green-200/60",
  inactive: "bg-gray-50 text-gray-500 border border-gray-200/60",
};

export default function TeamsPage() {
  const [view, setView] = useState<"teams" | "members">("teams");
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setTeams(data.teams || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <div className="absolute inset-0 h-14 w-14 rounded-full border-4 border-transparent border-b-indigo-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">{t("teamsPage.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">{t("teamsPage.title")}</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {users.length} {t("teamsPage.membersAcross")} {teams.length} {t("teamsPage.teamsWord")}
          </p>
        </div>

        {/* Premium Segmented Control */}
        <div className="relative flex items-center rounded-2xl bg-gray-100/80 backdrop-blur-sm p-1 border border-gray-200/60 shadow-inner">
          <div
            className="absolute top-1 bottom-1 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              width: "calc(50% - 4px)",
              left: view === "teams" ? "4px" : "calc(50%)",
            }}
          />
          <button
            onClick={() => setView("teams")}
            className={`relative z-10 px-5 py-2 text-sm font-semibold rounded-xl transition-colors duration-300 ${
              view === "teams" ? "text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {t("teamsPage.tabTeams")}
          </button>
          <button
            onClick={() => setView("members")}
            className={`relative z-10 px-5 py-2 text-sm font-semibold rounded-xl transition-colors duration-300 ${
              view === "members" ? "text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {t("teamsPage.tabMembers")}
          </button>
        </div>
      </div>

      {/* Teams View */}
      {view === "teams" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teams.map((tm, i) => {
            const color = teamColors[tm.name] || "from-gray-500 to-gray-600";
            const cardClass = teamCardClasses[tm.name] || "card-premium-blue";
            const teamMembers = users.filter((u) => u.team === tm.name);
            const lead = teamMembers.find(
              (u) => u.role === "manager" || u.role === "admin"
            );
            return (
              <div
                key={tm.name}
                className={`rounded-3xl p-6 hover-lift group animate-scale-in stagger-${i + 1} ${cardClass}`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                    >
                      {tm.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {tm.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {tm.memberCount} {t("teamsPage.membersLabel")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/60 backdrop-blur-sm border border-white/80">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[11px] font-semibold text-gray-600">
                      {t("misc.active")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 p-4 text-center group-hover:bg-white/80 transition-colors duration-300">
                    <div className="text-2xl font-bold text-gray-900">
                      {tm.memberCount}
                    </div>
                    <div className="text-[11px] text-gray-500 font-semibold mt-0.5">
                      {t("teamsPage.membersCount")}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 p-4 text-center group-hover:bg-white/80 transition-colors duration-300">
                    <div className="text-2xl font-bold text-gray-900">
                      {tm.openTickets}
                    </div>
                    <div className="text-[11px] text-gray-500 font-semibold mt-0.5">
                      {t("teamsPage.openTickets")}
                    </div>
                  </div>
                </div>

                {lead && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-[11px] font-bold text-white shadow-md`}
                      >
                        {lead.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 font-medium block">
                          {t("teamsPage.teamLead")}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">
                          {lead.name}
                        </span>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                )}

                {!lead && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                    <span className="text-xs text-gray-400 italic">
                      {t("teamsPage.noLeadAssigned")}
                    </span>
                    <svg
                      className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}

          {teams.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-5">
                <svg
                  className="w-10 h-10 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-600">
                {t("teamsPage.notFound")}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {t("teamsPage.willAppear")}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Members View */
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-xl overflow-hidden shadow-sm animate-scale-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100/80">
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t("teamsPage.th.member")}
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t("teamsPage.th.role")}
                  </th>
                  <th className="hidden sm:table-cell text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t("teamsPage.th.team")}
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t("teamsPage.th.status")}
                  </th>
                  <th className="hidden sm:table-cell text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t("teamsPage.th.active")}
                  </th>
                  <th className="hidden sm:table-cell text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t("teamsPage.th.resolved")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {users.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-blue-50/30 transition-all duration-300 group cursor-default animate-slide-up stagger-${Math.min(i + 1, 8)}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/60 flex items-center justify-center text-sm font-bold text-gray-500 group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
                            {u.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[2.5px] border-white shadow-sm ${
                              statusColor[u.status] || "bg-gray-300"
                            } ${u.status === "active" ? "group-hover:animate-pulse" : ""}`}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                            {u.name}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-bold ${
                          roleColor[u.role] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <span className="text-sm text-gray-600 font-medium">
                        {u.team || "\u2014"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${
                          statusBadge[u.status] || "bg-gray-50 text-gray-500 border border-gray-200/60"
                        }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            statusColor[u.status] || "bg-gray-300"
                          }`}
                        />
                        <span className="capitalize">{u.status}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-gray-900">
                          {u.activeTickets}
                        </div>
                        {u.activeTickets > 0 && (
                          <div className="h-1.5 w-12 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  (u.activeTickets /
                                    Math.max(
                                      ...users.map((x) => x.activeTickets),
                                      1
                                    )) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <span className="text-sm font-medium text-gray-500">
                        {u.resolvedTickets}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-5">
                <svg
                  className="w-10 h-10 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-600">
                {t("teamsPage.noMembersFound")}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {t("teamsPage.membersWillAppear")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
