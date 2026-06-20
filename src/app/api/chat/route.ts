import { openai } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { sql } from "@/lib/db";

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

export async function POST(req: Request) {
  const { messages } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const lastMessage = messages[messages.length - 1]?.content || "";
    const lowerMsg = lastMessage.toLowerCase();

    let response = "";

    if (fuzzyMatch(lowerMsg, ["password", "reset", "login", "forgot", "locked"])) {
      response = "To reset your password:\n\n1. Go to supportflow-ai-six.vercel.app/forgot-password\n2. Enter your email address\n3. Check your email for the reset link\n4. Click the link and create a new password\n\nIf you still can't access your account, please email us at info@glopresc.com and we'll help you right away.";
    } else if (fuzzyMatch(lowerMsg, ["order", "status", "delivery", "shipping", "track"])) {
      response = "I'd be happy to check your order status! To look up your order, I'll need your ticket number or email address. Could you please provide one of those?";
    } else if (fuzzyMatch(lowerMsg, ["human", "agent", "talk to", "speak", "person"])) {
      response = "I understand you'd like to speak with a human agent. I'm connecting you now. In the meantime, you can also reach us directly:\n\n📧 Email: info@glopresc.com\n📱 WhatsApp: +2347082529729\n\nOur team typically responds within 2 minutes during business hours.";
    } else if (fuzzyMatch(lowerMsg, ["billing", "invoice", "payment", "charge", "refund"])) {
      response = "For billing questions, I can help! Here's what I need to know:\n\n• Do you have your invoice number or account email?\n• What specific billing issue are you experiencing?\n\nCommon billing topics:\n- Invoice discrepancies\n- Payment method updates\n- Subscription changes\n- Refund requests\n\nPlease share the details and I'll look into it for you.";
    } else if (fuzzyMatch(lowerMsg, ["hello", "hi", "hey", "good morning", "good afternoon"])) {
      response = "Hello! Welcome to SSV Support. I'm here to help you with any questions about our platform.\n\nI can assist with:\n• Account and billing questions\n• Technical support\n• Feature inquiries\n• Ticket creation\n\nHow can I help you today?";
    } else {
      response = "Thank you for reaching out! I'm here to help.\n\nI can assist you with:\n• Account and password issues\n• Billing and invoice questions\n• Technical support\n• Creating support tickets\n\nCould you tell me more about what you need help with? For immediate assistance, you can also reach us at:\n\n📧 info@glopresc.com\n📱 WhatsApp: +2347082529729";
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(response));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  }

  const result = streamText({
    model: openai("gpt-4o"),
    system: `You are SSV AI, the intelligent customer support assistant for SSV CRM.

Your role is to help customers resolve their issues quickly and accurately.

Guidelines:
- Be professional, empathetic, and helpful
- Use the customer's name when available
- Provide clear, actionable solutions
- If you can't resolve the issue, explain why and offer alternatives
- Keep responses concise but thorough
- You work for a company called SSV
- All currency is in Naira (₦)
- Contact email: info@glopresc.com
- WhatsApp: +2347082529729

You have access to tools to:
- Search the knowledge base for relevant articles
- Look up customer information by email
- Look up tickets by ticket number
- Create new support tickets
- Provide analytics insights

Always verify facts before providing solutions. If uncertain, escalate to a human agent.`,
    messages,
    tools: {
      searchKnowledgeBase: tool({
        description: "Search the knowledge base for relevant support articles",
        inputSchema: z.object({
          query: z.string().describe("Search query to find relevant articles"),
        }),
        execute: async ({ query }) => {
          try {
            const results = await sql`
              SELECT id, title, content, collection, views, ai_used
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
                excerpt: String(r.content).substring(0, 200),
                collection: r.collection,
                views: r.views,
              })),
              totalResults: results.length,
            };
          } catch {
            return { results: [], totalResults: 0, note: "Knowledge base not yet populated" };
          }
        },
      }),
      lookupCustomer: tool({
        description: "Look up a customer by email address to get their account info",
        inputSchema: z.object({
          email: z.string().describe("Customer email address"),
        }),
        execute: async ({ email }) => {
          try {
            const customers = await sql`
              SELECT id, name, email, company, segment, plan, ltv, csat, total_tickets, status
              FROM customers WHERE email = ${email}
              LIMIT 1
            `;
            if (customers.length === 0) {
              return { found: false, email, note: "No customer found with this email" };
            }
            const c = customers[0];
            return {
              found: true,
              id: c.id,
              name: c.name,
              email: c.email,
              company: c.company,
              segment: c.segment,
              plan: c.plan,
              lifetimeValue: `₦${Number(c.ltv).toLocaleString()}`,
              csat: c.csat,
              totalTickets: c.total_tickets,
              status: c.status,
            };
          } catch {
            return { found: false, email, note: "Database unavailable" };
          }
        },
      }),
      lookupTicket: tool({
        description: "Look up a ticket by its ticket number (e.g. SSV-1234)",
        inputSchema: z.object({
          ticketNumber: z.string().describe("Ticket number like SSV-1234"),
        }),
        execute: async ({ ticketNumber }) => {
          try {
            const tickets = await sql`
              SELECT t.id, t.ticket_number, t.subject, t.message, t.status, t.priority,
                     t.channel, t.sentiment, t.ai_confidence, t.sla_status, t.tags,
                     c.name as customer_name, c.email as customer_email
              FROM tickets t
              LEFT JOIN customers c ON t.customer_id = c.id
              WHERE t.ticket_number = ${ticketNumber}
              LIMIT 1
            `;
            if (tickets.length === 0) {
              return { found: false, ticketNumber, note: "Ticket not found" };
            }
            const t = tickets[0];
            return {
              found: true,
              ticketNumber: t.ticket_number,
              subject: t.subject,
              status: t.status,
              priority: t.priority,
              channel: t.channel,
              sentiment: t.sentiment,
              aiConfidence: t.ai_confidence,
              slaStatus: t.sla_status,
              tags: t.tags,
              customerName: t.customer_name,
              customerEmail: t.customer_email,
            };
          } catch {
            return { found: false, ticketNumber, note: "Database unavailable" };
          }
        },
      }),
      createTicket: tool({
        description: "Create a new support ticket for a customer issue",
        inputSchema: z.object({
          subject: z.string().describe("Brief subject line"),
          message: z.string().describe("Detailed description of the issue"),
          priority: z.enum(["low", "medium", "high", "urgent"]).describe("Ticket priority"),
          channel: z.string().describe("Channel the request came from"),
        }),
        execute: async ({ subject, message, priority, channel }) => {
          try {
            const count = await sql`SELECT COUNT(*) as cnt FROM tickets`;
            const num = Number(count[0].cnt) + 1235;
            const ticketNumber = `SSV-${num}`;
            const slaDue = new Date(Date.now() + (priority === "urgent" ? 3600000 : priority === "high" ? 7200000 : 14400000));
            await sql`
              INSERT INTO tickets (ticket_number, subject, message, status, priority, channel, sla_status, sla_due, tags)
              VALUES (${ticketNumber}, ${subject}, ${message}, 'open', ${priority}, ${channel}, 'ok', ${slaDue.toISOString()}, ARRAY['web-chat'])
            `;
            return {
              created: true,
              ticketNumber,
              subject,
              priority,
              status: "open",
              message: `Ticket ${ticketNumber} has been created. Our team will respond shortly.`,
            };
          } catch {
            return { created: false, note: "Failed to create ticket. Please try again." };
          }
        },
      }),
      getAnalytics: tool({
        description: "Get current support analytics and metrics",
        inputSchema: z.object({}),
        execute: async () => {
          try {
            const [ticketCount, openCount, resolvedCount] = await Promise.all([
              sql`SELECT COUNT(*) as cnt FROM tickets`,
              sql`SELECT COUNT(*) as cnt FROM tickets WHERE status IN ('open', 'pending')`,
              sql`SELECT COUNT(*) as cnt FROM tickets WHERE status = 'resolved'`,
            ]);
            return {
              totalTickets: Number(ticketCount[0].cnt),
              openTickets: Number(openCount[0].cnt),
              resolvedTickets: Number(resolvedCount[0].cnt),
              resolutionRate: ticketCount[0].cnt > 0
                ? `${Math.round((Number(resolvedCount[0].cnt) / Number(ticketCount[0].cnt)) * 100)}%`
                : "N/A",
            };
          } catch {
            return { note: "Analytics unavailable" };
          }
        },
      }),
    },
    stopWhen: stepCountIs(5),
  });

  return result.toTextStreamResponse();
}
