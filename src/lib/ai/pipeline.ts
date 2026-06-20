import { openai } from "@ai-sdk/openai";
import { generateText, streamText, stepCountIs } from "ai";
import {
  intakeAgent,
  knowledgeAgent,
  resolutionAgent,
  qaAgent,
  escalationAgent,
  sentimentAgent,
} from "./agents";

export interface TicketContext {
  ticketId: string;
  customerId: string;
  customerName: string;
  message: string;
  channel: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface PipelineResult {
  classification: {
    intent: string;
    priority: string;
    category: string;
    confidence: number;
  };
  sentiment: {
    sentiment: string;
    score: number;
  };
  knowledge: {
    articles: Array<{ id: string; title: string; relevance: number }>;
  };
  response: {
    message: string;
    tone: string;
    requiresFollowUp: boolean;
  };
  qa: {
    passed: boolean;
    issues: string[];
  };
  escalated: boolean;
  escalationReason?: string;
}

export async function runIntakePipeline(ctx: TicketContext): Promise<PipelineResult> {
  const { text: classificationResult } = await generateText({
    model: intakeAgent.model,
    system: intakeAgent.system,
    prompt: `Classify this customer message:

Customer: ${ctx.customerName}
Channel: ${ctx.channel}
Message: "${ctx.message}"

${ctx.history.length > 0 ? `Conversation history:\n${ctx.history.map((h) => `${h.role}: ${h.content}`).join("\n")}` : ""}

Classify the intent, priority, and extract entities.`,
    tools: intakeAgent.tools,
    stopWhen: stepCountIs(3),
  });

  const classification = JSON.parse(classificationResult);

  const { text: sentimentResult } = await generateText({
    model: sentimentAgent.model,
    system: sentimentAgent.system,
    prompt: `Analyze the sentiment of this customer message:

"${ctx.message}"

Provide sentiment score and detect emotions.`,
    tools: sentimentAgent.tools,
    stopWhen: stepCountIs(2),
  });

  const sentiment = JSON.parse(sentimentResult);

  const { text: knowledgeResult } = await generateText({
    model: knowledgeAgent.model,
    system: knowledgeAgent.system,
    prompt: `Find relevant knowledge base articles for this issue:

Intent: ${classification.intent}
Category: ${classification.category}
Message: "${ctx.message}"

Search the knowledge base and return relevant articles.`,
    tools: knowledgeAgent.tools,
    stopWhen: stepCountIs(3),
  });

  const knowledge = JSON.parse(knowledgeResult);

  const shouldEscalate =
    sentiment.score < -0.5 ||
    classification.priority === "urgent" ||
    classification.confidence < 0.6;

  if (shouldEscalate) {
    const { text: escalationResult } = await generateText({
      model: escalationAgent.model,
      system: escalationAgent.system,
      prompt: `This ticket needs escalation:

Intent: ${classification.intent}
Priority: ${classification.priority}
Sentiment: ${sentiment.sentiment} (${sentiment.score})
Confidence: ${classification.confidence}
Message: "${ctx.message}"

Determine the appropriate team and route.`,
      tools: escalationAgent.tools,
      stopWhen: stepCountIs(2),
    });

    const escalation = JSON.parse(escalationResult);

    return {
      classification,
      sentiment,
      knowledge,
      response: {
        message: "Your ticket has been escalated to a specialist who will assist you shortly.",
        tone: "empathetic",
        requiresFollowUp: true,
      },
      qa: { passed: true, issues: [] },
      escalated: true,
      escalationReason: escalation.reason,
    };
  }

  const { text: resolutionResult } = await generateText({
    model: resolutionAgent.model,
    system: resolutionAgent.system,
    prompt: `Generate a response to this customer issue:

Customer: ${ctx.customerName}
Issue: "${ctx.message}"
Intent: ${classification.intent}
Category: ${classification.category}

Knowledge base context:
${JSON.stringify(knowledge, null, 2)}

Draft a helpful, accurate response.`,
    tools: resolutionAgent.tools,
    stopWhen: stepCountIs(3),
  });

  const response = JSON.parse(resolutionResult);

  const { text: qaResult } = await generateText({
    model: qaAgent.model,
    system: qaAgent.system,
    prompt: `Review this AI-generated response for quality:

Customer message: "${ctx.message}"
AI Response: "${response.message}"

Check for factual accuracy, tone, completeness, and compliance.`,
    tools: qaAgent.tools,
    stopWhen: stepCountIs(3),
  });

  const qa = JSON.parse(qaResult);

  return {
    classification,
    sentiment,
    knowledge,
    response,
    qa: { passed: qa.accurate && qa.appropriate && qa.compliant, issues: [...(qa.issues || []), ...(qa.suggestions || []), ...(qa.violations || [])] },
    escalated: false,
  };
}

export async function streamResolution(ctx: TicketContext) {
  const result = streamText({
    model: resolutionAgent.model,
    system: resolutionAgent.system,
    prompt: `Generate a response to this customer issue:

Customer: ${ctx.customerName}
Channel: ${ctx.channel}
Message: "${ctx.message}"

${ctx.history.length > 0 ? `Conversation history:\n${ctx.history.map((h) => `${h.role}: ${h.content}`).join("\n")}` : ""}

Provide a helpful, professional response.`,
    tools: resolutionAgent.tools,
    stopWhen: stepCountIs(3),
  });

  return result;
}
