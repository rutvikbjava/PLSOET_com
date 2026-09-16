/**
 * Sign Up Form Component
 * 
 * Client component for handling registration form interactions
 * 
 * Security notes (DEC-031):
 * - Role is NOT exposed in form (hardcoded server-side to 'FACULTY')
 * - Institution is selected from validated list only
 * - No arbitrary institution creation allowed
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '../actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SignUpFormProps {
  institutions: Array<{ id: string; name: string; code: string }>;
}

export function SignUpForm({ institutions }: SignUpFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    institutionId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (
        !formData.email ||
        !formData.password ||
        !formData.displayName ||
        !formData.institutionId
      ) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }

      if (formData.displayName.trim().length < 2) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }

      // Call server action
      const result = await signUp(
        formData.email,
        formData.password,
        formData.displayName.trim(),
        formData.institutionId
      );

      if (!result.success) {
        setError(result.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Sign up error:', err);
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
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            required
            value={formData.displayName}
            onChange={handleChange}
            className="mt-1"
            placeholder="John Doe"
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address <span className="text-red-500">*</span>
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="mt-1"
            placeholder="your.email@institution.edu"
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="institutionId"
            className="block text-sm font-medium text-gray-700"
          >
            Institution <span className="text-red-500">*</span>
          </label>
          <select
            id="institutionId"
            name="institutionId"
            required
            value={formData.institutionId}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="">Select your institution</option>
            {institutions.map((institution) => (
              <option key={institution.id} value={institution.id}>
                {institution.name} ({institution.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password <span className="text-red-500">*</span>
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            className="mt-1"
            placeholder="••••••••"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum 8 characters
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="mt-1"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> New accounts are created with FACULTY role and
          PENDING_VERIFICATION status. Your institution administrator will review and
          activate your account.
        </p>
      </div>

      <div>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </div>
    </form>
  );
}
