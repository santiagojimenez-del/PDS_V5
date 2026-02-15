import nodemailer from "nodemailer";
import type { IEmailProvider, EmailOptions, EmailResult, EmailAddress } from "../../types";

/**
 * Ethereal Provider - For development testing
 * Creates fake SMTP test accounts and provides preview URLs
 * Emails don't actually send but you can view them at ethereal.email
 */
export class EtherealProvider implements IEmailProvider {
  private transporter: any = null;
  private testAccount: any = null;

  async initialize(): Promise<void> {
    if (this.transporter) return;

    // Create a test account (or use cached credentials)
    this.testAccount = await nodemailer.createTestAccount();

    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: this.testAccount.user,
        pass: this.testAccount.pass,
      },
    });

    console.log("🌐 [Ethereal] Test account created:");
    console.log(`   User: ${this.testAccount.user}`);
    console.log(`   Pass: ${this.testAccount.pass}`);
    console.log(`   View emails at: https://ethereal.email/messages`);
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    await this.initialize();

    try {
      const to = Array.isArray(options.to) ? options.to : [options.to];
      const from = options.from || {
        email: "noreply@prodrones.local",
        name: "ProDrones Hub",
      };

      const info = await this.transporter.sendMail({
        from: this.formatAddress(from),
        to: to.map((t) => this.formatAddress(t)).join(", "),
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.map((c) => this.formatAddress(c)).join(", ")
            : this.formatAddress(options.cc)
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.map((b) => this.formatAddress(b)).join(", ")
            : this.formatAddress(options.bcc)
          : undefined,
        replyTo: options.replyTo ? this.formatAddress(options.replyTo) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);

      console.log(`✅ [Ethereal] Email sent successfully`);
      console.log(`   Preview: ${previewUrl}`);

      return {
        success: true,
        messageId: info.messageId,
        provider: "ethereal",
        previewUrl: previewUrl || undefined,
      };
    } catch (error) {
      console.error("❌ [Ethereal] Failed to send email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        provider: "ethereal",
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.initialize();
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("❌ [Ethereal] Connection verification failed:", error);
      return false;
    }
  }

  private formatAddress(addr: EmailAddress): string {
    return addr.name ? `"${addr.name}" <${addr.email}>` : addr.email;
  }
}
