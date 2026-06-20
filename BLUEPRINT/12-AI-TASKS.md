# SupportFlow AI — AI Tasks Deep-Dive

> Classification, Intent Detection, Sentiment Analysis, Handoff, Auto-Resolution

---

## 1. Automatic Ticket Classification

```
┌─────────────────────────────────────────────────────────────────┐
│                    TICKET CLASSIFICATION                          │
│                                                                  │
│  Model: GPT-4o-mini (fast, cost-effective)                     │
│                                                                  │
│  Classification Dimensions:                                     │
│  ├── Category: billing, technical, general, sales, support     │
│  ├── Subcategory: refund, feature_request, bug_report, etc.    │
│  ├── Priority: low, medium, high, urgent                       │
│  ├── Language: ISO 639-1 code                                  │
│  ├── Intent: billing_inquiry, bug_report, feature_request,     │
│  │           account_access, cancellation, general_question     │
│  └── Entities: order_id, product_name, error_code, etc.       │
│                                                                  │
│  Classification Prompt:                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  System: You are a customer support classifier.         │   │
│  │  Analyze the customer message and classify:             │   │
│  │  1. Category (billing/technical/general/sales/support) │   │
│  │  2. Subcategory (specific issue type)                   │   │
│  │  3. Priority (based on urgency signals)                 │   │
│  │  4. Intent (what the customer wants to achieve)         │   │
│  │  5. Extract any mentioned entities                      │   │
│  │                                                          │   │
│  │  Return as JSON:                                        │   │
│  │  {                                                      │   │
│  │    "category": "...",                                   │   │
│  │    "subcategory": "...",                                │   │
│  │    "priority": "...",                                   │   │
│  │    "intent": "...",                                     │   │
│  │    "language": "...",                                   │   │
│  │    "confidence": 0.0-1.0,                               │   │
│  │    "entities": { ... },                                 │   │
│  │    "requires_human": true/false                         │   │
│  │  }                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Priority Signals:                                              │
│  ├── Urgent keywords: "immediately", "urgent", "critical"     │
│  ├── Angry language: profanity, ALL CAPS, exclamation marks    │
│  ├── SLA-sensitive: existing ticket with pending SLA           │
│  ├── VIP customer: enterprise segment, high LTV               │
│  ├── Security: "hack", "unauthorized", "breach"               │
│  └── Legal: "lawyer", "sue", "legal action"                   │
│                                                                  │
│  Accuracy: 92% (validated against human-labeled dataset)       │
│  Latency: 200-400ms                                             │
│  Cost: ~$0.0003 per classification                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Intent Detection

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTENT DETECTION                               │
│                                                                  │
│  Intent Taxonomy:                                               │
│  ├── billing                                                    │
│  │   ├── billing_inquiry        "Where is my invoice?"        │
│  │   ├── refund_request         "I want my money back"        │
│  │   ├── payment_failure        "My card was declined"        │
│  │   ├── plan_change            "I want to upgrade"           │
│  │   └── cancellation           "Cancel my subscription"      │
│  │                                                          │
│  ├── technical                                                  │
│  │   ├── bug_report             "The app is crashing"         │
│  │   ├── feature_request        "Can you add..."              │
│  │   ├── how_to                 "How do I..."                 │
│  │   ├── integration_help       "API isn't working"           │
│  │   └── performance            "It's running slowly"         │
│  │                                                          │
│  ├── account                                                    │
│  │   ├── account_access         "I can't log in"              │
│  │   ├── password_reset         "I forgot my password"        │
│  │   ├── account_update         "Update my email"             │
│  │   └── account_deletion       "Delete my account"           │
│  │                                                          │
│  ├── sales                                                      │
│  │   ├── product_inquiry        "Tell me about..."            │
│  │   ├── pricing                "How much does..."            │
│  │   ├── demo_request           "Can I see a demo?"           │
│  │   └── partnership            "I want to partner"           │
│  │                                                          │
│  └── general                                                    │
│      ├── general_question       "What is..."                  │
│      ├── feedback               "I love/hate..."              │
│      ├── complaint              "I'm not satisfied"           │
│      └── compliment             "Great service!"              │
│                                                                  │
│  Detection Strategy:                                            │
│  ├── Multi-intent detection (a message can have multiple)      │
│  ├── Confidence scoring per intent                             │
│  ├── Fallback to "general_question" if low confidence          │
│  └── Intent change detection (conversation shifts topic)       │
│                                                                  │
│  Used For:                                                      │
│  ├── Routing to appropriate team                               │
│  ├── Triggering automation rules                               │
│  ├── Knowledge base search optimization                        │
│  ├── Response template selection                               │
│  └── Analytics and reporting                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Sentiment Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                    SENTIMENT ANALYSIS                             │
│                                                                  │
│  Model: GPT-4o-mini (fast, continuous analysis)                │
│                                                                  │
│  Sentiment Dimensions:                                         │
│  ├── Score: -1.0 (very negative) to 1.0 (very positive)      │
│  ├── Label: positive, neutral, negative, angry                 │
│  ├── Emotion: frustrated, confused, satisfied, grateful,       │
│  │            angry, disappointed, urgent                       │
│  ├── Trend: improving, stable, declining                       │
│  └── Urgency: 0-1 scale                                       │
│                                                                  │
│  Analysis Per Message:                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Input: Customer message + conversation context         │   │
│  │                                                          │   │
│  │  Output:                                                │   │
│  │  {                                                      │   │
│  │    "score": -0.3,                                       │   │
│  │    "label": "negative",                                 │   │
│  │    "emotion": "frustrated",                             │   │
│  │    "urgency": 0.7,                                      │   │
│  │    "triggers": ["long_wait", "repeated_issue"],         │   │
│  │    "suggested_action": "escalate"                       │   │
│  │  }                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Trend Detection:                                               │
│  ├── Calculate rolling average (last 5 messages)               │
│  ├── Compare current to conversation average                   │
│  ├── Flag sudden drops (>0.5 change in 2 messages)            │
│  ├── Flag sustained negative (>3 consecutive negative)        │
│  └── Update customer-level sentiment score                     │
│                                                                  │
│  Trigger Actions:                                               │
│  ├── sentiment < -0.5 → Warning to agent                       │
│  ├── sentiment < -0.7 → Auto-escalation recommendation        │
│  ├── sentiment dropping fast → Urgent alert                    │
│  ├── sentiment improving → Note positive interaction           │
│  └── customer-level negative → Flag for retention              │
│                                                                  │
│  Customer Sentiment Profile:                                   │
│  ├── Per-conversation sentiment                                │
│  ├── Rolling 30-day sentiment average                          │
│  ├── Sentiment by channel (WhatsApp vs email)                  │
│  ├── Sentiment by topic (billing vs technical)                 │
│  └── Sentiment trend over time                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Agent Handoff

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT HANDOFF                                  │
│                                                                  │
│  AI-to-Human Handoff:                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  When to hand off:                                     │   │
│  │  ├── AI confidence < 0.5                               │   │
│  │  ├── Customer explicitly requests human                │   │
│  │  ├── Sentiment below threshold                         │   │
│  │  ├── Multiple failed resolution attempts (>2)          │   │
│  │  ├── Legal/compliance issues                           │   │
│  │  ├── High-value customer request                       │   │
│  │  ├── SLA breach imminent                               │   │
│  │  └── QA agent rejected response                        │   │
│  │                                                          │   │
│  │  Handoff Package:                                      │   │
│  │  ├── Conversation summary (AI-generated)               │   │
│  │  ├── Customer profile and sentiment                    │   │
│  │  ├── Intent and category                               │   │
│  │  ├── Knowledge articles found                          │   │
│  │  ├── Attempted solutions                               │   │
│  │  ├── Recommended next steps                            │   │
│  │  └── SLA status                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  AI-to-AI Handoff:                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Intake → Knowledge:                                   │   │
│  │  ├── Pass intent + entities + priority                 │   │
│  │  └── Knowledge uses for targeted search                │   │
│  │                                                          │   │
│  │  Knowledge → Resolution:                               │   │
│  │  ├── Pass relevant articles + context                  │   │
│  │  └── Resolution uses for response generation           │   │
│  │                                                          │   │
│  │  Resolution → QA:                                      │   │
│  │  ├── Pass generated response + source articles         │   │
│  │  └── QA verifies accuracy and tone                     │   │
│  │                                                          │   │
│  │  Sentiment → Escalation:                               │   │
│  │  ├── Pass sentiment score + trend + urgency            │   │
│  │  └── Escalation determines routing                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Human-to-Human Handoff:                                        │
│  ├── Reassign to different agent                               │
│  ├── Transfer to different team                                │
│  ├── Escalate to manager                                      │
│  └── Full context preserved                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Human Escalation

```
┌─────────────────────────────────────────────────────────────────┐
│                    HUMAN ESCALATION                               │
│                                                                  │
│  Escalation Levels:                                            │
│  ├── Level 1: Assigned Agent                                   │
│  │   └── First responder, handles standard issues              │
│  ├── Level 2: Senior Agent                                     │
│  │   └── Complex issues, high-value customers                  │
│  ├── Level 3: Team Lead/Manager                                │
│  │   └── Unresolved issues, complaints, SLA breaches          │
│  ├── Level 4: Department Head                                  │
│  │   └── Critical issues, legal threats, PR risks             │
│  └── Level 5: Executive                                        │
│      └── Major outages, data breaches, VIP escalations        │
│                                                                  │
│  Escalation Routing Logic:                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Check escalation rules (configured by admin)        │   │
│  │  2. Match ticket category to agent skills               │   │
│  │  3. Check agent availability (online status)            │   │
│  │  4. Check current workload (capacity)                   │   │
│  │  5. Consider customer segment (VIP → senior)            │   │
│  │  6. Consider ticket priority (urgent → fast track)      │   │
│  │  7. Round-robin as fallback                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Escalation Notification:                                      │
│  ├── In-app notification (Pusher realtime)                     │
│  ├── Push notification (mobile app)                            │
│  ├── Email notification                                        │
│  ├── Slack/Teams integration (optional)                        │
│  └── SMS (for critical escalations)                            │
│                                                                  │
│  Escalation Context Package:                                   │
│  ├── Full conversation transcript                              │
│  ├── AI-generated summary                                      │
│  ├── Customer profile and history                              │
│  ├── Sentiment analysis                                        │
│  ├── Intent and category                                       │
│  ├── SLA status and deadlines                                  │
│  ├── Knowledge articles referenced                             │
│  ├── Previous escalation history                               │
│  └── Suggested actions                                         │
│                                                                  │
│  Escalation SLA Override:                                      │
│  ├── Escalated tickets get priority SLA                        │
│  ├── Faster first response requirement                         │
│  ├── Dedicated escalation SLA policy                           │
│  └── Real-time tracking on escalation dashboard                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Auto-Generated Replies

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTO-GENERATED REPLIES                         │
│                                                                  │
│  Model: GPT-4o (high-quality generation)                       │
│                                                                  │
│  Generation Strategy:                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Analyze customer message + context                  │   │
│  │  2. Retrieve relevant KB articles                       │   │
│  │  3. Check for matching response templates               │   │
│  │  4. Generate response:                                  │   │
│  │     ├── Personalize with customer name                  │   │
│  │     ├── Reference specific details from message         │   │
│  │     ├── Include relevant KB links                       │   │
│  │     ├── Match channel formatting                        │   │
│  │     └── Apply tone rules                                │   │
│  │  5. QA review                                           │   │
│  │  6. Send or revise                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Response Types:                                                │
│  ├── Auto-reply: Direct to customer (high confidence)          │
│  ├── Suggested reply: For agent review (medium confidence)     │
│  ├── Internal note: For agent context only                     │
│  └── Action-only: Execute action without message               │
│                                                                  │
│  Tone Guidelines (Configurable per tenant):                    │
│  ├── Professional: Formal language, proper grammar             │
│  ├── Friendly: Warm, approachable                              │
│  ├── Empathetic: Acknowledge feelings, show understanding      │
│  ├── Concise: Short, direct answers                            │
│  └── Technical: Detailed, technical language                   │
│                                                                  │
│  Channel Formatting:                                            │
│  ├── WhatsApp: Short paragraphs, emojis, quick replies         │
│  ├── Email: Formal structure, greetings, sign-off              │
│  ├── SMS: Under 160 characters, concise                        │
│  ├── Web chat: Medium length, formatted                        │
│  └── Messenger: Short, conversational                          │
│                                                                  │
│  Quality Metrics:                                               │
│  ├── Response accuracy (factual correctness)                   │
│  ├── Tone appropriateness                                      │
│  ├── Resolution rate (did it solve the issue?)                 │
│  ├── Customer satisfaction (CSAT)                               │
│  └── Agent adoption rate                                       │
│                                                                  │
│  Latency: 1-3 seconds per response                             │
│  Cost: ~$0.01-0.03 per response                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Auto Ticket Resolution

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTO TICKET RESOLUTION                         │
│                                                                  │
│  Resolution Confidence Threshold:                               │
│  ├── > 0.9: Auto-resolve (send response + close ticket)       │
│  ├── 0.7-0.9: Auto-reply (send response, keep ticket open)    │
│  ├── 0.5-0.7: Suggest reply (agent reviews before sending)    │
│  └── < 0.5: Escalate to human                                  │
│                                                                  │
│  Auto-Resolution Criteria:                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Must ALL be true:                                     │   │
│  │  ├── AI confidence > 0.9                               │   │
│  │  ├── QA agent approved                                 │   │
│  │  ├── Not flagged by guardrails                         │   │
│  │  ├── Customer not flagged for personal touch           │   │
│  │  ├── Ticket category is auto-resolvable                │   │
│  │  │   (billing_inquiry, how_to, account_access)        │   │
│  │  └── SLA allows time for auto-resolution               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Resolution Actions:                                            │
│  ├── Send AI response                                          │
│  ├── Add internal note                                         │
│  ├── Update ticket status (resolved)                           │
│  ├── Update customer sentiment                                  │
│  ├── Log AI trace                                              │
│  ├── Trigger CSAT survey (if enabled)                          │
│  └── Update analytics metrics                                  │
│                                                                  │
│  Post-Resolution:                                               │
│  ├── Monitor for customer re-open                              │
│  ├── If re-opened → Escalate to human                          │
│  ├── Track resolution quality                                  │
│  └── Feed back into AI training data                           │
│                                                                  │
│  Target Metrics:                                                │
│  ├── Auto-resolution rate: 40-60% of tickets                  │
│  ├── Customer satisfaction: > 4.0/5.0                          │
│  ├── False resolution rate: < 5%                               │
│  └── Average resolution time: < 30 seconds                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Knowledge Retrieval (RAG)

```
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE RETRIEVAL (RAG)                      │
│                                                                  │
│  Pipeline:                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Query Processing                                   │   │
│  │     ├── Extract key terms from customer message         │   │
│  │     ├── Generate embedding (text-embedding-3-small)    │   │
│  │     └── Identify intent for context                    │   │
│  │                                                          │   │
│  │  2. Hybrid Search                                       │   │
│  │     ├── Semantic: pgvector cosine similarity (top 10)  │   │
│  │     ├── Keyword: PostgreSQL full-text search (top 10)  │   │
│  │     └── Merge + deduplicate                             │   │
│  │                                                          │   │
│  │  3. Re-ranking                                          │   │
│  │     ├── GPT-4o re-ranks combined results                │   │
│  │     ├── Considers: relevance, recency, popularity      │   │
│  │     └── Returns top 5 with scores                       │   │
│  │                                                          │   │
│  │  4. Context Generation                                  │   │
│  │     ├── Synthesize key points from top articles         │   │
│  │     ├── Generate summary for resolution agent           │   │
│  │     └── Include article IDs for attribution             │   │
│  │                                                          │   │
│  │  5. Quality Check                                       │   │
│  │     ├── Verify relevance score > 0.5                    │   │
│  │     ├── Check for conflicting information               │   │
│  │     └── Flag if no relevant articles found              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Embedding Generation:                                          │
│  ├── Model: text-embedding-3-small (1536 dimensions)          │
│  ├── Trigger: On article publish/update                        │
│  ├── Storage: pgvector extension in PostgreSQL                 │
│  ├── Batch processing for bulk imports                         │
│  └── Re-embed on tenant settings change                        │
│                                                                  │
│  Search Optimization:                                           │
│  ├── Tenant-scoped search (filter by tenant_id)                │
│  ├── Language filtering                                         │
│  ├── Status filtering (published only)                         │
│  ├── Caching (Redis, 5min TTL for common queries)             │
│  └── Index optimization (IVFFlat with lists=100)               │
│                                                                  │
│  Performance:                                                   │
│  ├── Semantic search: 50-100ms                                 │
│  ├── Keyword search: 20-50ms                                   │
│  ├── Re-ranking: 200-400ms                                     │
│  └── Total pipeline: 300-600ms                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. AI Response Quality Assurance

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI RESPONSE QA                                 │
│                                                                  │
│  Model: GPT-4o (careful analysis)                              │
│                                                                  │
│  Quality Dimensions:                                           │
│  ├── Factual Accuracy (weight: 0.3)                            │
│  │   └── Does the response match KB articles?                 │
│  ├── Tone Appropriateness (weight: 0.2)                        │
│  │   └── Is the tone professional and empathetic?             │
│  ├── Completeness (weight: 0.25)                               │
│  │   └── Does it fully address the customer's issue?          │
│  ├── Clarity (weight: 0.15)                                    │
│  │   └── Is the response clear and easy to understand?        │
│  └── Compliance (weight: 0.1)                                  │
│      └── Does it follow company policies?                      │
│                                                                  │
│  Quality Score Calculation:                                     │
│  quality_score = Σ(dimension_score × weight)                   │
│                                                                  │
│  Decision Matrix:                                               │
│  ├── score > 0.85 AND no critical issues → APPROVED           │
│  ├── score 0.7-0.85 AND no critical issues → REVISED          │
│  ├── score 0.5-0.7 OR medium issues → REVISED + REVIEWED     │
│  └── score < 0.5 OR critical issues → ESCALATED               │
│                                                                  │
│  Common Issues Detected:                                        │
│  ├── Factual: Incorrect information not in KB                 │
│  ├── Tone: Too formal, too casual, dismissive                  │
│  ├── Compliance: Unauthorized promises, PII leakage           │
│  ├── Clarity: Jargon, ambiguity, too long                     │
│  └── Completeness: Missing key information                     │
│                                                                  │
│  Revision Process:                                              │
│  ├── Identify specific issues                                  │
│  ├── Generate revised response                                 │
│  ├── Re-run QA on revised response                             │
│  ├── Max 2 revision attempts                                   │
│  └── Escalate if still failing                                 │
│                                                                  │
│  Learning Loop:                                                 │
│  ├── Agent feedback on AI responses (thumbs up/down)           │
│  ├── QA decisions logged for fine-tuning                       │
│  ├── Track which articles lead to good/bad responses           │
│  └── Monthly model performance review                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. AI Cost Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI COST OPTIMIZATION                           │
│                                                                  │
│  Per-Resolution Cost Breakdown:                                 │
│  ├── Intake (GPT-4o-mini): $0.0003                             │
│  ├── Knowledge (GPT-4o): $0.008                                │
│  ├── Resolution (GPT-4o): $0.012                               │
│  ├── QA (GPT-4o): $0.006                                       │
│  ├── Sentiment (GPT-4o-mini): $0.0002                          │
│  ├── Embeddings (text-embedding-3): $0.0001                    │
│  └── TOTAL: ~$0.027 per resolution                             │
│                                                                  │
│  Cost Optimization Strategies:                                  │
│  ├── Use GPT-4o-mini for classification/sentiment (10x cheaper)│
│  ├── Cache common KB queries (reduce redundant searches)       │
│  ├── Prompt compression (summarize long conversations)         │
│  ├── Batch similar requests                                    │
│  ├── Fallback to simpler model for low-complexity issues       │
│  └── Monitor and alert on cost anomalies                       │
│                                                                  │
│  Monthly Cost Estimates (per tenant):                           │
│  ├── Starter (500 resolutions): ~$14/month                     │
│  ├── Growth (2,500 resolutions): ~$68/month                    │
│  ├── Business (10,000 resolutions): ~$270/month                │
│  └── Enterprise (unlimited): Custom pricing                    │
│                                                                  │
│  Cost Controls:                                                 │
│  ├── Per-tenant monthly budget limits                          │
│  ├── Real-time usage dashboard                                 │
│  ├── Alert at 80% budget usage                                 │
│  ├── Auto-throttle at 100% budget                              │
│  └── Monthly cost reports                                      │
└─────────────────────────────────────────────────────────────────┘
```
