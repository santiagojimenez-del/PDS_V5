# ProDrones Hub — User Manual

**Version 5** | Last updated: February 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started](#2-getting-started)
3. [Hub Portal — Internal Operations](#3-hub-portal--internal-operations)
   - [Dashboard](#31-dashboard)
   - [Job Workflow](#32-job-workflow)
   - [Sites Management](#33-sites-management)
   - [Scheduling](#34-scheduling)
   - [Billing](#35-billing)
   - [Tilesets](#36-tilesets)
   - [Onboarding](#37-onboarding)
4. [Client Portal](#4-client-portal)
5. [Admin Panel](#5-admin-panel)
6. [Viewers](#6-viewers)
7. [Roles & Permissions](#7-roles--permissions)
8. [Email Notifications](#8-email-notifications)
9. [Data Export](#9-data-export)

---

## 1. Overview

ProDrones Hub is an end-to-end drone services management platform. It centralizes job scheduling, pilot coordination, client delivery, billing, and geospatial data visualization across three portals:

| Portal | URL | Who Uses It |
|--------|-----|-------------|
| **Hub** | `hub.prodrones.com` | Staff, Pilots, Managers, Admins |
| **Client** | `client.prodrones.com` | Clients |
| **Admin** | `admin.prodrones.com` | Admins only |

The system automatically redirects each user to the correct portal after login based on their role.

---

## 2. Getting Started

### 2.1 Login

1. Navigate to the login page.
2. Enter your **email** and **password**.
3. Click **Sign In**.
4. If your account has Two-Factor Authentication (2FA) enabled, a 6-digit code prompt appears — enter the code sent to your email.

After login, you are automatically redirected to the portal matching your role.

### 2.2 Two-Factor Authentication (2FA)

- A 6-digit verification code is required on top of your password.
- The code is delivered to your registered email address.
- Type the 6 digits (auto-advances between fields) or paste the full code directly.
- The code auto-submits once all 6 digits are entered.
- Click **Resend Code** if needed.
- 2FA sessions remain active for **15 days**.

### 2.3 Registration

1. Click **Create an account** on the login page.
2. Fill in: First Name, Last Name, Email, and Password.
3. Submit — you will be logged in immediately.

### 2.4 Password Reset

1. Click **Forgot password?** on the login page.
2. Enter your email address and submit.
3. Open the reset link sent to your email.
4. Enter and confirm your new password.

### 2.5 Logging Out

Click your user menu (top-right) and select **Log Out**. Your session is invalidated immediately.

---

## 3. Hub Portal — Internal Operations

> **Access:** Admin, Manager, Staff, Pilot

### 3.1 Dashboard

The Hub dashboard provides a real-time snapshot of operations.

**Summary Cards (top row)**

| Card | What It Shows |
|------|---------------|
| Total Jobs | All jobs in the system + new jobs this week |
| Active Sites | Number of active project locations |
| Companies | Number of active client organizations |
| Users | Total staff + client accounts |

**Performance Cards (second row)**

| Card | What It Shows |
|------|---------------|
| Completed This Month | Count + month-over-month growth % |
| In Progress | Jobs currently in Bid, Scheduled, or Processing stages |
| Completion Rate | % of jobs completed out of total |

**Pipeline Overview**

A visual bar showing the distribution of all jobs across the 5 pipeline stages:
- **Bids** (yellow) — newly created, awaiting approval
- **Scheduled** (blue) — approved and assigned to pilots
- **Processing & Delivery** (purple) — flight done, in post-processing
- **Billing** (orange) — delivered, awaiting invoice
- **Completed** (green) — fully closed

**Recent Activity**

Last 5 jobs created with name, pipeline status, and creation date.

---

### 3.2 Job Workflow

The job workflow page (`/workflow/jobs`) is the primary operations tool.

#### Pipeline Tabs

Five tabs correspond to pipeline stages. The active tab is highlighted in orange. Each tab displays the number of jobs in that stage.

Click a tab to filter the list to jobs in that stage.

#### Viewing Jobs

- **Desktop:** Table view with columns: checkbox, Job #, Site, Client, Date, Products.
- **Mobile:** Card view with condensed information.

#### Search & Filters

- **Search bar:** Searches by Job ID, site name, client name, or product name in real time.
- **Filters panel** (click the filter icon to expand):
  - Client
  - Site
  - Product
  - From date / To date
- An orange badge on the filter button shows how many filters are active.
- Click **Clear all** to reset all filters.

#### Pagination

Select 10, 25, or 50 rows per page. Use **Previous** / **Next** buttons to navigate.

#### Selecting Jobs

Check the checkbox on any row to select it. Use the header checkbox to select/deselect all visible rows. Selection count appears in the toolbar.

---

#### Creating a New Job

1. Click **New Job** (top-right).
2. Fill in:
   - **Job Name** (required)
   - **Site** — select from dropdown (required)
   - **Client / Organization** — select from dropdown (required)
   - **Date Requested** — optional
3. Click **Create Job**.

The new job appears in the **Bids** column.

---

#### Job Pipeline Actions

Jobs advance through the pipeline via the following actions. Actions are available via the job's action menu or via bulk selection.

---

**Approve**

Moves job: **Bids → Scheduled**

1. Open the Approve dialog.
2. Set the **Approved Flight Date**.
3. Click **Approve**.

---

**Schedule**

Assigns pilots and locks in a flight date.

1. Open the Schedule dialog.
2. Set the **Scheduled Date**.
3. Enter **Flight Info** (e.g., "10:00 AM - Clear skies").
4. Select one or more **Assigned Pilots / Staff** from the searchable list.
   - The list shows each person's availability for the selected date.
   - At least one person must be assigned.
5. Click **Schedule**.

Assigned pilots receive an automatic email notification.

---

**Log Flight**

Records that the flight has been completed.

1. Open the Log Flight dialog.
2. Set the **Flight Date**.
3. Optionally enter a **Flight Log** in JSON format, e.g.:
   ```json
   {"weather": "Clear", "duration": "45min", "altitude": "120m"}
   ```
4. Click **Log Flight**.

---

**Mark as Delivered**

Records that deliverables have been sent to the client.

1. Open the Deliver dialog.
2. Set the **Delivered Date** (defaults to today if left blank).
3. Click **Deliver**.

The client receives an automatic email notification.

---

**Bill**

Records that an invoice has been issued.

1. Open the Bill dialog.
2. Set the **Billed Date** (defaults to today if left blank).
3. Enter the **Invoice Number** (required).
4. Click **Bill**.

---

#### Bulk Actions

Select multiple jobs and use the **Bulk Actions toolbar** that appears at the top of the list.

Available bulk actions:
- **Approve** — Approve all selected jobs at once (set one date applied to all)
- **Schedule** — Schedule all selected jobs (same date, flight info, and pilot assignment)
- **Log Flight** — Log a flight for all selected jobs
- **Deliver** — Mark all selected jobs as delivered (email sent to each client)
- **Bill** — Bill all selected jobs at once
- **Delete** — Permanently delete selected jobs (confirmation required)

---

### 3.3 Sites Management

Sites represent physical project locations.

#### Viewing Sites

- **List view:** Grid of site cards showing name, job count, address, and creator.
- **Map view:** Interactive Leaflet map with a marker for each site. Click a marker to see site details in a sidebar.
- Toggle between views using the **List / Map** buttons.

#### Search

Search by site name or address in real time.

#### Creating a Site

1. Click **New Site**.
2. Fill in:
   - **Name** (required)
   - **Address** (optional)
   - **Description** (optional)
   - **Latitude** (required — decimal degrees, e.g., `25.7617`)
   - **Longitude** (required — decimal degrees, e.g., `-80.1918`)
3. Click **Create Site**.

The new site is immediately available for job assignment and appears on the map.

---

### 3.4 Scheduling

The Scheduling module manages pilot and staff availability.

#### Dashboard (`/scheduling`)

- **Stats cards:** Active pilots, staff members, jobs this week, average hours per pilot.
- **Team Overview:** List of pilots and staff with name, email, and role badge.
- **Quick Actions:** Links to manage availability, schedule jobs, and view schedules.

#### Pilot List (`/scheduling/pilots`)

Lists all pilots and staff. Search by name. Click any person to open their schedule.

#### Individual Pilot Schedule (`/scheduling/pilots/[id]`)

Two management panels are available:

**Availability Manager**
- Set the days and hours a pilot is available.
- Add slots with start and end times.
- Remove slots to block off times.

**Blackout Manager**
- Set date ranges when the pilot is completely unavailable (vacation, sick leave, etc.).
- Add a date range and optional reason.
- These dates are excluded from scheduling suggestions.

#### Scheduling Suggestions

When scheduling a job, the system automatically shows pilot availability for the selected date, highlighting conflicts and suggesting the best available options.

---

### 3.5 Billing

The Billing module tracks invoices and payments.

#### Dashboard (`/billing`)

**Summary cards:**

| Card | Color | What It Shows |
|------|-------|---------------|
| Total Billed | Default | Sum of all invoices |
| Total Paid | Green | Sum of paid invoices |
| Outstanding | Yellow | Invoices pending payment |
| Overdue | Red | Count of past-due invoices |

**Recent Invoices list** — shows the last invoices with:
- Invoice number
- Job # reference
- Amount
- Status badge: **Draft**, **Sent**, **Paid**, **Overdue**, or **Cancelled**
- Due date and creation date

Click any invoice to open its detail page.

#### Invoice Details (`/billing/invoices/[id]`)

- Full invoice information including job, client, and amounts.
- Payment history.
- Actions: mark as paid, resend invoice.

#### Recording a Payment

Open an invoice and use the **Record Payment** button to log a payment against it.

---

### 3.6 Tilesets

Tilesets connect custom map tile servers to viewer products.

#### Viewing Tilesets (`/tilesets`)

Grid of tileset cards showing:
- Name
- Description (if set)
- Preset type badge
- Published status
- Edit (pencil) and Delete (trash) icons per card

#### Creating a Tileset

1. Click **New Tileset** or go to `/tilesets/manage`.
2. Fill in:
   - **Name** (required)
   - **Description** (optional)
   - **Tile Path** (required) — XYZ tile URL pattern, e.g.:
     `/tiles/my-tileset/{z}/{x}/{y}.png`
   - **Preset** — select the viewer type:
     - No preset
     - Landscape
     - Community
     - Construct
3. Click **Create**.

#### Editing a Tileset

Click the pencil icon on any tileset card to open the edit dialog. You can update the name, description, preset, and published status.

#### Deleting a Tileset

Click the trash icon on a tileset card. Confirm the deletion in the dialog. This removes the tileset record (tile files on disk are not deleted).

---

### 3.7 Onboarding

Quick-add tools for creating new clients and companies.

#### Add Company (`/onboard/company`)

1. Enter **Company Name** (required) and optional **Address**.
2. Click **Submit**.

The company is immediately available for job assignment.

#### Manage Contacts (`/onboard/contact/manage`)

Manage and import contact information for new clients.

---

## 4. Client Portal

> **Access:** Client, Registered user

The Client Portal gives customers a read-only view of their projects.

### 4.1 Dashboard

**Summary cards:**

| Card | What It Shows |
|------|---------------|
| Total Projects | All jobs for this client |
| Completed | Count + % completion rate |
| In Progress | Jobs in Scheduled or Processing stages |
| Your Sites | Number of client's locations |

**Project Status Overview** — visual breakdown by status with counts and percentages.

**Recent Jobs** — last 10 jobs with name, pipeline status badge, site name, scheduled date, and deliverable count.

**Your Sites** — up to 6 site cards with name and job count.

**Export CSV** — downloads the full jobs list as a CSV file.

### 4.2 Project Sites (`/sites`)

Grid of site cards. Search by name or address. Click a site to view its details and all associated jobs.

### 4.3 Job Details

Click any job to view:
- Job name and pipeline status
- Assigned site
- Timeline: request date, scheduled date, completion date
- Products and deliverables list

### 4.4 Viewing Deliverables

Click a deliverable (product) to open the appropriate viewer:
- **Landscape** — aerial imagery and orthomosaics
- **Construct** — 3D models and point clouds
- **Community** — property overlays and compliance data

---

## 5. Admin Panel

> **Access:** Admin only

### 5.1 Dashboard (`/admin`)

Overview cards linking to key admin sections:
- Total Users, Total Jobs, Total Sites, Organizations, Permissions

### 5.2 Roles & Permissions (`/admin/users/roles`)

**System Roles:**

| ID | Name | Default Access |
|----|------|----------------|
| 0 | Admin | Full system access |
| 1 | Client | Client portal |
| 3 | Registered | Basic access |
| 4 | Developer | Developer tools |
| 5 | Staff | Hub workflow |
| 6 | Pilot | Flight operations |
| 7 | Manager | Team management |

**Permissions Table:**

Each permission has:
- **Label** — display name
- **Description** — what it controls
- **Hidden** — whether it appears in user-facing permission lists
- **Enforced** — whether the system actively blocks unauthorized access
- **Priority** — order of enforcement

Search permissions by name or description.

### 5.3 Audit Logs (`/admin/audit-logs`)

A full history of every action taken in the system.

**Each log entry shows:**
- **Action badge** (color-coded): Create (green), Update (blue), Delete (red), Auth (purple)
- Action type, resource name, and resource ID
- User who performed the action
- Relative timestamp (e.g., "2 hours ago") and full timestamp
- IP address
- Expandable **metadata** section with full JSON details

**Filters:**
- Text search (user, action, or resource)
- Action type dropdown: All, Create, Update, Delete, Login/Auth

**Pagination:** 10, 25, 50, or 100 rows per page.

### 5.4 System Health (`/admin/system-health`)

Real-time status checks:
- Database connection
- Cache layer
- Email service
- Application uptime

### 5.5 Sessions (`/admin/sessions`)

View all active user sessions with login time and last activity. Force-logout any session.

---

## 6. Viewers

Viewers display geospatial deliverables. They can be accessed by authenticated users or via a **share link** (no login required).

### 6.1 Landscape Viewer

Used for aerial photography, orthomosaics, and raster data.

**Controls:**
- **Zoom** — mouse scroll or zoom buttons
- **Pan** — click and drag
- **Layer toggle** — show/hide raster and vector layers
- **Drawing tools** — draw polygons, polylines, and points on the map
- **Measurement tools** — measure distances and areas
- **Feature properties panel** — click any drawn feature to view and edit its attributes
- **Legend** — color key for map layers
- **Export** — download map or data

**Real-time presence:**
- See other users currently viewing the same deliverable
- Live cursor positions labeled with user names

### 6.2 Construct Viewer

Used for 3D models and point clouds.

**Controls:**
- **Orbit** — click and drag to rotate the model
- **Zoom** — mouse scroll
- **Pan** — right-click drag
- **Layer visibility** — toggle model components on/off
- **Material selection** — switch between visual modes
- **Clipping planes** — slice the model to inspect interior sections
- **Measurement tools** — measure dimensions in 3D
- **Feature properties panel** — annotate and label features on the model

### 6.3 Community Viewer

Used for property overlays, zoning maps, and compliance data.

**Controls:**
- **Property boundary visualization** — see parcel outlines
- **Compliance overlay** — color-coded compliance status per property
- **Overlay transparency** — slider to blend between layers
- **Feature properties panel** — click a parcel to view and edit its attributes (name, status, notes)
- **Compliance panel** — review and update compliance reports; export compliance data

### 6.4 Share Links

Any viewer can be shared with external parties (e.g., clients or regulators) without requiring a login.

- Share links contain a secure token in the URL.
- Access is time-limited and configurable.
- Shared viewers are read-only.

---

## 7. Roles & Permissions

### Portal Access by Role

| Role | Hub | Client | Admin | Viewers |
|------|-----|--------|-------|---------|
| Admin (0) | ✓ | ✓ | ✓ | ✓ |
| Client (1) | — | ✓ | — | ✓ |
| Registered (3) | — | ✓ | — | ✓ |
| Developer (4) | ✓ | — | — | ✓ |
| Staff (5) | ✓ | — | — | ✓ |
| Pilot (6) | ✓ | — | — | ✓ |
| Manager (7) | ✓ | — | — | ✓ |

### Feature Access by Role (Hub)

| Feature | Admin | Manager | Staff | Pilot |
|---------|-------|---------|-------|-------|
| View all jobs | ✓ | ✓ | ✓ | ✓ |
| Create/edit jobs | ✓ | ✓ | ✓ | — |
| Approve / Schedule | ✓ | ✓ | ✓ | — |
| Log flight | ✓ | ✓ | ✓ | ✓ |
| Deliver / Bill | ✓ | ✓ | ✓ | — |
| Delete jobs | ✓ | ✓ | — | — |
| Manage scheduling | ✓ | ✓ | ✓ | — |
| View billing | ✓ | ✓ | — | — |
| Manage tilesets | ✓ | ✓ | — | — |
| Admin panel | ✓ | — | — | — |

---

## 8. Email Notifications

The system sends automatic email notifications at key workflow events. All emails are non-blocking — a failed email never prevents a pipeline action from completing.

| Event | Recipient | Trigger |
|-------|-----------|---------|
| Job Scheduled | Assigned pilots | When a job is scheduled (single or bulk) |
| Job Rescheduled | Assigned pilots | When a scheduled job's date is changed |
| Job Cancelled | Assigned pilots | When a scheduled job is cancelled |
| Deliverables Ready | Client | When a job is marked as Delivered (single or bulk) |

**For organization clients**, the email is sent to the primary contact on record. If no primary contact is set, the first contact in the organization's contact list is used.

---

## 9. Data Export

Multiple areas of the application support CSV export for use in spreadsheet tools.

| Data | Location | Who Can Export |
|------|----------|----------------|
| All jobs | Hub → Workflow → Jobs | Staff, Manager, Admin |
| Client jobs | Client Portal → Dashboard | Client |
| All sites | Hub → Workflow → Sites | Staff, Manager, Admin |
| Audit logs | Admin → Audit Logs | Admin |

Click the **Export CSV** button in the relevant section. The file downloads immediately with all currently filtered data.

---

## Tips & Notes

- **Orange highlights** mark the active pipeline tab and primary action buttons (brand color: `#ff6600`).
- **Light / Dark mode** can be toggled on the login page.
- **Skeleton loaders** appear while data is fetching — wait for them to resolve before interacting.
- **Dialogs with required fields** will show inline validation errors if you submit with missing data.
- The **dashboard auto-refreshes** every 30 seconds — no need to reload the page manually.
- In the **Job Workflow**, the date column changes based on the active tab (requested date for Bids, scheduled date for Scheduled, etc.).
- **Bulk operations apply the same values to all selected jobs** — review your selection before submitting.

---

*ProDrones Hub v5 — Internal Documentation*
