"use client";

import { useEffect, useRef, useState } from "react";
import PublicShell from "@/app/public-shell";
import { useLang } from "@/lib/i18n/context";
import { BookDemoModal } from "@/components/book-demo-modal";

const agents = [
  {
    id: "intake",
    gradient: "from-blue-500 to-blue-700",
    iconBg: "bg-blue-500/20",
    ringColor: "ring-blue-500/30",
  },
  {
    id: "knowledge",
    gradient: "from-emerald-500 to-emerald-700",
    iconBg: "bg-emerald-500/20",
    ringColor: "ring-emerald-500/30",
  },
  {
    id: "resolution",
    gradient: "from-purple-500 to-purple-700",
    iconBg: "bg-purple-500/20",
    ringColor: "ring-purple-500/30",
  },
  {
    id: "qa",
    gradient: "from-amber-500 to-amber-700",
    iconBg: "bg-amber-500/20",
    ringColor: "ring-amber-500/30",
  },
  {
    id: "escalation",
    gradient: "from-red-500 to-red-700",
    iconBg: "bg-red-500/20",
    ringColor: "ring-red-500/30",
  },
  {
    id: "sentiment",
    gradient: "from-cyan-500 to-cyan-700",
    iconBg: "bg-cyan-500/20",
    ringColor: "ring-cyan-500/30",
  },
  {
    id: "analytics",
    gradient: "from-rose-500 to-rose-700",
    iconBg: "bg-rose-500/20",
    ringColor: "ring-rose-500/30",
  },
  {
    id: "routing",
    gradient: "from-indigo-500 to-indigo-700",
    iconBg: "bg-indigo-500/20",
    ringColor: "ring-indigo-500/30",
  },
  {
    id: "feedback",
    gradient: "from-pink-500 to-pink-700",
    iconBg: "bg-pink-500/20",
    ringColor: "ring-pink-500/30",
  },
];

const getPipeline = (t: (key: string) => string) => [
  { label: t("agentsPage.pipelineLabel.intake"), color: "bg-blue-500", icon: "📥" },
  { label: t("agentsPage.pipelineLabel.knowledge"), color: "bg-emerald-500", icon: "📚" },
  { label: t("agentsPage.pipelineLabel.resolution"), color: "bg-purple-500", icon: "✅" },
  { label: t("agentsPage.pipelineLabel.qa"), color: "bg-amber-500", icon: "🔍" },
  { label: t("agentsPage.pipelineLabel.escalate"), color: "bg-red-500", icon: "🚨", condition: t("agentsPage.pipelineCondition") },
];

const getStats = (t: (key: string) => string) => [
  { value: "67%", label: t("agentsPage.statLabel.autoResolution"), color: "text-emerald-400" },
  { value: "<50ms", label: t("agentsPage.statLabel.classification"), color: "text-blue-400" },
  { value: "24/7", label: t("agentsPage.statLabel.availability"), color: "text-purple-400" },
  { value: "9", label: t("agentsPage.statLabel.specializedAgents"), color: "text-amber-400" },
];

function AgentIcon({ gradient }: { gradient: string }) {
  return (
    <div
      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
    >
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-white/80 animate-pulse" />
      </div>
    </div>
  );
}

function StatusBadge({ t }: { t: (key: string) => string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      {t("agentsPage.statusActive")}
    </span>
  );
}

export default function AgentsPage() {
  const { t } = useLang();
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [heroVisible, setHeroVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [pipelineVisible, setPipelineVisible] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHeroVisible(true);
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            setVisibleCards((prev) => new Set(Array.from(prev).concat(idx)));
          }
        });
      },
      { threshold: 0.15 }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setStatsVisible(true);
        });
      },
      { threshold: 0.2 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setPipelineVisible(true);
        });
      },
      { threshold: 0.2 }
    );

    if (pipelineRef.current) observer.observe(pipelineRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <PublicShell>
      <div className="min-h-screen bg-[#0a0a0f]">
        <section
          ref={heroRef}
          className={`relative overflow-hidden py-20 md:py-32 px-4 transition-all duration-1000 ${
            heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-emerald-600/20" />
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-white/70">
                {t("agentsPage.hero.badge")}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              {t("agentsPage.hero.title")}{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                {t("agentsPage.hero.titleHighlight")}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              {t("agentsPage.hero.subtitle")}
            </p>
          </div>
        </section>

        <section
          ref={statsRef}
          className="max-w-5xl mx-auto px-4 py-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getStats(t).map((stat, i) => (
              <div
                key={stat.label}
                className={`relative group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm text-center transition-all duration-500 hover:bg-white/[0.06] hover:border-white/[0.12] hover:scale-[1.02] ${
                  statsVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <div className="text-sm text-white/50 capitalize">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t("agentsPage.cards.title")}
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              {t("agentsPage.cards.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, i) => (
              <div
                key={agent.id}
                ref={(el) => { cardRefs.current[i] = el; }}
                data-index={i}
                className={`group relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm transition-all duration-700 hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-2xl hover:shadow-white/[0.02] hover:scale-[1.02] ${
                  visibleCards.has(i)
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <AgentIcon gradient={agent.gradient} />
                    <StatusBadge t={t} />
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2">{t(`agentsPage.${agent.id}.name`) || agent.id}</h3>
                  <p className="text-sm text-white/50 mb-5 leading-relaxed">
                    {t(`agentsPage.${agent.id}.desc`)}
                  </p>

                  <div className="space-y-2">
                    {(t(`agentsPage.${agent.id}.capabilities`) || "").split(",").filter(Boolean).map((cap: string) => (
                      <div
                        key={cap}
                        className="flex items-center gap-2.5 text-sm text-white/40 group-hover:text-white/60 transition-colors"
                      >
                        <div className={`w-1 h-1 rounded-full bg-gradient-to-r ${agent.gradient}`} />
                        {cap}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          ref={pipelineRef}
          className="max-w-5xl mx-auto px-4 py-20"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t("agentsPage.pipeline.title")}
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              {t("agentsPage.pipeline.subtitle")}
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
              {getPipeline(t).map((step, i) => (
                <div
                  key={step.label}
                  className={`relative flex flex-col items-center transition-all duration-700 ${
                    pipelineVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-6"
                  }`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  <div className={`w-16 h-16 rounded-2xl ${step.color}/20 border ${step.color}/30 flex items-center justify-center text-2xl mb-3 backdrop-blur-sm transition-transform duration-300 hover:scale-110`}>
                    {step.icon}
                  </div>
                  <span className="text-sm font-medium text-white/80">{step.label}</span>
                  {step.condition && (
                    <span className="text-xs text-white/40 mt-1">{step.condition}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden md:flex absolute top-1/2 left-0 right-0 -translate-y-1/2 px-8 pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 flex items-center justify-center transition-all duration-700 ${
                    pipelineVisible ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ transitionDelay: `${i * 150 + 100}ms` }}
                >
                  <div className="w-full h-px relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/15 to-white/5" />
                    <div
                      className={`absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-transparent border-l-white/15`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex md:hidden items-center justify-center py-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`transition-all duration-500 ${
                    pipelineVisible ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <svg
                    className="w-5 h-5 text-white/20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          <div className={`mt-12 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm text-center transition-all duration-700 ${
            pipelineVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
            style={{ transitionDelay: "800ms" }}
          >
            <p className="text-white/50 text-sm leading-relaxed max-w-2xl mx-auto">
              {t("agentsPage.pipeline.note")}
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-20">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-emerald-600/10 border border-white/[0.06] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent)]" />
            <div className="relative text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {t("agentsPage.cta.title")}
              </h2>
              <p className="text-white/50 mb-8 max-w-lg mx-auto">
                {t("agentsPage.cta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="/support" className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]">
                  {t("agentsPage.cta.primary")}
                </a>
                <button onClick={() => setDemoOpen(true)} className="px-8 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/80 font-medium hover:bg-white/[0.1] hover:text-white transition-all duration-300">
                  {t("agentsPage.cta.secondary")}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
      <BookDemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </PublicShell>
  );
}
