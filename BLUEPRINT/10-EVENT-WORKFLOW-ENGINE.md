# SupportFlow AI — Event-Driven Workflow Engine

> Event Bus, Triggers, Actions, and Automation Rules

---

## 1. Event System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT-DRIVEN ARCHITECTURE                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    EVENT SOURCES                          │    │
│  │                                                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │
│  │  │ Server   │ │ Webhook  │ │ Trigger  │ │ Schedule │ │    │
│  │  │ Actions  │ │ Ingress  │ │ .dev Jobs│ │ (Cron)   │ │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │    │
│  │       │             │             │             │        │    │
│  └───────┼─────────────┼─────────────┼─────────────┼────────┘    │
│          │             │             │             │              │
│          └─────────────┼─────────────┼─────────────┘              │
│                        │             │                            │
│                        ▼             ▼                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    EVENT BUS                              │    │
│  │                                                          │    │
│  │  Internal Pub/Sub (In-Process)                          │    │
│  │  ├── Synchronous: For same-request events              │    │
│  │  └── Asynchronous: For cross-cutting concerns          │    │
│  │                                                          │    │
│  │  External Pub/Sub (Trigger.dev)                         │    │
│  │  ├── For long-running jobs                              │    │
│  │  ├── For scheduled tasks                                │    │
│  │  └── For external integrations                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│          │             │             │                            │
│          ▼             ▼             ▼                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    EVENT HANDLERS                         │    │
│  │                                                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │
│  │  │ SLA      │ │ Pusher   │ │ AI Agent │ │ Audit    │ │    │
│  │  │ Monitor  │ │ Broadcast│ │ Pipeline │ │ Logger   │ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │    │
│  │                                                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │
│  │  │ Webhook  │ │ Email    │ │ Metrics  │ │ Notifi-  │ │    │
│  │  │ Delivery │ │ Sender   │ │ Update   │ │ cation   │ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Event Definitions

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT TYPES                                    │
│                                                                  │
│  Ticket Events:                                                 │
│  ├── ticket.created          → New ticket created              │
│  ├── ticket.updated          → Ticket properties changed       │
│  ├── ticket.assigned         → Agent assigned                  │
│  ├── ticket.unassigned       → Agent removed                   │
│  ├── ticket.status_changed   → Status transition               │
│  ├── ticket.priority_changed → Priority changed                │
│  ├── ticket.merged           → Ticket merged into another      │
│  ├── ticket.resolved         → Ticket resolved                 │
│  ├── ticket.closed           → Ticket closed                   │
│  └── ticket.reopened         → Ticket reopened                 │
│                                                                  │
│  Message Events:                                                │
│  ├── message.received        → Inbound message from channel    │
│  ├── message.sent            → Outbound message sent           │
│  ├── message.ai_generated    → AI generated a response         │
│  ├── message.read            → Message read by customer        │
│  └── message.internal_note   → Internal note added             │
│                                                                  │
│  Customer Events:                                               │
│  ├── customer.created        → New customer                    │
│  ├── customer.updated        → Customer profile changed        │
│  ├── customer.merged         → Customer records merged         │
│  └── customer.sentiment_changed → Sentiment score changed      │
│                                                                  │
│  SLA Events:                                                    │
│  ├── sla.started             → SLA tracking started            │
│  ├── sla.warning             → SLA breach approaching          │
│  ├── sla.breach              → SLA breached                    │
│  ├── sla.achieved            → SLA target met                  │
│  └── sla.paused              → SLA paused (waiting)            │
│                                                                  │
│  AI Events:                                                     │
│  ├── ai.classified           → Intent classified               │
│  ├── ai.routed               → Auto-routed to team/agent      │
│  ├── ai.response_generated   → Response generated              │
│  ├── ai.response_approved    → QA approved response            │
│  ├── ai.escalated            → AI escalated to human           │
│  ├── ai.resolved             → AI auto-resolved                │
│  └── ai.trace_logged         → AI trace saved                  │
│                                                                  │
│  Escalation Events:                                             │
│  ├── escalation.created      → Escalation triggered            │
│  ├── escalation.assigned     → Escalation assigned to human    │
│  ├── escalation.resolved     → Escalation resolved             │
│  └── escalation.sla_override → SLA overridden for escalation   │
│                                                                  │
│  Team Events:                                                   │
│  ├── team.member_added       → Member joined team              │
│  ├── team.member_removed     → Member left team                │
│  └── team.status_changed     → Team availability changed       │
│                                                                  │
│  Automation Events:                                             │
│  ├── automation.triggered    → Rule triggered                  │
│  ├── automation.executed     → Rule actions executed           │
│  └── automation.failed       → Rule execution failed           │
│                                                                  │
│  System Events:                                                 │
│  ├── system.webhook_received → External webhook received       │
│  ├── system.webhook_delivered → Outbound webhook sent          │
│  ├── system.user_login       → User logged in                  │
│  └── system.user_logout      → User logged out                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Event Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT PROCESSING PIPELINE                      │
│                                                                  │
│  Step 1: Event Emission                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  // In Server Action or API Route                       │   │
│  │  await eventBus.emit('ticket.created', {                │   │
│  │    tenant_id: ctx.tenant_id,                            │   │
│  │    ticket_id: ticket.id,                                │   │
│  │    actor: { type: 'user', id: userId },                │   │
│  │    data: { subject, priority, channel, customer_id }   │   │
│  │  });                                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Step 2: Synchronous Handlers (Same Request)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Audit logging (write to audit_log table)            │   │
│  │  • Metric increment (update counters)                  │   │
│  │  • Cache invalidation                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Step 3: Async Handlers (Background)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Trigger.dev Job Queue:                                │   │
│  │  • SLA monitoring (if ticket.created)                  │   │
│  │  • AI pipeline (if message.received)                   │   │
│  │  • Pusher broadcast (realtime update)                  │   │
│  │  • Webhook delivery (if subscribed)                    │   │
│  │  • Email notification (if configured)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Step 4: Post-Processing                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Metrics aggregation (hourly rollup)                 │   │
│  │  • Embedding update (if KB article changed)            │   │
│  │  • Customer sentiment recalculation                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Automation Rules Engine

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATION RULES ENGINE                         │
│                                                                  │
│  Rule Structure:                                                │
│  {                                                              │
│    "name": "Auto-assign billing tickets",                      │
│    "is_enabled": true,                                         │
│    "trigger_type": "ticket.created",                           │
│    "trigger_config": {                                         │
│      "channels": ["email", "web"],                            │
│      "priority": ["high", "urgent"]                           │
│    },                                                          │
│    "conditions": [                                             │
│      { "field": "category", "op": "eq", "value": "billing" } │
│    ],                                                          │
│    "actions": [                                                │
│      { "type": "assign_team", "config": { "team": "billing" }}│
│    ]                                                           │
│  }                                                              │
│                                                                  │
│  Trigger Types:                                                 │
│  ├── ticket.created                                            │
│  ├── ticket.updated                                            │
│  ├── ticket.status_changed                                     │
│  ├── ticket.priority_changed                                   │
│  ├── message.received                                          │
│  ├── sla.warning                                               │
│  ├── sla.breach                                                │
│  ├── sentiment.negative                                        │
│  ├── customer.created                                          │
│  ├── schedule.cron                                             │
│  └── manual                                                    │
│                                                                  │
│  Condition Operators:                                           │
│  ├── eq, neq (equals, not equals)                             │
│  ├── gt, gte, lt, lte (comparison)                            │
│  ├── in, not_in (set membership)                              │
│  ├── contains, not_contains (string/array)                    │
│  ├── is_empty, is_not_empty                                   │
│  └── and, or (logical combinators)                            │
│                                                                  │
│  Action Types:                                                  │
│  ├── assign_team       → Auto-assign to team                  │
│  ├── assign_agent      → Auto-assign to specific agent        │
│  ├── set_priority      → Change ticket priority               │
│  ├── set_status        → Change ticket status                 │
│  ├── add_tag           → Add tag to ticket                    │
│  ├── remove_tag        → Remove tag from ticket               │
│  ├── send_notification → Send notification to user/team       │
│  ├── send_email        → Send email to customer               │
│  ├── run_ai_agent      → Trigger specific AI agent            │
│  ├── create_ticket     → Create related ticket                │
│  ├── send_webhook      → Send external webhook                │
│  └── add_internal_note → Add note to ticket                   │
│                                                                  │
│  Execution Flow:                                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐│
│  │ Event    │───▶│ Trigger  │───▶│ Condition│───▶│ Action   ││
│  │ Received │    │ Match    │    │ Evaluate │    │ Execute  ││
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘│
│       │               │               │               │        │
│       │               │               │               │        │
│  event.type     rule.trigger    rule.conditions   rule.actions │
│  event.data     matches?        all pass?         executed     │
│                                                                  │
│  Execution Limits:                                              │
│  ├── Max 10 rules per trigger event                           │
│  ├── Max 5 actions per rule                                    │
│  ├── Max 100 rule executions per hour per tenant              │
│  └── Circular rule prevention (max depth: 3)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. SLA Monitoring Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SLA MONITORING WORKFLOW                        │
│                                                                  │
│  Trigger: Schedule (every 1 minute)                             │
│                                                                  │
│  Flow:                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Query all active SLA states                         │   │
│  │     WHERE first_response_deadline > NOW()               │   │
│  │     OR resolution_deadline > NOW()                      │   │
│  │                                                          │   │
│  │  2. For each SLA state:                                │   │
│  │     ├── Calculate time remaining                        │   │
│  │     ├── Check warning threshold (75%)                   │   │
│  │     │   └── If breached warning → emit sla.warning      │   │
│  │     ├── Check breach (deadline passed)                  │   │
│  │     │   └── If breached → emit sla.breach               │   │
│  │     └── Check if paused (customer waiting)              │   │
│  │                                                          │   │
│  │  3. For sla.warning events:                            │   │
│  │     ├── Notify assigned agent                           │   │
│  │     ├── Notify team lead                                │   │
│  │     ├── Update ticket SLA status                        │   │
│  │     └── Apply escalation rules (if configured)          │   │
│  │                                                          │   │
│  │  4. For sla.breach events:                             │   │
│  │     ├── Mark ticket as SLA breached                     │   │
│  │     ├── Escalate to manager                             │   │
│  │     ├── Send notification to admin                      │   │
│  │     ├── Apply escalation rules                          │   │
│  │     └── Log breach in metrics                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  SLA Pause Reasons:                                             │
│  ├── Customer response pending (waiting for customer)          │
│  ├── Third-party dependency (waiting on external system)       │
│  └── Business hours only (outside working hours)               │
│                                                                  │
│  Business Hours:                                                │
│  ├── Configurable per tenant (timezone + schedule)             │
│  ├── Per-team business hours                                   │
│  ├── Holiday calendar                                          │
│  └── Skip weekends (configurable)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. AI Pipeline Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI PIPELINE WORKFLOW                            │
│                                                                  │
│  Trigger: message.received event                                │
│                                                                  │
│  Flow:                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Step 1: Intake Agent (GPT-4o-mini)                    │   │
│  │  ├── Classify intent, category, priority                │   │
│  │  ├── Detect language                                    │   │
│  │  ├── Extract entities                                   │   │
│  │  └── Determine if requires_human                        │   │
│  │                                                          │   │
│  │  Step 2: Decision Point                                 │   │
│  │  ├── If requires_human → Escalation Agent               │   │
│  │  ├── If simple_query → Knowledge → Resolution → QA      │   │
│  │  └── If complex_issue → Knowledge → Resolution → QA     │   │
│  │                                                          │   │
│  │  Step 3: Knowledge Agent (GPT-4o)                      │   │
│  │  ├── Semantic search (pgvector)                         │   │
│  │  ├── Keyword search (full-text)                         │   │
│  │  ├── Re-rank results                                    │   │
│  │  └── Generate context summary                           │   │
│  │                                                          │   │
│  │  Step 4: Resolution Agent (GPT-4o)                     │   │
│  │  ├── Analyze intent + knowledge context                 │   │
│  │  ├── Generate response                                  │   │
│  │  ├── Determine action (reply, assign, resolve)          │   │
│  │  └── Format for channel                                 │   │
│  │                                                          │   │
│  │  Step 5: QA Agent (GPT-4o)                             │   │
│  │  ├── Verify factual accuracy                            │   │
│  │  ├── Check tone and compliance                          │   │
│  │  ├── Approve, revise, or escalate                       │   │
│  │  └── Score quality (0-1)                                │   │
│  │                                                          │   │
│  │  Step 6: Send Response                                  │   │
│  │  ├── If approved → Send via channel adapter             │   │
│  │  ├── If revised → Send revised response                 │   │
│  │  ├── If escalated → Assign to human                     │   │
│  │  └── Log AI trace                                       │   │
│  │                                                          │   │
│  │  Step 7: Post-Processing                                │   │
│  │  ├── Update ticket status                               │   │
│  │  ├── Update customer sentiment                          │   │
│  │  ├── Update metrics                                     │   │
│  │  └── Broadcast via Pusher                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Timeout Handling:                                              │
│  ├── AI pipeline timeout: 30 seconds                           │
│  ├── If timeout → Fallback to human escalation                 │
│  ├── Retry on transient errors (max 2 retries)                │
│  └── Dead letter queue for failed pipelines                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Webhook Delivery Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBHOOK DELIVERY WORKFLOW                      │
│                                                                  │
│  Trigger: Any subscribed event                                  │
│                                                                  │
│  Flow:                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Query active webhooks for tenant + event type       │   │
│  │                                                          │   │
│  │  2. For each matching webhook:                         │   │
│  │     ├── Build payload:                                  │   │
│  │     │   {                                               │   │
│  │     │     "event": "ticket.created",                    │   │
│  │     │     "timestamp": "2025-01-15T10:30:00Z",         │   │
│  │     │     "tenant_id": "...",                           │   │
│  │     │     "data": { ... }                               │   │
│  │     │   }                                               │   │
│  │     │                                                   │   │
│  │     ├── Generate HMAC-SHA256 signature                  │   │
│  │     ├── Create delivery record (status: pending)        │   │
│  │     └── Queue for delivery                              │   │
│  │                                                          │   │
│  │  3. Delivery Worker (Trigger.dev):                     │   │
│  │     ├── POST to webhook URL                             │   │
│  │     ├── Headers:                                        │   │
│  │     │   Content-Type: application/json                  │   │
│  │     │   X-SupportFlow-Signature: sha256=...            │   │
│  │     │   X-SupportFlow-Timestamp: 1705312800            │   │
│  │     │   X-SupportFlow-Event: ticket.created            │   │
│  │     ├── Timeout: 5 seconds                              │   │
│  │     └── Record response status                          │   │
│  │                                                          │   │
│  │  4. Retry Logic:                                       │   │
│  │     ├── Attempt 1: Immediate                            │   │
│  │     ├── Attempt 2: After 1 minute                       │   │
│  │     ├── Attempt 3: After 5 minutes                      │   │
│  │     ├── Max retries: 3                                  │   │
│  │     └── After max retries: Mark as failed               │   │
│  │                                                          │   │
│  │  5. Monitoring:                                         │   │
│  │     ├── Track delivery success rate                     │   │
│  │     ├── Alert on repeated failures (>3 consecutive)    │   │
│  │     └── Auto-disable webhook after 10 consecutive fails │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```
