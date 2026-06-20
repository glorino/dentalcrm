import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketNumber = `SSV-${params.id}`;

    const tickets = await sql`
      SELECT 
        t.*,
        c.name as customer_name,
        c.email as customer_email,
        c.company as customer_company,
        c.segment as customer_segment,
        c.csat as customer_csat,
        c.total_tickets as customer_total_tickets,
        u.name as assignee_name,
        u.email as assignee_email
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.ticket_number = ${ticketNumber}
    `;

    if (tickets.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticket = tickets[0];

    const messages = await sql`
      SELECT 
        m.*,
        CASE 
          WHEN m.sender_type = 'customer' THEN c.name
          WHEN m.sender_type = 'agent' THEN u.name
          ELSE 'AI Agent'
        END as sender_name
      FROM messages m
      LEFT JOIN customers c ON m.sender_id = c.id AND m.sender_type = 'customer'
      LEFT JOIN users u ON m.sender_id = u.id AND m.sender_type = 'agent'
      WHERE m.ticket_id = ${ticket.id}
      ORDER BY m.created_at ASC
    `;

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status,
        priority: ticket.priority,
        channel: ticket.channel,
        sentiment: ticket.sentiment,
        sentimentScore: ticket.sentiment_score,
        aiConfidence: ticket.ai_confidence,
        slaStatus: ticket.sla_status,
        slaDue: ticket.sla_due,
        tags: ticket.tags,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        customer: {
          name: ticket.customer_name,
          email: ticket.customer_email,
          company: ticket.customer_company,
          segment: ticket.customer_segment,
          csat: ticket.customer_csat,
          totalTickets: ticket.customer_total_tickets,
        },
        assignee: {
          name: ticket.assignee_name,
          email: ticket.assignee_email,
        },
      },
      messages: messages.map(m => ({
        id: m.id,
        senderType: m.sender_type,
        senderName: m.sender_name || "Unknown",
        content: m.content,
        channel: m.channel,
        metadata: m.metadata,
        createdAt: m.created_at,
      })),
    });
  } catch (error) {
    console.error("Ticket detail API error:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}
