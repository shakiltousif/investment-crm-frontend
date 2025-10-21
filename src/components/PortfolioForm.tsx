'use client';

import React from 'react';
import { api } from '@/lib/api';
import { portfolioSchema, type PortfolioInput } from '@/lib/schemas';
import { Form, FormField } from '@/components/ui/Form';
import { useToastHelpers } from '@/components/ui/Toast';

interface PortfolioFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
  isEditing?: boolean;
}

export default function PortfolioForm({
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
}: PortfolioFormProps) {
  const { success, error } = useToastHelpers();

  const handleSubmit = async (data: PortfolioInput) => {
    try {
      if (isEditing && initialData?.id) {
        await api.portfolios.update(initialData.id, data);
        success('Portfolio updated successfully');
      } else {
        await api.portfolios.create(data);
        success('Portfolio created successfully');
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('Portfolio form error:', err);
      error('Failed to save portfolio', err.response?.data?.message || 'An unexpected error occurred');
    }
  };

  return (
    <Form
      schema={portfolioSchema}
      onSubmit={handleSubmit}
      defaultValues={initialData}
      className="space-y-4"
    >
      <FormField
        label="Portfolio Name"
        name="name"
        placeholder="My Investment Portfolio"
        required
      />

      <FormField
        label="Description"
        name="description"
        type="textarea"
        placeholder="Describe your portfolio strategy and goals..."
        rows={4}
      />

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition"
        >
          Cancel
        </button>
      </div>
    </Form>
  );
}

