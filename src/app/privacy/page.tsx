"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/context";

export default function PrivacyPolicyPage() {
  const { t } = useLang();
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {t("misc.backToHome")}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{t("misc.privacyPolicy")}</h1>
          <p className="text-gray-500">{t("misc.lastUpdated")}</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              Welcome to DentalCRM (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our customer support platform and related services (collectively, the &quot;Service&quot;).
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this policy, please do not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Data</h3>
                <p className="text-gray-600 leading-relaxed">
                  We may collect personal information that you voluntarily provide to us when you register for the Service, including but not limited to:
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                  <li>Names and email addresses</li>
                  <li>Phone numbers</li>
                  <li>Company information</li>
                  <li>Account credentials</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Support Data</h3>
                <p className="text-gray-600 leading-relaxed">
                  When customers interact with your support channels through our platform, we collect:
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                  <li>Messages and communications sent through WhatsApp, Email, SMS, Facebook Messenger, Instagram, and Web Chat</li>
                  <li>Ticket metadata (status, priority, sentiment analysis)</li>
                  <li>Interaction timestamps and channel information</li>
                  <li>AI-generated classifications and responses</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Automatically Collected Data</h3>
                <p className="text-gray-600 leading-relaxed">
                  We automatically collect certain information when you use the Service, including:
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                  <li>Log data (IP address, browser type, pages visited)</li>
                  <li>Device information</li>
                  <li>Usage analytics and performance metrics</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process and route customer support conversations</li>
              <li>Power AI-driven features (classification, sentiment analysis, auto-responses)</li>
              <li>Improve and personalize the Service</li>
              <li>Send administrative notifications and support updates</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. AI and Automated Processing</h2>
            <p className="text-gray-600 leading-relaxed">
              Our Service uses artificial intelligence to automatically classify, route, and respond to customer support messages. This includes:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Intent classification and priority assignment</li>
              <li>Sentiment analysis of customer communications</li>
              <li>Automated response generation using our AI agents</li>
              <li>Quality assurance review of AI-generated responses</li>
              <li>Escalation routing to human agents when needed</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              AI-processed data is used solely to provide and improve the Service. We do not sell AI-processed insights to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-600 leading-relaxed">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li><strong>Service Providers:</strong> Third-party vendors who assist in operating the Service (hosting, AI providers, payment processors)</li>
              <li><strong>Channel Partners:</strong> WhatsApp (Meta), Facebook, Instagram, and SMS providers for message delivery</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental regulation</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement industry-standard security measures to protect your data, including encryption in transit (TLS/SSL) and at rest, access controls, regular security audits, and SOC 2 compliance. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide the Service. Customer support tickets and conversation histories are retained according to your account settings. You may request deletion of your data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability — receive your data in a structured, machine-readable format</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-600 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children&apos;s Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              The Service is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-700 font-medium">DentalCRM</p>
              <p className="text-gray-600">Email: info@glopresc.com</p>
              <p className="text-gray-600">Phone: +234 905 998 0991</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
