import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getIndustryFromEnv, getIndustry } from "@/lib/industry/config";

export async function POST(req: Request) {
  const { message, history = [] } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json({
      reply: "I'm sorry, the AI service is not configured yet. Please contact our support team directly.",
    });
  }

  const slug = getIndustryFromEnv();
  const config = getIndustry(slug);

  const voiceSystemPrompt = `You are a voice assistant for ${config.name}, a ${config.description}.

CRITICAL VOICE RULES:
- Keep responses SHORT: 1-3 sentences max for simple questions, up to 5 sentences for complex ones
- NEVER use markdown, bullet points, or formatting — this is voice, not text
- Speak naturally like a real person having a conversation
- Use conversational transitions: "Well," "So," "Actually," "Let me check that for you"
- Be warm, friendly, and professional — like a helpful receptionist
- If you need to list things, say them naturally: "First... Second... Third..."
- Never say "asterisk" or "dash" or read out any formatting
- For complex information, summarize briefly and offer to help further
- Always end with something helpful or a question to keep the conversation going

AVAILABLE TOOLS:
- searchKnowledgeBase: Find articles about dental topics
- lookupCustomer: Look up patient by email or name
- createTicket: Create a support ticket
- lookupTicket: Check ticket status by number

INDUSTRY CONTEXT:
- Company: ${config.name}
- Contact: ${config.contact.email}
- All currency is in Naira (₦)

Be concise. Be helpful. Be human.`;

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: voiceSystemPrompt,
      messages: [
        ...history.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: message },
      ],
      tools: {
        searchKnowledgeBase: tool({
          description: "Search the knowledge base for dental articles",
          inputSchema: z.object({
            query: z.string().describe("Search query"),
          }),
          execute: async ({ query }) => {
            try {
              const results = await sql`
                SELECT id, title, content
                FROM knowledge_articles
                WHERE status = 'published'
                  AND (title ILIKE ${`%${query}%`} OR content ILIKE ${`%${query}%`} OR ${query} = ANY(tags))
                ORDER BY views DESC LIMIT 3
              `;
              return {
                results: results.map((r: Record<string, unknown>) => ({
                  title: r.title,
                  content: String(r.content).slice(0, 200),
                })),
              };
            } catch {
              return { results: [] };
            }
          },
        }),
        lookupCustomer: tool({
          description: "Look up a patient by email or name",
          inputSchema: z.object({
            email: z.string().optional().describe("Patient email"),
            name: z.string().optional().describe("Patient name"),
          }),
          execute: async ({ email, name }) => {
            try {
              let customers;
              if (email) {
                customers = await sql`SELECT id, name, email, phone, plan, total_tickets FROM customers WHERE email ILIKE ${`%${email}%`} LIMIT 1`;
              } else if (name) {
                customers = await sql`SELECT id, name, email, phone, plan, total_tickets FROM customers WHERE name ILIKE ${`%${name}%`} LIMIT 1`;
              } else {
                return { found: false };
              }
              if (customers.length === 0) return { found: false };
              const c = customers[0];
              return {
                found: true,
                name: c.name,
                email: c.email,
                phone: c.phone,
                plan: c.plan,
                totalTickets: c.total_tickets,
              };
            } catch {
              return { found: false };
            }
          },
        }),
        createTicket: tool({
          description: "Create a support ticket",
          inputSchema: z.object({
            subject: z.string().describe("Ticket subject"),
            message: z.string().describe("Ticket description"),
            priority: z.enum(["low", "medium", "high", "urgent"]).describe("Priority"),
            customerEmail: z.string().optional().describe("Customer email"),
          }),
          execute: async ({ subject, message, priority, customerEmail }) => {
            try {
              const count = await sql`SELECT nextval('ticket_seq') as num`;
              const ticketNumber = `DNT-${count[0].num}`;
              const slaDue = new Date(Date.now() + (priority === "urgent" ? 3600000 : priority === "high" ? 7200000 : 14400000));
              let customerId = null;
              if (customerEmail) {
                const cust = await sql`SELECT id FROM customers WHERE email ILIKE ${`%${customerEmail}%`} LIMIT 1`;
                if (cust.length > 0) customerId = cust[0].id;
              }
              await sql`
                INSERT INTO tickets (ticket_number, subject, message, status, priority, channel, customer_id, sla_status, sla_due, tags)
                VALUES (${ticketNumber}, ${subject}, ${message}, 'open', ${priority}, 'voice', ${customerId}, 'ok', ${slaDue.toISOString()}, ARRAY['voice-agent'])
              `;
              return { created: true, ticketNumber };
            } catch {
              return { created: false };
            }
          },
        }),
        lookupTicket: tool({
          description: "Look up a ticket by number",
          inputSchema: z.object({
            ticketNumber: z.string().describe("Ticket number like DNT-1234"),
          }),
          execute: async ({ ticketNumber }) => {
            try {
              const tickets = await sql`
                SELECT t.ticket_number, t.subject, t.status, t.priority, t.sla_status, c.name as customer_name
                FROM tickets t LEFT JOIN customers c ON t.customer_id = c.id
                WHERE t.ticket_number ILIKE ${`%${ticketNumber}%`} LIMIT 1
              `;
              if (tickets.length === 0) return { found: false };
              const t = tickets[0];
              return {
                found: true,
                ticketNumber: t.ticket_number,
                subject: t.subject,
                status: t.status,
                priority: t.priority,
                slaStatus: t.sla_status,
                customerName: t.customer_name,
              };
            } catch {
              return { found: false };
            }
          },
        }),
      },
    });

    return Response.json({ reply: text });
  } catch (error) {
    console.error("Voice API error:", error);
    return Response.json({
      reply: "I'm sorry, I encountered an issue. Could you please repeat that?",
    });
  }
}
