# SupportFlow AI — API Specification

> RESTful API + Server Actions + Webhook Contracts

---

## 1. API Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    API ARCHITECTURE                               │
│                                                                  │
│  Three API Surfaces:                                           │
│                                                                  │
│  1. Server Actions (Internal — Web App)                        │
│     ├── Used by Next.js Server Components and Client Components│
│     ├── Direct function calls (no HTTP overhead)               │
│     ├── Automatic type safety (TypeScript)                     │
│     └── Auth context from session                              │
│                                                                  │
│  2. REST API (External — v1)                                   │
│     ├── For external integrations and partners                 │
│     ├── API key authentication                                 │
│     ├── Rate limited per key                                   │
│     └── Versioned (/api/v1/...)                                │
│                                                                  │
│  3. Webhook API (Inbound — Channel Ingestion)                  │
│     ├── WhatsApp, Messenger, Instagram, Twilio                │
│     ├── Signature verification                                 │
│     └── Normalized to internal events                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Server Actions (Internal API)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER ACTIONS                                 │
│                                                                  │
│  Auth Actions:                                                  │
│  ├── login(email, password) → Session                          │
│  ├── register(data) → User + Tenant                            │
│  ├── logout() → void                                           │
│  ├── forgotPassword(email) → void                              │
│  ├── resetPassword(token, password) → void                     │
│  └── verifyEmail(token) → void                                 │
│                                                                  │
│  Ticket Actions:                                                │
│  ├── createTicket(data) → Ticket                               │
│  ├── updateTicket(id, data) → Ticket                           │
│  ├── deleteTicket(id) → void                                   │
│  ├── assignTicket(id, assigneeId) → Ticket                     │
│  ├── changeTicketStatus(id, status) → Ticket                   │
│  ├── changeTicketPriority(id, priority) → Ticket               │
│  ├── addTicketTag(id, tag) → Ticket                            │
│  ├── removeTicketTag(id, tag) → Ticket                         │
│  ├── mergeTickets(primaryId, mergeIds) → Ticket                │
│  ├── bulkUpdateTickets(ids, data) → Ticket[]                   │
│  └── exportTickets(filters) → File                             │
│                                                                  │
│  Message Actions:                                               │
│  ├── sendMessage(ticketId, data) → Message                     │
│  ├── addInternalNote(ticketId, content) → Message              │
│  ├── uploadAttachment(ticketId, file) → Attachment             │
│  └── markMessageRead(messageId) → void                         │
│                                                                  │
│  Customer Actions:                                              │
│  ├── createCustomer(data) → Customer                           │
│  ├── updateCustomer(id, data) → Customer                       │
│  ├── deleteCustomer(id) → void                                 │
│  ├── addCustomerNote(id, note) → void                          │
│  └── mergeCustomers(primaryId, mergeIds) → Customer            │
│                                                                  │
│  Knowledge Base Actions:                                        │
│  ├── createArticle(collectionId, data) → Article               │
│  ├── updateArticle(id, data) → Article                         │
│  ├── deleteArticle(id) → void                                  │
│  ├── publishArticle(id) → Article                              │
│  ├── archiveArticle(id) → Article                              │
│  ├── createCollection(data) → Collection                       │
│  ├── updateCollection(id, data) → Collection                   │
│  ├── deleteCollection(id) → void                               │
│  └── searchKnowledge(query, filters) → Article[]               │
│                                                                  │
│  Team Actions:                                                  │
│  ├── createTeam(data) → Team                                   │
│  ├── updateTeam(id, data) → Team                               │
│  ├── deleteTeam(id) → void                                     │
│  ├── addTeamMember(teamId, userId, role) → TeamMember          │
│  ├── removeTeamMember(teamId, userId) → void                   │
│  └── updateTeamMember(teamId, userId, data) → TeamMember       │
│                                                                  │
│  User Actions:                                                  │
│  ├── inviteUser(email, role) → Invitation                      │
│  ├── updateUser(id, data) → User                               │
│  ├── deactivateUser(id) → void                                 │
│  ├── changeUserRole(id, role) → User                           │
│  └── updatePreferences(data) → User                            │
│                                                                  │
│  SLA Actions:                                                   │
│  ├── createSlaPolicy(data) → SLAPolicy                         │
│  ├── updateSlaPolicy(id, data) → SLAPolicy                     │
│  ├── deleteSlaPolicy(id) → void                                │
│  └── getSlaStatus(ticketId) → SLAStatus                        │
│                                                                  │
│  Automation Actions:                                            │
│  ├── createAutomationRule(data) → Rule                         │
│  ├── updateAutomationRule(id, data) → Rule                     │
│  ├── deleteAutomationRule(id) → void                           │
│  ├── toggleAutomationRule(id, enabled) → Rule                  │
│  └── testAutomationRule(id, testData) → ExecutionResult        │
│                                                                  │
│  Settings Actions:                                              │
│  ├── updateTenantSettings(data) → Tenant                       │
│  ├── updateChannelConfig(channel, data) → ChannelConfig        │
│  ├── updateAiSettings(data) → Tenant                           │
│  ├── createApiKey(name, permissions) → ApiKey                  │
│  ├── revokeApiKey(id) → void                                   │
│  ├── createWebhook(data) → Webhook                             │
│  ├── updateWebhook(id, data) → Webhook                         │
│  └── deleteWebhook(id) → void                                  │
│                                                                  │
│  Analytics Actions:                                             │
│  ├── getDashboardMetrics(period) → DashboardMetrics            │
│  ├── getTicketAnalytics(filters) → TicketAnalytics             │
│  ├── getAgentPerformance(filters) → AgentPerformance[]         │
│  ├── getCustomerAnalytics(filters) → CustomerAnalytics         │
│  ├── getAiPerformance(filters) → AiPerformance                 │
│  └── exportReport(type, filters) → File                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. REST API (External v1)

```
┌─────────────────────────────────────────────────────────────────┐
│                    REST API v1                                    │
│                                                                  │
│  Base URL: https://api.supportflow.ai/v1                       │
│  Authentication: Bearer {api_key} or X-API-Key header          │
│                                                                  │
│  Tickets:                                                       │
│  ├── GET    /tickets                List tickets (paginated)   │
│  ├── POST   /tickets                Create ticket              │
│  ├── GET    /tickets/:id            Get ticket                 │
│  ├── PATCH  /tickets/:id            Update ticket              │
│  ├── DELETE /tickets/:id            Delete ticket              │
│  ├── POST   /tickets/:id/assign     Assign ticket              │
│  ├── POST   /tickets/:id/status     Change status              │
│  ├── POST   /tickets/:id/messages   Add message                │
│  ├── GET    /tickets/:id/messages   List messages              │
│  └── POST   /tickets/:id/merge      Merge tickets              │
│                                                                  │
│  Customers:                                                     │
│  ├── GET    /customers              List customers             │
│  ├── POST   /customers              Create customer            │
│  ├── GET    /customers/:id          Get customer               │
│  ├── PATCH  /customers/:id          Update customer            │
│  ├── DELETE /customers/:id          Delete customer            │
│  ├── GET    /customers/:id/tickets  List customer tickets      │
│  └── POST   /customers/search       Search customers           │
│                                                                  │
│  Knowledge Base:                                                │
│  ├── GET    /kb/articles            List articles              │
│  ├── POST   /kb/articles            Create article             │
│  ├── GET    /kb/articles/:id        Get article                │
│  ├── PATCH  /kb/articles/:id        Update article             │
│  ├── DELETE /kb/articles/:id        Delete article             │
│  ├── POST   /kb/search              Semantic search            │
│  ├── GET    /kb/collections         List collections           │
│  └── POST   /kb/collections         Create collection          │
│                                                                  │
│  Teams:                                                         │
│  ├── GET    /teams                  List teams                 │
│  ├── POST   /teams                  Create team                │
│  ├── GET    /teams/:id              Get team                   │
│  ├── PATCH  /teams/:id              Update team                │
│  ├── DELETE /teams/:id              Delete team                │
│  ├── POST   /teams/:id/members      Add member                 │
│  └── DELETE /teams/:id/members/:uid Remove member              │
│                                                                  │
│  Analytics:                                                     │
│  ├── GET    /analytics/dashboard    Dashboard metrics          │
│  ├── GET    /analytics/tickets      Ticket analytics           │
│  ├── GET    /analytics/agents       Agent performance          │
│  ├── GET    /analytics/customers    Customer analytics         │
│  └── GET    /analytics/ai           AI performance             │
│                                                                  │
│  Webhooks:                                                      │
│  ├── GET    /webhooks               List webhooks              │
│  ├── POST   /webhooks               Create webhook             │
│  ├── GET    /webhooks/:id           Get webhook                │
│  ├── PATCH  /webhooks/:id           Update webhook             │
│  ├── DELETE /webhooks/:id           Delete webhook             │
│  └── GET    /webhooks/:id/deliveries Delivery history          │
│                                                                  │
│  Response Format:                                               │
│  {                                                              │
│    "success": true,                                            │
│    "data": { ... },                                            │
│    "meta": {                                                   │
│      "page": 1,                                                │
│      "per_page": 25,                                           │
│      "total": 150,                                             │
│      "total_pages": 6                                          │
│    }                                                           │
│  }                                                              │
│                                                                  │
│  Error Format:                                                  │
│  {                                                              │
│    "success": false,                                           │
│    "error": {                                                  │
│      "code": "VALIDATION_ERROR",                               │
│      "message": "Invalid input",                               │
│      "details": [{ field: "email", message: "Required" }]     │
│    }                                                           │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Webhook Ingestion API

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBHOOK ENDPOINTS                              │
│                                                                  │
│  WhatsApp Business API:                                         │
│  POST /api/webhooks/whatsapp                                   │
│  ├── Signature: X-Hub-Signature-256                           │
│  ├── Verify: GET /api/webhooks/whatsapp (hub.verify_token)    │
│  └── Normalize → event: message.received                      │
│                                                                  │
│  Facebook Messenger:                                            │
│  POST /api/webhooks/messenger                                  │
│  ├── Signature: X-Hub-Signature-256                           │
│  ├── Verify: GET /api/webhooks/messenger (hub.verify_token)   │
│  └── Normalize → event: message.received                      │
│                                                                  │
│  Instagram DM:                                                  │
│  POST /api/webhooks/instagram                                  │
│  ├── Signature: X-Hub-Signature-256                           │
│  └── Normalize → event: message.received                      │
│                                                                  │
│  Twilio (SMS):                                                  │
│  POST /api/webhooks/twilio                                     │
│  ├── Signature: X-Twilio-Signature                            │
│  └── Normalize → event: message.received                      │
│                                                                  │
│  Email (Inbound):                                               │
│  POST /api/webhooks/email                                      │
│  ├── API key auth                                              │
│  └── Normalize → event: message.received                      │
│                                                                  │
│  Stripe (Billing):                                              │
│  POST /api/webhooks/stripe                                     │
│  ├── Signature: Stripe-Signature                              │
│  └── Process subscription events                               │
│                                                                  │
│  Pusher (Realtime Auth):                                        │
│  POST /api/webhooks/pusher/auth                                │
│  ├── Authenticate Pusher channel subscriptions                 │
│  └── Validate user + tenant for private channels              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. API Rate Limiting

```
┌─────────────────────────────────────────────────────────────────┐
│                    RATE LIMITS                                    │
│                                                                  │
│  Server Actions (Internal):                                     │
│  ├── No rate limit (authenticated, same-origin)                │
│  └── CSRF protection via Next.js                               │
│                                                                  │
│  REST API (External):                                           │
│  ├── Starter: 100 req/min                                      │
│  ├── Growth: 500 req/min                                       │
│  ├── Business: 2,000 req/min                                   │
│  └── Enterprise: 10,000 req/min                                │
│                                                                  │
│  Webhook Ingestion:                                             │
│  ├── Per tenant: 100 req/min                                   │
│  ├── Per channel: 50 req/min                                   │
│  └── Global: 10,000 req/min                                    │
│                                                                  │
│  Headers:                                                       │
│  ├── X-RateLimit-Limit: 100                                    │
│  ├── X-RateLimit-Remaining: 95                                 │
│  ├── X-RateLimit-Reset: 1705312800                             │
│  └── Retry-After: 30 (when exceeded)                           │
│                                                                  │
│  Implementation:                                                │
│  ├── Token bucket algorithm                                    │
│  ├── Per-tenant + per-IP tracking                              │
│  ├── Redis-backed (Vercel KV)                                  │
│  └── Edge middleware enforcement                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. API Authentication

```
┌─────────────────────────────────────────────────────────────────┐
│                    API AUTHENTICATION                             │
│                                                                  │
│  Method 1: Session (Web App)                                   │
│  ├── NextAuth.js session cookie                                │
│  ├── httpOnly, secure, sameSite=lax                           │
│  └── JWT with tenant_id, user_id, role                        │
│                                                                  │
│  Method 2: API Key (REST API)                                  │
│  ├── Generated in Settings → API page                         │
│  ├── Format: sf_live_{random_48_chars}                        │
│  ├── Header: Authorization: Bearer sf_live_xxx               │
│  │   OR X-API-Key: sf_live_xxx                                │
│  ├── Permissions: scoped per key                              │
│  └── Revocable at any time                                    │
│                                                                  │
│  Method 3: Webhook Signature (Inbound)                         │
│  ├── HMAC-SHA256 signature verification                       │
│  ├── Per-channel secret                                       │
│  └── Timestamp validation (5 min window)                      │
│                                                                  │
│  Method 4: OAuth 2.0 (Enterprise Integrations)                 │
│  ├── Authorization Code flow                                   │
│  ├── Client credentials flow                                   │
│  └── JWT bearer assertion flow                                │
└─────────────────────────────────────────────────────────────────┘
```
