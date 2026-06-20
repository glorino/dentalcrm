"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import PublicShell from "./public-shell";
import { useLang } from "@/lib/i18n/context";
import { BookDemoModal } from "@/components/book-demo-modal";

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <div ref={ref} className={`${className} transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function AnimatedCounter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useScrollReveal(0.3);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 2000;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  const { t } = useLang();
  const [wordIndex, setWordIndex] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [demoOpen, setDemoOpen] = useState(false);

  const heroWords = [t("landing.heroWords.ticket"), t("landing.heroWords.query"), t("landing.heroWords.complaint"), t("landing.heroWords.request")];

  const features = [
    { num: "01", title: t("landing.features.intake.title"), desc: t("landing.features.intake.desc"), color: "blue", gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-600", iconBg: "bg-blue-500", bullets: (t("landing.features.intake.bullets") || "").split(",").map((s: string) => s.trim()) || ["Auto-classification", "Smart routing", "Instant response"], feed: [{ icon: "✓", text: "Classified", detail: "Billing inquiry" }, { icon: "✓", text: "Routed", detail: "Urgent issue → Tier 2" }, { icon: "✓", text: "Resolved", detail: "Password reset" }] },
    { num: "02", title: t("landing.features.inbox.title"), desc: t("landing.features.inbox.desc"), color: "emerald", gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600", iconBg: "bg-emerald-500", bullets: (t("landing.features.inbox.bullets") || "").split(",").map((s: string) => s.trim()) || ["6 channels unified", "Real-time sync", "Full context"], feed: [{ icon: "✓", text: "WhatsApp", detail: "Order status inquiry" }, { icon: "✓", text: "Email", detail: "Refund request received" }, { icon: "✓", text: "Web Chat", detail: "New visitor from Lagos" }] },
    { num: "03", title: t("landing.features.sentiment.title"), desc: t("landing.features.sentiment.desc"), color: "purple", gradient: "from-purple-500 to-purple-600", bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-600", iconBg: "bg-purple-500", bullets: (t("landing.features.sentiment.bullets") || "").split(",").map((s: string) => s.trim()) || ["Real-time scoring", "Trend alerts", "Churn prediction"], feed: [{ icon: "✓", text: "Detected", detail: "Frustrated tone — escalated" }, { icon: "✓", text: "Scored", detail: "Positive (0.92) — closed" }, { icon: "!", text: "Alert", detail: "Negative trend on WhatsApp" }] },
    { num: "04", title: t("landing.features.sla.title"), desc: t("landing.features.sla.desc"), color: "amber", gradient: "from-amber-500 to-amber-600", bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-600", iconBg: "bg-amber-500", bullets: (t("landing.features.sla.bullets") || "").split(",").map((s: string) => s.trim()) || ["Auto-escalation", "SLA tracking", "Compliance reporting"], feed: [{ icon: "✓", text: "Enforced", detail: "SLA 2h met for SSV-1234" }, { icon: "✕", text: "Breached", detail: "SSV-1230 exceeded 4h" }, { icon: "✓", text: "Escalated", detail: "SSV-1228 → Manager" }] },
    { num: "05", title: t("landing.features.knowledge.title"), desc: t("landing.features.knowledge.desc"), color: "cyan", gradient: "from-cyan-500 to-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100", text: "text-cyan-600", iconBg: "bg-cyan-500", bullets: (t("landing.features.knowledge.bullets") || "").split(",").map((s: string) => s.trim()) || ["Auto-ingestion", "Semantic search", "AI-powered answers"], feed: [{ icon: "✓", text: "Indexed", detail: "12 new articles processed" }, { icon: "✓", text: "Matched", detail: "Q: reset password → A: #42" }, { icon: "✓", text: "Auto-resolved", detail: "Shipping policy question" }] },
    { num: "06", title: t("landing.features.analytics.title"), desc: t("landing.features.analytics.desc"), color: "rose", gradient: "from-rose-500 to-rose-600", bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-600", iconBg: "bg-rose-500", bullets: (t("landing.features.analytics.bullets") || "").split(",").map((s: string) => s.trim()) || ["Live dashboards", "Export reports", "Custom metrics"], feed: [{ icon: "✓", text: "Updated", detail: "Resolution rate: 87%" }, { icon: "!", text: "Alert", detail: "CSAT dipped below 4.0" }, { icon: "✓", text: "Report", detail: "Weekly summary generated" }] },
  ];

  const agents = [
    { name: "Intake", desc: t("landing.agents.intake"), color: "from-blue-500 to-blue-600", gradient: "#3b82f6" },
    { name: "Knowledge", desc: t("landing.agents.knowledge"), color: "from-emerald-500 to-emerald-600", gradient: "#10b981" },
    { name: "Resolution", desc: t("landing.agents.resolution"), color: "from-purple-500 to-purple-600", gradient: "#8b5cf6" },
    { name: "QA", desc: t("landing.agents.qa"), color: "from-amber-500 to-amber-600", gradient: "#f59e0b" },
    { name: "Escalation", desc: t("landing.agents.escalation"), color: "from-red-500 to-red-600", gradient: "#ef4444" },
    { name: "Sentiment", desc: t("landing.agents.sentiment"), color: "from-cyan-500 to-cyan-600", gradient: "#06b6d4" },
    { name: "Analytics", desc: t("landing.agents.analytics"), color: "from-rose-500 to-rose-600", gradient: "#f43f5e" },
  ];

  const channels = [
    { name: "WhatsApp", desc: t("landing.channels.whatsapp"), color: "from-[#25D366] to-[#128C7E]", icon: "M", stats: "whatsapp" },
    { name: "Email", desc: t("landing.channels.email"), color: "from-[#FF6600] to-[#E55B00]", icon: "@", stats: "email" },
    { name: "SMS", desc: t("landing.channels.sms"), color: "from-[#2196F3] to-[#1976D2]", icon: "~", stats: "sms" },
    { name: "Web Chat", desc: t("landing.channels.web"), color: "from-[#8B5CF6] to-[#7C3AED]", icon: "W", stats: "web_chat" },
    { name: "Messenger", desc: t("landing.channels.messenger"), color: "from-[#1877F2] to-[#0D65D9]", icon: "M", stats: "messenger" },
    { name: "Instagram", desc: t("landing.channels.instagram"), color: "from-[#833AB4] to-[#FD1D1D]", icon: "I", stats: "instagram" },
  ];

  useEffect(() => {
    const interval = setInterval(() => setWordIndex((i) => (i + 1) % heroWords.length), 2500);
    return () => clearInterval(interval);
  }, [heroWords.length]);

  useEffect(() => {
    fetch("/api/public/stats").then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  const ticket = stats?.tickets || { total: 0, open: 0, pending: 0, escalated: 0, resolved: 0, autoResolutionRate: 0 };
  const customer = stats?.customers || { total: 0 };
  const recentTickets = stats?.recentTickets || [];
  const channelStats = stats?.channels || [];
  const channelCounts: Record<string, number> = {};
  channelStats.forEach((c: any) => { channelCounts[c.channel] = c.count; });

  return (
    <PublicShell>
      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, #0b1a2e 0%, #0f2340 40%, #142d50 70%, #1a365d 100%)" }}>
        {/* Animated orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-blue-500/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" style={{ animation: "float 12s ease-in-out infinite" }} />
        <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] bg-purple-500/8 rounded-full blur-[80px]" style={{ animation: "float 15s ease-in-out infinite reverse" }} />
        <div className="absolute bottom-[20%] right-[15%] w-[250px] h-[250px] bg-emerald-500/6 rounded-full blur-[60px]" style={{ animation: "float 18s ease-in-out infinite" }} />

        <div className="relative max-w-[1200px] mx-auto px-6 pt-32 pb-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[13px] font-semibold text-blue-200 uppercase tracking-wider">{t("hero.badge")}</span>
              </div>
              <h1 className="text-[44px] sm:text-[58px] lg:text-[72px] font-extrabold leading-[0.95] tracking-tight text-white mb-6">
                {t("hero.title1")}{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-blue-300 italic">{heroWords[wordIndex]}</span>
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-blue-400/20 rounded-sm" />
                </span>
                <br />{t("hero.title2")}
              </h1>
              <p className="text-[17px] text-blue-100/70 max-w-lg mb-10 leading-relaxed">
                {t("hero.desc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/support" className="px-8 py-4 bg-white text-gray-900 rounded-2xl text-[15px] font-semibold hover:bg-gray-50 transition-all text-center shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]">
                  {t("hero.cta")}
                </Link>
                <button onClick={() => setDemoOpen(true)} className="px-8 py-4 bg-transparent border-2 border-blue-300/30 text-blue-200 rounded-2xl text-[15px] font-semibold hover:bg-white/5 transition-all text-center hover:scale-[1.02] active:scale-[0.98]">
                  {t("hero.demo")}
                </button>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-blue-500/5 rounded-3xl blur-3xl" />
              <div className="relative bg-white/[0.06] backdrop-blur-xl rounded-3xl border border-white/[0.08] p-6 space-y-4 shadow-2xl shadow-black/20">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Open", value: ticket.open, color: "text-blue-300", bg: "bg-blue-500/10" },
                    { label: "Pending", value: ticket.pending, color: "text-amber-300", bg: "bg-amber-500/10" },
                    { label: "Escalated", value: ticket.escalated, color: "text-red-300", bg: "bg-red-500/10" },
                    { label: "Resolved", value: ticket.resolved, color: "text-emerald-300", bg: "bg-emerald-500/10" },
                  ].map((s) => (
                    <div key={s.label} className={`text-center p-3 rounded-xl ${s.bg} border border-white/[0.05]`}>
                      <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Recent tickets */}
                <div className="space-y-2">
                  {recentTickets.slice(0, 3).map((rt: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.05]">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${
                          rt.status === "open" ? "bg-blue-400" :
                          rt.status === "pending" ? "bg-amber-400" :
                          rt.status === "escalated" ? "bg-red-400" : "bg-emerald-400"
                        }`} />
                        <span className="text-xs font-mono text-blue-300/80">{rt.ticket_number}</span>
                        <span className="text-xs text-gray-300 truncate">{rt.subject}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0 ml-2">{rt.customer_name || "Customer"}</span>
                    </div>
                  ))}
                  {recentTickets.length === 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.05]">
                      <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-xs text-gray-400">Connecting to database...</span>
                    </div>
                  )}
                </div>
                {/* Channels */}
                <div className="flex gap-2 flex-wrap">
                  {["whatsapp", "email", "web_chat", "sms", "messenger", "instagram"].map((ch) => (
                    <span key={ch} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05] text-[11px] text-gray-300 capitalize">
                      {ch.replace("_", " ")} {channelCounts[ch] ? `${channelCounts[ch]}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ═══════ LIVE STATS ═══════ */}
      <RevealSection className="relative -mt-12 z-10 max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t("stats.autoResolution"), value: ticket.autoResolutionRate || 67, suffix: "%", gradient: "from-blue-500 to-blue-600", icon: "⚡", iconBg: "bg-blue-500" },
            { label: t("stats.avgResponse"), value: 42, suffix: "s", gradient: "from-emerald-500 to-emerald-600", icon: "⏱", iconBg: "bg-emerald-500" },
            { label: t("stats.uptime"), value: 99.99, suffix: "%", gradient: "from-purple-500 to-purple-600", icon: "🛡", iconBg: "bg-purple-500" },
            { label: t("stats.customers"), value: customer.total || 16, suffix: "+", gradient: "from-amber-500 to-amber-600", icon: "👥", iconBg: "bg-amber-500" },
          ].map((stat, i) => (
            <RevealSection key={stat.label} delay={i * 100}>
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${stat.gradient.includes("blue") ? "#3b82f6" : stat.gradient.includes("emerald") ? "#10b981" : stat.gradient.includes("purple") ? "#8b5cf6" : "#f59e0b"}, ${stat.gradient.includes("blue") ? "#6366f1" : stat.gradient.includes("emerald") ? "#14b8a6" : stat.gradient.includes("purple") ? "#a855f7" : "#f97316"})` }} />
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-lg mb-3 shadow-lg`}>
                  <span className="brightness-0 invert">{stat.icon}</span>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
              </div>
            </RevealSection>
          ))}
        </div>
      </RevealSection>

      {/* ═══════ TRUSTED BY ═══════ */}
      <section className="py-28 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #f6f8fb 0%, #eef1f6 50%, #f0f2f7 100%)" }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.4) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <RevealSection>
          <div className="max-w-[1200px] mx-auto px-6 relative z-10">
            <div className="text-center mb-14">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.25em] mb-4">{t("trusted.title")}</p>
              <div className="flex items-center justify-center gap-4">
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                <div className="h-1 w-1 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-[1px] rounded-2xl overflow-hidden shadow-lg shadow-gray-200/40 border border-white/60 backdrop-blur-sm">
              {[
                { name: "Paystack", accent: "hover:shadow-blue-500/5" },
                { name: "Kuda", accent: "hover:shadow-blue-500/5" },
                { name: "PiggyVest", accent: "hover:shadow-green-500/5" },
                { name: "Chipper", accent: "hover:shadow-purple-500/5" },
                { name: "Moniepoint", accent: "hover:shadow-blue-500/5" },
                { name: "FairMoney", accent: "hover:shadow-amber-500/5" },
                { name: "Glovo", accent: "hover:shadow-green-500/5" },
                { name: "Wema Bank", accent: "hover:shadow-red-500/5" },
                { name: "Arm", accent: "hover:shadow-indigo-500/5" },
                { name: "Tolaram", accent: "hover:shadow-orange-500/5" },
                { name: "Chowdeck", accent: "hover:shadow-green-500/5" },
                { name: "Yellow Card", accent: "hover:shadow-yellow-500/5" },
              ].map((company) => (
                <div key={company.name} className={`flex items-center justify-center h-[78px] bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 group cursor-default ${company.accent} hover:shadow-lg`}>
                  <span className="text-[13px] font-semibold text-gray-400/80 tracking-wide group-hover:text-gray-500 group-hover:tracking-wider transition-all duration-300">{company.name}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center mt-10">
              <Link href="/about" className="inline-flex items-center gap-2 text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors duration-300 group px-5 py-2.5 rounded-full border border-gray-200/60 hover:border-gray-300/60 hover:bg-white/50 backdrop-blur-sm">
                {t("trusted.readAll")}
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ═══════ THE PROBLEM ═══════ */}
      <RevealSection className="py-24 section-mesh">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">{t("problem.label")}</p>
          <h2 className="text-[34px] sm:text-[46px] font-extrabold tracking-tight mb-4 leading-[1.05]">
            {t("problem.title")}
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-16">{t("problem.desc")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "!", title: t("landing.problems.triage.title"), desc: t("landing.problems.triage.desc"), gradient: "from-blue-500 to-blue-600", topClass: "card-top-blue" },
              { icon: "~", title: t("landing.problems.escalation.title"), desc: t("landing.problems.escalation.desc"), gradient: "from-rose-500 to-rose-600", topClass: "card-top-rose" },
              { icon: "●", title: t("landing.problems.resolution.title"), desc: t("landing.problems.resolution.desc"), gradient: "from-amber-500 to-amber-600", topClass: "card-top-amber" },
              { icon: "↻", title: t("landing.problems.fallback.title"), desc: t("landing.problems.fallback.desc"), gradient: "from-gray-400 to-gray-500", topClass: "" },
            ].map((card, i) => (
              <RevealSection key={card.title} delay={i * 100}>
                <div className={`text-left p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 group bg-white ${card.topClass}`}>
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white text-lg font-bold mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══════ THE SOLUTION ═══════ */}
      <section className="relative py-24 overflow-hidden" style={{ background: "linear-gradient(135deg, #0b1a2e 0%, #0f2340 40%, #142d50 70%, #1a365d 100%)" }}>
        <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="max-w-[1200px] mx-auto px-6 text-center relative">
          <p className="text-sm font-bold text-blue-300 uppercase tracking-[0.2em] mb-4">{t("solution.label")}</p>
          <h2 className="text-[34px] sm:text-[46px] font-extrabold tracking-tight text-white mb-6 leading-[1.05]">
            {t("solution.title")}
          </h2>
          <p className="text-blue-100/70 text-lg max-w-2xl mx-auto leading-relaxed">
            {t("solution.desc")}
          </p>
        </div>
      </section>

      {/* ═══════ FEATURES 01-06 ═══════ */}
      <section id="features" className="relative py-20">
        <div className="max-w-[1200px] mx-auto px-6 relative">
          <RevealSection className="text-center mb-16">
            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.25em] mb-4">{t("features.label")}</p>
            <h2 className="text-[34px] sm:text-[46px] font-extrabold tracking-tight leading-[1.05]">
              {t("features.title")}
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto mt-4">{t("features.subtitle")}</p>
          </RevealSection>

          <div className="space-y-8">
            {features.map((feat, idx) => {
              const cardColors: Record<string, { gradient: string; topBar: string; bg: string; badgeBg: string; feedBg: string; feedBorder: string; eventIconBg: string; eventIconText: string; alertIconBg: string; alertIconText: string }> = {
                blue: { gradient: "from-blue-500 to-blue-600", topBar: "linear-gradient(90deg, #3b82f6, #6366f1)", bg: "bg-blue-50/50", badgeBg: "bg-blue-100", feedBg: "bg-blue-50/60", feedBorder: "border-blue-100/60", eventIconBg: "bg-emerald-100", eventIconText: "text-emerald-600", alertIconBg: "bg-amber-100", alertIconText: "text-amber-600" },
                emerald: { gradient: "from-emerald-500 to-emerald-600", topBar: "linear-gradient(90deg, #10b981, #14b8a6)", bg: "bg-emerald-50/50", badgeBg: "bg-emerald-100", feedBg: "bg-emerald-50/60", feedBorder: "border-emerald-100/60", eventIconBg: "bg-emerald-100", eventIconText: "text-emerald-600", alertIconBg: "bg-amber-100", alertIconText: "text-amber-600" },
                purple: { gradient: "from-purple-500 to-purple-600", topBar: "linear-gradient(90deg, #8b5cf6, #a855f7)", bg: "bg-purple-50/50", badgeBg: "bg-purple-100", feedBg: "bg-purple-50/60", feedBorder: "border-purple-100/60", eventIconBg: "bg-emerald-100", eventIconText: "text-emerald-600", alertIconBg: "bg-amber-100", alertIconText: "text-amber-600" },
                amber: { gradient: "from-amber-500 to-amber-600", topBar: "linear-gradient(90deg, #f59e0b, #f97316)", bg: "bg-amber-50/50", badgeBg: "bg-amber-100", feedBg: "bg-amber-50/60", feedBorder: "border-amber-100/60", eventIconBg: "bg-emerald-100", eventIconText: "text-emerald-600", alertIconBg: "bg-red-100", alertIconText: "text-red-600" },
                cyan: { gradient: "from-cyan-500 to-cyan-600", topBar: "linear-gradient(90deg, #06b6d4, #0891b2)", bg: "bg-cyan-50/50", badgeBg: "bg-cyan-100", feedBg: "bg-cyan-50/60", feedBorder: "border-cyan-100/60", eventIconBg: "bg-emerald-100", eventIconText: "text-emerald-600", alertIconBg: "bg-amber-100", alertIconText: "text-amber-600" },
                rose: { gradient: "from-rose-500 to-rose-600", topBar: "linear-gradient(90deg, #f43f5e, #e11d48)", bg: "bg-rose-50/50", badgeBg: "bg-rose-100", feedBg: "bg-rose-50/60", feedBorder: "border-rose-100/60", eventIconBg: "bg-emerald-100", eventIconText: "text-emerald-600", alertIconBg: "bg-amber-100", alertIconText: "text-amber-600" },
              };
              const c = cardColors[feat.color] || cardColors.blue;
              return (
                <RevealSection key={feat.num} delay={idx * 80}>
                  <div className={`grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden min-h-[380px] border border-gray-100/80 hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-500 hover:-translate-y-1`} style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: c.topBar }} />
                    <div className={`p-10 lg:p-14 flex flex-col justify-center ${idx % 2 === 1 ? "order-2 lg:order-2" : ""}`}>
                      <div className="flex items-center gap-3 mb-5">
                        <span className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center text-white text-sm font-extrabold shadow-lg group-hover:scale-110 transition-transform`}>{feat.num}</span>
                        <span className={`text-[11px] font-bold ${feat.text} uppercase tracking-[0.15em]`}>{feat.title}</span>
                      </div>
                      <h3 className="text-[24px] sm:text-[28px] font-extrabold leading-tight mb-4 text-gray-900">{feat.title}</h3>
                      <p className="text-gray-500 leading-relaxed mb-6 text-[15px]">{feat.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {feat.bullets.map((b) => (
                          <span key={b} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl ${feat.bg} border ${feat.border} text-[13px] font-semibold ${feat.text} transition-all duration-200 hover:shadow-sm hover:scale-[1.02]`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={`p-8 flex flex-col justify-center ${idx % 2 === 1 ? "order-1 lg:order-1" : ""} ${c.bg} border-l border-gray-100/60`}>
                      <div className="flex items-center gap-2 mb-5">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Live Event Feed</p>
                      </div>
                      <div className="space-y-3">
                        {feat.feed.map((e, ei) => (
                          <div key={ei} className="flex items-center gap-3 p-4 rounded-2xl border bg-white/80 hover:bg-white transition-all duration-300 hover:shadow-md hover:scale-[1.01]" style={{ borderColor: "rgba(0,0,0,0.04)", animationDelay: `${ei * 200}ms` }}>
                            <span className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                              e.icon === "✓" ? `${c.eventIconBg} ${c.eventIconText}` :
                              e.icon === "!" ? `${c.alertIconBg} ${c.alertIconText}` :
                              "bg-red-100 text-red-600"
                            }`}>
                              {e.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-gray-800">{e.text}</span>
                              <span className="text-xs text-gray-400 ml-2">{e.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </RevealSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ CHANNELS ═══════ */}
      <section id="channels" className="py-24 border-t border-gray-100/80 section-mesh-blue">
        <div className="max-w-[1200px] mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">{t("channels.label")}</p>
            <h2 className="text-[34px] sm:text-[46px] font-extrabold tracking-tight leading-[1.05]">
              {t("channels.title")}
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto mt-4">{t("channels.desc")}</p>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {channels.map((ch, i) => (
              <RevealSection key={ch.name} delay={i * 80}>
                <Link href="/channels" className="block group">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-gray-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden card-top-blue" style={{ ["--top-color" as any]: "transparent" }}>
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${ch.color.includes("25D366") ? "#25D366" : ch.color.includes("FF6600") ? "#FF6600" : ch.color.includes("2196F3") ? "#2196F3" : ch.color.includes("8B5CF6") ? "#8B5CF6" : ch.color.includes("1877F2") ? "#1877F2" : "#833AB4"}, ${ch.color.includes("25D366") ? "#128C7E" : ch.color.includes("FF6600") ? "#E55B00" : ch.color.includes("2196F3") ? "#1976D2" : ch.color.includes("8B5CF6") ? "#7C3AED" : ch.color.includes("1877F2") ? "#0D65D9" : "#FD1D1D"})` }} />
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${ch.color} flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                        {ch.icon}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-xs text-gray-400 font-medium">{channelCounts[ch.stats] || 0} tickets</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{ch.name}</h3>
                    <p className="text-sm text-gray-400">{ch.desc}</p>
                  </div>
                </Link>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ AI AGENTS ═══════ */}
      <section id="agents" className="py-24 border-t border-gray-100/80 section-mesh-purple">
        <div className="max-w-[1200px] mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">{t("agents.label")}</p>
            <h2 className="text-[34px] sm:text-[46px] font-extrabold tracking-tight leading-[1.05]">
              {t("agents.title")}
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto mt-4">{t("agents.desc")}</p>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {agents.map((agent, i) => (
              <RevealSection key={agent.name} delay={i * 80}>
                <Link href="/agents" className="block group">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-gray-200 hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${agent.gradient}, ${agent.gradient}dd)` }} />
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-white font-bold text-sm shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                      AI
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{agent.name} Agent</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{agent.desc}</p>
                  </div>
                </Link>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-24 border-t border-gray-100/80 section-mesh-emerald">
        <div className="max-w-[1200px] mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">{t("howItWorks.label")}</p>
            <h2 className="text-[34px] sm:text-[46px] font-extrabold tracking-tight leading-[1.05]">
              {t("howItWorks.title")}
            </h2>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", icon: "↓", title: t("landing.steps.ingest.title"), desc: t("landing.steps.ingest.desc"), gradient: "from-blue-500 to-blue-600" },
              { num: "02", icon: "⚡", title: t("landing.steps.classify.title"), desc: t("landing.steps.classify.desc"), gradient: "from-emerald-500 to-emerald-600" },
              { num: "03", icon: "↗", title: t("landing.steps.resolve.title"), desc: t("landing.steps.resolve.desc"), gradient: "from-purple-500 to-purple-600" },
              { num: "04", icon: "✓", title: t("landing.steps.escalate.title"), desc: t("landing.steps.escalate.desc"), gradient: "from-amber-500 to-amber-600" },
            ].map((step, i) => (
              <RevealSection key={step.num} delay={i * 100}>
                <div className="p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 group h-full bg-white relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${step.gradient.includes("blue") ? "#3b82f6" : step.gradient.includes("emerald") ? "#10b981" : "#8b5cf6"}, ${step.gradient.includes("blue") ? "#6366f1" : step.gradient.includes("emerald") ? "#14b8a6" : "#a855f7"})` }} />
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white text-lg font-bold mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                    {step.icon}
                  </div>
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.15em] mb-2">Step {step.num}</p>
                  <h4 className="text-lg font-bold mb-2">{step.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SECURITY & COMPLIANCE ═══════ */}
      <section className="py-24 border-t border-gray-100/80">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <RevealSection>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">{t("security.label")}</p>
            <h2 className="text-[34px] sm:text-[46px] font-extrabold tracking-tight mb-4 leading-[1.05]">
              {t("security.title")}
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-12">{t("security.desc")}</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-0 border border-gray-100 rounded-2xl overflow-hidden max-w-4xl mx-auto">
              {["SOC 2", "ISO 27001", "GDPR", "NDPC", "PCI DSS", "HIPAA", "CSA"].map((c) => (
                <div key={c} className="flex items-center justify-center h-20 border-r border-b border-gray-100 last:border-r-0 hover:bg-gray-50/50 transition-colors">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{c}</span>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════ INTEGRATIONS ═══════ */}
      <section className="py-24 border-t border-gray-100/80 section-mesh">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <RevealSection>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">{t("integrations.label")}</p>
            <h2 className="text-[34px] sm:text-[46px] font-extrabold tracking-tight mb-4 leading-[1.05]">
              {t("integrations.title")}
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-12">{t("integrations.desc")}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-0 border border-gray-100 rounded-2xl overflow-hidden bg-white max-w-4xl mx-auto mb-8">
              {["WhatsApp", "Zapier", "Instagram", "Twilio", "Slack", "Gmail", "Mailgun", "Amazon SNS", "Firebase", "Stripe", "HubSpot", "Telegram"].map((name) => (
                <div key={name} className="flex items-center justify-center h-20 border-r border-b border-gray-100 last:border-r-0 hover:bg-gray-50/50 transition-colors">
                  <span className="text-xs font-bold text-gray-400">{name}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm mb-6">{t("integrations.noTool")}</p>
            <Link href="/support" className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-gray-200 rounded-xl text-[15px] font-semibold text-gray-700 hover:border-gray-300 hover:bg-white transition-all">
              {t("integrations.apiCta")} <span>→</span>
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="relative py-24 overflow-hidden" style={{ background: "linear-gradient(135deg, #0b1a2e 0%, #0f2340 40%, #142d50 70%, #1a365d 100%)" }}>
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent" />
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="max-w-[800px] mx-auto px-6 text-center relative">
          <RevealSection>
            <p className="text-sm font-bold text-blue-300 uppercase tracking-[0.2em] mb-4">{t("cta.label")}</p>
            <h2 className="text-[34px] sm:text-[46px] font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              {t("cta.title")}
            </h2>
            <p className="text-blue-100/70 text-lg mb-10">{t("cta.desc")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => setDemoOpen(true)} className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-gray-900 rounded-2xl text-[15px] font-semibold hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]">
                {t("cta.book")}
              </button>
              <Link href="/support" className="inline-flex items-center justify-center gap-2 px-10 py-4 border-2 border-blue-300/30 text-blue-200 rounded-2xl text-[15px] font-semibold hover:bg-white/5 transition-all hover:scale-[1.02] active:scale-[0.98]">
                {t("cta.start")}
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>
      <BookDemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </PublicShell>
  );
}
