import sgMail from "@sendgrid/mail";
import type { IEmailProvider, EmailOptions, EmailResult, EmailAddress } from "../../types";

/**
 * SendGrid Provider - Alternative production provider
 * Requires SENDGRID_API_KEY environment variable
 * Free tier: 100 emails/day
 */
export class SendGridProvider implements IEmailProvider {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      throw new Error(
        "SENDGRID_API_KEY environment variable is required for SendGrid provider"
      );
    }

    sgMail.setApiKey(apiKey);
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const to = Array.isArray(options.to) ? options.to : [options.to];
      const from = options.from || {
        email: process.env.EMAIL_FROM || "noreply@prodrones.local",
        name: process.env.EMAIL_FROM_NAME || "ProDrones Hub",
      };

      const msg: any = {
        to: to.map((t) => ({ email: t.email, name: t.name })),
        from: { email: from.email, name: from.name },
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.map((c) => ({ email: c.email, name: c.name }))
            : [{ email: options.cc.email, name: options.cc.name }]
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.map((b) => ({ email: b.email, name: b.name }))
            : [{ email: options.bcc.email, name: options.bcc.name }]
          : undefined,
        replyTo: options.replyTo
          ? { email: options.replyTo.email, name: options.replyTo.name }
          : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content)
            ? att.content.toString("base64")
            : att.content,
          type: att.contentType,
          disposition: "attachment",
        })),
      };

      const [response] = await sgMail.send(msg as any);

      console.log(`✅ [SendGrid] Email sent successfully (Status: ${response.statusCode})`);

      return {
        success: true,
        messageId: response.headers["x-message-id"] as string,
        provider: "sendgrid",
      };
    } catch (error: any) {
      console.error("❌ [SendGrid] Failed to send email:", error);

      let errorMessage = "Unknown error";
      if (error.response) {
        errorMessage = error.response.body?.errors?.[0]?.message || error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        provider: "sendgrid",
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // SendGrid doesn't have a ping endpoint, but we can verify the API key format
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey || !apiKey.startsWith("SG.")) {
        console.warn("❌ [SendGrid] Invalid API key format");
        return false;
      }
      return true;
    } catch (error) {
      console.error("❌ [SendGrid] Connection verification failed:", error);
      return false;
    }
  }
}
