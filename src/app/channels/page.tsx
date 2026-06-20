"use client";

import PublicShell from "@/app/public-shell";
import { useLang } from "@/lib/i18n/context";
import { useEffect, useRef, useState } from "react";
import { BookDemoModal } from "@/components/book-demo-modal";

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const channels = [
  {
    name: "WhatsApp",
    color: "#25D366",
    bg: "from-[#25D366] to-[#128C7E]",
    border: "border-[#25D366]/20",
    hoverBorder: "hover:border-[#25D366]/40",
    shadow: "shadow-[#25D366]/10",
    hoverShadow: "hover:shadow-[#25D366]/20",
    users: "2B+",
    usersLabel: "users worldwide",
    category: "Instant Messaging",
    description: "Reach customers on the world's most popular messaging app. Rich media, read receipts, and end-to-end encryption built in.",
    status: "live",
    uptime: "99.99%",
    latency: "<50ms",
    features: ["Rich media support", "Read receipts", "End-to-end encryption", "Template messaging"],
  },
  {
    name: "Facebook Messenger",
    color: "#1877F2",
    bg: "from-[#1877F2] to-[#0D47A1]",
    border: "border-[#1877F2]/20",
    hoverBorder: "hover:border-[#1877F2]/40",
    shadow: "shadow-[#1877F2]/10",
    hoverShadow: "hover:shadow-[#1877F2]/20",
    users: "1.3B+",
    usersLabel: "monthly users",
    category: "Facebook Integration",
    description: "Seamlessly connect with Facebook's massive user base. Handle inquiries directly from your business page with AI-powered responses.",
    status: "live",
    uptime: "99.95%",
    latency: "<80ms",
    features: ["Facebook Page integration", "Automated replies", "Messenger plugins", "Quick replies"],
  },
  {
    name: "Instagram DM",
    color: "#E1306C",
    bg: "from-[#833AB4] via-[#E1306C] to-[#F77737]",
    border: "border-pink-500/20",
    hoverBorder: "hover:border-pink-500/40",
    shadow: "shadow-pink-500/10",
    hoverShadow: "hover:shadow-pink-500/20",
    users: "2B+",
    usersLabel: "monthly users",
    category: "Visual Messaging",
    description: "Transform Instagram DMs into a powerful support channel. Handle visual content, stories replies, and business inquiries with ease.",
    status: "live",
    uptime: "99.97%",
    latency: "<60ms",
    features: ["Story replies", "Visual content handling", "Business profile support", "Carousel messages"],
  },
  {
    name: "Telegram",
    color: "#0088cc",
    bg: "from-[#0088cc] to-[#0055A4]",
    border: "border-[#0088cc]/20",
    hoverBorder: "hover:border-[#0088cc]/40",
    shadow: "shadow-[#0088cc]/10",
    hoverShadow: "hover:shadow-[#0088cc]/20",
    users: "950M+",
    usersLabel: "monthly users",
    category: "Cloud-Based Messaging",
    description: "Leverage Telegram's cloud-based infrastructure for instant, reliable communication. Support bots, channels, and group management.",
    status: "live",
    uptime: "99.99%",
    latency: "<40ms",
    features: ["Bot API support", "Cloud sync", "Channel broadcasting", "Group management"],
  },
  {
    name: "Email",
    color: "#FF6600",
    bg: "from-[#FF6600] to-[#CC5200]",
    border: "border-[#FF6600]/20",
    hoverBorder: "hover:border-[#FF6600]/40",
    shadow: "shadow-[#FF6600]/10",
    hoverShadow: "hover:shadow-[#FF6600]/20",
    users: "4B+",
    usersLabel: "email users globally",
    category: "IMAP/SMTP Integration",
    description: "Full IMAP/SMTP support for seamless email integration. Handle attachments, threading, and priority routing with AI classification.",
    status: "live",
    uptime: "99.98%",
    latency: "<100ms",
    features: ["IMAP/SMTP support", "Attachment handling", "Thread management", "Priority routing"],
  },
  {
    name: "SMS",
    color: "#2196F3",
    bg: "from-[#2196F3] to-[#0D47A1]",
    border: "border-[#2196F3]/20",
    hoverBorder: "hover:border-[#2196F3]/40",
    shadow: "shadow-[#2196F3]/10",
    hoverShadow: "hover:shadow-[#2196F3]/20",
    users: "5B+",
    usersLabel: "mobile subscribers",
    category: "Termii-Powered Delivery",
    description: "Enterprise-grade SMS delivery powered by Termii. Global reach with delivery tracking, scheduling, and two-way messaging support.",
    status: "live",
    uptime: "99.99%",
    latency: "<200ms",
    features: ["Termii integration", "Global delivery", "Two-way SMS", "Delivery tracking"],
  },
];

function getComparisonFeatures(t: (key: string) => string) {
  return [
    { feature: t("channelsPage.comparison.realtimeMessaging") || "Real-time messaging", whatsapp: true, messenger: true, instagram: true, telegram: true, email: true, sms: true },
    { feature: t("channelsPage.comparison.richMedia") || "Rich media support", whatsapp: true, messenger: true, instagram: true, telegram: true, email: true, sms: false },
    { feature: t("channelsPage.comparison.readReceipts") || "Read receipts", whatsapp: true, messenger: true, instagram: true, telegram: true, email: false, sms: false },
    { feature: t("channelsPage.comparison.aiAutoResponse") || "AI auto-response", whatsapp: true, messenger: true, instagram: true, telegram: true, email: true, sms: true },
    { feature: t("channelsPage.comparison.templateMessaging") || "Template messaging", whatsapp: true, messenger: false, instagram: false, telegram: true, email: true, sms: true },
    { feature: t("channelsPage.comparison.groupSupport") || "Group support", whatsapp: true, messenger: true, instagram: false, telegram: true, email: true, sms: false },
    { feature: t("channelsPage.comparison.fileAttachments") || "File attachments", whatsapp: true, messenger: true, instagram: true, telegram: true, email: true, sms: false },
    { feature: t("channelsPage.comparison.e2eEncryption") || "End-to-end encryption", whatsapp: true, messenger: false, instagram: false, telegram: true, email: false, sms: false },
  ];
}

const channelTKeys: Record<string, string> = {
  "WhatsApp": "whatsapp",
  "Facebook Messenger": "messenger",
  "Instagram DM": "instagram",
  "Email": "email",
  "SMS": "sms",
  "Web Chat": "webchat",
};

export default function ChannelsPage() {
  const { t } = useLang();
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <PublicShell>
      <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden font-sans">
        {/* HERO */}
        <section className="relative min-h-[70vh] flex items-center bg-gradient-to-br from-[#0b1a2e] via-[#0f2340] to-[#142d50] overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-blue-500/15 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" style={{ animation: "float 12s ease-in-out infinite" }} />

          <div className="relative max-w-[1200px] mx-auto px-6 pt-32 pb-20 w-full">
            <RevealSection>
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[13px] font-semibold text-green-300 uppercase tracking-wider">
                    {t("channelsPage.title") || "Channel Integrations"}
                  </span>
                </div>
                <h1 className="text-[48px] sm:text-[64px] lg:text-[72px] font-extrabold leading-[0.95] tracking-tight text-white mb-6">
                  {t("channelsPage.title") || "Channel Integrations"}
                </h1>
                <p className="text-lg text-gray-300/90 max-w-xl mb-10 leading-relaxed">
                  {t("channelsPage.subtitle") || "Connect every communication channel your customers use into one unified inbox."}
                </p>
                <div className="flex flex-wrap gap-3">
                  {channels.map((ch) => (
                    <div
                      key={ch.name}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ch.color }} />
                      <span className="text-sm font-medium text-white/90">{ch.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </section>

        {/* CHANNEL CARDS */}
        <section className="py-24">
          <div className="max-w-[1200px] mx-auto px-6">
            <RevealSection className="text-center mb-16">
              <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">
                {t("channels.label") || "Channels"}
              </p>
              <h2 className="text-[40px] sm:text-[52px] font-extrabold tracking-tight leading-[1.05]">
                {t("channels.title") || "All your channels. One inbox."}
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto mt-4">
                {t("channels.desc") || "Connect WhatsApp, Email, SMS, Messenger, Instagram, and Web Chat — all in one place."}
              </p>
            </RevealSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {channels.map((ch, i) => (
                <RevealSection key={ch.name} delay={i * 100}>
                  <div
                    className={`relative group rounded-2xl border ${ch.border} ${ch.hoverBorder} bg-white p-8 transition-all duration-300 hover:shadow-xl ${ch.shadow} ${ch.hoverShadow} overflow-hidden`}
                  >
                    <div
                      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${ch.bg}`}
                    />

                    <div className="flex items-start justify-between mb-6">
                      <div
                        className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                        style={{ background: `linear-gradient(135deg, ${ch.color}, ${ch.color}dd)` }}
                      >
                        {ch.name.charAt(0)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                          {t("misc.live") || "Live"}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-1">{ch.name}</h3>
                    <p className="text-sm font-medium text-gray-400 mb-4">{t(`channelsPage.${channelTKeys[ch.name]}.category`) || ch.category}</p>
                    <p className="text-sm text-gray-500 leading-relaxed mb-6">{t(`channelsPage.${channelTKeys[ch.name]}.desc`) || ch.description}</p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {(t(`channelsPage.${channelTKeys[ch.name]}.features`) || ch.features.join(",")).split(",").map((f: string) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border"
                          style={{
                            borderColor: `${ch.color}30`,
                            backgroundColor: `${ch.color}08`,
                            color: ch.color,
                          }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-lg font-extrabold text-gray-900">{ch.users}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{t(`channelsPage.${channelTKeys[ch.name]}.usersLabel`) || ch.usersLabel}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-extrabold text-gray-900">{ch.uptime}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{t("misc.uptime") || "Uptime"}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-extrabold text-gray-900">{ch.latency}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{t("misc.latency") || "Latency"}</div>
                      </div>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="py-24 bg-[#f8fafc]">
          <div className="max-w-[1200px] mx-auto px-6">
            <RevealSection className="text-center mb-16">
              <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">{t("channelsPage.comparison.label") || "Compare Channels"}</p>
              <h2 className="text-[40px] sm:text-[52px] font-extrabold tracking-tight leading-[1.05]">
                {t("channelsPage.comparison.title") || "Feature comparison"} <span className="italic text-blue-600">{t("channelsPage.comparison.acrossAll") || "across all channels"}</span>
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto mt-4">
                {t("channelsPage.comparison.desc") || "Every channel is built with the same reliability standards. Choose the right mix for your customers."}
              </p>
            </RevealSection>

            <RevealSection>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">{t("channelsPage.comparison.featureHeader") || "Feature"}</th>
                        {channels.map((ch) => (
                          <th key={ch.name} className="text-center px-4 py-4">
                            <div className="flex flex-col items-center gap-2">
                              <div
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: ch.color }}
                              >
                                {ch.name.charAt(0)}
                              </div>
                              <span className="text-xs font-semibold text-gray-700">{ch.name}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getComparisonFeatures(t).map((row, i) => (
                        <tr key={row.feature} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-gray-50/50" : ""}`}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-700">{row.feature}</td>
                          {[
                            row.whatsapp,
                            row.messenger,
                            row.instagram,
                            row.telegram,
                            row.email,
                            row.sms,
                          ].map((supported, j) => (
                            <td key={j} className="text-center px-4 py-4">
                              {supported ? (
                                <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-50">
                                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-50">
                                  <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* INTEGRATION CODE SNIPPET */}
        <section className="py-24 border-t border-gray-100">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <RevealSection>
                <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">{t("channelsPage.developer.label") || "Developer-First"}</p>
                <h2 className="text-[40px] sm:text-[48px] font-extrabold leading-[1.05] mb-6">
                  {t("channelsPage.developer.titleConnect") || "Connect in"} <span className="italic text-blue-600">{t("channelsPage.developer.titleTime") || "minutes, not days"}</span>
                </h2>
                <p className="text-gray-500 text-lg leading-relaxed mb-8">
                  {t("channelsPage.developer.desc") || "SSV provides a clean, intuitive API that makes channel integration effortless. One endpoint per channel, consistent response formats, and comprehensive documentation."}
                </p>
                <div className="space-y-4">
                  {[
                    { title: t("channelsPage.developer.restApiTitle") || "RESTful API", desc: t("channelsPage.developer.restApiDesc") || "Simple HTTP endpoints with JSON payloads" },
                    { title: t("channelsPage.developer.webhookTitle") || "Webhook support", desc: t("channelsPage.developer.webhookDesc") || "Real-time event notifications for every message" },
                    { title: t("channelsPage.developer.sdkTitle") || "SDK libraries", desc: t("channelsPage.developer.sdkDesc") || "Official libraries for Node.js, Python, PHP, and Go" },
                  ].map((f) => (
                    <div key={f.title} className="flex items-start gap-4">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-0.5">{f.title}</h4>
                        <p className="text-sm text-gray-500">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </RevealSection>

              <RevealSection delay={100}>
                <div className="bg-[#0d1117] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                  <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-gray-800">
                    <span className="h-3 w-3 rounded-full bg-red-500/80" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <span className="h-3 w-3 rounded-full bg-green-500/80" />
                    <span className="ml-3 text-xs font-mono text-gray-400">{t("channelsPage.developer.codeFileName") || "channels.ts"}</span>
                  </div>
                  <pre className="p-6 text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed">
                    <code>{`import { SSV } from '@ssv/sdk';

const ssv = new SSV({
  apiKey: 'your-api-key'
});

// ${t("channelsPage.developer.commentWhatsApp") || "Connect WhatsApp channel"}
await ssv.channels.connect({
  type: 'whatsapp',
  phone: '+234801234567',
  webhook: 'https://your-app.com/webhook',
  autoReply: true,
  aiEnabled: true
});

// ${t("channelsPage.developer.commentEmail") || "Connect Email channel"}
await ssv.channels.connect({
  type: 'email',
  imap: 'imap.example.com',
  smtp: 'smtp.example.com',
  credentials: {
    user: 'support@company.com',
    pass: process.env.EMAIL_PASS
  },
  autoReply: true,
  aiEnabled: true
});

// ${t("channelsPage.developer.commentSms") || "Connect SMS via Termii"}
await ssv.channels.connect({
  type: 'sms',
  provider: 'termii',
  apiKey: process.env.TERMII_KEY,
  senderId: 'SSV',
  autoReply: true
});

// ${t("channelsPage.developer.commentAllLive") || "All channels are now live"}
const status = await ssv.channels.list();
console.log(status);`}</code>
                  </pre>
                </div>
              </RevealSection>
            </div>
          </div>
        </section>

        {/* STATS BAND */}
        <section className="py-20 bg-gradient-to-br from-[#0b1a2e] via-[#0f2340] to-[#142d50]">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { value: "6+", label: t("channelsPage.stats.channelsSupported") || "Channels supported", color: "text-blue-400" },
                { value: "99.99%", label: t("channelsPage.stats.avgUptime") || "Average uptime", color: "text-green-400" },
                { value: "<50ms", label: t("channelsPage.stats.avgLatency") || "Average latency", color: "text-purple-400" },
                { value: "50M+", label: t("channelsPage.stats.messagesDaily") || "Messages processed daily", color: "text-orange-400" },
              ].map((stat, i) => (
                <RevealSection key={stat.label} delay={i * 100}>
                  <div className="text-center">
                    <div className={`text-4xl sm:text-5xl font-extrabold ${stat.color} mb-2`}>{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="max-w-[800px] mx-auto px-6 text-center">
            <RevealSection>
              <h2 className="text-[40px] sm:text-[52px] font-extrabold tracking-tight mb-6 leading-[1.1]">
                {t("channelsPage.ctaSection.titleReady") || "Ready to unify your"} <span className="italic text-blue-600">{t("channelsPage.ctaSection.titleChannels") || "customer channels?"}</span>
              </h2>
              <p className="text-gray-500 text-lg mb-10">
                {t("channelsPage.ctaSection.desc") || "Start connecting your channels today. No setup fees, no long-term contracts."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/support"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white rounded-full text-[15px] font-semibold hover:from-[#1e3a8a] hover:to-[#2563eb] transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                  {t("cta.start") || "Get Started"}
                </a>
                <button
                  onClick={() => setDemoOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-200 rounded-full text-[15px] font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  {t("cta.book") || "Book a demo"}
                </button>
              </div>
            </RevealSection>
          </div>
        </section>
      </div>
      <BookDemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </PublicShell>
  );
}