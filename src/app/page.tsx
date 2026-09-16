import Link from 'next/link';
import { getPublicConfig } from '@/config/env';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

const config = getPublicConfig();

export default async function Home() {
  const session = await getSession();

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            {config.app.name}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Context-aware workflow automation for higher education
          </p>
        </div>

        {/* Authentication CTAs */}
        <div className="flex gap-4 justify-center">
          {session ? (
            <Link href="/dashboard">
              <Button variant="primary" className="text-lg px-8 py-3">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/sign-in">
                <Button variant="primary" className="text-lg px-8 py-3">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="secondary" className="text-lg px-8 py-3">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Context Analysis</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Intelligent document context extraction for workflow generation
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Policy Validation</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ensure all workflows comply with institutional policies
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Audit Trail</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Complete transparency and compliance tracking
            </p>
          </div>
        </div>

        <footer className="pt-8 text-sm text-gray-500">
          <p>Authentication system active • Dashboard ready • Production-grade implementation</p>
        </footer>
      </div>
    </main>
  );
}
