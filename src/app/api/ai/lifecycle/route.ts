import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import {
  onboardPatient,
  processRecallQueue,
  getLoyaltyStatus,
  addLoyaltyPoints,
  getPatientJourney,
  recordTouchpoint,
  checkRecallDue,
  sendPostTreatmentCare,
} from "@/lib/ai/lifecycle";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    }

    const journey = await getPatientJourney(customerId);
    const loyalty = await getLoyaltyStatus(customerId);
    const recall = await checkRecallDue(customerId);

    return NextResponse.json({
      journey,
      loyalty,
      recall,
    });
  } catch (error) {
    console.error("Lifecycle GET error:", error);
    return NextResponse.json({ error: "Failed to fetch lifecycle data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action, customerId, points, reason, treatmentType, type, channel, summary } = body;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    const validActions = ["onboard", "recall", "loyalty", "touchpoint", "post_treatment_care"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    switch (action) {
      case "onboard": {
        if (!customerId) {
          return NextResponse.json({ error: "customerId is required for onboard" }, { status: 400 });
        }
        const result = await onboardPatient(customerId);
        return NextResponse.json({ result });
      }

      case "recall": {
        const result = await processRecallQueue();
        return NextResponse.json({ result });
      }

      case "loyalty": {
        if (!customerId) {
          return NextResponse.json({ error: "customerId is required for loyalty" }, { status: 400 });
        }
        if (points && reason) {
          await addLoyaltyPoints(customerId, points, reason);
          const updatedLoyalty = await getLoyaltyStatus(customerId);
          return NextResponse.json({ result: { added: true, loyalty: updatedLoyalty } });
        }
        const loyalty = await getLoyaltyStatus(customerId);
        return NextResponse.json({ result: loyalty });
      }

      case "touchpoint": {
        if (!customerId || !type || !channel || !summary) {
          return NextResponse.json(
            { error: "customerId, type, channel, and summary are required for touchpoint" },
            { status: 400 }
          );
        }
        await recordTouchpoint(customerId, type, channel, summary);
        return NextResponse.json({ result: { recorded: true } });
      }

      case "post_treatment_care": {
        if (!customerId || !treatmentType) {
          return NextResponse.json(
            { error: "customerId and treatmentType are required for post_treatment_care" },
            { status: 400 }
          );
        }
        const result = await sendPostTreatmentCare(customerId, treatmentType);
        return NextResponse.json({ result });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Lifecycle POST error:", error);
    return NextResponse.json({ error: "Failed to process lifecycle action" }, { status: 500 });
  }
}
