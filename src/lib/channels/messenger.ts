const MESSENGER_API_URL = "https://graph.facebook.com/v18.0";

export async function sendMessengerMessage(recipientId: string, text: string): Promise<boolean> {
  const pageToken = process.env.FB_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FB_PAGE_ID;

  if (!pageToken || !pageId) {
    console.error("Messenger credentials not configured");
    return false;
  }

  try {
    const res = await fetch(`${MESSENGER_API_URL}/${pageId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pageToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    return res.ok;
  } catch (error) {
    console.error("Messenger send error:", error);
    return false;
  }
}

export function verifyMessengerSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const crypto = require("crypto");
  const appSecret = process.env.FB_APP_SECRET;
  if (!appSecret) return false;
  const expectedSignature = crypto.createHmac("sha256", appSecret).update(body).digest("hex");
  return signature === `sha256=${expectedSignature}`;
}

export function verifyMessengerHub(mode: string, token: string): boolean {
  const verifyToken = process.env.FB_VERIFY_TOKEN;
  return mode === "subscribe" && token === verifyToken;
}
