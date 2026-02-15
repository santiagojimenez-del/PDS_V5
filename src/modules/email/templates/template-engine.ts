import { render } from "@react-email/components";
import type { EmailTemplate, EmailTemplateData } from "../types";
import * as React from "react";

/**
 * Template Engine - Renders React Email components to HTML
 */
export class TemplateEngine {
  /**
   * Render a template to HTML string
   */
  async renderTemplate<T extends EmailTemplate>(
    template: T,
    data: EmailTemplateData[T]
  ): Promise<{ html: string; subject: string; text: string }> {
    // Dynamically import the template component
    const templateComponent = await this.getTemplateComponent(template);

    if (!templateComponent) {
      throw new Error(`Template "${template}" not found`);
    }

    // Render the React component to HTML
    const html = await render(React.createElement(templateComponent, data as any));

    // Generate plain text version (strip HTML tags)
    const text = this.htmlToText(html);

    // Get subject from template
    const subject = this.getSubject(template, data);

    return { html, text, subject };
  }

  /**
   * Dynamically import template component
   */
  private async getTemplateComponent(template: EmailTemplate): Promise<any> {
    try {
      switch (template) {
        case "2fa-code":
          return (await import("./auth/2fa-code")).TwoFactorCodeEmail;
        case "reset-password":
          return (await import("./auth/reset-password")).ResetPasswordEmail;
        case "password-changed":
          return (await import("./auth/password-changed")).PasswordChangedEmail;
        case "signup-confirmation":
          return (await import("./auth/signup-confirmation")).SignupConfirmationEmail;
        case "pilot-notification":
          return (await import("./workflow/pilot-notification")).PilotNotificationEmail;
        case "delivery-notification":
          return (await import("./workflow/delivery-notification")).DeliveryNotificationEmail;
        case "job-status-update":
          return (await import("./workflow/job-status-update")).JobStatusUpdateEmail;
        default:
          return null;
      }
    } catch (error) {
      console.error(`Failed to load template "${template}":`, error);
      return null;
    }
  }

  /**
   * Generate email subject based on template and data
   */
  private getSubject<T extends EmailTemplate>(
    template: T,
    data: EmailTemplateData[T]
  ): string {
    switch (template) {
      case "2fa-code":
        return "Verification Code - ProDrones Hub";
      case "reset-password":
        return "Reset Password - ProDrones Hub";
      case "password-changed":
        return "Password Changed - ProDrones Hub";
      case "signup-confirmation":
        return "Confirm Your Account - ProDrones Hub";
      case "pilot-notification": {
        const d = data as EmailTemplateData["pilot-notification"];
        const actionText = {
          assigned: "New job assigned",
          scheduled: "Job scheduled",
          rescheduled: "Job rescheduled",
          cancelled: "Job cancelled",
        }[d.action];
        return `${actionText} #${d.jobId} - ProDrones Hub`;
      }
      case "delivery-notification": {
        const d = data as EmailTemplateData["delivery-notification"];
        return `Delivery completed - Job #${d.jobId} - ProDrones Hub`;
      }
      case "job-status-update": {
        const d = data as EmailTemplateData["job-status-update"];
        return `Job update #${d.jobId} - ProDrones Hub`;
      }
      default:
        return "Notification - ProDrones Hub";
    }
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, "")
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}

// Export singleton instance
export const templateEngine = new TemplateEngine();
