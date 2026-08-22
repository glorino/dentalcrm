# DentalCRM Deployment Setup Guide

## URLs
- **Production**: https://dentalcrm-beta.vercel.app
- **Login**: https://dentalcrm-beta.vercel.app/login

## Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Super Admin | emeka@dentalcrm.com | admin123 |
| Manager | folake@dentalcrm.com | demo123 |
| Agent | ngozi@dentalcrm.com | demo123 |
| Viewer | dayo@dentalcrm.com | demo123 |

## Database
- **Provider**: Neon PostgreSQL
- **URL**: Set in Vercel env vars as DATABASE_URL
- **Seed endpoint**: POST https://dentalcrm-beta.vercel.app/api/seed

## WhatsApp Webhook Setup
1. Go to https://developers.facebook.com
2. Add webhook URL: `https://dentalcrm-beta.vercel.app/api/webhooks/whatsapp`
3. Verify token: Set FB_VERIFY_TOKEN in Vercel env vars
4. Subscribe to fields: `messages`, `messaging_postbacks`

## Email Forwarding Setup
Configure your email provider to forward inbound emails to:
```
https://dentalcrm-beta.vercel.app/api/webhooks/email
```

### Termii SMS Setup
- **API Key**: Set in Vercel env vars as TERMII_API_KEY
- **Sender ID**: Set in Vercel env vars as TERMII_SENDER_ID
- **Inbound SMS URL**: `https://dentalcrm-beta.vercel.app/api/webhooks/sms`

## Environment Variables (Vercel)
```
DATABASE_URL=postgresql://...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
FACEBOOK_PAGE_ID=...
FB_VERIFY_TOKEN=...
INSTAGRAM_BUSINESS_ACCOUNT_ID=...
TERMII_API_KEY=...
TERMII_SENDER_ID=SSVCRM
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@glopresc.com
SMTP_PASS=...
OPENAI_API_KEY=...
JWT_SECRET=...
```

## Industry Configuration
- **Industry slug**: `healthcare`
- **Landing page**: Dental-focused hero, features, and CTAs
- **Knowledge base**: 30 dental articles
- **Demo customers**: Nigerian dental clinics
