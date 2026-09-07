import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const settingsJson = JSON.stringify(body);

    await sql`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('dashboard', ${settingsJson}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${settingsJson}, updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await sql`SELECT value FROM system_settings WHERE key = 'dashboard' LIMIT 1`;
    if (result.length > 0) {
      return NextResponse.json(JSON.parse(result[0].value as string));
    }
    return NextResponse.json({});
  } catch {
    return NextResponse.json({});
  }
}
