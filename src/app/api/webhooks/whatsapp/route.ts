import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage, verifyWhatsAppSignature } from "@/lib/channels/whatsapp";
import { broadcastInboxUpdate } from "@/lib/events";
import { initDB, sql, generateTicketNumber } from "@/lib/db";

const WHATSAPP_NUMBER = "+2347082529729";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const appSecret = process.env.FB_APP_SECRET;

    if (appSecret && signature) {
      const isValid = verifyWhatsAppSignature(body, signature, appSecret);
      if (!isValid) {
        console.error("Invalid WhatsApp webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    const jsonBody = JSON.parse(body);

    if (jsonBody.object === "whatsapp_business_account") {
      const entry = jsonBody.entry?.[0];
      const changes = entry?.changes?.[0];

      if (changes?.field === "messages") {
        const value = changes.value;
        const messages = value.messages || [];

        for (const msg of messages) {
          const from = msg.from;
          const text = msg.text?.body || "";

          if (text) {
            await processIncomingWhatsApp(from, text);
          }
        }
      }

      return NextResponse.json({ status: "ok" });
    }

    return NextResponse.json({ status: "ignored" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.FB_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

async function processIncomingWhatsApp(from: string, text: string) {
  let dbReady = false;
  try {
    await initDB();
    dbReady = true;
  } catch (e) {
    console.error("DB init failed, proceeding without DB:", e);
  }

  let customerId: string | null = null;
  let customerName = "there";
  let ticketNumber = `SSV-${Date.now().toString().slice(-6)}`;

  if (dbReady) {
    try {
      let customers = await sql`SELECT id, name FROM customers WHERE phone = ${from} OR email = ${from}`;
      
      if (customers.length === 0) {
        const result = await sql`
          INSERT INTO customers (email, name, company, segment, plan, phone)
          VALUES (${from}, ${"WhatsApp User"}, "Unknown", "starter", "starter", ${from})
          RETURNING id
        `;
        customerId = result[0].id;
      } else {
        customerId = customers[0].id;
        if (customers[0].name && customers[0].name !== "WhatsApp User") {
          customerName = customers[0].name.split(" ")[0];
        }
      }

      ticketNumber = await generateTicketNumber();
      const slaDue = new Date(Date.now() + 7200000);

      await sql`
        INSERT INTO tickets (ticket_number, subject, message, status, priority, channel, customer_id, sla_status, sla_due, tags)
        VALUES (${ticketNumber}, ${text.substring(0, 100)}, ${text}, 'open', 'medium', 'whatsapp', ${customerId}, 'ok', ${slaDue.toISOString()}, ARRAY['whatsapp'])
      `;

      const ticketResult = await sql`SELECT id FROM tickets WHERE ticket_number = ${ticketNumber}`;
      if (ticketResult.length > 0) {
        await sql`
          INSERT INTO messages (ticket_id, sender_type, sender_id, content, channel)
          VALUES (${ticketResult[0].id}, 'customer', ${customerId}, ${text}, 'whatsapp')
        `;
      }

      broadcastInboxUpdate({
        type: "new_message",
        channel: "whatsapp",
        from,
        message: text,
        ticketNumber,
      });
    } catch (e) {
      console.error("DB operations failed:", e);
    }
  }

  const kbResults = await searchKnowledgeBase(text);
  const response = generateResponse(text, customerName, ticketNumber, kbResults);
  await sendWhatsAppMessage(from, response);
}

async function searchKnowledgeBase(query: string): Promise<string[]> {
  try {
    await initDB();
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (words.length === 0) return [];
    
    const results = await sql`
      SELECT title, content
      FROM knowledge_articles
      WHERE status = 'published'
        AND (title ILIKE ${`%${words[0]}%`} OR content ILIKE ${`%${words[0]}%`} OR ${words[0]} = ANY(tags))
      ORDER BY views DESC
      LIMIT 3
    `;
    return results.map((r: Record<string, unknown>) => `${r.title}: ${String(r.content).substring(0, 300)}`);
  } catch (error) {
    return [];
  }
}

function fuzzyMatch(input: string, keywords: string[]): boolean {
  const lower = input.toLowerCase().trim();
  
  for (const keyword of keywords) {
    if (lower.includes(keyword)) return true;
    
    const kLen = keyword.length;
    const words = lower.split(/\s+/);
    
    for (const word of words) {
      if (Math.abs(word.length - kLen) <= 2) {
        let diff = 0;
        const minLen = Math.min(word.length, kLen);
        for (let i = 0; i < minLen; i++) {
          if (word[i] !== keyword[i]) diff++;
        }
        diff += Math.abs(word.length - kLen);
        if (diff <= Math.floor(kLen * 0.35)) return true;
      }
    }
  }
  return false;
}

function generateResponse(text: string, customerName: string, ticketNumber: string, kbResults: string[]): string {
  const lower = text.toLowerCase().trim();

  if (kbResults.length > 0) {
    const mainArticle = kbResults[0].split(":")[0];
    return `Hi ${customerName}! 👋

I found some information that might help:

📚 *${mainArticle}*

I've created ticket *${ticketNumber}* for tracking. Our team will follow up if you need more help.

Is there anything else I can assist you with? 💬`;
  }

  if (fuzzyMatch(lower, ["password", "reset", "login", "log in", "forgot", "sign in", "locked out", "cant login", "cant log in", "pasword", "pasword", "passwrd", "reset password", "loging"])) {
    return `🔐 *Password Reset Guide*

I understand you're having trouble logging in, ${customerName}. Let's get this resolved quickly.

*Step-by-step to reset your password:*

1. Visit: supportflow-ai-six.vercel.app/forgot-password
2. Enter the email address associated with your account
3. Check your inbox (and spam/junk folder) for the reset email
4. Click the reset link in the email
5. Create a new strong password (min 8 characters, include letters and numbers)
6. Log in with your new password

*Important notes:*
• The reset link expires in 30 minutes
• If you don't receive the email, check your spam folder
• If you no longer have access to your email, contact us directly

*Still can't access your account?*
Reply with "human" to speak with our support team, or email us at info@glopresc.com with:
- Your registered email address
- A description of the issue
- Any error messages you're seeing

Ticket created: *${ticketNumber}*
We typically respond within 1 hour during business hours.`;
  }

  if (fuzzyMatch(lower, ["billing", "invoice", "payment", "charge", "refund", "money", "subscription", "plan", "bill", "biling", "pay", "paying", "overcharged"])) {
    return `💰 *Billing & Payment Support*

I'm here to help resolve your billing concern, ${customerName}. To assist you efficiently, I need a few details.

*Please provide the following:*
• Your account email address
• Invoice or transaction number (if available)
• Date of the charge or issue
• A brief description of the problem

*Common billing topics we can help with:*
✓ Understanding your current plan and charges
✓ Updating payment methods
✓ Requesting a refund (within 30 days of charge)
✓ Upgrading or downgrading your subscription
✓ Invoice requests and receipts
✓ Canceling auto-renewal

*Our billing policy:*
• Refund requests are processed within 3-5 business days
• Plan changes take effect immediately
• Invoices are available in your dashboard under Settings → Billing

*For immediate assistance:*
Email: info@glopresc.com
Subject: "Billing - [Your Issue]"

Ticket created: *${ticketNumber}*
Our billing team responds within 1 hour during business hours (Mon-Fri, 9AM-6PM WAT).`;
  }

  if (fuzzyMatch(lower, ["order", "delivery", "shipping", "track", "package", "dispatch", "tracking", "shipped", "delivered", "where is my", "ordr", "delivry", "shiping"])) {
    return `📦 *Order Tracking & Delivery Support*

I'd be happy to help you track your order or resolve a delivery issue, ${customerName}.

*To look up your order, please provide:*
• Your order number (starts with # or SSV-)
• OR the email address used to place the order
• OR the name on the order

*Once I have your details, I can:*
✓ Provide real-time tracking status
✓ Investigate delayed or missing deliveries
✓ Process reshipping for lost packages
✓ Update delivery instructions

*For quick self-service:*
1. Check your email for the order confirmation
2. Click the tracking link in that email
3. View real-time updates from the carrier

*Delivery timelines:*
• Standard shipping: 3-5 business days
• Express shipping: 1-2 business days
• International: 5-10 business days

Ticket created: *${ticketNumber}*
Please share your order details and I'll look into this right away.`;
  }

  if (fuzzyMatch(lower, ["account", "profile", "settings", "update profile", "update info", "change name", "acount", "profle", "settigns"])) {
    if (fuzzyMatch(lower, ["update", "profile", "info", "name", "change name", "update name", "edit"])) {
      return `👤 *Update Your Profile Information*

Here's exactly how to update your profile details, ${customerName}:

*Step-by-step instructions:*

1. *Log in* to your account at:
   supportflow-ai-six.vercel.app/login

2. *Navigate to Settings:*
   • Click the gear icon (⚙️) in the top-right corner
   • Or go to: supportflow-ai-six.vercel.app/dashboard/settings

3. *Edit your profile:*
   • Click on "Profile" or "Account Settings"
   • Update your name, phone number, or other details
   • Click "Save Changes"

4. *Verify the change:*
   • You'll see a confirmation message
   • Check that your updated info appears correctly

*What you can update:*
✓ Full name
✓ Phone number
✓ Company name
✓ Profile picture
✓ Notification preferences

*What requires support assistance:*
✗ Email address change (security verification needed)
✗ Account deletion (requires identity verification)

Ticket created: *${ticketNumber}*
Need to change your email? Reply with "change email" for specific instructions.`;
    }

    if (fuzzyMatch(lower, ["change email", "email", "change password", "password", "new password", "update password", "chang password"])) {
      return `🔒 *Change Email or Password*

For your security, email and password changes require verification.

*To Change Your Email:*

1. Log in at: supportflow-ai-six.vercel.app/login
2. Go to Settings → Account Security
3. Click "Change Email Address"
4. Enter your new email address
5. Enter your current password for verification
6. Check your NEW email inbox for a verification code
7. Enter the code to confirm the change

*To Change Your Password:*

1. Log in at: supportflow-ai-six.vercel.app/login
2. Go to Settings → Account Security
3. Click "Change Password"
4. Enter your current password
5. Enter your new password (min 8 characters)
6. Confirm your new password
7. Click "Save"

*Important security notes:*
• You'll receive an email confirmation for any changes
• If you didn't make the change, contact us immediately
• Use a strong, unique password (letters, numbers, symbols)
• Never share your password with anyone

Ticket created: *${ticketNumber}*
Locked out? Visit: supportflow-ai-six.vercel.app/forgot-password`;
    }

    if (fuzzyMatch(lower, ["delete", "remove account", "close account", "delet account"])) {
      return `⚠️ *Account Deletion Request*

I understand you'd like to delete your account, ${customerName}. Before we proceed, please review the following:

*What happens when you delete your account:*
• All your data will be permanently removed
• Tickets and support history will be erased
• You'll lose access to all services
• This action cannot be undone

*To request account deletion:*

Option 1: Email Request (Recommended)
Send an email to: info@glopresc.com
Subject: "Delete Account - [Your Email Address]"
Include: Your full name and reason for deletion (optional)

Option 2: Speak with Support
Reply with "human" to connect with our team

*Processing time:*
• Deletion requests are processed within 24-48 hours
• You'll receive a confirmation email once complete
• Your data will be permanently removed within 30 days

*Alternative options:*
• Temporarily deactivate instead of delete
• Update your subscription plan
• Transfer account ownership

Ticket created: *${ticketNumber}*
Would you like to explore any of these alternatives?`;
    }

    return `👤 *Account Support*

I'm here to help with your account, ${customerName}. What do you need assistance with?

*Available options:*

1️⃣ *Update profile info*
   Change your name, phone, or other details

2️⃣ *Change email or password*
   Update your login credentials securely

3️⃣ *Delete account*
   Permanently remove your account and data

4️⃣ *Account access issues*
   Can't log in or locked out

*Quick links:*
• Dashboard: supportflow-ai-six.vercel.app/dashboard
• Settings: supportflow-ai-six.vercel.app/dashboard/settings
• Password reset: supportflow-ai-six.vercel.app/forgot-password

Ticket created: *${ticketNumber}*
Just tell me which option you need help with.`;
  }

  if (fuzzyMatch(lower, ["technical", "bug", "error", "not working", "issue", "problem", "broken", "crash", "slow", "glitch", "fail", "failure", "technical issue", "bug report"])) {
    return `🔧 *Technical Support*

I'm sorry you're experiencing technical issues, ${customerName}. Let's diagnose and resolve this together.

*To help me understand the problem, please describe:*

1. *What were you trying to do?*
2. *What happened instead?*
3. *Any error messages?* (copy the exact text)
4. *Device and browser:* (iPhone/Android, Chrome/Safari)

*Common issues and quick fixes:*

• *Page not loading:*
  → Clear your browser cache and cookies
  → Try a different browser
  → Check your internet connection

• *Login issues:*
  → Use the password reset link
  → Check if Caps Lock is on
  → Try incognito/private browsing mode

• *Slow performance:*
  → Close other browser tabs
  → Check your internet speed
  → Try refreshing the page

• *Feature not working:*
  → Make sure you're logged in
  → Check if the feature is available on your plan
  → Try logging out and back in

Ticket created: *${ticketNumber}*
Please provide the details above, and I'll escalate this to our technical team.`;
  }

  if (fuzzyMatch(lower, ["pricing", "price", "cost", "plan", "upgrade", "downgrade", "how much", "subscription", "pricing plan", "plan details", "enterprice", "enterprise"])) {
    return `💡 *Pricing & Plans*

Great question, ${customerName}! Here's everything you need to know about our pricing.

*SSV CRM Plans:*

• *Starter Plan* — Perfect for small teams
  - Up to 500 tickets/month
  - 1 team member
  - Email & chat support
  - Basic analytics

• *Professional Plan* — Growing teams
  - Unlimited tickets
  - Up to 10 team members
  - All channels (WhatsApp, Email, Chat)
  - Advanced analytics
  - Priority support

• *Enterprise Plan* — Large organizations
  - Unlimited everything
  - Custom integrations
  - Dedicated account manager
  - SLA guarantees
  - 24/7 phone support

*To view detailed pricing:*
Visit: supportflow-ai-six.vercel.app/features

*Special offers:*
✓ 14-day free trial (no credit card required)
✓ Annual billing saves 20%
✓ Startup discount available

Ticket created: *${ticketNumber}*
Need help choosing? Book a free consultation: supportflow-ai-six.vercel.app/demo`;
  }

  if (fuzzyMatch(lower, ["demo", "trial", "try", "free", "book demo", "schedule demo", "demo request"])) {
    return `🎯 *Book a Free Demo*

We'd love to show you how SSV CRM can transform your customer support, ${customerName}!

*What to expect:*
✓ 30-minute personalized walkthrough
✓ See all features in action
✓ Customized to your industry and team size
✓ Live Q&A with our product experts
✓ No sales pressure — just genuine help

*How to book:*

1. Visit: supportflow-ai-six.vercel.app/demo
2. Select your preferred date and time
3. Choose your industry (so we can customize the demo)
4. Add your team size
5. Confirm your booking

*Or email us directly:*
📧 info@glopresc.com
Subject: "Demo Request - [Your Company Name]"

*What to prepare:*
• Your current customer support challenges
• Team size and structure
• Channels you currently use
• Budget range (optional)

Ticket created: *${ticketNumber}*
Already know you want to start? Sign up: supportflow-ai-six.vercel.app/login`;
  }

  if (fuzzyMatch(lower, ["human", "agent", "person", "speak", "talk", "call", "representative", "support team", "real person", "talk to someone", "speak to someone"])) {
    return `🤝 *Connect with Our Support Team*

Absolutely, ${customerName}! I'll connect you with a human agent right away.

*Your request has been logged. Here's what happens next:*

1. *Immediate:* Your case has been escalated to our support team
2. *Within 15 minutes:* A team member will review your request
3. *Within 1 hour:* You'll receive a response via WhatsApp or email

*While you wait, you can also reach us through:*

📧 *Email:* info@glopresc.com
   Subject: "Support Request - [Brief Issue]"

📱 *WhatsApp:* ${WHATSAPP_NUMBER}

⏰ *Business Hours:*
   • Monday - Friday: 9:00 AM - 6:00 PM (WAT)
   • Saturday: 10:00 AM - 2:00 PM (WAT)
   • Sunday: Closed (emergency support available)

*What to include in your message:*
• Your name and account email
• Detailed description of the issue
• Steps you've already tried
• Screenshots if applicable

Ticket created: *${ticketNumber}*
Our team is committed to resolving your issue quickly. Thank you for your patience!`;
  }

  if (fuzzyMatch(lower, ["cancel", "unsubscribe", "stop", "opt out", "cancle", "cancellation", "stop subscription"])) {
    return `📝 *Cancellation & Subscription Management*

I understand you'd like to make changes to your subscription, ${customerName}. Let me help you with the options available.

*Before canceling, consider:*

1. *Pause your subscription:*
   → Keep your data while taking a break
   → Resume anytime without losing progress
   → Available for up to 3 months

2. *Downgrade your plan:*
   → Reduce features but keep your account
   → Lower monthly cost

3. *Transfer to another team member:*
   → Keep the account active under new ownership

*To cancel your subscription:*

1. Log in at: supportflow-ai-six.vercel.app/login
2. Go to: Settings → Billing → Subscription
3. Click "Manage Subscription"
4. Select "Cancel Subscription"
5. Follow the cancellation steps
6. Confirm your cancellation

*What happens after cancellation:*
• Your access continues until the end of the billing period
• All your data is retained for 30 days
• You can reactivate anytime within 30 days

Ticket created: *${ticketNumber}*
Reply with "human" to speak with our retention team.`;
  }

  if (fuzzyMatch(lower, ["thank", "thanks", "appreciate", "helpful", "great", "awesome", "perfect"])) {
    return `You're very welcome, ${customerName}! 😊

I'm glad I could help. Your satisfaction is our priority.

*Is there anything else I can assist you with today?*

Quick links:
• Account settings: supportflow-ai-six.vercel.app/dashboard/settings
• Knowledge base: supportflow-ai-six.vercel.app/knowledge
• Contact support: info@glopresc.com

Ticket *${ticketNumber}* is open and our team is on it.

Have a wonderful day! ✨`;
  }

  if (fuzzyMatch(lower, ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "helo", "heloo", "hii", "heythere"])) {
    return `Hello ${customerName}! 👋 Welcome to SSV Support.

I'm your AI assistant, ready to help you with:

🔧 *Technical Support*
   Troubleshoot issues, bugs, and errors

👤 *Account Help*
   Profile updates, password resets, account management

💰 *Billing & Payments*
   Invoices, refunds, plan changes, payment issues

📦 *Orders & Delivery*
   Track orders, shipping updates, delivery issues

💡 *Pricing & Plans*
   Plan details, upgrades, demos, free trials

🤝 *Human Support*
   Connect with our team for personalized assistance

*How to get started:*
Simply type your question or describe your issue, and I'll provide detailed, step-by-step guidance.

*Popular topics:*
• "Reset my password"
• "Track my order"
• "Billing question"
• "Book a demo"
• "Talk to human"

What can I help you with today? 🚀`;
  }

  if (/^[1-4]$/.test(lower)) {
    const options: Record<string, string> = {
      "1": "Update profile info",
      "2": "Change email or password",
      "3": "Delete account",
      "4": "Account access issues",
    };
    return `You selected: ${options[lower] || "Help"}, ${customerName}.

Tell me more about what you need, and I'll provide step-by-step instructions.

For example:
• "Update my name"
• "Change my email address"
• "Reset my password"
• "I'm locked out"

Ticket created: *${ticketNumber}*
What specifically can I help with?`;
  }

  return `Thanks for reaching out, ${customerName}! 💬

I'm here to help you with:

🔧 *Technical Support*
   "I have a technical issue" or "Something is not working"

👤 *Account Help*
   "Update my profile" or "Change my password"

💰 *Billing & Payments*
   "Billing question" or "I need an invoice"

📦 *Orders & Delivery*
   "Track my order" or "Where is my package?"

💡 *Pricing & Plans*
   "What plans do you offer?" or "How much does it cost?"

🤝 *Human Support*
   "Talk to human" or "Connect me to support"

*Simply describe your issue in detail, and I'll provide:*
✓ Step-by-step instructions
✓ Helpful links and resources
✓ Direct solutions to common problems

*Need immediate help?*
Email: info@glopresc.com
WhatsApp: ${WHATSAPP_NUMBER}

Ticket created: *${ticketNumber}*
What would you like help with today?`;
}
