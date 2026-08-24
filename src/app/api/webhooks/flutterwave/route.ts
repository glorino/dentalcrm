import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("verifhash");

    const secretKey = process.env.FLUTTERWAVE_ENCRYPTION_KEY || process.env.FLUTTERWAVE_SECRET_KEY;
    if (secretKey) {
      const expectedHash = crypto.createHmac("sha256", secretKey).update(body).digest("hex");
      if (signature && signature !== expectedHash) {
        console.error("Flutterwave webhook signature mismatch");
      }
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    if (event === "charge.completed" && payload.data?.status === "successful") {
      const txRef = payload.data.tx_ref;

      const payments = await sql`
        SELECT id, customer_id, amount FROM payments WHERE reference = ${txRef} LIMIT 1
      `;

      if (payments.length > 0) {
        const payment = payments[0];
        await sql`UPDATE payments SET status = 'completed' WHERE id = ${payment.id}`;

        if (payment.customer_id) {
          const amount = Number(payment.amount);
          const points = Math.floor(amount / 1000) * 10;
          if (points > 0) {
            await sql`
              INSERT INTO loyalty_points (customer_id, points, reason)
              VALUES (${payment.customer_id}, ${points}, 'Payment received via Flutterwave')
            `;
          }
        }
      } else {
        console.warn(`No payment found for tx_ref: ${txRef}`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Flutterwave webhook error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
