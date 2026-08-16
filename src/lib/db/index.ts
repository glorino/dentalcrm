import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

type SqlFn = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<any[]>;
  (query: string, values?: unknown[]): Promise<any[]>;
};

export function getSql(): SqlFn {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql as unknown as SqlFn;
}

export function sql(stringsOrQuery: TemplateStringsArray | string, ...values: unknown[]) {
  const s = getSql();
  if (typeof stringsOrQuery === "string") {
    return s(stringsOrQuery, values);
  }
  return s(stringsOrQuery, ...values);
}

export async function initDB() {
  const s = getSql();
  await s`
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

  await s`
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

  await s`
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

  await s`
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

  await s`
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

  await s`
    CREATE TABLE IF NOT EXISTS password_resets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await s`ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`;

  await s`
    CREATE TABLE IF NOT EXISTS voice_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customers(id),
      transcript JSONB DEFAULT '[]',
      duration_seconds INT DEFAULT 0,
      sentiment VARCHAR(20) DEFAULT 'neutral',
      sentiment_score DECIMAL(4,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'completed',
      channel VARCHAR(50) DEFAULT 'voice-web',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await s`
    CREATE SEQUENCE IF NOT EXISTS ticket_seq START WITH 1235 INCREMENT BY 1
  `;

  // Doctors table
  await s`
    CREATE TABLE IF NOT EXISTS doctors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      specialty VARCHAR(255) NOT NULL,
      bio TEXT,
      avatar_url VARCHAR(500),
      consultation_duration_minutes INT DEFAULT 30,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Doctor availability schedules
  await s`
    CREATE TABLE IF NOT EXISTS doctor_schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
      day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Appointments table
  await s`
    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      appointment_number VARCHAR(20) UNIQUE NOT NULL,
      customer_id UUID REFERENCES customers(id),
      doctor_id UUID REFERENCES doctors(id),
      ticket_id UUID REFERENCES tickets(id),
      appointment_type VARCHAR(100) NOT NULL,
      reason TEXT,
      scheduled_at TIMESTAMP NOT NULL,
      duration_minutes INT DEFAULT 30,
      status VARCHAR(20) DEFAULT 'scheduled',
      notes TEXT,
      ai_confidence DECIMAL(3,2) DEFAULT 0,
      channel VARCHAR(50) DEFAULT 'self-service',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      cancelled_at TIMESTAMP,
      completed_at TIMESTAMP
    )
  `;

  // Appointment sequence
  await s`
    CREATE SEQUENCE IF NOT EXISTS appointment_seq START WITH 1001 INCREMENT BY 1
  `;

  // AI conversation log
  await s`
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customers(id),
      channel VARCHAR(50) NOT NULL,
      messages JSONB DEFAULT '[]',
      resolution_status VARCHAR(20) DEFAULT 'pending',
      escalated BOOLEAN DEFAULT FALSE,
      escalation_reason TEXT,
      ticket_id UUID REFERENCES tickets(id),
      appointment_id UUID REFERENCES appointments(id),
      duration_seconds INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      resolved_at TIMESTAMP
    )
  `;
}

export async function generateTicketNumber(): Promise<string> {
  const s = getSql();
  const result = await s`SELECT nextval('ticket_seq') as num`;
  return `DNT-${result[0].num}`;
}
