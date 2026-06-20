import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [ticketStats, customerStats, channelStats, sentimentStats, recentTickets] = await Promise.all([
      sql`SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'open')::int as open,
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
        COUNT(*) FILTER (WHERE status = 'escalated')::int as escalated,
        COUNT(*) FILTER (WHERE status = 'resolved')::int as resolved,
        COUNT(*) FILTER (WHERE status = 'closed')::int as closed
      FROM tickets`,
      sql`SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'active')::int as active,
        COALESCE(ROUND(AVG(csat)::numeric, 1), 0)::float as avg_csat,
        COALESCE(SUM(ltv), 0)::float as total_ltv
      FROM customers`,
      sql`SELECT channel, COUNT(*)::int as count FROM tickets GROUP BY channel ORDER BY count DESC`,
      sql`SELECT sentiment, COUNT(*)::int as count FROM tickets GROUP BY sentiment ORDER BY count DESC`,
      sql`SELECT t.ticket_number, t.subject, t.status, t.priority, t.channel, t.created_at,
        c.name as customer_name
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      ORDER BY t.created_at DESC LIMIT 10`,
    ]);

    const resolvedTotal = (ticketStats[0]?.resolved || 0) + (ticketStats[0]?.closed || 0);
    const totalTickets = ticketStats[0]?.total || 1;
    const autoResolutionRate = Math.round((resolvedTotal / totalTickets) * 100);

    return NextResponse.json({
      tickets: {
        total: ticketStats[0]?.total || 0,
        open: ticketStats[0]?.open || 0,
        pending: ticketStats[0]?.pending || 0,
        escalated: ticketStats[0]?.escalated || 0,
        resolved: resolvedTotal,
        autoResolutionRate,
      },
      customers: {
        total: customerStats[0]?.total || 0,
        active: customerStats[0]?.active || 0,
        avgCsat: customerStats[0]?.avg_csat || 0,
        totalLtv: customerStats[0]?.total_ltv || 0,
      },
      channels: channelStats,
      sentiment: sentimentStats,
      recentTickets,
    });
  } catch (err) {
    console.error("Public stats error:", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
