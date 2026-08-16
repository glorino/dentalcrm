import { openai } from "@ai-sdk/openai";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { sql } from "@/lib/db";
import { lookupPatient, findOrCreatePatient, getPatientHistory, PatientHistory } from "@/lib/db/patients";
import { getDoctors, getAvailableSlots, createAppointment, getUpcomingAppointments } from "@/lib/db/appointments";

export interface SelfServiceContext {
  channel: "voice" | "chat" | "whatsapp";
  patientIdentifier?: string;
  patientId?: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface SelfServiceResult {
  resolved: boolean;
  escalated: boolean;
  appointmentScheduled: boolean;
  response: string;
  ticketNumber?: string;
  appointmentNumber?: string;
  escalationReason?: string;
  patientFound: boolean;
}

const systemPrompt = `You are an intelligent AI self-service agent for DentalCRM, a dental clinic support platform.

Your capabilities:
1. Look up patients by email, phone number, or name
2. View patient history (past tickets, appointments, treatments)
3. Schedule dental appointments with available doctors
4. Resolve common issues (appointment questions, treatment info, insurance queries)
5. Escalate complex issues to human agents

Response guidelines:
- Be warm, professional, and empathetic (dental patients may be anxious)
- Always identify the patient first before taking actions
- Confirm details before booking appointments
- If you can resolve the issue, do so automatically
- If the issue is complex, escalate to a human agent
- Keep responses concise but helpful
- Never make up information — use the tools to get real data

Appointment types you can book:
- General Checkup
- Teeth Cleaning
- Filling
- Root Canal
- Extraction
- Orthodontic Consultation
- Teeth Whitening
- Emergency Dental Care
- Follow-up Visit`;

const tools = {
  lookupPatient: tool({
    description: "Look up a patient by email, phone number, or name. Use this to identify the patient.",
    inputSchema: z.object({
      identifier: z.string().describe("Email, phone number, or patient name"),
    }),
    execute: async ({ identifier }) => {
      const patient = await lookupPatient(identifier);
      if (!patient) return { found: false, identifier };
      return {
        found: true,
        patient: {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          totalTickets: patient.total_tickets,
          memberSince: patient.created_at,
        },
      };
    },
  }),

  getPatientHistory: tool({
    description: "Get full patient history including past tickets, appointments, and treatment records.",
    inputSchema: z.object({
      patientId: z.string().describe("The patient's ID"),
    }),
    execute: async ({ patientId }) => {
      const history = await getPatientHistory(patientId);
      return {
        patient: history.patient ? {
          name: history.patient.name,
          email: history.patient.email,
        } : null,
        recentTickets: history.recentTickets.map(t => ({
          number: t.ticket_number,
          subject: t.subject,
          status: t.status,
          date: t.created_at,
        })),
        upcomingAppointments: history.upcomingAppointments.map(a => ({
          number: a.appointment_number,
          type: a.appointment_type,
          date: a.scheduled_at,
          doctor: a.doctor_name,
        })),
        stats: {
          totalTickets: history.totalTickets,
          totalResolved: history.totalResolved,
          lastVisit: history.lastVisit,
        },
      };
    },
  }),

  getAvailableDoctors: tool({
    description: "Get list of available doctors and their specialties.",
    inputSchema: z.object({
      specialty: z.string().optional().describe("Filter by specialty (e.g., Orthodontics, Oral Surgery)"),
    }),
    execute: async ({ specialty }) => {
      const doctors = await getDoctors(specialty);
      return {
        doctors: doctors.map(d => ({
          id: d.id,
          name: d.name,
          specialty: d.specialty,
          consultationDuration: d.consultation_duration_minutes,
        })),
      };
    },
  }),

  getAvailableSlots: tool({
    description: "Get available appointment slots for a specific doctor on a specific date.",
    inputSchema: z.object({
      doctorId: z.string().describe("The doctor's ID"),
      date: z.string().describe("Date in YYYY-MM-DD format"),
    }),
    execute: async ({ doctorId, date }) => {
      const slots = await getAvailableSlots(doctorId, date);
      return { slots, date, doctorId };
    },
  }),

  scheduleAppointment: tool({
    description: "Schedule a dental appointment for a patient.",
    inputSchema: z.object({
      patientId: z.string().describe("Patient ID"),
      doctorId: z.string().describe("Doctor ID"),
      appointmentType: z.string().describe("Type of appointment"),
      scheduledAt: z.string().describe("DateTime in ISO format"),
      reason: z.string().optional().describe("Reason for appointment"),
      notes: z.string().optional().describe("Additional notes"),
    }),
    execute: async ({ patientId, doctorId, appointmentType, scheduledAt, reason, notes }) => {
      const patient = await lookupPatient(patientId);
      const doctor = (await sql`SELECT * FROM doctors WHERE id = ${doctorId} LIMIT 1`)[0];

      if (!patient || !doctor) {
        return { success: false, error: "Patient or doctor not found" };
      }

      const appointment = await createAppointment({
        customerId: patientId,
        doctorId,
        appointmentType,
        reason,
        scheduledAt,
        channel: "self-service",
        aiConfidence: 0.95,
        notes,
      });

      return {
        success: true,
        appointmentNumber: appointment.appointment_number,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        date: scheduledAt,
        patientName: patient.name,
        patientEmail: patient.email,
        patientPhone: patient.phone,
      };
    },
  }),

  createTicket: tool({
    description: "Create a support ticket for issues that need follow-up.",
    inputSchema: z.object({
      patientId: z.string().describe("Patient ID"),
      subject: z.string().describe("Brief subject line"),
      message: z.string().describe("Detailed description"),
      priority: z.enum(["low", "medium", "high", "urgent"]).describe("Ticket priority"),
    }),
    execute: async ({ patientId, subject, message, priority }) => {
      const count = await sql`SELECT nextval('ticket_seq') as num`;
      const ticketNumber = `DNT-${count[0].num}`;
      const slaDue = new Date(Date.now() + (priority === "urgent" ? 3600000 : priority === "high" ? 7200000 : 14400000));

      await sql`
        INSERT INTO tickets (ticket_number, subject, message, status, priority, channel, customer_id, sla_status, sla_due, tags, ai_confidence)
        VALUES (${ticketNumber}, ${subject}, ${message}, 'open', ${priority}, 'self-service', ${patientId}, 'ok', ${slaDue.toISOString()}, ARRAY['ai-created', 'self-service'], 90)
      `;

      return { success: true, ticketNumber, subject, priority };
    },
  }),

  escalateToHuman: tool({
    description: "Escalate the conversation to a human agent when the AI cannot resolve the issue.",
    inputSchema: z.object({
      reason: z.string().describe("Reason for escalation"),
      urgency: z.enum(["normal", "urgent", "critical"]).describe("Escalation urgency"),
    }),
    execute: async ({ reason, urgency }) => {
      return { escalated: true, reason, urgency, message: "A human agent will be with you shortly." };
    },
  }),
};

export async function runSelfServicePipeline(ctx: SelfServiceContext): Promise<SelfServiceResult> {
  const userMessage = ctx.conversationHistory[ctx.conversationHistory.length - 1]?.content || "";

  const { text, toolResults } = await generateText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: ctx.conversationHistory.map(m => ({
      role: m.role,
      content: m.content,
    })),
    tools,
    stopWhen: stepCountIs(10),
  });

  let resolved = false;
  let escalated = false;
  let appointmentScheduled = false;
  let ticketNumber: string | undefined;
  let appointmentNumber: string | undefined;
  let escalationReason: string | undefined;
  let patientFound = false;

  for (const result of toolResults) {
    if (result.toolName === "lookupPatient" && (result.output as any)?.found) {
      patientFound = true;
    }
    if (result.toolName === "scheduleAppointment" && (result.output as any)?.success) {
      appointmentScheduled = true;
      appointmentNumber = (result.output as any).appointmentNumber;
    }
    if (result.toolName === "createTicket" && (result.output as any)?.success) {
      ticketNumber = (result.output as any).ticketNumber;
    }
    if (result.toolName === "escalateToHuman") {
      escalated = true;
      escalationReason = (result.output as any).reason;
    }
  }

  if (appointmentScheduled || ticketNumber) {
    resolved = true;
  }
  if (escalated) {
    resolved = false;
  }

  return {
    resolved,
    escalated,
    appointmentScheduled,
    response: text,
    ticketNumber,
    appointmentNumber,
    escalationReason,
    patientFound,
  };
}

export async function streamSelfServiceResponse(ctx: SelfServiceContext) {
  const { text, toolResults } = await generateText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: ctx.conversationHistory.map(m => ({
      role: m.role,
      content: m.content,
    })),
    tools,
    stopWhen: stepCountIs(10),
  });

  let appointmentData: any = null;

  for (const result of toolResults) {
    if (result.toolName === "scheduleAppointment" && (result.output as any)?.success) {
      appointmentData = result.output;
    }
  }

  return { response: text, appointmentData };
}
