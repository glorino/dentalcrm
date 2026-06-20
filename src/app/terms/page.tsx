import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Terms &amp; Conditions</h1>
          <p className="text-gray-500">Last updated: June 15, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using SSV CRM (the &quot;Service&quot;), you agree to be bound by these Terms &amp; Conditions (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service. These Terms constitute a legally binding agreement between you (&quot;you,&quot; &quot;your,&quot; or &quot;User&quot;) and SSV (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 leading-relaxed">
              SSV CRM is an AI-powered customer support platform that provides:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Unified inbox for multi-channel customer support (WhatsApp, Email, SMS, Facebook Messenger, Instagram, Web Chat)</li>
              <li>AI-powered ticket classification, routing, and response generation</li>
              <li>Customer relationship management and analytics</li>
              <li>Knowledge base management</li>
              <li>Team management and escalation workflows</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
            <p className="text-gray-600 leading-relaxed">
              To use the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your password and account credentials</li>
              <li>Promptly update your account information if it changes</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-600 leading-relaxed">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose or in violation of any applicable law</li>
              <li>Send spam, phishing messages, or other unsolicited communications</li>
              <li>Transmit content that is harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service to transmit malware or other malicious code</li>
              <li>Violate the rights of third parties, including intellectual property rights</li>
              <li>Exceed reasonable usage limits or abuse the Service&apos;s resources</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. AI-Generated Content</h2>
            <p className="text-gray-600 leading-relaxed">
              The Service includes AI-powered features that automatically generate responses, classifications, and insights. You acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>AI-generated responses are suggestions and should be reviewed before sending to customers</li>
              <li>We do not guarantee the accuracy, completeness, or reliability of AI-generated content</li>
              <li>You are responsible for reviewing and approving AI-generated responses before they reach customers</li>
              <li>AI features are provided &quot;as is&quot; and may be updated or modified without notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed">
              The Service and its original content, features, and functionality are owned by SSV and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data and Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of information as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Payment and Billing</h2>
            <p className="text-gray-600 leading-relaxed">
              If you subscribe to a paid plan:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>You agree to pay all fees associated with your subscription plan</li>
              <li>All payments are processed in Nigerian Naira (₦)</li>
              <li>Fees are non-refundable except as required by law</li>
              <li>We reserve the right to change pricing with 30 days&apos; notice</li>
              <li>Failure to pay may result in suspension or termination of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Service Availability</h2>
            <p className="text-gray-600 leading-relaxed">
              We strive to maintain 99.99% uptime but do not guarantee uninterrupted access to the Service. We may perform scheduled maintenance, and we will provide reasonable advance notice when possible. We are not liable for any downtime or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              To the maximum extent permitted by law, SSV shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenue, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Your use of or inability to use the Service</li>
              <li>Any unauthorized access to or use of our servers</li>
              <li>Any interruption or cessation of the Service</li>
              <li>Any bugs, viruses, or other harmful code that may be transmitted through the Service</li>
              <li>Any errors or omissions in any content on the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
            <p className="text-gray-600 leading-relaxed">
              You agree to indemnify, defend, and hold harmless SSV and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              Either party may terminate this agreement at any time. Upon termination:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Your right to use the Service ceases immediately</li>
              <li>We may retain your data for a reasonable period as required by law</li>
              <li>Sections that by their nature should survive termination will survive</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in the courts of competent jurisdiction in Lagos, Nigeria.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about these Terms, please contact us at:
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-700 font-medium">SSV CRM</p>
              <p className="text-gray-600">Email: info@glopresc.com</p>
              <p className="text-gray-600">Phone: +234 905 998 0991</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
