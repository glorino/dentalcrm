"use client";

import { useState, useEffect, useRef } from "react";
import PublicShell from "@/app/public-shell";
import { useLang } from "@/lib/i18n/context";
import { BookDemoModal } from "@/components/book-demo-modal";

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
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

const features = [
  {
    color: "blue",
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    iconBg: "bg-gradient-to-br from-blue-400 to-blue-600",
    tKey: "intake",
  },
  {
    color: "emerald",
    gradient: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
    tKey: "inbox",
  },
  {
    color: "purple",
    gradient: "from-purple-500 to-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    iconBg: "bg-gradient-to-br from-purple-400 to-purple-600",
    tKey: "sentiment",
  },
  {
    color: "amber",
    gradient: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    iconBg: "bg-gradient-to-br from-amber-400 to-amber-600",
    tKey: "sla",
  },
  {
    color: "cyan",
    gradient: "from-cyan-500 to-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
    iconBg: "bg-gradient-to-br from-cyan-400 to-cyan-600",
    tKey: "knowledge",
  },
  {
    color: "rose",
    gradient: "from-rose-500 to-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    iconBg: "bg-gradient-to-br from-rose-400 to-rose-600",
    tKey: "analytics",
  },
];

const stats = [
  { value: "99.7%", labelKey: "featuresPage.stats.uptime", fallback: "Uptime" },
  { value: "<50ms", labelKey: "featuresPage.stats.response", fallback: "Response Time" },
  { value: "67%", labelKey: "featuresPage.stats.resolved", fallback: "Auto-Resolved" },
  { value: "3B+", labelKey: "featuresPage.stats.processed", fallback: "Tickets Processed" },
];

export default function FeaturesPage() {
  const { t } = useLang();
  const [counters, setCounters] = useState([0, 0, 0, 0]);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const suffixes = ["%", "ms", "%", "B+"];
  const decimals = [1, 0, 0, 0];

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!statsVisible) return;
    const targets = [99.7, 50, 67, 3];
    const durations = [1500, 1200, 1400, 1000];
    const intervals = targets.map((target, i) => {
      const step = target / (durations[i] / 16);
      let current = 0;
      return setInterval(() => {
        current += step;
        if (current >= target) current = target;
        setCounters((prev) => {
          const next = [...prev];
          next[i] = current;
          return next;
        });
      }, 16);
    });
    return () => intervals.forEach(clearInterval);
  }, [statsVisible]);

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a2e] via-[#0f2340] to-[#142d50]">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="max-w-[1200px] mx-auto px-6 py-28 sm:py-36 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[13px] font-semibold text-blue-300 uppercase tracking-wider">{t("featuresPage.title") || "Features"}</span>
          </div>
          <h1 className="text-[40px] sm:text-[56px] lg:text-[68px] font-extrabold leading-[0.95] tracking-tight text-white mb-6">
            {t("featuresPage.title") || "Powerful Features"}{" "}
            <span className="italic text-blue-400">{t("featuresPage.subtitle") || "Built for Scale"}</span>
          </h1>
          <p className="text-lg text-gray-300/90 max-w-2xl mx-auto leading-relaxed">
            {t("features.label") || "Everything you need to deliver world-class customer support with AI-powered automation."}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      <div ref={statsRef} className="max-w-[1200px] mx-auto px-6 -mt-10 relative z-10 mb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={stat.labelKey} className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-lg shadow-gray-100/50 hover:shadow-xl transition-shadow duration-300">
              <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-1">
                {statsVisible ? (
                  <>
                    {decimals[i] > 0 ? counters[i].toFixed(decimals[i]) : Math.floor(counters[i])}
                    {suffixes[i]}
                  </>
                ) : (
                  <span className="opacity-0">0</span>
                )}
              </div>
              <div className="text-sm text-gray-400 font-medium">{t(stat.labelKey) || stat.fallback}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="max-w-[1200px] mx-auto px-6 pb-28">
        <RevealSection className="text-center mb-16">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">{t("nav.features") || "Features"}</p>
          <h2 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight leading-[1.05]">
            {t("featuresPage.sectionTitle") || "Six Core Capabilities"}{" "}
            <span className="italic text-blue-600">{t("featuresPage.sectionSubtitle") || "One unified platform. Zero compromises."}</span>
          </h2>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const title = t(`landing.features.${feature.tKey}.title`);
            const desc = t(`landing.features.${feature.tKey}.desc`);
            const bulletsStr = t(`landing.features.${feature.tKey}.bullets`);
            const bullets = bulletsStr.includes(",") ? bulletsStr.split(",").map((s: string) => s.trim()) : [feature.tKey];
            return (
              <RevealSection key={feature.tKey} delay={i * 80}>
                <div className={`group relative h-full p-8 rounded-3xl border ${feature.border} bg-white hover:border-transparent transition-all duration-500 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50`}>
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-gray-200 group-hover:ring-0 group-hover:hidden" />
                  <div className={`absolute -inset-px rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />
                  <div className={`h-14 w-14 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed">{desc}</p>
                  <div className="space-y-3">
                    {bullets.map((bullet: string) => (
                      <div key={bullet} className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center shrink-0`}>
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-600">{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealSection>
            );
          })}
        </div>
      </section>

      <section className="relative py-24 bg-gradient-to-br from-[#0b1a2e] via-[#0f2340] to-[#142d50] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent" />
        <div className="max-w-[800px] mx-auto px-6 text-center relative">
          <RevealSection>
            <h2 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              {t("featuresPage.cta.title") || "Ready to Transform Your Support?"}
            </h2>
            <p className="text-gray-300/80 text-lg mb-10">{t("featuresPage.cta.desc") || "Start resolving tickets with AI in minutes, not months."}</p>
            <button onClick={() => setDemoOpen(true)} className="inline-flex items-center gap-2 px-10 py-4 bg-white text-gray-900 rounded-full text-[15px] font-semibold hover:bg-gray-100 transition-all shadow-lg">
              {t("featuresPage.cta.button") || "Book a Demo"}
            </button>
          </RevealSection>
        </div>
      </section>
      <BookDemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </PublicShell>
  );
}
