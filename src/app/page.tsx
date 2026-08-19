import { getPublicConfig } from '@/config/env';

const config = getPublicConfig();

export default function Home() {
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

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              System Initializing
            </span>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            The EduSphere AI platform is being set up. Core features including authentication,
            workflow automation, and document management will be available soon.
          </p>
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
          <p>Production-grade development in progress</p>
        </footer>
      </div>
    </main>
  );
}
