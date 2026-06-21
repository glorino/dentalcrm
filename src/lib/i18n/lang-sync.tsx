"use client";

import { useEffect } from "react";
import { useLang } from "@/lib/i18n/context";

export function LangSync() {
  const { locale } = useLang();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
