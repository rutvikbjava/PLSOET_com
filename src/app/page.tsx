import Link from 'next/link';
import { getPublicConfig } from '@/config/env';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

const config = getPublicConfig();

// Force dynamic rendering to check auth state on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const session = await getSession();
  const isAuthenticated = !!session;

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-neutral-50 via-primary-50 to-accent-50">
      <div className="max-w-5xl w-full space-y-12 text-center">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-edu border border-primary-100 mb-4">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-primary-900">Enterprise-Ready Platform</span>
          </div>
          
          <h1 className="text-6xl font-display font-bold tracking-tight text-primary-900">
            {config.app.name}
          </h1>
          <p className="text-2xl text-secondary-900 max-w-3xl mx-auto leading-relaxed">
            Context-aware workflow automation for higher education institutions
          </p>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Streamline document processing, approvals, and compliance with AI-powered intelligent workflows
          </p>
        </div>

        {/* Authentication CTAs */}
        <div className="flex gap-4 justify-center">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button variant="accent" size="lg" className="text-lg px-10 py-4 shadow-edu-lg">
                Go to Dashboard →
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/sign-in">
                <Button variant="primary" size="lg" className="text-lg px-10 py-4 shadow-edu-lg">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="accent" size="lg" className="text-lg px-10 py-4 shadow-edu-lg">
                  Get Started →
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="bg-white border-2 border-primary-100 rounded-edu p-8 shadow-edu hover:shadow-edu-lg transition-shadow">
            <div className="w-14 h-14 bg-gradient-edu rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-3xl">🎯</span>
            </div>
            <h2 className="text-xl font-display font-semibold mb-3 text-primary-900">Context Analysis</h2>
            <p className="text-base text-neutral-700">
              Intelligent document context extraction and automated workflow generation
            </p>
          </div>

          <div className="bg-white border-2 border-primary-100 rounded-edu p-8 shadow-edu hover:shadow-edu-lg transition-shadow">
            <div className="w-14 h-14 bg-gradient-edu rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-xl font-display font-semibold mb-3 text-primary-900">Policy Validation</h2>
            <p className="text-base text-neutral-700">
              Ensure all workflows comply with institutional policies and regulations
            </p>
          </div>

          <div className="bg-white border-2 border-primary-100 rounded-edu p-8 shadow-edu hover:shadow-edu-lg transition-shadow">
            <div className="w-14 h-14 bg-gradient-edu rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-3xl">📊</span>
            </div>
            <h2 className="text-xl font-display font-semibold mb-3 text-primary-900">Audit Trail</h2>
            <p className="text-base text-neutral-700">
              Complete transparency and compliance tracking for all operations
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="pt-8 border-t border-neutral-200">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <span className="text-green-500">●</span>
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">●</span>
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">●</span>
              <span>Role-Based Access</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">●</span>
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>

        <footer className="pt-8 text-sm text-neutral-500">
          <p>© {new Date().getFullYear()} {config.app.name}. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}

