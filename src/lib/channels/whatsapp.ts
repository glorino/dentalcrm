const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string };
}

export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) {
    console.error("WhatsApp credentials not configured");
    return false;
  }

  try {
    const res = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });

    return res.ok;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  params: string[] = [],
  languageCode = "en"
): Promise<boolean> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) return false;

  try {
    const template: Record<string, unknown> = {
      name: templateName,
      language: { code: languageCode },
    };

    if (params.length > 0) {
      template.components = [
        {
          type: "body",
          parameters: params.map((p) => ({ type: "text", text: p })),
        },
      ];
    }

    const res = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("WhatsApp template error:", error);
    }
    return res.ok;
  } catch (error) {
    console.error("WhatsApp template error:", error);
    return false;
  }
}

export function verifyWhatsAppSignature(body: string, signature: string | null, appSecret: string): boolean {
  if (!signature) return false;
  const crypto = require("crypto");
  const expectedSignature = crypto.createHmac("sha256", appSecret).update(body).digest("hex");
  return signature === `sha256=${expectedSignature}`;
}
