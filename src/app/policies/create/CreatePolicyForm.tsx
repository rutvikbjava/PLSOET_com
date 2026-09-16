/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Create Policy Form Component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createPolicyAction } from '../actions';

export function CreatePolicyForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department_id: '',
    policy_rules: '{}',
    effective_from: '',
    effective_until: '',
    status: 'DRAFT' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Parse policy rules JSON
      let policyRules;
      try {
        policyRules = JSON.parse(formData.policy_rules);
      } catch (err) {
        setError('Invalid JSON in policy rules');
        setIsSubmitting(false);
        return;
      }

      const result = await createPolicyAction({
        name: formData.name,
        description: formData.description || null,
        department_id: formData.department_id || null,
        policy_rules: policyRules,
        effective_from: formData.effective_from || null,
        effective_until: formData.effective_until || null,
        status: formData.status,
      });

      if (result.success && result.policy) {
        router.push(`/policies/${result.policy.id}`);
      } else {
        setError(result.error || 'Failed to create policy');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Policy Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Student Attendance Policy"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this policy"
          />
        </div>

        <div>
          <label htmlFor="policy_rules" className="block text-sm font-medium text-gray-700 mb-1">
            Policy Rules (JSON) <span className="text-red-500">*</span>
          </label>
          <textarea
            id="policy_rules"
            rows={10}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            value={formData.policy_rules}
            onChange={(e) => setFormData({ ...formData, policy_rules: e.target.value })}
            placeholder={'{\n  "required_document_types": ["ATTENDANCE_REPORT"],\n  "min_attendance": 75\n}'}
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter policy configuration as valid JSON
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="effective_from" className="block text-sm font-medium text-gray-700 mb-1">
              Effective From
            </label>
            <Input
              id="effective_from"
              type="date"
              value={formData.effective_from}
              onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="effective_until" className="block text-sm font-medium text-gray-700 mb-1">
              Effective Until
            </label>
            <Input
              id="effective_until"
              type="date"
              value={formData.effective_until}
              onChange={(e) => setFormData({ ...formData, effective_until: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
          >
            {isSubmitting ? 'Creating...' : 'Create Policy'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
