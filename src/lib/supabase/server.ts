/**
 * Supabase Server Client
 * 
 * This client is for server-side operations in Server Components,
 * Server Actions, Route Handlers, and Middleware.
 * 
 * It uses cookies for session management and respects RLS policies
 * based on the authenticated user.
 * 
 * IMPORTANT: This still uses the ANON key, not the service role key.
 * It operates within the context of the authenticated user.
 * 
 * Usage:
 * - Server Components
 * - Server Actions
 * - API Routes
 * - Middleware
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPublicConfig } from '@/config/env';

const config = getPublicConfig();

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
