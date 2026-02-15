# 📧 ProDrones Hub - Email System Documentation

Complete email system with professional templates, multi-provider support, and automatic logging.

## 🎯 Features

- ✅ **Multi-provider**: Ethereal (dev), Resend (prod), SendGrid, Console
- ✅ **React Email Templates**: Professional, responsive HTML emails
- ✅ **Automatic Logging**: All emails recorded in database
- ✅ **Type-safe**: TypeScript with Zod validation
- ✅ **Easy Provider Switching**: Change with one environment variable
- ✅ **Professional English Templates**: All emails in English

---

## 📁 Architecture

```
src/modules/email/
├── types.ts                          # TypeScript types
├── index.ts                          # Public exports
├── schemas/
│   └── email-schemas.ts             # Zod validation
├── services/
│   ├── email-service.ts             # Main service
│   └── providers/
│       ├── console-provider.ts      # Dev: console.log only
│       ├── ethereal-provider.ts     # Dev: test emails
│       ├── resend-provider.ts       # Prod: Resend API
│       └── sendgrid-provider.ts     # Prod: SendGrid API
└── templates/
    ├── base-layout.tsx              # Base layout with branding
    ├── template-engine.ts           # React → HTML rendering
    ├── auth/
    │   ├── 2fa-code.tsx            # 2FA code
    │   ├── reset-password.tsx      # Password reset
    │   └── signup-confirmation.tsx # Signup confirmation
    └── workflow/
        ├── pilot-notification.tsx   # Pilot notifications
        ├── delivery-notification.tsx # Delivery notifications
        └── job-status-update.tsx    # Status updates
```

---

## ⚙️ Configuration

### 1. Environment Variables

Add to your `.env` or `.env.local`:

```bash
# Email System
EMAIL_PROVIDER=ethereal              # ethereal | resend | sendgrid | console
EMAIL_FROM=noreply@prodrones.com     # Sender email address
EMAIL_FROM_NAME=ProDrones Hub        # Sender name

# Resend (Production) - Get key from https://resend.com
RESEND_API_KEY=re_xxxxxxxxxxxxx

# SendGrid (Alternative) - Get key from https://sendgrid.com
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

### 2. Database Migration

Run the migration to create the `Email_Log` table:

```bash
npm run db:migrate:email
```

Or manually:
```bash
mysql -u root -p -P 3309 prodrones_application < migrations/add-email-log-table.sql
```

### 3. Dependencies

Already installed:
- ✅ `nodemailer` - For Ethereal
- ✅ `resend` - For Resend
- ✅ `@sendgrid/mail` - For SendGrid
- ✅ `@react-email/components` - For templates

---

## 🚀 Usage

### Send Simple Email

```typescript
import { emailService } from "@/modules/email";

const result = await emailService.send({
  to: {
    email: "user@example.com",
    name: "John Doe",
  },
  subject: "Hello from ProDrones",
  html: "<h1>Hello!</h1><p>This is a test email.</p>",
  text: "Hello! This is a test email.",
});

if (result.success) {
  console.log("Email sent:", result.messageId);
  if (result.previewUrl) {
    console.log("Preview:", result.previewUrl); // Ethereal only
  }
} else {
  console.error("Error:", result.error);
}
```

### Send Template Email

```typescript
import { emailService } from "@/modules/email";

// 2FA Code
await emailService.sendTemplate({
  to: { email: "user@example.com", name: "John" },
  template: "2fa-code",
  data: {
    code: "123456",
    userName: "John",
    expiresInMinutes: 10,
  },
});

// Password Reset
await emailService.sendTemplate({
  to: { email: "user@example.com", name: "Mary" },
  template: "reset-password",
  data: {
    userName: "Mary",
    resetLink: "https://prodrones.com/reset?token=abc",
    expiresInHours: 24,
  },
});

// Pilot Notification
await emailService.sendTemplate({
  to: { email: "pilot@example.com", name: "Carlos" },
  template: "pilot-notification",
  data: {
    pilotName: "Carlos",
    jobId: 123,
    jobTitle: "Industrial Site Mapping",
    clientName: "XYZ Construction",
    scheduledDate: "2026-02-20 10:00 AM",
    action: "assigned", // assigned | scheduled | rescheduled | cancelled
  },
});

// Delivery Notification
await emailService.sendTemplate({
  to: { email: "client@example.com", name: "Client" },
  template: "delivery-notification",
  data: {
    clientName: "Client",
    jobId: 456,
    jobTitle: "Orthomosaic",
    deliveryDate: "2026-02-15 14:30",
    downloadLink: "https://prodrones.com/download/xyz",
  },
});
```

---

## 🧪 Testing

### Option 1: Browser Test Endpoint

1. Start dev server:
```bash
npm run dev
```

2. Visit test endpoint:
```
http://localhost:3005/api/test-email
```

This sends 8 test emails using all templates.

3. View preview:
```
http://localhost:3005/api/emails/preview
```

### Option 2: Test Script

```bash
npm run test:email
```

**Note:** The script may have connection issues outside Next.js context. Use the browser endpoint instead.

---

## 🌐 Email Providers

### Console Provider (Local Development)

Only logs emails to console. Useful for quick development.

```bash
EMAIL_PROVIDER=console
```

**Pros:**
- ✅ No setup required
- ✅ Instant feedback
- ✅ No external dependencies

**Cons:**
- ❌ Can't see HTML rendering
- ❌ No actual email delivery

### Ethereal Provider (Development Testing)

Creates real test emails that you can view in a web interface, but doesn't send to actual recipients.

```bash
EMAIL_PROVIDER=ethereal
```

**Pros:**
- ✅ Free
- ✅ No API key required
- ✅ Generates preview URLs
- ✅ Perfect for testing HTML rendering

**How it works:**
1. Automatically creates a test account at Ethereal
2. Prints credentials in console
3. Generates preview URLs for each email
4. Visit the URL to see the rendered email

### Resend Provider (Production - Recommended)

Modern, easy-to-use email service.

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Free Tier:**
- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ✅ Modern API
- ✅ Dashboard with analytics

**Setup:**
1. Create account at [resend.com](https://resend.com)
2. Verify your domain
3. Get your API key
4. Add `RESEND_API_KEY` to `.env`

### SendGrid Provider (Alternative Production)

Robust alternative for production.

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

**Free Tier:**
- ✅ 100 emails/day
- ✅ Very reliable
- ✅ Enterprise features

---

## 🔄 Switching Providers

Simply change the `EMAIL_PROVIDER` environment variable:

```bash
# Local development
EMAIL_PROVIDER=console

# Testing with preview
EMAIL_PROVIDER=ethereal

# Production
EMAIL_PROVIDER=resend
```

**No code changes required.** The system automatically loads the correct provider.

---

## 🚀 Production Deployment

### Step 1: Choose Your Provider

**Recommended: Resend**
- Modern API
- Good free tier (3,000 emails/month)
- Easy domain verification
- Great developer experience

**Alternative: SendGrid**
- More established
- Enterprise-grade reliability
- Lower free tier (100/day)
- More complex setup

### Step 2: Domain Setup

#### For Resend:

1. **Sign up** at [resend.com](https://resend.com)
2. **Add your domain** (e.g., `prodrones.com`)
3. **Add DNS records** provided by Resend:
   ```
   TXT record: _resend.prodrones.com
   MX record (optional for better deliverability)
   ```
4. **Wait for verification** (usually < 1 hour)
5. **Get API key** from dashboard

#### For SendGrid:

1. **Sign up** at [sendgrid.com](https://sendgrid.com)
2. **Verify sender identity** (single email or domain)
3. **For domain authentication:**
   - Add CNAME records to your DNS
   - Add SPF and DKIM records
4. **Create API key** with "Mail Send" permissions

### Step 3: Environment Variables

**Production `.env`:**

```bash
# Email System - PRODUCTION
EMAIL_PROVIDER=resend
EMAIL_FROM=noreply@prodrones.com      # Must match verified domain
EMAIL_FROM_NAME=ProDrones Hub

# Resend Production Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx  # Keep this secret!

# Database
DATABASE_URL=mysql://user:pass@host:port/prodrones_application
```

**Important:**
- ✅ Use environment-specific `.env` files (`.env.production`, `.env.staging`)
- ✅ Never commit API keys to git
- ✅ Use secrets management in your deployment platform (Vercel, AWS, etc.)
- ✅ Verify domain before going live

### Step 4: Database Migration

Ensure the `Email_Log` table exists in production:

```bash
# On your production database
mysql -u user -p -h production-host -P port prodrones_application < migrations/add-email-log-table.sql
```

Or use your ORM migration tool.

### Step 5: Testing in Production

1. **Deploy your application** with updated environment variables
2. **Send a test email** using the test endpoint:
   ```
   https://your-production-domain.com/api/test-email
   ```
3. **Check email delivery** in your inbox
4. **Monitor Email_Log table** for successful sends
5. **Check provider dashboard** for delivery stats

### Step 6: Monitoring

**Email_Log table:**
```sql
-- Check recent emails
SELECT id, status, to_email, subject, created_at, error
FROM Email_Log
ORDER BY created_at DESC
LIMIT 20;

-- Check failures
SELECT * FROM Email_Log WHERE status = 'failed' ORDER BY created_at DESC;

-- Email stats
SELECT
  status,
  provider,
  COUNT(*) as count
FROM Email_Log
GROUP BY status, provider;
```

**Provider dashboards:**
- **Resend**: Check delivery rates, bounces, spam complaints
- **SendGrid**: Similar metrics plus reputation score

### Step 7: Error Handling

The system automatically logs errors in `Email_Log.error` field. Monitor for:
- ❌ Authentication failures (wrong API key)
- ❌ Domain not verified
- ❌ Rate limit exceeded
- ❌ Recipient email bounces
- ❌ Spam complaints

**Set up alerts** for failed emails in production.

---

## 🔐 Security Best Practices

### API Keys
- ✅ Store in environment variables, never in code
- ✅ Use different keys for staging/production
- ✅ Rotate keys periodically
- ✅ Use secrets management (AWS Secrets Manager, etc.)

### Email Content
- ✅ Validate all user input before sending
- ✅ Sanitize HTML to prevent XSS
- ✅ Rate limit email sending per user
- ✅ Implement CAPTCHA for public forms

### Domain Reputation
- ✅ Verify your domain properly (SPF, DKIM, DMARC)
- ✅ Monitor bounce rates and spam complaints
- ✅ Never send unsolicited emails
- ✅ Include unsubscribe links for marketing emails

---

## 📊 Email Logging

All emails are automatically logged to the `Email_Log` table:

```typescript
interface EmailLog {
  id: number;
  provider: "ethereal" | "resend" | "sendgrid" | "console";
  template: string | null;        // Template name or null for raw emails
  toEmail: string;
  toName: string | null;
  fromEmail: string;
  fromName: string | null;
  subject: string;
  status: "pending" | "sent" | "failed";
  messageId: string | null;       // Provider's message ID
  error: string | null;           // Error message if failed
  retryCount: number;
  templateData: any;              // Data used to render template
  metadata: any;                  // Additional context (jobId, userId, etc.)
  previewUrl: string | null;      // Ethereal preview URL
  createdAt: Date;
  sentAt: Date | null;
}
```

**Query examples:**

```sql
-- Failed emails in last 24 hours
SELECT * FROM Email_Log
WHERE status = 'failed'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Emails by template
SELECT template, COUNT(*) as count,
       SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful
FROM Email_Log
GROUP BY template;

-- Delivery rate
SELECT
  (SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as success_rate
FROM Email_Log
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

---

## 🎨 Creating New Templates

### 1. Define Type in `types.ts`

```typescript
export type EmailTemplate =
  | "2fa-code"
  | "reset-password"
  | "my-new-template"; // ← Add here

export interface EmailTemplateData {
  // ...
  "my-new-template": {
    field1: string;
    field2: number;
  };
}
```

### 2. Create Template Component

```tsx
// src/modules/email/templates/my-folder/my-template.tsx
import { Text, Heading } from "@react-email/components";
import { BaseLayout } from "../base-layout";
import type { EmailTemplateData } from "../../types";

type Props = EmailTemplateData["my-new-template"];

export function MyNewTemplateEmail({ field1, field2 }: Props) {
  return (
    <BaseLayout preview="Preview text">
      <Heading style={h1}>Hello</Heading>
      <Text style={text}>{field1}</Text>
      <Text style={text}>{field2}</Text>
    </BaseLayout>
  );
}

const h1 = { color: "#333", fontSize: "24px", fontWeight: "bold" };
const text = { color: "#333", fontSize: "16px", lineHeight: "24px" };
```

### 3. Register in `template-engine.ts`

```typescript
case "my-new-template":
  return (await import("./my-folder/my-template")).MyNewTemplateEmail;
```

### 4. Add Subject in `getSubject()`

```typescript
case "my-new-template":
  return "My Subject - ProDrones Hub";
```

### 5. Use the Template

```typescript
await emailService.sendTemplate({
  to: { email: "test@example.com", name: "Test" },
  template: "my-new-template",
  data: {
    field1: "Hello",
    field2: 123,
  },
});
```

---

## 🔗 Workflow Integration

### Example: Send email when job is approved

```typescript
// src/app/api/workflow/jobs/[id]/approve/route.ts
import { emailService } from "@/modules/email";

export async function POST(request: NextRequest) {
  // ... approve job logic ...

  // Send email to pilot
  if (pilot?.email) {
    await emailService.sendTemplate({
      to: {
        email: pilot.email,
        name: pilot.name,
      },
      template: "pilot-notification",
      data: {
        pilotName: pilot.name,
        jobId: job.id,
        jobTitle: job.title,
        clientName: client.name,
        action: "assigned",
      },
    });
  }

  return NextResponse.json({ success: true });
}
```

### Example: Send delivery notification

```typescript
// src/app/api/workflow/jobs/[id]/deliver/route.ts
import { emailService } from "@/modules/email";

export async function POST(request: NextRequest) {
  // ... delivery logic ...

  if (client?.email) {
    await emailService.sendTemplate({
      to: {
        email: client.email,
        name: client.name,
      },
      template: "delivery-notification",
      data: {
        clientName: client.name,
        jobId: job.id,
        jobTitle: job.title,
        deliveryDate: new Date().toISOString(),
        downloadLink: `https://prodrones.com/download/${deliveryId}`,
      },
    });
  }

  return NextResponse.json({ success: true });
}
```

---

## 🎨 Branding

ProDrones brand color (`#8600FB`) is configured in:
- `base-layout.tsx` - Header background
- All template buttons
- Status badges

To change colors, edit inline styles in each template.

---

## ❓ FAQ

**Q: Can I use custom HTML without templates?**
A: Yes, use `emailService.send()` with `html` and `text` fields.

**Q: How do I test locally without sending real emails?**
A: Use `EMAIL_PROVIDER=console` or `EMAIL_PROVIDER=ethereal`.

**Q: Are emails sent asynchronously?**
A: No, they're synchronous. For bulk sending, consider using a queue (Bull, BullMQ).

**Q: Can I attach files?**
A: Yes, use the `attachments` field in `emailService.send()`.

**Q: How do I see sent emails?**
A: Check the `Email_Log` table in the database or visit `/api/emails/preview`.

**Q: What if email sending fails?**
A: The error is logged in `Email_Log.error`. The system doesn't retry automatically - implement retry logic if needed.

**Q: How do I unsubscribe users from emails?**
A: Not implemented yet. Add an `unsubscribed` flag to user table and check before sending.

**Q: Can I schedule emails for later?**
A: Not built-in. Use a job queue system or cron job.

---

## 🐛 Troubleshooting

### "ECONNREFUSED" error
- **Cause**: Database not running or wrong port
- **Fix**: Check MySQL is running on port 3309

### "Invalid API key" error
- **Cause**: Wrong or missing `RESEND_API_KEY` or `SENDGRID_API_KEY`
- **Fix**: Verify API key in `.env` and check provider dashboard

### "Domain not verified" error
- **Cause**: Sending from unverified domain
- **Fix**: Complete domain verification in Resend/SendGrid

### Emails not arriving
- **Check**:
  1. `Email_Log` table - is status "sent"?
  2. Provider dashboard - any bounces/errors?
  3. Recipient spam folder
  4. Domain SPF/DKIM records configured correctly

### Template not rendering
- **Cause**: Template data mismatch
- **Fix**: Check console for errors, verify data matches type definition

---

## 📈 Performance Tips

### For bulk sending:
- Use a queue system (Bull, BullMQ)
- Batch emails in groups of 100
- Add delays to avoid rate limits
- Monitor provider rate limits

### Database optimization:
- Index `Email_Log.created_at` for faster queries
- Archive old emails periodically (> 90 days)
- Consider separate logging table for high volume

### Email optimization:
- Keep HTML size < 100KB
- Optimize images
- Use CDN for assets
- Test on multiple email clients

---

## 🎯 Next Steps

- [ ] Integrate with NextAuth for automatic 2FA emails
- [ ] Add email queue system for bulk sending
- [ ] Create dashboard for email statistics
- [ ] Implement retry logic for failed emails
- [ ] Add more templates as needed
- [ ] Set up monitoring/alerts for production
- [ ] Add email preference management
- [ ] Implement unsubscribe functionality

---

## 📚 Resources

- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com)
- [React Email Documentation](https://react.email)
- [Nodemailer Documentation](https://nodemailer.com)

---

✅ **System is production-ready!**

For any questions or issues, check the code in `src/modules/email/` or run `npm run test:email` to test the system.
