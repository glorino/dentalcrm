import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import { sql } from "@/lib/db";
import { predictNoShowRisk } from "@/lib/ai/predictive";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const targetDate = searchParams.get("tomorrow")
      ? new Date(Date.now() + 86400000).toISOString().split("T")[0]
      : dateParam;

    const appointments = await sql`
      SELECT a.id, a.customer_id, c.name as patient_name, a.scheduled_at,
        a.duration_minutes, a.appointment_type, a.doctor_id,
        d.name as doctor_name
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE DATE(a.scheduled_at) = ${targetDate}
        AND a.status IN ('scheduled', 'in_progress')
      ORDER BY a.scheduled_at ASC
    `;

    const scheduleWithRisk: {
      id: string;
      patient: string;
      time: string;
      duration: number;
      type: string;
      doctor: string;
      noShowRisk: number;
    }[] = [];

    for (const appt of appointments) {
      const risk = await predictNoShowRisk(appt.id as string);
      scheduleWithRisk.push({
        id: appt.id as string,
        patient: appt.patient_name as string,
        time: new Date(appt.scheduled_at as string).toISOString(),
        duration: Number(appt.duration_minutes) || 30,
        type: appt.appointment_type as string,
        doctor: appt.doctor_name as string,
        noShowRisk: risk,
      });
    }

    const predictedNoShows = scheduleWithRisk.filter(a => a.noShowRisk > 60);
    const suggestedOverbookings = predictedNoShows.map(a => ({
      ...a,
      reason: `High no-show risk (${a.noShowRisk}%). Consider overbooking this slot.`,
    }));

    const doctorSchedules = await sql`
      SELECT d.id, d.name,
        COUNT(a.id) as appointment_count
      FROM doctors d
      LEFT JOIN appointments a ON a.doctor_id = d.id
        AND DATE(a.scheduled_at) = ${targetDate}
        AND a.status IN ('scheduled', 'in_progress')
      WHERE d.status = 'active'
      GROUP BY d.id, d.name
    `;

    const utilization = doctorSchedules.map((doc: Record<string, unknown>) => ({
      doctor: doc.name as string,
      appointmentCount: Number(doc.appointment_count),
      utilizationRate: Math.min(100, Math.round((Number(doc.appointment_count) / 8) * 100)),
    }));

    const totalSlots = appointments.length;
    const gapAnalysis = {
      totalAppointments: totalSlots,
      predictedNoShows: predictedNoShows.length,
      expectedActual: totalSlots - predictedNoShows.length,
      suggestedOverbookings: suggestedOverbookings.length,
    };

    return NextResponse.json({
      date: targetDate,
      appointments: scheduleWithRisk,
      predictedNoShows,
      suggestedOverbookings,
      gapAnalysis,
      doctorUtilization: utilization,
    });
  } catch (error) {
    console.error("Smart schedule GET error:", error);
    return NextResponse.json({ error: "Failed to fetch schedule data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { patientRequest, patientId, doctorId, confirm } = body;

    if (!patientRequest) {
      return NextResponse.json({ error: "patientRequest is required" }, { status: 400 });
    }

    const { text: analysis } = await generateText({
      model: openai("gpt-4o"),
      system: `You are a dental scheduling assistant. Parse the patient's scheduling request and extract:
- preferredDate: The date they want (ISO format or null if flexible)
- preferredTime: "morning", "afternoon", "evening", or null
- appointmentType: Type of appointment (checkup, cleaning, consultation, emergency, etc.)
- urgency: "routine", "soon", "urgent"
- doctorPreference: Doctor name if specified, or null
Respond in JSON format only.`,
      prompt: `Patient request: "${patientRequest}"
Current date: ${new Date().toISOString()}`,
    });

    let parsed;
    try {
      const jsonMatch = analysis?.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = {};
    }

    const searchDate = parsed.preferredDate || new Date().toISOString().split("T")[0];
    const timePreference = parsed.preferredTime || "morning";

    const availableSlots = await sql`
      SELECT a.id, a.scheduled_at, a.duration_minutes, a.doctor_id,
        d.name as doctor_name
      FROM doctor_schedules ds
      JOIN doctors d ON d.id = ds.doctor_id
      LEFT JOIN appointments a ON DATE(a.scheduled_at) = ${searchDate}
        AND a.status IN ('scheduled', 'in_progress')
      WHERE ds.day_of_week = EXTRACT(DOW FROM ${searchDate}::date)
        AND ds.is_available = true
        AND (${doctorId}::text IS NULL OR ds.doctor_id = ${doctorId})
      ORDER BY ds.start_time
    `;

    let noShowRisk = 50;
    if (patientId) {
      const latestAppt = await sql`
        SELECT id FROM appointments
        WHERE customer_id = ${patientId}
        ORDER BY created_at DESC LIMIT 1
      `;
      if (latestAppt.length > 0) {
        noShowRisk = await predictNoShowRisk(latestAppt[0].id as string);
      }
    }

    const fillProbability = Math.max(0, 100 - noShowRisk);

    const suggestedSlot = availableSlots.length > 0
      ? {
          time: availableSlots[0].scheduled_at,
          doctor: availableSlots[0].doctor_name,
          doctorId: availableSlots[0].doctor_id,
          fillProbability,
        }
      : null;

    if (confirm && suggestedSlot && patientId) {
      const aptCount = await sql`SELECT nextval('appointment_seq') as num`;
      const aptNum = `APT-${aptCount[0]?.num || Date.now()}`;
      const appointment = await sql`
        INSERT INTO appointments (appointment_number, customer_id, doctor_id, scheduled_at, appointment_type, status, channel, ai_confidence)
        VALUES (
          ${aptNum},
          ${patientId},
          ${suggestedSlot.doctorId},
          ${suggestedSlot.time},
          ${parsed.appointmentType || 'checkup'},
          'scheduled',
          'smart-schedule',
          ${fillProbability / 100}
        )
        RETURNING id, scheduled_at, status
      `;

      return NextResponse.json({
        booked: true,
        appointment: {
          id: appointment[0].id,
          time: appointment[0].scheduled_at,
          status: appointment[0].status,
        },
        noShowRisk,
        fillProbability,
      });
    }

    return NextResponse.json({
      parsedRequest: parsed,
      availableSlots: availableSlots.length,
      suggestedSlot,
      noShowRisk,
      fillProbability,
      message: suggestedSlot
        ? "Suggested slot found. Confirm to book."
        : "No available slots matching preferences. Try a different date or doctor.",
    });
  } catch (error) {
    console.error("Smart schedule POST error:", error);
    return NextResponse.json({ error: "Failed to process scheduling request" }, { status: 500 });
  }
}
