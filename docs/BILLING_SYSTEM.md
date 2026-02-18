# 💰 Billing System - Technical Documentation

## Overview

The Billing System provides comprehensive invoice management and payment tracking capabilities for the ProDrones Hub platform. It enables automated invoice generation from jobs, multi-line item billing, payment recording, and financial reporting.

**Current Status:** MVP Complete (60%)
**Version:** 1.0.0
**Last Updated:** February 17, 2026

---

## 🏗️ Architecture

### Database Schema

The billing system consists of three core tables:

#### 1. Invoices Table
Stores invoice header information including client details, totals, and status.

```typescript
{
  id: number (PK)
  invoiceNumber: string (UNIQUE) // Auto-generated: INV-YYYY-NNNN
  jobId: number (FK → Jobs)
  clientId: number
  clientType: "organization" | "individual"

  // Financial
  subtotal: decimal(10,2)
  taxRate: decimal(5,2)
  taxAmount: decimal(10,2)
  total: decimal(10,2)

  // Status & Workflow
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  issueDate: datetime
  dueDate: datetime
  paidDate: datetime | null

  // Additional
  notes: text | null
  termsAndConditions: text | null
  createdBy: number (FK → Users)
  createdAt: datetime
  updatedAt: datetime
}
```

#### 2. Invoice Line Items Table
Stores individual billing items within each invoice.

```typescript
{
  id: number (PK)
  invoiceId: number (FK → Invoices, CASCADE)
  description: string
  quantity: number (default: 1)
  unitPrice: decimal(10,2)
  amount: decimal(10,2) // quantity × unitPrice
  sortOrder: number
}
```

#### 3. Payments Table
Tracks all payments received against invoices (supports partial payments).

```typescript
{
  id: number (PK)
  invoiceId: number (FK → Invoices, CASCADE)
  amount: decimal(10,2)
  paymentMethod: "cash" | "check" | "transfer" | "credit_card" | "other"
  paymentReference: string | null
  paymentDate: datetime
  notes: text | null
  createdBy: number (FK → Users)
  createdAt: datetime
}
```

### Relationships

```
Jobs (1) ──→ (N) Invoices
Invoices (1) ──→ (N) InvoiceLineItems
Invoices (1) ──→ (N) Payments
Users (1) ──→ (N) Invoices (createdBy)
Users (1) ──→ (N) Payments (createdBy)
```

---

## 🔧 Core Services

### Invoice Service (`src/modules/billing/services/invoice-service.ts`)

#### Invoice Number Generation

Automatically generates unique invoice numbers in the format: `INV-YYYY-NNNN`

```typescript
generateInvoiceNumber(): Promise<string>
```

**Logic:**
1. Get current year
2. Find latest invoice for current year
3. Increment sequence number
4. Pad to 4 digits with leading zeros

**Examples:**
- `INV-2026-0001` (first invoice of 2026)
- `INV-2026-0542` (542nd invoice of 2026)

#### Invoice Calculations

Calculates subtotal, tax, and total from line items:

```typescript
calculateInvoiceTotals(
  lineItems: { quantity: number; unitPrice: number }[],
  taxRate: number = 0
): {
  subtotal: number;
  taxAmount: number;
  total: number;
}
```

**Logic:**
1. Sum all line items: `subtotal = Σ(quantity × unitPrice)`
2. Calculate tax: `taxAmount = subtotal × (taxRate / 100)`
3. Calculate total: `total = subtotal + taxAmount`
4. Round all values to 2 decimal places

#### Status Management

Automatically updates invoice status based on payments:

```typescript
updateInvoiceStatus(invoiceId: number): Promise<void>
```

**Status Logic:**
- **Draft:** Initial state when created
- **Sent:** Manually changed when sent to client
- **Paid:** Auto-set when total payments ≥ invoice total
- **Overdue:** Manually set when past due date and unpaid
- **Cancelled:** Manually set when invoice is voided

#### Invoice Retrieval

Fetches complete invoice with line items and payments:

```typescript
getInvoiceWithDetails(invoiceId: number): Promise<InvoiceDetail | null>
```

Returns full invoice object including:
- Header information
- All line items (sorted by sortOrder)
- All payments with running total
- Calculated remaining balance

#### Summary Statistics

Generates billing dashboard statistics:

```typescript
getInvoiceSummary(): Promise<InvoiceSummary>
```

Returns:
- `totalBilled` - Sum of all invoices
- `totalPaid` - Sum of all payments
- `totalOutstanding` - Billed - Paid
- `overdueCount` - Count of overdue invoices

---

## 🌐 API Endpoints

### Invoice Management

#### `POST /api/billing/invoices`
Create new invoice with line items.

**Request Body:**
```json
{
  "jobId": 123,
  "issueDate": "2026-02-17",
  "dueDate": "2026-03-17",
  "lineItems": [
    {
      "description": "Aerial Photography - 50 acres",
      "quantity": 1,
      "unitPrice": 2500.00
    },
    {
      "description": "Video Editing",
      "quantity": 2,
      "unitPrice": 150.00
    }
  ],
  "taxRate": 8.5,
  "notes": "Payment due within 30 days",
  "termsAndConditions": "Net 30"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "invoiceNumber": "INV-2026-0042",
    "total": "2932.50",
    "status": "draft",
    // ... full invoice details
  }
}
```

**Features:**
- Auto-generates invoice number
- Auto-calculates totals
- Fetches client info from job
- Creates all line items in single transaction
- Returns complete invoice with details

---

#### `GET /api/billing/invoices`
List all invoices with pagination.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `status` - Filter by status (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": 42,
        "invoiceNumber": "INV-2026-0042",
        "jobId": 123,
        "total": "2932.50",
        "status": "sent",
        "issueDate": "2026-02-17",
        "dueDate": "2026-03-17",
        "paidDate": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150
    }
  }
}
```

---

#### `GET /api/billing/invoices/[id]`
Get single invoice with full details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "invoiceNumber": "INV-2026-0042",
    "jobId": 123,
    "clientName": "ABC Construction",
    "total": "2932.50",
    "status": "sent",
    "lineItems": [
      {
        "id": 84,
        "description": "Aerial Photography - 50 acres",
        "quantity": 1,
        "unitPrice": "2500.00",
        "amount": "2500.00"
      },
      {
        "id": 85,
        "description": "Video Editing",
        "quantity": 2,
        "unitPrice": "150.00",
        "amount": "300.00"
      }
    ],
    "payments": [
      {
        "id": 12,
        "amount": "1500.00",
        "paymentMethod": "check",
        "paymentDate": "2026-02-25",
        "paymentReference": "CHECK-8942"
      }
    ],
    "remainingBalance": "1432.50"
  }
}
```

---

#### `PATCH /api/billing/invoices/[id]`
Update invoice (limited fields).

**Allowed Updates:**
- `status` - Change invoice status
- `dueDate` - Extend due date
- `notes` - Update notes
- `termsAndConditions` - Update terms

**Request Body:**
```json
{
  "status": "sent",
  "dueDate": "2026-04-17"
}
```

**Business Rules:**
- Cannot modify financial fields after creation
- Cannot change status to "paid" manually (auto-updated by payments)
- Line items are immutable after creation

---

#### `DELETE /api/billing/invoices/[id]`
Delete invoice (draft only).

**Business Rules:**
- Only invoices with status "draft" can be deleted
- Cascade deletes all line items and payments
- Returns error if invoice has been sent or paid

---

### Payment Tracking

#### `POST /api/billing/invoices/[id]/payments`
Record payment against invoice.

**Request Body:**
```json
{
  "amount": 1500.00,
  "paymentMethod": "check",
  "paymentReference": "CHECK-8942",
  "paymentDate": "2026-02-25",
  "notes": "Partial payment received"
}
```

**Validation:**
- Amount must be > 0
- Payment amount cannot exceed remaining balance (within $0.01 rounding)
- Cannot add payments to cancelled invoices

**Side Effects:**
- Auto-updates invoice status to "paid" when fully paid
- Updates invoice `paidDate` when final payment received

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 12,
    "message": "Payment recorded successfully"
  }
}
```

---

#### `GET /api/billing/invoices/[id]/payments`
List all payments for an invoice.

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": 12,
        "invoiceId": 42,
        "amount": "1500.00",
        "paymentMethod": "check",
        "paymentReference": "CHECK-8942",
        "paymentDate": "2026-02-25",
        "notes": "Partial payment received",
        "createdBy": 5,
        "createdAt": "2026-02-25T14:30:00Z"
      }
    ]
  }
}
```

---

### Dashboard Statistics

#### `GET /api/billing/summary`
Get billing summary for dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBilled": 125430.50,
    "totalPaid": 98250.00,
    "totalOutstanding": 27180.50,
    "overdueCount": 5
  }
}
```

**Calculation:**
- `totalBilled` - Sum of all non-cancelled invoice totals
- `totalPaid` - Sum of all payment amounts
- `totalOutstanding` - totalBilled - totalPaid
- `overdueCount` - Count of invoices with status "overdue"

---

## 🎨 User Interface

### Admin Billing Dashboard (`/hub/billing`)

**Features:**
- Summary statistics cards (Total Billed, Paid, Outstanding, Overdue)
- Recent invoices list (last 20)
- Status badges with color coding
- Quick navigation to invoice details
- "Create Invoice" button

**Component:** `src/app/hub/billing/page.tsx`

**Data Fetching:**
```typescript
// React Query for real-time data
const { data: summary } = useQuery({
  queryKey: ["billing-summary"],
  queryFn: fetchSummary
});

const { data: invoices } = useQuery({
  queryKey: ["invoices"],
  queryFn: fetchInvoices
});
```

**Status Colors:**
- **Draft** - Gray (`bg-gray-500`)
- **Sent** - Blue (`bg-blue-500`)
- **Paid** - Green (`bg-green-500`)
- **Overdue** - Red (`bg-red-500`)
- **Cancelled** - Light Gray (`bg-gray-400`)

---

## 🔐 Security & Permissions

### Authentication
All billing endpoints require authentication via `withAuth` middleware.

### Authorization
Currently open to all authenticated users. Future enhancement will add:
- Admin-only invoice creation
- Client-only invoice viewing (own invoices)
- Accountant role for payment recording

### Data Protection
- Draft invoices can be deleted
- Sent/Paid invoices cannot be deleted (audit trail)
- Financial fields are immutable after invoice creation
- Payment validation prevents overpayments

---

## 📊 Business Logic & Workflows

### Invoice Lifecycle

```
Draft → Sent → Paid
  ↓       ↓
Cancelled  Overdue
```

**State Transitions:**
1. **Draft** - Initial state, editable, can be deleted
2. **Sent** - Manually changed when sent to client, cannot delete
3. **Paid** - Auto-set when payments ≥ total, immutable
4. **Overdue** - Manually set when past due and unpaid
5. **Cancelled** - Manually set to void invoice, cannot receive payments

### Payment Processing

**Partial Payments:**
- Supported by design
- Each payment is tracked separately
- Running balance calculated from sum of payments
- Invoice status auto-updates to "paid" when fully paid

**Example:**
```
Invoice Total: $3,000.00

Payment 1: $1,000.00 (2026-02-15) → Status: sent, Balance: $2,000
Payment 2: $1,500.00 (2026-03-01) → Status: sent, Balance: $500
Payment 3: $500.00  (2026-03-15) → Status: paid, Balance: $0
```

### Tax Calculation

**Configurable Tax Rate:**
- Per-invoice tax rate (supports 0% for tax-exempt)
- Tax calculated on subtotal before applying to total
- Precision: 2 decimal places with rounding

**Example:**
```
Line Item 1: $2,500.00
Line Item 2: $300.00
Subtotal: $2,800.00
Tax (8.5%): $238.00
Total: $3,038.00
```

---

## 🚀 Future Enhancements

### Phase 2 (Planned)

#### Client Invoice Portal
- Client-facing invoice list (`/client/billing`)
- Invoice detail view with payment history
- Download invoice as PDF
- Payment status tracking

#### PDF Generation
- Professional invoice templates
- Company branding and logo
- Line item breakdown
- Payment instructions and terms
- Email invoice as PDF attachment

#### Payment Gateway Integration
- Stripe integration for online payments
- Credit card payment support
- ACH/bank transfer support
- Payment confirmation emails
- Auto-record payments from gateway

### Phase 3 (Future)

#### Recurring Billing
- Subscription-based invoicing
- Auto-generate invoices on schedule
- Recurring payment tracking
- Dunning management for failed payments

#### Advanced Reporting
- Aging reports (30/60/90 days)
- Revenue reports by period
- Client payment history
- Tax reports for accounting
- Export to QuickBooks/accounting software

#### Email Automation
- Auto-send invoices when created
- Payment reminder emails
- Overdue notices
- Payment received confirmations
- Monthly statements

---

## 📋 Testing Checklist

### Invoice Creation
- [ ] Generate unique invoice numbers
- [ ] Calculate totals correctly with tax
- [ ] Create all line items in transaction
- [ ] Handle missing optional fields
- [ ] Validate positive amounts
- [ ] Fetch correct client from job

### Payment Recording
- [ ] Prevent overpayments
- [ ] Allow partial payments
- [ ] Update invoice status when fully paid
- [ ] Set paidDate on final payment
- [ ] Prevent payments to cancelled invoices
- [ ] Track payment method correctly

### Invoice Management
- [ ] List invoices with pagination
- [ ] Filter by status
- [ ] Get invoice with full details
- [ ] Update allowed fields only
- [ ] Prevent deletion of non-draft invoices
- [ ] Calculate remaining balance correctly

### Dashboard
- [ ] Display correct summary statistics
- [ ] Show recent invoices
- [ ] Color-code status badges
- [ ] Link to invoice details
- [ ] Refresh data on updates

---

## 📁 File Structure

```
src/
├── lib/db/schema/
│   └── invoices.ts                    # Database schema (3 tables)
│
├── modules/billing/
│   ├── types.ts                       # TypeScript interfaces
│   ├── schemas/
│   │   └── billing-schemas.ts         # Zod validation schemas
│   └── services/
│       └── invoice-service.ts         # Core business logic
│
└── app/
    ├── api/billing/
    │   ├── invoices/
    │   │   ├── route.ts              # POST/GET invoices
    │   │   └── [id]/
    │   │       ├── route.ts          # GET/PATCH/DELETE invoice
    │   │       └── payments/
    │   │           └── route.ts      # POST/GET payments
    │   └── summary/
    │       └── route.ts              # GET dashboard stats
    │
    └── hub/billing/
        └── page.tsx                   # Admin dashboard UI
```

---

## 🔗 Related Systems

### Integration Points

**Jobs System:**
- Invoice created from job ID
- Pulls client information from job
- References job number in invoice

**Email System:**
- Future: Send invoice PDFs
- Future: Payment confirmations
- Future: Overdue reminders

**User System:**
- Tracks who created invoice (`createdBy`)
- Tracks who recorded payment (`createdBy`)
- Audit trail for all financial actions

---

## 📝 Database Indexes

**Performance Optimizations:**
```sql
-- Invoices table
INDEX idx_invoice_number ON Invoices(invoice_number)
INDEX idx_job_id ON Invoices(job_id)
INDEX idx_status ON Invoices(status)
INDEX idx_due_date ON Invoices(due_date)

-- InvoiceLineItems table
INDEX idx_invoice_id ON Invoice_Line_Items(invoice_id)

-- Payments table
INDEX idx_invoice_id ON Payments(invoice_id)
INDEX idx_payment_date ON Payments(payment_date)
```

---

**Version:** 1.0.0
**Status:** MVP Complete (60%)
**Last Updated:** February 17, 2026
**Next Review:** February 24, 2026
