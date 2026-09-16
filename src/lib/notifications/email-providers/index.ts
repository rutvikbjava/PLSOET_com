/**
 * Email Provider Factory
 * 
 * Returns appropriate email provider based on environment configuration.
 * 
 * Logic:
 * - If RESEND_API_KEY is configured: Use ResendEmailProvider
 * - Otherwise: Use MockEmailProvider (development)
 */

import type { EmailProvider } from './email-provider-interface';
import { MockEmailProvider } from './mock-email-provider';
import { ResendEmailProvider } from './resend-email-provider';

export * from './email-provider-interface';
export * from './mock-email-provider';
export * from './resend-email-provider';

let emailProviderInstance: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (emailProviderInstance) {
    return emailProviderInstance;
  }

  // Check if Resend API key is configured
  const hasResendApiKey = !!process.env.RESEND_API_KEY;

  if (hasResendApiKey) {
    console.log('[EMAIL_PROVIDER] Using ResendEmailProvider (production)');
    emailProviderInstance = new ResendEmailProvider();
  } else {
    console.log('[EMAIL_PROVIDER] Using MockEmailProvider (development - no RESEND_API_KEY)');
    emailProviderInstance = new MockEmailProvider();
  }

  return emailProviderInstance;
}

// For testing: Reset provider instance
export function resetEmailProvider(): void {
  emailProviderInstance = null;
}
