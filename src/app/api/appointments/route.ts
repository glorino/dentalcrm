import { NextRequest, NextResponse } from "next/server";
import { getDoctors, getAvailableSlots, createAppointment, getCustomerAppointments, getUpcomingAppointments } from "@/lib/db/appointments";
import { lookupPatient, findOrCreatePatient } from "@/lib/db/patients";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "doctors") {
      const specialty = searchParams.get("specialty") || undefined;
      const doctors = await getDoctors(specialty);
      return NextResponse.json({ doctors });
    }

    if (action === "slots") {
      const doctorId = searchParams.get("doctorId");
      const date = searchParams.get("date");
      if (!doctorId || !date) {
        return NextResponse.json({ error: "doctorId and date are required" }, { status: 400 });
      }
      const slots = await getAvailableSlots(doctorId, date);
      return NextResponse.json({ slots });
    }

    if (action === "patient") {
      const patientId = searchParams.get("patientId");
      if (!patientId) {
        return NextResponse.json({ error: "patientId is required" }, { status: 400 });
      }
      const appointments = await getCustomerAppointments(patientId);
      return NextResponse.json({ appointments });
    }

    if (action === "upcoming") {
      const doctorId = searchParams.get("doctorId") || undefined;
      const appointments = await getUpcomingAppointments(doctorId);
      return NextResponse.json({ appointments });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Appointments GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientEmail,
      patientName,
      patientPhone,
      doctorId,
      appointmentType,
      scheduledAt,
      reason,
      notes,
    } = body;

    if (!patientEmail || !doctorId || !appointmentType || !scheduledAt) {
      return NextResponse.json(
        { error: "patientEmail, doctorId, appointmentType, and scheduledAt are required" },
        { status: 400 }
      );
    }

    // Find or create patient
    const patient = await findOrCreatePatient({
      email: patientEmail,
      name: patientName,
      phone: patientPhone,
    });

    // Create appointment
    const appointment = await createAppointment({
      customerId: patient.id,
      doctorId,
      appointmentType,
      scheduledAt,
      reason,
      notes,
      channel: "self-service",
      aiConfidence: 0.95,
    });

    // TODO: Send confirmation emails to patient and doctor
    // await sendAppointmentConfirmationPatient({ ... });
    // await sendAppointmentConfirmationDoctor({ ... });

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    console.error("Appointments POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
