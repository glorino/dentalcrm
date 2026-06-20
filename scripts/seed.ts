import { sql } from "../lib/db";
import { hashPassword } from "../lib/auth";

const demoUsers = [
  { email: "admin@supportflow.ai", password: "admin123", name: "Alex Johnson", role: "super_admin", team: "AI Operations" },
  { email: "marcus@supportflow.ai", password: "demo123", name: "Marcus Johnson", role: "admin", team: "Support Engineering" },
  { email: "sarah@supportflow.ai", password: "demo123", name: "Sarah Kim", role: "manager", team: "Billing & Accounts" },
  { email: "emily@supportflow.ai", password: "demo123", name: "Emily Rodriguez", role: "manager", team: "Customer Success" },
  { email: "tom@supportflow.ai", password: "demo123", name: "Tom Chen", role: "agent", team: "Support Engineering" },
  { email: "lisa@supportflow.ai", password: "demo123", name: "Lisa Park", role: "agent", team: "Support Engineering" },
  { email: "david@supportflow.ai", password: "demo123", name: "David Kim", role: "agent", team: "Billing & Accounts" },
  { email: "rachel@supportflow.ai", password: "demo123", name: "Rachel Green", role: "agent", team: "Customer Success" },
  { email: "mike@supportflow.ai", password: "demo123", name: "Mike Davis", role: "agent", team: "Support Engineering" },
  { email: "viewer@supportflow.ai", password: "demo123", name: "Jordan Lee", role: "viewer", team: null },
];

const demoCustomers = [
  { email: "sarah@acme.com", name: "Sarah Chen", company: "Acme Corp", segment: "enterprise", plan: "growth", ltv: 24500, csat: 4.8, total_tickets: 12 },
  { email: "dev@techstart.io", name: "TechStart Inc", company: "TechStart Inc", segment: "enterprise", plan: "enterprise", ltv: 18200, csat: 4.5, total_tickets: 8 },
  { email: "emily@design.co", name: "Emily Rodriguez", company: "Design Studio", segment: "pro", plan: "pro", ltv: 8400, csat: 4.9, total_tickets: 5 },
  { email: "james@retail.com", name: "James Park", company: "RetailCo", segment: "business", plan: "business", ltv: 12600, csat: 4.2, total_tickets: 15 },
  { email: "lisa@startup.app", name: "Lisa Wang", company: "StartupApp", segment: "starter", plan: "starter", ltv: 3200, csat: 4.7, total_tickets: 3 },
  { email: "tom@mobile.dev", name: "Tom Miller", company: "MobileDev", segment: "pro", plan: "pro", ltv: 9800, csat: 4.3, total_tickets: 7 },
  { email: "anna@corp.net", name: "Anna Smith", company: "CorpNet", segment: "business", plan: "business", ltv: 15400, csat: 4.6, total_tickets: 11 },
  { email: "mike@growth.io", name: "Mike Davis", company: "GrowthIO", segment: "enterprise", plan: "enterprise", ltv: 22100, csat: 4.8, total_tickets: 6 },
  { email: "rachel@coffee.co", name: "Rachel Green", company: "Coffee Co", segment: "starter", plan: "starter", ltv: 2800, csat: 4.9, total_tickets: 2 },
  { email: "david@fintech.com", name: "David Kim", company: "FinTech Pro", segment: "enterprise", plan: "enterprise", ltv: 31200, csat: 4.4, total_tickets: 18 },
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

async function seed() {
  console.log("Seeding database...");

  // Create users
  for (const user of demoUsers) {
    const hash = await hashPassword(user.password);
    try {
      await sql`
        INSERT INTO users (email, password_hash, name, role, team)
        VALUES (${user.email}, ${hash}, ${user.name}, ${user.role}, ${user.team})
        ON CONFLICT (email) DO NOTHING
      `;
      console.log(`Created user: ${user.email}`);
    } catch (e) {
      console.log(`User ${user.email} already exists`);
    }
  }

  // Create customers
  const customerIds: string[] = [];
  for (const customer of demoCustomers) {
    try {
      const result = await sql`
        INSERT INTO customers (email, name, company, segment, plan, ltv, csat, total_tickets)
        VALUES (${customer.email}, ${customer.name}, ${customer.company}, ${customer.segment}, ${customer.plan}, ${customer.ltv}, ${customer.csat}, ${customer.total_tickets})
        ON CONFLICT (email) DO UPDATE SET name = ${customer.name}
        RETURNING id
      `;
      customerIds.push(result[0].id);
      console.log(`Created customer: ${customer.name}`);
    } catch (e) {
      console.log(`Customer ${customer.email} already exists`);
    }
  }

  // Get user IDs
  const users = await sql`SELECT id, email FROM users`;
  const userIdMap: Record<string, string> = {};
  for (const u of users) {
    userIdMap[u.email] = u.id;
  }

  // Create tickets
  for (let i = 0; i < demoTickets.length; i++) {
    const ticket = demoTickets[i];
    const customerId = customerIds[i % customerIds.length];
    const assigneeId = userIdMap["tom@supportflow.ai"];
    const ticketNumber = `SF-${1234 - i}`;
    const slaDue = new Date(Date.now() + (ticket.priority === "urgent" ? 3600000 : ticket.priority === "high" ? 7200000 : 14400000));

    try {
      await sql`
        INSERT INTO tickets (ticket_number, subject, message, status, priority, channel, customer_id, assignee_id, sentiment, sentiment_score, ai_confidence, sla_status, sla_due, tags)
        VALUES (${ticketNumber}, ${ticket.subject}, ${ticket.message}, ${ticket.status}, ${ticket.priority}, ${ticket.channel}, ${customerId}, ${assigneeId}, ${ticket.sentiment}, ${ticket.sentiment_score}, ${ticket.ai_confidence}, 'ok', ${slaDue.toISOString()}, ${ticket.tags})
        ON CONFLICT (ticket_number) DO NOTHING
      `;
      console.log(`Created ticket: ${ticketNumber}`);
    } catch (e) {
      console.log(`Ticket ${ticketNumber} already exists`);
    }
  }

  console.log("Seed complete!");
  console.log("\nDemo Logins:");
  console.log("Admin:    admin@supportflow.ai / admin123");
  console.log("Manager:  sarah@supportflow.ai / demo123");
  console.log("Agent:    tom@supportflow.ai / demo123");
  console.log("Viewer:   viewer@supportflow.ai / demo123");
}

seed().catch(console.error);
