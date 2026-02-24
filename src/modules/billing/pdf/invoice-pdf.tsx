import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { InvoiceWithDetails } from "@/modules/billing/types";

// Register a fallback font (system font)
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 50,
    color: "#111827",
  },
  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 16,
  },
  companyName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
  },
  companySubtitle: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  invoiceTitleBlock: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  invoiceNumber: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#ffffff",
  },
  // ── Parties ──────────────────────────────────────────────────────────────────
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  partyBlock: {
    width: "45%",
  },
  partyLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  partyDetail: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 1,
  },
  // ── Dates row ───────────────────────────────────────────────────────────────
  datesRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    padding: 12,
    marginBottom: 24,
    gap: 24,
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 8,
    color: "#6b7280",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  // ── Line items table ─────────────────────────────────────────────────────────
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e40af",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 1,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  colDesc: { flex: 1 },
  colQty: { width: 50, textAlign: "right" },
  colPrice: { width: 70, textAlign: "right" },
  colAmount: { width: 70, textAlign: "right" },
  cellText: { fontSize: 9 },
  // ── Totals ───────────────────────────────────────────────────────────────────
  totalsContainer: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  totalsBox: {
    width: 220,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsLabel: {
    fontSize: 9,
    color: "#6b7280",
  },
  totalsValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  totalRowHighlight: {
    borderTopWidth: 1.5,
    borderTopColor: "#111827",
    marginTop: 4,
    paddingTop: 6,
  },
  totalLabelHighlight: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  totalValueHighlight: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
  },
  // ── Payment status ────────────────────────────────────────────────────────────
  paidBanner: {
    backgroundColor: "#dcfce7",
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paidBannerText: {
    fontSize: 10,
    color: "#15803d",
    fontFamily: "Helvetica-Bold",
  },
  amountDueBanner: {
    backgroundColor: "#fff7ed",
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountDueText: {
    fontSize: 10,
    color: "#c2410c",
    fontFamily: "Helvetica-Bold",
  },
  // ── Notes / Terms ─────────────────────────────────────────────────────────────
  notesSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.5,
  },
  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
});

function fmt(amount: string | number): string {
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

function fmtDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  sent: "#2563eb",
  paid: "#16a34a",
  overdue: "#dc2626",
  cancelled: "#9ca3af",
};

interface InvoicePDFProps {
  invoice: InvoiceWithDetails;
  companyName: string;
}

export function InvoicePDF({ invoice, companyName }: InvoicePDFProps) {
  const statusColor = STATUS_COLORS[invoice.status] ?? "#6b7280";
  const amountDue = parseFloat(invoice.amountDue);
  const isPaid = invoice.status === "paid" || amountDue <= 0;

  return (
    <Document
      title={`Invoice ${invoice.invoiceNumber}`}
      author={companyName}
      creator={companyName}
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companySubtitle}>Drone Services & Aerial Operations</Text>
          </View>
          <View style={styles.invoiceTitleBlock}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* ── Parties ── */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>From</Text>
            <Text style={styles.partyName}>{companyName}</Text>
            <Text style={styles.partyDetail}>Professional Drone Services</Text>
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Bill To</Text>
            <Text style={styles.partyName}>{invoice.clientName}</Text>
            {invoice.jobName && (
              <Text style={styles.partyDetail}>Job: {invoice.jobName}</Text>
            )}
            {invoice.siteName && (
              <Text style={styles.partyDetail}>Site: {invoice.siteName}</Text>
            )}
          </View>
        </View>

        {/* ── Dates ── */}
        <View style={styles.datesRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Issue Date</Text>
            <Text style={styles.dateValue}>{fmtDate(invoice.issueDate)}</Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Text style={styles.dateValue}>{fmtDate(invoice.dueDate)}</Text>
          </View>
          {invoice.paidDate && (
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Paid Date</Text>
              <Text style={[styles.dateValue, { color: "#16a34a" }]}>
                {fmtDate(invoice.paidDate)}
              </Text>
            </View>
          )}
        </View>

        {/* ── Line Items ── */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
          </View>
          {invoice.lineItems.map((item, i) => (
            <View
              key={item.id}
              style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.cellText, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.cellText, styles.colPrice]}>{fmt(item.unitPrice)}</Text>
              <Text style={[styles.cellText, styles.colAmount]}>{fmt(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{fmt(invoice.subtotal)}</Text>
            </View>
            {parseFloat(invoice.taxRate) > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>
                  Tax ({parseFloat(invoice.taxRate).toFixed(0)}%)
                </Text>
                <Text style={styles.totalsValue}>{fmt(invoice.taxAmount)}</Text>
              </View>
            )}
            <View style={[styles.totalsRow, styles.totalRowHighlight]}>
              <Text style={styles.totalLabelHighlight}>Total</Text>
              <Text style={styles.totalValueHighlight}>{fmt(invoice.total)}</Text>
            </View>
            {parseFloat(invoice.totalPaid) > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Paid</Text>
                <Text style={[styles.totalsValue, { color: "#16a34a" }]}>
                  − {fmt(invoice.totalPaid)}
                </Text>
              </View>
            )}
            {parseFloat(invoice.totalPaid) > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Balance Due</Text>
                <Text
                  style={[
                    styles.totalsValue,
                    { color: amountDue <= 0 ? "#16a34a" : "#dc2626" },
                  ]}
                >
                  {fmt(invoice.amountDue)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Payment Status Banner ── */}
        {isPaid ? (
          <View style={styles.paidBanner}>
            <Text style={styles.paidBannerText}>✓ PAID IN FULL</Text>
            {invoice.paidDate && (
              <Text style={styles.paidBannerText}>{fmtDate(invoice.paidDate)}</Text>
            )}
          </View>
        ) : amountDue > 0 ? (
          <View style={styles.amountDueBanner}>
            <Text style={styles.amountDueText}>Amount Due: {fmt(invoice.amountDue)}</Text>
            <Text style={styles.amountDueText}>Due: {fmtDate(invoice.dueDate)}</Text>
          </View>
        ) : null}

        {/* ── Notes ── */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.sectionText}>{invoice.notes}</Text>
          </View>
        )}

        {/* ── Terms & Conditions ── */}
        {invoice.termsAndConditions && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Terms & Conditions</Text>
            <Text style={styles.sectionText}>{invoice.termsAndConditions}</Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{companyName} · Invoice {invoice.invoiceNumber}</Text>
          <Text style={styles.footerText}>
            Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
