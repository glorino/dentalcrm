import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const users = await sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.team,
        u.avatar_url,
        u.status,
        u.created_at,
        (SELECT COUNT(*) FROM tickets t WHERE t.assignee_id = u.id AND t.status IN ('open', 'pending')) as active_tickets,
        (SELECT COUNT(*) FROM tickets t WHERE t.assignee_id = u.id AND t.status = 'resolved') as resolved_tickets
      FROM users u
      WHERE u.status != 'deleted'
      ORDER BY u.name ASC
    `;

    const teamStats = await sql`
      SELECT 
        u.team,
        COUNT(*) as member_count,
        (SELECT COUNT(*) FROM tickets t 
         JOIN users u2 ON t.assignee_id = u2.id 
         WHERE u2.team = u.team AND t.status IN ('open', 'pending')) as open_tickets
      FROM users u
      WHERE u.team IS NOT NULL AND u.status != 'deleted'
      GROUP BY u.team
      ORDER BY member_count DESC
    `;

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        team: u.team,
        avatarUrl: u.avatar_url,
        status: u.status,
        activeTickets: u.active_tickets,
        resolvedTickets: u.resolved_tickets,
        createdAt: u.created_at,
      })),
      teams: teamStats.map(t => ({
        name: t.team,
        memberCount: t.member_count,
        openTickets: t.open_tickets,
      })),
      total: users.length,
    });
  } catch (error) {
    console.error("Teams API error:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}
