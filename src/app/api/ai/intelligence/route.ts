import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import { sql } from "@/lib/db";
import {
  predictNoShowRisk,
  predictChurnRisk,
  forecastRevenue,
  generatePredictiveAlerts,
} from "@/lib/ai/predictive";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const totalPatientsResult = await sql`SELECT COUNT(*) as count FROM customers`;
    const activePatientsResult = await sql`
      SELECT COUNT(DISTINCT customer_id) as count FROM appointments
      WHERE scheduled_at > NOW() - INTERVAL '1 year' AND status = 'completed'
    `;
    const appointmentsTodayResult = await sql`
      SELECT COUNT(*) as count FROM appointments
      WHERE DATE(scheduled_at) = CURRENT_DATE AND status IN ('scheduled', 'in_progress')
    `;
    const revenueTodayResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    const openTicketsResult = await sql`
      SELECT COUNT(*) as count FROM tickets WHERE status IN ('open', 'pending')
    `;
    const avgSentimentResult = await sql`
      SELECT AVG(sentiment_score) as avg FROM tickets
      WHERE created_at > NOW() - INTERVAL '30 days' AND sentiment_score IS NOT NULL
    `;

    const totalConversationsResult = await sql`
      SELECT COUNT(*) as count FROM ai_conversations
      WHERE created_at > NOW() - INTERVAL '30 days'
    `;
    const autoResolvedResult = await sql`
      SELECT COUNT(*) as count FROM ai_conversations
      WHERE resolved = true AND escalated = false
        AND created_at > NOW() - INTERVAL '30 days'
    `;
    const escalatedResult = await sql`
      SELECT COUNT(*) as count FROM ai_conversations
      WHERE escalated = true AND created_at > NOW() - INTERVAL '30 days'
    `;
    const avgConfidenceResult = await sql`
      SELECT AVG(ai_confidence) as avg FROM tickets
      WHERE created_at > NOW() - INTERVAL '30 days' AND ai_confidence IS NOT NULL
    `;
    const topIntentsResult = await sql`
      SELECT intent, COUNT(*) as count FROM ai_conversations
      WHERE intent IS NOT NULL AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY intent ORDER BY count DESC LIMIT 5
    `;

    const upcomingAppointments = await sql`
      SELECT a.id, a.customer_id, c.name as patient_name, a.scheduled_at
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      WHERE a.scheduled_at > NOW()
        AND a.status IN ('scheduled', 'in_progress')
      ORDER BY a.scheduled_at ASC
      LIMIT 10
    `;

    const noShowRiskData: { patient: string; risk: number; appointment: string }[] = [];
    for (const appt of upcomingAppointments) {
      const risk = await predictNoShowRisk(appt.id as string);
      noShowRiskData.push({
        patient: appt.patient_name as string,
        risk,
        appointment: new Date(appt.scheduled_at as string).toISOString(),
      });
    }

    const atRiskPatients = await sql`
      SELECT id, name FROM customers
      WHERE id IN (
        SELECT DISTINCT customer_id FROM appointments
        WHERE status = 'completed' AND scheduled_at > NOW() - INTERVAL '1 year'
      )
      LIMIT 10
    `;

    const churnRiskData: { patient: string; risk: number; lastVisit: string }[] = [];
    for (const patient of atRiskPatients) {
      const risk = await predictChurnRisk(patient.id as string);
      const lastVisit = await sql`
        SELECT MAX(scheduled_at) as last_visit FROM appointments
        WHERE customer_id = ${patient.id} AND status = 'completed'
      `;
      churnRiskData.push({
        patient: patient.name as string,
        risk,
        lastVisit: lastVisit[0]?.last_visit
          ? new Date(lastVisit[0].last_visit as string).toISOString()
          : "Unknown",
      });
    }

    const revenueForecast = await forecastRevenue(30);
    const predictiveAlerts = await generatePredictiveAlerts();

    const newPatientsResult = await sql`
      SELECT COUNT(*) as count FROM customers
      WHERE created_at >= DATE_TRUNC('month', NOW())
    `;
    const returningPatientsResult = await sql`
      SELECT COUNT(DISTINCT customer_id) as count FROM appointments
      WHERE status = 'completed'
        AND scheduled_at > NOW() - INTERVAL '90 days'
        AND customer_id IN (
          SELECT customer_id FROM appointments
          WHERE status = 'completed' AND scheduled_at < NOW() - INTERVAL '90 days'
        )
    `;
    const atRiskPatientsResult = await sql`
      SELECT COUNT(DISTINCT customer_id) as count FROM predictions
      WHERE prediction_type = 'churn_risk' AND score > 65
        AND created_at > NOW() - INTERVAL '30 days'
    `;
    const loyaltyDistResult = await sql`
      SELECT
        CASE
          WHEN total_points >= 3000 THEN 'Platinum'
          WHEN total_points >= 1500 THEN 'Gold'
          WHEN total_points >= 500 THEN 'Silver'
          ELSE 'Bronze'
        END as tier,
        COUNT(*) as count
      FROM (
        SELECT customer_id, COALESCE(SUM(points), 0) as total_points
        FROM loyalty_points GROUP BY customer_id
      ) sub
      GROUP BY tier
    `;
    const recallDueResult = await sql`
      SELECT COUNT(*) as count FROM recall_schedules
      WHERE status = 'pending' AND due_date <= NOW()
    `;

    const avgResponseTime = await sql`
      SELECT AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))) as avg_seconds
      FROM tickets
      WHERE first_response_at IS NOT NULL
        AND created_at > NOW() - INTERVAL '30 days'
    `;
    const avgSeconds = Number(avgResponseTime[0]?.avg_seconds) || 0;
    const avgResponseMinutes = Math.round(avgSeconds / 60);

    return NextResponse.json({
      clinicPulse: {
        activePatients: Number(activePatientsResult[0]?.count) || 0,
        appointmentsToday: Number(appointmentsTodayResult[0]?.count) || 0,
        avgWaitTime: avgResponseMinutes,
        occupancyRate: 0,
        revenueToday: Number(revenueTodayResult[0]?.total) || 0,
        ticketsOpen: Number(openTicketsResult[0]?.count) || 0,
        aiResolutionRate: Number(totalConversationsResult[0]?.count) > 0
          ? Math.round((Number(autoResolvedResult[0]?.count) / Number(totalConversationsResult[0]?.count)) * 100)
          : 0,
        patientSatisfaction: Number(avgSentimentResult[0]?.avg) || 0,
      },
      aiPerformance: {
        totalConversations: Number(totalConversationsResult[0]?.count) || 0,
        autoResolved: Number(autoResolvedResult[0]?.count) || 0,
        escalated: Number(escalatedResult[0]?.count) || 0,
        avgConfidence: Number(avgConfidenceResult[0]?.avg) || 0,
        avgResponseTime: `${avgResponseMinutes} min`,
        topIntents: topIntentsResult.map((r: Record<string, unknown>) => ({
          intent: r.intent as string,
          count: Number(r.count),
        })),
      },
      predictiveInsights: {
        noShowRisk: noShowRiskData,
        churnRisk: churnRiskData,
        revenueForecast,
        alerts: predictiveAlerts,
      },
      patientLifecycle: {
        newPatientsThisMonth: Number(newPatientsResult[0]?.count) || 0,
        returningPatients: Number(returningPatientsResult[0]?.count) || 0,
        atRiskPatients: Number(atRiskPatientsResult[0]?.count) || 0,
        loyaltyDistribution: loyaltyDistResult.map((r: Record<string, unknown>) => ({
          tier: r.tier as string,
          count: Number(r.count),
        })),
        recallDue: Number(recallDueResult[0]?.count) || 0,
      },
    });
  } catch (error) {
    console.error("Intelligence API error:", error);
    return NextResponse.json({ error: "Failed to fetch intelligence data" }, { status: 500 });
  }
}
