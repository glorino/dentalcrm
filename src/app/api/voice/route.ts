import { openai } from "@ai-sdk/openai";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getIndustryFromEnv, getIndustry } from "@/lib/industry/config";
import { lookupPatient, findOrCreatePatient, getPatientHistory } from "@/lib/db/patients";
import { getDoctors, getAvailableSlots, createAppointment } from "@/lib/db/appointments";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { message, history = [] } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json({
      reply: "I'm sorry, the AI service is not configured yet. Please contact our support team directly.",
    });
  }

  const slug = getIndustryFromEnv();
  const config = getIndustry(slug);

  const voiceSystemPrompt = `You are an intelligent AI voice assistant for ${config.name}, a dental clinic support platform.

CRITICAL VOICE RULES:
- Keep responses SHORT: 1-3 sentences max for simple questions, up to 5 sentences for complex ones
- NEVER use markdown, bullet points, or formatting — this is voice, not text
- Speak naturally like a real person having a conversation
- Use conversational transitions: "Well," "So," "Actually," "Let me check that for you"
- Be warm, friendly, and professional — like a helpful dental receptionist
- Dental patients may be anxious — be especially empathetic and reassuring
- If you need to list things, say them naturally: "First... Second... Third..."
- Never say "asterisk" or "dash" or read out any formatting
- For complex information, summarize briefly and offer to help further
- Always end with something helpful or a question to keep the conversation going

YOUR CAPABILITIES:
1. Look up patients by email, phone, or name
2. View patient history (past tickets, appointments)
3. Schedule dental appointments with available doctors
4. Answer common dental questions
5. Create support tickets for complex issues
6. Escalate to human agents when needed

APPOINTMENT TYPES AVAILABLE:
General Checkup, Teeth Cleaning, Filling, Root Canal, Extraction, Orthodontic Consultation, Teeth Whitening, Emergency Dental Care, Follow-up Visit

WORKFLOW:
- First, identify the patient (ask for email, phone, or name)
- Then help with their request (schedule appointment, check history, etc.)
- Confirm details before taking actions
- Always be helpful and reassuring

INDUSTRY CONTEXT:
- Company: ${config.name}
- Contact: ${config.contact.email}
- All currency is in Naira (₦)

Be concise. Be helpful. Be human. Be reassuring.`;

  try {
    const { text, toolResults } = await generateText({
      model: openai("gpt-4o"),
      system: voiceSystemPrompt,
      messages: [
        ...history.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: message },
      ],
      tools: {
        lookupPatient: tool({
          description: "Look up a patient by email, phone number, or name",
          inputSchema: z.object({
            identifier: z.string().describe("Email, phone number, or patient name"),
          }),
          execute: async ({ identifier }) => {
            const patient = await lookupPatient(identifier);
            if (!patient) return { found: false, identifier };
            return {
              found: true,
              id: patient.id,
              name: patient.name,
              email: patient.email,
              phone: patient.phone,
              totalTickets: patient.total_tickets,
            };
          },
        }),

        getPatientHistory: tool({
          description: "Get patient history including tickets and appointments",
          inputSchema: z.object({
            patientId: z.string().describe("Patient ID"),
          }),
          execute: async ({ patientId }) => {
            const history = await getPatientHistory(patientId);
            return {
              recentTickets: history.recentTickets.slice(0, 3).map(t => ({
                number: t.ticket_number,
                subject: t.subject,
                status: t.status,
              })),
              upcomingAppointments: history.upcomingAppointments.slice(0, 2).map(a => ({
                number: a.appointment_number,
                type: a.appointment_type,
                date: a.scheduled_at,
                doctor: a.doctor_name,
              })),
              totalTickets: history.totalTickets,
              lastVisit: history.lastVisit,
            };
          },
        }),

        getDoctors: tool({
          description: "Get list of available dental doctors and their specialties",
          inputSchema: z.object({
            specialty: z.string().optional().describe("Filter by specialty"),
          }),
          execute: async ({ specialty }) => {
            const doctors = await getDoctors(specialty);
            return {
              doctors: doctors.map(d => ({
                id: d.id,
                name: d.name,
                specialty: d.specialty,
              })),
            };
          },
        }),

        getAvailableSlots: tool({
          description: "Get available appointment slots for a doctor on a specific date",
          inputSchema: z.object({
            doctorId: z.string().describe("Doctor ID"),
            date: z.string().describe("Date in YYYY-MM-DD format"),
          }),
          execute: async ({ doctorId, date }) => {
            const slots = await getAvailableSlots(doctorId, date);
            return { slots, date };
          },
        }),

        scheduleAppointment: tool({
          description: "Schedule a dental appointment",
          inputSchema: z.object({
            patientId: z.string().describe("Patient ID"),
            doctorId: z.string().describe("Doctor ID"),
            appointmentType: z.string().describe("Type of appointment"),
            scheduledAt: z.string().describe("DateTime in ISO format"),
            reason: z.string().optional().describe("Reason for visit"),
          }),
          execute: async ({ patientId, doctorId, appointmentType, scheduledAt, reason }) => {
            const patient = await lookupPatient(patientId);
            const doctor = (await sql`SELECT * FROM doctors WHERE id = ${doctorId} LIMIT 1`)[0];

            if (!patient || !doctor) return { success: false, error: "Patient or doctor not found" };

            const apt = await createAppointment({
              customerId: patientId,
              doctorId,
              appointmentType,
              scheduledAt,
              reason,
              channel: "voice",
              aiConfidence: 0.95,
            });

            return {
              success: true,
              appointmentNumber: apt.appointment_number,
              doctorName: doctor.name,
              specialty: doctor.specialty,
              date: scheduledAt,
              patientName: patient.name,
            };
          },
        }),

        searchKnowledgeBase: tool({
          description: "Search the knowledge base for dental articles",
          inputSchema: z.object({
            query: z.string().describe("Search query"),
          }),
          execute: async ({ query }) => {
            try {
              const results = await sql`
                SELECT id, title, content
                FROM knowledge_articles
                WHERE status = 'published'
                  AND (title ILIKE ${`%${query}%`} OR content ILIKE ${`%${query}%`} OR ${query} = ANY(tags))
                ORDER BY views DESC LIMIT 3
              `;
              return {
                results: results.map((r: Record<string, unknown>) => ({
                  title: r.title,
                  content: String(r.content).slice(0, 200),
                })),
              };
            } catch {
              return { results: [] };
            }
          },
        }),

        createTicket: tool({
          description: "Create a support ticket for complex issues",
          inputSchema: z.object({
            patientId: z.string().describe("Patient ID"),
            subject: z.string().describe("Ticket subject"),
            message: z.string().describe("Ticket description"),
            priority: z.enum(["low", "medium", "high", "urgent"]).describe("Priority"),
          }),
          execute: async ({ patientId, subject, message, priority }) => {
            try {
              const count = await sql`SELECT nextval('ticket_seq') as num`;
              const ticketNumber = `DNT-${count[0].num}`;
              const slaDue = new Date(Date.now() + (priority === "urgent" ? 3600000 : priority === "high" ? 7200000 : 14400000));

              await sql`
                INSERT INTO tickets (ticket_number, subject, message, status, priority, channel, customer_id, sla_status, sla_due, tags, ai_confidence)
                VALUES (${ticketNumber}, ${subject}, ${message}, 'open', ${priority}, 'voice', ${patientId}, 'ok', ${slaDue.toISOString()}, ARRAY['voice-agent', 'ai-created'], 90)
              `;
              return { created: true, ticketNumber };
            } catch {
              return { created: false };
            }
          },
        }),

        escalateToHuman: tool({
          description: "Escalate to a human agent when you cannot resolve the issue",
          inputSchema: z.object({
            reason: z.string().describe("Reason for escalation"),
            urgency: z.enum(["normal", "urgent", "critical"]).describe("Urgency level"),
          }),
          execute: async ({ reason, urgency }) => {
            return { escalated: true, reason, urgency, message: "Transferring you to a human agent. Please hold." };
          },
        }),
      },
      stopWhen: stepCountIs(10),
    });

    return Response.json({ reply: text });
  } catch (error) {
    console.error("Voice API error:", error);
    return Response.json({
      reply: "I'm sorry, I encountered an issue. Could you please repeat that?",
    });
  }
}
