"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import PublicShell from "@/app/public-shell";
import { useLang } from "@/lib/i18n/context";

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

const values = [
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    gradient: "from-blue-500 to-blue-600",
    tKey: "innovation",
  },
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    gradient: "from-emerald-500 to-emerald-600",
    tKey: "reliability",
  },
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    gradient: "from-purple-500 to-purple-600",
    tKey: "simplicity",
  },
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    gradient: "from-amber-500 to-orange-500",
    tKey: "security",
  },
];

const team = [
  {
    name: "Chidinma Okafor",
    role: "CEO & Founder",
    tagline: "Building the future of support",
    image: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400&h=400&fit=crop&crop=face",
    shortBio: "Former VP of Engineering at Flutterwave. 12+ years building scalable platforms across Africa.",
    fullBio: "Chidinma founded DentalCRM after witnessing firsthand how fragmented support tools were losing customers for businesses across Nigeria. With a background in electrical engineering from the University of Lagos and an MBA from Lagos Business School, she previously led engineering teams at Flutterwave and Paystack. Under her leadership, DentalCRM has grown from a 3-person team in Lagos to a 50+ person operation serving hundreds of businesses across Africa. She is a recipient of the Forbes Africa 30 Under 30 award and a frequent speaker on AI and African tech.",
    linkedin: "https://linkedin.com/in/chidinmaokafor",
  },
  {
    name: "Emeka Nwosu",
    role: "CTO",
    tagline: "AI infrastructure at scale",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    shortBio: "Ex-Google AI engineer. Built NLP systems processing 1B+ messages daily.",
    fullBio: "Emeka brings deep expertise in natural language processing and machine learning infrastructure. Before joining DentalCRM, he spent 6 years at Google AI working on multilingual NLP models used by millions. He holds a PhD in Computer Science from the University of Oxford and has published 15+ papers on transformer architectures and sentiment analysis. At DentalCRM, he leads the AI agent pipeline that classifies, routes, and resolves 67% of tickets autonomously. He is passionate about making AI accessible to African businesses.",
    linkedin: "https://linkedin.com/in/emekanosu",
  },
  {
    name: "Aisha Bello",
    role: "Head of Product",
    tagline: "User experience is everything",
    image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face",
    shortBio: "Designed products used by 50M+ users across 3 continents.",
    fullBio: "Aisha is a product design veteran with a track record of building intuitive enterprise software. She spent 5 years at Andela leading product design for their talent platform, and prior to that, she was a senior designer at Interswitch. She holds a degree in Human-Computer Interaction from the University of Lagos. At DentalCRM, she obsesses over every pixel and interaction, ensuring that even complex AI workflows feel simple and natural. She mentors junior designers across Lagos and is an advocate for inclusive design.",
    linkedin: "https://linkedin.com/in/aishabello",
  },
  {
    name: "Tunde Adesanya",
    role: "Head of Growth",
    tagline: "Scaling globally from Lagos",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
    shortBio: "Grew 3 startups from seed to Series B. Deep expertise in African markets.",
    fullBio: "Tunde is a growth strategist who has helped multiple African startups scale from local operations to pan-African presence. He previously led growth at Kuda Bank, taking them from 100K to 3M users in 18 months, and before that, he ran marketing operations at Carbon (formerly Paylater). He holds a degree in Economics from the University of Ibadan and an MSc from the London School of Economics. At DentalCRM, he drives customer acquisition, partnerships, and expansion into new African markets.",
    linkedin: "https://linkedin.com/in/tundeadesanya",
  },
];

const statItems = [
  { value: "500+", labelKey: "aboutPage.numbers.teams", fallback: "Teams Using DentalCRM" },
  { value: "3B+", labelKey: "aboutPage.numbers.tickets", fallback: "Tickets Processed" },
  { value: "99.99%", labelKey: "aboutPage.numbers.uptime", fallback: "Uptime SLA" },
  { value: "<50ms", labelKey: "aboutPage.numbers.response", fallback: "Avg Response Time" },
];

export default function AboutPage() {
  const { t } = useLang();
  const [counters, setCounters] = useState([0, 0, 0, 0]);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<typeof team[number] | null>(null);
  const suffixes = ["+", "B+", "%", "ms"];
  const decimals = [0, 0, 2, 0];

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!statsVisible) return;
    const targets = [500, 3, 99.99, 50];
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
            <span className="text-[13px] font-semibold text-blue-300 uppercase tracking-wider">{t("aboutPage.title") || "About DentalCRM"}</span>
          </div>
          <h1 className="text-[40px] sm:text-[56px] lg:text-[68px] font-extrabold leading-[0.95] tracking-tight text-white mb-6">
            {t("aboutPage.title") || "About DentalCRM"}{" "}
            <span className="italic text-blue-400">CRM</span>
          </h1>
          <p className="text-lg text-gray-300/90 max-w-2xl mx-auto leading-relaxed">
            {t("aboutPage.subtitle") || "We're building the future of customer support with AI."}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="max-w-[1200px] mx-auto px-6 py-24">
        <RevealSection className="text-center mb-16">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">{t("aboutPage.mission.label") || "Our Mission"}</p>
          <h2 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight leading-[1.05] mb-6">
            {t("aboutPage.mission.title") || "We're building the future of customer support with"}{" "}
            <span className="italic text-blue-600">AI</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-3xl mx-auto leading-relaxed">
            {t("aboutPage.mission.desc") || "DentalCRM empowers dental hospitals to deliver exceptional patient experiences through intelligent automation."}
          </p>
        </RevealSection>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <RevealSection className="text-center mb-16">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">{t("aboutPage.values.label") || "Our Values"}</p>
          <h2 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight leading-[1.05]">
            {t("aboutPage.values.title") || "What drives"}{" "}
            <span className="italic text-blue-600">{t("aboutPage.values.subtitle") || "everything we build"}</span>
          </h2>
        </RevealSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, i) => (
            <RevealSection key={value.tKey} delay={i * 80}>
              <div className="group relative h-full p-8 rounded-3xl border border-gray-100 bg-white hover:border-transparent transition-all duration-500 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50">
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                <div className={`absolute -inset-px rounded-3xl bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t(`aboutPage.values.${value.tKey}.title`) || value.tKey}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(`aboutPage.values.${value.tKey}.desc`)}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      <section className="relative py-24 bg-gradient-to-br from-[#0b1a2e] via-[#0f2340] to-[#142d50] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent" />
        <div className="max-w-[1200px] mx-auto px-6 relative">
          <RevealSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-sm font-bold text-blue-300 uppercase tracking-[0.2em] mb-4">{t("aboutPage.story.label") || "Our Story"}</p>
                <h2 className="text-[36px] sm:text-[48px] font-extrabold text-white leading-[1.05] mb-6">
                  {t("aboutPage.story.title") || "Born from"} <span className="italic text-blue-400">{t("aboutPage.story.subtitle") || "frustration"}</span>
                </h2>
                <p className="text-gray-300/80 text-lg leading-relaxed mb-6">
                  {t("aboutPage.story.p1") || "Founded in Nigeria, DentalCRM was born from the frustration of managing patient support across too many channels."}
                </p>
                <p className="text-gray-300/80 text-lg leading-relaxed">
                  {t("aboutPage.story.p2") || "We built the platform we wished existed — a single place where AI handles the repetitive work."}
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/5 rounded-3xl blur-3xl" />
                <div className="relative bg-white/[0.08] backdrop-blur-md rounded-3xl p-8 border border-white/[0.08]">
                  <div className="space-y-4">
                    {[
                      { year: "2023", event: t("aboutPage.story.m1") || "Founded in Lagos, Nigeria" },
                      { year: "2024", event: t("aboutPage.story.m2") || "First 100 teams onboarded" },
                      { year: "2025", event: t("aboutPage.story.m3") || "3 billion tickets processed" },
                      { year: "2026", event: t("aboutPage.story.m4") || "Scaling across Africa & beyond" },
                    ].map((milestone) => (
                      <div key={milestone.year} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-blue-300">{milestone.year}</span>
                        </div>
                        <p className="text-sm text-gray-300/80">{milestone.event}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="max-w-[1200px] mx-auto px-6 py-24">
        <RevealSection className="text-center mb-16">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">{t("aboutPage.team.label") || "Our Team"}</p>
          <h2 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight leading-[1.05]">
            {t("aboutPage.team.title") || "The people behind"}{" "}
            <span className="italic text-blue-600">DentalCRM</span>
          </h2>
        </RevealSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, i) => (
            <RevealSection key={member.name} delay={i * 80}>
              <div className="group text-center p-8 rounded-3xl border border-gray-100 bg-white hover:border-transparent transition-all duration-500 hover:shadow-2xl hover:shadow-gray-200/50">
                <div className="relative h-28 w-28 rounded-full mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg overflow-hidden ring-4 ring-white">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-sm font-semibold text-blue-600 mb-3">{member.role}</p>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{member.shortBio}</p>
                <button
                  onClick={() => setSelectedMember(member)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Read more →
                </button>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      <section ref={statsRef} className="max-w-[1200px] mx-auto px-6 pb-24">
        <RevealSection className="text-center mb-12">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">{t("aboutPage.numbers.label") || "By The Numbers"}</p>
          <h2 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight leading-[1.05]">
            {t("aboutPage.numbers.title") || "Trusted by teams across"}{" "}
            <span className="italic text-blue-600">{t("aboutPage.numbers.subtitle") || "Nigeria"}</span>
          </h2>
        </RevealSection>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statItems.map((stat, i) => (
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
      </section>

      <section className="relative py-24 bg-gradient-to-br from-[#0b1a2e] via-[#0f2340] to-[#142d50] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent" />
        <div className="max-w-[800px] mx-auto px-6 text-center relative">
          <RevealSection>
            <p className="text-sm font-bold text-blue-300 uppercase tracking-[0.2em] mb-4">{t("aboutPage.cta.label") || "Join Us"}</p>
            <h2 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              {t("aboutPage.cta.title") || "Ready to build the future of"}{" "}
              <span className="italic text-blue-400">{t("aboutPage.cta.subtitle") || "support?"}</span>
            </h2>
            <p className="text-gray-300/80 text-lg mb-10">
              {t("aboutPage.cta.desc") || "Whether you're a business looking for better support or an engineer passionate about AI."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/support" className="inline-flex items-center gap-2 px-10 py-4 bg-white text-gray-900 rounded-full text-[15px] font-semibold hover:bg-gray-100 transition-all shadow-lg">
                {t("aboutPage.cta.getStarted") || "Get Started"}
              </Link>
              <a href="mailto:careers@dentalcrm.com" className="inline-flex items-center gap-2 px-10 py-4 bg-transparent border-2 border-blue-400/40 text-blue-300 rounded-full text-[15px] font-semibold hover:bg-blue-400/10 transition-all">
                {t("aboutPage.cta.careers") || "View Careers"}
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedMember(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ animation: "modalSlideUp 0.3s ease-out" }}>
            <style>{`@keyframes modalSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
            <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] px-8 py-8 text-center relative overflow-hidden">
              <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 text-white/70 hover:text-white h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="relative h-24 w-24 rounded-full mx-auto mb-4 overflow-hidden ring-4 ring-white/30 shadow-xl">
                <img src={selectedMember.image} alt={selectedMember.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{selectedMember.name}</h3>
              <p className="text-blue-100 text-sm font-medium">{selectedMember.role}</p>
            </div>
            <div className="p-8">
              <p className="text-gray-700 leading-relaxed text-[15px] mb-6">{selectedMember.fullBio}</p>
              <a
                href={selectedMember.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </div>
      )}
    </PublicShell>
  );
}
