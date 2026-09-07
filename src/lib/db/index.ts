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
    return (s as any).query(stringsOrQuery, values);
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

  // System settings
  await s`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );
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

  // Predictions table
  await s`
    CREATE TABLE IF NOT EXISTS predictions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type VARCHAR(50) NOT NULL,
      entity_id UUID,
      prediction_type VARCHAR(100) NOT NULL,
      score DECIMAL(5,2),
      data JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Agent tasks queue
  await s`
    CREATE TABLE IF NOT EXISTS agent_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(50) NOT NULL,
      action VARCHAR(200) NOT NULL,
      data JSONB DEFAULT '{}',
      priority VARCHAR(20) DEFAULT 'medium',
      status VARCHAR(20) DEFAULT 'pending',
      result JSONB,
      error TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      started_at TIMESTAMP,
      completed_at TIMESTAMP
    )
  `;

  // X-ray analyses
  await s`
    CREATE TABLE IF NOT EXISTS xray_analyses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customers(id),
      image_url TEXT,
      findings JSONB DEFAULT '[]',
      overall_score DECIMAL(5,2),
      recommendations TEXT[],
      needs_urgent_care BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Patient journeys
  await s`
    CREATE TABLE IF NOT EXISTS patient_journeys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customers(id),
      event_type VARCHAR(100) NOT NULL,
      event_details TEXT,
      channel VARCHAR(50),
      sentiment VARCHAR(20),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Loyalty program
  await s`
    CREATE TABLE IF NOT EXISTS loyalty_points (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customers(id),
      points INT DEFAULT 0,
      reason VARCHAR(200),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Recall schedules
  await s`
    CREATE TABLE IF NOT EXISTS recall_schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customers(id),
      recall_type VARCHAR(100) NOT NULL,
      due_date TIMESTAMP NOT NULL,
      last_reminder_at TIMESTAMP,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Insurance claims
  await s`
    CREATE TABLE IF NOT EXISTS insurance_claims (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      claim_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id UUID REFERENCES customers(id),
      treatment_code VARCHAR(50),
      treatment_description TEXT,
      amount DECIMAL(12,2) NOT NULL,
      status VARCHAR(30) DEFAULT 'pending',
      submitted_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Payments
  await s`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      transaction_id VARCHAR(100) UNIQUE NOT NULL,
      reference VARCHAR(100) UNIQUE NOT NULL,
      customer_id UUID REFERENCES customers(id),
      appointment_id UUID REFERENCES appointments(id),
      amount DECIMAL(12,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'NGN',
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      description TEXT,
      status VARCHAR(30) DEFAULT 'pending',
      due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Add missing columns to existing tables
  await s`ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS intent VARCHAR(100)`;
  await s`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP`;

  // Performance indexes
  await s`CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id)`;
  await s`CREATE INDEX IF NOT EXISTS idx_tickets_assignee_id ON tickets(assignee_id)`;
  await s`CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)`;
  await s`CREATE INDEX IF NOT EXISTS idx_tickets_channel ON tickets(channel)`;
  await s`CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at)`;
  await s`CREATE INDEX IF NOT EXISTS idx_tickets_sla_status ON tickets(sla_status)`;
  await s`CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id)`;
  await s`CREATE INDEX IF NOT EXISTS idx_knowledge_status ON knowledge_articles(status)`;
  await s`CREATE INDEX IF NOT EXISTS idx_knowledge_collection ON knowledge_articles(collection)`;
  await s`CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id)`;
  await s`CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id)`;
  await s`CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at)`;
  await s`CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id)`;
  await s`CREATE INDEX IF NOT EXISTS idx_ai_conversations_customer_id ON ai_conversations(customer_id)`;
  await s`CREATE INDEX IF NOT EXISTS idx_predictions_entity ON predictions(entity_type, entity_id)`;
  await s`CREATE INDEX IF NOT EXISTS idx_predictions_type ON predictions(prediction_type)`;
  await s`CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status)`;
  await s`CREATE INDEX IF NOT EXISTS idx_agent_tasks_type ON agent_tasks(type)`;
  await s`CREATE INDEX IF NOT EXISTS idx_patient_journeys_customer ON patient_journeys(customer_id)`;
  await s`CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON loyalty_points(customer_id)`;
  await s`CREATE INDEX IF NOT EXISTS idx_recall_due ON recall_schedules(due_date, status)`;
  await s`CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)`;
  await s`CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority)`;
  await s`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`;
  await s`CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)`;
  await s`CREATE INDEX IF NOT EXISTS idx_appointments_customer_status ON appointments(customer_id, status)`;
  await s`CREATE INDEX IF NOT EXISTS idx_tickets_customer_status ON tickets(customer_id, status)`;
  await s`CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status)`;
  await s`CREATE INDEX IF NOT EXISTS idx_insurance_claims_customer ON insurance_claims(customer_id)`;
  await s`CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id)`;
}

export async function generateTicketNumber(): Promise<string> {
  const s = getSql();
  const result = await s`SELECT nextval('ticket_seq') as num`;
  return `DNT-${result[0].num}`;
}
