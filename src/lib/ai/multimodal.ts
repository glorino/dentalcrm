import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { sql } from "@/lib/db";

// Analyze a dental X-ray image (accepts base64 or URL)
export async function analyzeXray(imageBase64: string): Promise<{
  findings: {condition: string, confidence: number, severity: string, location: string}[];
  overallScore: number;
  recommendations: string[];
  needsUrgentCare: boolean;
}> {
  const imageUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const { text } = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: imageUrl,
          },
          {
            type: "text",
            text: `You are an expert dental radiologist AI. Analyze this dental X-ray image and provide a detailed assessment.

For each finding, provide:
- condition: The dental condition detected (e.g., "cavity", "periodontal disease", "bone loss", "impacted tooth", "root canal issue", "wisdom tooth", "cysts", "fracture")
- confidence: A number 0-100 indicating how confident you are
- severity: "low", "moderate", "high", or "critical"
- location: The specific tooth or area (e.g., "upper left molar #14", "lower right wisdom tooth #32")

Also provide:
- overallScore: 0-100 dental health score (100 being perfect health)
- recommendations: List of recommended actions
- needsUrgentCare: Whether immediate dental attention is needed

Respond in JSON format only.`,
          },
        ],
      },
    ],
    temperature: 0.1,
  });

  try {
    const jsonMatch = text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      await sql`
        INSERT INTO xray_analyses (findings, overall_score, recommendations, needs_urgent_care)
        VALUES (
          ${JSON.stringify(parsed.findings || [])}::jsonb,
          ${parsed.overallScore || 0},
          ${parsed.recommendations || []},
          ${parsed.needsUrgentCare || false}
        )
      `;

      return {
        findings: parsed.findings || [],
        overallScore: parsed.overallScore || 0,
        recommendations: parsed.recommendations || [],
        needsUrgentCare: parsed.needsUrgentCare || false,
      };
    }
  } catch {}

  return {
    findings: [],
    overallScore: 50,
    recommendations: ["Unable to analyze X-ray. Please consult with your dentist."],
    needsUrgentCare: false,
  };
}

// Extract data from a document (insurance card, prescription, lab result)
export async function extractDocumentData(
  documentBase64: string,
  documentType: "insurance_card" | "prescription" | "lab_result" | "id_card"
): Promise<Record<string, any>> {
  const prompts: Record<string, string> = {
    insurance_card: `Extract all information from this dental insurance card. Include:
- Insurance company name
- Member name
- Member/subscriber ID
- Group number
- Plan type
- Copay amounts (preventive, basic, major)
- Annual maximum
- Deductible
- Effective dates
- Customer service phone number
Respond in JSON format only.`,
    prescription: `Extract all information from this dental prescription. Include:
- Patient name
- Prescribing doctor
- Medication name and dosage
- Frequency and duration
- Instructions
- Date prescribed
- Refills remaining
Respond in JSON format only.`,
    lab_result: `Extract all information from this dental lab result. Include:
- Patient name
- Test type
- Date of test
- Results/findings
- Reference ranges
- Any flagged abnormal values
- Ordering dentist
Respond in JSON format only.`,
    id_card: `Extract all information from this ID card. Include:
- Full name
- Date of birth
- ID number
- Address
- Expiration date
- Photo description
Respond in JSON format only.`,
  };

  const imageUrl = documentBase64.startsWith("data:")
    ? documentBase64
    : `data:image/jpeg;base64,${documentBase64}`;

  const { text } = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: imageUrl,
          },
          {
            type: "text",
            text: prompts[documentType],
          },
        ],
      },
    ],
    temperature: 0.1,
  });

  try {
    const jsonMatch = text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {}

  return { error: "Unable to extract data from document", documentType };
}

// Compare before/after treatment photos
export async function compareTreatmentPhotos(
  beforeBase64: string,
  afterBase64: string
): Promise<{
  improvement: number;
  areas: {area: string, beforeScore: number, afterScore: number, change: string}[];
  summary: string;
}> {
  const beforeUrl = beforeBase64.startsWith("data:")
    ? beforeBase64
    : `data:image/jpeg;base64,${beforeBase64}`;
  const afterUrl = afterBase64.startsWith("data:")
    ? afterBase64
    : `data:image/jpeg;base64,${afterBase64}`;

  const { text } = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: beforeUrl,
          },
          {
            type: "image",
            image: afterUrl,
          },
          {
            type: "text",
            text: `Compare these two dental photos. The first is BEFORE treatment, the second is AFTER treatment.

For each area of the mouth that shows change, provide:
- area: The specific area (e.g., "upper front teeth", "lower left molars")
- beforeScore: 0-100 rating of that area in the before photo
- afterScore: 0-100 rating of that area in the after photo
- change: Description of what changed (e.g., "significant improvement", "whitening achieved", "alignment improved")

Also provide:
- improvement: Overall improvement percentage (0-100)
- summary: A patient-friendly summary of the treatment results

Respond in JSON format only.`,
          },
        ],
      },
    ],
    temperature: 0.2,
  });

  try {
    const jsonMatch = text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        improvement: parsed.improvement || 0,
        areas: parsed.areas || [],
        summary: parsed.summary || "Treatment comparison completed.",
      };
    }
  } catch {}

  return {
    improvement: 0,
    areas: [],
    summary: "Unable to compare photos. Please consult with your dentist.",
  };
}

// Generate clinical notes from conversation transcript
export async function generateClinicalNotes(
  transcript: string,
  patientHistory: string
): Promise<{
  chiefComplaint: string;
  historyOfPresentIllness: string;
  assessment: string;
  plan: string;
  followUp: string;
}> {
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `You are an expert dental clinical documentation assistant. Generate professional SOAP-format clinical notes from the provided patient conversation transcript and history.

Use proper dental terminology. Be thorough but concise. Follow standard dental documentation practices.`,
    prompt: `Patient History:
${patientHistory || "No prior history available."}

Conversation Transcript:
${transcript}

Generate clinical notes in the following format:
- Chief Complaint: The patient's main concern in their own words
- History of Present Illness: When it started, symptoms, aggravating/alleviating factors
- Assessment: Your clinical assessment based on the conversation
- Plan: Treatment plan, procedures recommended
- Follow-up: Follow-up instructions and timeline`,
    temperature: 0.3,
  });

  try {
    const extractSection = (label: string): string => {
      const regex = new RegExp(`${label}[:\\s]*([\\s\\S]*?)(?=\\n\\s*(?:History|Assessment|Plan|Follow|$))`, "i");
      const match = text?.match(regex);
      return match ? match[1].trim() : "";
    };

    return {
      chiefComplaint: extractSection("Chief Complaint") || extractSection("CC"),
      historyOfPresentIllness: extractSection("History of Present Illness") || extractSection("HPI"),
      assessment: extractSection("Assessment") || extractSection("Objective"),
      plan: extractSection("Plan"),
      followUp: extractSection("Follow-up") || extractSection("Follow Up"),
    };
  } catch {}

  return {
    chiefComplaint: "Unable to generate from transcript",
    historyOfPresentIllness: "",
    assessment: "",
    plan: "",
    followUp: "",
  };
}
