import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";
import type {
  EmailOptions,
  EmailResult,
  IEmailProvider,
  EmailProvider,
  SendTemplateEmailOptions,
  EmailTemplate,
} from "../types";

// ── Email Service ────────────────────────────────────────────────────────────

class EmailService {
  private provider: IEmailProvider | null = null;
  private currentProvider: EmailProvider = "console";

  /**
   * Initialize the email service with a specific provider
   */
  async initialize(provider?: IEmailProvider): Promise<void> {
    if (provider) {
      this.provider = provider;
      return;
    }

    // Auto-initialize based on environment
    const providerType = (process.env.EMAIL_PROVIDER || "console") as EmailProvider;
    this.currentProvider = providerType;

    // Dynamic import to avoid loading all providers
    switch (providerType) {
      case "ethereal":
        const { EtherealProvider } = await import("./providers/ethereal-provider");
        this.provider = new EtherealProvider();
        break;
      case "resend":
        const { ResendProvider } = await import("./providers/resend-provider");
        this.provider = new ResendProvider();
        break;
      case "sendgrid":
        const { SendGridProvider } = await import("./providers/sendgrid-provider");
        this.provider = new SendGridProvider();
        break;
      case "console":
      default:
        const { ConsoleProvider } = await import("./providers/console-provider");
        this.provider = new ConsoleProvider();
        break;
    }

    // Verify connection if provider supports it
    if (this.provider.verifyConnection) {
      const connected = await this.provider.verifyConnection();
      if (!connected) {
        console.warn(`[EmailService] Could not verify connection to ${providerType}`);
      }
    }
  }

  /**
   * Send a raw email
   */
  async send(
    options: EmailOptions,
    metadata?: { template?: string; templateData?: any; jobId?: number; userId?: number }
  ): Promise<EmailResult> {
    if (!this.provider) {
      await this.initialize();
    }

    // Set default from address if not provided
    if (!options.from) {
      options.from = {
        email: process.env.EMAIL_FROM || "noreply@prodrones.local",
        name: process.env.EMAIL_FROM_NAME || "ProDrones Hub",
      };
    }

    try {
      // Send email via provider
      const result = await this.provider!.send(options);

      // Log to database
      await this.logEmail({
        provider: result.provider,
        template: metadata?.template || null,
        toEmail: Array.isArray(options.to) ? options.to[0].email : options.to.email,
        toName: Array.isArray(options.to) ? options.to[0].name : options.to.name,
        fromEmail: options.from.email,
        fromName: options.from.name,
        subject: options.subject,
        status: result.success ? "sent" : "failed",
        messageId: result.messageId,
        error: result.error,
        previewUrl: result.previewUrl,
        templateData: metadata?.templateData || null,
        metadata: metadata ? { jobId: metadata.jobId, userId: metadata.userId } : null,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Log failed attempt
      await this.logEmail({
        provider: this.currentProvider,
        template: metadata?.template || null,
        toEmail: Array.isArray(options.to) ? options.to[0].email : options.to.email,
        toName: Array.isArray(options.to) ? options.to[0].name : options.to.name,
        fromEmail: options.from!.email,
        fromName: options.from!.name,
        subject: options.subject,
        status: "failed",
        error: errorMessage,
        templateData: metadata?.templateData || null,
        metadata: metadata ? { jobId: metadata.jobId, userId: metadata.userId } : null,
      });

      return {
        success: false,
        error: errorMessage,
        provider: this.currentProvider,
      };
    }
  }

  /**
   * Send a templated email
   */
  async sendTemplate<T extends EmailTemplate>(
    options: SendTemplateEmailOptions<T>
  ): Promise<EmailResult> {
    const { templateEngine } = await import("../templates/template-engine");

    // Render template to HTML
    const { html, text, subject } = await templateEngine.renderTemplate(
      options.template,
      options.data
    );

    // Send email with rendered content (with template metadata)
    const result = await this.send(
      {
        to: options.to,
        from: options.from,
        replyTo: options.replyTo,
        subject,
        html,
        text,
      },
      {
        template: options.template,
        templateData: options.data,
      }
    );

    return result;
  }

  /**
   * Log email to database
   */
  private async logEmail(data: {
    provider: EmailProvider;
    template: string | null;
    toEmail: string;
    toName?: string;
    fromEmail: string;
    fromName?: string;
    subject: string;
    status: "pending" | "sent" | "failed";
    messageId?: string;
    error?: string;
    previewUrl?: string;
    templateData: any;
    metadata: any;
  }): Promise<void> {
    try {
      await db.insert(emailLog).values({
        provider: data.provider,
        template: data.template,
        toEmail: data.toEmail,
        toName: data.toName || null,
        fromEmail: data.fromEmail,
        fromName: data.fromName || null,
        subject: data.subject,
        status: data.status,
        messageId: data.messageId || null,
        error: data.error || null,
        retryCount: 0,
        templateData: data.templateData,
        metadata: data.metadata,
        previewUrl: data.previewUrl || null,
        sentAt: data.status === "sent" ? new Date() : null,
      });
    } catch (error) {
      console.error("[EmailService] Failed to log email:", error);
      // Don't throw - logging failure shouldn't break email sending
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
