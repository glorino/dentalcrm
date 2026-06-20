const TERMII_API_URL = "https://api.termii.com/api/v1";

export async function sendSMS(to: string, message: string): Promise<boolean> {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || "SSVCRM";

  if (!apiKey) {
    console.error("Termii API key not configured");
    return false;
  }

  try {
    const res = await fetch(`${TERMII_API_URL}/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        to,
        from: senderId,
        sms: message,
        type: "plain",
        channel: "generic",
      }),
    });

    const data = await res.json();
    return data.status === "success";
  } catch (error) {
    console.error("SMS send error:", error);
    return false;
  }
}

export async function sendBulkSMS(to: string[], message: string): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const number of to) {
    const success = await sendSMS(number, message);
    if (success) sent++;
    else failed++;
  }

  return { sent, failed };
}
