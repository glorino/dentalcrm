import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const segment = searchParams.get("segment");

    let query = sql`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM tickets t WHERE t.customer_id = c.id) as ticket_count,
        (SELECT t.channel FROM tickets t WHERE t.customer_id = c.id ORDER BY t.created_at DESC LIMIT 1) as source_channel,
        (SELECT t.created_at FROM tickets t WHERE t.customer_id = c.id ORDER BY t.created_at ASC LIMIT 1) as first_ticket_date
      FROM customers c
      WHERE 1=1
    `;

    if (search) {
      query = sql`
        ${query}
        AND (
          c.name ILIKE ${`%${search}%`}
          OR c.email ILIKE ${`%${search}%`}
          OR c.company ILIKE ${`%${search}%`}
        )
      `;
    }

    if (segment) {
      query = sql`
        ${query}
        AND LOWER(c.segment) = LOWER(${segment})
      `;
    }

    query = sql`${query} ORDER BY c.created_at DESC`;

    const customers = await query;

    return NextResponse.json({
      customers: customers.map(c => ({
        id: c.id,
        email: c.email,
        name: c.name,
        company: c.company,
        segment: c.segment,
        plan: c.plan,
        ltv: Number(c.ltv) || 0,
        csat: Number(c.csat) || 0,
        totalTickets: Number(c.ticket_count) || 0,
        status: c.status,
        sourceChannel: c.source_channel,
        firstTicketDate: c.first_ticket_date,
        createdAt: c.created_at,
      })),
      total: customers.length,
    });
  } catch (error) {
    console.error("Customers API error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
