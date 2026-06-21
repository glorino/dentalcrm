"use client";

import Link from "next/link";
import { useState } from "react";
import { ChatWidget } from "@/components/chat-widget";
import { LangToggle } from "@/components/lang-toggle";
import { useLang } from "@/lib/i18n/context";

export default function LoginPage() {
  const { t } = useLang();

  const demoLogins = [
    { email: "emeka@dentalcrm.com", password: "admin123", role: t("roles.superAdmin"), name: "Dr. Chukwuemeka Obi", avatar: "CO", gradient: "from-violet-500 to-indigo-600" },
    { email: "folake@dentalcrm.com", password: "demo123", role: t("roles.manager"), name: "Folake Ogundipe", avatar: "FO", gradient: "from-emerald-500 to-teal-600" },
    { email: "ngozi@dentalcrm.com", password: "demo123", role: t("roles.agent"), name: "Ngozi Okolo", avatar: "NO", gradient: "from-blue-500 to-cyan-600" },
    { email: "dayo@dentalcrm.com", password: "demo123", role: t("roles.viewer"), name: "Dayo Fadugba", avatar: "DF", gradient: "from-gray-500 to-slate-600" },
  ];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        document.cookie = `auth-token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`;
        document.cookie = `user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`;
        window.location.href = "/dashboard";
      } else {
        setStatus("error");
        setError(data.error || t("loginPage.errorLoginFailed"));
      }
    } catch {
      setStatus("error");
      setError(t("loginPage.errorConnection"));
    }
  };

  const handleDemoLogin = (demo: typeof demoLogins[0]) => {
    setEmail(demo.email);
    setPassword(demo.password);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden login-gradient">
        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-[float_12s_ease-in-out_infinite]" />
          <div className="absolute top-1/3 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-[80px] animate-[float_15s_ease-in-out_infinite_3s]" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-[90px] animate-[float_10s_ease-in-out_infinite_1s]" />
          <div className="absolute top-2/3 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-[70px] animate-[float_14s_ease-in-out_infinite_5s]" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16 animate-fade-in">
            <img src="/industries/healthcare/logo.svg" alt="DentalCRM" className="h-14 w-14" />
            <div>
              <span className="text-3xl font-bold text-white tracking-tight">Dental</span>
              <span className="text-3xl font-bold text-blue-300 ml-1.5">CRM</span>
            </div>
          </div>

          {/* Hero */}
          <div className="animate-slide-up">
            <h1 className="text-4xl xl:text-[3.4rem] font-bold text-white mb-6 leading-[1.15] tracking-tight whitespace-pre-line">
              {t("login.heroTitle")}
            </h1>
            <p className="text-lg text-blue-100/60 mb-14 max-w-md leading-relaxed">
              {t("login.heroDesc")}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-5 mb-14 animate-slide-up stagger-2">
            {[
              { icon: "🤖", title: t("loginPage.feature1Title"), desc: t("loginPage.feature1Desc"), color: "from-violet-500/20 to-purple-500/20" },
              { icon: "📡", title: t("loginPage.feature2Title"), desc: t("loginPage.feature2Desc"), color: "from-blue-500/20 to-cyan-500/20" },
              { icon: "⚡", title: t("loginPage.feature3Title"), desc: t("loginPage.feature3Desc"), color: "from-amber-500/20 to-orange-500/20" },
              { icon: "🛡️", title: t("loginPage.feature4Title"), desc: t("loginPage.feature4Desc"), color: "from-green-500/20 to-emerald-500/20" },
            ].map((f, i) => (
              <div key={f.title} className="flex items-center gap-4 group">
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${f.color} backdrop-blur-sm flex items-center justify-center text-xl shrink-0 border border-white/10 group-hover:scale-110 group-hover:border-white/20 transition-all duration-500`}>
                  {f.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{f.title}</div>
                  <div className="text-xs text-blue-200/50 mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="p-6 rounded-3xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] animate-slide-up stagger-4">
            <div className="text-sm text-white/80 leading-relaxed mb-5 italic">
              &quot;{t("loginPage.testimonial")}&quot;
            </div>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold border border-white/10">AO</div>
              <div>
                <div className="text-sm font-semibold text-white">Adebayo Okonkwo</div>
                <div className="text-xs text-blue-200/40">{t("loginPage.testimonialRole")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white relative overflow-hidden">
        {/* Subtle background orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/[0.02] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/[0.02] rounded-full blur-[80px]" />

        <div className="w-full max-w-[420px] relative animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10 animate-slide-up">
            <Link href="/dashboard" className="inline-flex items-center gap-3">
              <img src="/industries/healthcare/logo.svg" alt="DentalCRM" className="h-14 w-14" />
              <div>
                <span className="text-3xl font-bold text-gray-900 tracking-tight">Dental</span>
                <span className="text-3xl font-bold text-blue-600 ml-1.5">CRM</span>
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-10 animate-slide-up">
            <div>
              <h2 className="text-[2rem] font-bold text-gray-900 mb-2.5 tracking-tight">{t("login.welcomeBack")}</h2>
              <p className="text-sm text-gray-500">{t("login.signInDesc")}</p>
            </div>
            <LangToggle />
          </div>

          {/* Demo Logins */}
          <div className="mb-8 animate-slide-up stagger-1">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-3">{t("login.quickAccess")}</div>
            <div className="grid grid-cols-2 gap-2.5">
              {demoLogins.map((demo) => (
                <button
                  key={demo.email}
                  onClick={() => handleDemoLogin(demo)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-300 text-left group ${
                    email === demo.email
                      ? "border-blue-500 bg-blue-50/80 shadow-lg shadow-blue-600/10"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 hover:shadow-sm"
                  }`}
                >
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${demo.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                    {demo.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-900 truncate">{demo.name}</div>
                    <div className="text-[10px] text-gray-500 font-medium mt-0.5">{demo.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8 animate-slide-up stagger-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <span className="text-[11px] text-gray-400 font-medium">{t("login.orEmail")}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="animate-slide-up stagger-3">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">{t("login.emailLabel")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@dentalcrm.com"
                  required
                  className="input-premium"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-sm font-semibold text-gray-700">{t("login.passwordLabel")}</label>
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition">
                    {t("login.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-premium pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {status === "error" && (
              <div className="mt-5 p-4 rounded-2xl bg-red-50/80 border border-red-200/60 text-sm text-red-700 flex items-center gap-2.5 animate-scale-in">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full mt-7 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-4 py-4 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 shadow-xl shadow-blue-600/20 hover:shadow-2xl hover:shadow-blue-600/30 active:scale-[0.98]"
            >
              {status === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  {t("login.signingIn")}
                </span>
              ) : (
                t("login.signIn")
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center animate-slide-up stagger-4">
            <p className="text-sm text-gray-500">
              {t("login.adminNote")}
            </p>
          </div>

          {/* Security Badge */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400 animate-slide-up stagger-5">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              {t("loginPage.sslEncrypted")}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              {t("loginPage.soc2Compliant")}
            </span>
          </div>

          {/* Legal Links */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400 animate-slide-up stagger-6">
            <Link href="/privacy" className="hover:text-gray-600 transition">{t("misc.privacyPolicy")}</Link>
            <span className="text-gray-300">·</span>
            <Link href="/terms" className="hover:text-gray-600 transition">{t("misc.terms")}</Link>
          </div>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}
