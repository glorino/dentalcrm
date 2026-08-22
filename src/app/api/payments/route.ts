import { NextRequest, NextResponse } from "next/server";
import { getSql, initDB } from "@/lib/db";

let dbReady = false;

async function ensureDB() {
  if (!dbReady) {
    await initDB();
    const sql = getSql();
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_id VARCHAR(100) UNIQUE NOT NULL,
        reference VARCHAR(100) UNIQUE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'NGN',
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        description TEXT,
        status VARCHAR(30) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    dbReady = true;
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDB();
    const body = await request.json();
    const { transactionId, reference, amount, currency, email, name, phone, description, status } = body;

    if (!transactionId || !reference || !amount || !email || !name) {
      return NextResponse.json(
        { error: "transactionId, reference, amount, email, and name are required" },
        { status: 400 }
      );
    }

    const sql = getSql();
    const result = await sql`
      INSERT INTO payments (transaction_id, reference, amount, currency, email, name, phone, description, status)
      VALUES (${transactionId}, ${reference}, ${amount}, ${currency || "NGN"}, ${email}, ${name}, ${phone || ""}, ${description || ""}, ${status || "successful"})
      RETURNING *
    `;

    return NextResponse.json({ success: true, payment: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Payments POST error:", error);
    if (error.message?.includes("duplicate key")) {
      return NextResponse.json({ error: "Transaction already recorded" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await ensureDB();
    const sql = getSql();
    const payments = await sql`
      SELECT * FROM payments ORDER BY created_at DESC LIMIT 50
    `;

    return NextResponse.json({
      payments: payments.map((p: Record<string, unknown>) => ({
        id: p.id,
        transactionId: p.transaction_id,
        reference: p.reference,
        amount: Number(p.amount),
        currency: p.currency,
        email: p.email,
        name: p.name,
        phone: p.phone,
        description: p.description,
        status: p.status,
        createdAt: p.created_at,
      })),
      total: payments.length,
    });
  } catch (error: any) {
    console.error("Payments GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
