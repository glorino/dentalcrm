import { NextRequest, NextResponse } from "next/server";
import { sql, getSql } from "@/lib/db";
import { requireAuth } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const searchParams = request.nextUrl.searchParams;
    const channel = searchParams.get("channel");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    let tickets: any[];

    if (channel || status || priority || search) {
      let baseQuery = `
        SELECT 
          t.id, t.ticket_number, t.subject, t.message, t.status, t.priority,
          t.channel, t.ai_confidence, t.sla_status, t.sla_due, t.sentiment,
          t.sentiment_score, t.tags, t.created_at, t.updated_at,
          c.name as customer_name, c.email as customer_email, c.company as customer_company
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let idx = 1;

      if (channel) { baseQuery += ` AND LOWER(t.channel) = LOWER($${idx})`; params.push(channel); idx++; }
      if (status) { baseQuery += ` AND LOWER(t.status) = LOWER($${idx})`; params.push(status); idx++; }
      if (priority) { baseQuery += ` AND LOWER(t.priority) = LOWER($${idx})`; params.push(priority); idx++; }
      if (search) { baseQuery += ` AND (t.ticket_number ILIKE $${idx} OR t.subject ILIKE $${idx} OR c.name ILIKE $${idx})`; params.push(`%${search}%`); idx++; }

      baseQuery += ` ORDER BY t.created_at DESC`;

      tickets = await (getSql() as any).query(baseQuery, params);
    } else {
      tickets = await sql`
        SELECT 
          t.id, t.ticket_number, t.subject, t.message, t.status, t.priority,
          t.channel, t.ai_confidence, t.sla_status, t.sla_due, t.sentiment,
          t.sentiment_score, t.tags, t.created_at, t.updated_at,
          c.name as customer_name, c.email as customer_email, c.company as customer_company
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        ORDER BY t.created_at DESC
      `;
    }

    return NextResponse.json({
      tickets: tickets.map((t: Record<string, unknown>) => ({
        id: t.id,
        ticketNumber: t.ticket_number,
        subject: t.subject,
        message: t.message,
        status: t.status,
        priority: t.priority,
        channel: t.channel,
        aiConfidence: t.ai_confidence,
        slaStatus: t.sla_status,
        slaDue: t.sla_due,
        sentiment: t.sentiment,
        sentimentScore: t.sentiment_score,
        tags: t.tags,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        customerName: t.customer_name,
        customerEmail: t.customer_email,
        customerCompany: t.customer_company,
      })),
      total: tickets.length,
    });
  } catch (error: any) {
    console.error("Tickets API error:", error?.message || error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}
