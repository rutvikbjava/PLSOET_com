/**
 * Sign In Form Component
 * 
 * Client component for handling sign-in form interactions
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '../actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SignInFormProps {
  redirectTo?: string;
}

export function SignInForm({ redirectTo }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      // Call server action
      const result = await signIn(email, password);

      if (!result.success) {
        setError(result.error || 'Sign in failed');
        setLoading(false);
        return;
      }

      // Success - redirect to dashboard or specified redirect URL
      router.push(redirectTo || '/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded"
          role="alert"
        >
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
            placeholder="your.email@institution.edu"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>

      {/* Future: Password reset link */}
      {/* 
      <div className="text-sm text-center">
        <Link
          href="/auth/reset-password"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Forgot your password?
        </Link>
      </div>
      */}
    </form>
  );
}
