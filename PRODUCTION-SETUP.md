# Production Setup Guide

Complete guide for configuring all 6 CRM projects for production use.

## Project URLs

| Project | Vercel URL | GitHub Repo |
|---------|-----------|-------------|
| SSV CRM (CustomerSupport) | supportflow-ai.vercel.app | github.com/glorino/supportflow-ai |
| PropertyCRM | propertycrm.vercel.app | github.com/glorino/propertycrm |
| FinSupport | finsupport.vercel.app | github.com/glorino/finsupport |
| InsureCRM | insurecrm.vercel.app | github.com/glorino/insurecrm |
| DentalCRM | dentalcrm.vercel.app | github.com/glorino/dentalcrm |
| ShopCRM | shopcrm.vercel.app | github.com/glorino/shopcrm |

---

## 1. Custom Domains (Vercel)

For each project:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select the project
3. Go to **Settings → Domains**
4. Add your custom domain (e.g., `propertycrm.yourdomain.com`)
5. Configure DNS:
   - **CNAME** record: `cname.vercel-dns.com` → pointing to your subdomain
   - Or **A** record: `76.76.21.21` → pointing to your subdomain
6. Wait for SSL certificate provisioning (automatic)

### Recommended Domains
- `support.yourdomain.com` → SSV CRM
- `property.yourdomain.com` → PropertyCRM
- `finance.yourdomain.com` → FinSupport
- `insurance.yourdomain.com` → InsureCRM
- `dental.yourdomain.com` → DentalCRM
- `shop.yourdomain.com` → ShopCRM

---

## 2. WhatsApp Business API Webhooks

### For Each Project:

1. Go to [business.facebook.com](https://business.facebook.com)
2. Select your WhatsApp Business Account
3. Go to **WhatsApp → API Setup**
4. Under **Webhook**, click **Configure**

### Webhook URLs:
| Project | Webhook URL |
|---------|------------|
| PropertyCRM | `https://propertycrm.vercel.app/api/webhooks/whatsapp` |
| FinSupport | `https://finsupport.vercel.app/api/webhooks/whatsapp` |
| InsureCRM | `https://insurecrm.vercel.app/api/webhooks/whatsapp` |
| DentalCRM | `https://dentalcrm.vercel.app/api/webhooks/whatsapp` |
| ShopCRM | `https://shopcrm.vercel.app/api/webhooks/whatsapp` |

### Webhook Verify Token:
Use the same value as your `WHATSAPP_VERIFY_TOKEN` environment variable (or set it to a random string like `dentalcrm_verify_2026`).

### Subscribe to Events:
- ✅ messages
- ✅ message_status

### After configuring each webhook:
1. Click **Verify and Save**
2. Send a test message to your WhatsApp Business number
3. Check the Vercel function logs to confirm receipt

---

## 3. Termii SMS Inbound Webhooks

### For Each Project:

1. Log in to [termii.com](https://termii.com)
2. Go to **Settings → API Settings**
3. Scroll to **Inbound SMS Configuration**

### Inbound Webhook URLs:
| Project | Inbound URL |
|---------|------------|
| PropertyCRM | `https://propertycrm.vercel.app/api/webhooks/sms` |
| FinSupport | `https://finsupport.vercel.app/api/webhooks/sms` |
| InsureCRM | `https://insurecrm.vercel.app/api/webhooks/sms` |
| DentalCRM | `https://dentalcrm.vercel.app/api/webhooks/sms` |
| ShopCRM | `https://shopcrm.vercel.app/api/webhooks/sms` |

### Setup Steps:
1. Enter the webhook URL for your project
2. Set the method to **POST**
3. Save the configuration
4. Send a test SMS to your Termii number
5. Check Vercel function logs for confirmation

---

## 4. Email Forwarding (IMAP/SMTP)

### Option A: Email Forwarding (Recommended)

For each project, set up email forwarding to route incoming emails to the API:

1. **Gmail/Google Workspace:**
   - Go to Settings → Forwarding
   - Add forwarding address: `support@yourdomain.com`
   - Set up a filter to forward emails matching your support address

2. **Microsoft 365:**
   - Go to Admin → Exchange → Mail Flow
   - Create a rule to forward incoming emails to the webhook

3. **Cloudflare Email Routing:**
   - Go to Email → Routing
   - Set up a catch-all or specific address forwarding
   - Forward to a service that can call the webhook (e.g., SendGrid Inbound Parse)

### Option B: Direct IMAP Connection

Configure the app to poll email via IMAP:

1. Set these environment variables in Vercel:
   ```
   EMAIL_IMAP_HOST=imap.gmail.com
   EMAIL_IMAP_PORT=993
   EMAIL_IMAP_USER=support@yourdomain.com
   EMAIL_IMAP_PASS=your-app-password
   EMAIL_SMTP_HOST=smtp.gmail.com
   EMAIL_SMTP_PORT=587
   EMAIL_SMTP_USER=support@yourdomain.com
   EMAIL_SMTP_PASS=your-app-password
   ```

2. The app will poll for new emails every 60 seconds via the `/api/email/poll` endpoint

### Email Addresses per Project:
| Project | Support Email |
|---------|--------------|
| PropertyCRM | support@propertycrm.yourdomain.com |
| FinSupport | support@finsupport.yourdomain.com |
| InsureCRM | support@insurecrm.yourdomain.com |
| DentalCRM | support@dentalcrm.yourdomain.com |
| ShopCRM | support@shopcrm.yourdomain.com |

---

## 5. Environment Variables Checklist

Ensure these are set in each Vercel project's **Settings → Environment Variables**:

### Required (shared across all projects):
- [ ] `DATABASE_URL` — Neon PostgreSQL connection string
- [ ] `OPENAI_API_KEY` — OpenAI API key for chat AI
- [ ] `WHATSAPP_ACCESS_TOKEN` — WhatsApp Business API token
- [ ] `WHATSAPP_PHONE_NUMBER_ID` — WhatsApp phone number ID
- [ ] `WHATSAPP_VERIFY_TOKEN` — Webhook verify token
- [ ] `TERMII_API_KEY` — Termii SMS API key
- [ ] `SMTP_HOST` — SMTP server host
- [ ] `SMTP_PORT` — SMTP server port
- [ ] `SMTP_USER` — SMTP username
- [ ] `SMTP_PASS` — SMTP password
- [ ] `EMAIL_FROM` — Sender email address
- [ ] `NEXTAUTH_SECRET` — Random secret for auth (generate with `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` — Your production URL (e.g., `https://dentalcrm.yourdomain.com`)

### Industry-specific:
- [ ] `INDUSTRY_SLUG` — Set to: `healthcare`, `realestate`, `fintech`, `insurance`, or `ecommerce`

---

## 6. Database Setup

### Each project has its own Neon database:

1. Log in to [neon.tech](https://neon.tech)
2. Select the project's database
3. Copy the connection string
4. Set it as `DATABASE_URL` in Vercel

### Initialize the database:
After setting the environment variables, trigger the seed endpoint:
```bash
curl -X POST https://your-project.vercel.app/api/seed
```

This will:
- Create all tables
- Insert demo users, customers, tickets, and knowledge articles
- Set up the admin account

---

## 7. Facebook Messenger Integration

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Select your app → **Messenger → Settings**
3. Under **Webhooks**, add the callback URL:

| Project | Callback URL |
|---------|-------------|
| PropertyCRM | `https://propertycrm.vercel.app/api/webhooks/messenger` |
| FinSupport | `https://finsupport.vercel.app/api/webhooks/messenger` |
| InsureCRM | `https://insurecrm.vercel.app/api/webhooks/messenger` |
| DentalCRM | `https://dentalcrm.vercel.app/api/webhooks/messenger` |
| ShopCRM | `https://shopcrm.vercel.app/api/webhooks/messenger` |

4. Set the verify token (same as `WHATSAPP_VERIFY_TOKEN`)
5. Subscribe to: `messages`, `messaging_postbacks`

---

## 8. Instagram DM Integration

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Select your app → **Instagram → Basic Display**
3. Under **Webhooks**, add:

| Project | Callback URL |
|---------|-------------|
| PropertyCRM | `https://propertycrm.vercel.app/api/webhooks/instagram` |
| FinSupport | `https://finsupport.vercel.app/api/webhooks/instagram` |
| InsureCRM | `https://insurecrm.vercel.app/api/webhooks/instagram` |
| DentalCRM | `https://dentalcrm.vercel.app/api/webhooks/instagram` |
| ShopCRM | `https://shopcrm.vercel.app/api/webhooks/instagram``

4. Subscribe to: `messages`, `message_reactions`

---

## 9. Post-Deployment Checklist

After all configuration:

- [ ] Test login with demo credentials
- [ ] Toggle EN/FR language — verify all text changes
- [ ] Send a test WhatsApp message — verify it appears in inbox
- [ ] Send a test SMS — verify it appears in inbox
- [ ] Send a test email — verify it appears in inbox
- [ ] Open the chat widget — ask a question — verify AI responds
- [ ] Create a ticket from the support page
- [ ] Check dashboard analytics are loading
- [ ] Test the booking demo modal
- [ ] Verify all pages load without errors
- [ ] Check mobile responsiveness
- [ ] Test terms and privacy pages

---

## 10. Admin Credentials

| Project | Admin Email | Password |
|---------|------------|----------|
| PropertyCRM | adebayo@propertycrm.com | admin123 |
| FinSupport | tunde@finsupport.com | admin123 |
| InsureCRM | adewale@insurecrm.com | admin123 |
| DentalCRM | emeka@dentalcrm.com | admin123 |
| ShopCRM | tunde@shopcrm.com | admin123 |

**⚠️ Change all passwords before going live!**
