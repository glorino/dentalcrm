import { openai } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getIndustryFromEnv, getIndustry } from "@/lib/industry/config";

function fuzzyMatch(input: string, keywords: string[]): boolean {
  const lower = input.toLowerCase().trim();
  for (const keyword of keywords) {
    if (lower.includes(keyword)) return true;
    const words = lower.split(/\s+/);
    for (const word of words) {
      if (Math.abs(word.length - keyword.length) <= 2) {
        let diff = 0;
        const minLen = Math.min(word.length, keyword.length);
        for (let i = 0; i < minLen; i++) {
          if (word[i] !== keyword[i]) diff++;
        }
        diff += Math.abs(word.length - keyword.length);
        if (diff <= Math.floor(keyword.length * 0.35)) return true;
      }
    }
  }
  return false;
}

function getFallbackResponse(message: string): string {
  const slug = getIndustryFromEnv();
  const config = getIndustry(slug);
  const lower = message.toLowerCase();
  const fb = config.chatbot.fallbackResponses;

  if (fuzzyMatch(lower, ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"])) {
    return `Hello! Welcome to ${config.name} Support. I'm your AI assistant, ready to help you with any questions.\n\nI can assist with:\n• Account and billing questions\n• Technical support\n• Feature inquiries\n• Creating support tickets\n\nHow can I help you today?`;
  }
  if (fuzzyMatch(lower, ["password", "reset", "login", "forgot", "locked"])) {
    return fb.passwordReset || `To reset your password:\n\n1. Go to the login page and click "Forgot Password"\n2. Enter your registered email address\n3. Check your inbox for the reset link\n4. Click the link and create a new password\n\nIf you still can't access your account, please email us at ${config.contact.email} and we'll help you right away.`;
  }
  if (fuzzyMatch(lower, ["human", "agent", "talk to", "speak", "person"])) {
    return `I understand you'd like to speak with a human agent. I'm connecting you now. In the meantime, you can also reach us directly:\n\n📧 Email: ${config.contact.email}\n📱 WhatsApp: ${config.contact.whatsapp}\n\nOur team typically responds within 2 minutes during business hours.`;
  }
  if (fuzzyMatch(lower, ["billing", "invoice", "payment", "charge", "refund"])) {
    return fb.billing || `For billing questions, I can help! Here's what I need to know:\n\n• Do you have your invoice number or account email?\n• What specific billing issue are you experiencing?\n\nCommon billing topics:\n- Invoice discrepancies\n- Payment method updates\n- Subscription changes\n- Refund requests\n\nPlease share the details and I'll look into it for you.`;
  }
  if (fuzzyMatch(lower, ["appointment", "booking", "schedule", "reschedule", "cancel"])) {
    return fb.appointment || `I can help you with appointment management. To assist you better, could you please provide:\n\n• Your name or email address\n• The type of appointment you need\n• Your preferred date and time\n\nI'll check availability and help you book or reschedule.`;
  }
  if (fuzzyMatch(lower, ["ticket", "status", "update", "track"])) {
    return `I can check your ticket status. Could you please provide your ticket number (e.g. ${config.ticketPrefix}-1234) or the email address you used when creating the ticket?\n\nI'll look it up and give you the latest update.`;
  }

  return `Thank you for reaching out to ${config.name}! I'm here to help.\n\nI can assist you with:\n• Account and password issues\n• Billing and invoice questions\n• Technical support\n• Appointment and scheduling\n• Creating support tickets\n\nCould you tell me more about what you need help with? For immediate assistance, you can also reach us at:\n\n📧 ${config.contact.email}\n📱 WhatsApp: ${config.contact.whatsapp}`;
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const lastMessage = messages[messages.length - 1]?.content || "";
    const response = getFallbackResponse(lastMessage);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(response));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" },
    });
  }

  const slug = getIndustryFromEnv();
  const config = getIndustry(slug);
  const industryName = config.name;
  const ticketPrefix = config.ticketPrefix;
  const contactEmail = config.contact.email;
  const contactWhatsapp = config.contact.whatsapp;
  const industryDesc = config.description;

  let result;
  try {
    result = streamText({
      model: openai("gpt-4o"),
      system: `You are the AI support assistant for ${industryName}, a ${industryDesc}.

You are an intelligent, helpful, and empathetic support agent. You have FULL ACCESS to the database and can look up any information to help customers.

CORE BEHAVIOR:
- Always be helpful, professional, and empathetic
- Use the customer's name when available
- Provide clear, actionable solutions
- If you can resolve an issue directly, do so
- If you need more information, ask specific questions
- Always verify facts before providing solutions
- If uncertain, offer to escalate to a human agent

INDUSTRY CONTEXT:
- Company: ${industryName}
- Industry: ${industryDesc}
- Ticket prefix: ${ticketPrefix}
- Contact email: ${contactEmail}
- WhatsApp: ${contactWhatsapp}
- All currency is in Naira (₦)

AVAILABLE TOOLS:
1. searchKnowledgeBase - Search for articles about any topic
2. lookupCustomer - Look up a customer by email OR name
3. lookupTicket - Look up a ticket by ticket number
4. createTicket - Create a new support ticket
5. searchTickets - Search tickets by status, priority, or customer
6. getTicketMessages - Get the conversation history of a ticket
7. getCustomerTickets - Get all tickets for a specific customer
8. getAnalytics - Get current support metrics
9. searchCustomers - Search customers by name or company

RESPONSE GUIDELINES:
- For appointment questions: Use lookupCustomer to find the patient, then searchTickets to check their appointments
- For ticket status: Use lookupTicket to get the current status and details
- For billing questions: Use lookupCustomer to check their account and plan details
- For technical issues: Use searchKnowledgeBase to find relevant articles
- For complaints: Use searchTickets to find related issues and createTicket if needed
- For general questions: Use searchKnowledgeBase first, then provide a helpful response

Always try to resolve the issue before suggesting escalation. Use multiple tools if needed to gather complete information.`,
      messages,
      tools: {
        searchKnowledgeBase: tool({
          description: "Search the knowledge base for relevant support articles. Use this for any how-to questions, troubleshooting, or feature inquiries.",
          inputSchema: z.object({
            query: z.string().describe("Search query to find relevant articles (use keywords)"),
          }),
          execute: async ({ query }) => {
            try {
              const results = await sql`
                SELECT id, title, content, collection, views, ai_used, helpful
                FROM knowledge_articles
                WHERE status = 'published'
                  AND (title ILIKE ${`%${query}%`} OR content ILIKE ${`%${query}%`} OR ${query} = ANY(tags))
                ORDER BY views DESC
                LIMIT 5
              `;
              return {
                results: results.map((r: Record<string, unknown>) => ({
                  id: r.id,
                  title: r.title,
                  content: r.content,
                  collection: r.collection,
                  views: r.views,
                })),
                totalResults: results.length,
              };
            } catch {
              return { results: [], totalResults: 0, note: "Knowledge base search failed" };
            }
          },
        }),
        lookupCustomer: tool({
          description: "Look up a customer by email address or name to get their account info, plan, and ticket history.",
          inputSchema: z.object({
            email: z.string().optional().describe("Customer email address"),
            name: z.string().optional().describe("Customer name (partial match)"),
          }),
          execute: async ({ email, name }) => {
            try {
              let customers;
              if (email) {
                customers = await sql`
                  SELECT id, name, email, phone, company, segment, plan, ltv, csat, total_tickets, status, created_at
                  FROM customers WHERE email ILIKE ${`%${email}%`}
                  LIMIT 5
                `;
              } else if (name) {
                customers = await sql`
                  SELECT id, name, email, phone, company, segment, plan, ltv, csat, total_tickets, status, created_at
                  FROM customers WHERE name ILIKE ${`%${name}%`}
                  LIMIT 5
                `;
              } else {
                return { found: false, note: "Please provide an email or name" };
              }
              if (customers.length === 0) {
                return { found: false, note: "No customer found with that information" };
              }
              return {
                found: true,
                customers: customers.map((c: Record<string, unknown>) => ({
                  id: c.id,
                  name: c.name,
                  email: c.email,
                  phone: c.phone,
                  company: c.company,
                  segment: c.segment,
                  plan: c.plan,
                  lifetimeValue: `₦${Number(c.ltv).toLocaleString()}`,
                  csat: c.csat,
                  totalTickets: c.total_tickets,
                  status: c.status,
                  memberSince: c.created_at,
                })),
              };
            } catch {
              return { found: false, note: "Database lookup failed" };
            }
          },
        }),
        lookupTicket: tool({
          description: "Look up a specific ticket by its ticket number (e.g. ${ticketPrefix}-1234) to get full details.",
          inputSchema: z.object({
            ticketNumber: z.string().describe(`Ticket number like ${ticketPrefix}-1234`),
          }),
          execute: async ({ ticketNumber }) => {
            try {
              const tickets = await sql`
                SELECT t.id, t.ticket_number, t.subject, t.message, t.status, t.priority,
                       t.channel, t.sentiment, t.sentiment_score, t.ai_confidence,
                       t.sla_status, t.sla_due, t.tags, t.created_at, t.updated_at,
                       c.name as customer_name, c.email as customer_email, c.company as customer_company,
                       u.name as assignee_name
                FROM tickets t
                LEFT JOIN customers c ON t.customer_id = c.id
                LEFT JOIN users u ON t.assignee_id = u.id
                WHERE t.ticket_number ILIKE ${`%${ticketNumber}%`}
                LIMIT 3
              `;
              if (tickets.length === 0) {
                return { found: false, ticketNumber, note: "Ticket not found" };
              }
              return {
                found: true,
                tickets: tickets.map((t: Record<string, unknown>) => ({
                  ticketNumber: t.ticket_number,
                  subject: t.subject,
                  message: t.message,
                  status: t.status,
                  priority: t.priority,
                  channel: t.channel,
                  sentiment: t.sentiment,
                  sentimentScore: t.sentiment_score,
                  aiConfidence: t.ai_confidence,
                  slaStatus: t.sla_status,
                  slaDue: t.sla_due,
                  tags: t.tags,
                  createdAt: t.created_at,
                  updatedAt: t.updated_at,
                  customerName: t.customer_name,
                  customerEmail: t.customer_email,
                  customerCompany: t.customer_company,
                  assignee: t.assignee_name,
                })),
              };
            } catch {
              return { found: false, ticketNumber, note: "Database lookup failed" };
            }
          },
        }),
        searchTickets: tool({
          description: "Search tickets by status, priority, or keywords. Useful for finding open issues or checking ticket queues.",
          inputSchema: z.object({
            status: z.enum(["open", "pending", "escalated", "resolved"]).optional().describe("Filter by ticket status"),
            priority: z.enum(["low", "medium", "high", "urgent"]).optional().describe("Filter by priority"),
            query: z.string().optional().describe("Search in subject and message"),
          }),
          execute: async ({ status, priority, query }) => {
            try {
              let results;
              if (query) {
                results = await sql`
                  SELECT t.ticket_number, t.subject, t.status, t.priority, t.channel,
                         t.sentiment, t.created_at, c.name as customer_name
                  FROM tickets t
                  LEFT JOIN customers c ON t.customer_id = c.id
                  WHERE (t.subject ILIKE ${`%${query}%`} OR t.message ILIKE ${`%${query}%`})
                  ORDER BY t.created_at DESC
                  LIMIT 10
                `;
              } else if (status) {
                results = await sql`
                  SELECT t.ticket_number, t.subject, t.status, t.priority, t.channel,
                         t.sentiment, t.created_at, c.name as customer_name
                  FROM tickets t
                  LEFT JOIN customers c ON t.customer_id = c.id
                  WHERE t.status = ${status}
                  ORDER BY t.created_at DESC
                  LIMIT 10
                `;
              } else if (priority) {
                results = await sql`
                  SELECT t.ticket_number, t.subject, t.status, t.priority, t.channel,
                         t.sentiment, t.created_at, c.name as customer_name
                  FROM tickets t
                  LEFT JOIN customers c ON t.customer_id = c.id
                  WHERE t.priority = ${priority}
                  ORDER BY t.created_at DESC
                  LIMIT 10
                `;
              } else {
                results = await sql`
                  SELECT t.ticket_number, t.subject, t.status, t.priority, t.channel,
                         t.sentiment, t.created_at, c.name as customer_name
                  FROM tickets t
                  LEFT JOIN customers c ON t.customer_id = c.id
                  ORDER BY t.created_at DESC
                  LIMIT 10
                `;
              }
              return {
                totalResults: results.length,
                tickets: results.map((t: Record<string, unknown>) => ({
                  ticketNumber: t.ticket_number,
                  subject: t.subject,
                  status: t.status,
                  priority: t.priority,
                  channel: t.channel,
                  sentiment: t.sentiment,
                  createdAt: t.created_at,
                  customerName: t.customer_name,
                })),
              };
            } catch {
              return { totalResults: 0, tickets: [], note: "Search failed" };
            }
          },
        }),
        getTicketMessages: tool({
          description: "Get the full conversation history of a specific ticket. Use this to understand what's been discussed.",
          inputSchema: z.object({
            ticketNumber: z.string().describe(`Ticket number like ${ticketPrefix}-1234`),
          }),
          execute: async ({ ticketNumber }) => {
            try {
              const ticket = await sql`SELECT id FROM tickets WHERE ticket_number = ${ticketNumber} LIMIT 1`;
              if (ticket.length === 0) return { found: false, note: "Ticket not found" };
              const messages = await sql`
                SELECT m.sender_type, m.content, m.channel, m.created_at, u.name as sender_name
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.id
                WHERE m.ticket_id = ${ticket[0].id}
                ORDER BY m.created_at ASC
                LIMIT 20
              `;
              return {
                ticketNumber,
                messageCount: messages.length,
                messages: messages.map((m: Record<string, unknown>) => ({
                  sender: m.sender_type === "customer" ? "Customer" : m.sender_name || "Agent",
                  content: m.content,
                  channel: m.channel,
                  timestamp: m.created_at,
                })),
              };
            } catch {
              return { found: false, note: "Failed to retrieve messages" };
            }
          },
        }),
        getCustomerTickets: tool({
          description: "Get all tickets for a specific customer. Use this to see a customer's full history.",
          inputSchema: z.object({
            email: z.string().optional().describe("Customer email"),
            name: z.string().optional().describe("Customer name"),
          }),
          execute: async ({ email, name }) => {
            try {
              let customer;
              if (email) {
                customer = await sql`SELECT id, name, email FROM customers WHERE email ILIKE ${`%${email}%`} LIMIT 1`;
              } else if (name) {
                customer = await sql`SELECT id, name, email FROM customers WHERE name ILIKE ${`%${name}%`} LIMIT 1`;
              } else {
                return { found: false, note: "Provide an email or name" };
              }
              if (customer.length === 0) return { found: false, note: "Customer not found" };
              const tickets = await sql`
                SELECT ticket_number, subject, status, priority, channel, sentiment, created_at
                FROM tickets WHERE customer_id = ${customer[0].id}
                ORDER BY created_at DESC LIMIT 15
              `;
              return {
                customer: { name: customer[0].name, email: customer[0].email },
                totalTickets: tickets.length,
                tickets: tickets.map((t: Record<string, unknown>) => ({
                  ticketNumber: t.ticket_number,
                  subject: t.subject,
                  status: t.status,
                  priority: t.priority,
                  sentiment: t.sentiment,
                  createdAt: t.created_at,
                })),
              };
            } catch {
              return { found: false, note: "Failed to retrieve tickets" };
            }
          },
        }),
        createTicket: tool({
          description: "Create a new support ticket for a customer issue. Use this when the customer needs formal support.",
          inputSchema: z.object({
            subject: z.string().describe("Brief subject line"),
            message: z.string().describe("Detailed description of the issue"),
            priority: z.enum(["low", "medium", "high", "urgent"]).describe("Ticket priority"),
            channel: z.string().describe("Channel the request came from (e.g., web-chat, whatsapp, email)"),
            customerEmail: z.string().optional().describe("Customer email if known"),
          }),
          execute: async ({ subject, message, priority, channel, customerEmail }) => {
            try {
              const count = await sql`SELECT nextval('ticket_seq') as num`;
              const ticketNumber = `${ticketPrefix}-${count[0].num}`;
              const slaDue = new Date(Date.now() + (priority === "urgent" ? 3600000 : priority === "high" ? 7200000 : 14400000));

              let customerId = null;
              if (customerEmail) {
                const cust = await sql`SELECT id FROM customers WHERE email ILIKE ${`%${customerEmail}%`} LIMIT 1`;
                if (cust.length > 0) customerId = cust[0].id;
              }

              await sql`
                INSERT INTO tickets (ticket_number, subject, message, status, priority, channel, customer_id, sla_status, sla_due, tags)
                VALUES (${ticketNumber}, ${subject}, ${message}, 'open', ${priority}, ${channel}, ${customerId}, 'ok', ${slaDue.toISOString()}, ARRAY['web-chat', 'ai-created'])
              `;
              return {
                created: true,
                ticketNumber,
                subject,
                priority,
                status: "open",
                slaDue: slaDue.toISOString(),
                message: `Ticket ${ticketNumber} has been created successfully. Our team will respond within ${priority === "urgent" ? "1 hour" : priority === "high" ? "2 hours" : "4 hours"}.`,
              };
            } catch (e) {
              return { created: false, note: "Failed to create ticket. Please try again or contact us directly." };
            }
          },
        }),
        getAnalytics: tool({
          description: "Get current support analytics and metrics. Use this to answer questions about support performance.",
          inputSchema: z.object({}),
          execute: async () => {
            try {
              const [total, open, pending, escalated, resolved, customers] = await Promise.all([
                sql`SELECT COUNT(*) as cnt FROM tickets`,
                sql`SELECT COUNT(*) as cnt FROM tickets WHERE status = 'open'`,
                sql`SELECT COUNT(*) as cnt FROM tickets WHERE status = 'pending'`,
                sql`SELECT COUNT(*) as cnt FROM tickets WHERE status = 'escalated'`,
                sql`SELECT COUNT(*) as cnt FROM tickets WHERE status = 'resolved'`,
                sql`SELECT COUNT(*) as cnt FROM customers`,
              ]);
              const totalNum = Number(total[0].cnt);
              const resolvedNum = Number(resolved[0].cnt);
              return {
                totalTickets: totalNum,
                openTickets: Number(open[0].cnt),
                pendingTickets: Number(pending[0].cnt),
                escalatedTickets: Number(escalated[0].cnt),
                resolvedTickets: resolvedNum,
                totalCustomers: Number(customers[0].cnt),
                resolutionRate: totalNum > 0 ? `${Math.round((resolvedNum / totalNum) * 100)}%` : "N/A",
              };
            } catch {
              return { note: "Analytics unavailable" };
            }
          },
        }),
        searchCustomers: tool({
          description: "Search customers by name or company. Use this when you need to find a specific customer.",
          inputSchema: z.object({
            query: z.string().describe("Name or company to search for"),
          }),
          execute: async ({ query }) => {
            try {
              const results = await sql`
                SELECT id, name, email, phone, company, segment, plan, total_tickets, status
                FROM customers
                WHERE name ILIKE ${`%${query}%`} OR company ILIKE ${`%${query}%`}
                ORDER BY total_tickets DESC
                LIMIT 10
              `;
              return {
                totalResults: results.length,
                customers: results.map((c: Record<string, unknown>) => ({
                  name: c.name,
                  email: c.email,
                  phone: c.phone,
                  company: c.company,
                  segment: c.segment,
                  plan: c.plan,
                  totalTickets: c.total_tickets,
                  status: c.status,
                })),
              };
            } catch {
              return { totalResults: 0, customers: [], note: "Search failed" };
            }
          },
        }),
      },
      stopWhen: stepCountIs(5),
    });
  } catch (error) {
    console.error("Chat AI error:", error);
    const fallback = getFallbackResponse(messages[messages.length - 1]?.content || "");
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(fallback));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" },
    });
  }

  return result.toTextStreamResponse();
}
