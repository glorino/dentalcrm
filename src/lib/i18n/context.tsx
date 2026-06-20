"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Locale, t as translate } from "./index";

interface LangCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
}

const Ctx = createContext<LangCtx>({ locale: "en", setLocale: () => {}, t: (k) => k });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const t = useCallback((key: string, fallback?: string) => translate(locale, key, fallback), [locale]);
  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}
