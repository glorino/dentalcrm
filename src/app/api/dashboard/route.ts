import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const totalTickets = await sql`SELECT COUNT(*) as count FROM tickets`;
    const openTickets = await sql`SELECT COUNT(*) as count FROM tickets WHERE status = 'open'`;
    const pendingTickets = await sql`SELECT COUNT(*) as count FROM tickets WHERE status = 'pending'`;
    const escalatedTickets = await sql`SELECT COUNT(*) as count FROM tickets WHERE status = 'escalated'`;
    const resolvedTickets = await sql`SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'`;
    const totalCustomers = await sql`SELECT COUNT(*) as count FROM customers`;
    const totalUsers = await sql`SELECT COUNT(*) as count FROM users`;

    const channelCounts = await sql`
      SELECT channel, COUNT(*) as count 
      FROM tickets 
      GROUP BY channel 
      ORDER BY count DESC
    `;

    const sentimentCounts = await sql`
      SELECT sentiment, COUNT(*) as count 
      FROM tickets 
      GROUP BY sentiment
    `;

    const avgConfidence = await sql`SELECT AVG(ai_confidence) as avg FROM tickets`;
    const avgCsat = await sql`SELECT AVG(csat) as avg FROM customers WHERE csat > 0`;

    const recentTickets = await sql`
      SELECT 
        t.ticket_number,
        t.subject,
        t.status,
        t.priority,
        t.channel,
        t.ai_confidence,
        t.sla_status,
        t.sla_due,
        t.sentiment,
        t.created_at,
        c.name as customer_name
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `;

    const slaBreached = await sql`
      SELECT COUNT(*) as count 
      FROM tickets 
      WHERE sla_status = 'breached'
    `;

    return NextResponse.json({
      stats: {
        totalTickets: Number(totalTickets[0].count),
        openTickets: Number(openTickets[0].count),
        pendingTickets: Number(pendingTickets[0].count),
        escalatedTickets: Number(escalatedTickets[0].count),
        resolvedTickets: Number(resolvedTickets[0].count),
        totalCustomers: Number(totalCustomers[0].count),
        totalUsers: Number(totalUsers[0].count),
        slaBreached: Number(slaBreached[0].count),
      },
      channelCounts: channelCounts.map(c => ({
        channel: c.channel,
        count: Number(c.count),
      })),
      sentimentCounts: sentimentCounts.map(s => ({
        sentiment: s.sentiment,
        count: Number(s.count),
      })),
      avgConfidence: Number(avgConfidence[0].avg) || 0,
      avgCsat: Number(avgCsat[0].avg) || 0,
      recentTickets: recentTickets.map(t => ({
        ticketNumber: t.ticket_number,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        channel: t.channel,
        aiConfidence: Number(t.ai_confidence),
        slaStatus: t.sla_status,
        slaDue: t.sla_due,
        sentiment: t.sentiment,
        createdAt: t.created_at,
        customerName: t.customer_name,
      })),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
