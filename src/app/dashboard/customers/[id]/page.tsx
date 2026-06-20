"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n/context";

interface CustomerData {
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

interface Ticket {
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  channel: string;
  createdAt: string;
}

const statusColor: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  escalated: "bg-red-100 text-red-700",
  resolved: "bg-green-100 text-green-700",
};

const priorityColor: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const channelIcon: Record<string, string> = {
  whatsapp: "📱",
  email: "📧",
  web: "💬",
  sms: "💬",
  messenger: "💬",
  instagram: "📸",
};

function formatNaira(amount: number | string): string {
  return `₦${Number(amount || 0).toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export default function CustomerDetailPage() {
  const { t } = useLang();
  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCustomer(data.customer || null);
        setRecentTickets(data.recentTickets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

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

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="text-7xl mb-5">👤</div>
        <h2 className="text-2xl font-bold text-gradient-premium mb-2">{t("customerDetailPage.notFound")}</h2>
        <p className="text-sm text-gray-500 mb-8">{t("customerDetailPage.notFoundDesc")}</p>
        <Link href="/dashboard/customers" className="btn-primary">
          {t("customerDetailPage.backToCustomers")}
        </Link>
      </div>
    );
  }

  const initials = customer.name.split(" ").map((n) => n[0]).join("");

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors duration-300 group animate-fade-in"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t("customerDetailPage.backToCustomers")}
      </Link>

      {/* Header Card */}
      <div className="rounded-3xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl shadow-black/[0.03] p-6 sm:p-8 animate-slide-up">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-blue-500/25 animate-scale-in">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{customer.name}</h1>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${customer.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {customer.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-1">{customer.email} · {customer.company}</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-3xl font-bold text-gradient-premium">{formatNaira(customer.ltv || 0)}</div>
            <div className="text-xs text-gray-500 font-medium">{t("customerDetailPage.lifetimeValue")}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="rounded-3xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl shadow-black/[0.03] p-5 animate-slide-up animate-delay-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t("customerDetailPage.contactInformation")}</h3>
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm shadow-lg shadow-blue-500/20">
                  📧
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{t("customerDetailPage.email")}</div>
                  <div className="text-sm font-semibold text-gray-900">{customer.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm shadow-lg shadow-amber-500/20">
                  📅
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{t("customerDetailPage.customerSince")}</div>
                  <div className="text-sm font-semibold text-gray-900">{formatDate(customer.createdAt)}</div>
                </div>
              </div>
              {customer.sourceChannel && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm shadow-lg shadow-green-500/20">
                    {channelIcon[customer.sourceChannel] || "💬"}
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{t("customerDetailPage.sourceChannel")}</div>
                    <div className="text-sm font-semibold text-gray-900 capitalize">{customer.sourceChannel}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div className="rounded-3xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl shadow-black/[0.03] p-5 animate-slide-up animate-delay-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t("customerDetailPage.accountDetails")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50/80 border border-purple-200/50 p-3">
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{t("customerDetailPage.segment")}</div>
                <div className="text-sm font-bold text-gray-900 capitalize">{customer.segment}</div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/80 border border-blue-200/50 p-3">
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{t("customerDetailPage.plan")}</div>
                <div className="text-sm font-bold text-gray-900 capitalize">{customer.plan}</div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50/80 border border-green-200/50 p-3">
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{t("customerDetailPage.totalTickets")}</div>
                <div className="text-sm font-bold text-gray-900">{customer.totalTickets}</div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/80 border border-amber-200/50 p-3">
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{t("customerDetailPage.csatScore")}</div>
                <div className="text-sm font-bold text-gray-900">{customer.csat || 0} ★</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tickets */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl shadow-black/[0.03] p-5 animate-slide-up animate-delay-300">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">{t("customerDetailPage.recentTickets")}</h3>
              <Link
                href={`/dashboard/tickets?channel=${customer.sourceChannel || ""}`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {t("customerDetailPage.viewAll")}
              </Link>
            </div>
            <div className="space-y-2.5">
              {recentTickets.map((ticket, i) => (
                <Link
                  key={ticket.ticketNumber}
                  href={`/dashboard/tickets/${ticket.ticketNumber.replace("SSV-", "")}`}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-300 group animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{ticket.ticketNumber}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor[ticket.status] || "bg-gray-100 text-gray-600"}`}>
                        {ticket.status}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityColor[ticket.priority] || "bg-gray-100 text-gray-600"}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {ticket.subject}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{timeAgo(ticket.createdAt)}</span>
                </Link>
              ))}
              {recentTickets.length === 0 && (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">📭</div>
                  <div className="text-sm font-medium text-gray-400">{t("customerDetailPage.noTickets")}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
