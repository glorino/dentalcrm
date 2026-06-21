import nodemailer from "nodemailer";
import { sql } from "@/lib/db";

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  messageId?: string;
  date?: Date;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "465");
  const email = process.env.SMTP_USER || process.env.EMAIL_ADDRESS;
  const password = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

  if (!smtpHost || !email || !password) {
    throw new Error("SMTP credentials not configured");
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: email,
      pass: password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return transporter;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
  try {
    const transport = getTransporter();
    const from = process.env.SMTP_USER || process.env.EMAIL_ADDRESS;

    await transport.sendMail({
      from: `"DentalCRM" <${from}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    });

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

export async function sendTicketCreatedEmail(to: string, ticketNumber: string, subject: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">DentalCRM Support</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #1e293b;">Ticket Created Successfully</h2>
        <p style="color: #475569; line-height: 1.6;">
          Your support request has been received and a ticket has been created.
        </p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <p style="margin: 5px 0;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
          <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Open</p>
          <p style="margin: 5px 0;"><strong>Priority:</strong> Medium</p>
        </div>
        <p style="color: #475569; line-height: 1.6;">
          Our team will review your request and respond within 1 hour during business hours.
          You can track your ticket status at any time by visiting our support portal.
        </p>
        <p style="color: #475569; line-height: 1.6;">
          <strong>Need immediate help?</strong><br>
          Email: info@glopresc.com<br>
          WhatsApp: +2347082529729
        </p>
      </div>
      <div style="background: #1e293b; color: #94a3b8; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px;">
        DentalCRM - AI-Powered Customer Support Platform
      </div>
    </div>
  `;

  return sendEmail(to, `Ticket ${ticketNumber} Created - ${subject}`, `Your support ticket ${ticketNumber} has been created. We'll respond within 1 hour.`, html);
}

export async function sendTicketUpdateEmail(to: string, ticketNumber: string, status: string, message: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">DentalCRM Support</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #1e293b;">Ticket Updated</h2>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <p style="margin: 5px 0;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${status}</p>
          <p style="margin: 5px 0;"><strong>Message:</strong> ${message}</p>
        </div>
        <p style="color: #475569; line-height: 1.6;">
          Our team is working on your request. You'll receive another update when there's progress.
        </p>
      </div>
      <div style="background: #1e293b; color: #94a3b8; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px;">
        DentalCRM - AI-Powered Customer Support Platform
      </div>
    </div>
  `;

  return sendEmail(to, `Ticket ${ticketNumber} Updated - ${status}`, `Your ticket ${ticketNumber} status: ${status}. ${message}`, html);
}

export async function processIncomingEmail(from: string, subject: string, body: string): Promise<string> {
  let customerId: string;

  try {
    await sql`SELECT 1`;
  } catch {
    console.error("DB not available for email processing");
    return "error";
  }

  try {
    let customers = await sql`SELECT id, name FROM customers WHERE email = ${from}`;

    if (customers.length === 0) {
      const result = await sql`
        INSERT INTO customers (email, name, company, segment, plan)
        VALUES (${from}, ${from.split("@")[0]}, 'Unknown', 'starter', 'starter')
        RETURNING id
      `;
      customerId = result[0].id;
    } else {
      customerId = customers[0].id;
    }

    const count = await sql`SELECT COUNT(*) as cnt FROM tickets`;
    const num = Number(count[0].cnt) + 1235;
    const ticketNumber = `DNT-${num}`;
    const slaDue = new Date(Date.now() + 14400000);

    await sql`
      INSERT INTO tickets (ticket_number, subject, message, status, priority, channel, customer_id, sla_status, sla_due, tags)
      VALUES (${ticketNumber}, ${subject.substring(0, 500)}, ${body}, 'open', 'medium', 'email', ${customerId}, 'ok', ${slaDue.toISOString()}, ARRAY['email'])
    `;

    const ticketResult = await sql`SELECT id FROM tickets WHERE ticket_number = ${ticketNumber}`;
    if (ticketResult.length > 0) {
      await sql`
        INSERT INTO messages (ticket_id, sender_type, sender_id, content, channel)
        VALUES (${ticketResult[0].id}, 'customer', ${customerId}, ${body}, 'email')
      `;
    }

    await sendTicketCreatedEmail(from, ticketNumber, subject);

    return ticketNumber;
  } catch (error) {
    console.error("Email processing error:", error);
    return "error";
  }
}
