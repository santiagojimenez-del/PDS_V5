# ProDrones Hub V5 — Demo Guide

> Complete guide to demonstrate the platform step by step.
> Local server: **http://localhost:3005**

---

## Index

1. [Platform Architecture](#1-architecture)
2. [Access and Roles](#2-access-and-roles)
3. [Hub Portal — Staff / Admin / Pilot](#3-hub-portal)
4. [Client Portal — Clients](#4-client-portal)
5. [Admin Panel — Administration](#5-admin-panel)
6. [Public Viewers](#6-public-viewers)
7. [Complete Job Workflow](#7-complete-job-workflow)
8. [Quick Reference URLs](#8-quick-reference-urls)

---

## 1. Architecture

The platform has **three portals** running on the same server with separate contexts. The portal is selected by:

| Method | Hub | Client | Admin |
|--------|-----|--------|-------|
| Query param | `?app=hub` | `?app=client` | `?app=admin` |
| Subdomain | `hub.localhost:3005` | `client.localhost:3005` | `admin.localhost:3005` |
| Default | ✅ (no param) | — | — |

**User roles (numeric in DB):**

| Number | Name | Main Portal |
|--------|------|-------------|
| 0 | Admin | Hub + Admin |
| 1 | Client | Client |
| 3 | Registered | Client |
| 4 | Developer | Hub + Admin |
| 5 | Staff | Hub |
| 6 | Pilot | Hub |
| 7 | Manager | Hub |

---

## 2. Access and Roles

### 2.1 Register and Login

**URL:** `http://localhost:3005/login`

1. Go to `/login`
2. Enter email and password
3. If the user has **2FA enabled**, a TOTP code will be required
4. The system automatically redirects based on role:
   - Client → `/sites`
   - Staff / Admin / Pilot / Manager → `/workflow/jobs`

**Demo credentials (local DB):**
```
Admin:   (use admin account in prodrones_application)
Client:  (use account with role 1 or 3)
Pilot:   (use account with role 6)
```

### 2.2 New User Registration

**URL:** `http://localhost:3005/register`

- Fill in name, email and password
- Default role is `Registered (3)` — an Admin must assign additional roles

### 2.3 Password Recovery

**URL:** `http://localhost:3005/forgot-password`

- Enter the email address
- The system sends a reset link (in dev uses Ethereal — check the server console for the preview URL)

---

## 3. Hub Portal

> Access: users with roles Admin (0), Manager (7), Staff (5), Pilot (6), Developer (4)
> Base URL: `http://localhost:3005` (default) or `http://localhost:3005?app=hub`

### 3.1 Main Dashboard

**URL:** `http://localhost:3005/`

Shows:
- Job count by pipeline (Bids, Scheduled, Processing, Bill, Completed)
- Recent activity
- Quick access to modules

---

### 3.2 Workflow Module — Jobs

#### View all jobs
**URL:** `http://localhost:3005/workflow/jobs`

- List of all jobs with their current pipeline status
- Filters by pipeline, search by name
- **New Job** button → creates a new job
- Multiple selection for batch actions (approve, schedule, etc.)

#### Create a new job
**URL:** `http://localhost:3005/workflow/jobs/new`

Steps:
1. Enter **job name**
2. Select **site**
3. Select **proposed flight date**
4. Check the required **products** (Landscape, Community, Construct)
5. Add optional **notes**
6. Enter **amount payable**
7. Click **Create Job** → redirects to the job detail

#### Job detail
**URL:** `http://localhost:3005/workflow/jobs/{id}`

Shows:
- Job information (site, client, dates, amount)
- Current pipeline with action buttons based on status:
  - **Bids** → Approve button (sets approved flight date)
  - **Scheduled** → Schedule button (assigns date + pilots/staff)
  - **Processing/Deliver** → Log Flight button (records completed flight)
  - **Bill** → Deliver + Bill button (generates invoice)
  - **Completed** → job finished
- **Products** section with share button per product
- Change history

#### Batch actions
In the jobs list, select multiple jobs with the checkbox and use the action buttons in the top bar to:
- Approve multiple jobs at once
- Schedule multiple jobs
- Etc.

---

### 3.3 Workflow Module — Sites

**URL:** `http://localhost:3005/workflow/sites`

- List of all sites with address and associated client
- **New Site** button to add
- Click on a site → detail with associated jobs

---

### 3.4 Workflow Module — Recurring Jobs

**URL:** `http://localhost:3005/workflow/recurring`

Templates for recurring jobs.

#### Create a template
1. Click **New Template**
2. Name, site and client
3. Choose type:
   - **Automatic**: configure frequency (daily/weekly/monthly/yearly), days and date range
   - **Manual**: toggle "Manual trigger" on — no automatic schedule
4. Timezone and window days
5. Amount and notes
6. **Create Template**

#### Generate occurrences
- ⚡ (lightning) button on each template → generates the next occurrences
  - Automatic template: generates according to RRULE up to the window days
  - Manual template: creates ONE occurrence at the current moment (on-demand)
- Occurrences appear as "planned" and can be converted into real jobs

#### Other controls per template
- 🔌 Toggle active/inactive
- ✏️ Edit
- 🗑️ Delete (only if no jobs have been created)

---

### 3.5 Billing Module

**URL:** `http://localhost:3005/billing`

Dashboard with:
- Total billed, pending payment, overdue
- Invoice list with status (Draft, Sent, Paid, Overdue, Cancelled)

#### Create invoice
**URL:** `http://localhost:3005/billing/invoices/new`

1. Select associated job
2. Invoice number
3. Issue date and due date
4. Items (description, quantity, price)
5. **Create Invoice**

#### Invoice detail
**URL:** `http://localhost:3005/billing/invoices/{id}`

- View/edit items
- Record payment (date, amount, method)
- **Download PDF** → generates the invoice PDF
- Change status (Draft → Sent → Paid)

---

### 3.6 Scheduling Module — Pilots

**URL:** `http://localhost:3005/scheduling/pilots`

List of all users with role Pilot (6) or Staff (5).

#### Configure pilot availability
**URL:** `http://localhost:3005/scheduling/pilots/{id}`

1. **Availability** — mark which days of the week they are available (Monday–Sunday)
2. **Blackout Dates** — add unavailability periods (vacations, etc.)

#### My Schedule (for pilots/staff)
**URL:** `http://localhost:3005/scheduling/my-schedule`

The pilot/staff views their own assignments and availability.

#### Smart Pilot Assignment
When scheduling a job (Schedule dialog), the system shows **pilot suggestions** with an automatic score based on:
- Day of the week availability
- Blackout dates
- Weekly/monthly workload
- Double booking conflicts

---

### 3.7 Onboarding Module — Clients and Organizations

#### Contacts
**URL:** `http://localhost:3005/onboard/contact`
**URL:** `http://localhost:3005/onboard/contact/manage`

Management of individual contacts.

#### Organizations/Companies
**URL:** `http://localhost:3005/onboard/company`
**URL:** `http://localhost:3005/onboard/company/manage`
**URL:** `http://localhost:3005/onboard/company/manage/{id}`

Management of client companies with complete data.

---

### 3.8 Tilesets Module

**URL:** `http://localhost:3005/tilesets`
**URL:** `http://localhost:3005/tilesets/manage`

Management of map layers (tilesets) for viewers.

---

### 3.9 User Settings

**URL:** `http://localhost:3005/settings`

The authenticated user can:
- **Edit Profile**: change first name, last name, phone number
- **Notifications**: enable/disable email notifications and job status change notifications
- **Change Password**: change password
- **Two-Factor Auth**: enable/disable TOTP (Google Authenticator)

---

## 4. Client Portal

> Access: users with roles Client (1) or Registered (3)
> Base URL: `http://localhost:3005?app=client`

### 4.1 Client Dashboard
**URL:** `http://localhost:3005/?app=client`

Shows:
- Job summary: total, completed, in progress
- Client's site list
- Recent jobs with status
- **Export CSV** button to download all their jobs

### 4.2 My Sites
**URL:** `http://localhost:3005/sites?app=client`

List of all sites associated with the client, with job count per site.

### 4.3 Site Detail
**URL:** `http://localhost:3005/site/{id}?app=client`

Client's jobs at that specific site.

### 4.4 Job Detail
**URL:** `http://localhost:3005/job/{id}?app=client`

The client sees:
- Job status in the pipeline
- Dates (proposed, approved, scheduled, completed)
- Available products

### 4.5 Product/Deliverable
**URL:** `http://localhost:3005/job/{id}/product/{productId}?app=client`

View of a specific job deliverable (with access to the corresponding viewer).

---

## 5. Admin Panel

> Access: users with role Admin (0) or Developer (4)
> Base URL: `http://localhost:3005?app=admin`

### 5.1 Admin Dashboard
**URL:** `http://localhost:3005/?app=admin`

Global system statistics:
- Total users, jobs, sites, organizations
- Jobs by pipeline
- Active users

### 5.2 User Search
**URL:** `http://localhost:3005/users/search?app=admin`

- Search by name or email
- View each user's role and status
- Click on a user → full detail

### 5.3 User Detail
**URL:** `http://localhost:3005/users/{id}?app=admin`

The admin can:
- Edit name, phone
- **Change roles** (checkboxes: Admin, Client, Staff, Pilot, Manager, etc.)
- **Change granular permissions** (grouped by category)
- **Change Password** + automatically kill sessions
- **Kill Sessions** → invalidates all active tokens for the user
- **Delete User** (with confirmation)
- View jobs and sites created by that user

### 5.4 Roles & Permissions
**URL:** `http://localhost:3005/users/roles?app=admin`

View of all roles with their associated permissions.

### 5.5 Audit Logs
**URL:** `http://localhost:3005/audit-logs?app=admin`

Record of all important system actions with user, date and detail.

### 5.6 System Health
**URL:** `http://localhost:3005/system-health?app=admin`

- Real-time status: Database, API, Email
- Server uptime
- Versions: Node.js, Next.js, App
- **Maintenance Mode**: toggle to put the site in maintenance
  - With maintenance active → unauthenticated users see `/maintenance`
  - Authenticated users keep full access

### 5.7 Active Connections (Developer Tools)
**URL:** `http://localhost:3005/developer/active-visitors?app=admin`

Real-time monitoring:
- **Socket Connections**: users connected via WebSocket (with active rooms)
- **HTTP Sessions**: users with valid session tokens
  - 🚪 (logout) button per user → kills all their sessions immediately
- Automatic update every 30s + Refresh button
- Socket status indicator (Live / Connecting / Disconnected)

---

## 6. Public Viewers

Viewers are pages accessible with a **share token** or direct link. No login required if the token is valid.

| Viewer | URL | Description |
|--------|-----|-------------|
| Landscape | `http://localhost:3005/viewer/landscape/{jobProductId}` | Aerial/topographic map |
| Community | `http://localhost:3005/viewer/community/{jobProductId}` | Community view |
| Construct | `http://localhost:3005/viewer/construct/{jobProductId}` | Construction/3D view |

### How to share a viewer from the Hub

1. Go to a job detail: `/workflow/jobs/{id}`
2. In the **Products** section, click the 🔗 (share) icon on the desired product
3. The **Share Modal** opens with:
   - Direct link to the viewer
   - Option to copy to clipboard
4. The link can be shared with the client — no login required

---

## 7. Complete Job Workflow

This is the typical journey of a job from creation to billing:

```
[Create Job] → [Approve] → [Schedule + Assign Pilot] → [Log Flight] → [Deliver] → [Bill]
   Bids           Bids          Scheduled                  Processing    Processing   Bill → Completed
```

### Step 1 — Create the Job (Staff/Admin)
1. Go to `http://localhost:3005/workflow/jobs/new`
2. Name: `"Survey - Central Building"`
3. Site: select client's site
4. Proposed date: tentative flight date
5. Products: check `Landscape` and `Construct`
6. Amount: `$1,500.00`
7. Click **Create Job** → lands in **Bids** pipeline

### Step 2 — Approve the Job (Manager/Admin)
1. In the jobs list, select the created job
2. Click **Approve** → enter approved flight date → **Approve**
3. Job advances to **Bids** (approved, awaiting schedule)

### Step 3 — Schedule and assign pilot (Manager/Admin)
1. Click **Schedule** on the job
2. Enter scheduled date and flight info
3. In **Assign Staff/Pilots**, the system shows suggestions with score:
   - ✅ No conflicts = high score
   - ⚠️ Blackout or unavailable day = low score
4. Select pilot(s) → **Schedule**
5. Job advances to **Scheduled**

### Step 4 — Record completed flight (Pilot/Staff)
1. Click **Log Flight** on the job
2. Actual flight date
3. Optional: flight data in JSON (conditions, duration, etc.)
4. **Log Flight** → job advances to **Processing / Deliver**

### Step 5 — Mark as delivered (Staff/Admin)
1. Click **Deliver** on the job
2. Confirm delivery date → **Mark as Delivered**
3. Job advances to **Bill**

### Step 6 — Bill (Admin/Manager)
1. Click **Bill** on the job
2. Enter invoice number (`INV-2026-001`)
3. **Bill Job** → job advances to **Completed**

### Step 6b — Create detailed invoice (optional)
1. Go to `http://localhost:3005/billing/invoices/new`
2. Associate with the job, enter items with detail
3. **Download PDF** to send to the client

### Step 7 — Share viewer with client
1. In the job detail, find the **Products** section
2. Click 🔗 on "Landscape" → copy the viewer link
3. Send to the client — they can view the map without login

---

## 8. Quick Reference URLs

### Hub Portal
| Feature | URL |
|---------|-----|
| Dashboard | `http://localhost:3005/` |
| Jobs List | `http://localhost:3005/workflow/jobs` |
| New Job | `http://localhost:3005/workflow/jobs/new` |
| Sites List | `http://localhost:3005/workflow/sites` |
| Recurring Jobs | `http://localhost:3005/workflow/recurring` |
| Billing Dashboard | `http://localhost:3005/billing` |
| New Invoice | `http://localhost:3005/billing/invoices/new` |
| Scheduling | `http://localhost:3005/scheduling` |
| Pilots List | `http://localhost:3005/scheduling/pilots` |
| My Schedule | `http://localhost:3005/scheduling/my-schedule` |
| Organizations | `http://localhost:3005/onboard/company/manage` |
| Tilesets | `http://localhost:3005/tilesets` |
| Settings | `http://localhost:3005/settings` |

### Client Portal
| Feature | URL |
|---------|-----|
| Dashboard | `http://localhost:3005/?app=client` |
| My Sites | `http://localhost:3005/sites?app=client` |

### Admin Panel
| Feature | URL |
|---------|-----|
| Dashboard | `http://localhost:3005/?app=admin` |
| Search Users | `http://localhost:3005/users/search?app=admin` |
| Audit Logs | `http://localhost:3005/audit-logs?app=admin` |
| System Health | `http://localhost:3005/system-health?app=admin` |
| Active Visitors | `http://localhost:3005/developer/active-visitors?app=admin` |
| Maintenance Mode | `http://localhost:3005/system-health?app=admin` (toggle on the page) |

### Auth
| Feature | URL |
|---------|-----|
| Login | `http://localhost:3005/login` |
| Register | `http://localhost:3005/register` |
| Forgot Password | `http://localhost:3005/forgot-password` |
| Terms of Service | `http://localhost:3005/tos` |

---

## Demo Technical Notes

- **Database:** MySQL at `localhost:3309`, database `prodrones_application`
- **phpMyAdmin:** `http://localhost:9010`
- **Email in dev:** Uses Ethereal (fake SMTP) — emails are not actually sent. Check the preview URL in the server console (`[Email] Preview URL: https://ethereal.email/...`)
- **Socket.IO:** Automatically connects when loading any authenticated page. The Active Visitors panel shows real-time connections
- **Share links:** Viewer links are public — anyone with the link can view the map without login
- **Maintenance Mode:** When active, non-logged-in users see `/maintenance`. Logged-in users retain full access
