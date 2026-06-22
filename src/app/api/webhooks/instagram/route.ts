import { NextRequest, NextResponse } from "next/server";
import { sendInstagramDM } from "@/lib/channels/instagram";
import { broadcastInboxUpdate } from "@/lib/events";
import { initDB, sql, generateTicketNumber } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object === "instagram") {
      for (const entry of body.entry || []) {
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
  await initDB();

  let customers = await sql`SELECT id FROM customers WHERE email = ${`instagram_${senderId}`}`;
  let customerId: string;

  if (customers.length === 0) {
    const result = await sql`
      INSERT INTO customers (email, name, company, segment, plan)
      VALUES (${`instagram_${senderId}`}, ${'Instagram User'}, 'Unknown', 'starter', 'starter')
      RETURNING id
    `;
    customerId = result[0].id;
  } else {
    customerId = customers[0].id;
  }

  const ticketNumber = await generateTicketNumber();
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
}
