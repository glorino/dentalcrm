# SupportFlow AI — Multi-Tenant SaaS Architecture

> Tenant Isolation, Provisioning, Billing, and Scalability

---

## 1. Multi-Tenant Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT ARCHITECTURE                      │
│                                                                  │
│  Model: Shared Database, Shared Schema (Row-Level Isolation)   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    TENANT RESOLUTION                      │    │
│  │                                                          │    │
│  │  Request → Middleware → Resolve Tenant → Set Context     │    │
│  │                                                          │    │
│  │  Resolution Methods (priority order):                    │    │
│  │  1. Subdomain: {tenant}.app.supportflow.ai             │    │
│  │  2. Custom domain: support.{tenant}.com                │    │
│  │  3. Header: X-Tenant-ID (API requests)                 │    │
│  │  4. Path: /t/{tenantId}/...                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    ISOLATION LAYERS                       │    │
│  │                                                          │    │
│  │  Layer 1: Network (Vercel Edge)                         │    │
│  │  ├── Tenant-specific subdomain routing                  │    │
│  │  ├── Custom domain SSL certificates                     │    │
│  │  └── DDoS protection per tenant                         │    │
│  │                                                          │    │
│  │  Layer 2: Application (Middleware)                      │    │
│  │  ├── Tenant context injection                           │    │
│  │  ├── Feature gating per plan                            │    │
│  │  └── Rate limiting per tenant                           │    │
│  │                                                          │    │
│  │  Layer 3: ORM (Drizzle)                                 │    │
│  │  ├── Automatic tenant_id scoping                        │    │
│  │  ├── Query builder with tenant filter                   │    │
│  │  └── Cross-tenant query prevention                      │    │
│  │                                                          │    │
│  │  Layer 4: Database (PostgreSQL RLS)                     │    │
│  │  ├── Row-Level Security policies                        │    │
│  │  ├── tenant_id = current_setting('app.tenant_id')      │    │
│  │  └── Cannot bypass (even raw SQL)                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Tenant Provisioning Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEW TENANT ONBOARDING                          │
│                                                                  │
│  Step 1: Registration                                           │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐                  │
│  │ User    │───▶│ Create   │───▶│ Verify   │                  │
│  │ Signs Up│    │ Account  │    │ Email    │                  │
│  └─────────┘    └──────────┘    └──────────┘                  │
│                                                                  │
│  Step 2: Tenant Creation (Server Action)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Create tenant record (slug, name, plan='starter')   │   │
│  │  2. Create admin user (role='admin')                    │   │
│  │  3. Create default team                                 │   │
│  │  4. Create default SLA policy                           │   │
│  │  5. Create channel config (web_chat enabled)            │   │
│  │  6. Create KB collection (default)                      │   │
│  │  7. Initialize Stripe subscription                      │   │
│  │  8. Send welcome email                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Step 3: Onboarding Wizard (Web App)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Screen 1: Company info (name, logo, timezone)         │   │
│  │  Screen 2: Team setup (invite members)                 │   │
│  │  Screen 3: Channel setup (connect WhatsApp, email)     │   │
│  │  Screen 4: Knowledge base (import articles)            │   │
│  │  Screen 5: AI settings (customize AI behavior)         │   │
│  │  Screen 6: Widget setup (install chat widget)          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Step 4: Go Live                                                │
│  ├── Chat widget installed on customer's website               │
│  ├── First inbound message triggers AI pipeline                │
│  └── Dashboard shows real-time metrics                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Plan & Feature Gating

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLAN CONFIGURATION                             │
│                                                                  │
│  Plans:                                                         │
│  ├── starter: $49/mo                                           │
│  │   ├── 3 agents                                             │
│  │   ├── 500 AI resolutions/mo                                │
│  │   ├── 1,000 tickets/mo                                     │
│  │   ├── 100 KB articles                                      │
│  │   ├── Channels: web, email                                 │
│  │   ├── Basic analytics                                      │
│  │   └── Email support                                        │
│  │                                                          │
│  ├── growth: $149/mo                                          │
│  │   ├── 10 agents                                            │
│  │   ├── 2,500 AI resolutions/mo                             │
│  │   ├── 10,000 tickets/mo                                   │
│  │   ├── 500 KB articles                                     │
│  │   ├── Channels: all                                        │
│  │   ├── Advanced analytics                                  │
│  │   ├── SLA management                                       │
│  │   ├── Automation rules                                     │
│  │   └── Priority support                                     │
│  │                                                          │
│  ├── business: $399/mo                                         │
│  │   ├── 50 agents                                            │
│  │   ├── 10,000 AI resolutions/mo                            │
│  │   ├── 100,000 tickets/mo                                  │
│  │   ├── Unlimited KB articles                                │
│  │   ├── All channels + API access                            │
│  │   ├── Custom AI models                                     │
│  │   ├── SSO/SAML                                             │
│  │   └── Dedicated support                                    │
│  │                                                          │
│  └── enterprise: Custom                                        │
│      ├── Unlimited everything                                │
│      ├── Custom AI training                                  │
│      ├── On-premise deployment option                        │
│      ├── Dedicated infrastructure                            │
│      ├── SLA guarantees                                       │
│      └── 24/7 support                                         │
│                                                                  │
│  Feature Gating:                                               │
│  ├── features = PLAN_FEATURES[tenant.plan]                    │
│  ├── if (!features.has(feature)) → show upgrade modal         │
│  ├── Usage tracking → warn at 80% → block at 100%            │
│  └── Enterprise: custom feature flags per tenant              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Billing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BILLING SYSTEM                                 │
│                                                                  │
│  Stripe Integration:                                            │
│  ├── Stripe Customer per tenant                                │
│  ├── Stripe Subscription per tenant                            │
│  ├── Stripe Products per plan                                  │
│  └── Stripe Webhooks for events                                │
│                                                                  │
│  Usage-Based Billing:                                           │
│  ├── AI resolutions tracked per tenant                         │
│  ├── Metered billing via Stripe Usage API                      │
│  ├── Monthly reset on billing cycle                            │
│  └── Overage charges (configurable)                            │
│                                                                  │
│  Webhook Events:                                                │
│  ├── checkout.session.completed → Activate subscription       │
│  ├── invoice.paid → Extend subscription                        │
│  ├── invoice.payment_failed → Notify + grace period            │
│  ├── customer.subscription.updated → Plan change               │
│  ├── customer.subscription.deleted → Deactivate tenant         │
│  └── customer.subscription.trial_will_end → Notify            │
│                                                                  │
│  Billing Cycle:                                                 │
│  ├── Monthly (default)                                         │
│  ├── Annual (20% discount)                                     │
│  └── Custom (Enterprise)                                        │
│                                                                  │
│  Grace Period:                                                  │
│  ├── Payment failed → 3-day grace period                       │
│  ├── Day 1: Email notification                                 │
│  ├── Day 2: In-app warning + email                             │
│  ├── Day 3: Restrict to read-only mode                         │
│  └── Day 7: Suspend tenant                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Isolation Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ISOLATION                                 │
│                                                                  │
│  Database: Shared PostgreSQL (Neon)                             │
│  ├── All tenants share same database                           │
│  ├── All tables have tenant_id column                          │
│  ├── PostgreSQL RLS policies enforce isolation                 │
│  └── ORM automatically scopes queries                         │
│                                                                  │
│  File Storage: Shared Bucket                                    │
│  ├── Files stored with tenant prefix: {tenant_id}/{entity}/   │
│  ├── Pre-signed URLs (tenant-scoped, time-limited)            │
│  ├── Cannot access files without tenant prefix                 │
│  └── Optional: Separate buckets for Enterprise                 │
│                                                                  │
│  Cache: Shared Redis (Vercel KV)                               │
│  ├── Keys prefixed with tenant_id: {tenant_id}:{key}          │
│  ├── TTL per data type                                         │
│  ├── No cross-tenant cache access                              │
│  └── Optional: Dedicated Redis for Enterprise                  │
│                                                                  │
│  Search: PostgreSQL Full-Text                                   │
│  ├── All searches scoped to tenant_id                         │
│  ├── GIN indexes per tenant                                    │
│  └── pgvector searches filtered by tenant                      │
│                                                                  │
│  AI: Shared OpenAI Account                                     │
│  ├── Tenant ID passed in metadata                             │
│  ├── Usage tracked per tenant                                  │
│  ├── Separate API keys per tenant (optional)                  │
│  └── Cost attribution per tenant                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Tenant Context Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    TENANT CONTEXT                                │
│                                                                  │
│  Context Object:                                                │
│  {                                                              │
│    tenant_id: UUID,                                            │
│    tenant_slug: string,                                        │
│    tenant_name: string,                                        │
│    plan: 'starter' | 'growth' | 'business' | 'enterprise',   │
│    features: Set<string>,                                      │
│    settings: {                                                 │
│      timezone: string,                                         │
│      locale: string,                                           │
│      ai_model: string,                                         │
│      channels: string[],                                       │
│      limits: { ... },                                         │
│    },                                                          │
│    user: {                                                    │
│      id: UUID,                                                │
│      email: string,                                           │
│      name: string,                                            │
│      role: string,                                            │
│      permissions: string[],                                   │
│      team_ids: UUID[],                                        │
│    }                                                          │
│  }                                                              │
│                                                                  │
│  Propagation:                                                   │
│  ├── Middleware sets context in request                         │
│  ├── Server Components access via async context                │
│  ├── Server Actions access via function parameter              │
│  ├── API Routes access via request object                      │
│  └── Trigger.dev jobs receive context in payload               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Tenant Limits & Quotas

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIMITS ENFORCEMENT                             │
│                                                                  │
│  Limits (per tenant):                                          │
│  ├── Max agents: 3 (starter), 10 (growth), 50 (business)     │
│  ├── Max tickets/month: 500, 10000, 100000                    │
│  ├── Max KB articles: 100, 500, unlimited                     │
│  ├── Max automation rules: 5, 20, 100                         │
│  ├── Max webhooks: 2, 10, 50                                  │
│  ├── Max file storage: 1GB, 10GB, 100GB                       │
│  └── AI resolutions/month: 500, 2500, 10000                   │
│                                                                  │
│  Enforcement Points:                                            │
│  ├── Pre-check: Before creating resource                      │
│  │   └── if (count >= limit) → throw QuotaExceededError       │
│  ├── Rate limit: API request throttling                       │
│  │   └── Per-tenant rate limits per plan                       │
│  └── Usage tracking: Real-time metering                       │
│      └── Increment counter on each AI resolution              │
│                                                                  │
│  Overage Handling:                                              │
│  ├── Soft limit (80%): Warning notification                   │
│  ├── Hard limit (100%): Block new operations                  │
│  ├── Over-limit grace: 24 hours to upgrade                    │
│  └── Auto-upgrade: Optional (Enterprise)                      │
└─────────────────────────────────────────────────────────────────┘
```
