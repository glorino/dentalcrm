import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import { sql } from "@/lib/db";
import { billingAgent } from "@/lib/ai/agents/autonomous";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const pendingClaims = await sql`
      SELECT
        ic.id,
        ic.claim_number,
        c.name as patient_name,
        ic.treatment_code,
        ic.treatment_description,
        ic.amount,
        ic.status,
        ic.submitted_at,
        CASE
          WHEN ic.status = 'submitted' THEN 75
          WHEN ic.status = 'pending' THEN 50
          WHEN ic.status = 'rejected' THEN 20
          ELSE 60
        END as success_probability
      FROM insurance_claims ic
      JOIN customers c ON ic.customer_id = c.id
      WHERE ic.status IN ('submitted', 'pending')
      ORDER BY ic.submitted_at DESC
      LIMIT 20
    `;

    const overduePayments = await sql`
      SELECT
        p.id,
        c.name as patient_name,
        c.email,
        p.amount,
        p.due_date,
        p.status,
        EXTRACT(DAY FROM NOW() - p.due_date) as days_overdue,
        CASE
          WHEN EXTRACT(DAY FROM NOW() - p.due_date) > 60 THEN 'critical'
          WHEN EXTRACT(DAY FROM NOW() - p.due_date) > 30 THEN 'high'
          WHEN EXTRACT(DAY FROM NOW() - p.due_date) > 14 THEN 'medium'
          ELSE 'low'
        END as collection_priority
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.status = 'overdue'
      ORDER BY p.due_date ASC
      LIMIT 20
    `;

    const revenueByTreatment = await sql`
      SELECT
        appointment_type as treatment_type,
        COUNT(*) as count,
        COALESCE(SUM(p.amount), 0) as revenue
      FROM appointments a
      LEFT JOIN payments p ON p.appointment_id = a.id
      WHERE a.status = 'completed'
        AND a.scheduled_at > NOW() - INTERVAL '90 days'
      GROUP BY appointment_type
      ORDER BY revenue DESC
    `;

    const claimApprovalRates = await sql`
      SELECT
        treatment_code,
        COUNT(*) as total_claims,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        ROUND(
          COUNT(CASE WHEN status = 'approved' THEN 1 END)::numeric /
          NULLIF(COUNT(*), 0) * 100, 1
        ) as approval_rate
      FROM insurance_claims
      GROUP BY treatment_code
      ORDER BY total_claims DESC
      LIMIT 10
    `;

    const totalPendingAmount = pendingClaims.reduce(
      (sum: number, c: any) => sum + (Number(c.amount) || 0), 0
    );
    const totalOverdueAmount = overduePayments.reduce(
      (sum: number, p: any) => sum + (Number(p.amount) || 0), 0
    );

    return NextResponse.json({
      pendingClaims: pendingClaims.map((c: any) => ({
        id: c.id,
        claimNumber: c.claim_number,
        patient: c.patient_name,
        treatmentCode: c.treatment_code,
        description: c.treatment_description,
        amount: Number(c.amount),
        status: c.status,
        submittedAt: c.submitted_at,
        successProbability: Number(c.success_probability),
      })),
      overduePayments: overduePayments.map((p: any) => ({
        id: p.id,
        patient: p.patient_name,
        email: p.email,
        amount: Number(p.amount),
        dueDate: p.due_date,
        daysOverdue: Number(p.days_overdue),
        collectionPriority: p.collection_priority,
      })),
      revenueByTreatment: revenueByTreatment.map((r: any) => ({
        treatment: r.treatment_type,
        count: Number(r.count),
        revenue: Number(r.revenue),
      })),
      claimApprovalRates: claimApprovalRates.map((r: any) => ({
        treatmentCode: r.treatment_code,
        totalClaims: Number(r.total_claims),
        approved: Number(r.approved),
        rejected: Number(r.rejected),
        approvalRate: Number(r.approval_rate),
      })),
      summary: {
        totalPendingClaims: pendingClaims.length,
        totalPendingAmount,
        totalOverduePayments: overduePayments.length,
        totalOverdueAmount,
      },
    });
  } catch (error) {
    console.error("Smart billing GET error:", error);
    return NextResponse.json({ error: "Failed to fetch billing intelligence" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action, claimId, patientId, treatmentCode, treatmentDescription, cost, amount, dueDate } = body;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    const validActions = ["generate_claim", "send_reminder", "follow_up_rejection"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    switch (action) {
      case "generate_claim": {
        if (!patientId || !treatmentCode || !treatmentDescription || !cost) {
          return NextResponse.json(
            { error: "patientId, treatmentCode, treatmentDescription, and cost are required" },
            { status: 400 }
          );
        }

        const task = {
          id: "temp",
          type: "billing" as const,
          action: "generate_claim",
          data: { patientId, treatmentCode, treatmentDescription, cost },
          priority: "medium" as const,
          status: "in_progress" as const,
          createdAt: new Date().toISOString(),
        };

        const result = await billingAgent(task);

        await sql`
          INSERT INTO insurance_claims (customer_id, treatment_code, treatment_description, amount, status)
          VALUES (${patientId}, ${treatmentCode}, ${treatmentDescription}, ${cost}, 'pending')
        `;

        return NextResponse.json({ result });
      }

      case "send_reminder": {
        if (!patientId || !amount) {
          return NextResponse.json(
            { error: "patientId and amount are required" },
            { status: 400 }
          );
        }

        const task = {
          id: "temp",
          type: "billing" as const,
          action: "send_reminder",
          data: { patientId, amount, dueDate: dueDate || new Date().toISOString() },
          priority: "medium" as const,
          status: "in_progress" as const,
          createdAt: new Date().toISOString(),
        };

        const result = await billingAgent(task);

        await sql`
          INSERT INTO patient_journeys (customer_id, event_type, event_details, channel)
          VALUES (${patientId}, 'payment_reminder', ${`Payment reminder sent for $${amount}`}, 'email')
        `;

        return NextResponse.json({ result });
      }

      case "follow_up_rejection": {
        if (!claimId) {
          return NextResponse.json({ error: "claimId is required" }, { status: 400 });
        }

        const claim = await sql`
          SELECT ic.*, c.name as patient_name, c.email
          FROM insurance_claims ic
          JOIN customers c ON ic.customer_id = c.id
          WHERE ic.id = ${claimId} LIMIT 1
        `;

        if (claim.length === 0) {
          return NextResponse.json({ error: "Claim not found" }, { status: 404 });
        }

        await sql`
          UPDATE insurance_claims
          SET status = 'under_review', updated_at = NOW()
          WHERE id = ${claimId}
        `;

        await sql`
          INSERT INTO patient_journeys (customer_id, event_type, event_details, channel)
          VALUES (
            ${claim[0].customer_id},
            'claim_followup',
            ${`Insurance claim ${claim[0].claim_number} follow-up initiated after rejection`},
            'email'
          )
        `;

        return NextResponse.json({
          result: {
            followUpInitiated: true,
            claimId,
            claimNumber: claim[0].claim_number,
            patientName: claim[0].patient_name,
            status: "under_review",
          },
        });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Smart billing POST error:", error);
    return NextResponse.json({ error: "Failed to process billing action" }, { status: 500 });
  }
}
