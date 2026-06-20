import { NextRequest, NextResponse } from "next/server";
import { initDB, sql } from "@/lib/db";
import { sendSMS } from "@/lib/channels/sms";
import { broadcastInboxUpdate } from "@/lib/events";

const WHATSAPP_NUMBER = "+2347082529729";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const from = body.from || body.sender || body.phone || "";
    const text = body.text || body.message || body.body || "";
    const to = body.to || body.destination || "";

    if (!from || !text) {
      return NextResponse.json({ error: "Missing sender or message" }, { status: 400 });
    }

    const ticketNumber = await processIncomingSMS(from, text);

    broadcastInboxUpdate({
      type: "new_message",
      channel: "sms",
      from,
      message: text.substring(0, 200),
      ticketNumber,
    });

    const response = generateSMSResponse(text, ticketNumber);
    await sendSMS(from, response);

    return NextResponse.json({ status: "ok", ticketNumber });
  } catch (error) {
    console.error("SMS webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "ok", message: "SMS webhook is active" });
}

async function processIncomingSMS(from: string, text: string): Promise<string> {
  try {
    await initDB();
  } catch {
    console.error("DB not available for SMS processing");
    return `SSV-${Date.now().toString().slice(-6)}`;
  }

  try {
    let customers = await sql`SELECT id, name FROM customers WHERE phone = ${from} OR email = ${from}`;
    let customerId: string;

    if (customers.length === 0) {
      const result = await sql`
        INSERT INTO customers (email, name, company, segment, plan, phone)
        VALUES (${from}, ${"SMS User"}, "Unknown", "starter", "starter", ${from})
        RETURNING id
      `;
      customerId = result[0].id;
    } else {
      customerId = customers[0].id;
    }

    const count = await sql`SELECT COUNT(*) as cnt FROM tickets`;
    const num = Number(count[0].cnt) + 1235;
    const ticketNumber = `SSV-${num}`;
    const slaDue = new Date(Date.now() + 7200000);

    await sql`
      INSERT INTO tickets (ticket_number, subject, message, status, priority, channel, customer_id, sla_status, sla_due, tags)
      VALUES (${ticketNumber}, ${text.substring(0, 100)}, ${text}, 'open', 'medium', 'sms', ${customerId}, 'ok', ${slaDue.toISOString()}, ARRAY['sms'])
    `;

    const ticketResult = await sql`SELECT id FROM tickets WHERE ticket_number = ${ticketNumber}`;
    if (ticketResult.length > 0) {
      await sql`
        INSERT INTO messages (ticket_id, sender_type, sender_id, content, channel)
        VALUES (${ticketResult[0].id}, 'customer', ${customerId}, ${text}, 'sms')
      `;
    }

    return ticketNumber;
  } catch (error) {
    console.error("SMS processing error:", error);
    return `SSV-${Date.now().toString().slice(-6)}`;
  }
}

function generateSMSResponse(text: string, ticketNumber: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("password") || lower.includes("reset") || lower.includes("login")) {
    return `Hi! To reset your password, visit: supportflow-ai-six.vercel.app/forgot-password. Enter your email and follow the instructions. Ticket: ${ticketNumber}`;
  }

  if (lower.includes("billing") || lower.includes("invoice") || lower.includes("payment")) {
    return `Hi! For billing help, please email info@glopresc.com with your invoice number. Our team responds within 1 hour. Ticket: ${ticketNumber}`;
  }

  if (lower.includes("order") || lower.includes("delivery") || lower.includes("track")) {
    return `Hi! To track your order, please share your order number or email. We'll look it up right away. Ticket: ${ticketNumber}`;
  }

  if (lower.includes("human") || lower.includes("agent") || lower.includes("speak")) {
    return `Hi! A human agent will connect with you shortly. You can also reach us at info@glopresc.com or WhatsApp: ${WHATSAPP_NUMBER}. Ticket: ${ticketNumber}`;
  }

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return `Hello! Welcome to SSV Support. How can we help you today? Reply with your question. Ticket: ${ticketNumber}`;
  }

  return `Hi! Thanks for your message. We've created ticket ${ticketNumber} and our team will respond shortly. Need immediate help? Email info@glopresc.com or WhatsApp: ${WHATSAPP_NUMBER}`;
}
