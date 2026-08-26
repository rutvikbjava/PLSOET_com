/**
 * Supabase Connection Test
 * 
 * Utilities to verify Supabase connectivity and configuration.
 * Safe to run without requiring database tables to exist.
 */

import { createClient } from '@supabase/supabase-js';
import { getPublicConfig } from '@/config/env';
import { logger } from '@/lib/logger';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    url: string;
    hasAnonKey: boolean;
    error?: string;
  };
}

/**
 * Test basic Supabase connectivity
 * This does NOT require any tables to exist
 */
export async function testConnection(): Promise<ConnectionTestResult> {
  const config = getPublicConfig();

  // Check configuration
  if (!config.supabase.url) {
    return {
      success: false,
      message: 'NEXT_PUBLIC_SUPABASE_URL is not configured',
      details: {
        url: '',
        hasAnonKey: Boolean(config.supabase.anonKey),
      },
    };
  }

  if (!config.supabase.anonKey) {
    return {
      success: false,
      message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured',
      details: {
        url: config.supabase.url,
        hasAnonKey: false,
      },
    };
  }

  try {
    // Create a test client
    const testClient = createClient(
      config.supabase.url,
      config.supabase.anonKey
    );

    // Test the connection by checking auth status
    // This doesn't require any tables or authentication
    const { error } = await testClient.auth.getSession();

    if (error) {
      logger.warn('Supabase connection test returned error', { error: error.message });
      
      // Some errors are expected (like no session), so we check connectivity differently
      // If we got a response (even an error), the connection works
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          success: false,
          message: `Network error connecting to Supabase: ${error.message}`,
          details: {
            url: config.supabase.url,
            hasAnonKey: true,
            error: error.message,
          },
        };
      }
    }

    // If we got here, connection is working
    logger.info('Supabase connection test successful');

    return {
      success: true,
      message: 'Successfully connected to Supabase',
      details: {
        url: config.supabase.url,
        hasAnonKey: true,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Supabase connection test failed', error);

    return {
      success: false,
      message: `Connection test failed: ${errorMessage}`,
      details: {
        url: config.supabase.url,
        hasAnonKey: true,
        error: errorMessage,
      },
    };
  }
}
