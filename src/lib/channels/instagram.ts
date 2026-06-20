const GRAPH_API_URL = "https://graph.facebook.com/v18.0";

export async function sendInstagramDM(recipientId: string, text: string): Promise<boolean> {
  const pageToken = process.env.FB_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FB_PAGE_ID;

  if (!pageToken || !pageId) {
    console.error("Instagram credentials not configured");
    return false;
  }

  try {
    const res = await fetch(`${GRAPH_API_URL}/${pageId}/messages`, {
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
    console.error("Instagram DM error:", error);
    return false;
  }
}
