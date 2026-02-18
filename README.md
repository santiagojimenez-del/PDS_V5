# ProDrones Hub V5

Professional drone services management platform built with Next.js 16, TypeScript, and modern web technologies.

## 🚀 Features

### Authentication System
- ✅ **User Registration** - Open registration with email verification
- ✅ **Login & Logout** - Secure cookie-based session management
- ✅ **Two-Factor Authentication (2FA)** - Email-based verification codes
- ✅ **Password Recovery** - Forgot password flow with email reset links
- ✅ **Password Reset** - Secure token-based password reset
- ✅ **Session Management** - AES-256-CBC encrypted sessions (30-day expiry)
- ✅ **Role-Based Access Control** - Granular permissions system

### Email System
- ✅ **Multi-Provider Support** - Ethereal (dev), Resend, SendGrid
- ✅ **Professional Templates** - 7+ React-based email templates
- ✅ **Email Logging** - Full audit trail in database
- ✅ **Template Engine** - Type-safe template rendering

### Security Features
- 🔒 **Password Hashing** - Bcrypt (cost 11)
- 🔒 **Rate Limiting** - Protects against brute force attacks
- 🔒 **Email Enumeration Prevention** - Security-first design
- 🔒 **Token Expiry** - Automatic cleanup of expired tokens
- 🔒 **CSRF Protection** - Built-in Next.js security

### Map Viewers
- ✅ **Interactive Viewers** - Three specialized viewers: Landscape, Construct, Community
- ✅ **Unified Control Panel** - Tabbed interface for Views and Layers
- ✅ **Saved Views** - Bookmark and return to specific map positions
- ✅ **Classification System** - Color-coded polygon categories
- ✅ **Drawing Tools** - Polygon and rectangle drawing with Leaflet
- ✅ **Tileset Overlay** - Toggle aerial imagery on/off
- ✅ **Persistent Storage** - All drawings and classifications auto-save

### Job Management & Workflow
- ✅ **Complete Job Management** - CRUD operations, detail pages, edit dialogs
- ✅ **Job Pipeline** - Bids → Scheduled → Processing → Billing → Completed
- ✅ **Workflow Actions** - Approve, schedule, log flight, deliver, bill
- ✅ **Bulk Operations** - Mass actions on multiple jobs
- ✅ **Job Assignment** - Multi-pilot/staff assignment with validation

### Pilot Scheduling System (70% Complete)
- ✅ **Availability Management** - Weekly recurring schedules per pilot
- ✅ **Blackout Dates** - Vacation/PTO tracking
- ✅ **Conflict Detection** - Real-time double-booking prevention
- ✅ **Smart Assignments** - AI-powered pilot suggestions with scoring
- ✅ **Email Notifications** - Auto-notify pilots when assigned
- ✅ **Calendar Views** - Visual weekly schedules
- ✅ **Workload Balancing** - Distribute jobs evenly across team

### Billing System (60% Complete)
- ✅ **Invoice Generation** - Auto-numbered invoices (INV-YYYY-NNNN)
- ✅ **Multi-Line Items** - Detailed billing with quantity × unit price
- ✅ **Tax Calculation** - Configurable per-invoice tax rates
- ✅ **Payment Tracking** - Record partial and full payments
- ✅ **Status Workflow** - Draft → Sent → Paid/Overdue lifecycle
- ✅ **Financial Dashboard** - Real-time billing statistics
- 🚧 **PDF Generation** - Coming soon
- 🚧 **Payment Gateway** - Stripe integration planned

### Analytics & Reporting
- ✅ **Hub Dashboard** - KPIs, pipeline visualization, growth tracking
- ✅ **Client Dashboard** - Project status overview, completion metrics
- ✅ **Data Export** - CSV export for jobs and sites
- ✅ **System Health Monitor** - Database, API, email status
- ✅ **Audit Log Viewer** - Complete activity tracking

### Search & Navigation
- ✅ **Global Search** - Command Palette (Ctrl+K) across all entities
- ✅ **Keyboard Shortcuts** - G+H/J/S/T navigation, ? for help
- ✅ **Recent Items** - Track last 10 viewed items

### Other Features
- 📦 **Bulk File Upload** - Chunked upload for large geospatial files
- 🗺️ **Interactive Map Viewers** - Leaflet-based visualization
- 📧 **Email Notifications** - Automated workflow alerts

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router) with Turbopack
- **Language:** TypeScript
- **Database:** MySQL with Drizzle ORM
- **Authentication:** Custom cookie-based sessions
- **Email:** React Email with multi-provider support
- **UI Components:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod validation
- **State Management:** React Server Components
- **Maps:** Leaflet.js for interactive viewers
- **Icons:** Tabler Icons

## 📋 Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm/yarn/pnpm/bun

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd prodrones-hub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Database
DATABASE_URL=mysql://root:password@localhost:3309/prodrones_application

# Encryption (REQUIRED - must be exactly 32 characters)
AES_KEY=your-32-character-encryption-key

# App
NODE_ENV=development
PORT=3003
NEXT_PUBLIC_APP_URL=http://localhost:3003

# Email System
EMAIL_PROVIDER=ethereal              # Options: ethereal, resend, sendgrid, console
EMAIL_FROM=noreply@prodrones.com
EMAIL_FROM_NAME=ProDrones Hub

# Production Email Providers (optional)
RESEND_API_KEY=re_xxxxxxxxxxxxx     # Get from https://resend.com
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx   # Get from https://sendgrid.com
```

### 4. Set up the database

```bash
# Start MySQL with Docker (optional)
docker-compose up -d

# The application will auto-create tables on first run
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3003](http://localhost:3003) in your browser.

## 📁 Project Structure

```
prodrones-hub/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   └── auth/             # Authentication endpoints
│   │   ├── auth/                 # Auth pages (login, register, etc.)
│   │   ├── dashboard/            # Protected dashboard
│   │   └── layout.tsx            # Root layout
│   │
│   ├── modules/                  # Feature modules
│   │   ├── auth/                 # Authentication module
│   │   │   ├── services/         # Business logic
│   │   │   ├── schemas/          # Zod validation
│   │   │   └── types.ts          # TypeScript types
│   │   │
│   │   ├── email/                # Email module
│   │   │   ├── services/         # Email service & providers
│   │   │   ├── templates/        # React email templates
│   │   │   └── types.ts          # Email types
│   │   │
│   │   ├── upload/               # File upload module
│   │   └── viewers/              # Map viewers module
│   │
│   ├── lib/                      # Shared utilities
│   │   ├── db/                   # Database & ORM
│   │   ├── auth/                 # Auth utilities (crypto, sessions)
│   │   └── utils/                # General utilities
│   │
│   └── components/               # React components
│       └── ui/                   # shadcn/ui components
│
├── public/                       # Static assets
└── uploads/                      # File uploads (temp & final)
```

## 🔐 Authentication Flow

### Registration
1. User visits `/auth/register`
2. Fills form: email, password, first name, last name
3. Server validates, hashes password (bcrypt), creates user
4. Auto-login → redirect to `/dashboard`

### Login
1. User visits `/auth/login`
2. Enters email and password
3. If 2FA enabled → sends 6-digit code via email
4. User enters code → creates session → redirect to dashboard

### Forgot Password
1. User visits `/auth/forgot-password`
2. Enters email address
3. Receives password reset link (valid 24 hours)
4. Rate limited: 3 attempts per 15 minutes

### Reset Password
1. User clicks reset link from email
2. Enters new password + confirmation
3. Server validates token, updates password
4. Sends confirmation email
5. Auto-login → redirect to `/dashboard`

## 📧 Email Templates

The system includes 7 professional email templates:

1. **2fa-code** - Two-factor authentication codes
2. **reset-password** - Password reset links
3. **password-changed** - Password change confirmations
4. **signup-confirmation** - Welcome emails (optional)
5. **pilot-notification** - Job assignments for pilots
6. **delivery-notification** - Delivery completed alerts
7. **job-status-update** - Workflow status changes

All templates are built with React Email and support:
- Responsive design
- Dark/light mode compatible
- Professional branding
- Type-safe data binding

## 🗄️ Database Schema

### Users Table
- `ID` - Auto-increment primary key
- `Email` - Unique user email
- `Password` - Bcrypt hashed password
- `Tokens` - JSON array of session/verification tokens

### User_Meta Table
- `UID` - Foreign key to Users
- `meta_key` - Metadata key (first_name, last_name, roles, etc.)
- `meta_value` - Metadata value

### Email_Log Table
- Tracks all sent emails
- Stores template data, status, provider
- Includes preview URLs for development

## 🚢 Deployment

### Build for production

```bash
npm run build
npm start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Use production email provider (Resend or SendGrid)
3. Configure production database
4. Set secure `AES_KEY` (32 random characters)
5. Update `NEXT_PUBLIC_APP_URL` to production domain

### Recommended: Vercel Deployment

```bash
vercel deploy
```

Configure environment variables in Vercel dashboard.

## 🧪 Testing

### Test Email System (Development)

Using Ethereal (fake SMTP):
```bash
EMAIL_PROVIDER=ethereal
```

Check console for preview URLs when emails are sent.

### Test Authentication Flows

1. **Registration:** Visit `/auth/register`
2. **Login:** Visit `/auth/login`
3. **2FA:** Set `two_factor_required: true` in User_Meta
4. **Password Reset:** Visit `/auth/forgot-password`

## 📝 API Documentation

### Authentication Endpoints

#### `POST /api/auth/register`
Register new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "roles": [3],
      "permissions": [],
      "twoFactorRequired": false
    }
  }
}
```

#### `POST /api/auth/login`
Authenticate user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (No 2FA):**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

**Response (2FA Required):**
```json
{
  "success": true,
  "data": {
    "requires2FA": true,
    "verificationToken": "abc123..."
  }
}
```

#### `POST /api/auth/forgot-password`
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "If an account exists with this email, you will receive a password reset link."
  }
}
```

#### `POST /api/auth/reset-password`
Reset password with token.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

### Viewer Endpoints

#### `GET /api/viewer/[jobProductId]`
Fetch viewer data including job, site, tileset, and deliverables.

**Response:**
```json
{
  "success": true,
  "data": {
    "job": { "id": 5, "name": "Project Name" },
    "site": { "id": 1, "name": "Site Name", "coordinates": [27.0, -81.8] },
    "product": { "id": 1, "name": "Landscape Viewer" },
    "tileset": { "id": 1, "path": "tileset/path" },
    "deliverables": {
      "features": "{...}",
      "classifications": "[...]",
      "saved_views": "[...]"
    }
  }
}
```

## 🔧 Common Issues

### AES_KEY Error
**Problem:** `AES_KEY must be exactly 32 characters`

**Solution:** Generate a secure 32-character key:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Database Connection Error
**Problem:** Cannot connect to MySQL

**Solution:**
1. Check MySQL is running
2. Verify `DATABASE_URL` in `.env.local`
3. Ensure database exists

### Email Not Sending
**Problem:** Emails not being delivered

**Solution:**
1. Check `EMAIL_PROVIDER` setting
2. Verify API keys (if using Resend/SendGrid)
3. Use `console` provider for debugging
4. Check `Email_Log` table for errors

## 📄 License

Proprietary - Professional Drone Solutions

## 🤝 Contributing

Internal project - Contact admin for contribution guidelines.

## 📞 Support

For support, contact: support@prodrones.com

---

Built with ❤️ by the ProDrones Team
