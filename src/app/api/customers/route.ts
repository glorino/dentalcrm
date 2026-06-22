import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const segment = searchParams.get("segment");

    const conditions: string[] = ["1=1"];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(
        c.name ILIKE $${paramIndex}
        OR c.email ILIKE $${paramIndex}
        OR c.company ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (segment) {
      conditions.push(`LOWER(c.segment) = LOWER($${paramIndex})`);
      values.push(segment);
      paramIndex++;
    }

    const query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM tickets t WHERE t.customer_id = c.id) as ticket_count,
        (SELECT t.channel FROM tickets t WHERE t.customer_id = c.id ORDER BY t.created_at DESC LIMIT 1) as source_channel,
        (SELECT t.created_at FROM tickets t WHERE t.customer_id = c.id ORDER BY t.created_at ASC LIMIT 1) as first_ticket_date
      FROM customers c
      WHERE ${conditions.join(" AND ")}
      ORDER BY c.created_at DESC
    `;

    const sql = getSql();
    const customers = await sql(query, values);

    return NextResponse.json({
      customers: customers.map((c: Record<string, unknown>) => ({
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
