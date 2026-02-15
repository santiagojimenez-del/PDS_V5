import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

/**
 * GET /api/emails
 *
 * Lista todos los emails enviados
 * Query params:
 *   - limit: número de emails a retornar (default: 20)
 *   - offset: offset para paginación (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const emails = await db
      .select({
        id: emailLog.id,
        provider: emailLog.provider,
        template: emailLog.template,
        toEmail: emailLog.toEmail,
        toName: emailLog.toName,
        fromEmail: emailLog.fromEmail,
        fromName: emailLog.fromName,
        subject: emailLog.subject,
        status: emailLog.status,
        messageId: emailLog.messageId,
        previewUrl: emailLog.previewUrl,
        createdAt: emailLog.createdAt,
        sentAt: emailLog.sentAt,
        error: emailLog.error,
      })
      .from(emailLog)
      .orderBy(desc(emailLog.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: emailLog.id })
      .from(emailLog);
    const total = totalResult.length;

    return NextResponse.json({
      success: true,
      data: {
        emails,
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("[GET /api/emails] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
