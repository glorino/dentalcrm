"use client";

import { createContext, useContext, ReactNode } from "react";
import {
  IndustryConfig,
  IndustrySlug,
  getIndustry,
  getIndustryFromEnv,
} from "./config";

interface IndustryCtx {
  config: IndustryConfig;
  slug: IndustrySlug;
}

const Ctx = createContext<IndustryCtx>({
  config: getIndustry("ssv"),
  slug: "ssv",
});

export function IndustryProvider({
  slug,
  children,
}: {
  slug?: IndustrySlug;
  children: ReactNode;
}) {
  const resolvedSlug = slug || getIndustryFromEnv();
  const config = getIndustry(resolvedSlug);

  return (
    <Ctx.Provider value={{ config, slug: resolvedSlug }}>
      {children}
    </Ctx.Provider>
  );
}

export function useIndustry() {
  return useContext(Ctx);
}

export function useIndustryColors() {
  const { config } = useIndustry();
  return config.colors;
}

export function useIndustryChatbot() {
  const { config } = useIndustry();
  return config.chatbot;
}
