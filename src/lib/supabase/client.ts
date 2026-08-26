/**
 * Supabase Browser Client
 * 
 * This client is safe to use in browser/client components.
 * It uses the ANON key which has limited permissions controlled by RLS policies.
 * 
 * Usage:
 * - Client Components: Direct import and use
 * - Browser-side operations
 * - User-scoped database queries (protected by RLS)
 */

import { createBrowserClient } from '@supabase/ssr';
import { getPublicConfig } from '@/config/env';

const config = getPublicConfig();

export function createClient() {
  return createBrowserClient(
    config.supabase.url,
    config.supabase.anonKey
  );
}

// Export a singleton instance for convenience
export const supabase = createClient();
