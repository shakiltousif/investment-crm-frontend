'use client';

import React from 'react';
import { api } from '@/lib/api';
import { depositSchema, type DepositInput } from '@/lib/schemas';
import { Form, FormField, SelectField } from '@/components/ui/Form';
import { useToastHelpers } from '@/components/ui/Toast';

interface BankAccount {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
  currency: string;
  balance: number;
  isVerified: boolean;
  isPrimary: boolean;
}

interface DepositFormProps {
  bankAccounts: BankAccount[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DepositForm({ bankAccounts, onSuccess, onCancel }: DepositFormProps) {
  const { success, error } = useToastHelpers();

  const handleSubmit = async (data: DepositInput) => {
    try {
      await api.deposits.create(data);
      success('Deposit request submitted successfully');
      onSuccess?.();
    } catch (err: any) {
      console.error('Deposit creation error:', err);
      error('Failed to create deposit request', err.response?.data?.message || 'An unexpected error occurred');
    }
  };

  const bankAccountOptions = bankAccounts.map(account => ({
    value: account.id,
    label: `${account.bankName} - ****${account.accountNumber.slice(-4)} (${account.currency})`
  }));

  const transferMethodOptions = [
    { value: 'FPS', label: 'FPS (1-2 hours)' },
    { value: 'CHAPS', label: 'CHAPS (2-4 hours)' },
    { value: 'SWIFT', label: 'SWIFT (1-3 business days)' },
  ];

  return (
    <Form
      schema={depositSchema}
      onSubmit={handleSubmit}
      defaultValues={{
        currency: 'USD',
        transferMethod: 'FPS',
      }}
      className="space-y-4"
    >
      <FormField
        label="Amount"
        name="amount"
        type="number"
        placeholder="0.00"
        step={0.01}
        min={0}
        required
      />

      <SelectField
        label="Bank Account"
        name="bankAccountId"
        options={bankAccountOptions}
        placeholder="Select an account"
        required
      />

      <SelectField
        label="Transfer Method"
        name="transferMethod"
        options={transferMethodOptions}
        required
      />

      <FormField
        label="Description"
        name="description"
        placeholder="e.g., Monthly deposit"
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

