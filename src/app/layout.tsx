import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/context";
import { LangSync } from "@/lib/i18n/lang-sync";
import { IndustryProvider } from "@/lib/industry/context";
import { getIndustryFromEnv } from "@/lib/industry/config";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const industry = getIndustryFromEnv();
const industryConfig = (() => {
  const { industries } = require("@/lib/industry/config");
  return industries[industry] || industries.healthcare;
})();

export const metadata: Metadata = {
  title: industryConfig.metaTitle,
  description: industryConfig.metaDescription,
  icons: {
    icon: industryConfig.favicon,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${dmSans.variable} font-sans`}>
        <IndustryProvider slug={industry}>
          <LanguageProvider>
            <LangSync />
            {children}
          </LanguageProvider>
        </IndustryProvider>
      </body>
    </html>
  );
}
