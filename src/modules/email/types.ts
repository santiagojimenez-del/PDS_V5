// ── Email Types ──────────────────────────────────────────────────────────────

export type EmailProvider = "ethereal" | "resend" | "sendgrid" | "console";

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailOptions {
  to: EmailAddress | EmailAddress[];
  from?: EmailAddress;
  replyTo?: EmailAddress;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: EmailProvider;
  previewUrl?: string; // For Ethereal preview
}

export interface IEmailProvider {
  send(options: EmailOptions): Promise<EmailResult>;
  verifyConnection?(): Promise<boolean>;
}

// ── Email Template Types ─────────────────────────────────────────────────────

export type EmailTemplate =
  | "2fa-code"
  | "reset-password"
  | "signup-confirmation"
  | "pilot-notification"
  | "delivery-notification"
  | "job-status-update";

export interface EmailTemplateData {
  "2fa-code": {
    code: string;
    userName: string;
    expiresInMinutes: number;
  };
  "reset-password": {
    userName: string;
    resetLink: string;
    expiresInHours: number;
  };
  "signup-confirmation": {
    userName: string;
    confirmationLink: string;
  };
  "pilot-notification": {
    pilotName: string;
    jobId: number;
    jobTitle: string;
    clientName: string;
    scheduledDate?: string;
    action: "assigned" | "scheduled" | "rescheduled" | "cancelled";
  };
  "delivery-notification": {
    clientName: string;
    jobId: number;
    jobTitle: string;
    deliveryDate: string;
    downloadLink?: string;
  };
  "job-status-update": {
    recipientName: string;
    jobId: number;
    jobTitle: string;
    oldStatus: string;
    newStatus: string;
    message?: string;
  };
}

export interface SendTemplateEmailOptions<T extends EmailTemplate> {
  to: EmailAddress | EmailAddress[];
  template: T;
  data: EmailTemplateData[T];
  from?: EmailAddress;
  replyTo?: EmailAddress;
}
