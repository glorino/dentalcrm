"use client";

import Link from "next/link";
import { useState } from "react";
import { LangToggle } from "@/components/lang-toggle";
import { useLang } from "@/lib/i18n/context";

export default function ResetPasswordPage() {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage(t("resetPassword.passwordsNoMatch"));
      return;
    }

    if (password.length < 8) {
      setStatus("error");
      setMessage(t("resetPassword.passwordTooShort"));
      return;
    }

    setStatus("loading");

    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        setMessage(t("resetPassword.invalidLink"));
        return;
      }

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Password reset successful! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setStatus("error");
        setMessage(data.error || t("resetPassword.failed"));
      }
    } catch {
      setStatus("error");
      setMessage(t("resetPassword.generalError"));
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
          <h1 className="text-2xl font-bold text-gray-900">{t("resetPassword.title")}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {t("resetPassword.desc")}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/50">
          {status === "success" ? (
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("resetPassword.success")}</h2>
              <p className="text-sm text-gray-500">{t("resetPassword.redirecting")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("resetPassword.newPassword")}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("resetPassword.confirmPassword")}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {status === "error" && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{message}</div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {status === "loading" ? t("resetPassword.resetting") : t("resetPassword.resetBtn")}
              </button>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  ← {t("resetPassword.backToSignIn")}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
