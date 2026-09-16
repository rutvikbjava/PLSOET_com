/**
 * Authentication Callback Route
 * 
 * Handles OAuth callbacks and email verification redirects from Supabase Auth.
 * 
 * This route:
 * 1. Exchanges the auth code for a session
 * 2. Validates the redirect destination
 * 3. Redirects to the appropriate page
 * 
 * Security:
 * - Only allows redirects to internal routes (prevents open redirect)
 * - Validates code parameter exists
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Validate redirect URL - must be internal
      const redirectUrl = getValidRedirectUrl(next, origin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If no code or error occurred, redirect to error page
  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_callback_failed`);
}

/**
 * Validate and sanitize redirect URL
 * Only allow internal routes (prevent open redirect vulnerability)
 */
function getValidRedirectUrl(next: string, origin: string): string {
  try {
    // If next is a full URL, validate it's on the same origin
    if (next.startsWith('http://') || next.startsWith('https://')) {
      const nextUrl = new URL(next);
      if (nextUrl.origin !== origin) {
        // External URL - reject and use default
        return `${origin}/dashboard`;
      }
      return next;
    }

    // If it's a relative path, ensure it starts with /
    if (next.startsWith('/')) {
      return `${origin}${next}`;
    }

    // Invalid format - use default
    return `${origin}/dashboard`;
  } catch {
    // URL parsing failed - use default
    return `${origin}/dashboard`;
  }
}
