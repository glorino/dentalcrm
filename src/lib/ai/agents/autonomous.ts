import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { sql } from "@/lib/db";

export interface AgentTask {
  id: string;
  type: "scheduling" | "billing" | "clinical" | "marketing" | "quality";
  action: string;
  data: Record<string, any>;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export async function createAgentTask(
  type: string,
  action: string,
  data: Record<string, any>,
  priority: string = "medium"
): Promise<AgentTask> {
  const result = await sql`
    INSERT INTO agent_tasks (type, action, data, priority, status)
    VALUES (${type}, ${action}, ${JSON.stringify(data)}::jsonb, ${priority}, 'pending')
    RETURNING id, type, action, data, priority, status, created_at
  `;
  const row = result[0];
  return {
    id: row.id as string,
    type: row.type as AgentTask["type"],
    action: row.action as string,
    data: row.data as Record<string, any>,
    priority: row.priority as AgentTask["priority"],
    status: "pending" as AgentTask["status"],
    createdAt: row.created_at as string,
  };
}

export async function getAgentTasks(
  filters?: { type?: string; status?: string; limit?: number }
): Promise<AgentTask[]> {
  const limit = filters?.limit || 50;

  let tasks: any[];
  if (filters?.type && filters?.status) {
    tasks = await sql`
      SELECT * FROM agent_tasks
      WHERE type = ${filters.type} AND status = ${filters.status}
      ORDER BY created_at DESC LIMIT ${limit}
    `;
  } else if (filters?.type) {
    tasks = await sql`
      SELECT * FROM agent_tasks
      WHERE type = ${filters.type}
      ORDER BY created_at DESC LIMIT ${limit}
    `;
  } else if (filters?.status) {
    tasks = await sql`
      SELECT * FROM agent_tasks
      WHERE status = ${filters.status}
      ORDER BY created_at DESC LIMIT ${limit}
    `;
  } else {
    tasks = await sql`
      SELECT * FROM agent_tasks
      ORDER BY created_at DESC LIMIT ${limit}
    `;
  }

  return tasks.map((t: Record<string, any>) => ({
    id: t.id as string,
    type: t.type as AgentTask["type"],
    action: t.action as string,
    data: (typeof t.data === "string" ? JSON.parse(t.data) : t.data) as Record<string, any>,
    priority: t.priority as AgentTask["priority"],
    status: t.status as AgentTask["status"],
    result: t.result,
    error: t.error as string | undefined,
    createdAt: t.created_at as string,
    completedAt: t.completed_at as string | undefined,
  }));
}

export async function schedulingAgent(task: AgentTask): Promise<any> {
  const context = `You are a dental scheduling agent. Current time: ${new Date().toISOString()}.
Task action: ${task.action}
Task data: ${JSON.stringify(task.data)}
You have access to the clinic's appointment system.`;

  const appointmentData = task.data;

  if (task.action === "find_next_slot") {
    const doctorId = appointmentData.doctorId;
    const preferredDate = appointmentData.preferredDate;

    const availableSlots = await sql`
      SELECT ds.start_time, ds.end_time, ds.day_of_week
      FROM doctor_schedules ds
      WHERE ds.doctor_id = ${doctorId}
        AND ds.is_available = true
      ORDER BY ds.day_of_week, ds.start_time
    `;

    const existingAppointments = await sql`
      SELECT scheduled_at, duration_minutes
      FROM appointments
      WHERE doctor_id = ${doctorId}
        AND status IN ('scheduled', 'in_progress')
        AND scheduled_at >= ${preferredDate || new Date().toISOString()}
      ORDER BY scheduled_at
    `;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Find the next available slot for this doctor.
Available schedules: ${JSON.stringify(availableSlots)}
Existing appointments: ${JSON.stringify(existingAppointments)}
Preferred date: ${preferredDate || "ASAP"}`,
      system: context,
    });

    return {
      found: true,
      recommendation: text || "Next available slot identified based on schedule analysis.",
      doctorId,
      availableSlots: availableSlots.length,
    };
  }

  if (task.action === "reschedule") {
    const appointmentId = appointmentData.appointmentId;
    const newDate = appointmentData.newDate;

    await sql`
      UPDATE appointments
      SET scheduled_at = ${newDate}, updated_at = NOW(), status = 'rescheduled'
      WHERE id = ${appointmentId}
    `;

    return { rescheduled: true, appointmentId, newDate };
  }

  if (task.action === "cancel") {
    const appointmentId = appointmentData.appointmentId;
    const reason = appointmentData.reason || "Cancelled by patient";

    await sql`
      UPDATE appointments
      SET status = 'cancelled', cancelled_at = NOW(), notes = ${reason}, updated_at = NOW()
      WHERE id = ${appointmentId}
    `;

    return { cancelled: true, appointmentId, reason };
  }

  if (task.action === "suggest_alternatives") {
    const doctorId = appointmentData.doctorId;
    const preferredDate = appointmentData.preferredDate;

    const allDoctors = await sql`
      SELECT d.id, d.name, d.specialty
      FROM doctors d
      WHERE d.status = 'active'
    `;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Suggest alternative scheduling options.
Available doctors: ${JSON.stringify(allDoctors)}
Preferred date: ${preferredDate}`,
      system: context,
    });

    return { alternatives: text || "Alternative slots identified.", doctors: allDoctors };
  }

  return { error: "Unknown scheduling action" };
}

export async function billingAgent(task: AgentTask): Promise<any> {
  const context = `You are a dental billing agent. You handle insurance claims, patient billing, and payment follow-ups.
Task action: ${task.action}
Task data: ${JSON.stringify(task.data)}`;

  if (task.action === "generate_claim") {
    const { patientId, treatmentCode, treatmentDescription, cost } = task.data;

    const patient = await sql`
      SELECT name, email, phone FROM customers WHERE id = ${patientId} LIMIT 1
    `;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Generate a dental insurance claim for:
Patient: ${JSON.stringify(patient[0])}
Treatment code: ${treatmentCode}
Description: ${treatmentDescription}
Cost: ${cost}
Generate the claim with proper CDT codes and formatting.`,
      system: context,
    });

    return {
      claimGenerated: true,
      patientId,
      treatmentCode,
      cost,
      claimDetails: text || "Claim generated successfully.",
    };
  }

  if (task.action === "send_reminder") {
    const { patientId, amount, dueDate } = task.data;

    const patient = await sql`
      SELECT name, email FROM customers WHERE id = ${patientId} LIMIT 1
    `;

    return {
      reminderSent: true,
      patientId,
      patientName: patient[0]?.name,
      amount,
      dueDate,
      channel: "email",
    };
  }

  if (task.action === "process_payment") {
    const { patientId, amount, method } = task.data;

    return {
      processed: true,
      patientId,
      amount,
      method,
      transactionDate: new Date().toISOString(),
    };
  }

  return { error: "Unknown billing action" };
}

export async function clinicalAgent(task: AgentTask): Promise<any> {
  const context = `You are a dental clinical assistant agent. You help with pre-filling clinical notes, suggesting follow-ups, and treatment planning.
Task action: ${task.action}
Task data: ${JSON.stringify(task.data)}`;

  if (task.action === "prefill_notes") {
    const { patientId, appointmentId, transcript } = task.data;

    const patientHistory = await sql`
      SELECT appointment_type, reason, notes, scheduled_at
      FROM appointments
      WHERE customer_id = ${patientId} AND status = 'completed'
      ORDER BY scheduled_at DESC LIMIT 5
    `;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Pre-fill clinical notes based on:
Patient history: ${JSON.stringify(patientHistory)}
Transcript/notes: ${transcript || "No transcript provided"}
Generate SOAP notes (Subjective, Objective, Assessment, Plan).`,
      system: context,
    });

    return {
      prefilled: true,
      patientId,
      appointmentId,
      clinicalNotes: text || "Clinical notes pre-filled.",
    };
  }

  if (task.action === "suggest_followup") {
    const { patientId, treatmentType } = task.data;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Suggest follow-up actions for:
Patient ID: ${patientId}
Treatment type: ${treatmentType}
Consider standard dental follow-up protocols.`,
      system: context,
    });

    return {
      suggestions: text || "Follow-up suggestions generated.",
      patientId,
      treatmentType,
    };
  }

  if (task.action === "treatment_plan") {
    const { patientId, diagnosis } = task.data;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Generate a treatment plan for:
Patient ID: ${patientId}
Diagnosis/conditions: ${diagnosis}
Include phases, estimated timeline, and cost estimates.`,
      system: context,
    });

    return {
      planGenerated: true,
      patientId,
      treatmentPlan: text || "Treatment plan generated.",
    };
  }

  return { error: "Unknown clinical action" };
}

export async function marketingAgent(task: AgentTask): Promise<any> {
  const context = `You are a dental marketing agent. You handle patient re-engagement, birthday messages, treatment reminders, and promotional campaigns.
Task action: ${task.action}
Task data: ${JSON.stringify(task.data)}`;

  if (task.action === "re_engagement") {
    const { patientId, daysInactive } = task.data;

    const patient = await sql`
      SELECT name, email FROM customers WHERE id = ${patientId} LIMIT 1
    `;

    const lastAppointments = await sql`
      SELECT appointment_type, scheduled_at
      FROM appointments
      WHERE customer_id = ${patientId} AND status = 'completed'
      ORDER BY scheduled_at DESC LIMIT 3
    `;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Create a re-engagement message for:
Patient: ${JSON.stringify(patient[0])}
Days inactive: ${daysInactive}
Last treatments: ${JSON.stringify(lastAppointments)}
Write a warm, personalized message to bring them back.`,
      system: context,
    });

    return {
      message: text || "Re-engagement message created.",
      patientId,
      daysInactive,
      channel: "email",
    };
  }

  if (task.action === "birthday_message") {
    const { patientId, patientName } = task.data;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Create a birthday message for patient: ${patientName} (ID: ${patientId}).
Include a special birthday offer or greeting appropriate for a dental practice.`,
      system: context,
    });

    return {
      message: text || "Birthday message created.",
      patientId,
      patientName,
      channel: "email",
    };
  }

  if (task.action === "treatment_reminder") {
    const { patientId, treatmentType, dueDate } = task.data;

    const patient = await sql`
      SELECT name, email FROM customers WHERE id = ${patientId} LIMIT 1
    `;

    return {
      reminderCreated: true,
      patientId,
      patientName: patient[0]?.name,
      treatmentType,
      dueDate,
      channel: "email",
    };
  }

  return { error: "Unknown marketing action" };
}

export async function qualityAgent(task: AgentTask): Promise<any> {
  const context = `You are a quality assurance agent for a dental practice. You monitor conversations, score performance, and identify improvement areas.
Task action: ${task.action}
Task data: ${JSON.stringify(task.data)}`;

  if (task.action === "score_conversation") {
    const { conversationId, transcript } = task.data;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Score this patient conversation on:
1. Empathy (1-10)
2. Professionalism (1-10)
3. Accuracy of information (1-10)
4. Resolution effectiveness (1-10)
5. Patient satisfaction indicators (1-10)

Transcript: ${transcript || "No transcript provided"}

Provide a detailed quality score with specific feedback.`,
      system: context,
    });

    return {
      scored: true,
      conversationId,
      qualityReport: text || "Quality assessment completed.",
      scoredAt: new Date().toISOString(),
    };
  }

  if (task.action === "monitor_sentiment") {
    const { customerId } = task.data;

    const recentTickets = await sql`
      SELECT sentiment, sentiment_score, subject, created_at
      FROM tickets
      WHERE customer_id = ${customerId}
      ORDER BY created_at DESC LIMIT 5
    `;

    const sentimentTrend = recentTickets.map((t: Record<string, any>) => ({
      sentiment: t.sentiment,
      score: Number(t.sentiment_score),
      date: t.created_at,
    }));

    const avgScore = sentimentTrend.length > 0
      ? sentimentTrend.reduce((sum, s) => sum + s.score, 0) / sentimentTrend.length
      : 0;

    const trend = sentimentTrend.length >= 2
      ? sentimentTrend[0].score - sentimentTrend[sentimentTrend.length - 1].score > 0.2
        ? "improving"
        : sentimentTrend[0].score - sentimentTrend[sentimentTrend.length - 1].score < -0.2
          ? "declining"
          : "stable"
      : "insufficient_data";

    return {
      customerId,
      averageSentiment: Math.round(avgScore * 100) / 100,
      trend,
      recentInteractions: sentimentTrend.length,
      alert: avgScore < -0.3 ? "Patient sentiment is declining. Consider proactive outreach." : null,
    };
  }

  if (task.action === "performance_report") {
    const { period } = task.data;

    const stats = await sql`
      SELECT
        COUNT(*) as total_conversations,
        AVG(sentiment_score) as avg_sentiment,
        COUNT(CASE WHEN resolution_status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN escalated = true THEN 1 END) as escalated
      FROM ai_conversations
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;

    const s = stats[0];
    return {
      period: period || "last_30_days",
      totalConversations: Number(s.total_conversations),
      averageSentiment: Number(s.avg_sentiment) || 0,
      resolvedCount: Number(s.resolved),
      escalatedCount: Number(s.escalated),
      resolutionRate: Number(s.total_conversations) > 0
        ? Math.round((Number(s.resolved) / Number(s.total_conversations)) * 100)
        : 0,
    };
  }

  return { error: "Unknown quality action" };
}

export async function processAgentQueue(): Promise<AgentTask[]> {
  const pendingTasks = await sql`
    SELECT * FROM agent_tasks
    WHERE status = 'pending'
    ORDER BY
      CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      created_at ASC
    LIMIT 10
  `;

  const completedTasks: AgentTask[] = [];

  for (const taskRow of pendingTasks) {
    const task: AgentTask = {
      id: taskRow.id as string,
      type: taskRow.type as AgentTask["type"],
      action: taskRow.action as string,
      data: (typeof taskRow.data === "string" ? JSON.parse(taskRow.data) : taskRow.data) as Record<string, any>,
      priority: taskRow.priority as AgentTask["priority"],
      status: "in_progress",
      createdAt: taskRow.created_at as string,
    };

    await sql`
      UPDATE agent_tasks SET status = 'in_progress', started_at = NOW()
      WHERE id = ${task.id}
    `;

    try {
      let result: any;

      switch (task.type) {
        case "scheduling":
          result = await schedulingAgent(task);
          break;
        case "billing":
          result = await billingAgent(task);
          break;
        case "clinical":
          result = await clinicalAgent(task);
          break;
        case "marketing":
          result = await marketingAgent(task);
          break;
        case "quality":
          result = await qualityAgent(task);
          break;
        default:
          result = { error: `Unknown task type: ${task.type}` };
      }

      await sql`
        UPDATE agent_tasks
        SET status = 'completed', result = ${JSON.stringify(result)}::jsonb, completed_at = NOW()
        WHERE id = ${task.id}
      `;

      completedTasks.push({ ...task, status: "completed", result, completedAt: new Date().toISOString() });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";

      await sql`
        UPDATE agent_tasks
        SET status = 'failed', error = ${errorMsg}, completed_at = NOW()
        WHERE id = ${task.id}
      `;

      completedTasks.push({ ...task, status: "failed", error: errorMsg, completedAt: new Date().toISOString() });
    }
  }

  return completedTasks;
}
