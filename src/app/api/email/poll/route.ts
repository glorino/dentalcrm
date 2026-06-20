import { NextRequest, NextResponse } from "next/server";
import { processIncomingEmail } from "@/lib/channels/email";
import { broadcastInboxUpdate } from "@/lib/events";

export async function POST(req: NextRequest) {
  try {
    const imapHost = process.env.IMAP_HOST;
    const imapPort = parseInt(process.env.IMAP_PORT || "993");
    const email = process.env.SMTP_USER || process.env.EMAIL_ADDRESS;
    const password = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

    if (!imapHost || !email || !password) {
      return NextResponse.json({ error: "IMAP credentials not configured" }, { status: 500 });
    }

    const imap = require("imap-simple");

    const config = {
      imap: {
        user: email,
        password: password,
        host: imapHost,
        port: imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
      },
    };

    const connection = await imap.connect(config);
    await connection.openBox("INBOX");

    const searchCriteria = ["UNSEEN"];
    const fetchOptions = {
      bodies: ["HEADER", "TEXT"],
      markSeen: true,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    let processedCount = 0;

    for (const message of messages) {
      try {
        const all = message.parts.find((part: { which: string }) => part.which === "TEXT");
        const header = message.parts.find((part: { which: string }) => part.which === "HEADER");

        if (header && all) {
          const headerData = header.body;
          const from = headerData.from?.[0]?.address || headerData.from || "";
          const subject = headerData.subject || "No Subject";
          const body = all.body || "";

          if (from && !from.includes(email)) {
            const ticketNumber = await processIncomingEmail(from, subject, body);

            if (ticketNumber !== "error") {
              broadcastInboxUpdate({
                type: "new_message",
                channel: "email",
                from,
                message: body.substring(0, 200),
                ticketNumber,
              });
              processedCount++;
            }
          }
        }
      } catch (e) {
        console.error("Error processing email message:", e);
      }
    }

    connection.end();

    return NextResponse.json({ status: "ok", processed: processedCount });
  } catch (error) {
    console.error("Email poll error:", error);
    return NextResponse.json({ error: "Email polling failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "ok", message: "Email polling endpoint is active" });
}
