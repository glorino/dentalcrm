"use client";

import { useLang } from "@/lib/i18n/context";
import { Locale } from "@/lib/i18n";

export function LangToggle({ variant = "default" }: { variant?: "default" | "compact" | "minimal" }) {
  const { locale, setLocale } = useLang();

  if (variant === "minimal") {
    return (
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
        {(["en", "fr"] as Locale[]).map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              locale === l
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10">
        {(["en", "fr"] as Locale[]).map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              locale === l
                ? "bg-white/20 text-white shadow-sm"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
      {(["en", "fr"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            locale === l
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
