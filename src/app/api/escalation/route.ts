import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const escalatedTickets = await sql`
      SELECT 
        t.id,
        t.ticket_number,
        t.subject,
        t.status,
        t.priority,
        t.channel,
        t.sentiment,
        t.sentiment_score,
        t.sla_status,
        t.created_at,
        t.updated_at,
        c.name as customer_name,
        c.company as customer_company,
        u.name as assignee_name
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.status = 'escalated'
      ORDER BY 
        CASE t.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        t.created_at DESC
    `;

    const escalationStats = await sql`
      SELECT 
        COUNT(*) as total_escalated,
        SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN sla_status = 'breached' THEN 1 ELSE 0 END) as sla_breached
      FROM tickets
    `;

    return NextResponse.json({
      escalations: escalatedTickets.map(t => ({
        id: t.id,
        ticketNumber: t.ticket_number,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        channel: t.channel,
        sentiment: t.sentiment,
        sentimentScore: t.sentiment_score,
        slaStatus: t.sla_status,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        customerName: t.customer_name,
        customerCompany: t.customer_company,
        assigneeName: t.assignee_name,
      })),
      stats: {
        totalEscalated: escalationStats[0].total_escalated,
        pending: escalationStats[0].pending,
        slaBreached: escalationStats[0].sla_breached,
      },
      total: escalatedTickets.length,
    });
  } catch (error) {
    console.error("Escalation API error:", error);
    return NextResponse.json({ error: "Failed to fetch escalations" }, { status: 500 });
  }
}
