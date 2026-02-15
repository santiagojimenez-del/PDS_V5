/**
 * Email System Test Script
 *
 * Usage:
 *   tsx scripts/test-email.ts
 *
 * Make sure to set EMAIL_PROVIDER in your .env file:
 *   - ethereal: Development testing (generates preview URLs)
 *   - console: Local development (just logs to console)
 *   - resend: Production (requires RESEND_API_KEY)
 */

import { emailService } from "../src/modules/email";

async function testEmailSystem() {
  console.log("🧪 Testing ProDrones Hub Email System\n");
  console.log("=" .repeat(80));

  try {
    // Initialize email service
    await emailService.initialize();
    console.log("✅ Email service initialized\n");

    // Test 1: Raw email
    console.log("📧 Test 1: Sending raw email...");
    const rawResult = await emailService.send({
      to: {
        email: "test@example.com",
        name: "Test User",
      },
      subject: "Test Email from ProDrones Hub",
      html: "<h1>Hello!</h1><p>This is a test email from ProDrones Hub.</p>",
      text: "Hello! This is a test email from ProDrones Hub.",
    });

    if (rawResult.success) {
      console.log("✅ Raw email sent successfully");
      if (rawResult.previewUrl) {
        console.log(`   Preview: ${rawResult.previewUrl}`);
      }
    } else {
      console.log("❌ Raw email failed:", rawResult.error);
    }
    console.log();

    // Test 2: 2FA Code Email
    console.log("📧 Test 2: Sending 2FA code template...");
    const twoFAResult = await emailService.sendTemplate({
      to: {
        email: "pilot@example.com",
        name: "Juan Pérez",
      },
      template: "2fa-code",
      data: {
        code: "123456",
        userName: "Juan Pérez",
        expiresInMinutes: 10,
      },
    });

    if (twoFAResult.success) {
      console.log("✅ 2FA email sent successfully");
      if (twoFAResult.previewUrl) {
        console.log(`   Preview: ${twoFAResult.previewUrl}`);
      }
    } else {
      console.log("❌ 2FA email failed:", twoFAResult.error);
    }
    console.log();

    // Test 3: Password Reset Email
    console.log("📧 Test 3: Sending password reset template...");
    const resetResult = await emailService.sendTemplate({
      to: {
        email: "user@example.com",
        name: "María González",
      },
      template: "reset-password",
      data: {
        userName: "María González",
        resetLink: "https://prodrones.com/reset-password?token=abc123xyz",
        expiresInHours: 24,
      },
    });

    if (resetResult.success) {
      console.log("✅ Password reset email sent successfully");
      if (resetResult.previewUrl) {
        console.log(`   Preview: ${resetResult.previewUrl}`);
      }
    } else {
      console.log("❌ Password reset email failed:", resetResult.error);
    }
    console.log();

    // Test 4: Pilot Notification
    console.log("📧 Test 4: Sending pilot notification template...");
    const pilotResult = await emailService.sendTemplate({
      to: {
        email: "pilot@example.com",
        name: "Carlos Ramírez",
      },
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

    if (pilotResult.success) {
      console.log("✅ Pilot notification sent successfully");
      if (pilotResult.previewUrl) {
        console.log(`   Preview: ${pilotResult.previewUrl}`);
      }
    } else {
      console.log("❌ Pilot notification failed:", pilotResult.error);
    }
    console.log();

    // Test 5: Delivery Notification
    console.log("📧 Test 5: Sending delivery notification template...");
    const deliveryResult = await emailService.sendTemplate({
      to: {
        email: "client@example.com",
        name: "Empresa ABC",
      },
      template: "delivery-notification",
      data: {
        clientName: "Empresa ABC",
        jobId: 456,
        jobTitle: "Ortomosaico Finca Rural",
        deliveryDate: "2026-02-15 14:30",
        downloadLink: "https://prodrones.com/download/abc123",
      },
    });

    if (deliveryResult.success) {
      console.log("✅ Delivery notification sent successfully");
      if (deliveryResult.previewUrl) {
        console.log(`   Preview: ${deliveryResult.previewUrl}`);
      }
    } else {
      console.log("❌ Delivery notification failed:", deliveryResult.error);
    }
    console.log();

    console.log("=" .repeat(80));
    console.log("✅ All email tests completed!\n");
    console.log("💡 Check your Email_Log table in the database to see logged emails.");

  } catch (error) {
    console.error("\n❌ Email test failed:", error);
    process.exit(1);
  }
}

// Run tests
testEmailSystem();
