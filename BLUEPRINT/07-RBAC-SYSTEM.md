# SupportFlow AI — RBAC System

> Role-Based Access Control with Tenant Isolation and Granular Permissions

---

## 1. RBAC Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    RBAC ARCHITECTURE                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    AUTHENTICATION                         │    │
│  │  NextAuth.js v5 → JWT with tenant_id + user_id + role  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    AUTHORIZATION LAYERS                    │    │
│  │                                                          │    │
│  │  Layer 1: Tenant Isolation (PostgreSQL RLS + ORM)       │    │
│  │  ├── Every query includes WHERE tenant_id = ?           │    │
│  │  ├── RLS policies enforce at database level             │    │
│  │  └── Cannot access other tenant's data (ever)           │    │
│  │                                                          │    │
│  │  Layer 2: Role-Based Permissions (Casbin)               │    │
│  │  ├── Role determines base permission set                │    │
│  │  ├── Permissions can be overridden per user             │    │
│  │  └── Dynamic permission evaluation                      │    │
│  │                                                          │    │
│  │  Layer 3: Resource-Level Permissions                     │    │
│  │  ├── Can only access assigned tickets                   │    │
│  │  ├── Can only view own team's data                      │    │
│  │  └── Ownership-based access control                     │    │
│  │                                                          │    │
│  │  Layer 4: Feature Gating (Plan-Based)                   │    │
│  │  ├── Features enabled per subscription plan             │    │
│  │  ├── Usage limits per plan                              │    │
│  │  └── Beta features per tenant                           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Role Definitions

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY                                 │
│                                                                  │
│  super_admin (Platform-wide)                                    │
│  ├── Full platform access                                      │
│  ├── Can manage all tenants                                    │
│  ├── Can impersonate any user                                  │
│  └── Platform configuration                                   │
│      │                                                          │
│      ▼                                                          │
│  admin (Tenant-level)                                          │
│  ├── Full tenant access                                        │
│  ├── Manage billing and subscription                           │
│  ├── Manage team members and roles                             │
│  ├── Configure all settings                                    │
│  ├── Manage SLA policies                                       │
│  └── Manage automation rules                                   │
│      │                                                          │
│      ▼                                                          │
│  manager (Team-level)                                          │
│  ├── Manage assigned teams                                     │
│  ├── View all tenant analytics                                 │
│  ├── Manage SLA policies                                       │
│  ├── Manage automation rules                                   │
│  ├── Assign tickets to agents                                 │
│  ├── View all tickets                                          │
│  └── Manage knowledge base                                     │
│      │                                                          │
│      ▼                                                          │
│  agent (Individual)                                            │
│  ├── View assigned tickets                                     │
│  ├── Respond to tickets                                        │
│  ├── View assigned customers                                   │
│  ├── Use AI copilot                                           │
│  ├── View own analytics                                        │
│  └── Manage own KB articles (draft)                            │
│      │                                                          │
│      ▼                                                          │
│  viewer (Read-only)                                            │
│  ├── View tickets (read-only)                                  │
│  ├── View customers (read-only)                                │
│  ├── View analytics                                            │
│  └── View knowledge base                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Permission Matrix

### 3.1 Core Permissions

```
Permission                    │ super_admin │ admin │ manager │ agent │ viewer
──────────────────────────────┼─────────────┼───────┼─────────┼───────┼───────
ticket.create                 │     ✓       │   ✓   │    ✓    │   ✓   │   ✗
ticket.read.all               │     ✓       │   ✓   │    ✓    │   ✗   │   ✓
ticket.read.assigned          │     ✓       │   ✓   │    ✓    │   ✓   │   ✗
ticket.read.team              │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
ticket.update                 │     ✓       │   ✓   │    ✓    │   ✓*  │   ✗
ticket.update.status          │     ✓       │   ✓   │    ✓    │   ✓*  │   ✗
ticket.update.priority        │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
ticket.update.assign          │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
ticket.delete                 │     ✓       │   ✓   │    ✗    │   ✗   │   ✗
ticket.merge                  │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
ticket.export                 │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
──────────────────────────────┼─────────────┼───────┼─────────┼───────┼───────
message.send                  │     ✓       │   ✓   │    ✓    │   ✓   │   ✗
message.send.internal_note    │     ✓       │   ✓   │    ✓    │   ✓   │   ✗
message.read                  │     ✓       │   ✓   │    ✓    │   ✓*  │   ✓
──────────────────────────────┼─────────────┼───────┼─────────┼───────┼───────
customer.create               │     ✓       │   ✓   │    ✓    │   ✓   │   ✗
customer.read.all             │     ✓       │   ✓   │    ✓    │   ✗   │   ✓
customer.read.assigned        │     ✓       │   ✓   │    ✓    │   ✓   │   ✗
customer.update               │     ✓       │   ✓   │    ✓    │   ✓*  │   ✗
customer.delete               │     ✓       │   ✓   │    ✗    │   ✗   │   ✗
──────────────────────────────┼─────────────┼───────┼─────────┼───────┼───────
knowledge.create              │     ✓       │   ✓   │    ✓    │   ✓** │   ✗
knowledge.read.all            │     ✓       │   ✓   │    ✓    │   ✓   │   ✓
knowledge.update              │     ✓       │   ✓   │    ✓    │   ✓** │   ✗
knowledge.delete              │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
knowledge.publish             │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
──────────────────────────────┼─────────────┼───────┼─────────┼───────┼───────
analytics.view.tenant         │     ✓       │   ✓   │    ✓    │   ✗   │   ✓
analytics.view.team           │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
analytics.view.personal       │     ✓       │   ✓   │    ✓    │   ✓   │   ✗
analytics.export              │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
analytics.view.ai             │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
──────────────────────────────┼─────────────┼───────┼─────────┼───────┼───────
team.manage                   │     ✓       │   ✓   │    ✗    │   ✗   │   ✗
team.view                      │     ✓       │   ✓   │    ✓    │   ✓   │   ✓
──────────────────────────────┼─────────────┼───────┼─────────┼───────┼───────
sla.manage                    │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
sla.view                       │     ✓       │   ✓   │    ✓    │   ✓   │   ✓
──────────────────────────────┼─────────────┼───────┼─────────┼───────┼───────
automation.manage             │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
automation.view               │     ✓       │   ✓   │    ✓    │   ✓   │   ✓
──────────────────────────────┼─────────────┼───────┼─────────┼───────┼───────
settings.manage               │     ✓       │   ✓   │    ✗    │   ✗   │   ✗
settings.manage.billing       │     ✓       │   ✓   │    ✗    │   ✗   │   ✗
settings.manage.members       │     ✓       │   ✓   │    ✗    │   ✗   │   ✗
settings.manage.channels      │     ✓       │   ✓   │    ✗    │   ✗   │   ✗
settings.manage.ai            │     ✓       │   ✓   │    ✗    │   ✗   │   ✗
settings.manage.api           │     ✓       │   ✓   │    ✗    │   ✗   │   ✗
──────────────────────────────┼─────────────┼───────┼─────────┼───────┼───────
escalation.view               │     ✓       │   ✓   │    ✓    │   ✓   │   ✓
escalation.manage             │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
──────────────────────────────┼─────────────┼───────┼─────────┼───────┼───────
audit.view                    │     ✓       │   ✓   │    ✗    │   ✗   │   ✗
──────────────────────────────┼─────────────┼───────┼─────────┼───────┼───────
user.manage                   │     ✓       │   ✓   │    ✗    │   ✗   │   ✗
user.invite                   │     ✓       │   ✓   │    ✓    │   ✗   │   ✗
user.deactivate               │     ✓       │   ✓   │    ✗    │   ✗   │   ✗

* Only on assigned tickets
** Only own drafts until published by manager+
```

---

## 4. Implementation Details

### 4.1 Casbin Policy Configuration

```typescript
// Casbin model definition
// Model: RBAC with resource-level permissions

[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act, eft

[role_definition]
g = _, _

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act

// Example policies:
// p, admin, ticket, create
// p, admin, ticket, read, all
// p, agent, ticket, read, assigned
// p, agent, ticket, update, assigned

// Role assignments:
// g, user_id, admin
// g, user_id, agent
```

### 4.2 Middleware Integration

```
Request → Auth Check → RBAC Check → Resource Check → Handler

Auth Check:
  ├── Validate JWT token
  ├── Extract tenant_id, user_id, role
  └── Attach to request context

RBAC Check:
  ├── Load role permissions from Casbin
  ├── Evaluate: Can role perform action on resource?
  ├── Check permission overrides (user-specific)
  └── Return allowed/denied

Resource Check:
  ├── Ticket: Is user assigned or has "all" access?
  ├── Customer: Is user assigned or has "all" access?
  ├── Team: Is user member of team?
  └── KB Article: Is user author or has publish access?
```

### 4.3 Database-Level Enforcement

```sql
-- Row-Level Security Policies

-- Tenants table
CREATE POLICY tenant_isolation ON tickets
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Tickets: agents can only see assigned tickets
CREATE POLICY ticket_agent_access ON tickets
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      assigned_to = current_setting('app.current_user_id')::uuid
      OR current_setting('app.current_user_role') IN ('admin', 'manager')
    )
  );

-- Customers: similar pattern
CREATE POLICY customer_agent_access ON customers
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      id IN (SELECT customer_id FROM tickets WHERE assigned_to = current_setting('app.current_user_id')::uuid)
      OR current_setting('app.current_user_role') IN ('admin', 'manager')
    )
  );
```

---

## 5. Permission Caching

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERMISSION CACHING                            │
│                                                                  │
│  Strategy: LRU Cache with TTL                                   │
│                                                                  │
│  Cache Key: permission:{tenant_id}:{user_id}:{resource}:{action}│
│  TTL: 5 minutes                                                 │
│  Max Size: 10,000 entries per tenant                           │
│                                                                  │
│  Invalidation:                                                  │
│  ├── On role change → Clear all user permissions                │
│  ├── On permission change → Clear affected permissions          │
│  ├── On user deactivation → Clear all user data                │
│  └── On tenant settings change → Clear tenant permissions       │
│                                                                  │
│  Fallback:                                                      │
│  ├── Cache miss → Evaluate from DB → Cache result              │
│  ├── DB error → Deny access (fail-closed)                      │
│  └── Casbin error → Deny access (fail-closed)                  │
└─────────────────────────────────────────────────────────────────┘
```
