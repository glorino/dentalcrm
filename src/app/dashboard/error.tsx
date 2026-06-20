"use client";

import { useLang } from "@/lib/i18n/context";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-red-200 p-8 shadow-xl">
        <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
          <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t("errorPage.somethingWentWrong")}</h2>
        <p className="text-sm text-gray-500 mb-4 whitespace-pre-wrap">{error.message}</p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4 font-mono">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
        >
          {t("errorPage.tryAgain")}
        </button>
      </div>
    </div>
  );
}
