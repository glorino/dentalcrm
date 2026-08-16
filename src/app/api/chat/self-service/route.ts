import { NextRequest, NextResponse } from "next/server";
import { runSelfServicePipeline } from "@/lib/ai/self-service";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], patientIdentifier } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const conversationHistory = [
      ...history.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: message },
    ];

    const result = await runSelfServicePipeline({
      channel: "chat",
      patientIdentifier,
      conversationHistory,
    });

    // Log the conversation
    try {
      await sql`
        INSERT INTO ai_conversations (channel, messages, resolution_status, escalated)
        VALUES ('chat', ${JSON.stringify(conversationHistory)}, ${result.resolved ? "resolved" : result.escalated ? "escalated" : "pending"}, ${result.escalated})
      `;
    } catch (e) {
      console.error("Failed to log conversation:", e);
    }

    return NextResponse.json({
      response: result.response,
      resolved: result.resolved,
      escalated: result.escalated,
      appointmentScheduled: result.appointmentScheduled,
      ticketNumber: result.ticketNumber,
      appointmentNumber: result.appointmentNumber,
      patientFound: result.patientFound,
    });
  } catch (error: any) {
    console.error("Self-service error:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error.message },
      { status: 500 }
    );
  }
}
