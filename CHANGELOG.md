# Changelog

All notable changes to ProDrones Hub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2026-02-15

#### Complete Organization CRUD System

- **Organization Service Layer** (`src/modules/organizations/services/organization-service.ts`)
  - `getOrganizationById(id)` - Get single organization with all metadata
  - `getAllOrganizations()` - List all organizations with job/contact counts
  - `createOrganization(input)` - Create organization with metadata
  - `updateOrganization(id, input)` - Update organization and metadata
  - `deleteOrganization(id)` - Delete with job validation

- **API Endpoints** - Complete REST API for organizations
  - `GET /api/organizations` - List all organizations (refactored to use service)
  - `POST /api/organizations` - Create new organization
  - `GET /api/organizations/:id` - Get single organization
  - `PUT /api/organizations/:id` - Update organization
  - `DELETE /api/organizations/:id` - Delete organization with job check

- **Validation Schemas** (`src/modules/organizations/schemas/organization-schemas.ts`)
  - `createOrganizationSchema` - Name (required), address, contacts, location
  - `updateOrganizationSchema` - Partial update, at least one field required
  - `organizationMetaSchema` - Meta key-value validation

- **TypeScript Types** (`src/modules/organizations/types.ts`)
  - `Organization` interface with all metadata fields
  - `OrganizationMeta` interface for EAV pattern
  - `OrganizationWithMeta` for enriched responses

- **Metadata Support** - Full EAV (Entity-Attribute-Value) pattern
  - address, streetAddress, city, state, zipCode
  - logo URL support
  - contacts array (JSON stored)
  - Automatic contact/job count aggregation

- **Security Features**
  - Cannot delete organizations with associated jobs
  - All endpoints require authentication
  - Comprehensive validation on all inputs
  - Metadata cleanup on delete

- **Documentation** (`ORGANIZATION-CRUD.md`)
  - Complete API reference with examples
  - cURL test commands
  - Testing checklist
  - Frontend integration guide
  - Error handling documentation

### Added - 2026-02-15 (Earlier)

#### Authentication System
- **User Registration Flow** (`/auth/register`)
  - Open registration with email, password, first name, last name
  - Automatic login after successful registration
  - Redirects to dashboard on success
  - Bcrypt password hashing (cost 11)
  - Assigned REGISTERED role (ID: 3) by default

- **Forgot Password Flow** (`/auth/forgot-password`)
  - Email-based password reset request
  - Generates secure 50-character reset tokens
  - 24-hour token expiry
  - Rate limiting: 3 attempts per 15 minutes
  - Email enumeration prevention (always returns success)
  - Sends professional reset email with clickable link

- **Reset Password Flow** (`/auth/reset-password`)
  - Token-based password reset
  - Password confirmation validation
  - Automatic token cleanup after use
  - Sends password change confirmation email
  - Auto-login after successful reset
  - Redirects to dashboard

- **2FA Email Integration Fix**
  - Fixed missing email sending in login flow
  - Now sends 6-digit verification code via email
  - Uses existing `2fa-code` template
  - 5-minute code expiry

#### API Endpoints
- `POST /api/auth/register` - User registration endpoint
- `POST /api/auth/forgot-password` - Password reset request endpoint
- `POST /api/auth/reset-password` - Password reset completion endpoint

#### Email Templates
- **password-changed.tsx** - Password change confirmation email
  - Shows timestamp and IP address of change
  - Security warning if not initiated by user
  - Security recommendations list
  - Professional styling with alert box

#### Security Features
- **Rate Limiter Utility** (`src/lib/utils/rate-limiter.ts`)
  - In-memory rate limiting with automatic cleanup
  - Configurable attempts and time window
  - Used for forgot password endpoint (3/15min)
  - Supports getting remaining attempts and reset time

#### UI Components
- **Register Page** - Professional registration form matching login style
  - First name and last name fields
  - Email validation
  - Password strength requirements (min 8 chars)
  - Link to login page
  - Theme selector integration

- **Forgot Password Page** - Clean password recovery interface
  - Email input with validation
  - Success state with redirect countdown
  - Link back to login
  - Professional messaging

- **Reset Password Page** - Secure password reset form
  - URL token parameter handling
  - New password input
  - Confirm password validation
  - Token expiry detection
  - Link to request new reset

#### Updated Components
- **Login Page Updates**
  - Added "Forgot password?" link → `/auth/forgot-password`
  - Added "Create account" link → `/auth/register`
  - Improved footer layout with both links

#### Configuration
- Added `NEXT_PUBLIC_APP_URL` to environment variables
  - Required for email reset links
  - Documented in `.env.example`
  - Used in forgot password flow

#### Schema Updates
- Updated `registerSchema` to make token optional (open registration)

#### Email System Enhancements
- Registered `password-changed` template in template engine
- Added template type to TypeScript definitions
- Added subject line: "Password Changed - ProDrones Hub"

### Changed

- **Authentication Service** (`src/modules/auth/services/auth-service.ts`)
  - Added `register()` function with auto-login
  - Added `forgotPassword()` function with email sending
  - Added `resetPassword()` function with confirmation email
  - Fixed `login()` to send 2FA codes via email
  - Integrated email service across all auth flows

### Security

- ✅ **Bcrypt Password Hashing** - Cost factor 11 (matches PHP implementation)
- ✅ **Email Enumeration Prevention** - Forgot password always returns success
- ✅ **Rate Limiting** - Prevents brute force on password reset
- ✅ **Token Expiry** - All tokens expire automatically
- ✅ **Token Cleanup** - Removes used/expired tokens
- ✅ **Password Requirements** - Minimum 8 characters enforced
- ✅ **Secure Sessions** - AES-256-CBC encrypted cookies

### Developer Experience

- Updated README.md with comprehensive documentation
- Added authentication flow diagrams
- Added API endpoint documentation
- Added troubleshooting guide
- Added project structure overview
- Created CHANGELOG.md for version tracking

### Files Created (8)

1. `src/app/api/auth/register/route.ts` - Registration API endpoint
2. `src/app/api/auth/forgot-password/route.ts` - Forgot password API endpoint
3. `src/app/api/auth/reset-password/route.ts` - Reset password API endpoint
4. `src/app/auth/register/page.tsx` - Registration page UI
5. `src/app/auth/forgot-password/page.tsx` - Forgot password page UI
6. `src/app/auth/reset-password/page.tsx` - Reset password page UI
7. `src/modules/email/templates/auth/password-changed.tsx` - Email template
8. `src/lib/utils/rate-limiter.ts` - Rate limiting utility

### Files Modified (6)

1. `src/modules/auth/services/auth-service.ts` - Added 3 new service functions + email integration
2. `src/modules/auth/schemas/auth-schemas.ts` - Made token optional for open registration
3. `src/modules/email/types.ts` - Added password-changed template type
4. `src/modules/email/templates/template-engine.ts` - Registered new template
5. `src/app/auth/login/page.tsx` - Added registration and forgot password links
6. `.env.example` - Added NEXT_PUBLIC_APP_URL configuration

## [5.0.0] - 2026-02-13

### Added
- Complete platform rebuild with Next.js 16
- Custom authentication system with encrypted sessions
- Multi-provider email system (Ethereal, Resend, SendGrid)
- Professional email templates with React Email
- Bulk operations and chunked upload system
- Interactive map viewers (Leaflet integration)
- Workflow management with pipeline tracking
- Role-based access control (RBAC)
- Database migration to Drizzle ORM
- Modern UI with shadcn/ui components
- Dark mode support
- TypeScript throughout

### Changed
- Migrated from PHP to Next.js/TypeScript
- Database schema optimized for V5
- Email system completely rewritten
- Session management modernized
- Upload system rebuilt with chunking

### Removed
- Legacy PHP codebase
- Old authentication system
- PHPMailer dependency
- Legacy file upload handlers

---

## Previous Versions

### [4.x] - Legacy PHP Version
- PHP-based application
- WordPress-style architecture
- PHPMailer for emails
- Session-based authentication

---

## Legend

- `Added` - New features
- `Changed` - Changes to existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements
