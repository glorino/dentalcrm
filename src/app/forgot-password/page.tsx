"use client";

import Link from "next/link";
import { useState } from "react";
import { LangToggle } from "@/components/lang-toggle";
import { useLang } from "@/lib/i18n/context";

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setStatus("success");
      setMessage(data.message);
    } catch {
      setStatus("error");
      setMessage(t("forgotPassword.error"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <LangToggle />
          </div>
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-600/25">
              <span className="text-white font-bold text-xl">SF</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t("forgotPassword.title")}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {t("forgotPassword.desc")}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/50">
          {status === "success" ? (
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center text-3xl mx-auto mb-4">✉️</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("forgotPassword.checkEmail")}</h2>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              <Link href="/login" className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                {t("forgotPassword.backToSignIn")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("forgotPassword.emailLabel")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("forgotPassword.emailPlaceholder")}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {status === "error" && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{message}</div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {status === "loading" ? t("forgotPassword.sending") : t("forgotPassword.sendReset")}
              </button>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  ← {t("forgotPassword.backToSignIn")}
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Demo Info */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <div className="text-sm font-semibold text-amber-800 mb-1">{t("forgotPassword.demoMode")}</div>
              <div className="text-xs text-amber-700">
                {t("forgotPassword.demoDesc")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
