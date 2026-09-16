/**
 * Authentication Server Actions
 * 
 * These actions handle authentication flows:
 * - Sign in
 * - Sign up with profile creation
 * - Sign out
 * 
 * Security notes:
 * - Profile creation uses admin client to bypass RLS INSERT policy
 * - Role is ALWAYS set to 'FACULTY' (never from user input)
 * - Institution ID is validated to exist before assignment
 * - All errors are sanitized before returning to client
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * Result type for auth actions
 */
export type AuthResult = {
  success: boolean;
  error?: string;
};

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Sanitize error message for user
      if (error.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }
      return {
        success: false,
        error: 'Unable to sign in. Please try again.',
      };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Sign up with email, password, and create application profile
 * 
 * Security (DEC-029, DEC-030, DEC-031):
 * - Role is HARDCODED to 'FACULTY' (never from user input)
 * - Status is HARDCODED to 'PENDING_VERIFICATION'
 * - Institution ID is validated before assignment
 * - Profile creation uses admin client to bypass RLS
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
  institutionId: string
): Promise<AuthResult> {
  try {
    const supabase = createClient();
    const adminClient = getAdminClient();

    // Validate institution exists
    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .select('id, status')
      .eq('id', institutionId)
      .single();

    if (institutionError || !institution) {
      return {
        success: false,
        error: 'Invalid institution selected',
      };
    }

    if (institution.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'Selected institution is not active',
      };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (authError) {
      // Sanitize error messages
      if (authError.message.includes('already registered')) {
        return {
          success: false,
          error: 'An account with this email already exists',
        };
      }
      if (authError.message.includes('password')) {
        return {
          success: false,
          error: 'Password does not meet requirements',
        };
      }
      return {
        success: false,
        error: 'Unable to create account. Please try again.',
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Account creation failed',
      };
    }

    // Create application profile using admin client (bypasses RLS)
    // SECURITY: Role and status are HARDCODED - never from user input
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        display_name: displayName,
        institution_id: institutionId,
        department_id: null, // Assigned later by admin
        role: 'FACULTY', // HARDCODED - least privilege (DEC-029)
        status: 'PENDING_VERIFICATION', // HARDCODED - requires activation (DEC-029)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any); // Type assertion needed for admin client bypass

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // Profile creation failed - attempt to clean up auth user
      // Note: This is best-effort; orphaned auth users may exist
      try {
        await adminClient.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }

      return {
        success: false,
        error: 'Failed to complete registration. Please try again.',
      };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

/**
 * Get list of active institutions for signup form
 */
export async function getActiveInstitutions(): Promise<
  Array<{ id: string; name: string; code: string }>
> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('institutions')
      .select('id, name, code')
      .eq('status', 'ACTIVE')
      .order('name');

    if (error) {
      console.error('Error fetching institutions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return [];
  }
}
