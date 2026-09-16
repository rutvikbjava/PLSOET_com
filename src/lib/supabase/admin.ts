/**
 * Supabase Admin Client (Service Role)
 * 
 * ⚠️  CRITICAL SECURITY WARNING ⚠️
 * 
 * This client uses the SERVICE ROLE key which has FULL database access
 * and BYPASSES all Row Level Security (RLS) policies.
 * 
 * RULES:
 * 1. NEVER import this into client components
 * 2. NEVER expose through API responses
 * 3. NEVER log the service role key
 * 4. ONLY use for privileged server-side operations that explicitly need to bypass RLS
 * 5. Always verify authorization before using this client
 * 6. Prefer the regular server client (server.ts) for user-scoped operations
 * 
 * Legitimate use cases:
 * - Admin dashboard operations (after manual authorization check)
 * - System-level operations (workflow automation, audit log creation)
 * - Bulk operations that need to span multiple users
 * - Scheduled jobs/cron tasks
 * 
 * NEVER use this client casually. When in doubt, use server.ts instead.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getPublicConfig, getServerConfig } from '@/config/env';

type SupabaseClient = ReturnType<typeof createSupabaseClient>;

let adminClient: SupabaseClient | null = null;

/**
 * Get admin client with service role key
 * 
 * ⚠️  WARNING: This bypasses RLS. Use only when absolutely necessary.
 * 
 * @throws Error if called in browser context
 * @throws Error if service role key is not configured
 */
export function getAdminClient(): SupabaseClient {
  // Ensure this is never called in browser
  if (typeof window !== 'undefined') {
    throw new Error(
      'getAdminClient() was called in browser context. Admin client with service role key must NEVER be used in browser code.'
    );
  }

  const publicConfig = getPublicConfig();
  const serverConfig = getServerConfig();

  if (!serverConfig.supabase.serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Admin client cannot be created.'
    );
  }

  // Create singleton instance
  if (!adminClient) {
    adminClient = createSupabaseClient(
      publicConfig.supabase.url,
      serverConfig.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return adminClient;
}

/**
 * Check if admin client is available
 * Use this to gracefully handle missing service role key
 */
export function isAdminClientAvailable(): boolean {
  if (typeof window !== 'undefined') {
    return false;
  }

  try {
    const serverConfig = getServerConfig();
    return Boolean(serverConfig.supabase.serviceRoleKey);
  } catch {
    return false;
  }
}

/**
 * Create a new admin client instance
 * Alias for getAdminClient for import compatibility
 */
export function createClient(): SupabaseClient {
  return getAdminClient();
}
