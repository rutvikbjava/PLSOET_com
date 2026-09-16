/**
 * Resend Email Provider
 * 
 * Production email provider using Resend API.
 * Requires RESEND_API_KEY environment variable.
 * 
 * Fallback: If RESEND_API_KEY is not configured, logs warning and uses MockEmailProvider.
 */

import type { EmailProvider, EmailParams, EmailResult } from './email-provider-interface';

export class ResendEmailProvider implements EmailProvider {
  private apiKey: string | undefined;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@edusphere.ai';

    if (!this.apiKey) {
      console.warn('[RESEND_EMAIL_PROVIDER] RESEND_API_KEY not configured. Email delivery will fail.');
    }
  }

  getName(): string {
    return 'ResendEmailProvider';
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'RESEND_API_KEY not configured',
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[RESEND_EMAIL_PROVIDER] API error:', data);
        return {
          success: false,
          error: data.message || `API returned ${response.status}`,
        };
      }

      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      console.error('[RESEND_EMAIL_PROVIDER] Send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
