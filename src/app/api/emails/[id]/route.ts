import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { templateEngine } from "@/modules/email/templates/template-engine";

/**
 * GET /api/emails/[id]
 *
 * Obtiene los detalles de un email específico
 * Query params:
 *   - format: 'json' (default) | 'html' - Si es 'html', retorna el HTML renderizado
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid email ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    const [email] = await db
      .select()
      .from(emailLog)
      .where(eq(emailLog.id, id))
      .limit(1);

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email not found" },
        { status: 404 }
      );
    }

    // If format is HTML and we have template data, re-render the template
    if (format === "html") {
      if (email.template && email.templateData) {
        try {
          const { html } = await templateEngine.renderTemplate(
            email.template as any,
            email.templateData as any
          );

          return new NextResponse(html, {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
            },
          });
        } catch (error) {
          // If template rendering fails, return error page
          return new NextResponse(
            `
            <!DOCTYPE html>
            <html>
              <head><title>Error</title></head>
              <body>
                <h1>Error rendering template</h1>
                <p>${error instanceof Error ? error.message : "Unknown error"}</p>
                <p><a href="/api/emails/${id}">View as JSON</a></p>
              </body>
            </html>
            `,
            {
              headers: { "Content-Type": "text/html; charset=utf-8" },
            }
          );
        }
      } else {
        return new NextResponse(
          `
          <!DOCTYPE html>
          <html>
            <head><title>No template data</title></head>
            <body>
              <h1>No template data available</h1>
              <p>This email was sent without a template or the template data was not saved.</p>
              <p><a href="/api/emails/${id}">View as JSON</a></p>
            </body>
          </html>
          `,
          {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }
        );
      }
    }

    // Return JSON format
    return NextResponse.json({
      success: true,
      data: email,
    });
  } catch (error) {
    console.error(`[GET /api/emails/[id]] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
