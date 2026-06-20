# SupportFlow AI — System Architecture

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │   Web App    │  │ Mobile App   │  │  Chat Widget  │                │
│  │  (Next.js)   │  │(React Native)│  │  (Embeddable) │                │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                │
│         │                  │                  │                          │
└─────────┼──────────────────┼──────────────────┼──────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EDGE / CDN LAYER                                │
│                                                                         │
│                    Vercel Edge Network                                  │
│              (Static Assets, Edge Middleware)                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    EDGE MIDDLEWARE                               │    │
│  │  • Tenant resolution (subdomain / header)                       │    │
│  │  • Authentication token validation                               │    │
│  │  • Rate limiting (per-tenant, per-IP)                           │    │
│  │  • Geolocation routing                                           │    │
│  │  • Bot detection                                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   NEXT.JS 15 SERVER                              │    │
│  │                                                                  │    │
│  │  ┌──────────────────┐    ┌──────────────────┐                   │    │
│  │  │  Server Actions   │    │   API Routes     │                   │    │
│  │  │  (Mutations)      │    │   (REST/External)│                   │    │
│  │  └──────────────────┘    └──────────────────┘                   │    │
│  │                                                                  │    │
│  │  ┌──────────────────┐    ┌──────────────────┐                   │    │
│  │  │ Server Components │    │  Route Handlers   │                   │    │
│  │  │ (Data Fetching)   │    │  (Webhooks)       │                   │    │
│  │  └──────────────────┘    └──────────────────┘                   │    │
│  │                                                                  │    │
│  │  ┌────────────────────────────────────────────────────────┐     │    │
│  │  │              MIDDLEWARE PIPELINE                        │     │    │
│  │  │  Auth → Tenant → RBAC → Validation → Rate Limit        │     │    │
│  │  └────────────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   SERVICE LAYER                                  │    │
│  │                                                                  │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │    │
│  │  │ Ticket  │ │  SLA    │ │Customer │ │  Team   │              │    │
│  │  │Service  │ │Service  │ │ Service │ │ Service │              │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │    │
│  │                                                                  │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │    │
│  │  │  KB     │ │Analytics│ │ Channel │ │  Auth   │              │    │
│  │  │Service  │ │ Service │ │ Service │ │ Service │              │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌────────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│    AI AGENT LAYER   │ │   EVENT LAYER     │ │   REALTIME LAYER  │
│                     │ │                   │ │                   │
│  ┌───────────────┐  │ │  ┌─────────────┐  │ │  ┌─────────────┐│
│  │  Orchestrator │  │ │  │  Event Bus   │  │ │  │   Pusher    ││
│  │  (OpenAI SDK) │  │ │  │  (Internal)  │  │ │  │  Channels   ││
│  └───────┬───────┘  │ │  └──────┬──────┘  │ │  └──────┬──────┘│
│          │          │ │         │         │ │         │       │
│  ┌───────▼───────┐  │ │  ┌──────▼──────┐  │ │  ┌──────▼──────┐│
│  │   7 Agents    │  │ │  │  Trigger.dev │  │ │  │  Presence   ││
│  │               │  │ │  │  Job Queue   │  │ │  │  Typing     ││
│  │ • Intake      │  │ │  │             │  │ │  │  Status     ││
│  │ • Knowledge   │  │ │  │ • SLA Check  │  │ │  │  Read       ││
│  │ • Resolution  │  │ │  │ • Analytics  │  │ │  │  Receipts   ││
│  │ • QA          │  │ │  │ • Email      │  │ │  │             ││
│  │ • Escalation  │  │ │  │ • Batch Jobs │  │ │  │             ││
│  │ • Sentiment   │  │ │  │ • Webhooks   │  │ │  │             ││
│  │ • Analytics   │  │ │  │             │  │ │  │             ││
│  └───────────────┘  │ │  └─────────────┘  │ │  └─────────────┘│
└────────────────────┘ └───────────────────┘ └───────────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                      │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │   Neon PostgreSQL │  │    pgvector      │  │  Vercel Blob     │      │
│  │                   │  │   (Embeddings)   │  │  (File Storage)  │      │
│  │  • Primary data   │  │                  │  │                  │      │
│  │  • Full-text      │  │  • KB embeddings │  │  • Attachments   │      │
│  │  • JSON columns   │  │  • Semantic      │  │  • Exports       │      │
│  │  • Row-level      │  │    search        │  │  • Imports       │      │
│  │    security       │  │                  │  │                  │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐                             │
│  │  Vercel KV       │  │  OpenTelemetry   │                             │
│  │  (Redis Cache)   │  │  (Tracing)       │                             │
│  │                  │  │                  │                             │
│  │  • Session cache │  │  • AI traces     │                             │
│  │  • Rate limits   │  │  • Performance   │                             │
│  │  • Hot data      │  │  • Error tracking│                             │
│  └──────────────────┘  └──────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Request Flow — Inbound Message

```
Channel (WhatsApp/Email/SMS/Web/etc.)
         │
         ▼
┌─────────────────────┐
│  Webhook / Adapter   │  ← Channel-specific adapter normalizes message
│  (Channel Service)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Event: message.     │
│  received            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  INTAKE AGENT        │  ← Classifies intent, priority, language
│  (AI Classification) │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌──────────┐
│ AUTO-   │ │ CREATE / │
│ ROUTE   │ │ UPDATE   │
│ (Queue) │ │ TICKET   │
└────┬────┘ └────┬─────┘
     │           │
     ▼           ▼
┌─────────────────────┐
│  RESOLUTION AGENT    │  ← Generates response using Knowledge Agent
│  (AI Response Gen)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  QA AGENT            │  ← Reviews response for quality/compliance
│  (AI Quality Check)  │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌──────────┐
│ PASS    │ │ FAIL     │
│ → Send  │ │ → Revise │
│ Response│ │   or Esc.│
└─────────┘ └──────────┘
           │
           ▼
┌─────────────────────┐
│  SENTIMENT AGENT     │  ← Tracks conversation sentiment over time
│  (Continuous)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Channel Adapter     │  ← Sends response via original channel
│  (Outbound)          │
└─────────────────────┘
```

---

## 3. Request Flow — Human Agent

```
Agent opens ticket in web/mobile app
         │
         ▼
┌─────────────────────┐
│  Server Component    │  ← Fetches ticket + messages + customer context
│  (Data Loading)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Pusher Channel      │  ← Realtime subscription for ticket updates
│  (private-ticket.id) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AI COPILOT          │  ← Suggests replies, actions, knowledge articles
│  (Realtime Assist)   │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌──────────┐
│ Agent   │ │ Agent    │
│ Uses    │ │ Takes    │
│ Suggest │ │ Action   │
└────┬────┘ └────┬─────┘
     │           │
     ▼           ▼
┌─────────────────────┐
│  Server Action       │  ← Persists response, updates ticket
│  (Mutation)          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Event Emitted       │  ← ticket.updated, message.sent
│  (Event Bus)         │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌──────────┐
│ Pusher  │ │ Trigger  │
│ Notify  │ │ .dev Job │
│ Clients │ │ (SLA,    │
│         │ │  Analytics)│
└─────────┘ └──────────┘
```

---

## 4. Service Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPPORTFLOW AI PLATFORM                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  IDENTITY & ACCESS                       │    │
│  │  • Authentication (NextAuth.js v5)                       │    │
│  │  • Authorization (Casbin RBAC)                           │    │
│  │  • Tenant Management                                     │    │
│  │  • SSO / SAML (Enterprise)                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  CORE PLATFORM                           │    │
│  │  • Ticket Engine                                         │    │
│  │  • Conversation Manager                                  │    │
│  │  • Customer Profile                                      │    │
│  │  • Team & Assignment                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  AI ENGINE                               │    │
│  │  • Agent Orchestrator (OpenAI SDK)                       │    │
│  │  • Knowledge RAG Pipeline                                │    │
│  │  • Sentiment Tracker                                     │    │
│  │  • Response Generator                                    │    │
│  │  • Quality Assurance                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  CHANNEL GATEWAY                         │    │
│  │  • Web Chat (WebSocket)                                  │    │
│  │  • WhatsApp (Business API)                               │    │
│  │  • Email (IMAP/SMTP)                                     │    │
│  │  • SMS (Twilio)                                          │    │
│  │  • Facebook Messenger                                    │    │
│  │  • Instagram DM                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  OPERATIONS                              │    │
│  │  • SLA Engine                                            │    │
│  │  • Escalation workflows                                  │    │
│  │  • Analytics & Reporting                                 │    │
│  │  • Audit Logging                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  INTEGRATIONS                            │    │
│  │  • Webhook Manager                                       │    │
│  │  • API Gateway                                           │    │
│  │  • Import/Export                                         │    │
│  │  • Third-party Connectors                                │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Flow Architecture

### 5.1 Write Path (Optimistic UI)
```
Client Action → Server Action → DB Write → Event Emit → Pusher Broadcast → Client Update
```

### 5.2 Read Path (Server Components)
```
URL Navigation → Server Component → DB Query → Render HTML → Stream to Client
```

### 5.3 AI Processing Path (Async)
```
Message Received → Trigger.dev Job → Agent Pipeline → DB Update → Event → Pusher
```

### 5.4 Webhook Ingestion Path
```
External Webhook → API Route → Signature Verify → Normalize → Event → Agent Pipeline
```

---

## 6. Scaling Strategy

### 6.1 Horizontal Scaling
- **Next.js on Vercel:** Auto-scales serverless functions
- **Neon PostgreSQL:** Autoscaling compute (0.25 to 10 CU)
- **Trigger.dev:** Worker scaling for background jobs
- **Pusher:** Managed, auto-scales connections

### 6.2 Database Scaling
- **Read Replicas:** Neon branching for read-heavy queries
- **Connection Pooling:** Neon's built-in connection pooler (PgBouncer)
- **Partitioning:** Ticket messages partitioned by month
- **Archival:** Tickets older than 2 years archived to cold storage

### 6.3 Caching Strategy
```
L1: Browser Cache (SWR, ISR)
L2: Edge Cache (Vercel Edge, stale-while-revalidate)
L3: Application Cache (Vercel KV / Redis)
L4: Database Cache (Materialized views for analytics)
```

### 6.4 Rate Limiting
```
Per Tenant:
  - API: 1000 req/min (configurable per plan)
  - Webhooks: 100 req/min inbound
  - AI Calls: 100 req/min per agent

Per User:
  - Actions: 60 req/min
  - File Uploads: 10 req/min

Global:
  - Webhook endpoints: 10,000 req/min
```

---

## 7. Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                        │
│                                                          │
│  Layer 1: Edge Security                                  │
│  • DDoS protection (Vercel)                              │
│  • WAF rules                                             │
│  • IP reputation                                         │
│                                                          │
│  Layer 2: Authentication                                 │
│  • NextAuth.js v5 (JWT + Session)                       │
│  • Multi-factor authentication (TOTP, SMS)              │
│  • OAuth 2.0 (Google, Microsoft, GitHub)                │
│  • API key authentication (external APIs)                │
│                                                          │
│  Layer 3: Authorization                                  │
│  • Casbin RBAC engine                                    │
│  • Row-level security (PostgreSQL RLS)                   │
│  • Tenant-scoped queries (enforced at ORM level)        │
│                                                          │
│  Layer 4: Data Security                                  │
│  • Encryption at rest (AES-256, Neon)                   │
│  • Encryption in transit (TLS 1.3)                       │
│  • PII field-level encryption (customer data)           │
│  • Secret management (Vercel encrypted env vars)        │
│                                                          │
│  Layer 5: Audit & Compliance                             │
│  • Full audit trail (every action logged)               │
│  • AI decision traceability                              │
│  • GDPR data export/deletion                             │
│  • SOC 2 compliance controls                             │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PIPELINE                            │
│                                                                  │
│  Developer → GitHub → GitHub Actions → Vercel Preview → Merge   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    PRODUCTION ENVIRONMENT                │    │
│  │                                                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │    │
│  │  │  Vercel   │  │  Neon DB │  │ Trigger  │             │    │
│  │  │  (App)    │  │  (Data)  │  │ .dev     │             │    │
│  │  └──────────┘  └──────────┘  └──────────┘             │    │
│  │                                                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │    │
│  │  │  Pusher   │  │  Vercel  │  │ Vercel   │             │    │
│  │  │  (WS)     │  │  Blob    │  │  KV      │             │    │
│  │  └──────────┘  └──────────┘  └──────────┘             │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    MONITORING                            │    │
│  │  • Vercel Analytics (Web Vitals, Performance)           │    │
│  │  • Sentry (Error Tracking, Performance)                 │    │
│  │  • OpenTelemetry (Distributed Tracing)                  │    │
│  │  • Neon Dashboard (Database Metrics)                    │    │
│  │  • Trigger.dev Dashboard (Job Metrics)                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```
