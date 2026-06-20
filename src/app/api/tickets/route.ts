import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const channel = searchParams.get("channel");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    let query = sql`
      SELECT 
        t.id,
        t.ticket_number,
        t.subject,
        t.message,
        t.status,
        t.priority,
        t.channel,
        t.ai_confidence,
        t.sla_status,
        t.sla_due,
        t.sentiment,
        t.sentiment_score,
        t.tags,
        t.created_at,
        t.updated_at,
        c.name as customer_name,
        c.email as customer_email,
        c.company as customer_company
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE 1=1
    `;

    if (channel) {
      query = sql`
        SELECT 
          t.id,
          t.ticket_number,
          t.subject,
          t.message,
          t.status,
          t.priority,
          t.channel,
          t.ai_confidence,
          t.sla_status,
          t.sla_due,
          t.sentiment,
          t.sentiment_score,
          t.tags,
          t.created_at,
          t.updated_at,
          c.name as customer_name,
          c.email as customer_email,
          c.company as customer_company
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        WHERE LOWER(t.channel) = LOWER(${channel})
      `;
    }

    if (status) {
      query = sql`
        ${query}
        AND LOWER(t.status) = LOWER(${status})
      `;
    }

    if (priority) {
      query = sql`
        ${query}
        AND LOWER(t.priority) = LOWER(${priority})
      `;
    }

    if (search) {
      query = sql`
        ${query}
        AND (
          t.ticket_number ILIKE ${`%${search}%`}
          OR t.subject ILIKE ${`%${search}%`}
          OR c.name ILIKE ${`%${search}%`}
        )
      `;
    }

    query = sql`${query} ORDER BY t.created_at DESC`;

    const tickets = await query;

    return NextResponse.json({
      tickets: tickets.map(t => ({
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
  } catch (error) {
    console.error("Tickets API error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}
