import { sql } from "@/lib/db";

// Helper: moving average
function movingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
}

// Helper: linear trend slope
function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xs = values.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (values[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

// Predict no-show risk for an appointment (returns 0-100 score)
export async function predictNoShowRisk(appointmentId: string): Promise<number> {
  const appt = await sql`
    SELECT a.id, a.customer_id, a.scheduled_at, a.status
    FROM appointments a WHERE a.id = ${appointmentId} LIMIT 1
  `;
  if (appt.length === 0) return 50;

  const customerId = appt[0].customer_id;

  const history = await sql`
    SELECT
      COUNT(*) as total_appointments,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
      COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_count
    FROM appointments
    WHERE customer_id = ${customerId}
      AND scheduled_at < NOW()
  `;

  const total = Number(history[0].total_appointments) || 1;
  const noShows = Number(history[0].no_show_count) || 0;
  const cancelled = Number(history[0].cancelled_count) || 0;

  const historicalNoShowRate = noShows / total;
  const cancellationRate = cancelled / total;

  const daysSinceLastVisit = await sql`
    SELECT EXTRACT(DAY FROM NOW() - MAX(scheduled_at)) as days
    FROM appointments
    WHERE customer_id = ${customerId} AND status = 'completed'
  `;
  const gap = daysSinceLastVisit[0]?.days ? Number(daysSinceLastVisit[0].days) : 365;
  const gapFactor = Math.min(gap / 180, 1);

  const scheduledAt = new Date(appt[0].scheduled_at);
  const daysUntil = (scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const urgencyFactor = daysUntil > 30 ? 0.2 : daysUntil > 14 ? 0.1 : 0;

  const score = Math.round(
    Math.min(100, Math.max(0,
      historicalNoShowRate * 40 +
      cancellationRate * 20 +
      gapFactor * 25 +
      urgencyFactor * 15 +
      10
    ))
  );

  await sql`
    INSERT INTO predictions (entity_type, entity_id, prediction_type, score, data)
    VALUES ('appointment', ${appointmentId}, 'no_show_risk', ${score},
      ${JSON.stringify({ historicalNoShowRate, cancellationRate, gapDays: gap, daysUntil })}::jsonb)
  `;

  return score;
}

// Predict patient churn risk (returns 0-100 score)
export async function predictChurnRisk(customerId: string): Promise<number> {
  const visits = await sql`
    SELECT scheduled_at, status
    FROM appointments
    WHERE customer_id = ${customerId}
    ORDER BY scheduled_at DESC
    LIMIT 20
  `;

  if (visits.length === 0) return 30;

  const completedVisits = visits.filter((v: Record<string, unknown>) => v.status === "completed");
  const totalVisits = completedVisits.length;

  const lastVisitDate = completedVisits.length > 0
    ? new Date(completedVisits[0].scheduled_at as string)
    : new Date(visits[0].scheduled_at as string);

  const daysSinceVisit = (Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24);

  const visitDates = completedVisits.map((v: Record<string, unknown>) => new Date(v.scheduled_at as string).getTime());
  const gaps: number[] = [];
  for (let i = 1; i < visitDates.length; i++) {
    gaps.push((visitDates[i - 1] - visitDates[i]) / (1000 * 60 * 60 * 24));
  }
  const avgGap = gaps.length > 0 ? gaps.reduce((a: number, b: number) => a + b, 0) / gaps.length : 90;
  const gapVariance = gaps.length > 1
    ? gaps.reduce((sum: number, g: number) => sum + (g - avgGap) ** 2, 0) / gaps.length
    : 0;

  const slope = linearSlope(visitDates.map((_: any, i: number) => i === 0 ? 0 : visitDates[i - 1] - visitDates[i]));
  const trendFactor = slope > 10 ? 0.3 : slope > 0 ? 0.15 : slope > -10 ? 0 : -0.1;

  const recencyScore = Math.min(daysSinceVisit / (avgGap * 2), 1) * 35;
  const frequencyScore = totalVisits < 3 ? 25 : totalVisits < 5 ? 15 : 5;
  const consistencyScore = (1 - Math.min(Math.sqrt(gapVariance) / avgGap, 1)) * 15;
  const trendContrib = trendFactor * 25;

  const score = Math.round(Math.min(100, Math.max(0,
    100 - recencyScore - frequencyScore - consistencyScore - trendContrib + 20
  )));

  await sql`
    INSERT INTO predictions (entity_type, entity_id, prediction_type, score, data)
    VALUES ('customer', ${customerId}, 'churn_risk', ${score},
      ${JSON.stringify({ totalVisits, daysSinceVisit, avgGap: Math.round(avgGap), slope: Math.round(slope * 100) / 100 })}::jsonb)
  `;

  return score;
}

// Predict treatment urgency (returns score + recommended treatment)
export async function predictTreatmentUrgency(customerId: string): Promise<{score: number, recommendedTreatments: string[], reason: string}> {
  const appointments = await sql`
    SELECT appointment_type, reason, notes, scheduled_at, status
    FROM appointments
    WHERE customer_id = ${customerId}
    ORDER BY scheduled_at DESC
    LIMIT 10
  `;

  const completed = appointments.filter((a: Record<string, unknown>) => a.status === "completed");
  const lastVisit = completed[0];

  let daysSinceVisit = 365;
  if (lastVisit) {
    daysSinceVisit = (Date.now() - new Date(lastVisit.scheduled_at as string).getTime()) / (1000 * 60 * 60 * 24);
  }

  const visitTypes = completed.map((a: Record<string, unknown>) => a.appointment_type as string);
  const hasCleaning = visitTypes.some((t: string) => /cleaning|prophylaxis/i.test(t));
  const hasCheckup = visitTypes.some((t: string) => /check|exam|checkup/i.test(t));

  const recommendedTreatments: string[] = [];
  let urgencyScore = 20;
  let reason = "Patient is up to date on recommended treatments.";

  if (!hasCleaning && daysSinceVisit > 180) {
    recommendedTreatments.push("Dental Cleaning");
    urgencyScore += 25;
    reason = "Patient has not had a cleaning in over 6 months.";
  }

  if (!hasCheckup && daysSinceVisit > 365) {
    recommendedTreatments.push("Comprehensive Exam");
    urgencyScore += 30;
    reason = "Patient has not had a checkup in over a year.";
  }

  if (daysSinceVisit > 365) {
    urgencyScore += 15;
    if (recommendedTreatments.length === 0) {
      reason = "Patient has not visited in over a year.";
    }
  }

  if (daysSinceVisit > 730) {
    recommendedTreatments.push("Full Mouth X-Rays");
    urgencyScore += 10;
  }

  if (recommendedTreatments.length === 0 && daysSinceVisit > 90) {
    recommendedTreatments.push("Routine Checkup");
    reason = "Routine follow-up recommended.";
  }

  urgencyScore = Math.min(100, Math.max(0, urgencyScore));

  await sql`
    INSERT INTO predictions (entity_type, entity_id, prediction_type, score, data)
    VALUES ('customer', ${customerId}, 'treatment_urgency', ${urgencyScore},
      ${JSON.stringify({ daysSinceVisit: Math.round(daysSinceVisit), recommendedTreatments, reason })}::jsonb)
  `;

  return { score: urgencyScore, recommendedTreatments, reason };
}

// Forecast revenue for next N days
export async function forecastRevenue(days: number): Promise<{date: string, predicted: number, confidence: number}[]> {
  const revenueData = await sql`
    SELECT
      DATE(scheduled_at) as visit_date,
      COUNT(*) as visit_count,
      EXTRACT(DOW FROM scheduled_at) as day_of_week
    FROM appointments
    WHERE status = 'completed'
      AND scheduled_at >= NOW() - INTERVAL '90 days'
    GROUP BY DATE(scheduled_at), EXTRACT(DOW FROM scheduled_at)
    ORDER BY visit_date
  `;

  const dailyVisits = revenueData.map((r: Record<string, unknown>) => Number(r.visit_count));
  const avgVisits = dailyVisits.length > 0
    ? dailyVisits.reduce((a: number, b: number) => a + b, 0) / dailyVisits.length
    : 2;

  const slope = linearSlope(dailyVisits);
  const sma = movingAverage(dailyVisits, 7);
  const recentTrend = sma.length > 1 ? sma[sma.length - 1] - sma[0] : 0;

  const avgRevenuePerVisit = 250;
  const forecast: {date: string, predicted: number, confidence: number}[] = [];

  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const dow = date.getDay();
    const weekendFactor = (dow === 0 || dow === 6) ? 0.3 : 1;

    const predictedVisits = Math.max(0, avgVisits + slope * i * 0.1 + recentTrend * 0.05);
    const predicted = Math.round(predictedVisits * avgRevenuePerVisit * weekendFactor);

    const confidenceBase = 85 - (i * 0.5);
    const confidence = Math.max(40, Math.min(95, Math.round(confidenceBase)));

    forecast.push({
      date: date.toISOString().split("T")[0],
      predicted,
      confidence,
    });
  }

  return forecast;
}

// Get sentiment trajectory for a patient
export async function getSentimentTrajectory(customerId: string): Promise<{date: string, sentiment: string, score: number}[]> {
  const sentiments = await sql`
    SELECT
      DATE(created_at) as date,
      sentiment,
      sentiment_score
    FROM tickets
    WHERE customer_id = ${customerId}
      AND sentiment IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 30
  `;

  return sentiments.map((s: Record<string, unknown>) => ({
    date: s.date instanceof Date ? s.date.toISOString().split("T")[0] : String(s.date),
    sentiment: (s.sentiment as string) || "neutral",
    score: Number(s.sentiment_score) || 0,
  })).reverse();
}

// Generate predictive alerts for the clinic
export async function generatePredictiveAlerts(): Promise<{type: string, message: string, urgency: string, patientId?: string, appointmentId?: string}[]> {
  const alerts: {type: string, message: string, urgency: string, patientId?: string, appointmentId?: string}[] = [];

  const upcomingHighRisk = await sql`
    SELECT a.id as appointment_id, a.customer_id, a.scheduled_at,
      p.score as no_show_score
    FROM appointments a
    JOIN predictions p ON p.entity_id = a.id AND p.prediction_type = 'no_show_risk'
    WHERE a.scheduled_at > NOW()
      AND a.scheduled_at < NOW() + INTERVAL '7 days'
      AND p.score > 60
    ORDER BY p.score DESC
    LIMIT 10
  `;

  for (const row of upcomingHighRisk) {
    alerts.push({
      type: "no_show_risk",
      message: `High no-show risk (${row.no_show_score}%) for appointment on ${new Date(row.scheduled_at).toLocaleDateString()}`,
      urgency: Number(row.no_show_score) > 80 ? "urgent" : "high",
      patientId: row.customer_id,
      appointmentId: row.appointment_id,
    });
  }

  const churnAlerts = await sql`
    SELECT c.id, c.name, p.score as churn_score
    FROM customers c
    JOIN predictions p ON p.entity_id = c.id AND p.prediction_type = 'churn_risk'
    WHERE p.score > 65
      AND p.created_at > NOW() - INTERVAL '30 days'
    ORDER BY p.score DESC
    LIMIT 5
  `;

  for (const row of churnAlerts) {
    alerts.push({
      type: "churn_risk",
      message: `Patient ${row.name} has a high churn risk (${row.churn_score}%). Consider re-engagement outreach.`,
      urgency: Number(row.churn_score) > 80 ? "high" : "medium",
      patientId: row.id,
    });
  }

  const overdueRecalls = await sql`
    SELECT rs.customer_id, c.name, rs.due_date
    FROM recall_schedules rs
    JOIN customers c ON c.id = rs.customer_id
    WHERE rs.status = 'pending'
      AND rs.due_date < NOW()
    ORDER BY rs.due_date
    LIMIT 5
  `;

  for (const row of overdueRecalls) {
    alerts.push({
      type: "overdue_recall",
      message: `Patient ${row.name} is overdue for recall since ${new Date(row.due_date).toLocaleDateString()}`,
      urgency: "medium",
      patientId: row.customer_id,
    });
  }

  return alerts;
}

// Calculate patient lifetime value prediction
export async function predictLifetimeValue(customerId: string): Promise<{currentLTV: number, predictedLTV: number, growthRate: number}> {
  const customer = await sql`
    SELECT ltv, created_at FROM customers WHERE id = ${customerId} LIMIT 1
  `;
  if (customer.length === 0) return { currentLTV: 0, predictedLTV: 0, growthRate: 0 };

  const currentLTV = Number(customer[0].ltv) || 0;

  const visits = await sql`
    SELECT scheduled_at, status
    FROM appointments
    WHERE customer_id = ${customerId} AND status = 'completed'
    ORDER BY scheduled_at ASC
  `;

  if (visits.length === 0) {
    return { currentLTV, predictedLTV: currentLTV, growthRate: 0 };
  }

  const visitTimes = visits.map((v: Record<string, unknown>) => new Date(v.scheduled_at as string).getTime());
  const firstVisit = visitTimes[0];
  const lastVisit = visitTimes[visitTimes.length - 1];
  const monthsActive = Math.max(1, (lastVisit - firstVisit) / (1000 * 60 * 60 * 24 * 30));

  const avgRevenuePerVisit = currentLTV / visits.length;
  const visitFrequency = visits.length / monthsActive;

  const visitRevenues = visits.map((_: any, i: number) => i < visits.length - 1 ? avgRevenuePerVisit : avgRevenuePerVisit);
  const revenueSlope = linearSlope(visitRevenues);
  const growthRate = currentLTV > 0 ? revenueSlope / currentLTV : 0;

  const monthsToProject = 60;
  const predictedLTV = Math.round(
    currentLTV + (avgRevenuePerVisit * visitFrequency * monthsToProject * (1 + growthRate))
  );

  await sql`
    INSERT INTO predictions (entity_type, entity_id, prediction_type, score, data)
    VALUES ('customer', ${customerId}, 'lifetime_value', ${Math.min(100, Math.round(predictedLTV / 10))},
      ${JSON.stringify({ currentLTV, predictedLTV, growthRate: Math.round(growthRate * 100) / 100, monthsActive, visitFrequency })}::jsonb)
  `;

  return {
    currentLTV: Math.round(currentLTV),
    predictedLTV: Math.round(predictedLTV),
    growthRate: Math.round(growthRate * 100) / 100,
  };
}
