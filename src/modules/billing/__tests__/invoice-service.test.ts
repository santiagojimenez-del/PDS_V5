import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateInvoiceTotals, generateInvoiceNumber } from "../services/invoice-service";

// ── DB mock ───────────────────────────────────────────────────────────────────
// vi.mock() is hoisted to the top of the file by Vitest, so any variable it
// references must also be hoisted with vi.hoisted() to avoid TDZ errors.

const dbSelectMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: { select: dbSelectMock },
}));

// Schema exports are pure table-definition objects — no mock needed for the
// pure calculateInvoiceTotals tests, and for generateInvoiceNumber we only
// need the chain mock to intercept the query before it reaches MySQL.
vi.mock("@/lib/db/schema", () => ({
  invoices: { invoiceNumber: "invoiceNumber" },
  invoiceLineItems: {},
  payments: {},
  jobs: {},
  organization: {},
  users: {},
  userMeta: {},
}));

/** Helper: makes dbSelectMock return a fully-chainable mock that resolves to `rows` at .limit() */
function mockDbReturning(rows: unknown[]) {
  const chain = {
    from:    vi.fn().mockReturnThis(),
    where:   vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit:   vi.fn().mockResolvedValue(rows),
  };
  dbSelectMock.mockReturnValueOnce(chain);
  return chain;
}

// ── calculateInvoiceTotals ────────────────────────────────────────────────────

describe("calculateInvoiceTotals", () => {
  it("returns zeros for an empty line-item list", () => {
    const result = calculateInvoiceTotals([]);
    expect(result).toEqual({ subtotal: 0, taxAmount: 0, total: 0 });
  });

  it("calculates a single item with no tax", () => {
    const result = calculateInvoiceTotals([{ quantity: 2, unitPrice: 50 }]);
    expect(result).toEqual({ subtotal: 100, taxAmount: 0, total: 100 });
  });

  it("sums multiple line items correctly", () => {
    const result = calculateInvoiceTotals([
      { quantity: 1, unitPrice: 100 },
      { quantity: 3, unitPrice: 25 },
      { quantity: 2, unitPrice: 10 },
    ]);
    // 100 + 75 + 20 = 195
    expect(result.subtotal).toBe(195);
    expect(result.total).toBe(195);
  });

  it("applies tax rate to subtotal", () => {
    const result = calculateInvoiceTotals([{ quantity: 1, unitPrice: 200 }], 10);
    expect(result.subtotal).toBe(200);
    expect(result.taxAmount).toBe(20);
    expect(result.total).toBe(220);
  });

  it("defaults tax rate to 0 when omitted", () => {
    const result = calculateInvoiceTotals([{ quantity: 5, unitPrice: 40 }]);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(200);
  });

  it("rounds all values to 2 decimal places", () => {
    // 1 × 9.999 = 9.999 → subtotal 10, taxAmount 0, total 10
    const result = calculateInvoiceTotals([{ quantity: 1, unitPrice: 9.999 }], 10);
    expect(result.subtotal).toBe(10);          // Math.round(9.999 * 100)/100
    expect(result.taxAmount).toBe(1);           // Math.round(0.9999 * 100)/100
    expect(result.total).toBe(11);
  });

  it("handles floating-point accumulation without drift", () => {
    // 0.1 + 0.2 is famously imprecise in JS — rounding must clean it up
    const result = calculateInvoiceTotals([
      { quantity: 1, unitPrice: 0.1 },
      { quantity: 1, unitPrice: 0.2 },
    ]);
    expect(result.subtotal).toBe(0.3);
  });

  it("handles a 100% tax rate", () => {
    const result = calculateInvoiceTotals([{ quantity: 1, unitPrice: 500 }], 100);
    expect(result.taxAmount).toBe(500);
    expect(result.total).toBe(1000);
  });

  it("zero-quantity items contribute nothing to the total", () => {
    const result = calculateInvoiceTotals([
      { quantity: 0, unitPrice: 999 },
      { quantity: 1, unitPrice: 50 },
    ]);
    expect(result.subtotal).toBe(50);
  });

  it("handles large amounts without overflow", () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 10_000, unitPrice: 99_999.99 }],
      15
    );
    expect(result.subtotal).toBe(999_999_900);
    expect(result.taxAmount).toBe(149_999_985);
    expect(result.total).toBe(1_149_999_885);
  });
});

// ── generateInvoiceNumber ─────────────────────────────────────────────────────

describe("generateInvoiceNumber", () => {
  const year = new Date().getFullYear();

  beforeEach(() => {
    dbSelectMock.mockReset();
  });

  it("starts at 0001 when no invoices exist for the year", async () => {
    mockDbReturning([]); // empty result = no invoices yet
    const result = await generateInvoiceNumber();
    expect(result).toBe(`INV-${year}-0001`);
  });

  it("increments from the last invoice number", async () => {
    mockDbReturning([{ invoiceNumber: `INV-${year}-0003` }]);
    const result = await generateInvoiceNumber();
    expect(result).toBe(`INV-${year}-0004`);
  });

  it("pads the sequence number to 4 digits", async () => {
    mockDbReturning([{ invoiceNumber: `INV-${year}-0009` }]);
    const result = await generateInvoiceNumber();
    expect(result).toBe(`INV-${year}-0010`);
  });

  it("handles crossing a round hundred correctly", async () => {
    mockDbReturning([{ invoiceNumber: `INV-${year}-0099` }]);
    const result = await generateInvoiceNumber();
    expect(result).toBe(`INV-${year}-0100`);
  });

  it("produces the correct INV-YYYY-NNNN format", async () => {
    mockDbReturning([]);
    const result = await generateInvoiceNumber();
    expect(result).toMatch(/^INV-\d{4}-\d{4}$/);
  });
});
