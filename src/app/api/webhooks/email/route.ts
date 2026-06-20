import { NextRequest, NextResponse } from "next/server";
import { processIncomingEmail, sendEmail } from "@/lib/channels/email";
import { broadcastInboxUpdate } from "@/lib/events";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const from = body.from || body.sender || "";
    const subject = body.subject || "No Subject";
    const text = body.text || body.body || body.content || "";
    const html = body.html || "";

    if (!from) {
      return NextResponse.json({ error: "Missing sender" }, { status: 400 });
    }

    const ticketNumber = await processIncomingEmail(from, subject, text || html);

    if (ticketNumber !== "error") {
      broadcastInboxUpdate({
        type: "new_message",
        channel: "email",
        from,
        message: text.substring(0, 200),
        ticketNumber,
      });
    }

    return NextResponse.json({ status: "ok", ticketNumber });
  } catch (error) {
    console.error("Email webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "ok", message: "Email webhook is active" });
}
