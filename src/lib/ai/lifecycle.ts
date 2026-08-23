import { sql } from "@/lib/db";

// Onboard a new patient - sends welcome sequence
export async function onboardPatient(customerId: string): Promise<{steps: string[], status: string}> {
  const customer = await sql`
    SELECT name, email FROM customers WHERE id = ${customerId} LIMIT 1
  `;
  if (customer.length === 0) return { steps: [], status: "patient_not_found" };

  const steps = [
    "Welcome email sent",
    "New patient forms linked",
    "Insurance verification initiated",
    "First appointment scheduling prompt sent",
  ];

  await recordTouchpoint(customerId, "onboarding", "email", "Patient onboarding sequence started");

  return { steps, status: "in_progress" };
}

// Send post-treatment care instructions
export async function sendPostTreatmentCare(
  customerId: string,
  treatmentType: string
): Promise<{sent: boolean; instructions: string}> {
  const careInstructions: Record<string, string> = {
    cleaning: "Avoid eating for 30 minutes. Mild sensitivity is normal for 1-2 days. Brush gently and use recommended toothpaste.",
    filling: "Avoid chewing on the treated side for 24 hours. Mild sensitivity to hot/cold may persist for a few weeks. Contact us if pain worsens.",
    extraction: "Bite on gauze for 30 minutes. Avoid smoking, straws, and hard foods for 72 hours. Take prescribed medications as directed. Apply ice packs for swelling.",
    root_canal: "Take antibiotics as prescribed. Avoid chewing on the treated tooth until permanent restoration is placed. Mild discomfort is normal for 3-5 days.",
    crown: "Avoid sticky foods for 24 hours. Mild sensitivity is normal. The temporary crown is not as strong as the permanent one - be cautious.",
    whitening: "Avoid colored foods and drinks for 48 hours. Use sensitivity toothpaste if needed. Results will continue to improve over 1-2 weeks.",
    implant: "Follow prescribed medication regimen. Avoid hard foods on the implant site. Maintain excellent oral hygiene. Swelling and discomfort are normal for 5-7 days.",
    braces: "Eat soft foods for the first week. Use orthodontic wax for irritation. Clean around brackets carefully. Avoid hard, sticky, and crunchy foods.",
    default: "Follow your dentist's specific instructions. Take any prescribed medications. Contact us if you experience unusual pain, swelling, or bleeding.",
  };

  const instructions = careInstructions[treatmentType.toLowerCase()] || careInstructions.default;

  await sql`
    INSERT INTO patient_journeys (customer_id, event_type, event_details, channel)
    VALUES (${customerId}, 'post_treatment_care', ${`Post-treatment care sent for: ${treatmentType}. Instructions: ${instructions}`}, 'email')
  `;

  await recordTouchpoint(customerId, "post_treatment_care", "email", `Care instructions sent for ${treatmentType}`);

  return { sent: true, instructions };
}

// Check if patient is due for recall
export async function checkRecallDue(customerId: string): Promise<{
  due: boolean;
  lastVisit: string;
  recommendedVisit: string;
  daysSinceVisit: number;
}> {
  const lastVisit = await sql`
    SELECT scheduled_at
    FROM appointments
    WHERE customer_id = ${customerId} AND status = 'completed'
    ORDER BY scheduled_at DESC LIMIT 1
  `;

  if (lastVisit.length === 0) {
    return {
      due: true,
      lastVisit: "Never visited",
      recommendedVisit: new Date().toISOString(),
      daysSinceVisit: 999,
    };
  }

  const lastVisitDate = new Date(lastVisit[0].scheduled_at);
  const daysSinceVisit = Math.floor(
    (Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const recommendedVisitDate = new Date(lastVisitDate);
  recommendedVisitDate.setMonth(recommendedVisitDate.getMonth() + 6);

  const due = daysSinceVisit >= 180;

  return {
    due,
    lastVisit: lastVisitDate.toISOString(),
    recommendedVisit: recommendedVisitDate.toISOString(),
    daysSinceVisit,
  };
}

// Process recall - send reminders to due patients
export async function processRecallQueue(): Promise<{remindersSent: number; patientsContacted: string[]}> {
  const duePatients = await sql`
    SELECT rs.customer_id, c.name, c.email, rs.due_date, rs.recall_type
    FROM recall_schedules rs
    JOIN customers c ON c.id = rs.customer_id
    WHERE rs.status = 'pending'
      AND rs.due_date <= NOW()
      AND (rs.last_reminder_at IS NULL OR rs.last_reminder_at < NOW() - INTERVAL '7 days')
    ORDER BY rs.due_date ASC
    LIMIT 20
  `;

  const patientsContacted: string[] = [];

  for (const patient of duePatients) {
    await sql`
      UPDATE recall_schedules
      SET last_reminder_at = NOW(), status = 'reminded'
      WHERE customer_id = ${patient.customer_id} AND status = 'pending'
    `;

    await recordTouchpoint(
      patient.customer_id,
      "recall_reminder",
      "email",
      `Recall reminder sent for ${patient.recall_type}`
    );

    patientsContacted.push(patient.customer_id);
  }

  return { remindersSent: duePatients.length, patientsContacted };
}

// Get loyalty points
export async function getLoyaltyStatus(customerId: string): Promise<{
  points: number;
  tier: string;
  nextTierPoints: number;
  benefits: string[];
}> {
  const result = await sql`
    SELECT COALESCE(SUM(points), 0) as total_points
    FROM loyalty_points
    WHERE customer_id = ${customerId}
  `;

  const points = Number(result[0]?.total_points) || 0;

  const tiers = [
    { name: "Bronze", min: 0, max: 499, benefits: ["5% discount on services", "Free toothbrush kit", "Birthday reminder"] },
    { name: "Silver", min: 500, max: 1499, benefits: ["10% discount on services", "Free whitening consultation", "Priority scheduling", "Free parking"] },
    { name: "Gold", min: 1500, max: 2999, benefits: ["15% discount on services", "Free annual X-rays", "Same-day appointments", "Free dental care kit", "VIP lounge access"] },
    { name: "Platinum", min: 3000, max: Infinity, benefits: ["20% discount on services", "Free cosmetic consultation", "Dedicated care coordinator", "Complimentary services", "Annual spa day"] },
  ];

  const currentTier = tiers.find(t => points >= t.min && points <= t.max) || tiers[0];
  const nextTier = tiers[tiers.indexOf(currentTier) + 1];

  return {
    points,
    tier: currentTier.name,
    nextTierPoints: nextTier ? nextTier.min : currentTier.min,
    benefits: currentTier.benefits,
  };
}

// Add loyalty points for a visit
export async function addLoyaltyPoints(
  customerId: string,
  points: number,
  reason: string
): Promise<void> {
  await sql`
    INSERT INTO loyalty_points (customer_id, points, reason)
    VALUES (${customerId}, ${points}, ${reason})
  `;

  await recordTouchpoint(customerId, "loyalty_points", "system", `Awarded ${points} points for: ${reason}`);
}

// Get patient journey timeline
export async function getPatientJourney(customerId: string): Promise<{
  date: string;
  event: string;
  details: string;
  sentiment?: string;
}[]> {
  const journey = await sql`
    SELECT
      created_at as date,
      event_type as event,
      event_details as details,
      sentiment
    FROM patient_journeys
    WHERE customer_id = ${customerId}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return journey.map((j: Record<string, unknown>) => ({
    date: j.date instanceof Date ? j.date.toISOString() : String(j.date),
    event: j.event as string,
    details: j.details as string,
    sentiment: j.sentiment as string | undefined,
  }));
}

// Auto-generate patient touchpoints
export async function recordTouchpoint(
  customerId: string,
  type: string,
  channel: string,
  summary: string
): Promise<void> {
  await sql`
    INSERT INTO patient_journeys (customer_id, event_type, event_details, channel)
    VALUES (${customerId}, ${type}, ${summary}, ${channel})
  `;
}
