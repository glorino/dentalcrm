"use client";

import { useLang } from "@/lib/i18n/context";

export default function SettingsPage() {
  const { t } = useLang();

  const settingsSections = [
    {
      title: t("settingsPage.company"),
      icon: "🏢",
      items: [
        { label: t("settingsPage.companyProfile"), desc: t("settingsPage.companyProfileDesc"), current: "SSV" },
        { label: t("settingsPage.workingHours"), desc: t("settingsPage.workingHoursDesc"), current: "Mon-Fri, 9AM-6PM EST" },
        { label: t("settingsPage.timezone"), desc: t("settingsPage.timezoneDesc"), current: "America/New_York" },
        { label: t("settingsPage.contactInfo"), desc: t("settingsPage.contactInfoDesc"), current: "Edit" },
      ],
    },
    {
      title: t("settingsPage.aiConfig"),
      icon: "🤖",
      items: [
        { label: t("settingsPage.aiAgentSettings"), desc: t("settingsPage.aiAgentSettingsDesc"), current: "Active" },
        { label: t("settingsPage.autoResolution"), desc: t("settingsPage.autoResolutionDesc"), current: "70% confidence" },
        { label: t("settingsPage.escalationTriggers"), desc: t("settingsPage.escalationTriggersDesc"), current: "5 rules active" },
        { label: t("settingsPage.knowledgeAi"), desc: t("settingsPage.knowledgeAiDesc"), current: "Enabled" },
      ],
    },
    {
      title: t("settingsPage.channelsSection"),
      icon: "📡",
      items: [
        { label: t("settingsPage.webChat"), desc: t("settingsPage.webChatDesc"), current: "Connected" },
        { label: t("settingsPage.whatsapp"), desc: t("settingsPage.whatsappDesc"), current: "Connected" },
        { label: t("settingsPage.emailIntegration"), desc: t("settingsPage.emailDesc"), current: "Connected" },
        { label: t("settingsPage.smsTermii"), desc: t("settingsPage.smsDesc"), current: "Connected" },
        { label: t("settingsPage.messenger"), desc: t("settingsPage.messengerDesc"), current: "Connected" },
        { label: t("settingsPage.instagramDm"), desc: t("settingsPage.instagramDesc"), current: "Connected" },
      ],
    },
    {
      title: t("settingsPage.security"),
      icon: "🔒",
      items: [
        { label: t("settingsPage.authentication"), desc: t("settingsPage.authenticationDesc"), current: "2FA Enabled" },
        { label: t("settingsPage.rolesPermissions"), desc: t("settingsPage.rolesDesc"), current: "5 roles" },
        { label: t("settingsPage.apiKeys"), desc: t("settingsPage.apiKeysDesc"), current: "3 active keys" },
        { label: t("settingsPage.auditLog"), desc: t("settingsPage.auditLogDesc"), current: "Enabled" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("settingsPage.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("settingsPage.subtitle")}</p>
        </div>
      </div>

      {settingsSections.map((section, i) => {
        const colors = ["card-gradient-blue", "card-gradient-green", "card-gradient-purple", "card-gradient-amber"];
        const gradients = ["from-blue-500 to-indigo-600", "from-green-500 to-emerald-600", "from-purple-500 to-violet-600", "from-amber-400 to-orange-500"];
        return (
        <div key={section.title} className={`rounded-2xl border border-gray-200 overflow-hidden ${colors[i % colors.length]}`}>
          <div className={`flex items-center gap-3 px-6 py-4 bg-gradient-to-r ${gradients[i % gradients.length]} text-white`}>
            <span className="text-lg">{section.icon}</span>
            <h3 className="text-base font-semibold">{section.title}</h3>
          </div>
          <div className="divide-y divide-gray-50 bg-white/80">
            {section.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{item.current}</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      })}
    </div>
  );
}
