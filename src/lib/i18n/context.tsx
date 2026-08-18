"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Locale, t as translate, tInterpolate as translateInterpolate } from "./index";

interface LangCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
  tI: (key: string, vars: Record<string, string>, fallback?: string) => string;
}

const Ctx = createContext<LangCtx>({ locale: "en", setLocale: () => {}, t: (k) => k, tI: (k) => k });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && (saved === "en" || saved === "fr")) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((key: string, fallback?: string) => translate(locale, key, fallback), [locale]);
  const tI = useCallback((key: string, vars: Record<string, string>, fallback?: string) => translateInterpolate(locale, key, vars, fallback), [locale]);

  return <Ctx.Provider value={{ locale, setLocale, t, tI }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}
