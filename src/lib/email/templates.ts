export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const BRAND_COLOR = "#2563eb";
const BRANDGradient = `linear-gradient(135deg, ${BRAND_COLOR}, #7c3aed)`;

function baseLayout(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="${BRANDGradient};color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="margin:0;font-size:22px;font-weight:700;">DentalCRM</h1>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">AI-Powered Patient Support</p>
    </div>
    <div style="background:#ffffff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
      ${content}
    </div>
    <div style="text-align:center;padding:16px;font-size:11px;color:#94a3b8;">
      DentalCRM &copy; ${new Date().getFullYear()} &mdash; AI-Powered Patient Support Platform
    </div>
  </div>
</body>
</html>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">`;
}

function infoRow(label: string, value: string): string {
  return `<p style="margin:6px 0;font-size:14px;color:#334155;"><strong>${label}:</strong> ${value}</p>`;
}

function badge(text: string, color: string): string {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${color}20;color:${color};">${text}</span>`;
}

// ─── APPOINTMENT CONFIRMATION (PATIENT) ────────────────────────────────────────

export function appointmentConfirmationPatient(params: {
  patientName: string;
  doctorName: string;
  specialty: string;
  appointmentType: string;
  date: string;
  time: string;
  appointmentNumber: string;
  reason?: string;
  clinicAddress?: string;
}): EmailTemplate {
  const content = `
    <h2 style="color:#1e293b;margin:0 0 8px;font-size:20px;">Appointment Confirmed</h2>
    <p style="color:#64748b;margin:0 0 24px;font-size:14px;">Your dental appointment has been booked successfully.</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:20px;">✅</span>
        <span style="font-size:14px;font-weight:600;color:#166534;">Booking Confirmed</span>
      </div>
      ${infoRow("Appointment Number", params.appointmentNumber)}
      ${infoRow("Date", params.date)}
      ${infoRow("Time", params.time)}
      ${infoRow("Doctor", params.doctorName)}
      ${infoRow("Specialty", params.specialty)}
      ${infoRow("Type", params.appointmentType)}
      ${params.reason ? infoRow("Reason", params.reason) : ""}
    </div>

    <div style="background:#f8fafc;border-radius:10px;padding:20px;margin-bottom:24px;">
      <h3 style="color:#1e293b;margin:0 0 12px;font-size:15px;">Pre-Appointment Checklist</h3>
      <p style="margin:4px 0;font-size:13px;color:#475569;">✓ Bring a valid photo ID</p>
      <p style="margin:4px 0;font-size:13px;color:#475569;">✓ Arrive 10 minutes early</p>
      <p style="margin:4px 0;font-size:13px;color:#475569;">✓ Bring previous dental records (if any)</p>
      <p style="margin:4px 0;font-size:13px;color:#475569;">✓ List any current medications</p>
      ${params.clinicAddress ? `<p style="margin:12px 0 4px;font-size:13px;color:#475569;"><strong>Location:</strong> ${params.clinicAddress}</p>` : ""}
    </div>

    <p style="color:#64748b;font-size:13px;">
      Need to reschedule? Reply to this email or call us at least 24 hours before your appointment.
    </p>
  `;

  return {
    subject: `Appointment Confirmed — ${params.appointmentType} with ${params.doctorName} on ${params.date}`,
    html: baseLayout("Appointment Confirmation", content),
    text: `Appointment Confirmed\n\n${params.appointmentNumber}\nDate: ${params.date}\nTime: ${params.time}\nDoctor: ${params.doctorName}\nType: ${params.appointmentType}`,
  };
}

// ─── APPOINTMENT CONFIRMATION (DOCTOR) ─────────────────────────────────────────

export function appointmentConfirmationDoctor(params: {
  doctorName: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  appointmentType: string;
  date: string;
  time: string;
  appointmentNumber: string;
  reason?: string;
}): EmailTemplate {
  const content = `
    <h2 style="color:#1e293b;margin:0 0 8px;font-size:20px;">New Appointment Scheduled</h2>
    <p style="color:#64748b;margin:0 0 24px;font-size:14px;">A patient has booked an appointment with you.</p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;margin-bottom:24px;">
      <h3 style="color:#1e40af;margin:0 0 12px;font-size:15px;">Patient Details</h3>
      ${infoRow("Name", params.patientName)}
      ${infoRow("Email", params.patientEmail)}
      ${params.patientPhone ? infoRow("Phone", params.patientPhone) : ""}
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:24px;">
      <h3 style="color:#1e293b;margin:0 0 12px;font-size:15px;">Appointment Details</h3>
      ${infoRow("Appointment Number", params.appointmentNumber)}
      ${infoRow("Date", params.date)}
      ${infoRow("Time", params.time)}
      ${infoRow("Type", params.appointmentType)}
      ${params.reason ? infoRow("Reason", params.reason) : ""}
    </div>

    <p style="color:#64748b;font-size:13px;">
      This appointment was auto-scheduled by the AI self-service system. Review patient history in the dashboard.
    </p>
  `;

  return {
    subject: `New Appointment: ${params.patientName} — ${params.appointmentType} on ${params.date}`,
    html: baseLayout("New Appointment", content),
    text: `New Appointment\n\nPatient: ${params.patientName}\nDate: ${params.date}\nTime: ${params.time}\nType: ${params.appointmentType}`,
  };
}

// ─── TICKET RESOLUTION SUMMARY ─────────────────────────────────────────────────

export function ticketResolutionEmail(params: {
  patientName: string;
  ticketNumber: string;
  subject: string;
  resolution: string;
  resolvedBy: "ai" | "human";
  appointmentScheduled?: boolean;
  appointmentNumber?: string;
}): EmailTemplate {
  const resolvedByLabel = params.resolvedBy === "ai" ? "AI Assistant" : "Support Agent";

  const content = `
    <h2 style="color:#1e293b;margin:0 0 8px;font-size:20px;">Issue Resolved</h2>
    <p style="color:#64748b;margin:0 0 24px;font-size:14px;">Your support request has been successfully resolved.</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:20px;">✅</span>
        <span style="font-size:14px;font-weight:600;color:#166534;">Resolved</span>
        ${badge(`By: ${resolvedByLabel}`, "#2563eb")}
      </div>
      ${infoRow("Ticket Number", params.ticketNumber)}
      ${infoRow("Subject", params.subject)}
    </div>

    <div style="background:#f8fafc;border-radius:10px;padding:20px;margin-bottom:24px;">
      <h3 style="color:#1e293b;margin:0 0 12px;font-size:15px;">Resolution Details</h3>
      <p style="color:#475569;font-size:14px;line-height:1.6;">${params.resolution}</p>
    </div>

    ${params.appointmentScheduled ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;margin-bottom:24px;">
      <h3 style="color:#1e40af;margin:0 0 8px;font-size:15px;">Appointment Scheduled</h3>
      <p style="color:#475569;font-size:14px;">An appointment has been scheduled for you. Check your email for details.</p>
      ${params.appointmentNumber ? infoRow("Appointment Number", params.appointmentNumber) : ""}
    </div>
    ` : ""}

    <p style="color:#64748b;font-size:13px;">
      If this issue wasn't fully resolved, reply to this email and a human agent will follow up within 2 hours.
    </p>
  `;

  return {
    subject: `Ticket ${params.ticketNumber} Resolved — ${params.subject}`,
    html: baseLayout("Issue Resolved", content),
    text: `Issue Resolved\n\nTicket: ${params.ticketNumber}\nSubject: ${params.subject}\n\nResolution: ${params.resolution}`,
  };
}

// ─── ESCALATION NOTIFICATION ───────────────────────────────────────────────────

export function escalationNotification(params: {
  patientName: string;
  ticketNumber: string;
  subject: string;
  reason: string;
  priority: string;
  channel: string;
}): EmailTemplate {
  const priorityColor = params.priority === "urgent" ? "#dc2626" : params.priority === "high" ? "#f59e0b" : "#2563eb";

  const content = `
    <h2 style="color:#1e293b;margin:0 0 8px;font-size:20px;">Ticket Escalated</h2>
    <p style="color:#64748b;margin:0 0 24px;font-size:14px;">This ticket requires human agent attention.</p>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:20px;">⚠️</span>
        <span style="font-size:14px;font-weight:600;color:#991b1b;">Escalated</span>
        ${badge(params.priority.toUpperCase(), priorityColor)}
        ${badge(params.channel, "#6366f1")}
      </div>
      ${infoRow("Ticket Number", params.ticketNumber)}
      ${infoRow("Patient", params.patientName)}
      ${infoRow("Subject", params.subject)}
      ${infoRow("Reason", params.reason)}
    </div>

    <p style="color:#64748b;font-size:13px;">
      Log in to the dashboard to review and respond to this ticket.
    </p>
  `;

  return {
    subject: `⚠️ Escalated: ${params.ticketNumber} — ${params.subject}`,
    html: baseLayout("Ticket Escalated", content),
    text: `Ticket Escalated\n\nTicket: ${params.ticketNumber}\nPatient: ${params.patientName}\nReason: ${params.reason}`,
  };
}

// ─── FOLLOW-UP REMINDER ────────────────────────────────────────────────────────

export function followUpReminder(params: {
  patientName: string;
  ticketNumber: string;
  subject: string;
  daysSinceResolved: number;
}): EmailTemplate {
  const content = `
    <h2 style="color:#1e293b;margin:0 0 8px;font-size:20px;">Follow-Up Reminder</h2>
    <p style="color:#64748b;margin:0 0 24px;font-size:14px;">We want to make sure your issue was fully resolved.</p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:24px;">
      ${infoRow("Ticket Number", params.ticketNumber)}
      ${infoRow("Subject", params.subject)}
      ${infoRow("Days Since Resolution", String(params.daysSinceResolved))}
    </div>

    <p style="color:#475569;font-size:14px;line-height:1.6;">
      Hi ${params.patientName},<br><br>
      We wanted to check in and make sure everything is going well with your recent support request.
      If you need any further assistance, please don't hesitate to reach out.
    </p>

    <div style="text-align:center;margin:24px 0;">
      <a href="#" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Contact Support
      </a>
    </div>
  `;

  return {
    subject: `Follow-Up: How was your experience with ${params.ticketNumber}?`,
    html: baseLayout("Follow-Up Reminder", content),
    text: `Follow-Up Reminder\n\nTicket: ${params.ticketNumber}\nSubject: ${params.subject}`,
  };
}
