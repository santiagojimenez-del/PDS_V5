import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

/**
 * GET /api/emails/preview
 *
 * Retorna una página HTML simple para visualizar todos los emails enviados
 */
export async function GET(request: NextRequest) {
  try {
    const emails = await db
      .select({
        id: emailLog.id,
        provider: emailLog.provider,
        template: emailLog.template,
        toEmail: emailLog.toEmail,
        toName: emailLog.toName,
        subject: emailLog.subject,
        status: emailLog.status,
        previewUrl: emailLog.previewUrl,
        createdAt: emailLog.createdAt,
      })
      .from(emailLog)
      .orderBy(desc(emailLog.createdAt))
      .limit(50);

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ProDrones Hub - Email Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f6f9fc;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #8600FB;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .email-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .email-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .email-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .email-subject {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
    .email-meta {
      display: flex;
      gap: 15px;
      font-size: 13px;
      color: #666;
      margin-bottom: 10px;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge.sent { background: #d4edda; color: #155724; }
    .badge.failed { background: #f8d7da; color: #721c24; }
    .badge.pending { background: #fff3cd; color: #856404; }
    .badge.template { background: #e7f3ff; color: #004085; }
    .badge.provider { background: #f0f0f0; color: #333; }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    .btn:hover {
      opacity: 0.8;
    }
    .btn-primary {
      background: #8600FB;
      color: white;
    }
    .btn-secondary {
      background: #e9ecef;
      color: #333;
    }
    .empty {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #8600FB;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📧 Email Preview</h1>
    <p class="subtitle">Todos los emails enviados desde ProDrones Hub</p>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${emails.length}</div>
        <div class="stat-label">Emails Enviados</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${emails.filter((e) => e.status === "sent").length}</div>
        <div class="stat-label">Exitosos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${emails.filter((e) => e.status === "failed").length}</div>
        <div class="stat-label">Fallidos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${emails.filter((e) => e.template).length}</div>
        <div class="stat-label">Con Template</div>
      </div>
    </div>

    ${
      emails.length === 0
        ? '<div class="empty">No hay emails enviados aún. Ejecuta <code>npm run test:email</code> para enviar emails de prueba.</div>'
        : emails
            .map(
              (email) => `
        <div class="email-card">
          <div class="email-header">
            <div class="email-subject">${email.subject}</div>
            <span class="badge ${email.status}">${email.status}</span>
          </div>
          <div class="email-meta">
            <span><strong>Para:</strong> ${email.toName || email.toEmail}</span>
            <span><strong>Fecha:</strong> ${new Date(email.createdAt).toLocaleString("es-ES")}</span>
            ${email.template ? `<span class="badge template">${email.template}</span>` : ""}
            <span class="badge provider">${email.provider}</span>
          </div>
          <div class="actions">
            ${
              email.template
                ? `<a href="/api/emails/${email.id}?format=html" target="_blank" class="btn btn-primary">Ver HTML</a>`
                : ""
            }
            ${
              email.previewUrl
                ? `<a href="${email.previewUrl}" target="_blank" class="btn btn-primary">Ver en Ethereal</a>`
                : ""
            }
            <a href="/api/emails/${email.id}" target="_blank" class="btn btn-secondary">Ver JSON</a>
          </div>
        </div>
      `
            )
            .join("")
    }
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[GET /api/emails/preview] Error:", error);
    return new NextResponse(
      `<h1>Error</h1><p>${error instanceof Error ? error.message : "Unknown error"}</p>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
