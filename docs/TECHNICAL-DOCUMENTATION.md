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

## 🗄️ Database & Security
- **RBAC:** Role-Based Access Control implemented across all API endpoints.
- **Encryption:** AES-256 encryption for sensitive database fields.
- **Validation:** Type-safe input schema validation using Zod on both client and server.

## 🚀 Roadmap & Pending Development

The current system is fully operational for its primary workflows. However, to complete the full platform scope, the following modules are currently in the queue:

### 📍 Tileset Refinement View
Implementation of an advanced management interface to customize Tileset presets, visualization parameters, and publishing metadata after the initial upload process.

### 📊 Reporting Engine
Development of a dynamic PDF/Data generation module to transform mission flight logs into professional deliverables and analytics for clients.

---
*Technical Document Version: 1.1.0*  
*Status: READY FOR DEPLOYMENT*
