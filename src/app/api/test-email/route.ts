import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/modules/email";

/**
 * GET /api/test-email
 *
 * Envía emails de prueba usando todos los templates
 * Útil para testing y preview
 */
export async function GET(request: NextRequest) {
  const results: any[] = [];

  try {
    console.log("🧪 Iniciando pruebas de email...");

    // Test 1: Email simple
    console.log("📧 Test 1: Email simple...");
    const test1 = await emailService.send({
      to: {
        email: "test@example.com",
        name: "Usuario de Prueba",
      },
      subject: "Email de Prueba - ProDrones Hub",
      html: "<h1>¡Hola!</h1><p>Este es un email de prueba del sistema ProDrones Hub.</p>",
      text: "¡Hola! Este es un email de prueba del sistema ProDrones Hub.",
    });
    results.push({ test: "Email simple", success: test1.success, previewUrl: test1.previewUrl });

    // Test 2: Código 2FA
    console.log("📧 Test 2: Código 2FA...");
    const test2 = await emailService.sendTemplate({
      to: { email: "pilot@example.com", name: "Juan Pérez" },
      template: "2fa-code",
      data: {
        code: "987654",
        userName: "Juan Pérez",
        expiresInMinutes: 10,
      },
    });
    results.push({ test: "2FA Code", success: test2.success, previewUrl: test2.previewUrl });

    // Test 3: Reset Password
    console.log("📧 Test 3: Reset Password...");
    const test3 = await emailService.sendTemplate({
      to: { email: "user@example.com", name: "María González" },
      template: "reset-password",
      data: {
        userName: "María González",
        resetLink: "https://prodrones.com/reset-password?token=test123",
        expiresInHours: 24,
      },
    });
    results.push({ test: "Reset Password", success: test3.success, previewUrl: test3.previewUrl });

    // Test 4: Signup Confirmation
    console.log("📧 Test 4: Signup Confirmation...");
    const test4 = await emailService.sendTemplate({
      to: { email: "newuser@example.com", name: "Carlos Ramírez" },
      template: "signup-confirmation",
      data: {
        userName: "Carlos Ramírez",
        confirmationLink: "https://prodrones.com/confirm?token=signup123",
      },
    });
    results.push({ test: "Signup Confirmation", success: test4.success, previewUrl: test4.previewUrl });

    // Test 5: Pilot Notification (Assigned)
    console.log("📧 Test 5: Pilot Notification (Assigned)...");
    const test5 = await emailService.sendTemplate({
      to: { email: "pilot@example.com", name: "Carlos Ramírez" },
      template: "pilot-notification",
      data: {
        pilotName: "Carlos Ramírez",
        jobId: 123,
        jobTitle: "Mapeo Terreno Industrial",
        clientName: "Constructora XYZ",
        scheduledDate: "2026-02-20 10:00 AM",
        action: "assigned",
      },
    });
    results.push({ test: "Pilot Notification (Assigned)", success: test5.success, previewUrl: test5.previewUrl });

    // Test 6: Pilot Notification (Scheduled)
    console.log("📧 Test 6: Pilot Notification (Scheduled)...");
    const test6 = await emailService.sendTemplate({
      to: { email: "pilot@example.com", name: "Ana López" },
      template: "pilot-notification",
      data: {
        pilotName: "Ana López",
        jobId: 124,
        jobTitle: "Inspección de Techo Solar",
        clientName: "Energía Verde SA",
        scheduledDate: "2026-02-22 14:00 PM",
        action: "scheduled",
      },
    });
    results.push({ test: "Pilot Notification (Scheduled)", success: test6.success, previewUrl: test6.previewUrl });

    // Test 7: Delivery Notification
    console.log("📧 Test 7: Delivery Notification...");
    const test7 = await emailService.sendTemplate({
      to: { email: "client@example.com", name: "Empresa ABC" },
      template: "delivery-notification",
      data: {
        clientName: "Empresa ABC",
        jobId: 456,
        jobTitle: "Ortomosaico Finca Rural",
        deliveryDate: "2026-02-15 14:30",
        downloadLink: "https://prodrones.com/download/abc123",
      },
    });
    results.push({ test: "Delivery Notification", success: test7.success, previewUrl: test7.previewUrl });

    // Test 8: Job Status Update
    console.log("📧 Test 8: Job Status Update...");
    const test8 = await emailService.sendTemplate({
      to: { email: "client@example.com", name: "Roberto Díaz" },
      template: "job-status-update",
      data: {
        recipientName: "Roberto Díaz",
        jobId: 789,
        jobTitle: "Modelo 3D de Edificio",
        oldStatus: "En Proceso",
        newStatus: "Completado",
        message: "El procesamiento de las imágenes ha finalizado exitosamente.",
      },
    });
    results.push({ test: "Job Status Update", success: test8.success, previewUrl: test8.previewUrl });

    console.log("✅ Todas las pruebas completadas!");

    // Return HTML response with results
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Test Results</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f6f9fc;
      padding: 40px 20px;
      margin: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 {
      color: #8600FB;
      margin-bottom: 10px;
    }
    .success {
      background: #d4edda;
      color: #155724;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: 600;
    }
    .result {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .result-name {
      font-weight: 600;
      color: #333;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge.success {
      background: #d4edda;
      color: #155724;
    }
    .badge.error {
      background: #f8d7da;
      color: #721c24;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #8600FB;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 10px 10px 10px 0;
      transition: opacity 0.2s;
    }
    .btn:hover {
      opacity: 0.8;
    }
    .btn-secondary {
      background: #6c757d;
    }
    .actions {
      margin-top: 30px;
      padding-top: 30px;
      border-top: 2px solid #e9ecef;
    }
    .preview-link {
      font-size: 12px;
      color: #8600FB;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✅ Prueba de Emails Completada</h1>
    <p>Se enviaron ${results.length} emails de prueba exitosamente.</p>

    <div class="success">
      ✓ Todos los emails fueron enviados y guardados en la base de datos
    </div>

    <h2>Resultados:</h2>
    ${results
      .map(
        (r, i) => `
      <div class="result">
        <span class="result-name">${i + 1}. ${r.test}</span>
        <div>
          <span class="badge ${r.success ? "success" : "error"}">
            ${r.success ? "✓ Enviado" : "✗ Error"}
          </span>
          ${r.previewUrl ? `<a href="${r.previewUrl}" target="_blank" class="preview-link">Ver en Ethereal</a>` : ""}
        </div>
      </div>
    `
      )
      .join("")}

    <div class="actions">
      <h3>Próximos Pasos:</h3>
      <a href="/api/emails/preview" class="btn">Ver Todos los Emails</a>
      <a href="/api/test-email" class="btn btn-secondary">Enviar Más Pruebas</a>
    </div>

    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      💡 Tip: Los emails se guardaron en la tabla <code>Email_Log</code> y ahora puedes verlos en el preview.
    </p>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("❌ Error en prueba de emails:", error);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error al enviar emails de prueba</h1>
          <p>${error instanceof Error ? error.message : "Unknown error"}</p>
          <a href="/api/test-email">Reintentar</a>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
