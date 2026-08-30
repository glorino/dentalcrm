import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, reference, amount, currency, email, name, phone, description, status, customerId, appointmentId } = body;

    if (!transactionId || !reference || !amount || !email || !name) {
      return NextResponse.json(
        { error: "transactionId, reference, amount, email, and name are required" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO payments (transaction_id, reference, amount, currency, email, name, phone, description, status, customer_id, appointment_id)
      VALUES (${transactionId}, ${reference}, ${amount}, ${currency || "NGN"}, ${email}, ${name}, ${phone || ""}, ${description || ""}, ${status || "pending"}, ${customerId || null}, ${appointmentId || null})
      RETURNING *
    `;

    const payment = result[0];

    if (process.env.FLUTTERWAVE_SECRET_KEY) {
      try {
        const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status === "success" && verifyData.data?.status === "successful") {
          await sql`UPDATE payments SET status = 'completed' WHERE id = ${payment.id}`;
          payment.status = "completed";
        } else {
          await sql`UPDATE payments SET status = 'failed' WHERE id = ${payment.id}`;
          payment.status = "failed";
        }
      } catch (err) {
        console.error("Flutterwave verification error:", err);
      }
    }

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error: any) {
    console.error("Payments POST error:", error);
    if (error.message?.includes("duplicate key")) {
      return NextResponse.json({ error: "Transaction already recorded" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
  }
}

export async function GET() {
  try {
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
        customerId: p.customer_id,
        appointmentId: p.appointment_id,
        createdAt: p.created_at,
      })),
      total: payments.length,
    });
  } catch (error: any) {
    console.error("Payments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
