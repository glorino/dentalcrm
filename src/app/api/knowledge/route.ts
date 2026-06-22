import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const collection = searchParams.get("collection");
    const status = searchParams.get("status");

    const conditions: string[] = ["1=1"];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(
        ka.title ILIKE $${paramIndex}
        OR ka.content ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (collection) {
      conditions.push(`ka.collection = $${paramIndex}`);
      values.push(collection);
      paramIndex++;
    }

    if (status) {
      conditions.push(`ka.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const query = `
      SELECT 
        ka.*,
        u.name as author_name
      FROM knowledge_articles ka
      LEFT JOIN users u ON ka.created_by = u.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY ka.updated_at DESC
    `;

    const sql = getSql();
    const articles = await sql(query, values);

    const collectionCounts = await sql`
      SELECT collection, COUNT(*) as count
      FROM knowledge_articles
      WHERE collection IS NOT NULL
      GROUP BY collection
      ORDER BY count DESC
    `;

    const stats = await sql`
      SELECT 
        COUNT(*) as total_articles,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(views) as total_views,
        SUM(ai_used) as total_ai_used,
        AVG(CASE WHEN helpful > 0 THEN helpful ELSE NULL END) as avg_helpful
      FROM knowledge_articles
    `;

    return NextResponse.json({
      articles: articles.map((a: Record<string, unknown>) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        collection: a.collection,
        status: a.status,
        views: a.views,
        aiUsed: a.ai_used,
        helpful: a.helpful,
        tags: a.tags,
        authorName: a.author_name,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })),
      collections: collectionCounts.map((c: Record<string, unknown>) => ({
        name: c.collection,
        count: c.count,
      })),
      stats: {
        totalArticles: stats[0].total_articles,
        published: stats[0].published,
        totalViews: stats[0].total_views,
        totalAiUsed: stats[0].total_ai_used,
        avgHelpful: stats[0].avg_helpful || 0,
      },
      total: articles.length,
    });
  } catch (error) {
    console.error("Knowledge API error:", error);
    return NextResponse.json({ error: "Failed to fetch knowledge articles" }, { status: 500 });
  }
}
