# SupportFlow AI — Web Application Architecture

> Next.js 15 App Router with Server Components, Server Actions, and Shadcn UI

---

## 1. Application Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 15 APPLICATION                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    EDGE LAYER                             │    │
│  │  middleware.ts                                            │    │
│  │  • Tenant resolution (subdomain → tenant_id)            │    │
│  │  • Auth token validation (JWT verification)              │    │
│  │  • Rate limiting (IP + tenant based)                     │    │
│  │  • Geolocation headers                                   │    │
│  │  • Bot detection (for web chat)                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               SERVER COMPONENTS (RSC)                     │    │
│  │                                                           │    │
│  │  Layout Components (Server)                              │    │
│  │  ├── RootLayout (auth check, theme, providers)          │    │
│  │  ├── PlatformLayout (sidebar, header, breadcrumbs)      │    │
│  │  └── DashboardLayout (stats, charts)                    │    │
│  │                                                           │    │
│  │  Page Components (Server)                                │    │
│  │  ├── TicketListPage (paginated, filtered)               │    │
│  │  ├── TicketDetailPage (conversation + context)          │    │
│  │  ├── CustomerListPage (search, segments)                │    │
│  │  ├── CustomerDetailPage (360° view)                     │    │
│  │  ├── KnowledgeBasePage (article management)             │    │
│  │  ├── AnalyticsPage (charts, metrics)                    │    │
│  │  ├── TeamsPage (team management)                        │    │
│  │  └── SettingsPage (tenant configuration)                │    │
│  │                                                           │    │
│  │  Data Fetching Pattern:                                  │    │
│  │  Server Component → Direct DB Query → Serialized Props   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               SERVER ACTIONS                              │    │
│  │                                                           │    │
│  │  "use server"                                            │    │
│  │                                                           │    │
│  │  Mutation Pattern:                                       │    │
│  │  Client Component → Server Action → DB Write             │    │
│  │                → Event Emit → Pusher Broadcast            │    │
│  │                                                           │    │
│  │  Auth Check → Validate Input → Execute → Return          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               CLIENT COMPONENTS                           │    │
│  │                                                           │    │
│  │  Interactive Components:                                 │    │
│  │  ├── MessageComposer (rich text, attachments)           │    │
│  │  ├── CopilotPanel (AI suggestions, actions)             │    │
│  │  ├── DataTable (sorting, filtering, pagination)         │    │
│  │  ├── TicketFilters (date, priority, status, assignee)   │    │
│  │  ├── SearchCommand (cmd+k global search)                │    │
│  │  ├── NotificationPopover (realtime notifications)       │    │
│  │  └── Chart components (Recharts integration)            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Middleware Pipeline

```typescript
// middleware.ts — Executes at Edge on every request

Request Flow:
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Incoming │───▶│ Tenant   │───▶│ Auth     │───▶│ RBAC     │
│ Request  │    │ Resolve  │    │ Validate │    │ Check    │
└─────────┘    └──────────┘    └──────────┘    └──────────┘
                   │               │               │
                   ▼               ▼               ▼
              Subdomain/      JWT/Session     Permission
              Header Check    Validation      Validation
                   │               │               │
                   ▼               ▼               ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │ Set      │───▶│ Rate     │───▶│ Next     │
              │ Tenant   │    │ Limit    │    │ Handler  │
              │ Context  │    │ Check    │    │          │
              └──────────┘    └──────────┘    └──────────┘
```

---

## 3. Page Architecture

### 3.1 Dashboard Page (Server Component)

```
/dashboard (Server Component)
├── Data Loading (Direct DB Query)
│   ├── Open tickets count
│   ├── Tickets created today
│   ├── Average response time
│   ├── CSAT score
│   ├── SLA compliance %
│   ├── AI resolution rate
│   └── Agent availability
│
├── Server Rendered
│   ├── StatCards (4 key metrics)
│   ├── TicketVolumeChart (7-day)
│   ├── RecentTicketsTable (last 10)
│   ├── AgentPerformanceTable
│   └── SLAStatusPanel
│
└── Client Interactive
    ├── DateRangeSelector
    ├── ExportButton
    └── RefreshButton
```

### 3.2 Ticket List Page

```
/tickets (Server Component)
├── Data Loading
│   ├── Paginated ticket query (cursor-based)
│   ├── Filter by: status, priority, channel, assignee, date
│   └── Full-text search on subject
│
├── Server Rendered
│   ├── TicketListHeader (count, filters summary)
│   └── PaginationInfo
│
└── Client Interactive (Hydrated)
    ├── TicketFilters
    │   ├── StatusFilter (multi-select)
    │   ├── PriorityFilter (multi-select)
    │   ├── ChannelFilter (multi-select)
    │   ├── AssigneeFilter (search + select)
    │   ├── DateRangePicker
    │   └── SearchInput
    ├── TicketTable
    │   ├── Columns: Number, Subject, Customer, Status, Priority, Channel, Assigned, SLA, Updated
    │   ├── Sort by any column
    │   ├── Row click → navigate to detail
    │   └── Bulk actions (assign, close, tag)
    └── Pagination (infinite scroll or traditional)
```

### 3.3 Ticket Detail Page

```
/tickets/[ticketId] (Server Component)
├── Data Loading
│   ├── Ticket + metadata
│   ├── Messages (paginated, newest first)
│   ├── Customer context
│   ├── SLA state
│   ├── AI traces for this ticket
│   └── Ticket events (audit trail)
│
├── Layout (Split View)
│   ├── LEFT: Conversation View (70%)
│   │   ├── TicketHeader
│   │   │   ├── Ticket number + subject
│   │   │   ├── Status badge
│   │   │   ├── Priority badge
│   │   │   ├── Channel icon
│   │   │   └── Action buttons (assign, close, merge)
│   │   │
│   │   ├── MessageList (Server + Client)
│   │   │   ├── MessageBubble (agent/customer/system)
│   │   │   │   ├── Avatar + sender name
│   │   │   │   ├── Timestamp
│   │   │   │   ├── Content (markdown rendered)
│   │   │   │   ├── Attachments
│   │   │   │   └── AI badge (if AI-generated)
│   │   │   └── TypingIndicator (Pusher realtime)
│   │   │
│   │   └── MessageComposer (Client Component)
│   │       ├── RichTextEditor (Tiptap/ProseMirror)
│   │       ├── File upload
│   │       ├── Internal note toggle
│   │       ├── AI copilot trigger
│   │       └── Send button
│   │
│   └── RIGHT: Context Panel (30%)
│       ├── CustomerCard
│       │   ├── Avatar + name
│       │   ├── Email, phone
│       │   ├── Company
│       │   ├── Segment badge
│       │   ├── Lifetime value
│       │   ├── Sentiment score
│       │   └── Link to customer detail
│       │
│       ├── TicketProperties (editable)
│       │   ├── Status dropdown
│       │   ├── Priority dropdown
│       │   ├── Assignee dropdown
│       │   ├── Team dropdown
│       │   ├── Tags (multi-select)
│       │   └── Custom fields
│       │
│       ├── SLAStatus
│       │   ├── First response timer
│       │   ├── Resolution timer
│       │   └── Breach warnings
│       │
│       ├── AIInsights (Copilot)
│       │   ├── Suggested replies
│       │   ├── Related KB articles
│       │   ├── Customer sentiment
│       │   ├── Intent classification
│       │   └── Recommended actions
│       │
│       └── ActivityTimeline
│           ├── Status changes
│           ├── Assignments
│           ├── AI actions
│           └── SLA events
```

---

## 4. Realtime Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    REALTIME ARCHITECTURE                          │
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────┐                 │
│  │   Server Side     │     │   Client Side     │                 │
│  │                   │     │                   │                 │
│  │  Server Action    │     │  Pusher Client    │                 │
│  │  → Pusher Trigger │────▶│  Channel Subscribe│                 │
│  │                   │     │  Event Handlers   │                 │
│  └──────────────────┘     └──────────────────┘                 │
│                                                                  │
│  Pusher Channels:                                               │
│  ────────────────                                               │
│  • private-tenant.{tenantId}          (tenant-wide events)     │
│  • private-ticket.{ticketId}          (ticket updates)         │
│  • private-customer.{customerId}      (customer updates)       │
│  • presence-team.{teamId}             (agent availability)     │
│  • private-notifications.{userId}     (user notifications)     │
│  • private-dashboard.{tenantId}       (dashboard live updates) │
│                                                                  │
│  Events:                                                        │
│  ────────                                                       │
│  ticket.created          → New ticket added to list            │
│  ticket.updated          → Ticket properties changed           │
│  ticket.assigned         → Agent assigned/changed              │
│  message.new             → New message in conversation         │
│  message.typing          → Typing indicator                    │
│  message.read            → Read receipt                        │
│  agent.status            → Agent online/offline/away           │
│  sla.warning             → SLA breach approaching              │
│  sla.breach              → SLA breached                        │
│  notification.new        → New notification                    │
│  dashboard.update        → Live dashboard metric update        │
│  ai.suggestion           → AI copilot suggestion               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE STRATEGY                             │
│                                                              │
│  Layer 1: Server State (Server Components)                  │
│  ├── Page data fetched directly in Server Components        │
│  ├── No client-side cache for server data                   │
│  └── Automatic revalidation via ISR/On-Demand              │
│                                                              │
│  Layer 2: Client State (Zustand)                            │
│  ├── UI State                                               │
│  │   ├── Sidebar open/collapsed                             │
│  │   ├── Active panel (ticket detail)                       │
│  │   ├── Modal state                                        │
│  │   └── Theme                                              │
│  │                                                          │
│  ├── Realtime State                                         │
│  │   ├── Connected users (Pusher presence)                  │
│  │   ├── Typing indicators                                  │
│  │   └── Agent availability                                 │
│  │                                                          │
│  └── Optimistic State                                       │
│      ├── Message send optimistic update                     │
│      └── Ticket status optimistic update                    │
│                                                              │
│  Layer 3: Server Mutations (Server Actions)                 │
│  ├── useTransition for async mutations                      │
│  ├── Optimistic UI with useOptimistic                       │
│  └── Revalidation after mutation                            │
│                                                              │
│  Layer 4: External State (React Query — optional)           │
│  ├── Complex data fetching patterns                         │
│  ├── Polling for real-time dashboards                       │
│  └── Infinite scroll pagination                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Component Architecture

### 6.1 Component Hierarchy

```
RootLayout
├── ThemeProvider
├── AuthProvider (NextAuth SessionProvider)
├── PusherProvider (WebSocket connection)
├── TenantProvider (tenant context)
├── QueryClientProvider (React Query)
├── Toaster (notifications)
└── children

PlatformLayout (authenticated)
├── Sidebar
│   ├── Logo
│   ├── TeamSwitcher
│   ├── NavItems
│   │   ├── Dashboard
│   │   ├── Tickets (with badge count)
│   │   ├── Customers
│   │   ├── Knowledge
│   │   ├── Analytics
│   │   ├── Teams
│   │   ├── Escalation
│   │   ├── Automation
│   │   └── Settings
│   └── CollapseButton
├── Header
│   ├── Breadcrumbs
│   ├── Search (cmd+K)
│   ├── Notifications
│   └── UserMenu
├── MainContent
│   └── {page}
└── MobileNav (bottom tabs on mobile)
```

### 6.2 Shared Component Patterns

```
Data Table Pattern:
├── DataTable<T> (generic wrapper)
│   ├── DataTableToolbar (filters, search, actions)
│   ├── DataTableContent (rendered rows)
│   ├── DataTablePagination (page controls)
│   └── DataTableEmpty (empty state)
│
└── Column Definition
    ├── accessorKey / accessorFn
    ├── header (string or component)
    ├── cell (render function)
    ├── enableSorting
    ├── enableFiltering
    └── meta (alignment, width, etc.)

Form Pattern:
├── FormWrapper (react-hook-form + zod)
│   ├── FormField (label + input + error)
│   ├── FormSection (grouped fields)
│   └── FormActions (submit, cancel)
│
└── Validation
    ├── Client-side: Zod schema
    ├── Server-side: Same Zod schema in Server Action
    └── Shared: packages/validators
```

---

## 7. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                            │
│                                                                  │
│  Login Methods:                                                 │
│  1. Email + Password (Credentials)                             │
│  2. Google OAuth                                               │
│  3. Microsoft OAuth                                            │
│  4. Magic Link (Email)                                         │
│  5. SSO/SAML (Enterprise)                                      │
│                                                                  │
│  Flow:                                                          │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │ User    │───▶│ NextAuth │───▶│ Provider │───▶│ Callback │ │
│  │ Login   │    │ Route    │    │ Auth     │    │ + JWT    │ │
│  └─────────┘    └──────────┘    └──────────┘    └──────────┘ │
│                                                                  │
│  Session Management:                                            │
│  • JWT stored in httpOnly cookie                               │
│  • 30-day session expiry                                       │
│  • Refresh token rotation                                      │
│  • Concurrent session limit (configurable per plan)            │
│                                                                  │
│  MFA (Optional):                                               │
│  • TOTP (Google Authenticator, Authy)                          │
│  • SMS verification                                            │
│  • Backup codes                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING STRATEGY                        │
│                                                                  │
│  Level 1: Route Error Boundaries                               │
│  ├── error.tsx (per-route)                                     │
│  ├── Not Found (404)                                           │
│  └── Global Error Boundary                                     │
│                                                                  │
│  Level 2: Server Action Errors                                 │
│  ├── Validation errors (Zod) → Return field errors             │
│  ├── Auth errors → Redirect to login                           │
│  ├── Permission errors → 403 response                          │
│  ├── Not found → 404 response                                  │
│  └── Server errors → 500 + Sentry capture                     │
│                                                                  │
│  Level 3: Client Errors                                        │
│  ├── API errors → Toast notifications                          │
│  ├── Network errors → Retry logic                              │
│  └── Optimistic rollback on failure                            │
│                                                                  │
│  Level 4: Monitoring                                           │
│  ├── Sentry error tracking                                     │
│  ├── Custom error boundaries per module                        │
│  └── AI error logging (agent failures)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE STRATEGY                          │
│                                                                  │
│  Rendering Strategy:                                           │
│  ├── Server Components (default) — zero client JS              │
│  ├── Client Components only for interactivity                  │
│  ├── Streaming with Suspense boundaries                        │
│  └── Partial prerendering (PPR) for fast initial load          │
│                                                                  │
│  Data Fetching:                                                │
│  ├── Parallel data fetching in Server Components               │
│  ├── Cursor-based pagination (no offset)                       │
│  ├── Selective field selection                                 │
│  └── Database query optimization (indexes, covering)           │
│                                                                  │
│  Bundle Optimization:                                          │
│  ├── Dynamic imports for heavy components                      │
│  ├── Route-based code splitting                                │
│  ├── Tree shaking Shadcn components                            │
│  └── Image optimization (next/image)                           │
│                                                                  │
│  Caching:                                                      │
│  ├── ISR for public pages (revalidate: 60)                     │
│  ├── On-demand revalidation for mutations                      │
│  ├── Edge caching for static assets                            │
│  └── Client-side SWR for realtime data                         │
│                                                                  │
│  Target Metrics:                                               │
│  ├── LCP: < 1.5s                                              │
│  ├── FID: < 100ms                                             │
│  ├── CLS: < 0.1                                               │
│  ├── TTI: < 2.0s                                              │
│  └── Server Response: < 200ms (p95)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Deployment Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL DEPLOYMENT                             │
│                                                                  │
│  Build:                                                        │
│  ├── Framework: Next.js 15                                     │
│  ├── Build Command: pnpm build                                │
│  ├── Output: Standalone                                        │
│  └── Install: pnpm install --frozen-lockfile                  │
│                                                                  │
│  Environment Variables:                                        │
│  ├── DATABASE_URL (Neon PostgreSQL connection string)          │
│  ├── NEXTAUTH_SECRET                                          │
│  ├── NEXTAUTH_URL                                             │
│  ├── OPENAI_API_KEY                                           │
│  ├── PUSHER_APP_ID                                            │
│  ├── PUSHER_KEY                                               │
│  ├── PUSHER_SECRET                                            │
│  ├── STRIPE_SECRET_KEY                                        │
│  ├── STRIPE_WEBHOOK_SECRET                                    │
│  ├── TRIGGER_DEV_API_KEY                                      │
│  └── ... (all encrypted)                                      │
│                                                                  │
│  Regions:                                                      │
│  ├── Production: iad1 (Virginia) — primary                    │
│  ├── Edge: all Vercel edge locations                          │
│  └── Database: us-east-1 (Neon)                               │
│                                                                  │
│  Domains:                                                      │
│  ├── app.supportflow.ai (main application)                    │
│  ├── api.supportflow.ai (API endpoints)                       │
│  ├── docs.supportflow.ai (documentation)                      │
│  └── *.app.supportflow.ai (tenant subdomains)                 │
│                                                                  │
│  Preview Deployments:                                          │
│  ├── Auto-deploy on PR                                        │
│  ├── Preview URL: {branch}--supportflow-ai.vercel.app         │
│  └── Preview database (Neon branch)                            │
└─────────────────────────────────────────────────────────────────┘
```
