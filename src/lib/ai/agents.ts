import { openai } from "@ai-sdk/openai";
import { tool } from "ai";
import { z } from "zod";

export const intakeAgent = {
  name: "Intake Agent",
  model: openai("gpt-4o-mini"),
  system: `You are the Intake Agent for SupportFlow AI. Your job is to classify and route incoming customer messages.

When a message arrives, you must:
1. Detect the intent (billing, technical, account, general, feature_request, bug_report)
2. Assign priority (low, medium, high, urgent)
3. Extract key entities (order IDs, email addresses, product names)
4. Determine initial sentiment (positive, neutral, negative, angry)
5. Route to the appropriate next agent

Be fast and accurate. This is the first step in the pipeline.`,
  tools: {
    classifyTicket: tool({
      description: "Classify the ticket by intent, priority, and category",
      inputSchema: z.object({
        intent: z.enum(["billing", "technical", "account", "general", "feature_request", "bug_report"]),
        priority: z.enum(["low", "medium", "high", "urgent"]),
        category: z.string().describe("Specific category within the intent"),
        confidence: z.number().min(0).max(1).describe("Confidence score for classification"),
      }),
      execute: async (params) => {
        return { ...params, classifiedAt: new Date().toISOString() };
      },
    }),
    extractEntities: tool({
      description: "Extract key entities from the message",
      inputSchema: z.object({
        orderIds: z.array(z.string()).describe("Any order IDs mentioned"),
        emailAddresses: z.array(z.string()).describe("Any email addresses mentioned"),
        productNames: z.array(z.string()).describe("Any product names mentioned"),
        accountIds: z.array(z.string()).describe("Any account IDs mentioned"),
        dates: z.array(z.string()).describe("Any dates mentioned"),
      }),
      execute: async (params) => params,
    }),
    detectSentiment: tool({
      description: "Detect the customer's sentiment",
      inputSchema: z.object({
        sentiment: z.enum(["positive", "neutral", "negative", "angry", "frustrated"]),
        score: z.number().min(-1).max(1).describe("Sentiment score from -1 (very negative) to 1 (very positive)"),
        keywords: z.array(z.string()).describe("Keywords that influenced the sentiment score"),
      }),
      execute: async (params) => params,
    }),
  },
};

export const knowledgeAgent = {
  name: "Knowledge Agent",
  model: openai("gpt-4o"),
  system: `You are the Knowledge Agent for SupportFlow AI. Your job is to retrieve relevant information from the knowledge base to help resolve customer issues.

When called, you must:
1. Search the knowledge base for relevant articles
2. Rank results by relevance and recency
3. Synthesize the most useful information
4. Return structured knowledge context for the Resolution Agent

Always cite your sources with article IDs and titles.`,
  tools: {
    searchKnowledgeBase: tool({
      description: "Search the knowledge base for relevant articles",
      inputSchema: z.object({
        query: z.string().describe("Search query"),
        category: z.string().optional().describe("Filter by category"),
        limit: z.number().default(5).describe("Maximum number of results"),
      }),
      execute: async ({ query }) => {
        return {
          results: [],
          query,
          totalResults: 0,
          searchedAt: new Date().toISOString(),
        };
      },
    }),
    getArticle: tool({
      description: "Get a specific knowledge base article by ID",
      inputSchema: z.object({
        articleId: z.string().describe("The article ID"),
      }),
      execute: async ({ articleId }) => {
        return { articleId, found: false };
      },
    }),
  },
};

export const resolutionAgent = {
  name: "Resolution Agent",
  model: openai("gpt-4o"),
  system: `You are the Resolution Agent for SupportFlow AI. Your job is to generate helpful, accurate responses to customer issues.

When generating a response:
1. Use the knowledge base context provided
2. Match the customer's tone (professional but warm)
3. Provide clear, actionable solutions
4. Include relevant links or steps when applicable
5. Offer follow-up if the issue may need more help

Never make up information. If you don't know, say so and escalate.`,
  tools: {
    draftReply: tool({
      description: "Draft a response to the customer",
      inputSchema: z.object({
        message: z.string().describe("The response message"),
        tone: z.enum(["formal", "friendly", "empathetic", "apologetic"]).describe("Tone of the response"),
        includesActionItems: z.boolean().describe("Whether the response includes action items"),
        requiresFollowUp: z.boolean().describe("Whether follow-up is needed"),
      }),
      execute: async (params) => params,
    }),
    executeAction: tool({
      description: "Execute an automated action (e.g., send password reset, issue refund)",
      inputSchema: z.object({
        action: z.string().describe("Action to execute"),
        parameters: z.record(z.string(), z.string()).describe("Action parameters"),
      }),
      execute: async (params) => {
        return { ...params, executed: true, executedAt: new Date().toISOString() };
      },
    }),
  },
};

export const qaAgent = {
  name: "QA Agent",
  model: openai("gpt-4o"),
  system: `You are the QA Agent for SupportFlow AI. Your job is to review AI-generated responses before they reach customers.

Review criteria:
1. Factual accuracy — Is the information correct?
2. Tone check — Is it appropriate and professional?
3. Completeness — Does it fully address the issue?
4. Compliance — Does it follow company policies?
5. Safety — Does it avoid any harmful or inappropriate content?

Output a structured review with pass/fail and specific feedback.`,
  tools: {
    verifyFacts: tool({
      description: "Verify factual accuracy of a response",
      inputSchema: z.object({
        accurate: z.boolean().describe("Whether the response is factually accurate"),
        issues: z.array(z.string()).describe("Any factual issues found"),
        confidence: z.number().min(0).max(1).describe("Confidence in accuracy"),
      }),
      execute: async (params) => params,
    }),
    checkTone: tool({
      description: "Check the tone and professionalism of a response",
      inputSchema: z.object({
        appropriate: z.boolean().describe("Whether the tone is appropriate"),
        suggestions: z.array(z.string()).describe("Suggestions for tone improvement"),
      }),
      execute: async (params) => params,
    }),
    validateCompliance: tool({
      description: "Validate response against compliance rules",
      inputSchema: z.object({
        compliant: z.boolean().describe("Whether the response is compliant"),
        violations: z.array(z.string()).describe("Any compliance violations"),
        riskLevel: z.enum(["low", "medium", "high"]).describe("Risk level if non-compliant"),
      }),
      execute: async (params) => params,
    }),
  },
};

export const escalationAgent = {
  name: "Escalation Agent",
  model: openai("gpt-4o-mini"),
  system: `You are the Escalation Agent for SupportFlow AI. Your job is to determine when and where to escalate tickets to human agents.

Escalation triggers:
- Customer explicitly requests a human
- AI confidence is below threshold
- Issue requires specialized knowledge
- Sentiment is very negative/angry
- Issue is about billing disputes or legal matters

Route to the appropriate team based on skills and availability.`,
  tools: {
    routeToAgent: tool({
      description: "Route the ticket to a specific human agent or team",
      inputSchema: z.object({
        team: z.string().describe("Team to route to"),
        agentId: z.string().optional().describe("Specific agent ID if known"),
        reason: z.string().describe("Reason for escalation"),
        urgency: z.enum(["normal", "urgent", "critical"]).describe("Escalation urgency"),
      }),
      execute: async (params) => params,
    }),
    checkAvailability: tool({
      description: "Check agent/team availability",
      inputSchema: z.object({
        available: z.boolean().describe("Whether agents are available"),
        waitTime: z.string().optional().describe("Estimated wait time"),
        nextAvailable: z.string().optional().describe("When next agent becomes available"),
      }),
      execute: async (params) => params,
    }),
  },
};

export const sentimentAgent = {
  name: "Sentiment Agent",
  model: openai("gpt-4o-mini"),
  system: `You are the Sentiment Agent for SupportFlow AI. Your job is to track and analyze customer emotion throughout conversations.

You must:
1. Analyze sentiment at each message
2. Track sentiment trends over time
3. Detect escalation patterns
4. Alert when sentiment drops below thresholds
5. Provide satisfaction predictions`,
  tools: {
    analyzeSentiment: tool({
      description: "Analyze the sentiment of a message",
      inputSchema: z.object({
        sentiment: z.enum(["positive", "neutral", "negative", "angry", "frustrated"]),
        score: z.number().min(-1).max(1),
        emotions: z.array(z.string()).describe("Detected emotions"),
        triggers: z.array(z.string()).describe("What triggered this sentiment"),
      }),
      execute: async (params) => params,
    }),
    detectTrend: tool({
      description: "Detect sentiment trend over conversation",
      inputSchema: z.object({
        trend: z.enum(["improving", "stable", "declining"]),
        changeRate: z.number().describe("Rate of sentiment change"),
        alertNeeded: z.boolean().describe("Whether an alert should be triggered"),
      }),
      execute: async (params) => params,
    }),
  },
};

export const analyticsAgent = {
  name: "Analytics Agent",
  model: openai("gpt-4o"),
  system: `You are the Analytics Agent for SupportFlow AI. Your job is to generate insights, forecasts, and reports from support data.

You must:
1. Analyze ticket volumes and trends
2. Forecast future demand
3. Identify patterns and anomalies
4. Generate actionable recommendations
5. Track key performance metrics`,
  tools: {
    generateInsight: tool({
      description: "Generate an insight from support data",
      inputSchema: z.object({
        insight: z.string().describe("The insight"),
        category: z.enum(["trend", "anomaly", "recommendation", "forecast"]),
        impact: z.enum(["low", "medium", "high"]).describe("Business impact"),
        dataPoints: z.array(z.string()).describe("Supporting data points"),
      }),
      execute: async (params) => params,
    }),
    forecastVolume: tool({
      description: "Forecast future ticket volume",
      inputSchema: z.object({
        period: z.string().describe("Forecast period (e.g., 'next 7 days')"),
        predicted: z.number().describe("Predicted ticket count"),
        confidence: z.number().min(0).max(1),
        factors: z.array(z.string()).describe("Factors influencing forecast"),
      }),
      execute: async (params) => params,
    }),
  },
};
