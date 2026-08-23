import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import {
  analyzeXray,
  extractDocumentData,
  compareTreatmentPhotos,
  generateClinicalNotes,
} from "@/lib/ai/multimodal";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action, imageBase64, documentBase64, documentType, beforeBase64, afterBase64, transcript, patientId } = body;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    const validActions = ["analyze_xray", "extract_document", "compare_photos", "generate_notes"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    switch (action) {
      case "analyze_xray": {
        if (!imageBase64) {
          return NextResponse.json({ error: "imageBase64 is required for analyze_xray" }, { status: 400 });
        }
        const xrayResult = await analyzeXray(imageBase64);
        return NextResponse.json({ result: xrayResult });
      }

      case "extract_document": {
        if (!documentBase64) {
          return NextResponse.json({ error: "documentBase64 is required for extract_document" }, { status: 400 });
        }
        if (!documentType) {
          return NextResponse.json({ error: "documentType is required for extract_document" }, { status: 400 });
        }
        const validDocTypes = ["insurance_card", "prescription", "lab_result", "id_card"];
        if (!validDocTypes.includes(documentType)) {
          return NextResponse.json(
            { error: `Invalid documentType. Must be one of: ${validDocTypes.join(", ")}` },
            { status: 400 }
          );
        }
        const docResult = await extractDocumentData(documentBase64, documentType);
        return NextResponse.json({ result: docResult });
      }

      case "compare_photos": {
        if (!beforeBase64 || !afterBase64) {
          return NextResponse.json({ error: "beforeBase64 and afterBase64 are required for compare_photos" }, { status: 400 });
        }
        const photoResult = await compareTreatmentPhotos(beforeBase64, afterBase64);
        return NextResponse.json({ result: photoResult });
      }

      case "generate_notes": {
        if (!transcript) {
          return NextResponse.json({ error: "transcript is required for generate_notes" }, { status: 400 });
        }
        const notesResult = await generateClinicalNotes(transcript, patientId || "");
        return NextResponse.json({ result: notesResult });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Multi-modal API error:", error);
    return NextResponse.json({ error: "Failed to process multi-modal request" }, { status: 500 });
  }
}
