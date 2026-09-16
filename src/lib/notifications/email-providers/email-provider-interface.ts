/**
 * Email Provider Interface
 * 
 * Abstraction for email delivery providers.
 * Allows switching between MockEmailProvider (dev) and real providers (production).
 */

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  sendEmail(params: EmailParams): Promise<EmailResult>;
  getName(): string;
}
