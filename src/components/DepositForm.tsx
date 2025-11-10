'use client';

import React from 'react';
import { api } from '@/lib/api';
import { depositSchema, type DepositInput } from '@/lib/schemas';
import { FormField, SelectField, useFormValidation } from '@/components/ui/Form';
import { Controller } from 'react-hook-form';
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
  
  // Get default currency from first bank account or use GBP
  const defaultCurrency = bankAccounts.length > 0 ? bankAccounts[0].currency : 'GBP';
  
  const { control, handleSubmit, errors, setValue, watch, reset } = useFormValidation(depositSchema);

  // Set initial default values
  React.useEffect(() => {
    reset({
      currency: defaultCurrency,
      transferMethod: 'FPS',
      amount: undefined,
      bankAccountId: '',
      description: '',
    });
  }, [reset, defaultCurrency]);

  // Watch bank account selection to update currency
  const selectedBankAccountId = watch('bankAccountId');
  
  React.useEffect(() => {
    if (selectedBankAccountId) {
      const selectedAccount = bankAccounts.find(acc => acc.id === selectedBankAccountId);
      if (selectedAccount) {
        setValue('currency', selectedAccount.currency);
      }
    }
  }, [selectedBankAccountId, bankAccounts, setValue]);

  const handleFormSubmit = async (data: DepositInput) => {
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <FormField
        label="Amount"
        name="amount"
        type="number"
        placeholder="0.00"
        step={0.01}
        min={0}
        required
        control={control}
        error={errors.amount?.message}
      />

      <SelectField
        label="Bank Account"
        name="bankAccountId"
        options={bankAccountOptions}
        placeholder="Select an account"
        required
        control={control}
        error={errors.bankAccountId?.message}
      />

      <SelectField
        label="Transfer Method"
        name="transferMethod"
        options={transferMethodOptions}
        required
        control={control}
        error={errors.transferMethod?.message}
      />

      <FormField
        label="Description"
        name="description"
        placeholder="e.g., Monthly deposit"
        control={control}
        error={errors.description?.message}
      />

      {/* Hidden currency field - set automatically based on bank account */}
      <Controller
        name="currency"
        control={control}
        defaultValue={defaultCurrency}
        render={({ field }) => <input type="hidden" {...field} />}
      />

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
          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
        >
          Submit
        </button>
        <button
          type="button"
          onClick={() => {
            reset({
              currency: defaultCurrency,
              transferMethod: 'FPS',
              amount: undefined,
              bankAccountId: '',
              description: '',
            });
          }}
          className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition"
        >
          Reset
        </button>
      </div>
    </form>
  );
}

