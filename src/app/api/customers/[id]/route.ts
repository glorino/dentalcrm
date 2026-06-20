import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const customers = await sql`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM tickets t WHERE t.customer_id = c.id) as ticket_count,
        (SELECT t.channel FROM tickets t WHERE t.customer_id = c.id ORDER BY t.created_at DESC LIMIT 1) as source_channel,
        (SELECT t.created_at FROM tickets t WHERE t.customer_id = c.id ORDER BY t.created_at ASC LIMIT 1) as first_ticket_date
      FROM customers c
      WHERE c.id = ${id}
    `;

    if (customers.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customer = customers[0];

    const recentTickets = await sql`
      SELECT 
        t.ticket_number,
        t.subject,
        t.status,
        t.priority,
        t.channel,
        t.created_at
      FROM tickets t
      WHERE t.customer_id = ${id}
      ORDER BY t.created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        company: customer.company,
        segment: customer.segment,
        plan: customer.plan,
        ltv: Number(customer.ltv) || 0,
        csat: Number(customer.csat) || 0,
        totalTickets: Number(customer.ticket_count) || 0,
        status: customer.status,
        sourceChannel: customer.source_channel,
        firstTicketDate: customer.first_ticket_date,
        createdAt: customer.created_at,
      },
      recentTickets: recentTickets.map(t => ({
        ticketNumber: t.ticket_number,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        channel: t.channel,
        createdAt: t.created_at,
      })),
    });
  } catch (error) {
    console.error("Customer detail API error:", error);
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}
