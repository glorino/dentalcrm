import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel") || "all";
    const search = searchParams.get("search") || "";

    let conversations;

    if (channel !== "all" && search) {
      conversations = await sql`
        SELECT 
          t.id,
          t.ticket_number,
          t.subject,
          t.message,
          t.status,
          t.priority,
          t.channel,
          t.sentiment,
          t.sentiment_score,
          t.ai_confidence,
          t.tags,
          t.sla_status,
          t.created_at,
          t.updated_at,
          COALESCE(c.name, 'Unknown') as customer_name,
          c.email as customer_email,
          c.company as customer_company,
          COALESCE(
            (SELECT content FROM messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1),
            t.message
          ) as last_message
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        WHERE t.channel = ${channel}
          AND (t.subject ILIKE ${`%${search}%`} OR t.ticket_number ILIKE ${`%${search}%`} OR c.name ILIKE ${`%${search}%`} OR c.email ILIKE ${`%${search}%`})
        ORDER BY t.updated_at DESC
      `;
    } else if (channel !== "all") {
      conversations = await sql`
        SELECT 
          t.id,
          t.ticket_number,
          t.subject,
          t.message,
          t.status,
          t.priority,
          t.channel,
          t.sentiment,
          t.sentiment_score,
          t.ai_confidence,
          t.tags,
          t.sla_status,
          t.created_at,
          t.updated_at,
          COALESCE(c.name, 'Unknown') as customer_name,
          c.email as customer_email,
          c.company as customer_company,
          COALESCE(
            (SELECT content FROM messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1),
            t.message
          ) as last_message
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        WHERE t.channel = ${channel}
        ORDER BY t.updated_at DESC
      `;
    } else if (search) {
      conversations = await sql`
        SELECT 
          t.id,
          t.ticket_number,
          t.subject,
          t.message,
          t.status,
          t.priority,
          t.channel,
          t.sentiment,
          t.sentiment_score,
          t.ai_confidence,
          t.tags,
          t.sla_status,
          t.created_at,
          t.updated_at,
          COALESCE(c.name, 'Unknown') as customer_name,
          c.email as customer_email,
          c.company as customer_company,
          COALESCE(
            (SELECT content FROM messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1),
            t.message
          ) as last_message
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        WHERE (t.subject ILIKE ${`%${search}%`} OR t.ticket_number ILIKE ${`%${search}%`} OR c.name ILIKE ${`%${search}%`} OR c.email ILIKE ${`%${search}%`})
        ORDER BY t.updated_at DESC
      `;
    } else {
      conversations = await sql`
        SELECT 
          t.id,
          t.ticket_number,
          t.subject,
          t.message,
          t.status,
          t.priority,
          t.channel,
          t.sentiment,
          t.sentiment_score,
          t.ai_confidence,
          t.tags,
          t.sla_status,
          t.created_at,
          t.updated_at,
          COALESCE(c.name, 'Unknown') as customer_name,
          c.email as customer_email,
          c.company as customer_company,
          COALESCE(
            (SELECT content FROM messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1),
            t.message
          ) as last_message
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        ORDER BY t.updated_at DESC
      `;
    }

    const channelCounts = await sql`
      SELECT channel, COUNT(*) as count
      FROM tickets
      GROUP BY channel
      ORDER BY count DESC
    `;

    return NextResponse.json({
      conversations: conversations.map((row: Record<string, unknown>) => ({
        id: row.id,
        ticketNumber: row.ticket_number,
        subject: row.subject,
        lastMessage: row.last_message,
        status: row.status,
        priority: row.priority,
        channel: row.channel,
        sentiment: row.sentiment,
        sentimentScore: row.sentiment_score,
        aiConfidence: row.ai_confidence,
        tags: row.tags,
        slaStatus: row.sla_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerCompany: row.customer_company,
      })),
      channelCounts: channelCounts.map((row: Record<string, unknown>) => ({
        channel: row.channel,
        count: Number(row.count),
      })),
      total: conversations.length,
    });
  } catch (error) {
    console.error("Inbox API error:", error);
    return NextResponse.json({ conversations: [], channelCounts: [], total: 0 });
  }
}
