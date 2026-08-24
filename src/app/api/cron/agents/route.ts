import { NextRequest, NextResponse } from "next/server";
import { processAgentQueue } from "@/lib/ai/agents/autonomous";
import { processRecallQueue } from "@/lib/ai/lifecycle";
import { generatePredictiveAlerts } from "@/lib/ai/predictive";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agentTasks = await processAgentQueue();
    const recallResult = await processRecallQueue();
    const predictiveAlerts = await generatePredictiveAlerts();

    console.log(`[Cron] Agent tasks processed: ${agentTasks.length}`);
    console.log(`[Cron] Recall reminders sent: ${recallResult.remindersSent}`);
    console.log(`[Cron] Predictive alerts generated: ${predictiveAlerts.length}`);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      agentTasksProcessed: agentTasks.length,
      recallRemindersSent: recallResult.remindersSent,
      patientsContacted: recallResult.patientsContacted,
      predictiveAlerts: predictiveAlerts.length,
    });
  } catch (error) {
    console.error("[Cron] Agent cron error:", error);
    return NextResponse.json({ error: "Agent cron failed" }, { status: 500 });
  }
}
