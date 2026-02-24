import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { withAuth } from "@/lib/auth/middleware";
import { getInvoiceWithDetails } from "@/modules/billing/services/invoice-service";
import { getConfigValue } from "@/modules/config/services/config-loader";
import { InvoicePDF } from "@/modules/billing/pdf/invoice-pdf";

function extractInvoiceId(req: NextRequest): number | null {
  const segments = new URL(req.url).pathname.split("/");
  // path: /api/billing/invoices/[id]/pdf → id is at segments[-2]
  const id = parseInt(segments[segments.length - 2]);
  return isNaN(id) ? null : id;
}

/**
 * GET /api/billing/invoices/[id]/pdf
 * Generates and streams a PDF for the invoice.
 */
export const GET = withAuth(async (_user, req: NextRequest) => {
  const invoiceId = extractInvoiceId(req);
  if (!invoiceId) {
    return new NextResponse("Invalid invoice ID", { status: 400 });
  }

  try {
    const [invoice, siteTitle] = await Promise.all([
      getInvoiceWithDetails(invoiceId),
      getConfigValue<string>("hub", "site_title"),
    ]);

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    const companyName = siteTitle || "ProDrones";

    const element = React.createElement(InvoicePDF, { invoice, companyName }) as any;
    const buffer = await renderToBuffer(element);

    const filename = `invoice-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;

    // Copy to a clean ArrayBuffer for NextResponse compatibility
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[Billing PDF] Generate PDF error:", error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
});
