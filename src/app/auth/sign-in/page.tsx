/**
 * Sign In Page
 * 
 * Allows existing users to authenticate with email and password
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { SignInForm } from './SignInForm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sign In | EduSphere AI',
  description: 'Sign in to your EduSphere AI account',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  // Redirect if already authenticated
  const session = await getSession();
  if (session) {
    redirect(searchParams.redirect || '/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            EduSphere AI
          </h1>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/auth/sign-up"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        {/* Sign-in form */}
        <SignInForm redirectTo={searchParams.redirect} />
      </div>
    </div>
  );
}
