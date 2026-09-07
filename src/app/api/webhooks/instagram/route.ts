import { NextRequest, NextResponse } from "next/server";
import { sendInstagramDM } from "@/lib/channels/instagram";
import { broadcastInboxUpdate } from "@/lib/events";
import { initDB, sql, generateTicketNumber } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const appSecret = process.env.FB_APP_SECRET;

    if (!appSecret) {
      console.error("FB_APP_SECRET not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 403 });
    }
    const expectedHash = "sha256=" + crypto.createHmac("sha256", appSecret).update(body).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHash))) {
      console.error("Invalid Instagram webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const payload = JSON.parse(body);

    if (payload.object === "instagram") {
      for (const entry of payload.entry || []) {
        for (const event of entry.messaging || []) {
          const senderId = event.sender?.id;
          const text = event.message?.text;

          if (senderId && text) {
            await processIncomingInstagram(senderId, text);
          }
        }
      }
      return NextResponse.json({ status: "ok" });
    }

    return NextResponse.json({ status: "ignored" });
  } catch (error) {
    console.error("Instagram webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.FB_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

async function processIncomingInstagram(senderId: string, text: string) {
  let ticketNumber = `DNT-${Date.now().toString().slice(-6)}`;

  try {
    await initDB();
  } catch {
    console.error("DB init warning for Instagram");
  }

  try {
    let customers = await sql`SELECT id FROM customers WHERE email = ${`instagram_${senderId}`}`;
    let customerId: string;

    if (customers.length === 0) {
      const result = await sql`
        INSERT INTO customers (email, name, company, segment, plan)
        VALUES (${`instagram_${senderId}`}, ${'Instagram User'}, 'Unknown', 'starter', 'starter')
        ON CONFLICT (email) DO UPDATE SET name = ${'Instagram User'}
        RETURNING id
      `;
      customerId = result[0].id;
    } else {
      customerId = customers[0].id;
    }

    ticketNumber = await generateTicketNumber();
    const slaDue = new Date(Date.now() + 14400000);

    await sql`
      INSERT INTO tickets (ticket_number, subject, message, status, priority, channel, customer_id, sla_status, sla_due, tags)
      VALUES (${ticketNumber}, ${text.substring(0, 100)}, ${text}, 'open', 'medium', 'instagram', ${customerId}, 'ok', ${slaDue.toISOString()}, ARRAY['instagram'])
    `;

    broadcastInboxUpdate({
      type: "new_message",
      channel: "instagram",
      from: senderId,
      message: text,
      ticketNumber,
    });
  } catch (e) {
    console.error("Instagram DB operations failed:", e);
  }
}
