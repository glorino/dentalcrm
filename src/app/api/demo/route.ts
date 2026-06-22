import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const ADMIN_EMAIL = "info@glopresc.com";

function buildCustomerEmail(data: {
  name: string;
  email: string;
  company: string;
  date: string;
  time: string;
  message: string;
}) {
  const dateObj = new Date(data.date + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f7fb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px 40px;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Demo Confirmed</h1>
            <p style="color:#bfdbfe;margin:6px 0 0;font-size:14px;">DentalCRM</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="font-size:16px;color:#1f2937;margin:0 0 8px;">Hi ${data.name},</p>
            <p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 24px;">
              Your demo has been scheduled. Here are the details:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:12px;border:1px solid #dbeafe;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;width:120px;">Date</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;">${formattedDate}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;">Time</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;">${data.time} (WAT)</td>
                    </tr>
                    ${data.company ? `<tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;">Company</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;">${data.company}</td>
                    </tr>` : ""}
                  </table>
                </td>
              </tr>
            </table>
            <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 20px;">
              A calendar invite and meeting link will be sent to you shortly. The demo is a 30-minute walkthrough of DentalCRM, customized to your industry and team size. No commitment required.
            </p>
            <p style="font-size:14px;color:#6b7280;margin:0;">
              Questions? Reply to this email or contact us at <a href="mailto:${ADMIN_EMAIL}" style="color:#2563eb;">${ADMIN_EMAIL}</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
            <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;">
              © ${new Date().getFullYear()} DentalCRM — AI-Powered Customer Support Platform
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildAdminEmail(data: {
  name: string;
  email: string;
  company: string;
  phone: string;
  date: string;
  time: string;
  message: string;
}) {
  const dateObj = new Date(data.date + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f7fb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#10b981);padding:32px 40px;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">New Demo Request</h1>
            <p style="color:#a7f3d0;margin:6px 0 0;font-size:14px;">A customer has booked a demo</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;width:120px;">Name</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;">${data.name}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;">Email</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;"><a href="mailto:${data.email}" style="color:#2563eb;">${data.email}</a></td>
                    </tr>
                    ${data.company ? `<tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;">Company</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;">${data.company}</td>
                    </tr>` : ""}
                    ${data.phone ? `<tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;">Phone</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;">${data.phone}</td>
                    </tr>` : ""}
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;">Date</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;">${formattedDate}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;">Time</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;">${data.time} (WAT)</td>
                    </tr>
                    ${data.message ? `<tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;vertical-align:top;">Message</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;line-height:1.5;">${data.message}</td>
                    </tr>` : ""}
                  </table>
                </td>
              </tr>
            </table>
            <p style="font-size:14px;color:#6b7280;margin:0;">
              Reply directly to <a href="mailto:${data.email}" style="color:#2563eb;">${data.email}</a> to confirm or reschedule.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
            <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;">
              © ${new Date().getFullYear()} DentalCRM — AI-Powered Customer Support Platform
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, email, company, phone, date, time, message } = data;

    if (!name || !email || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json({
        success: true,
        message: "Demo booked. Email confirmation will be sent once SMTP is configured.",
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 587,
      secure: Number(smtpPort) === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"DentalCRM" <${smtpUser}>`,
      to: email,
      subject: `Demo Confirmed — ${date} at ${time}`,
      html: buildCustomerEmail({ name, email, company: company || "", date, time, message: message || "" }),
    });

    await transporter.sendMail({
      from: `"DentalCRM" <${smtpUser}>`,
      to: ADMIN_EMAIL,
      subject: `New Demo Request from ${name}${company ? ` (${company})` : ""}`,
      html: buildAdminEmail({ name, email, company: company || "", phone: phone || "", date, time, message: message || "" }),
    });

    return NextResponse.json({ success: true, message: "Confirmation emails sent." });
  } catch (error) {
    console.error("Demo email error:", error);
    return NextResponse.json({ error: "Failed to send confirmation emails" }, { status: 500 });
  }
}
