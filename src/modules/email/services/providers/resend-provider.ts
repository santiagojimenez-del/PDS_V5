import { Resend } from "resend";
import type { IEmailProvider, EmailOptions, EmailResult, EmailAddress } from "../../types";

/**
 * Resend Provider - For production
 * Requires RESEND_API_KEY environment variable
 * Free tier: 3,000 emails/month, 100 emails/day
 */
export class ResendProvider implements IEmailProvider {
  private client: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY environment variable is required for Resend provider"
      );
    }

    this.client = new Resend(apiKey);
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const to = Array.isArray(options.to) ? options.to : [options.to];
      const from = options.from || {
        email: process.env.EMAIL_FROM || "noreply@prodrones.local",
        name: process.env.EMAIL_FROM_NAME || "ProDrones Hub",
      };

      // Resend API expects different format
      const { data, error } = await this.client.emails.send({
        from: this.formatAddress(from),
        to: to.map((t) => this.formatAddress(t)),
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.map((c) => this.formatAddress(c))
            : [this.formatAddress(options.cc)]
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.map((b) => this.formatAddress(b))
            : [this.formatAddress(options.bcc)]
          : undefined,
        replyTo: options.replyTo ? this.formatAddress(options.replyTo) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          content_type: att.contentType,
        })),
      } as any);

      if (error) {
        console.error("❌ [Resend] Failed to send email:", error);
        return {
          success: false,
          error: error.message,
          provider: "resend",
        };
      }

      console.log(`✅ [Resend] Email sent successfully (ID: ${data?.id})`);

      return {
        success: true,
        messageId: data?.id,
        provider: "resend",
      };
    } catch (error) {
      console.error("❌ [Resend] Unexpected error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        provider: "resend",
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // Resend doesn't have a ping endpoint, but we can verify the API key
      // by checking if it's set and properly formatted
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey || !apiKey.startsWith("re_")) {
        console.warn("❌ [Resend] Invalid API key format");
        return false;
      }
      return true;
    } catch (error) {
      console.error("❌ [Resend] Connection verification failed:", error);
      return false;
    }
  }

  private formatAddress(addr: EmailAddress): string {
    return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
  }
}
