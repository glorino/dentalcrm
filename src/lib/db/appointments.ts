import { sql } from "./index";

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  specialty: string;
  bio: string | null;
  consultation_duration_minutes: number;
  status: string;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface Appointment {
  id: string;
  appointment_number: string;
  customer_id: string;
  doctor_id: string;
  ticket_id: string | null;
  appointment_type: string;
  reason: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  ai_confidence: number;
  channel: string;
  created_at: string;
}

export async function getDoctors(specialty?: string): Promise<Doctor[]> {
  if (specialty) {
    return sql`
      SELECT * FROM doctors WHERE status = 'active' AND specialty ILIKE ${`%${specialty}%`}
      ORDER BY name
    `;
  }
  return sql`SELECT * FROM doctors WHERE status = 'active' ORDER BY name`;
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
  const result = await sql`SELECT * FROM doctors WHERE id = ${id} LIMIT 1`;
  return result[0] || null;
}

export async function getDoctorSchedule(doctorId: string): Promise<DoctorSchedule[]> {
  return sql`
    SELECT * FROM doctor_schedules
    WHERE doctor_id = ${doctorId} AND is_available = TRUE
    ORDER BY day_of_week, start_time
  `;
}

export async function getAvailableSlots(
  doctorId: string,
  date: string
): Promise<{ time: string; available: boolean }[]> {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();

  const schedule = await sql`
    SELECT start_time, end_time FROM doctor_schedules
    WHERE doctor_id = ${doctorId} AND day_of_week = ${dayOfWeek} AND is_available = TRUE
  `;

  if (schedule.length === 0) return [];

  const doctor = await getDoctorById(doctorId);
  const duration = doctor?.consultation_duration_minutes || 30;

  const slots: { time: string; available: boolean }[] = [];
  const existingAppointments = await sql`
    SELECT scheduled_at, duration_minutes FROM appointments
    WHERE doctor_id = ${doctorId}
      AND DATE(scheduled_at) = ${date}
      AND status IN ('scheduled', 'confirmed')
  `;

  for (const sched of schedule) {
    const [startH, startM] = (sched.start_time as string).split(":").map(Number);
    const [endH, endM] = (sched.end_time as string).split(":").map(Number);
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + duration <= endMinutes) {
      const slotTime = `${String(Math.floor(currentMinutes / 60)).padStart(2, "0")}:${String(currentMinutes % 60).padStart(2, "0")}`;
      const slotDateTime = new Date(`${date}T${slotTime}:00`);

      const isBooked = existingAppointments.some((apt) => {
        const aptTime = new Date(apt.scheduled_at as string);
        const aptEnd = new Date(aptTime.getTime() + ((apt.duration_minutes as number) || 30) * 60000);
        return slotDateTime >= aptTime && slotDateTime < aptEnd;
      });

      slots.push({ time: slotTime, available: !isBooked });
      currentMinutes += duration;
    }
  }

  return slots;
}

export async function createAppointment(params: {
  customerId: string;
  doctorId: string;
  ticketId?: string;
  appointmentType: string;
  reason?: string;
  scheduledAt: string;
  durationMinutes?: number;
  channel?: string;
  aiConfidence?: number;
  notes?: string;
}): Promise<Appointment> {
  const count = await sql`SELECT nextval('appointment_seq') as num`;
  const appointmentNumber = `APT-${count[0].num}`;

  const result = await sql`
    INSERT INTO appointments (
      appointment_number, customer_id, doctor_id, ticket_id,
      appointment_type, reason, scheduled_at, duration_minutes,
      status, channel, ai_confidence, notes
    ) VALUES (
      ${appointmentNumber}, ${params.customerId}, ${params.doctorId},
      ${params.ticketId || null}, ${params.appointmentType},
      ${params.reason || null}, ${params.scheduledAt},
      ${params.durationMinutes || 30}, 'scheduled',
      ${params.channel || "self-service"}, ${params.aiConfidence || 0},
      ${params.notes || null}
    )
    RETURNING *
  `;

  return result[0];
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: string
): Promise<boolean> {
  const updates: Record<string, string> = { status, updated_at: new Date().toISOString() };
  if (status === "cancelled") updates.cancelled_at = new Date().toISOString();
  if (status === "completed") updates.completed_at = new Date().toISOString();

  await sql`
    UPDATE appointments SET
      status = ${status},
      updated_at = NOW(),
      cancelled_at = ${status === "cancelled" ? new Date().toISOString() : null},
      completed_at = ${status === "completed" ? new Date().toISOString() : null}
    WHERE id = ${appointmentId}
  `;
  return true;
}

export async function getCustomerAppointments(customerId: string): Promise<Appointment[]> {
  return sql`
    SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.customer_id = ${customerId}
    ORDER BY a.scheduled_at DESC
    LIMIT 20
  `;
}

export async function getUpcomingAppointments(doctorId?: string): Promise<any[]> {
  if (doctorId) {
    return sql`
      SELECT a.*, c.name as patient_name, c.email as patient_email, c.phone as patient_phone
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      WHERE a.doctor_id = ${doctorId}
        AND a.scheduled_at >= NOW()
        AND a.status IN ('scheduled', 'confirmed')
      ORDER BY a.scheduled_at ASC
      LIMIT 20
    `;
  }
  return sql`
    SELECT a.*, c.name as patient_name, c.email as patient_email,
           d.name as doctor_name, d.specialty as doctor_specialty
    FROM appointments a
    JOIN customers c ON a.customer_id = c.id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.scheduled_at >= NOW()
      AND a.status IN ('scheduled', 'confirmed')
    ORDER BY a.scheduled_at ASC
    LIMIT 50
  `;
}
