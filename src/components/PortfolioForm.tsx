'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { portfolioSchema, type PortfolioInput } from '@/lib/schemas';
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
  const [formData, setFormData] = useState<PortfolioInput>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    isActive: initialData?.isActive ?? true,
    totalValue: initialData?.totalValue || undefined,
    totalInvested: initialData?.totalInvested || undefined,
    totalGain: initialData?.totalGain || undefined,
    gainPercentage: initialData?.gainPercentage || undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? undefined : Number(value)) : value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate the form data
      const validatedData = portfolioSchema.parse(formData);
      
      if (isEditing && initialData?.id) {
        await api.portfolios.update(initialData.id, validatedData);
        success('Portfolio updated successfully');
      } else {
        await api.portfolios.create(validatedData);
        success('Portfolio created successfully');
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('Portfolio form error:', err);
      if (err.errors) {
        // Zod validation errors
        error('Validation failed', err.errors.map((e: any) => e.message).join(', '));
      } else {
        error('Failed to save portfolio', err.response?.data?.message || 'An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Portfolio Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="My Investment Portfolio"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your portfolio strategy and goals..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="totalValue" className="block text-sm font-medium text-gray-700 mb-1">
            Total Value ($)
          </label>
          <input
            type="number"
            id="totalValue"
            name="totalValue"
            value={formData.totalValue || ''}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="totalInvested" className="block text-sm font-medium text-gray-700 mb-1">
            Total Invested ($)
          </label>
          <input
            type="number"
            id="totalInvested"
            name="totalInvested"
            value={formData.totalInvested || ''}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="totalGain" className="block text-sm font-medium text-gray-700 mb-1">
            Total Gain ($)
          </label>
          <input
            type="number"
            id="totalGain"
            name="totalGain"
            value={formData.totalGain || ''}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="gainPercentage" className="block text-sm font-medium text-gray-700 mb-1">
            Gain Percentage (%)
          </label>
          <input
            type="number"
            id="gainPercentage"
            name="gainPercentage"
            value={formData.gainPercentage || ''}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="-100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="text-sm text-gray-600">
          Mark as active portfolio
        </label>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : (isEditing ? 'Update Portfolio' : 'Create Portfolio')}
        </button>
      </div>
    </form>
  );
}

