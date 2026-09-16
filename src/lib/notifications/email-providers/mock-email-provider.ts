/**
 * Mock Email Provider
 * 
 * Development email provider that logs to console instead of sending real emails.
 * Always succeeds. Use for local development and testing.
 */

import type { EmailProvider, EmailParams, EmailResult } from './email-provider-interface';

export class MockEmailProvider implements EmailProvider {
  getName(): string {
    return 'MockEmailProvider';
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    console.log('[MOCK_EMAIL_PROVIDER] Would send email:', {
      to: params.to,
      subject: params.subject,
      textPreview: params.text.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
    });

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Always succeed with mock message ID
    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }
}
