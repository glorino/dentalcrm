# SupportFlow AI — Agent Orchestration Architecture

> Multi-Agent AI System Built on OpenAI Agents SDK

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATION LAYER                              │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    ORCHESTRATOR                                  │    │
│  │                                                                  │    │
│  │  Input: Raw message + Customer context + Conversation history   │    │
│  │  Output: Agent pipeline execution trace + Final response        │    │
│  │                                                                  │    │
│  │  Responsibilities:                                              │    │
│  │  • Route message to appropriate agent pipeline                 │    │
│  │  • Manage agent handoffs                                       │    │
│  │  • Enforce guardrails                                          │    │
│  │  • Track token usage and costs                                 │    │
│  │  • Log all traces for observability                            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    AGENT PIPELINES                               │    │
│  │                                                                  │    │
│  │  Pipeline 1: Auto-Resolution (default)                          │    │
│  │  ┌─────────┐   ┌─────────────┐   ┌───────────┐   ┌─────────┐│    │
│  │  │ Intake  │──▶│  Knowledge  │──▶│Resolution │──▶│   QA    ││    │
│  │  │ Agent   │   │  Agent      │   │  Agent    │   │  Agent  ││    │
│  │  └─────────┘   └─────────────┘   └───────────┘   └─────────┘│    │
│  │                                                                  │    │
│  │  Pipeline 2: Human-Assisted                                     │    │
│  │  ┌─────────┐   ┌─────────────┐   ┌───────────┐              │    │
│  │  │ Intake  │──▶│  Sentiment  │──▶│Escalation │──▶ Human     │    │
│  │  │ Agent   │   │  Agent      │   │  Agent    │              │    │
│  │  └─────────┘   └─────────────┘   └───────────┘              │    │
│  │                                                                  │    │
│  │  Pipeline 3: Knowledge-Only                                     │    │
│  │  ┌─────────┐   ┌─────────────┐                              │    │
│  │  │ Intake  │──▶│  Knowledge  │──▶ Return articles to human   │    │
│  │  │ Agent   │   │  Agent      │                              │    │
│  │  └─────────┘   └─────────────┘                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Agent Definitions

### 2.1 Intake Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTAKE AGENT                                   │
│                                                                  │
│  Role: First point of contact for all inbound messages          │
│                                                                  │
│  Model: GPT-4o-mini (fast, cost-effective)                     │
│                                                                  │
│  Inputs:                                                        │
│  ├── Raw message content                                       │
│  ├── Channel (web, whatsapp, email, etc.)                      │
│  ├── Sender metadata (customer profile if exists)              │
│  └── Conversation history (last 5 messages)                    │
│                                                                  │
│  Outputs:                                                       │
│  ├── intent: string (e.g., 'billing_inquiry', 'bug_report')   │
│  ├── category: string (e.g., 'billing', 'technical', 'general')│
│  ├── subcategory: string                                       │
│  ├── priority: 'low' | 'medium' | 'high' | 'urgent'          │
│  ├── language: string (ISO 639-1)                              │
│  ├── sentiment: 'positive' | 'neutral' | 'negative' | 'angry' │
│  ├── confidence: float (0-1)                                   │
│  ├── requires_human: boolean                                   │
│  ├── suggested_team: string                                    │
│  └── extracted_entities: object                                │
│       ├── order_id: string                                     │
│       ├── product_name: string                                 │
│       ├── error_code: string                                   │
│       └── account_id: string                                   │
│                                                                  │
│  Tools:                                                         │
│  ├── classify_intent    → ML-based intent classification       │
│  ├── extract_entities   → Named entity recognition              │
│  ├── lookup_customer    → Customer profile retrieval            │
│  └── get_conversation   → Previous conversation context         │
│                                                                  │
│  Decision Logic:                                                │
│  ├── High confidence (>0.8) → Auto-route                       │
│  ├── Medium confidence (0.5-0.8) → Route with review           │
│  └── Low confidence (<0.5) → Escalate to human                 │
│                                                                  │
│  Handoff To: Knowledge Agent, Sentiment Agent, Escalation Agent│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Knowledge Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE AGENT                                │
│                                                                  │
│  Role: Retrieve and rank relevant knowledge base articles       │
│                                                                  │
│  Model: GPT-4o (for RAG reasoning)                             │
│                                                                  │
│  Inputs:                                                        │
│  ├── Classified intent + category from Intake Agent             │
│  ├── Original message content                                  │
│  ├── Customer context (plan, history)                          │
│  └── Tenant's knowledge base                                   │
│                                                                  │
│  Outputs:                                                       │
│  ├── relevant_articles: Array<{                                │
│  │     id, title, summary, relevance_score,                    │
│  │     key_points, full_content                                │
│  │   }>                                                         │
│  ├── generated_context: string (synthesized context)           │
│  ├── confidence: float                                         │
│  └── needs_more_info: boolean                                  │
│                                                                  │
│  Tools:                                                         │
│  ├── semantic_search     → pgvector similarity search           │
│  ├── keyword_search      → PostgreSQL full-text search          │
│  ├── get_article         → Full article retrieval               │
│  ├── get_article_stats   → View/helpful counts                 │
│  └── get_similar_tickets → Historical ticket patterns           │
│                                                                  │
│  Search Strategy (Hybrid):                                     │
│  ├── Step 1: Semantic search (top 10 by embedding similarity)  │
│  ├── Step 2: Keyword search (full-text on title + content)     │
│  ├── Step 3: Merge + re-rank with GPT-4o                      │
│  ├── Step 4: Filter by tenant, language, published status      │
│  └── Step 5: Return top 5 with relevance scores                │
│                                                                  │
│  Handoff To: Resolution Agent                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Resolution Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESOLUTION AGENT                               │
│                                                                  │
│  Role: Generate appropriate response or execute resolution      │
│                                                                  │
│  Model: GPT-4o (complex reasoning + generation)                │
│                                                                  │
│  Inputs:                                                        │
│  ├── Intent + category from Intake Agent                       │
│  ├── Knowledge context from Knowledge Agent                    │
│  ├── Conversation history                                       │
│  ├── Customer profile + sentiment                              │
│  └── Tenant AI settings (temperature, model, rules)            │
│                                                                  │
│  Outputs:                                                       │
│  ├── response: string (generated reply)                        │
│  ├── response_type: 'auto_reply' | 'suggested' | 'action_only'│
│  ├── confidence: float                                         │
│  ├── resolution_action: object (optional)                      │
│  │   ├── type: 'resolve' | 'assign' | 'escalate' | 'tag'     │
│  │   └── config: object                                        │
│  └── internal_note: string (for agent context)                 │
│                                                                  │
│  Tools:                                                         │
│  ├── generate_response    → LLM response generation            │
│  ├── create_ticket        → Create new ticket                  │
│  ├── update_ticket        → Update ticket properties           │
│  ├── assign_ticket        → Assign to agent/team              │
│  ├── send_reply           → Send message to customer          │
│  ├── add_internal_note    → Add note for human agents         │
│  ├── lookup_order         → Order status check                │
│  ├── process_refund       → Refund processing                 │
│  └── check_account        → Account status check              │
│                                                                  │
│  Response Generation Strategy:                                  │
│  ├── Step 1: Analyze intent + knowledge context                │
│  ├── Step 2: Determine if auto-resolvable                      │
│  │   ├── Yes → Generate response + execute action              │
│  │   ├── Maybe → Generate suggested response for human review  │
│  │   └── No → Generate context summary for human handoff      │
│  ├── Step 3: Apply tone rules (based on customer sentiment)   │
│  ├── Step 4: Format response for channel                       │
│  └── Step 5: Include relevant KB links                         │
│                                                                  │
│  Handoff To: QA Agent                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 QA Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                    QA AGENT                                       │
│                                                                  │
│  Role: Review AI-generated responses for quality and compliance │
│                                                                  │
│  Model: GPT-4o (careful analysis)                              │
│                                                                  │
│  Inputs:                                                        │
│  ├── Generated response from Resolution Agent                  │
│  ├── Original customer message                                 │
│  ├── Knowledge base articles referenced                        │
│  ├── Tenant compliance rules                                   │
│  └── Tone guidelines                                           │
│                                                                  │
│  Outputs:                                                       │
│  ├── approved: boolean                                         │
│  ├── quality_score: float (0-1)                                │
│  ├── issues: Array<{                                           │
│  │     type: 'tone' | 'factual' | 'compliance' | 'grammar',  │
│  │     severity: 'low' | 'medium' | 'high',                   │
│  │     description: string,                                    │
│  │     suggestion: string                                      │
│  │   }>                                                         │
│  ├── revised_response: string (if revision needed)            │
│  └── escalation_required: boolean                             │
│                                                                  │
│  Tools:                                                         │
│  ├── check_factual_accuracy → Verify against KB               │
│  ├── check_tone            → Analyze tone and sentiment       │
│  ├── check_compliance      → Validate against rules           │
│  ├── revise_response       → Generate improved response       │
│  └── escalate_to_human     → Trigger human escalation         │
│                                                                  │
│  Quality Checks:                                                │
│  ├── Factual accuracy (does it match KB?)                     │
│  ├── Tone appropriateness (professional, empathetic)           │
│  ├── Compliance (no PII leaks, no unauthorized promises)      │
│  ├── Completeness (addresses the customer's issue?)            │
│  ├── Grammar and readability                                   │
│  └── Channel formatting (WhatsApp vs email vs chat)            │
│                                                                  │
│  Decision Flow:                                                 │
│  ├── Score > 0.8 + no high issues → Approved                  │
│  ├── Score 0.5-0.8 or medium issues → Revised + Approved     │
│  └── Score < 0.5 or high issues → Escalated to human         │
│                                                                  │
│  Handoff To: Escalation Agent (if needed)                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 Escalation Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESCALATION AGENT                               │
│                                                                  │
│  Role: Determine when and how to escalate to human agents      │
│                                                                  │
│  Model: GPT-4o-mini (decision-making)                          │
│                                                                  │
│  Escalation Triggers:                                          │
│  ├── QA Agent flagged issues                                   │
│  ├── Customer explicitly requests human                        │
│  ├── Sentiment drops below threshold (e.g., -0.5)             │
│  ├── Multiple failed resolution attempts (>2)                  │
│  ├── Legal/compliance issues detected                          │
│  ├── High-value customer (enterprise segment)                  │
│  ├── SLA breach imminent                                       │
│  └── AI confidence below threshold                             │
│                                                                  │
│  Outputs:                                                       │
│  ├── should_escalate: boolean                                  │
│  ├── escalation_type: 'urgent' | 'standard' | 'low_priority' │
│  ├── target_team: string                                       │
│  ├── target_agent: string (if specific agent)                  │
│  ├── reason: string                                            │
│  ├── context_summary: string (for human agents)               │
│  ├── suggested_actions: string[]                               │
│  └── sla_override: boolean                                     │
│                                                                  │
│  Tools:                                                         │
│  ├── get_agent_availability → Check who's online               │
│  ├── get_team_skills        → Match skills to issue            │
│  ├── reassign_ticket        → Assign to human                  │
│  ├── create_escalation      → Escalation record               │
│  ├── send_internal_alert    → Alert team lead                 │
│  └── update_sla             → Override SLA for escalation     │
│                                                                  │
│  Routing Logic:                                                 │
│  ├── Check agent availability (presence status)                │
│  ├── Match skills to ticket category                           │
│  ├── Check current load (capacity-based routing)               │
│  ├── Consider customer segment (VIP → senior agent)            │
│  └── Round-robin as fallback                                   │
│                                                                  │
│  Handoff To: Human Agent (via Pusher notification)             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.6 Sentiment Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                    SENTIMENT AGENT                                │
│                                                                  │
│  Role: Continuous sentiment tracking across conversations      │
│                                                                  │
│  Model: GPT-4o-mini (fast analysis)                            │
│                                                                  │
│  Runs: On every message, continuously                          │
│                                                                  │
│  Inputs:                                                        │
│  ├── Current message                                          │
│  ├── Conversation history (sentiment trend)                    │
│  └── Customer profile                                          │
│                                                                  │
│  Outputs:                                                       │
│  ├── current_sentiment: float (-1.0 to 1.0)                   │
│  ├── sentiment_label: 'positive' | 'neutral' | 'negative'     │
│  ├── sentiment_trend: 'improving' | 'stable' | 'declining'    │
│  ├── emotion: string (frustrated, angry, satisfied, etc.)     │
│  ├── urgency_score: float (0-1)                                │
│  └── escalate_recommendation: boolean                         │
│                                                                  │
│  Tools:                                                         │
│  ├── analyze_sentiment   → Sentiment analysis                 │
│  ├── get_sentiment_history → Conversation sentiment trend     │
│  └── update_customer_sentiment → Update customer record       │
│                                                                  │
│  Sentiment Tracking:                                            │
│  ├── Per-message sentiment score                               │
│  ├── Running average over conversation                         │
│  ├── Trend detection (3+ declining = flag)                     │
│  ├── Customer-level aggregate score                            │
│  └── Alert on sudden drops (e.g., from 0.5 to -0.5)          │
│                                                                  │
│  Handoff To: Escalation Agent (if sentiment drops critically) │
└─────────────────────────────────────────────────────────────────┘
```

### 2.7 Analytics Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYTICS AGENT                                │
│                                                                  │
│  Role: Generate insights, forecasts, and recommendations       │
│                                                                  │
│  Model: GPT-4o (data analysis)                                 │
│                                                                  │
│  Runs: Scheduled (hourly/daily) + on-demand                    │
│                                                                  │
│  Outputs:                                                       │
│  ├── insights: Array<{                                         │
│  │     type: 'trend' | 'anomaly' | 'recommendation',         │
│  │     title: string,                                          │
│  │     description: string,                                    │
│  │     severity: 'info' | 'warning' | 'critical',            │
│  │     metrics: object                                         │
│  │   }>                                                         │
│  ├── forecasts: object                                         │
│  │   ├── ticket_volume_next_7_days                             │
│  │   ├── predicted_sla_breaches                                │
│  │   └── agent_capacity_needs                                 │
│  └── recommendations: string[]                                 │
│                                                                  │
│  Tools:                                                         │
│  ├── query_metrics       → Query metric_snapshots table        │
│  ├── query_tickets       → Query ticket data                  │
│  ├── query_agents        → Query agent performance            │
│  ├── generate_forecast   → Time series forecasting            │
│  └── create_report       → Generate formatted report          │
│                                                                  │
│  Analytics Capabilities:                                        │
│  ├── Trend analysis (ticket volume, resolution time)           │
│  ├── Anomaly detection (sudden spikes, drops)                  │
│  ├── Capacity planning (agent workload forecasting)            │
│  ├── Customer churn prediction                                 │
│  ├── KB article effectiveness scoring                          │
│  └── AI performance monitoring                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Agent Handoff Protocol

```
┌─────────────────────────────────────────────────────────────────┐
│                    HANDOFF PROTOCOL                               │
│                                                                  │
│  The OpenAI Agents SDK provides native Handoff support.        │
│                                                                  │
│  Handoff Mechanism:                                            │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐                  │
│  │ Agent A │────▶│ Handoff │────▶│ Agent B │                  │
│  │         │     │ Object  │     │         │                  │
│  │ context │     │ {reason,│     │ receives │                  │
│  │ + data  │     │  data}  │     │ context  │                  │
│  └─────────┘     └─────────┘     └─────────┘                  │
│                                                                  │
│  Handoff Chain Tracking:                                        │
│  ├── Each handoff is logged in ai_traces.handoffs              │
│  ├── Chain: Intake → Knowledge → Resolution → QA               │
│  ├── Max chain depth: 7 agents                                 │
│  ├── Circular handoff prevention                               │
│  └── Full traceability for debugging                           │
│                                                                  │
│  Context Propagation:                                          │
│  ├── Shared context object (immutable, passed through)         │
│  ├── Each agent adds its output to context                    │
│  ├── No agent can modify previous agent's output               │
│  └── Final context is used for trace logging                   │
│                                                                  │
│  Example Handoff:                                              │
│  ┌─────────┐  "I need relevant articles"                      │
│  │ Intake  │────────────────────────────────▶ Knowledge Agent  │
│  └─────────┘                                                   │
│       │                                                         │
│       │ "Customer is angry, needs human"                       │
│       ▼                                                         │
│  ┌─────────┐                                                   │
│  │Escalation│◀──── Sentiment Agent detects -0.7 sentiment     │
│  │  Agent   │                                                  │
│  └─────────┘                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Guardrails System

```
┌─────────────────────────────────────────────────────────────────┐
│                    GUARDRAILS                                     │
│                                                                  │
│  Input Guardrails (before agent processing):                    │
│  ├── PII Detection → Redact SSN, credit card, passwords       │
│  ├── Injection Detection → Prompt injection attempts           │
│  ├── Rate Limiting → Per-customer request throttling          │
│  └── Content Filtering → Toxic/abusive content                │
│                                                                  │
│  Output Guardrails (after agent response):                      │
│  ├── PII Leakage → Ensure no PII in responses                 │
│  ├── Factual Accuracy → Verify claims against KB              │
│  ├── Tone Check → Professional, empathetic tone                │
│  ├── Compliance → No unauthorized promises/refunds            │
│  ├── Brand Voice → Consistent with tenant's tone guidelines   │
│  └── Channel Formatting → Proper formatting for platform      │
│                                                                  │
│  Implementation (OpenAI Guardrails):                            │
│  ├── InputGuardrail: PIIFilter, InjectionDetector              │
│  ├── OutputGuardrail: PIIChecker, FactChecker, ToneChecker    │
│  └── CustomGuardrail: ComplianceChecker, BrandVoiceChecker    │
│                                                                  │
│  Guardrail Response:                                            │
│  ├── Pass → Continue to next agent                             │
│  ├── Warn → Log warning, continue with monitoring              │
│  ├── Block → Halt pipeline, escalate to human                  │
│  └── Modify → Revise response before sending                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Trace & Observability

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI TRACE SYSTEM                                │
│                                                                  │
│  Every agent execution is traced:                               │
│                                                                  │
│  Trace Structure:                                               │
│  {                                                              │
│    trace_id: UUID,                                             │
│    tenant_id: UUID,                                            │
│    ticket_id: UUID,                                            │
│    message_id: UUID,                                           │
│    pipeline: "auto_resolution",                                │
│    agents: [                                                   │
│      {                                                         │
│        name: "intake",                                         │
│        model: "gpt-4o-mini",                                   │
│        input_tokens: 250,                                      │
│        output_tokens: 80,                                      │
│        latency_ms: 320,                                        │
│        input: { messages: [...] },                             │
│        output: { intent: "billing", priority: "high" },       │
│        handoff_to: "knowledge",                                │
│        guardrails: []                                          │
│      },                                                        │
│      {                                                         │
│        name: "knowledge",                                      │
│        model: "gpt-4o",                                        │
│        input_tokens: 1200,                                     │
│        output_tokens: 400,                                     │
│        latency_ms: 580,                                        │
│        tools_used: ["semantic_search", "get_article"],         │
│        output: { articles: [...] },                            │
│        handoff_to: "resolution"                                │
│      }                                                         │
│    ],                                                          │
│    total_tokens: 1930,                                         │
│    total_cost_cents: 0.45,                                     │
│    total_latency_ms: 1200,                                     │
│    outcome: "auto_resolved",                                   │
│    created_at: "2025-01-15T10:30:00Z"                         │
│  }                                                              │
│                                                                  │
│  Stored in: ai_traces table                                    │
│  Queryable by: tenant, ticket, agent, date range               │
│  Dashboard: AI Performance Analytics page                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Model Selection Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODEL SELECTION                                │
│                                                                  │
│  Per-Agent Model Selection:                                     │
│                                                                  │
│  Agent          │ Model          │ Reason                       │
│  ───────────────┼────────────────┼─────────────────────────────│
│  Intake         │ GPT-4o-mini    │ Fast, cheap, classification │
│  Knowledge      │ GPT-4o         │ Complex RAG reasoning       │
│  Resolution     │ GPT-4o         │ High-quality generation     │
│  QA             │ GPT-4o         │ Careful analysis            │
│  Escalation     │ GPT-4o-mini    │ Decision-making, fast       │
│  Sentiment      │ GPT-4o-mini    │ Fast analysis               │
│  Analytics      │ GPT-4o         │ Data analysis + reasoning   │
│  Copilot        │ GPT-4o         │ Agent assist, suggestions   │
│                                                                  │
│  Tenant Configuration:                                          │
│  ├── Per-tenant model override (Enterprise plan)               │
│  ├── Temperature setting (0.0 - 1.0)                           │
│  ├── Max tokens per request                                    │
│  ├── Fallback model (if primary fails)                         │
│  └── Cost budget per tenant                                    │
│                                                                  │
│  Cost Optimization:                                             │
│  ├── Cache common KB queries (Redis, 5min TTL)                 │
│  ├── Batch similar requests                                    │
│  ├── Use mini for simple classification tasks                  │
│  ├── Prompt compression (summarize conversation history)       │
│  └── Token usage monitoring + alerts                           │
└─────────────────────────────────────────────────────────────────┘
```
