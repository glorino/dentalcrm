import { sql } from "./index";

export interface PatientProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
  segment: string;
  plan: string;
  ltv: number;
  csat: number;
  total_tickets: number;
  status: string;
  created_at: string;
}

export interface PatientTicket {
  id: string;
  ticket_number: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  channel: string;
  sentiment: string;
  sentiment_score: number;
  created_at: string;
  resolved_at: string | null;
}

export interface PatientAppointment {
  id: string;
  appointment_number: string;
  appointment_type: string;
  reason: string | null;
  scheduled_at: string;
  status: string;
  doctor_name: string;
  doctor_specialty: string;
}

export interface PatientHistory {
  patient: PatientProfile | null;
  recentTickets: PatientTicket[];
  upcomingAppointments: PatientAppointment[];
  totalTickets: number;
  totalResolved: number;
  lastVisit: string | null;
}

export async function lookupPatient(identifier: string): Promise<PatientProfile | null> {
  const result = await sql`
    SELECT * FROM customers
    WHERE email ILIKE ${`%${identifier}%`}
       OR phone ILIKE ${`%${identifier}%`}
       OR name ILIKE ${`%${identifier}%`}
    LIMIT 1
  `;
  return result[0] || null;
}

export async function getPatientHistory(patientId: string): Promise<PatientHistory> {
  const patient = await sql`SELECT * FROM customers WHERE id = ${patientId} LIMIT 1`;

  const recentTickets = await sql`
    SELECT id, ticket_number, subject, message, status, priority, channel,
           sentiment, sentiment_score, created_at, resolved_at
    FROM tickets
    WHERE customer_id = ${patientId}
    ORDER BY created_at DESC
    LIMIT 10
  `;

  const upcomingAppointments = await sql`
    SELECT a.id, a.appointment_number, a.appointment_type, a.reason,
           a.scheduled_at, a.status, d.name as doctor_name, d.specialty as doctor_specialty
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.customer_id = ${patientId}
      AND a.scheduled_at >= NOW()
      AND a.status IN ('scheduled', 'confirmed')
    ORDER BY a.scheduled_at ASC
    LIMIT 5
  `;

  const totalTickets = await sql`
    SELECT COUNT(*) as cnt FROM tickets WHERE customer_id = ${patientId}
  `;

  const totalResolved = await sql`
    SELECT COUNT(*) as cnt FROM tickets WHERE customer_id = ${patientId} AND status = 'resolved'
  `;

  const lastVisit = await sql`
    SELECT scheduled_at FROM appointments
    WHERE customer_id = ${patientId} AND status = 'completed'
    ORDER BY scheduled_at DESC LIMIT 1
  `;

  return {
    patient: patient[0] || null,
    recentTickets: recentTickets as PatientTicket[],
    upcomingAppointments: upcomingAppointments as PatientAppointment[],
    totalTickets: Number(totalTickets[0]?.cnt) || 0,
    totalResolved: Number(totalResolved[0]?.cnt) || 0,
    lastVisit: lastVisit[0]?.scheduled_at || null,
  };
}

export async function findOrCreatePatient(params: {
  email: string;
  name?: string;
  phone?: string;
}): Promise<PatientProfile> {
  let patient: PatientProfile | null = await lookupPatient(params.email);

  if (!patient) {
    const result = await sql`
      INSERT INTO customers (email, name, phone, segment, plan)
      VALUES (
        ${params.email},
        ${params.name || params.email.split("@")[0]},
        ${params.phone || null},
        'standard',
        'starter'
      )
      RETURNING *
    `;
    patient = result[0] as PatientProfile;
  } else if (params.name && patient.name !== params.name) {
    await sql`UPDATE customers SET name = ${params.name} WHERE id = ${patient.id}`;
    patient.name = params.name;
  }

  return patient as PatientProfile;
}
