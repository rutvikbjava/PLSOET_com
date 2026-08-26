/**
 * Supabase Client Exports
 * 
 * This file provides centralized access to all Supabase clients.
 * 
 * Usage guidelines:
 * - Browser/Client Components: Use client.ts
 * - Server Components/Actions: Use server.ts
 * - Admin operations: Use admin.ts (WITH EXTREME CAUTION)
 */

// Browser client (safe for client components)
export { createClient as createBrowserClient, supabase } from './client';

// Server client (for server components, actions, API routes)
export { createClient as createServerClient } from './server';

// Admin client (service role - use with extreme caution)
export { getAdminClient, isAdminClientAvailable } from './admin';
