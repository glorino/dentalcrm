import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import {
  predictNoShowRisk,
  predictChurnRisk,
  forecastRevenue,
  getSentimentTrajectory,
  generatePredictiveAlerts,
  predictLifetimeValue,
} from "@/lib/ai/predictive";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const upcomingAppointments = await sql`
      SELECT a.id, a.customer_id, c.name as patient_name, a.scheduled_at
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      WHERE a.scheduled_at > NOW()
        AND a.status IN ('scheduled', 'in_progress')
      ORDER BY a.scheduled_at ASC
      LIMIT 20
    `;

    const noShowRisks: { patient: string; risk: number; appointment: string; appointmentId: string }[] = [];
    for (const appt of upcomingAppointments) {
      const risk = await predictNoShowRisk(appt.id as string);
      noShowRisks.push({
        patient: appt.patient_name as string,
        risk,
        appointment: new Date(appt.scheduled_at as string).toISOString(),
        appointmentId: appt.id as string,
      });
    }
    noShowRisks.sort((a, b) => b.risk - a.risk);

    const activePatients = await sql`
      SELECT id, name FROM customers
      WHERE id IN (
        SELECT DISTINCT customer_id FROM appointments
        WHERE status = 'completed' AND scheduled_at > NOW() - INTERVAL '1 year'
      )
      LIMIT 20
    `;

    const churnRisks: { patient: string; risk: number; lastVisit: string }[] = [];
    for (const patient of activePatients) {
      const risk = await predictChurnRisk(patient.id as string);
      const lastVisit = await sql`
        SELECT MAX(scheduled_at) as last_visit
        FROM appointments
        WHERE customer_id = ${patient.id} AND status = 'completed'
      `;
      churnRisks.push({
        patient: patient.name as string,
        risk,
        lastVisit: lastVisit[0]?.last_visit
          ? new Date(lastVisit[0].last_visit as string).toISOString()
          : "Unknown",
      });
    }
    churnRisks.sort((a, b) => b.risk - a.risk);

    const revenueForecast = await forecastRevenue(30);

    const recentPatients = await sql`
      SELECT DISTINCT customer_id
      FROM tickets
      WHERE created_at > NOW() - INTERVAL '30 days'
      LIMIT 10
    `;

    const sentimentTrajectories: { patient: string; trajectory: { date: string; sentiment: string; score: number }[] }[] = [];
    for (const row of recentPatients) {
      const trajectory = await getSentimentTrajectory(row.customer_id as string);
      if (trajectory.length > 0) {
        const patientName = await sql`SELECT name FROM customers WHERE id = ${row.customer_id} LIMIT 1`;
        sentimentTrajectories.push({
          patient: patientName[0]?.name as string || "Unknown",
          trajectory,
        });
      }
    }

    const predictiveAlerts = await generatePredictiveAlerts();

    const topPatients = await sql`
      SELECT id, name FROM customers
      ORDER BY ltv DESC
      LIMIT 10
    `;

    const ltvPredictions: { patient: string; currentLTV: number; predictedLTV: number; growthRate: number }[] = [];
    for (const patient of topPatients) {
      const ltv = await predictLifetimeValue(patient.id as string);
      ltvPredictions.push({
        patient: patient.name as string,
        ...ltv,
      });
    }

    return NextResponse.json({
      noShowRisks,
      churnRisks,
      revenueForecast,
      sentimentTrajectories,
      predictiveAlerts,
      ltvPredictions,
    });
  } catch (error) {
    console.error("Predictions API error:", error);
    return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 });
  }
}
