import { EmailTemplate } from "./templates";

let resendClient: any = null;

async function getResendClient() {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }

  const { Resend } = await import("resend");
  resendClient = new Resend(apiKey);
  return resendClient;
}

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const client = await getResendClient();
    const from = params.from || process.env.EMAIL_FROM || "DentalCRM <onboarding@resend.dev>";

    const result = await client.emails.send({
      from,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.id };
  } catch (error: any) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

export async function sendTemplateEmail(params: {
  to: string | string[];
  template: EmailTemplate;
  from?: string;
  replyTo?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  return sendEmail({
    to: params.to,
    subject: params.template.subject,
    html: params.template.html,
    text: params.template.text,
    from: params.from,
    replyTo: params.replyTo,
  });
}

export async function sendAppointmentConfirmationPatient(params: {
  to: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  appointmentType: string;
  date: string;
  time: string;
  appointmentNumber: string;
  reason?: string;
}) {
  const { appointmentConfirmationPatient } = await import("./templates");
  const template = appointmentConfirmationPatient(params);
  return sendTemplateEmail({ to: params.to, template });
}

export async function sendAppointmentConfirmationDoctor(params: {
  to: string;
  doctorName: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  appointmentType: string;
  date: string;
  time: string;
  appointmentNumber: string;
  reason?: string;
}) {
  const { appointmentConfirmationDoctor } = await import("./templates");
  const template = appointmentConfirmationDoctor(params);
  return sendTemplateEmail({ to: params.to, template });
}

export async function sendTicketResolutionEmail(params: {
  to: string;
  patientName: string;
  ticketNumber: string;
  subject: string;
  resolution: string;
  resolvedBy: "ai" | "human";
  appointmentScheduled?: boolean;
  appointmentNumber?: string;
}) {
  const { ticketResolutionEmail } = await import("./templates");
  const template = ticketResolutionEmail(params);
  return sendTemplateEmail({ to: params.to, template });
}

export async function sendEscalationEmail(params: {
  to: string | string[];
  patientName: string;
  ticketNumber: string;
  subject: string;
  reason: string;
  priority: string;
  channel: string;
}) {
  const { escalationNotification } = await import("./templates");
  const template = escalationNotification(params);
  return sendTemplateEmail({ to: params.to, template });
}
