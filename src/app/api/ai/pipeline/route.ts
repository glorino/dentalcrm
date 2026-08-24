import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import { runIntakePipeline, TicketContext } from "@/lib/ai/pipeline";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { ticketId, customerId, customerName, message, channel, history } = body;

    if (!ticketId || !customerId || !customerName || !message || !channel) {
      return NextResponse.json(
        { error: "Missing required fields: ticketId, customerId, customerName, message, channel" },
        { status: 400 }
      );
    }

    const context: TicketContext = {
      ticketId,
      customerId,
      customerName,
      message,
      channel,
      history: history ?? [],
    };

    const result = await runIntakePipeline(context);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Pipeline API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({
    pipeline: "intake",
    description: "AI-powered intake pipeline that classifies, analyzes, and resolves customer tickets",
    actions: [
      {
        name: "classification",
        description: "Classifies ticket intent, priority, and category using the intake agent",
      },
      {
        name: "sentiment",
        description: "Analyzes customer sentiment and detects emotions",
      },
      {
        name: "knowledge",
        description: "Retrieves relevant knowledge base articles for the issue",
      },
      {
        name: "resolution",
        description: "Generates a contextual response based on classification and knowledge",
      },
      {
        name: "qa",
        description: "Quality-checks the generated response for accuracy, tone, and compliance",
      },
      {
        name: "escalation",
        description: "Automatically escalates tickets with low confidence, urgent priority, or negative sentiment",
      },
    ],
  });
}
