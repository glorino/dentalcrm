import { NextResponse } from "next/server";
import { initDB, sql } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const demoUsers = [
  { email: "admin@ssv.com", password: "admin123", name: "Alex Johnson", role: "super_admin", team: "AI Operations" },
  { email: "marcus@ssv.com", password: "demo123", name: "Marcus Johnson", role: "admin", team: "Support Engineering" },
  { email: "sarah@ssv.com", password: "demo123", name: "Sarah Kim", role: "manager", team: "Billing & Accounts" },
  { email: "emily@ssv.com", password: "demo123", name: "Emily Rodriguez", role: "manager", team: "Customer Success" },
  { email: "tom@ssv.com", password: "demo123", name: "Tom Chen", role: "agent", team: "Support Engineering" },
  { email: "lisa@ssv.com", password: "demo123", name: "Lisa Park", role: "agent", team: "Support Engineering" },
  { email: "david@ssv.com", password: "demo123", name: "David Kim", role: "agent", team: "Billing & Accounts" },
  { email: "rachel@ssv.com", password: "demo123", name: "Rachel Green", role: "agent", team: "Customer Success" },
  { email: "mike@ssv.com", password: "demo123", name: "Mike Davis", role: "agent", team: "Support Engineering" },
  { email: "viewer@ssv.com", password: "demo123", name: "Jordan Lee", role: "viewer", team: null },
];

const demoCustomers = [
  { email: "sarah@acme.com", name: "Sarah Chen", company: "Acme Corp", segment: "enterprise", plan: "growth", ltv: 36750000, csat: 4.8, total_tickets: 12 },
  { email: "dev@techstart.io", name: "TechStart Inc", company: "TechStart Inc", segment: "enterprise", plan: "enterprise", ltv: 27300000, csat: 4.5, total_tickets: 8 },
  { email: "emily@design.co", name: "Emily Rodriguez", company: "Design Studio", segment: "pro", plan: "pro", ltv: 12600000, csat: 4.9, total_tickets: 5 },
  { email: "james@retail.com", name: "James Park", company: "RetailCo", segment: "business", plan: "business", ltv: 18900000, csat: 4.2, total_tickets: 15 },
  { email: "lisa@startup.app", name: "Lisa Wang", company: "StartupApp", segment: "starter", plan: "starter", ltv: 4800000, csat: 4.7, total_tickets: 3 },
  { email: "tom@mobile.dev", name: "Tom Miller", company: "MobileDev", segment: "pro", plan: "pro", ltv: 14700000, csat: 4.3, total_tickets: 7 },
  { email: "anna@corp.net", name: "Anna Smith", company: "CorpNet", segment: "business", plan: "business", ltv: 23100000, csat: 4.6, total_tickets: 11 },
  { email: "mike@growth.io", name: "Mike Davis", company: "GrowthIO", segment: "enterprise", plan: "enterprise", ltv: 33150000, csat: 4.8, total_tickets: 6 },
  { email: "rachel@coffee.co", name: "Rachel Green", company: "Coffee Co", segment: "starter", plan: "starter", ltv: 4200000, csat: 4.9, total_tickets: 2 },
  { email: "david@fintech.com", name: "David Kim", company: "FinTech Pro", segment: "enterprise", plan: "enterprise", ltv: 46800000, csat: 4.4, total_tickets: 18 },
];

const demoKnowledgeArticles = [
  { title: "How to Reset Your Password", content: "To reset your password, click the 'Forgot Password' link on the login page. Enter your registered email address and check your inbox for a reset link. The link expires after 24 hours. If you don't receive the email, check your spam folder or contact support. For security, password reset links can only be used once.", collection: "Account & Billing", status: "published", views: 1247, ai_used: 89, helpful: 94, tags: ["password", "account", "security", "login"] },
  { title: "Enabling Two-Factor Authentication (2FA)", content: "Two-factor authentication adds an extra layer of security to your account. Go to Settings > Security > Authentication and click 'Enable 2FA'. You can choose between SMS-based codes or authenticator apps (Google Authenticator, Authy). Once enabled, you'll need to enter a verification code each time you log in. Save your backup codes in a safe place in case you lose access to your 2FA device.", collection: "Account & Billing", status: "published", views: 892, ai_used: 67, helpful: 91, tags: ["2fa", "security", "account", "authentication"] },
  { title: "Understanding Your Invoice and Billing Cycle", content: "Invoices are generated on the 1st of each month for the previous month's usage. You can view and download invoices from Settings > Billing > Invoice History. Your plan charges include the base subscription plus any overage fees for tickets beyond your plan limit. Payments are automatically processed using the card on file. To update your payment method, go to Settings > Billing > Payment Methods.", collection: "Account & Billing", status: "published", views: 2103, ai_used: 156, helpful: 88, tags: ["billing", "invoice", "payment", "subscription"] },
  { title: "How to Upgrade or Downgrade Your Plan", content: "To change your plan, go to Settings > Billing > Subscription. Click 'Change Plan' and select your desired tier. Upgrades take effect immediately and you'll be charged a prorated amount. Downgrades take effect at the end of your current billing cycle. All plan features are listed on our pricing page. Contact sales@ssv.com for Enterprise custom plans.", collection: "Account & Billing", status: "published", views: 1567, ai_used: 112, helpful: 90, tags: ["plan", "upgrade", "downgrade", "subscription", "pricing"] },
  { title: "Requesting a Refund", content: "We offer refunds within 14 days of purchase if you're unsatisfied. To request a refund, email billing@ssv.com with your account email, invoice number, and reason for the refund. Refunds are processed within 5-7 business days to your original payment method. Note: refunds are not available for partial month usage after the 14-day window.", collection: "Account & Billing", status: "published", views: 743, ai_used: 54, helpful: 85, tags: ["refund", "billing", "money-back"] },
  { title: "Connecting WhatsApp Business API", content: "To connect WhatsApp, go to Settings > Channels > WhatsApp Business. Click 'Connect' and follow the OAuth flow with your WhatsApp Business account. You'll need a WhatsApp Business API-enabled number. Once connected, all incoming WhatsApp messages will appear in your unified inbox. Messages are processed through Meta's Cloud API with end-to-end encryption.", collection: "Integrations", status: "published", views: 3421, ai_used: 234, helpful: 92, tags: ["whatsapp", "integration", "messaging", "api"] },
  { title: "Setting Up Email Integration (IMAP/SMTP)", content: "Navigate to Settings > Channels > Email Integration. Enter your IMAP server details (host, port, username, password) for receiving emails, and SMTP details for sending. Common configurations: Gmail (imap.gmail.com:993), Outlook (outlook.office365.com:993). Enable SSL/TLS for secure connections. After setup, emails will automatically appear in your inbox and can be classified by AI agents.", collection: "Integrations", status: "published", views: 2876, ai_used: 198, helpful: 89, tags: ["email", "imap", "smtp", "integration"] },
  { title: "Configuring the Web Chat Widget", content: "Embed the chat widget on your website by adding a single script tag to your HTML: <script src='https://cdn.ssv.com/chat-widget.js' data-key='YOUR_KEY'></script>. Customize the widget appearance in Settings > Channels > Web Chat. You can change colors, position, welcome message, and pre-chat form fields. The widget supports mobile responsive design and agent handoff.", collection: "Integrations", status: "published", views: 1987, ai_used: 143, helpful: 93, tags: ["webchat", "widget", "embed", "integration"] },
  { title: "Integrating Facebook Messenger", content: "Connect your Facebook Page to SSV via Settings > Channels > Facebook Messenger. You'll need to authenticate with your Facebook account and select the page you want to connect. Messenger conversations will appear in your unified inbox alongside other channels. AI agents can respond to Messenger inquiries automatically using your knowledge base.", collection: "Integrations", status: "published", views: 1654, ai_used: 121, helpful: 87, tags: ["messenger", "facebook", "integration"] },
  { title: "Setting Up Instagram DM Integration", content: "Connect your Instagram Business account via Settings > Channels > Instagram DM. You need an Instagram Business or Creator account linked to a Facebook Page. Once connected, DMs and Story mentions will appear in your inbox. The AI can handle common inquiries and route complex issues to human agents.", collection: "Integrations", status: "published", views: 1234, ai_used: 89, helpful: 86, tags: ["instagram", "dm", "integration", "social"] },
  { title: "SMS Gateway Configuration (Termii)", content: "SSV uses Termii for SMS delivery across Nigeria and beyond. Configure in Settings > Channels > SMS. Enter your Termii API key and select your sender ID. Supported features: two-way SMS, OTP delivery, transactional messages, and delivery tracking. SMS is ideal for OTP delivery and critical notifications to customers.", collection: "Integrations", status: "published", views: 987, ai_used: 76, helpful: 84, tags: ["sms", "termii", "integration", "messaging"] },
  { title: "Understanding AI Agent Pipeline", content: "SSV uses 9 AI agents in a pipeline to resolve tickets: Intake (classification), Knowledge (article retrieval), Resolution (auto-fix), QA (quality check), Escalation (routing), Sentiment (emotion detection), Analytics (insights), Routing (assignment), and Feedback (surveys). The pipeline processes tickets in sequence, with each agent adding context. 67% of tickets are resolved without human intervention.", collection: "Getting Started", status: "published", views: 4521, ai_used: 312, helpful: 95, tags: ["ai", "agents", "pipeline", "automation"] },
  { title: "Quick Start Guide: Your First 30 Minutes", content: "Welcome to SSV! Here's how to get started: 1) Complete the onboarding wizard. 2) Connect at least one channel (WhatsApp or Email recommended). 3) Invite your team members via Settings > Teams. 4) Configure your AI agent responses in Settings > AI Configuration. 5) Set up SLA rules in Settings > Escalation. 6) Test with a sample ticket. Your dashboard will start showing real data within minutes.", collection: "Getting Started", status: "published", views: 5678, ai_used: 423, helpful: 96, tags: ["quickstart", "onboarding", "setup", "getting-started"] },
  { title: "Navigating the Dashboard", content: "The dashboard provides a real-time overview of your support operations. Key sections: Overview (KPIs and charts), Inbox (unified conversation view), Tickets (ticket management), Customers (customer profiles), Knowledge Base (article management), Analytics (detailed reports), Teams (team management), Escalation (escalation center), and Settings (configuration). Use the sidebar to navigate between sections.", collection: "Getting Started", status: "published", views: 3890, ai_used: 267, helpful: 91, tags: ["dashboard", "navigation", "getting-started"] },
  { title: "Setting Up Your First Team", content: "Go to Teams > Create Team. Name your team (e.g., 'Billing Support'), assign a team lead, and add members. Teams help organize agents by expertise and route tickets accordingly. Each team can have different SLA rules and escalation paths. You can assign tickets manually or let the AI routing agent distribute them based on agent expertise and workload.", collection: "Getting Started", status: "published", views: 2345, ai_used: 178, helpful: 89, tags: ["teams", "setup", "organization"] },
  { title: "Configuring SLA Rules", content: "Set up Service Level Agreements in Settings > SLA Rules. Define response time targets by priority: Urgent (1 hour), High (4 hours), Medium (8 hours), Low (24 hours). Configure escalation triggers when SLAs are at risk (80% elapsed) or breached. SLA compliance is tracked in real-time on your dashboard. Breached SLAs automatically trigger escalation to team leads.", collection: "Getting Started", status: "published", views: 1876, ai_used: 134, helpful: 90, tags: ["sla", "rules", "escalation", "configuration"] },
  { title: "Troubleshooting API 500 Errors", content: "If you're experiencing 500 errors from the API: 1) Check the API status page at status.ssv.com. 2) Verify your API key is valid and not expired. 3) Check request payload format (must be JSON). 4) Ensure you're not exceeding rate limits (1000 req/min). 5) Check server logs in Settings > Audit Log. If the issue persists, contact support with the request ID from the error response.", collection: "Troubleshooting", status: "published", views: 3210, ai_used: 245, helpful: 87, tags: ["api", "errors", "500", "troubleshooting"] },
  { title: "Why Are My Messages Not Delivering?", content: "Message delivery issues can occur due to: 1) Channel configuration errors - verify credentials in Settings > Channels. 2) API rate limits - check your provider's limits. 3) Invalid recipient numbers/emails. 4) Account suspension with the provider. 5) Network connectivity issues. Check the delivery status in the message details view. For WhatsApp, ensure your template messages are approved by Meta.", collection: "Troubleshooting", status: "published", views: 2876, ai_used: 198, helpful: 86, tags: ["delivery", "messaging", "troubleshooting"] },
  { title: "AI Agent Not Responding Correctly", content: "If AI responses seem inaccurate: 1) Check the knowledge base has relevant articles. 2) Review the AI confidence score - low scores indicate uncertainty. 3) Update article content to be more specific. 4) Adjust AI configuration in Settings > AI Agent Settings. 5) Check sentiment analysis is correctly categorizing emotions. You can manually override AI responses and the system learns from corrections.", collection: "Troubleshooting", status: "published", views: 1987, ai_used: 156, helpful: 88, tags: ["ai", "responses", "accuracy", "troubleshooting"] },
  { title: "Mobile App Crashes and Performance", content: "For mobile app issues: 1) Ensure you're on the latest version. 2) Clear app cache (Settings > Storage > Clear Cache). 3) Check device compatibility (iOS 15+ / Android 10+). 4) Restart the app. 5) If crashes persist, reinstall the app. For iOS photo upload crashes, this is a known issue on iOS 17.2 - update to 17.3+ for the fix. Report persistent issues via the in-app feedback form.", collection: "Troubleshooting", status: "published", views: 1543, ai_used: 112, helpful: 83, tags: ["mobile", "crash", "performance", "troubleshooting"] },
  { title: "Understanding Sentiment Analysis", content: "SSV's sentiment agent analyzes every message in real-time, detecting emotions like positive, neutral, negative, angry, and frustrated. Sentiment scores range from -1 (very negative) to +1 (very positive). The system uses natural language processing trained on customer support data. Sentiment trends are tracked over time to identify patterns. Use sentiment data to prioritize at-risk customers and improve response strategies.", collection: "Technical Docs", status: "published", views: 2345, ai_used: 189, helpful: 91, tags: ["sentiment", "ai", "analysis", "nlp"] },
  { title: "REST API Documentation Overview", content: "SSV provides a comprehensive REST API for programmatic access. Base URL: https://api.ssv.com/v1. Authentication: Bearer token in Authorization header. Key endpoints: /tickets (CRUD), /customers (CRUD), /knowledge (search), /analytics (reports). Rate limits: 1000 requests/minute. Full documentation at docs.ssv.com/api. SDKs available for Node.js, Python, PHP, and Go.", collection: "API Reference", status: "published", views: 4567, ai_used: 345, helpful: 93, tags: ["api", "rest", "documentation", "developers"] },
  { title: "Webhook Configuration Guide", content: "Set up webhooks in Settings > API > Webhooks. Available events: ticket.created, ticket.updated, ticket.escalated, message.received, sentiment.changed. Payload includes event type, timestamp, and full resource data. Configure retry logic (3 attempts with exponential backoff). Verify webhook signatures using your webhook secret. Test webhooks with the built-in test tool.", collection: "API Reference", status: "published", views: 1876, ai_used: 134, helpful: 89, tags: ["webhook", "api", "events", "integration"] },
  { title: "Data Export and Privacy Compliance", content: "SSV is GDPR and NDPR compliant. Export your data anytime from Settings > Data > Export. Available formats: CSV, JSON, XML. Exports include tickets, customers, conversations, and analytics. Data retention: 90 days for messages, 1 year for tickets, indefinite for knowledge base. To request data deletion, email privacy@ssv.com. Audit logs track all data access.", collection: "Technical Docs", status: "published", views: 1234, ai_used: 89, helpful: 90, tags: ["gdpr", "privacy", "data", "compliance", "export"] },
  { title: "Customizing AI Response Tone", content: "Configure AI response tone in Settings > AI > Response Style. Options: Professional (formal, business-like), Friendly (casual, warm), Technical (detailed, precise), Empathetic (understanding, caring). You can set different tones per channel. The AI adapts based on customer sentiment - more empathetic when sentiment is negative. Preview responses before going live with the test mode.", collection: "Technical Docs", status: "published", views: 1654, ai_used: 123, helpful: 88, tags: ["ai", "tone", "customization", "responses"] },
  { title: "Escalation Rules and Automation", content: "Automate ticket escalation in Settings > Escalation. Rule triggers: SLA breach, sentiment below threshold, keywords (e.g., 'cancel', 'lawsuit', 'angry'), VIP customer, low AI confidence. Actions: assign to specific team/agent, change priority, send notification, add tags. Rules are evaluated in order. Use the test simulator to preview escalation behavior before activating rules.", collection: "Technical Docs", status: "published", views: 2109, ai_used: 167, helpful: 91, tags: ["escalation", "automation", "rules", "configuration"] },
  { title: "Understanding CSAT Scores", content: "Customer Satisfaction (CSAT) scores are collected via post-resolution surveys. Scores range from 1-5. Your overall CSAT is displayed on the dashboard as the average of all responses. Industry benchmarks: >4.0 is excellent, 3.5-4.0 is good, <3.5 needs improvement. Track CSAT by channel, agent, and time period in Analytics. Low CSAT triggers alerts for immediate review.", collection: "Technical Docs", status: "published", views: 1432, ai_used: 109, helpful: 87, tags: ["csat", "satisfaction", "metrics", "analytics"] },
  { title: "Managing Multiple Brands", content: "SSV supports multi-brand deployments. Each brand can have: separate knowledge base, custom AI responses, unique SLA rules, brand-specific channels, and custom widget branding. Configure brands in Settings > Brands > Create Brand. Route tickets to brand-specific teams automatically. Analytics can be filtered by brand for individual or consolidated reporting.", collection: "Getting Started", status: "published", views: 987, ai_used: 78, helpful: 85, tags: ["brands", "multi-brand", "organization"] },
  { title: "Keyboard Shortcuts and Efficiency Tips", content: "Boost productivity with shortcuts: ⌘/Ctrl+K (global search), ⌘/Ctrl+N (new ticket), ⌘/Ctrl+Enter (send message), ⌘/Ctrl+Shift+A (AI assist), Esc (close modal), Tab (navigate fields). Custom shortcuts available in Settings > Preferences. Pro tip: Use canned responses (type / followed by shortcut name) for common replies. Enable keyboard navigation in accessibility settings.", collection: "Getting Started", status: "published", views: 876, ai_used: 67, helpful: 92, tags: ["shortcuts", "productivity", "tips", "keyboard"] },
];

const demoTickets = [
  { subject: "Can't access my account after password reset", message: "I reset my password but now I can't log in. It keeps saying invalid credentials.", status: "open", priority: "high", channel: "whatsapp", sentiment: "negative", sentiment_score: -0.3, ai_confidence: 94, tags: ["account", "urgent"] },
  { subject: "Refund request for order #98765", message: "I was charged twice for my last order. Please process a refund.", status: "pending", priority: "medium", channel: "email", sentiment: "neutral", sentiment_score: 0.0, ai_confidence: 88, tags: ["billing", "refund"] },
  { subject: "API returning 500 errors intermittently", message: "Our API calls are failing with 500 errors since yesterday. This is blocking our production deployment.", status: "escalated", priority: "urgent", channel: "web", sentiment: "angry", sentiment_score: -0.7, ai_confidence: 72, tags: ["api", "bug", "critical"] },
  { subject: "How to integrate with Salesforce?", message: "We want to connect our Salesforce account. Is there a guide for this?", status: "open", priority: "low", channel: "messenger", sentiment: "neutral", sentiment_score: 0.1, ai_confidence: 96, tags: ["integration", "how-to"] },
  { subject: "Billing discrepancy on invoice #4521", message: "My invoice shows $49 but I'm on the $29 plan. Can you explain?", status: "open", priority: "medium", channel: "sms", sentiment: "neutral", sentiment_score: -0.1, ai_confidence: 88, tags: ["billing"] },
  { subject: "Feature request: dark mode support", message: "It would be great to have a dark mode option for the dashboard.", status: "open", priority: "low", channel: "web", sentiment: "positive", sentiment_score: 0.5, ai_confidence: 99, tags: ["feature-request"] },
  { subject: "App crashes on iOS 17.2 when uploading photos", message: "Every time I try to upload a photo on iOS 17.2, the app crashes immediately.", status: "open", priority: "high", channel: "instagram", sentiment: "frustrated", sentiment_score: -0.4, ai_confidence: 85, tags: ["bug", "ios", "mobile"] },
  { subject: "Cannot download invoice PDF", message: "When I click download on my invoice, nothing happens.", status: "resolved", priority: "low", channel: "whatsapp", sentiment: "neutral", sentiment_score: -0.1, ai_confidence: 97, tags: ["billing"] },
  { subject: "Want to upgrade to Growth plan", message: "I'd like to upgrade from Starter to Growth. What are the differences?", status: "open", priority: "low", channel: "web", sentiment: "positive", sentiment_score: 0.6, ai_confidence: 99, tags: ["sales", "upgrade"] },
  { subject: "Two-factor auth not working", message: "I'm not receiving the 2FA codes via SMS anymore.", status: "open", priority: "medium", channel: "email", sentiment: "negative", sentiment_score: -0.2, ai_confidence: 91, tags: ["account", "security"] },
];

export async function POST() {
  try {
    await initDB();

    for (const user of demoUsers) {
      const hash = await hashPassword(user.password);
      await sql`
        INSERT INTO users (email, password_hash, name, role, team)
        VALUES (${user.email}, ${hash}, ${user.name}, ${user.role}, ${user.team})
        ON CONFLICT (email) DO NOTHING
      `;
    }

    const customerIds: string[] = [];
    for (const c of demoCustomers) {
      const result = await sql`
        INSERT INTO customers (email, name, company, segment, plan, ltv, csat, total_tickets)
        VALUES (${c.email}, ${c.name}, ${c.company}, ${c.segment}, ${c.plan}, ${c.ltv}, ${c.csat}, ${c.total_tickets})
        ON CONFLICT (email) DO UPDATE SET name = ${c.name}
        RETURNING id
      `;
      customerIds.push(result[0].id);
    }

    const users = await sql`SELECT id, email FROM users`;
    const userIdMap: Record<string, string> = {};
    for (const u of users) userIdMap[u.email] = u.id;

    for (let i = 0; i < demoTickets.length; i++) {
      const t = demoTickets[i];
      const customerId = customerIds[i % customerIds.length];
      const assigneeId = userIdMap["tom@ssv.com"];
      const ticketNumber = `SSV-${1234 - i}`;
      const slaDue = new Date(Date.now() + (t.priority === "urgent" ? 3600000 : t.priority === "high" ? 7200000 : 14400000));

      await sql`
        INSERT INTO tickets (ticket_number, subject, message, status, priority, channel, customer_id, assignee_id, sentiment, sentiment_score, ai_confidence, sla_status, sla_due, tags)
        VALUES (${ticketNumber}, ${t.subject}, ${t.message}, ${t.status}, ${t.priority}, ${t.channel}, ${customerId}, ${assigneeId}, ${t.sentiment}, ${t.sentiment_score}, ${t.ai_confidence}, 'ok', ${slaDue.toISOString()}, ${t.tags})
        ON CONFLICT (ticket_number) DO NOTHING
      `;
    }

    const adminUserId = userIdMap["admin@ssv.com"];
    await sql`DELETE FROM knowledge_articles`;
    for (const article of demoKnowledgeArticles) {
      await sql`
        INSERT INTO knowledge_articles (title, content, collection, status, views, ai_used, helpful, tags, created_by)
        VALUES (${article.title}, ${article.content}, ${article.collection}, ${article.status}, ${article.views}, ${article.ai_used}, ${article.helpful}, ${article.tags}, ${adminUserId})
      `;
    }

    return NextResponse.json({
      message: "Database seeded successfully",
      logins: {
        admin: "admin@ssv.com / admin123",
        manager: "sarah@ssv.com / demo123",
        agent: "tom@ssv.com / demo123",
        viewer: "viewer@ssv.com / demo123",
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}
