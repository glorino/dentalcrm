import { NextRequest, NextResponse } from "next/server";
import { broadcastTicketUpdate, broadcastInboxUpdate } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channel, event, data } = body;

    if (!channel || !event || !data) {
      return NextResponse.json({ error: "Missing channel, event, or data" }, { status: 400 });
    }

    if (channel === "tickets") {
      broadcastTicketUpdate(data.ticketId || "", data);
    } else if (channel === "inbox") {
      broadcastInboxUpdate(data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ error: "Failed to broadcast" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    channels: ["tickets", "inbox"],
    events: ["ticket-updated", "inbox-updated", "new-message"],
    status: "operational",
  });
}
