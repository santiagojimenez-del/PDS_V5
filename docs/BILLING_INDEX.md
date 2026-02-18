# 💰 Billing System - Documentation Index

Complete documentation for the ProDrones Hub Billing & Invoice Management System.

---

## 📚 Documentation Structure

### 1. Main Technical Documentation
**File:** [BILLING_SYSTEM.md](./BILLING_SYSTEM.md)

Complete technical reference covering:
- System architecture and database schema
- Core business logic and services
- API endpoints and request/response formats
- User interface components
- Security and permissions
- Business workflows and rules
- Future enhancements roadmap

**Best for:** Developers, architects, technical leads

---

## 🎯 Quick Links by Topic

### For Developers

#### Getting Started
1. **Database Schema** → [BILLING_SYSTEM.md#database-schema](./BILLING_SYSTEM.md#-architecture)
   - 3 core tables: Invoices, InvoiceLineItems, Payments
   - Relationships and constraints
   - Cascade deletion rules

2. **API Reference** → [BILLING_SYSTEM.md#api-endpoints](./BILLING_SYSTEM.md#-api-endpoints)
   - Invoice CRUD operations
   - Payment recording
   - Dashboard statistics
   - Request/response examples

3. **Business Logic** → [BILLING_SYSTEM.md#core-services](./BILLING_SYSTEM.md#-core-services)
   - Invoice number generation
   - Tax and total calculations
   - Status management
   - Payment validation

#### Code Locations
```
src/
├── lib/db/schema/invoices.ts          # Database schema
├── modules/billing/
│   ├── types.ts                       # TypeScript interfaces
│   ├── schemas/billing-schemas.ts     # Zod validation
│   └── services/invoice-service.ts    # Core business logic
└── app/
    ├── api/billing/                   # API endpoints
    │   ├── invoices/route.ts
    │   ├── invoices/[id]/route.ts
    │   ├── invoices/[id]/payments/route.ts
    │   └── summary/route.ts
    └── hub/billing/page.tsx           # Admin dashboard
```

---

### For Product Managers

#### Feature Overview
- **Current Status:** MVP Complete (60%)
- **What's Working:**
  - ✅ Create invoices from jobs
  - ✅ Auto-generate invoice numbers
  - ✅ Multi-line item billing
  - ✅ Tax calculation
  - ✅ Record payments (partial/full)
  - ✅ Track invoice status
  - ✅ Financial dashboard

- **What's Coming (Phase 2):**
  - 🚧 Client invoice portal
  - 🚧 PDF invoice generation
  - 🚧 Stripe payment integration
  - 🚧 Email notifications
  - 🚧 Recurring billing

#### Business Workflows
See [BILLING_SYSTEM.md#business-logic--workflows](./BILLING_SYSTEM.md#-business-logic--workflows)
- Invoice lifecycle states
- Payment processing rules
- Status transitions
- Data protection policies

---

### For QA/Testing

#### Testing Checklist
See [BILLING_SYSTEM.md#testing-checklist](./BILLING_SYSTEM.md#-testing-checklist)

Test scenarios for:
- Invoice creation and numbering
- Payment recording and validation
- Invoice status updates
- Dashboard statistics
- Edge cases and error handling

---

## 🔑 Key Concepts

### Invoice Numbering
- **Format:** `INV-YYYY-NNNN`
- **Example:** `INV-2026-0042`
- **Logic:** Auto-increments per year starting from 0001

### Invoice Status Workflow
```
Draft → Sent → Paid
  ↓       ↓
Cancelled  Overdue
```

- **Draft:** Editable, can be deleted
- **Sent:** Locked, awaiting payment
- **Paid:** Fully paid (auto-set)
- **Overdue:** Past due date, unpaid
- **Cancelled:** Voided invoice

### Payment Rules
- ✅ Supports partial payments
- ✅ Prevents overpayments (validates against remaining balance)
- ✅ Auto-updates invoice status when fully paid
- ❌ Cannot add payments to cancelled invoices

### Tax Calculation
- Configurable per-invoice tax rate
- Calculated on subtotal before total
- Formula: `total = subtotal + (subtotal × taxRate / 100)`

---

## 📊 Database Schema Quick Reference

### Invoices Table
```sql
Invoices
├── id (PK)
├── invoiceNumber (UNIQUE)
├── jobId (FK)
├── clientId
├── subtotal, taxRate, taxAmount, total
├── status (draft|sent|paid|overdue|cancelled)
└── issueDate, dueDate, paidDate
```

### Invoice Line Items
```sql
Invoice_Line_Items
├── id (PK)
├── invoiceId (FK, CASCADE)
├── description
├── quantity, unitPrice, amount
└── sortOrder
```

### Payments
```sql
Payments
├── id (PK)
├── invoiceId (FK, CASCADE)
├── amount
├── paymentMethod
├── paymentDate
└── paymentReference
```

---

## 🌐 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/billing/invoices` | Create new invoice |
| `GET` | `/api/billing/invoices` | List all invoices |
| `GET` | `/api/billing/invoices/[id]` | Get invoice details |
| `PATCH` | `/api/billing/invoices/[id]` | Update invoice |
| `DELETE` | `/api/billing/invoices/[id]` | Delete draft invoice |
| `POST` | `/api/billing/invoices/[id]/payments` | Record payment |
| `GET` | `/api/billing/invoices/[id]/payments` | List payments |
| `GET` | `/api/billing/summary` | Dashboard statistics |

All endpoints require authentication via `withAuth` middleware.

---

## 🎨 User Interface

### Admin Dashboard (`/hub/billing`)
- Summary cards (Total Billed, Paid, Outstanding, Overdue)
- Recent invoices list (last 20)
- Status badges with color coding
- Quick navigation to invoice details
- "Create Invoice" button

### Status Color Coding
- 🟢 **Paid** - Green
- 🔵 **Sent** - Blue
- 🔴 **Overdue** - Red
- ⚪ **Draft** - Gray
- ⚫ **Cancelled** - Light Gray

---

## 🚀 Future Development

### Phase 2 (Next Sprint)
1. **Client Invoice Portal**
   - View invoices assigned to client
   - Download PDF copies
   - View payment history
   - Check remaining balance

2. **PDF Generation**
   - Professional invoice templates
   - Company branding/logo
   - Email invoice as PDF

3. **Payment Gateway**
   - Stripe integration
   - Online credit card payments
   - Auto-record payments from gateway

### Phase 3 (Future)
1. **Recurring Billing**
   - Subscription-based invoicing
   - Auto-generate invoices on schedule

2. **Advanced Reporting**
   - Aging reports (30/60/90 days)
   - Revenue reports
   - Tax reports

3. **Email Automation**
   - Auto-send invoices
   - Payment reminders
   - Overdue notices

---

## 📞 Related Systems

### Integration Points
- **Jobs System:** Invoice created from job, pulls client info
- **Email System:** Future invoice PDFs and notifications
- **User System:** Tracks who created invoices/payments

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Feb 17, 2026 | Initial MVP release |

---

## 🔗 Additional Resources

- **Project Status:** [PROJECT_STATUS.md](../PROJECT_STATUS.md)
- **State Report:** [STATE-REPORT.md](./STATE-REPORT.md)
- **Technical Docs:** [TECHNICAL-DOCUMENTATION.md](./TECHNICAL-DOCUMENTATION.md)

---

**Last Updated:** February 17, 2026
**Maintained by:** ProDrones Development Team
