"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n/context";

interface TicketData {
  id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  channel: string;
  sentiment: string;
  sentimentScore: number;
  aiConfidence: number;
  slaStatus: string;
  slaDue: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  customer: {
    name: string;
    email: string;
    company: string;
    segment: string;
    csat: number;
    totalTickets: number;
  };
  assignee: {
    name: string;
    email: string;
  };
}

interface Message {
  id: string;
  senderType: string;
  senderName: string;
  content: string;
  channel: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const statusColor: Record<string, string> = {
  open: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
  pending: "bg-gradient-to-r from-amber-400 to-amber-500 text-white",
  escalated: "bg-gradient-to-r from-red-500 to-red-600 text-white",
  resolved: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
};

const priorityColor: Record<string, string> = {
  low: "text-gray-500",
  medium: "text-amber-500 font-semibold",
  high: "text-orange-500 font-semibold",
  urgent: "text-red-500 font-semibold",
};

const getChannelDisplayNames = (t: (key: string) => string): Record<string, string> => ({
  whatsapp: t("channels.whatsapp.name") || "WhatsApp",
  email: t("channels.email.name") || "Email",
  web: t("channels.webchat.name") || "Web Chat",
  sms: t("channels.sms.name") || "SMS",
  messenger: t("channels.messenger.name") || "Messenger",
  instagram: t("channels.instagram.name") || "Instagram",
});

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function TicketDetailPage() {
  const { t } = useLang();
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tickets/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTicket(data.ticket || null);
        setMessages(data.messages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 animate-fade-in">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-blue-200 animate-spin" />
          <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg">
            <svg className="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gradient mb-2">{t("ticketDetailPage.notFound")}</h2>
        <p className="text-sm text-gray-500 mb-8 text-center max-w-xs">
          {t("ticketDetailPage.notFoundDesc")}
        </p>
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover-lift transition-all duration-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t("ticketDetailPage.backToTickets")}
        </Link>
      </div>
    );
  }

  const customerInitials =
    ticket.customer?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("") || "?";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 transition-colors duration-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t("ticketDetailPage.back")}
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient animate-fade-in">
            {ticket.ticketNumber}
          </h1>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${statusColor[ticket.status] || "bg-gray-100 text-gray-600"}`}
          >
            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
          </span>
          <span className={`text-sm capitalize ${priorityColor[ticket.priority] || "text-gray-500"}`}>
            <svg className="inline h-3.5 w-3.5 mr-0.5 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {ticket.priority}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages Panel */}
        <div className="lg:col-span-2">
          <div className="card-premium rounded-2xl overflow-hidden animate-stagger-in">
            {/* Subject Header */}
            <div className="border-b border-white/10 bg-white/50 backdrop-blur-sm px-6 py-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {ticket.subject}
              </h2>
            </div>

            {/* Messages */}
            <div className="glass-dark max-h-[600px] overflow-y-auto p-6 space-y-4">
              {messages.length > 0 ? (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.senderType === "customer" ? "justify-start" : "justify-end"} animate-fade-in`}
                  >
                    <div
                      className={`max-w-lg rounded-2xl px-5 py-3.5 shadow-sm ${
                        m.senderType === "customer"
                          ? "bg-white/80 backdrop-blur-sm border border-gray-100 text-gray-900"
                          : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20"
                      }`}
                    >
                      <div
                        className={`text-[11px] font-medium mb-1.5 ${
                          m.senderType === "customer" ? "text-gray-400" : "text-blue-100"
                        }`}
                      >
                        {m.senderName} &middot; {formatTime(m.createdAt)}
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-500 mb-2">{t("ticketDetailPage.noMessages")}</p>
                  <div className="mt-4 p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 text-left max-w-lg mx-auto">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("ticketDetailPage.initialMessage")}</div>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.message}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-100 bg-white/80 backdrop-blur-sm p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={t("ticketDetailPage.typeMessage")}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-200 placeholder:text-gray-400"
                />
                <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover-lift transition-all duration-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {t("ticketDetailPage.send")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="card-premium rounded-2xl p-6 animate-stagger-in">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t("ticketDetailPage.customer")}
            </h3>
            <div className="flex items-center gap-4 mb-5">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/25">
                  {customerInitials}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{ticket.customer?.name || t("ticketDetailPage.unknown")}</div>
                <div className="text-sm text-gray-500">{ticket.customer?.email || ""}</div>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-400">{t("ticketDetailPage.company")}</span>
                <span className="font-medium text-gray-700">{ticket.customer?.company || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-400">{t("ticketDetailPage.segment")}</span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 capitalize">
                  {ticket.customer?.segment || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400">{t("ticketDetailPage.totalTickets")}</span>
                <span className="font-medium text-gray-700">{ticket.customer?.totalTickets || 0}</span>
              </div>
            </div>
          </div>

          {/* Properties */}
          <div className="card-premium rounded-2xl p-6 animate-stagger-in">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t("ticketDetailPage.properties")}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-400">Status</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[ticket.status] || "bg-gray-100 text-gray-600"}`}
                >
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-400">{t("ticketDetailPage.priority")}</span>
                <span className={`font-medium capitalize ${priorityColor[ticket.priority] || "text-gray-500"}`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-400">{t("ticketDetailPage.channel")}</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
                  {getChannelDisplayNames(t)[ticket.channel] || ticket.channel}
                </span>
              </div>
              {ticket.assignee?.name && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-400">{t("ticketDetailPage.assignee")}</span>
                  <span className="font-medium text-gray-700">{ticket.assignee.name}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-400">{t("ticketDetailPage.aiConfidence")}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${ticket.aiConfidence}%` }}
                    />
                  </div>
                  <span className="font-medium text-gray-700 text-xs">{ticket.aiConfidence}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400">{t("ticketDetailPage.sentiment")}</span>
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 capitalize">
                  {ticket.sentiment}
                </span>
              </div>
            </div>
          </div>

          {/* SLA Status */}
          <div className="card-premium rounded-2xl p-6 animate-stagger-in">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("ticketDetailPage.slaStatus")}
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-gray-400">{t("ticketDetailPage.status")}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      ticket.slaStatus === "breached"
                        ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                        : ticket.slaStatus === "ok"
                          ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                          : "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        ticket.slaStatus === "breached"
                          ? "bg-red-500"
                          : ticket.slaStatus === "ok"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                      }`}
                    />
                    {ticket.slaStatus === "breached"
                      ? t("ticketDetailPage.breached")
                      : ticket.slaStatus === "ok"
                        ? t("ticketDetailPage.onTrack")
                        : ticket.slaStatus}
                  </span>
                </div>
                {/* SLA Progress Bar */}
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      ticket.slaStatus === "breached"
                        ? "bg-gradient-to-r from-red-400 to-red-500 w-full"
                        : ticket.slaStatus === "ok"
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500 w-3/4"
                          : "bg-gradient-to-r from-amber-400 to-amber-500 w-1/2"
                    }`}
                  />
                </div>
              </div>

              {/* Tags */}
              {ticket.tags && ticket.tags.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-3 font-medium">{t("ticketDetailPage.tags")}</div>
                  <div className="flex flex-wrap gap-2">
                    {ticket.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100 hover:ring-blue-200 transition-all duration-200 hover-lift"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
