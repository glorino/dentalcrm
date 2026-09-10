import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const [stats, channelCounts, sentimentCounts, avgConfidence, avgCsat, recentTickets, slaBreached] = await Promise.all([
      sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'open') as open,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'escalated') as escalated,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved
        FROM tickets
      `,
      sql`
        SELECT channel, COUNT(*) as count 
        FROM tickets 
        GROUP BY channel 
        ORDER BY count DESC
      `,
      sql`
        SELECT sentiment, COUNT(*) as count 
        FROM tickets 
        GROUP BY sentiment
      `,
      sql`SELECT AVG(ai_confidence) as avg FROM tickets`,
      sql`SELECT AVG(csat) as avg FROM customers WHERE csat > 0`,
      sql`
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
      `,
      sql`SELECT COUNT(*) as count FROM tickets WHERE sla_status = 'breached'`,
    ]);

    const ticketStats = stats[0];
    const totalCustomers = await sql`SELECT COUNT(*) as count FROM customers`;
    const totalUsers = await sql`SELECT COUNT(*) as count FROM users`;

    return NextResponse.json({
      stats: {
        totalTickets: Number(ticketStats.total),
        openTickets: Number(ticketStats.open),
        pendingTickets: Number(ticketStats.pending),
        escalatedTickets: Number(ticketStats.escalated),
        resolvedTickets: Number(ticketStats.resolved),
        totalCustomers: Number(totalCustomers[0].count),
        totalUsers: Number(totalUsers[0].count),
        slaBreached: Number(slaBreached[0].count),
      },
      channelCounts: channelCounts.map((c: any) => ({
        channel: c.channel,
        count: Number(c.count),
      })),
      sentimentCounts: sentimentCounts.map((s: any) => ({
        sentiment: s.sentiment,
        count: Number(s.count),
      })),
      avgConfidence: Number(avgConfidence[0].avg) || 0,
      avgCsat: Number(avgCsat[0].avg) || 0,
      recentTickets: recentTickets.map((t: any) => ({
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
