# SupportFlow AI — Database Schema

> Neon PostgreSQL with Drizzle ORM, pgvector for embeddings, row-level tenant isolation

---

## 1. Schema Organization

```
Database: supportflow_ai (PostgreSQL 16)
Extensions: uuid-ossp, pgcrypto, pg_trgm, vector, pgcrypto

Schema Strategy:
  • All tables have tenant_id (row-level security)
  • UUID primary keys (v7 for sortability)
  • Soft deletes (deleted_at) on critical tables
  • Audit columns (created_at, updated_at, created_by, updated_by)
  • JSONB for flexible metadata
  • Partitioning on messages table (by month)
```

---

## 2. Core Tables

### 2.1 Tenants (Organizations)
```sql
tenants
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── name                  VARCHAR(255) NOT NULL
├── slug                  VARCHAR(100) UNIQUE NOT NULL -- subdomain
├── domain                VARCHAR(255)                 -- custom domain
├── logo_url              TEXT
├── plan                  VARCHAR(50) DEFAULT 'starter' -- starter|growth|business|enterprise
├── status                VARCHAR(50) DEFAULT 'active'  -- active|suspended|cancelled
├── settings              JSONB DEFAULT '{}'
│   ├── timezone          TEXT
│   ├── locale            TEXT
│   ├── ai_model          TEXT DEFAULT 'gpt-4o'
│   ├── ai_temperature    FLOAT DEFAULT 0.7
│   ├── auto_resolve       BOOLEAN DEFAULT false
│   ├── satisfaction_survey BOOLEAN DEFAULT true
│   └── custom_fields     JSONB
├── billing               JSONB DEFAULT '{}'
│   ├── stripe_customer_id TEXT
│   ├── stripe_subscription_id TEXT
│   ├── billing_email     TEXT
│   └── ai_credits_used   INT DEFAULT 0
├── limits                JSONB DEFAULT '{}'
│   ├── max_agents        INT DEFAULT 3
│   ├── max_tickets_month INT DEFAULT 500
│   ├── max_kb_articles   INT DEFAULT 100
│   └── channels          TEXT[] DEFAULT ARRAY['web']
├── created_at            TIMESTAMPTZ DEFAULT NOW()
├── updated_at            TIMESTAMPTZ DEFAULT NOW()
└── deleted_at            TIMESTAMPTZ
```

### 2.2 Users (Agents / Team Members)
```sql
users
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── email                 VARCHAR(255) NOT NULL
├── email_verified        BOOLEAN DEFAULT false
├── name                  VARCHAR(255) NOT NULL
├── avatar_url            TEXT
├── password_hash         TEXT                       -- null for OAuth-only users
├── role                  VARCHAR(50) DEFAULT 'agent' -- super_admin|admin|manager|agent|viewer
├── status                VARCHAR(50) DEFAULT 'active' -- active|inactive|invited
├── permissions           TEXT[] DEFAULT ARRAY[]      -- granular permission overrides
├── skills                TEXT[] DEFAULT ARRAY[]      -- e.g., ['billing', 'technical']
├── max_concurrent_tickets INT DEFAULT 5
├── status_message        VARCHAR(100)               -- 'online'|'away'|'busy'|'offline'
├── last_active_at        TIMESTAMPTZ
├── preferences           JSONB DEFAULT '{}'
│   ├── notification_settings JSONB
│   ├── theme              TEXT
│   └── keyboard_shortcuts JSONB
├── sso_provider          VARCHAR(50)                -- 'google'|'microsoft'|null
├── sso_id                TEXT
├── mfa_enabled           BOOLEAN DEFAULT false
├── mfa_secret            TEXT                       -- encrypted TOTP secret
├── created_at            TIMESTAMPTZ DEFAULT NOW()
├── updated_at            TIMESTAMPTZ DEFAULT NOW()
└── deleted_at            TIMESTAMPTZ

UNIQUE (tenant_id, email)
```

### 2.3 Customers
```sql
customers
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── external_id           TEXT                       -- ID from external system
├── email                 VARCHAR(255)
├── phone                 VARCHAR(50)
├── name                  VARCHAR(255)
├── avatar_url            TEXT
├── company               VARCHAR(255)
├── title                 VARCHAR(255)
├── timezone              VARCHAR(50) DEFAULT 'UTC'
├── locale                VARCHAR(10) DEFAULT 'en'
├── segment               VARCHAR(100)               -- 'enterprise'|'smb'|'free'
├── lifecycle_stage       VARCHAR(50) DEFAULT 'lead' -- lead|prospect|customer|churned
├── lifetime_value        DECIMAL(12,2) DEFAULT 0
├── tags                  TEXT[] DEFAULT ARRAY[]
├── custom_fields         JSONB DEFAULT '{}'
├── metadata              JSONB DEFAULT '{}'
│   ├── company_size      TEXT
│   ├── industry          TEXT
│   ├── source            TEXT                       -- 'web'|'referral'|'organic'
│   └── first_touch_at    TIMESTAMPTZ
├── sentiment_score       DECIMAL(3,2)               -- -1.00 to 1.00
├── sentiment_updated_at  TIMESTAMPTZ
├── total_tickets         INT DEFAULT 0
├── total_conversations   INT DEFAULT 0
├── last_contact_at       TIMESTAMPTZ
├── notes                 TEXT
├── created_at            TIMESTAMPTZ DEFAULT NOW()
├── updated_at            TIMESTAMPTZ DEFAULT NOW()
└── deleted_at            TIMESTAMPTZ

INDEXES:
  - (tenant_id, email)
  - (tenant_id, phone)
  - (tenant_id, segment)
  - (tenant_id, lifecycle_stage)
  - GIN (tenant_id, tags)
  - GIN (tenant_id, custom_fields)
```

### 2.4 Customer Channels (Identity Resolution)
```sql
customer_channels
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── customer_id           UUID REFERENCES customers(id)
├── channel               VARCHAR(50) NOT NULL       -- 'web'|'whatsapp'|'email'|'sms'|'messenger'|'instagram'
├── channel_identifier    TEXT NOT NULL               -- phone, email, channel-specific ID
├── channel_metadata      JSONB DEFAULT '{}'
│   ├── whatsapp_number   TEXT
│   ├── messenger_pid     TEXT
│   └── instagram_username TEXT
├── verified              BOOLEAN DEFAULT false
├── primary               BOOLEAN DEFAULT false
├── created_at            TIMESTAMPTZ DEFAULT NOW()
└── updated_at            TIMESTAMPTZ DEFAULT NOW()

UNIQUE (tenant_id, channel, channel_identifier)
```

---

## 3. Ticket & Conversation Tables

### 3.1 Tickets
```sql
tickets
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── ticket_number         SERIAL                     -- per-tenant sequential number (e.g., #1234)
├── subject               VARCHAR(500) NOT NULL
├── status                VARCHAR(50) DEFAULT 'open' -- new|open|pending|escalated|resolved|closed
├── priority              VARCHAR(50) DEFAULT 'medium' -- low|medium|high|urgent
├── category              VARCHAR(100)               -- AI-classified category
├── subcategory           VARCHAR(100)
├── tags                  TEXT[] DEFAULT ARRAY[]
├── channel               VARCHAR(50) NOT NULL       -- originating channel
├── language              VARCHAR(10) DEFAULT 'en'
├── sentiment             VARCHAR(50)                -- 'positive'|'neutral'|'negative'|'angry'
├── sentiment_score       DECIMAL(3,2)
├── intent                VARCHAR(100)               -- AI-detected intent
├── customer_id           UUID REFERENCES customers(id)
├── assigned_to           UUID REFERENCES users(id)  -- assigned agent
├── assigned_team_id      UUID REFERENCES teams(id)
├── sla_policy_id         UUID REFERENCES sla_policies(id)
├── sla_state             JSONB DEFAULT '{}'
│   ├── first_response_at TIMESTAMPTZ
│   ├── first_response_deadline TIMESTAMPTZ
│   ├── resolution_deadline TIMESTAMPTZ
│   ├── breached           BOOLEAN DEFAULT false
│   └── pause_reason       TEXT
├── ai_state              JSONB DEFAULT '{}'
│   ├── auto_resolved      BOOLEAN DEFAULT false
│   ├── ai_confidence      DECIMAL(3,2)
│   ├── ai_model_used      TEXT
│   ├── escalation_reason  TEXT
│   └── handoff_count      INT DEFAULT 0
├── resolution            JSONB DEFAULT '{}'
│   ├── resolved_at        TIMESTAMPTZ
│   ├── resolved_by        UUID                       -- user or 'ai'
│   ├── resolution_type    TEXT                       -- 'ai_auto'|'agent'|'escalated'|'merged'
│   └── satisfaction_score INT                        -- 1-5 CSAT
├── custom_fields         JSONB DEFAULT '{}'
├── metadata              JSONB DEFAULT '{}'
├── first_response_at     TIMESTAMPTZ
├── last_message_at       TIMESTAMPTZ
├── message_count         INT DEFAULT 0
├── merged_into_id        UUID REFERENCES tickets(id)
├── created_at            TIMESTAMPTZ DEFAULT NOW()
├── updated_at            TIMESTAMPTZ DEFAULT NOW()
└── deleted_at            TIMESTAMPTZ

INDEXES:
  - (tenant_id, status)
  - (tenant_id, assigned_to)
  - (tenant_id, customer_id)
  - (tenant_id, created_at DESC)
  - (tenant_id, priority, status)
  - (tenant_id, sla_state -> 'first_response_deadline')
  - GIN (tenant_id, tags)
  - (tenant_id, ticket_number)
```

### 3.2 Ticket Messages
```sql
ticket_messages (PARTITIONED BY RANGE (created_at))
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID NOT NULL
├── ticket_id             UUID NOT NULL
├── channel               VARCHAR(50) NOT NULL
├── direction             VARCHAR(10) NOT NULL       -- 'inbound'|'outbound'|'internal'
├── sender_type           VARCHAR(20) NOT NULL       -- 'customer'|'agent'|'ai'|'system'
├── sender_id             UUID                       -- customer_id or user_id
├── content               TEXT NOT NULL
├── content_type          VARCHAR(50) DEFAULT 'text' -- 'text'|'html'|'markdown'|'image'|'file'|'audio'
├── attachments           JSONB DEFAULT '[]'
│   └── [{url, filename, size, mime_type, storage_key}]
├── metadata              JSONB DEFAULT '{}'
│   ├── message_id        TEXT                       -- external channel message ID
│   ├── replied_to        UUID                       -- parent message ID
│   └── reactions         JSONB
├── ai_generated          BOOLEAN DEFAULT false
├── ai_model              TEXT
├── ai_confidence         DECIMAL(3,2)
├── ai_agent              VARCHAR(50)                -- which AI agent generated this
├── read_at               TIMESTAMPTZ
├── created_at            TIMESTAMPTZ DEFAULT NOW()
└── updated_at            TIMESTAMPTZ DEFAULT NOW()

INDEXES:
  - (tenant_id, ticket_id, created_at)
  - (tenant_id, direction)
  - (tenant_id, ai_generated)
```

### 3.3 Ticket Events (Audit Trail)
```sql
ticket_events
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── ticket_id             UUID REFERENCES tickets(id)
├── event_type            VARCHAR(100) NOT NULL
│   -- 'created'|'updated'|'assigned'|'status_changed'|'priority_changed'|
│   -- 'message_added'|'escalated'|'resolved'|'closed'|'merged'|
│   -- 'sla_breached'|'sla_warning'|'ai_classified'|'ai_routed'
├── actor_type            VARCHAR(20) NOT NULL       -- 'user'|'ai'|'system'|'webhook'
├── actor_id              UUID                       -- user_id or agent name
├── changes               JSONB                      -- {field: {old, new}}
├── metadata              JSONB DEFAULT '{}'
├── created_at            TIMESTAMPTZ DEFAULT NOW()

INDEXES:
  - (tenant_id, ticket_id, created_at DESC)
  - (tenant_id, event_type, created_at DESC)
```

---

## 4. Teams & Assignment

### 4.1 Teams
```sql
teams
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── name                  VARCHAR(255) NOT NULL
├── description           TEXT
├── color                 VARCHAR(7)                 -- hex color
├── icon                  VARCHAR(50)
├── lead_id               UUID REFERENCES users(id)
├── skills                TEXT[] DEFAULT ARRAY[]     -- skills this team handles
├── channels              TEXT[] DEFAULT ARRAY[]     -- channels this team covers
├── auto_assign           BOOLEAN DEFAULT true
├── max_concurrent_tickets INT DEFAULT 50
├── sla_policy_id         UUID REFERENCES sla_policies(id)
├── business_hours        JSONB DEFAULT '{}'
│   ├── timezone          TEXT
│   ├── schedule          JSONB                      -- weekly schedule
│   └── holidays          DATE[]
├── created_at            TIMESTAMPTZ DEFAULT NOW()
├── updated_at            TIMESTAMPTZ DEFAULT NOW()
└── deleted_at            TIMESTAMPTZ

UNIQUE (tenant_id, name)
```

### 4.2 Team Members
```sql
team_members
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── team_id               UUID REFERENCES teams(id)
├── user_id               UUID REFERENCES users(id)
├── role                  VARCHAR(50) DEFAULT 'member' -- lead|member
├── capacity              INT DEFAULT 5               -- max concurrent tickets
├── current_load          INT DEFAULT 0
├── skills                TEXT[] DEFAULT ARRAY[]
├── joined_at             TIMESTAMPTZ DEFAULT NOW()
└── updated_at            TIMESTAMPTZ DEFAULT NOW()

UNIQUE (tenant_id, team_id, user_id)
```

---

## 5. SLA Management

### 5.1 SLA Policies
```sql
sla_policies
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── name                  VARCHAR(255) NOT NULL
├── description           TEXT
├── is_default            BOOLEAN DEFAULT false
├── priority              VARCHAR(50)               -- applies to this priority
├── channel               VARCHAR(50)               -- applies to this channel (null = all)
├── business_hours_only   BOOLEAN DEFAULT true
├── metrics               JSONB NOT NULL
│   ├── first_response_minutes  INT                   -- e.g., 60
│   ├── response_minutes        INT                   -- between messages, e.g., 30
│   ├── resolution_minutes      INT                   -- e.g., 480
│   └── time_to_urgent_minutes  INT
├── escalation_rules      JSONB DEFAULT '[]'
│   └── [{after_minutes, action: 'notify'|'reassign'|'escalate', target: 'team'|'user'|'role', target_id}]
├── warning_thresholds    JSONB DEFAULT '{}'
│   ├── first_response_pct     FLOAT DEFAULT 0.75
│   └── resolution_pct         FLOAT DEFAULT 0.75
├── created_at            TIMESTAMPTZ DEFAULT NOW()
├── updated_at            TIMESTAMPTZ DEFAULT NOW()
└── deleted_at            TIMESTAMPTZ

UNIQUE (tenant_id, name)
```

### 5.2 SLA States (Active Tracking)
```sql
sla_states
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── ticket_id             UUID REFERENCES tickets(id) UNIQUE
├── sla_policy_id         UUID REFERENCES sla_policies(id)
├── first_response_state  JSONB DEFAULT '{}'
│   ├── started_at        TIMESTAMPTZ
│   ├── deadline          TIMESTAMPTZ
│   ├── achieved_at       TIMESTAMPTZ
│   ├── breached          BOOLEAN DEFAULT false
│   └── paused_at         TIMESTAMPTZ
├── resolution_state      JSONB DEFAULT '{}'
│   ├── started_at        TIMESTAMPTZ
│   ├── deadline          TIMESTAMPTZ
│   ├── achieved_at       TIMESTAMPTZ
│   ├── breached          BOOLEAN DEFAULT false
│   └── paused_at         TIMESTAMPTZ
├── pause_reasons         JSONB DEFAULT '[]'
│   └── [{reason, started_at, ended_at}]
├── created_at            TIMESTAMPTZ DEFAULT NOW()
└── updated_at            TIMESTAMPTZ DEFAULT NOW()

INDEXES:
  - (tenant_id, first_response_state -> 'deadline')
  - (tenant_id, resolution_state -> 'deadline')
  - (tenant_id, first_response_state -> 'breached')
```

---

## 6. Knowledge Base

### 6.1 KB Collections
```sql
kb_collections
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── name                  VARCHAR(255) NOT NULL
├── description           TEXT
├── icon                  VARCHAR(50)
├── is_published          BOOLEAN DEFAULT true
├── display_order         INT DEFAULT 0
├── metadata              JSONB DEFAULT '{}'
├── article_count         INT DEFAULT 0
├── created_at            TIMESTAMPTZ DEFAULT NOW()
├── updated_at            TIMESTAMPTZ DEFAULT NOW()
└── deleted_at            TIMESTAMPTZ
```

### 6.2 KB Articles
```sql
kb_articles
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── collection_id         UUID REFERENCES kb_collections(id)
├── title                 VARCHAR(500) NOT NULL
├── slug                  VARCHAR(500) NOT NULL
├── content               TEXT NOT NULL               -- markdown
├── html_content          TEXT                        -- rendered HTML
├── summary               TEXT                        -- AI-generated summary
├── status                VARCHAR(50) DEFAULT 'draft' -- draft|published|archived
├── author_id             UUID REFERENCES users(id)
├── tags                  TEXT[] DEFAULT ARRAY[]
├── category              VARCHAR(100)
├── language              VARCHAR(10) DEFAULT 'en'
├── view_count            INT DEFAULT 0
├── helpful_count         INT DEFAULT 0
├── not_helpful_count     INT DEFAULT 0
├── ai_usage_count        INT DEFAULT 0               -- times used by AI
├── embedding             VECTOR(1536)                -- text-embedding-3-small
├── embedding_updated_at  TIMESTAMPTZ
├── search_vector         TSVECTOR                    -- full-text search
├── metadata              JSONB DEFAULT '{}'
├── created_at            TIMESTAMPTZ DEFAULT NOW()
├── updated_at            TIMESTAMPTZ DEFAULT NOW()
└── deleted_at            TIMESTAMPTZ

INDEXES:
  - (tenant_id, status)
  - (tenant_id, collection_id)
  - (tenant_id, embedding) USING ivfflat (vector_cosine_ops) WITH (lists = 100)
  - GIN (tenant_id, search_vector)
  - GIN (tenant_id, tags)
```

### 6.3 KB Article Versions (History)
```sql
kb_article_versions
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── article_id            UUID REFERENCES kb_articles(id)
├── version_number        INT NOT NULL
├── title                 VARCHAR(500) NOT NULL
├── content               TEXT NOT NULL
├── changed_by            UUID REFERENCES users(id)
├── change_summary        TEXT
├── created_at            TIMESTAMPTZ DEFAULT NOW()

UNIQUE (tenant_id, article_id, version_number)
```

---

## 7. Channel Configuration

### 7.1 Channel Configurations
```sql
channel_configs
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id) UNIQUE
├── web_chat              JSONB DEFAULT '{}'
│   ├── enabled           BOOLEAN DEFAULT true
│   ├── widget_color      TEXT DEFAULT '#0066FF'
│   ├── widget_position   TEXT DEFAULT 'bottom-right'
│   ├── welcome_message   TEXT
│   ├── offline_message    TEXT
│   ├── pre_chat_fields    JSONB
│   ├── custom_css         TEXT
│   └── allowed_origins    TEXT[]
├── whatsapp              JSONB DEFAULT '{}'
│   ├── enabled           BOOLEAN DEFAULT false
│   ├── phone_number_id   TEXT
│   ├── business_account_id TEXT
│   ├── access_token      TEXT                        -- encrypted
│   ├── webhook_secret    TEXT                        -- encrypted
│   └── auto_greeting     BOOLEAN DEFAULT true
├── email                 JSONB DEFAULT '{}'
│   ├── enabled           BOOLEAN DEFAULT false
│   ├── imap_host         TEXT
│   ├── imap_port         INT
│   ├── imap_user         TEXT
│   ├── imap_password     TEXT                        -- encrypted
│   ├── smtp_host         TEXT
│   ├── smtp_port         INT
│   ├── smtp_user         TEXT
│   ├── smtp_password     TEXT                        -- encrypted
│   ├── from_address      TEXT
│   ├── from_name          TEXT
│   └── auto_reply         BOOLEAN DEFAULT true
├── sms                   JSONB DEFAULT '{}'
│   ├── enabled           BOOLEAN DEFAULT false
│   ├── provider          TEXT                        -- 'twilio'
│   ├── account_sid       TEXT
│   ├── auth_token        TEXT                        -- encrypted
│   ├── phone_number      TEXT
│   └── webhook_url       TEXT
├── messenger             JSONB DEFAULT '{}'
│   ├── enabled           BOOLEAN DEFAULT false
│   ├── page_id           TEXT
│   ├── app_id            TEXT
│   ├── app_secret        TEXT                        -- encrypted
│   ├── verify_token      TEXT
│   └── page_access_token TEXT                        -- encrypted
├── instagram             JSONB DEFAULT '{}'
│   ├── enabled           BOOLEAN DEFAULT false
│   ├── ig_account_id     TEXT
│   ├── access_token      TEXT                        -- encrypted
│   └── webhook_secret    TEXT
├── created_at            TIMESTAMPTZ DEFAULT NOW()
└── updated_at            TIMESTAMPTZ DEFAULT NOW()
```

---

## 8. Automation & Workflow

### 8.1 Automation Rules
```sql
automation_rules
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── name                  VARCHAR(255) NOT NULL
├── description           TEXT
├── is_enabled            BOOLEAN DEFAULT true
├── trigger_type          VARCHAR(100) NOT NULL
│   -- 'ticket.created'|'ticket.updated'|'message.received'|
│   -- 'sla.breach'|'sla.warning'|'sentiment.negative'|
│   -- 'schedule.cron'|'manual'
├── trigger_config        JSONB DEFAULT '{}'           -- specific trigger filters
├── conditions            JSONB DEFAULT '[]'
│   └── [{field, operator, value}]
├── actions               JSONB NOT NULL
│   └── [{type, config}]
│       -- types: 'assign_team'|'assign_agent'|'set_priority'|'set_status'|
│       --        'add_tag'|'send_notification'|'run_ai_agent'|
│       --        'send_email'|'send_webhook'|'create_ticket'
├── execution_count       INT DEFAULT 0
├── last_executed_at      TIMESTAMPTZ
├── created_at            TIMESTAMPTZ DEFAULT NOW()
├── updated_at            TIMESTAMPTZ DEFAULT NOW()
└── deleted_at            TIMESTAMPTZ

INDEXES:
  - (tenant_id, is_enabled, trigger_type)
```

### 8.2 Automation Executions (Log)
```sql
automation_executions
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── rule_id               UUID REFERENCES automation_rules(id)
├── ticket_id             UUID REFERENCES tickets(id)
├── status                VARCHAR(50) NOT NULL       -- 'pending'|'running'|'completed'|'failed'
├── trigger_event         JSONB                       -- the event that triggered this
├── actions_executed      JSONB DEFAULT '[]'
├── error                 TEXT
├── started_at            TIMESTAMPTZ DEFAULT NOW()
├── completed_at          TIMESTAMPTZ
└── duration_ms           INT

INDEXES:
  - (tenant_id, rule_id, created_at DESC)
  - (tenant_id, status)
```

---

## 9. Analytics & Metrics

### 9.1 Metric Snapshots (Pre-aggregated)
```sql
metric_snapshots
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── metric_type           VARCHAR(100) NOT NULL
│   -- 'ticket_volume'|'response_time'|'resolution_time'|
│   -- 'csat_score'|'ai_resolution_rate'|'agent_productivity'
├── dimension             JSONB DEFAULT '{}'           -- {channel, priority, team, agent}
├── period                VARCHAR(20) NOT NULL        -- 'hourly'|'daily'|'weekly'|'monthly'
├── period_start          TIMESTAMPTZ NOT NULL
├── period_end            TIMESTAMPTZ NOT NULL
├── value                 DECIMAL(12,4) NOT NULL
├── count                 INT DEFAULT 0
├── metadata              JSONB DEFAULT '{}'
├── created_at            TIMESTAMPTZ DEFAULT NOW()

UNIQUE (tenant_id, metric_type, period, period_start, dimension)
INDEXES:
  - (tenant_id, metric_type, period_start DESC)
  - (tenant_id, period, period_start DESC)
```

### 9.2 AI Agent Traces
```sql
ai_traces
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── ticket_id             UUID REFERENCES tickets(id)
├── message_id            UUID REFERENCES ticket_messages(id)
├── agent_name            VARCHAR(50) NOT NULL       -- 'intake'|'knowledge'|'resolution'|'qa'|'escalation'|'sentiment'|'analytics'
├── run_id                TEXT NOT NULL               -- OpenAI trace ID
├── model                 TEXT NOT NULL
├── input_tokens          INT DEFAULT 0
├── output_tokens         INT DEFAULT 0
├── cost_cents            DECIMAL(8,4) DEFAULT 0
├── latency_ms            INT DEFAULT 0
├── input                 JSONB                       -- prompt/messages sent
├── output               JSONB                       -- response received
├── handoffs              JSONB DEFAULT '[]'          -- agent handoff chain
├── guardrails            JSONB DEFAULT '[]'          -- guardrail results
├── metadata              JSONB DEFAULT '{}'
├── created_at            TIMESTAMPTZ DEFAULT NOW()

INDEXES:
  - (tenant_id, agent_name, created_at DESC)
  - (tenant_id, ticket_id)
  - (tenant_id, created_at DESC)
```

---

## 10. Webhook & Integration

### 10.1 Webhooks
```sql
webhooks
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── name                  VARCHAR(255) NOT NULL
├── url                   TEXT NOT NULL
├── secret                TEXT                       -- for HMAC verification
├── events                TEXT[] NOT NULL             -- subscribed events
├── is_active             BOOLEAN DEFAULT true
├── retry_count           INT DEFAULT 3
├── timeout_ms            INT DEFAULT 5000
├── headers               JSONB DEFAULT '{}'         -- custom headers
├── last_triggered_at     TIMESTAMPTZ
├── last_status_code      INT
├── failure_count         INT DEFAULT 0
├── created_at            TIMESTAMPTZ DEFAULT NOW()
└── updated_at            TIMESTAMPTZ DEFAULT NOW()
```

### 10.2 Webhook Deliveries (Log)
```sql
webhook_deliveries
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── webhook_id            UUID REFERENCES webhooks(id)
├── event                 VARCHAR(100) NOT NULL
├── payload               JSONB NOT NULL
├── response_status       INT
├── response_body         TEXT
├── attempt               INT DEFAULT 1
├── status                VARCHAR(50) DEFAULT 'pending' -- pending|success|failed
├── error                 TEXT
├── created_at            TIMESTAMPTZ DEFAULT NOW()
└── delivered_at          TIMESTAMPTZ

INDEXES:
  - (tenant_id, webhook_id, created_at DESC)
  - (tenant_id, status)
```

---

## 11. Audit & Compliance

### 11.1 Audit Log
```sql
audit_log
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── actor_id              UUID                       -- user_id
├── actor_type            VARCHAR(50) NOT NULL       -- 'user'|'ai'|'system'|'api'
├── actor_email           VARCHAR(255)
├── action                VARCHAR(100) NOT NULL      -- 'create'|'update'|'delete'|'login'|'export'
├── resource_type         VARCHAR(100) NOT NULL      -- 'ticket'|'user'|'kb_article'|'settings'
├── resource_id           UUID
├── changes               JSONB                       -- {field: {old, new}}
├── metadata              JSONB DEFAULT '{}'
├── ip_address            INET
├── user_agent            TEXT
├── created_at            TIMESTAMPTZ DEFAULT NOW()

INDEXES:
  - (tenant_id, created_at DESC)
  - (tenant_id, actor_id, created_at DESC)
  - (tenant_id, resource_type, resource_id)
```

---

## 12. File Attachments

### 12.1 Attachments
```sql
attachments
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── entity_type           VARCHAR(50) NOT NULL       -- 'ticket_message'|'kb_article'|'customer'|'ticket'
├── entity_id             UUID NOT NULL
├── filename              VARCHAR(500) NOT NULL
├── original_filename     VARCHAR(500) NOT NULL
├── mime_type             VARCHAR(100)
├── size_bytes            BIGINT
├── storage_key           TEXT NOT NULL               -- S3/Blob key
├── storage_url           TEXT                        -- public URL
├── metadata              JSONB DEFAULT '{}'
│   ├── width             INT
│   ├── height            INT
│   └── duration_ms       INT
├── uploaded_by           UUID
├── created_at            TIMESTAMPTZ DEFAULT NOW()

INDEXES:
  - (tenant_id, entity_type, entity_id)
```

---

## 13. Notifications

### 13.1 Notifications
```sql
notifications
├── id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7()
├── tenant_id             UUID REFERENCES tenants(id)
├── user_id               UUID REFERENCES users(id)
├── type                  VARCHAR(100) NOT NULL       -- 'ticket_assigned'|'sla_warning'|'mention'|'escalation'
├── title                 VARCHAR(500) NOT NULL
├── body                  TEXT
├── action_url            TEXT
├── entity_type           VARCHAR(50)
├── entity_id             UUID
├── is_read               BOOLEAN DEFAULT false
├── read_at               TIMESTAMPTZ
├── created_at            TIMESTAMPTZ DEFAULT NOW()

INDEXES:
  - (tenant_id, user_id, is_read, created_at DESC)
  - (tenant_id, user_id, created_at DESC)
```

---

## 14. Entity Relationship Diagram (Simplified)

```
tenants ──────┬────────────────────────────────────────────────┐
              │                                                 │
              ├── users ── team_members ── teams               │
              │                                                 │
              ├── customers ── customer_channels               │
              │                                                 │
              ├── tickets ── ticket_messages (partitioned)     │
              │     │                                           │
              │     ├── ticket_events                          │
              │     ├── sla_states ── sla_policies             │
              │     └── ai_traces                              │
              │                                                 │
              ├── kb_collections ── kb_articles                │
              │     └── kb_article_versions                    │
              │                                                 │
              ├── channel_configs                              │
              │                                                 │
              ├── automation_rules ── automation_executions     │
              │                                                 │
              ├── metric_snapshots                              │
              │                                                 │
              ├── webhooks ── webhook_deliveries                │
              │                                                 │
              ├── attachments                                   │
              │                                                 │
              ├── notifications                                 │
              │                                                 │
              └── audit_log                                     │
                                                                │
              └────────────────────────────────────────────────┘
```

---

## 15. Migration Strategy

```
Phase 1: Core Schema
  → tenants, users, customers, tickets, messages, teams

Phase 2: SLA & Automation
  → sla_policies, sla_states, automation_rules

Phase 3: Knowledge Base
  → kb_collections, kb_articles (with pgvector)

Phase 4: Analytics & Observability
  → metric_snapshots, ai_traces, audit_log

Phase 5: Integrations
  → webhooks, webhook_deliveries, notifications
```
