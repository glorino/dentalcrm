import { openai } from "@ai-sdk/openai";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getIndustryFromEnv, getIndustry } from "@/lib/industry/config";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

async function dbQuery(query: string, params?: unknown[]): Promise<any[]> {
  try {
    const result = params ? await sql(query, params) : await sql(query);
    return result as any[];
  } catch (e: any) {
    console.error("[DB] Query failed:", e?.message || e);
    console.error("[DB] Query:", query.slice(0, 200));
    if (params) console.error("[DB] Params:", JSON.stringify(params));
    return [];
  }
}

export async function POST(req: Request) {
  const { message, history = [] } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json({
      reply: "The AI service is not configured yet. Please contact our support team directly.",
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

Be concise. Be helpful. Be human. Be reassuring.`;

  try {
    const { text } = await generateText({
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
            try {
              const like = `%${identifier}%`;
              const results = await dbQuery(
                `SELECT id, name, email, phone, total_tickets FROM customers WHERE email ILIKE $1 OR phone ILIKE $1 OR name ILIKE $1 LIMIT 1`,
                [like]
              );
              if (results.length === 0) return { found: false, identifier };
              const p = results[0];
              return { found: true, id: p.id, name: p.name, email: p.email, phone: p.phone, totalTickets: p.total_tickets };
            } catch {
              return { found: false, identifier };
            }
          },
        }),

        getPatientHistory: tool({
          description: "Get patient history including tickets and appointments",
          inputSchema: z.object({
            patientId: z.string().describe("Patient ID"),
          }),
          execute: async ({ patientId }) => {
            try {
              const tickets = await dbQuery(
                `SELECT ticket_number, subject, status FROM tickets WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 3`,
                [patientId]
              );
              const total = await dbQuery(
                `SELECT COUNT(*) as cnt FROM tickets WHERE customer_id = $1`,
                [patientId]
              );
              let appointments: any[] = [];
              try {
                appointments = await dbQuery(
                  `SELECT a.appointment_number, a.appointment_type, a.scheduled_at, d.name as doctor_name
                   FROM appointments a JOIN doctors d ON a.doctor_id = d.id
                   WHERE a.customer_id = $1 AND a.scheduled_at >= NOW() AND a.status IN ('scheduled','confirmed')
                   ORDER BY a.scheduled_at ASC LIMIT 2`,
                  [patientId]
                );
              } catch {}
              return {
                recentTickets: tickets.map((t: any) => ({ number: t.ticket_number, subject: t.subject, status: t.status })),
                upcomingAppointments: appointments.map((a: any) => ({ number: a.appointment_number, type: a.appointment_type, date: a.scheduled_at, doctor: a.doctor_name })),
                totalTickets: Number(total[0]?.cnt) || 0,
              };
            } catch {
              return { recentTickets: [], upcomingAppointments: [], totalTickets: 0 };
            }
          },
        }),

        getDoctors: tool({
          description: "Get list of available dental doctors and their specialties",
          inputSchema: z.object({
            specialty: z.string().optional().describe("Filter by specialty"),
          }),
          execute: async ({ specialty }) => {
            try {
              let results;
              if (specialty) {
                const like = `%${specialty}%`;
                results = await dbQuery(
                  `SELECT id, name, specialty FROM doctors WHERE status = 'active' AND specialty ILIKE $1 ORDER BY name`,
                  [like]
                );
              } else {
                results = await dbQuery(
                  `SELECT id, name, specialty FROM doctors WHERE status = 'active' ORDER BY name`
                );
              }
              return { doctors: results.map((d: any) => ({ id: d.id, name: d.name, specialty: d.specialty })) };
            } catch {
              return { doctors: [] };
            }
          },
        }),

        getAvailableSlots: tool({
          description: "Get available appointment slots for a doctor on a specific date",
          inputSchema: z.object({
            doctorId: z.string().describe("Doctor ID"),
            date: z.string().describe("Date in YYYY-MM-DD format"),
          }),
          execute: async ({ doctorId, date }) => {
            try {
              const dateObj = new Date(date);
              const dayOfWeek = dateObj.getDay();
              const schedule = await dbQuery(
                `SELECT start_time, end_time FROM doctor_schedules WHERE doctor_id = $1 AND day_of_week = $2 AND is_available = TRUE`,
                [doctorId, dayOfWeek]
              );
              if (schedule.length === 0) return { slots: [], date, message: "No availability on this date" };
              const doctor = await dbQuery(`SELECT consultation_duration_minutes FROM doctors WHERE id = $1 LIMIT 1`, [doctorId]);
              const duration = doctor[0]?.consultation_duration_minutes || 30;
              const existing = await dbQuery(
                `SELECT scheduled_at, duration_minutes FROM appointments WHERE doctor_id = $1 AND DATE(scheduled_at) = $2 AND status IN ('scheduled','confirmed')`,
                [doctorId, date]
              );
              const slots: { time: string; available: boolean }[] = [];
              for (const sched of schedule) {
                const [startH, startM] = (sched.start_time as string).split(":").map(Number);
                const [endH, endM] = (sched.end_time as string).split(":").map(Number);
                let cur = startH * 60 + startM;
                const end = endH * 60 + endM;
                while (cur + duration <= end) {
                  const t = `${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`;
                  const slotDT = new Date(`${date}T${t}:00`);
                  const booked = existing.some((a: any) => {
                    const aT = new Date(a.scheduled_at);
                    const aE = new Date(aT.getTime() + ((a.duration_minutes as number) || 30) * 60000);
                    return slotDT >= aT && slotDT < aE;
                  });
                  slots.push({ time: t, available: !booked });
                  cur += duration;
                }
              }
              return { slots, date };
            } catch {
              return { slots: [], date };
            }
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
            try {
              const patient = await dbQuery(`SELECT id, name, email FROM customers WHERE id = $1 LIMIT 1`, [patientId]);
              const doctor = await dbQuery(`SELECT id, name, specialty FROM doctors WHERE id = $1 LIMIT 1`, [doctorId]);
              if (!patient[0] || !doctor[0]) return { success: false, error: "Patient or doctor not found" };
              const count = await dbQuery(`SELECT nextval('appointment_seq') as num`);
              const aptNum = `APT-${count[0]?.num || Date.now()}`;
              await dbQuery(
                `INSERT INTO appointments (appointment_number, customer_id, doctor_id, appointment_type, reason, scheduled_at, status, channel, ai_confidence)
                 VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', 'voice', 0.95)`,
                [aptNum, patientId, doctorId, appointmentType, reason || null, scheduledAt]
              );
              return {
                success: true,
                appointmentNumber: aptNum,
                doctorName: doctor[0].name,
                specialty: doctor[0].specialty,
                date: scheduledAt,
                patientName: patient[0].name,
              };
            } catch (e) {
              return { success: false, error: "Failed to schedule appointment" };
            }
          },
        }),

        searchKnowledgeBase: tool({
          description: "Search the knowledge base for dental articles",
          inputSchema: z.object({
            query: z.string().describe("Search query"),
          }),
          execute: async ({ query }) => {
            try {
              const like = `%${query}%`;
              const results = await dbQuery(
                `SELECT title, content FROM knowledge_articles WHERE status = 'published' AND (title ILIKE $1 OR content ILIKE $1) ORDER BY views DESC LIMIT 3`,
                [like]
              );
              return { results: results.map((r: any) => ({ title: r.title, content: String(r.content).slice(0, 200) })) };
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
              const count = await dbQuery(`SELECT nextval('ticket_seq') as num`);
              const ticketNumber = `DNT-${count[0]?.num || Date.now()}`;
              const slaDue = new Date(Date.now() + (priority === "urgent" ? 3600000 : priority === "high" ? 7200000 : 14400000));
              await dbQuery(
                `INSERT INTO tickets (ticket_number, subject, message, status, priority, channel, customer_id, sla_status, sla_due, tags, ai_confidence)
                 VALUES ($1, $2, $3, 'open', $4, 'voice', $5, 'ok', $6, ARRAY['voice-agent','ai-created'], 90)`,
                [ticketNumber, subject, message, priority, patientId, slaDue.toISOString()]
              );
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
  } catch (error: any) {
    console.error("Voice API error:", error?.message, error?.cause);
    return Response.json({
      reply: "I'm sorry, I encountered an issue. Could you please repeat that?",
    });
  }
}
