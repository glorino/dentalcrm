import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DnZLKbTy9V6C@ep-soft-dust-apw42hzj-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require");

export { sql };

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'agent',
      team VARCHAR(100),
      avatar_url VARCHAR(500),
      status VARCHAR(20) DEFAULT 'active',
      reset_token VARCHAR(255),
      reset_token_expires TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      company VARCHAR(255),
      segment VARCHAR(50) DEFAULT 'starter',
      plan VARCHAR(50) DEFAULT 'starter',
      ltv DECIMAL(10,2) DEFAULT 0,
      csat DECIMAL(3,2) DEFAULT 0,
      total_tickets INT DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_number VARCHAR(20) UNIQUE NOT NULL,
      subject VARCHAR(500) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'open',
      priority VARCHAR(20) DEFAULT 'medium',
      channel VARCHAR(50) NOT NULL,
      customer_id UUID REFERENCES customers(id),
      assignee_id UUID REFERENCES users(id),
      team VARCHAR(100),
      sentiment VARCHAR(20) DEFAULT 'neutral',
      sentiment_score DECIMAL(4,2) DEFAULT 0,
      ai_confidence INT DEFAULT 0,
      sla_status VARCHAR(20) DEFAULT 'ok',
      sla_due TIMESTAMP,
      tags TEXT[],
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      resolved_at TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID REFERENCES tickets(id),
      sender_type VARCHAR(20) NOT NULL,
      sender_id UUID,
      content TEXT NOT NULL,
      channel VARCHAR(50),
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS knowledge_articles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      collection VARCHAR(100),
      status VARCHAR(20) DEFAULT 'draft',
      views INT DEFAULT 0,
      ai_used INT DEFAULT 0,
      helpful INT DEFAULT 0,
      tags TEXT[],
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS password_resets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`;

  await sql`
    CREATE SEQUENCE IF NOT EXISTS ticket_seq START WITH 1235 INCREMENT BY 1
  `;
}

export async function generateTicketNumber(): Promise<string> {
  const result = await sql`SELECT nextval('ticket_seq') as num`;
  return `SSV-${result[0].num}`;
}
