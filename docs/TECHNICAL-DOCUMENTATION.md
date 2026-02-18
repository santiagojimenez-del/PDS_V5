# 🛠️ Technical Documentation - ProDrones Hub V5

## 📋 General Overview
ProDrones Hub V5 is a cloud-native platform designed for professional drone operations management, inventory tracking, and geospatial data visualization. It utilizes a sophisticated multi-app architecture to serve different user personas (Hub/Staff, Clients, and Admins) from a single unified codebase.

## 🏗️ Technical Stack
*   **Framework:** Next.js 15+ (App Router)
*   **Core Logic:** TypeScript
*   **Database:** Aiven MySQL (High Availability)
*   **ORM:** Drizzle ORM
*   **Authentication:** NextAuth.js + Custom JWT Middleware
*   **Styling:** Tailwind CSS + Radix UI
*   **Mapping:** Leaflet.js with Advanced Drawing Tools

## ⚙️ Core Modules & System Architecture

### 1. Multi-App Middleware Rewrite
The system implements a domain/parameter-based routing logic in `src/middleware.ts`. This allows the platform to act as three distinct applications:
- **Hub:** For internal staff and operations management.
- **Client Portals:** For end-users to view mission reports and data.
- **Admin:** For global system configuration and platform health.

### 2. Chunked File Transmission System
Designed for multi-gigabyte geospatial files (TIFF, MBTILES):
- **Fragmentation:** Splitting files into 5MB sequential chunks.
- **Resiliency:** MD5 hashing for integrity and missing chunk detection for resume capability.
- **Finalization:** Server-side file stream assembly and automatic temporary data cleanup.

### 3. Bulk Operations Engine (BOE)
A robust service layer developed to handle high-volume administrative tasks:
- **Scalability:** Optimized for handling hundreds of jobs in a single request.
- **Reliability:** Uses isolated transactions to ensure that a failure in one job does not block the entire batch.
- **Traceability:** Dedicated logging system for auditing mass changes.

### 4. Pilot Scheduling & Assignment System
Intelligent pilot scheduling with conflict detection and workload optimization:
- **Availability Management:** Weekly recurring schedules and blackout dates for each pilot.
- **Conflict Detection:** Real-time checking for double-bookings, time conflicts, and workload limits.
- **Smart Assignment:** AI-powered pilot suggestions with scoring algorithm (0-100) based on availability, workload, and conflicts.
- **Email Notifications:** Automated alerts to pilots when assigned to jobs.
- **Calendar Views:** Visual weekly calendars showing pilot schedules and assignments.
- **Workload Balancing:** Distributes jobs evenly across the pilot team to prevent burnout.

**Key Features:**
- Day-of-week availability tracking (e.g., "Monday 9am-5pm")
- Blackout periods for vacation/PTO
- Maximum jobs per week/month enforcement
- Conflict severity levels (error vs warning)
- Real-time availability status indicators

### 5. Billing & Invoice Management System
Comprehensive financial management with automated invoice generation and payment tracking:
- **Auto-Numbering:** Sequential invoice numbers per year (INV-YYYY-NNNN).
- **Multi-Line Invoicing:** Support for multiple line items with quantity × unit price calculations.
- **Tax Calculation:** Configurable per-invoice tax rates with automatic total calculation.
- **Payment Tracking:** Record partial and full payments with remaining balance calculation.
- **Status Workflow:** Draft → Sent → Paid/Overdue/Cancelled lifecycle management.
- **Financial Dashboard:** Real-time statistics (Total Billed, Paid, Outstanding, Overdue count).

**Business Rules:**
- Only draft invoices can be deleted (audit trail protection)
- Payments cannot exceed remaining balance (validation)
- Invoice status auto-updates to "paid" when fully paid
- Financial fields are immutable after invoice creation

## 🗄️ Database & Security
- **RBAC:** Role-Based Access Control implemented across all API endpoints.
- **Encryption:** AES-256 encryption for sensitive database fields.
- **Validation:** Type-safe input schema validation using Zod on both client and server.

## 🚀 Roadmap & Pending Development

The current system is fully operational for its primary workflows. The following modules have been completed or are in progress:

### ✅ Completed Recently
- **Pilot Scheduling System (Phase 1 & 2):** Availability management, conflict detection, smart assignments (70% complete)
- **Billing System (MVP):** Invoice generation, payment tracking, financial dashboard (60% complete)
- **Job Management UI:** Complete CRUD, detail pages, workflow actions (100% complete)
- **Analytics Dashboard:** Hub and Client dashboards with KPIs (90% complete)

### 🚧 In Progress
- **Recurring Jobs:** RRULE-based job generation with Vercel Cron integration (50% complete)

### 📋 Planned Features

#### 📍 Tileset Refinement View
Implementation of an advanced management interface to customize Tileset presets, visualization parameters, and publishing metadata after the initial upload process.

#### 📊 Reporting Engine
Development of a dynamic PDF/Data generation module to transform mission flight logs into professional deliverables and analytics for clients.

#### 💰 Billing System Enhancements (Phase 2)
- Client invoice portal for viewing and payment
- PDF invoice generation with professional templates
- Stripe/payment gateway integration
- Recurring billing for subscription services
- Aging reports and tax reporting

#### 🎫 Pilot Scheduling Enhancements (Phase 3)
- Pilot self-service dashboard
- Advanced multi-week calendar views
- Capacity planning and forecasting tools
- Advanced optimization algorithms

---
*Technical Document Version: 2.0.0*
*Last Updated: February 17, 2026*
*Status: ACTIVE DEVELOPMENT (93% Complete)*
