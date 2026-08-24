"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/context";

interface SettingItem {
  key: string;
  label: string;
  desc: string;
  value: string;
  type: "text" | "toggle" | "select";
  options?: string[];
}

export default function SettingsPage() {
  const { t } = useLang();
  const [editing, setEditing] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({
    companyName: "DentalCRM",
    workingHours: "Mon-Fri 8am-6pm",
    timezone: "Africa/Lagos",
    contactEmail: "info@glopresc.com",
    contactPhone: "+2347082529729",
    aiConfidence: "85",
    escalationThreshold: "70",
    autoResolution: "enabled",
    slaResponseTime: "30 minutes",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    setSettings(prev => ({ ...prev, [key]: value }));
    setEditing(null);
    setTimeout(() => setSaving(false), 500);
  };

  const sections = [
    {
      title: t("settingsPage.company"),
      icon: "🏢",
      gradient: "from-blue-500 to-indigo-600",
      items: [
        { key: "companyName", label: t("settingsPage.companyProfile"), desc: t("settingsPage.companyProfileDesc"), value: settings.companyName, type: "text" as const },
        { key: "workingHours", label: t("settingsPage.workingHours"), desc: t("settingsPage.workingHoursDesc"), value: settings.workingHours, type: "text" as const },
        { key: "timezone", label: t("settingsPage.timezone"), desc: t("settingsPage.timezoneDesc"), value: settings.timezone, type: "select" as const, options: ["Africa/Lagos", "UTC", "Europe/London", "America/New_York"] },
        { key: "contactEmail", label: t("settingsPage.contactInfo"), desc: t("settingsPage.contactInfoDesc"), value: settings.contactEmail, type: "text" as const },
      ],
    },
    {
      title: t("settingsPage.aiConfig"),
      icon: "🤖",
      gradient: "from-green-500 to-emerald-600",
      items: [
        { key: "aiConfidence", label: t("settingsPage.autoResolution"), desc: t("settingsPage.autoResolutionDesc"), value: settings.aiConfidence, type: "select" as const, options: ["70", "75", "80", "85", "90", "95"] },
        { key: "escalationThreshold", label: t("settingsPage.escalationTriggers"), desc: t("settingsPage.escalationTriggersDesc"), value: settings.escalationThreshold, type: "select" as const, options: ["50", "60", "70", "80"] },
        { key: "autoResolution", label: t("settingsPage.knowledgeAi"), desc: t("settingsPage.knowledgeAiDesc"), value: settings.autoResolution, type: "toggle" as const },
        { key: "slaResponseTime", label: "SLA Response Time", desc: "Target response time for support tickets", value: settings.slaResponseTime, type: "select" as const, options: ["15 minutes", "30 minutes", "1 hour", "2 hours", "4 hours"] },
      ],
    },
    {
      title: t("settingsPage.security"),
      icon: "🔒",
      gradient: "from-amber-400 to-orange-500",
      items: [
        { key: "mfa", label: t("settingsPage.authentication"), desc: t("settingsPage.authenticationDesc"), value: "disabled", type: "toggle" as const },
        { key: "auditLog", label: t("settingsPage.auditLog"), desc: t("settingsPage.auditLogDesc"), value: "enabled", type: "toggle" as const },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("settingsPage.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("settingsPage.subtitle")}</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            Saving...
          </div>
        )}
      </div>

      {sections.map((section, i) => (
        <div key={section.title} className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <div className={`flex items-center gap-3 px-6 py-4 bg-gradient-to-r ${section.gradient} text-white`}>
            <span className="text-lg">{section.icon}</span>
            <h3 className="text-base font-semibold">{section.title}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {section.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                <div className="flex-1 mr-4">
                  <div className="text-sm font-medium text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                </div>
                <div className="flex items-center gap-3">
                  {editing === item.key ? (
                    <div className="flex items-center gap-2">
                      {item.type === "toggle" ? (
                        <select
                          value={item.value}
                          onChange={(e) => handleSave(item.key, e.target.value)}
                          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="enabled">Enabled</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      ) : item.type === "select" ? (
                        <select
                          value={item.value}
                          onChange={(e) => handleSave(item.key, e.target.value)}
                          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          {item.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          defaultValue={item.value}
                          autoFocus
                          onKeyDown={(e) => { if (e.key === "Enter") handleSave(item.key, (e.target as HTMLInputElement).value); if (e.key === "Escape") setEditing(null); }}
                          onBlur={(e) => handleSave(item.key, e.target.value)}
                          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      )}
                      <button onClick={() => setEditing(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setEditing(item.key)}>
                      <span className="text-sm text-gray-500">{item.type === "toggle" ? (item.value === "enabled" ? "✅ Enabled" : "⏸️ Disabled") : item.value}</span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
