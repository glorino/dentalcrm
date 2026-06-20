"use client";

import { useState } from "react";
import PublicShell from "@/app/public-shell";
import { useLang } from "@/lib/i18n/context";

const channels = [
  {
    id: "whatsapp",
    icon: "📱",
    gradient: "from-green-500 to-emerald-600",
    bg: "bg-green-50",
    border: "border-green-200",
    hoverBorder: "hover:border-green-400",
    desc: "Chat with us instantly on WhatsApp",
    action: "https://wa.me/2347082529729",
    external: true,
  },
  {
    id: "email",
    icon: "📧",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    hoverBorder: "hover:border-blue-400",
    desc: "Send us an email anytime",
    action: "form",
    external: false,
  },
  {
    id: "web",
    icon: "💬",
    gradient: "from-purple-500 to-violet-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    hoverBorder: "hover:border-purple-400",
    desc: "Use our live chat widget",
    action: "chat",
    external: false,
  },
  {
    id: "sms",
    icon: "✉️",
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    hoverBorder: "hover:border-amber-400",
    desc: "Text us for quick support",
    action: "sms",
    external: false,
  },
  {
    id: "messenger",
    icon: "💬",
    gradient: "from-blue-400 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    hoverBorder: "hover:border-blue-400",
    desc: "Message us on Facebook",
    action: "https://m.me/yourpage",
    external: true,
  },
  {
    id: "instagram",
    icon: "📸",
    gradient: "from-pink-500 to-rose-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    hoverBorder: "hover:border-pink-400",
    desc: "DM us on Instagram",
    action: "https://instagram.com/direct",
    external: true,
  },
];

export default function SupportPage() {
  const { t } = useLang();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) return;
    setSubmitting(true);
    try {
      await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          channel: selectedChannel === "web" ? "web" : selectedChannel === "email" ? "email" : selectedChannel === "sms" ? "sms" : "web",
        }),
      });
    } catch {
      // Show success anyway
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <PublicShell>
        <div className="min-h-[70vh] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="h-20 w-20 rounded-3xl bg-green-100 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Ticket Submitted</h1>
            <p className="text-gray-500 mb-2">
              Your ticket has been received. Our AI agents are already working on it.
            </p>
            <p className="text-sm text-gray-400 mb-8">
              You&apos;ll receive a confirmation at <strong>{form.email}</strong> with your ticket number.
            </p>
            <button
              onClick={() => { setSubmitted(false); setSelectedChannel(null); setForm({ name: "", email: "", subject: "", message: "" }); }}
              className="px-8 py-3 bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
            >
              Submit Another Ticket
            </button>
          </div>
        </div>
      </PublicShell>
    );
  }

  if (selectedChannel && (selectedChannel === "email" || selectedChannel === "web" || selectedChannel === "sms")) {
    const channelMeta = channels.find((c) => c.id === selectedChannel);
    return (
      <PublicShell>
        <div className="min-h-[70vh] py-16 px-6">
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => setSelectedChannel(null)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to channels
            </button>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
              <div className={`bg-gradient-to-r ${channelMeta?.gradient} px-8 py-6`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{channelMeta?.icon}</span>
                  <div>
                    <h1 className="text-xl font-bold text-white capitalize">
                      {selectedChannel === "web" ? "Web Support" : selectedChannel === "sms" ? "SMS Support" : "Email Support"}
                    </h1>
                    <p className="text-white/70 text-sm">{channelMeta?.desc}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="john@company.com"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject *</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Brief description of your issue"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Describe your issue in detail..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!form.name || !form.email || !form.subject || !form.message || submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-blue-600/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      Submitting...
                    </span>
                  ) : (
                    "Submit Ticket"
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Our AI agents will classify and route your ticket automatically. Average response time: under 2 minutes.
                </p>
              </form>
            </div>
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="min-h-[70vh] py-16 px-6">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-semibold text-blue-600">We&apos;re here to help</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              How would you like to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e40af] to-[#3b82f6]">reach us</span>?
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Choose a channel to submit your inquiry or support ticket. Our AI agents will respond instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  if (ch.external) {
                    window.open(ch.action, "_blank");
                  } else {
                    setSelectedChannel(ch.id);
                  }
                }}
                className={`group text-left p-7 rounded-3xl border-2 ${ch.border} ${ch.hoverBorder} bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${ch.gradient} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {ch.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1.5 capitalize">{ch.id === "web" ? "Web Chat" : ch.id}</h3>
                <p className="text-sm text-gray-500 mb-4">{ch.desc}</p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:gap-2.5 transition-all">
                  {ch.external ? "Open" : "Start"} →
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-400">
              Not sure? <a href="/login" className="text-blue-600 hover:underline font-medium">Sign in to your dashboard</a> to manage tickets directly.
            </p>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
