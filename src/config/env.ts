/**
 * Environment Configuration
 * 
 * Centralized environment variable access with validation.
 * This prevents accidentally exposing server-only secrets to the browser.
 * 
 * Rules:
 * - NEXT_PUBLIC_* variables are safe for browser
 * - Non-prefixed variables are SERVER-ONLY
 * - Use getServerConfig() only in server contexts
 * - Use getPublicConfig() in any context
 */

/**
 * Public configuration safe for browser and server
 */
export function getPublicConfig() {
  return {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    app: {
      name: process.env.NEXT_PUBLIC_APP_NAME || 'EduSphere AI',
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  };
}

/**
 * Server-only configuration
 * 
 * WARNING: Never call this function in client components or browser code
 * These values must never be exposed to the browser
 */
export function getServerConfig() {
  // Ensure this function is only called on the server
  if (typeof window !== 'undefined') {
    throw new Error(
      'getServerConfig() was called in browser context. This function contains server-only secrets and must only be called in server-side code.'
    );
  }

  return {
    supabase: {
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    database: {
      url: process.env.DATABASE_URL || '',
    },
  };
}

/**
 * Validate required environment variables
 * Call this during application initialization
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate public variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  }

  // Validate server-only variables (only on server)
  if (typeof window === 'undefined') {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Warning only - not all environments need this immediately
      console.warn('SUPABASE_SERVICE_ROLE_KEY is not set (may be required for admin operations)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
