import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const channels = await sql`
      SELECT channel, COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status IN ('resolved','closed'))::int as resolved,
        COUNT(*) FILTER (WHERE status = 'open')::int as open,
        COALESCE(ROUND(AVG(
          CASE WHEN resolved_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (resolved_at - created_at))
            ELSE NULL END
        )::numeric, 0), 0)::float as avg_resolution_seconds
      FROM tickets
      GROUP BY channel
      ORDER BY total DESC
    `;

    return NextResponse.json({ channels });
  } catch (err) {
    console.error("Channels stats error:", err);
    return NextResponse.json({ channels: [] }, { status: 500 });
  }
}
