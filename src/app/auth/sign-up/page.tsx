/**
 * Sign Up Page
 * 
 * Allows new users to create an account and application profile
 * 
 * Security (DEC-028, DEC-029):
 * - Users select existing institution (no arbitrary creation)
 * - Default role: FACULTY (least privilege)
 * - Default status: PENDING_VERIFICATION (requires admin activation)
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { SignUpForm } from './SignUpForm';
import { getSession } from '@/lib/auth';
import { getActiveInstitutions } from '../actions';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sign Up | EduSphere AI',
  description: 'Create your EduSphere AI account',
};

export default async function SignUpPage() {
  // Redirect if already authenticated
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  // Fetch active institutions for selection
  const institutions = await getActiveInstitutions();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            EduSphere AI
          </h1>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/sign-in"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Sign-up form */}
        {institutions.length > 0 ? (
          <SignUpForm institutions={institutions} />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            <p className="text-sm">
              No institutions are currently available for registration. Please contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
