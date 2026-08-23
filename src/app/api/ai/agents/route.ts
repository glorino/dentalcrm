import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import {
  createAgentTask,
  getAgentTasks,
  schedulingAgent,
  billingAgent,
  clinicalAgent,
  marketingAgent,
  qualityAgent,
} from "@/lib/ai/agents/autonomous";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const status = searchParams.get("status") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;

    const tasks = await getAgentTasks({ type, status, limit });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Agent queue GET error:", error);
    return NextResponse.json({ error: "Failed to fetch agent tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { type, action, data, priority } = body;

    if (!type || !action) {
      return NextResponse.json(
        { error: "type and action are required" },
        { status: 400 }
      );
    }

    const validTypes = ["scheduling", "billing", "clinical", "marketing", "quality"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const task = await createAgentTask(type, action, data || {}, priority || "medium");

    try {
      let result: any;
      const agentTask = {
        ...task,
        status: "in_progress" as const,
      };

      switch (type) {
        case "scheduling":
          result = await schedulingAgent(agentTask);
          break;
        case "billing":
          result = await billingAgent(agentTask);
          break;
        case "clinical":
          result = await clinicalAgent(agentTask);
          break;
        case "marketing":
          result = await marketingAgent(agentTask);
          break;
        case "quality":
          result = await qualityAgent(agentTask);
          break;
        default:
          result = { error: `Unknown task type: ${type}` };
      }

      await sql`
        UPDATE agent_tasks
        SET status = 'completed', result = ${JSON.stringify(result)}::jsonb, completed_at = NOW()
        WHERE id = ${task.id}
      `;

      return NextResponse.json({
        task: {
          ...task,
          status: "completed",
          result,
          completedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";

      await sql`
        UPDATE agent_tasks
        SET status = 'failed', error = ${errorMsg}, completed_at = NOW()
        WHERE id = ${task.id}
      `;

      return NextResponse.json({
        task: {
          ...task,
          status: "failed",
          error: errorMsg,
          completedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error("Agent queue POST error:", error);
    return NextResponse.json({ error: "Failed to create agent task" }, { status: 500 });
  }
}
