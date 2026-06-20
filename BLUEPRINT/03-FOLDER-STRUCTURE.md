# SupportFlow AI — Folder Structure

---

## 1. Monorepo Root Structure

```
supportflow-ai/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, typecheck, test
│       ├── cd-web.yml                # Deploy web to Vercel
│       ├── cd-mobile.yml             # Build Expo app
│       └── trigger-dev.yml           # Deploy Trigger.dev jobs
│
├── apps/
│   ├── web/                          # Next.js 15 web application
│   ├── mobile/                       # React Native Expo app
│   └── widget/                       # Embeddable chat widget
│
├── packages/
│   ├── ui/                           # Shared UI components (Shadcn)
│   ├── database/                     # Drizzle schema, migrations, seed
│   ├── ai/                           # Agent definitions, prompts, tools
│   ├── config/                       # Shared configs (tsconfig, eslint)
│   ├── types/                        # Shared TypeScript types
│   ├── utils/                        # Shared utilities
│   └── validators/                   # Zod schemas (shared validation)
│
├── services/
│   ├── trigger-dev/                  # Background job definitions
│   └── webhook-ingest/               # Webhook processing service
│
├── docs/
│   └── BLUEPRINT/                    # This blueprint
│
├── scripts/
│   ├── seed.ts                       # Database seeding
│   ├── migrate.ts                    # Migration runner
│   └── generate-types.ts             # Type generation
│
├── turbo.json                        # Turborepo config
├── package.json                      # Root package.json
├── pnpm-workspace.yaml               # pnpm workspace
├── .env.example                      # Environment template
└── README.md
```

---

## 2. Web Application (`apps/web/`)

```
apps/web/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   ├── robots.txt
│   ├── manifest.json                 # PWA manifest
│   └── widgets/
│       └── chat.js                   # Embeddable widget script
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes (public)
│   │   │   ├── layout.tsx            # Auth layout (centered)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   ├── verify-email/
│   │   │   │   └── page.tsx
│   │   │   └── invite/[token]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (platform)/               # Authenticated platform routes
│   │   │   ├── layout.tsx            # Platform layout (sidebar, header)
│   │   │   ├── layout.server.tsx     # Server-side data loading
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx          # Main dashboard
│   │   │   │   └── loading.tsx
│   │   │   │
│   │   │   ├── tickets/
│   │   │   │   ├── page.tsx          # Ticket list
│   │   │   │   ├── [ticketId]/
│   │   │   │   │   ├── page.tsx      # Ticket detail (conversation view)
│   │   │   │   │   ├── loading.tsx
│   │   │   │   │   └── not-found.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx      # Create ticket
│   │   │   │
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx          # Customer list
│   │   │   │   ├── [customerId]/
│   │   │   │   │   ├── page.tsx      # Customer detail (360° view)
│   │   │   │   │   └── loading.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── knowledge/
│   │   │   │   ├── page.tsx          # KB overview
│   │   │   │   ├── collections/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [collectionId]/
│   │   │   │   │       ├── page.tsx  # Collection detail
│   │   │   │   │       └── articles/
│   │   │   │   │           └── [articleId]/
│   │   │   │   │               └── page.tsx  # Article editor
│   │   │   │   └── articles/
│   │   │   │       └── [articleId]/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   ├── page.tsx          # Analytics overview
│   │   │   │   ├── tickets/
│   │   │   │   │   └── page.tsx      # Ticket analytics
│   │   │   │   ├── agents/
│   │   │   │   │   └── page.tsx      # Agent performance
│   │   │   │   ├── customers/
│   │   │   │   │   └── page.tsx      # Customer analytics
│   │   │   │   └── ai/
│   │   │   │       └── page.tsx      # AI performance metrics
│   │   │   │
│   │   │   ├── teams/
│   │   │   │   ├── page.tsx          # Team list
│   │   │   │   ├── [teamId]/
│   │   │   │   │   └── page.tsx      # Team detail
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── escalation/
│   │   │   │   └── page.tsx          # Escalation center
│   │   │   │
│   │   │   ├── automation/
│   │   │   │   ├── page.tsx          # Automation rules list
│   │   │   │   ├── [ruleId]/
│   │   │   │   │   └── page.tsx      # Rule editor
│   │   │   │   └── executions/
│   │   │   │       └── page.tsx      # Execution history
│   │   │   │
│   │   │   ├── sla/
│   │   │   │   ├── page.tsx          # SLA policies
│   │   │   │   ├── [policyId]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── monitor/
│   │   │   │       └── page.tsx      # SLA monitoring dashboard
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── page.tsx          # Settings overview
│   │   │       ├── general/
│   │   │       │   └── page.tsx      # Tenant settings
│   │   │       ├── channels/
│   │   │       │   └── page.tsx      # Channel configuration
│   │   │       ├── agents/
│   │   │       │   └── page.tsx      # AI agent settings
│   │   │       ├── members/
│   │   │       │   └── page.tsx      # Team member management
│   │   │       ├── billing/
│   │   │       │   └── page.tsx      # Billing & subscription
│   │   │       ├── api/
│   │   │       │   └── page.tsx      # API keys & webhooks
│   │   │       └── security/
│   │   │           └── page.tsx      # Security settings
│   │   │
│   │   ├── (widget)/                 # Chat widget routes
│   │   │   ├── widget/
│   │   │   │   └── page.tsx          # Widget embed page
│   │   │   └── widget/[tenantId]/
│   │   │       └── page.tsx          # Tenant-specific widget
│   │   │
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts      # NextAuth handler
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── whatsapp/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── messenger/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── instagram/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── twilio/
│   │   │   │   │   └── route.ts
│   │   │   │   └── pusher/
│   │   │   │       └── auth.ts       # Pusher channel auth
│   │   │   ├── channels/
│   │   │   │   └── chat/
│   │   │   │       └── route.ts      # Web chat WebSocket/SSE
│   │   │   ├── ai/
│   │   │   │   ├── copilot/
│   │   │   │   │   └── route.ts      # AI copilot endpoint
│   │   │   │   └── knowledge/
│   │   │   │       └── search/
│   │   │   │           └── route.ts  # KB semantic search
│   │   │   ├── tRPC/                 # tRPC handler (optional)
│   │   │   │   └── [trpc]/
│   │   │   │       └── route.ts
│   │   │   └── v1/                   # Public REST API
│   │   │       ├── tickets/
│   │   │       │   └── route.ts
│   │   │       ├── customers/
│   │   │       │   └── route.ts
│   │   │       └── health/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   └── globals.css               # TailwindCSS imports + custom styles
│   │
│   ├── actions/                      # Server Actions
│   │   ├── auth.actions.ts           # Login, register, logout
│   │   ├── ticket.actions.ts         # Ticket CRUD, assignment
│   │   ├── customer.actions.ts       # Customer CRUD
│   │   ├── message.actions.ts        # Send message
│   │   ├── kb.actions.ts             # Knowledge base CRUD
│   │   ├── team.actions.ts           # Team management
│   │   ├── sla.actions.ts            # SLA policy management
│   │   ├── automation.actions.ts     # Automation rule management
│   │   ├── settings.actions.ts       # Tenant settings
│   │   ├── invite.actions.ts         # User invitations
│   │   └── analytics.actions.ts      # Analytics queries
│   │
│   ├── components/
│   │   ├── ui/                       # Shadcn UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── table.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── command.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── select.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── date-picker.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   ├── sidebar/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── nav-item.tsx
│   │   │   │   ├── team-switcher.tsx
│   │   │   │   └── collapse-button.tsx
│   │   │   ├── header/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── search.tsx
│   │   │   │   ├── notifications.tsx
│   │   │   │   └── user-menu.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── breadcrumbs.tsx
│   │   │
│   │   ├── tickets/                  # Ticket module components
│   │   │   ├── ticket-list.tsx
│   │   │   ├── ticket-detail.tsx
│   │   │   ├── ticket-header.tsx
│   │   │   ├── ticket-sidebar.tsx
│   │   │   ├── conversation-view.tsx
│   │   │   ├── message-bubble.tsx
│   │   │   ├── message-composer.tsx
│   │   │   ├── ticket-filters.tsx
│   │   │   ├── ticket-properties.tsx
│   │   │   └── sla-badge.tsx
│   │   │
│   │   ├── customers/                # Customer module components
│   │   │   ├── customer-list.tsx
│   │   │   ├── customer-detail.tsx
│   │   │   ├── customer-timeline.tsx
│   │   │   ├── customer-properties.tsx
│   │   │   └── customer-channels.tsx
│   │   │
│   │   ├── knowledge/                # Knowledge base components
│   │   │   ├── article-list.tsx
│   │   │   ├── article-editor.tsx
│   │   │   ├── article-preview.tsx
│   │   │   ├── collection-tree.tsx
│   │   │   └── search-results.tsx
│   │   │
│   │   ├── analytics/                # Analytics components
│   │   │   ├── charts/
│   │   │   │   ├── ticket-volume.tsx
│   │   │   │   ├── response-time.tsx
│   │   │   │   ├── resolution-rate.tsx
│   │   │   │   ├── csat-chart.tsx
│   │   │   │   ├── ai-performance.tsx
│   │   │   │   └── agent-performance.tsx
│   │   │   ├── stat-cards/
│   │   │   │   ├── open-tickets.tsx
│   │   │   │   ├── avg-response.tsx
│   │   │   │   ├── resolution-rate.tsx
│   │   │   │   └── csat-score.tsx
│   │   │   └── report-builder.tsx
│   │   │
│   │   ├── ai/                       # AI components
│   │   │   ├── copilot-panel.tsx
│   │   │   ├── suggested-replies.tsx
│   │   │   ├── ai-confidence-badge.tsx
│   │   │   ├── sentiment-indicator.tsx
│   │   │   ├── intent-badge.tsx
│   │   │   └── ai-trace-viewer.tsx
│   │   │
│   │   ├── teams/                    # Team components
│   │   │   ├── team-list.tsx
│   │   │   ├── team-form.tsx
│   │   │   └── agent-availability.tsx
│   │   │
│   │   └── shared/                   # Shared components
│   │       ├── data-table.tsx
│   │       ├── empty-state.tsx
│   │       ├── error-boundary.tsx
│   │       ├── loading-states.tsx
│   │       ├── page-header.tsx
│   │       ├── confirm-dialog.tsx
│   │       ├── search-input.tsx
│   │       ├── file-upload.tsx
│   │       └── rich-text-editor.tsx
│   │
│   ├── lib/                          # Utility libraries
│   │   ├── auth.ts                   # NextAuth config
│   │   ├── db.ts                     # Drizzle client
│   │   ├── pusher.ts                 # Pusher client
│   │   ├── openai.ts                 # OpenAI client
│   │   ├── stripe.ts                 # Stripe client
│   │   ├── email.ts                  # Email sender
│   │   ├── storage.ts                # Blob storage
│   │   ├── redis.ts                  # Redis/KV client
│   │   ├── rbac.ts                   # RBAC engine
│   │   ├── tenant.ts                 # Tenant context
│   │   ├── rate-limit.ts             # Rate limiter
│   │   ├── crypto.ts                 # Encryption helpers
│   │   └── utils.ts                  # General utilities
│   │
│   ├── hooks/                        # React hooks
│   │   ├── use-ticket.ts
│   │   ├── use-customer.ts
│   │   ├── use-pusher.ts
│   │   ├── use-realtime.ts
│   │   ├── use-copilot.ts
│   │   ├── use-debounce.ts
│   │   └── use-media-query.ts
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── ticket-store.ts
│   │   ├── notification-store.ts
│   │   ├── ui-store.ts
│   │   └── realtime-store.ts
│   │
│   ├── types/                        # App-specific types
│   │   ├── ticket.types.ts
│   │   ├── customer.types.ts
│   │   ├── user.types.ts
│   │   ├── channel.types.ts
│   │   ├── ai.types.ts
│   │   └── index.ts
│   │
│   └── styles/                       # Custom styles
│       ├── globals.css
│       └── editor.css
│
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # TailwindCSS config
├── postcss.config.js
├── tsconfig.json
├── .env.local
└── package.json
```

---

## 3. Mobile Application (`apps/mobile/`)

```
apps/mobile/
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   ├── onboarding/
│   │   └── empty-states/
│   ├── fonts/
│   │   ├── Inter-Regular.ttf
│   │   ├── Inter-Medium.ttf
│   │   └── Inter-Bold.ttf
│   └── icons/
│       └── splash.png
│
├── src/
│   ├── app/                          # Expo Router routes
│   │   ├── _layout.tsx               # Root layout (providers)
│   │   ├── index.tsx                 # Entry redirect
│   │   │
│   │   ├── (auth)/                   # Auth screens
│   │   │   ├── _layout.tsx           # Auth stack layout
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── forgot-password.tsx
│   │   │
│   │   ├── (tabs)/                   # Main tab navigation
│   │   │   ├── _layout.tsx           # Tab bar layout
│   │   │   ├── dashboard/
│   │   │   │   └── index.tsx         # Dashboard home
│   │   │   ├── tickets/
│   │   │   │   ├── index.tsx         # Ticket list
│   │   │   │   └── [id].tsx          # Ticket detail
│   │   │   ├── customers/
│   │   │   │   ├── index.tsx         # Customer list
│   │   │   │   └── [id].tsx          # Customer detail
│   │   │   ├── messages/
│   │   │   │   └── index.tsx         # Unified inbox
│   │   │   └── more/
│   │   │       └── index.tsx         # More menu
│   │   │
│   │   └── (+)/                      # Modal screens
│   │       ├── create-ticket.tsx
│   │       ├── scan-barcode.tsx
│   │       └── settings.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # React Native UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── bottom-sheet.tsx
│   │   │   └── ...
│   │   │
│   │   ├── tickets/
│   │   │   ├── ticket-list-item.tsx
│   │   │   ├── ticket-detail.tsx
│   │   │   ├── message-bubble.tsx
│   │   │   └── message-input.tsx
│   │   │
│   │   ├── customers/
│   │   │   ├── customer-list-item.tsx
│   │   │   └── customer-detail.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── stat-card.tsx
│   │   │   └── quick-actions.tsx
│   │   │
│   │   └── shared/
│   │       ├── loading.tsx
│   │       ├── empty-state.tsx
│   │       ├── error-boundary.tsx
│   │       └── search-bar.tsx
│   │
│   ├── lib/
│   │   ├── api.ts                    # API client
│   │   ├── auth.ts                   # Auth helpers
│   │   ├── storage.ts                # AsyncStorage
│   │   ├── pusher.ts                 # Pusher client
│   │   ├── notifications.ts          # Push notifications
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── use-tickets.ts
│   │   ├── use-customers.ts
│   │   ├── use-realtime.ts
│   │   └── use-auth.ts
│   │
│   ├── stores/
│   │   ├── auth-store.ts
│   │   ├── ticket-store.ts
│   │   └── ui-store.ts
│   │
│   ├── types/
│   │   ├── ticket.types.ts
│   │   ├── customer.types.ts
│   │   └── index.ts
│   │
│   └── constants/
│       ├── colors.ts
│       ├── layout.ts
│       └── api.ts
│
├── app.json                          # Expo config
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── eas.json                          # EAS Build config
└── package.json
```

---

## 4. Chat Widget (`apps/widget/`)

```
apps/widget/
├── src/
│   ├── index.tsx                     # Widget entry point
│   ├── Widget.tsx                    # Main widget component
│   ├── components/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── InputArea.tsx
│   │   ├── PreChatForm.tsx
│   │   ├── MinimizedBubble.tsx
│   │   └── TypingIndicator.tsx
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   └── useMessages.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── theme.ts
│   └── types/
│       └── index.ts
│
├── package.json
├── tsconfig.json
└── vite.config.ts                    # Vite for widget bundle
```

---

## 5. Database Package (`packages/database/`)

```
packages/database/
├── src/
│   ├── index.ts                      # Public exports
│   ├── client.ts                     # Drizzle client setup
│   │
│   ├── schema/
│   │   ├── index.ts                  # Re-exports all schemas
│   │   ├── tenants.ts
│   │   ├── users.ts
│   │   ├── customers.ts
│   │   ├── tickets.ts
│   │   ├── messages.ts
│   │   ├── teams.ts
│   │   ├── sla.ts
│   │   ├── knowledge-base.ts
│   │   ├── automation.ts
│   │   ├── analytics.ts
│   │   ├── webhooks.ts
│   │   ├── notifications.ts
│   │   ├── audit.ts
│   │   └── attachments.ts
│   │
│   ├── migrations/
│   │   ├── 0000_initial.ts
│   │   ├── 0001_add_sla.ts
│   │   ├── 0002_add_knowledge.ts
│   │   └── ...
│   │
│   ├── seed/
│   │   ├── index.ts
│   │   ├── tenant.ts
│   │   ├── users.ts
│   │   └── knowledge-base.ts
│   │
│   └── types.ts                      # Generated types
│
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

---

## 6. AI Package (`packages/ai/`)

```
packages/ai/
├── src/
│   ├── index.ts
│   │
│   ├── agents/
│   │   ├── index.ts                  # Agent registry
│   │   ├── intake.agent.ts
│   │   ├── knowledge.agent.ts
│   │   ├── resolution.agent.ts
│   │   ├── qa.agent.ts
│   │   ├── escalation.agent.ts
│   │   ├── sentiment.agent.ts
│   │   └── analytics.agent.ts
│   │
│   ├── orchestrator.ts               # Agent orchestration logic
│   │
│   ├── tools/
│   │   ├── index.ts
│   │   ├── knowledge-search.ts       # Search KB tool
│   │   ├── create-ticket.ts          # Create ticket tool
│   │   ├── update-ticket.ts          # Update ticket tool
│   │   ├── assign-ticket.ts          # Assign ticket tool
│   │   ├── send-message.ts           # Send message tool
│   │   ├── get-customer.ts           # Get customer info tool
│   │   ├── escalate.ts               # Escalation tool
│   │   └── analytics-query.ts        # Query analytics tool
│   │
│   ├── prompts/
│   │   ├── intake/
│   │   │   ├── system.ts
│   │   │   └── classify.ts
│   │   ├── knowledge/
│   │   │   ├── system.ts
│   │   │   └── retrieve.ts
│   │   ├── resolution/
│   │   │   ├── system.ts
│   │   │   ├── draft-reply.ts
│   │   │   └── auto-resolve.ts
│   │   ├── qa/
│   │   │   ├── system.ts
│   │   │   └── review.ts
│   │   ├── escalation/
│   │   │   ├── system.ts
│   │   │   └── determine.ts
│   │   ├── sentiment/
│   │   │   ├── system.ts
│   │   │   └── analyze.ts
│   │   └── copilot/
│   │       ├── system.ts
│   │       └── suggest.ts
│   │
│   ├── guardrails/
│   │   ├── index.ts
│   │   ├── pii-filter.ts             # Redact PII in AI responses
│   │   ├── tone-checker.ts           # Ensure professional tone
│   │   ├── fact-checker.ts           # Verify against KB
│   │   └── compliance.ts             # Compliance rules
│   │
│   ├── embeddings/
│   │   ├── generate.ts               # Generate embeddings
│   │   ├── search.ts                 # Similarity search
│   │   └── upsert.ts                 # Update embeddings
│   │
│   └── types.ts
│
├── package.json
└── tsconfig.json
```

---

## 7. Trigger.dev Jobs (`services/trigger-dev/`)

```
services/trigger-dev/
├── src/
│   ├── index.ts                      # Job registry
│   │
│   ├── jobs/
│   │   ├── process-message.ts        # Process inbound message
│   │   ├── classify-ticket.ts        # AI ticket classification
│   │   ├── generate-response.ts      # AI response generation
│   │   ├── check-sla.ts              # SLA monitoring cron
│   │   ├── aggregate-metrics.ts      # Metrics aggregation
│   │   ├── send-email.ts             # Outbound email
│   │   ├── send-webhook.ts           # Webhook delivery
│   │   ├── sync-embeddings.ts        # KB embedding sync
│   │   ├── customer-digest.ts        # Customer digest email
│   │   └── cleanup-old-data.ts       # Data archival
│   │
│   └── triggers/
│       ├── message.received.ts
│       ├── ticket.created.ts
│       ├── ticket.updated.ts
│       ├── sla.check.ts
│       └── schedule.ts               # Cron schedules
│
├── package.json
└── tsconfig.json
```

---

## 8. Shared Packages

### `packages/ui/`
```
packages/ui/
├── src/
│   ├── index.ts
│   ├── components/                   # Shared Shadcn components
│   ├── hooks/                        # Shared hooks
│   ├── lib/                          # Shared utilities
│   └── styles/                       # Shared styles
├── package.json
└── tsconfig.json
```

### `packages/types/`
```
packages/types/
├── src/
│   ├── index.ts
│   ├── ticket.ts
│   ├── customer.ts
│   ├── user.ts
│   ├── team.ts
│   ├── channel.ts
│   ├── ai.ts
│   ├── sla.ts
│   ├── automation.ts
│   ├── analytics.ts
│   ├── api.ts
│   └── events.ts
├── package.json
└── tsconfig.json
```

### `packages/validators/`
```
packages/validators/
├── src/
│   ├── index.ts
│   ├── ticket.ts                     # Zod schemas for tickets
│   ├── customer.ts
│   ├── user.ts
│   ├── team.ts
│   ├── sla.ts
│   ├── knowledge.ts
│   ├── automation.ts
│   └── settings.ts
├── package.json
└── tsconfig.json
```

---

## 9. Configuration Files

```
supportflow-ai/
├── turbo.json                        # Turborepo pipeline
├── pnpm-workspace.yaml               # Workspace definition
├── package.json                      # Root scripts
├── .env.example                      # Environment template
├── .gitignore
├── .prettierrc
├── .eslintrc.js
└── tsconfig.base.json                # Base TypeScript config
```
