'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface BankAccount {
  id: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  balance: number;
}

interface DepositFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DepositForm({ onSuccess, onCancel }: DepositFormProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    bankAccountId: '',
    transferMethod: 'FPS',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bank-accounts`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      setBankAccounts(response.data.data);
      if (response.data.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          bankAccountId: response.data.data[0].id,
          currency: response.data.data[0].currency,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const accountId = e.target.value;
    const account = bankAccounts.find((a) => a.id === accountId);
    setFormData((prev) => ({
      ...prev,
      bankAccountId: accountId,
      currency: account?.currency || 'USD',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!formData.bankAccountId) {
      setError('Please select a bank account');
      return;
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/deposits`,
        {
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          bankAccountId: formData.bankAccountId,
          transferMethod: formData.transferMethod,
          description: formData.description,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );

      setSuccess(true);
      setStep('success');
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create deposit request');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = bankAccounts.find((a) => a.id === formData.bankAccountId);

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Deposit Funds</h2>

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              name="amount"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Bank Account */}
          <div>
            <label className="block text-sm font-medium mb-2">Bank Account</label>
            <select
              value={formData.bankAccountId}
              onChange={handleAccountChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select an account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} - {account.accountNumber} ({account.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Method */}
          <div>
            <label className="block text-sm font-medium mb-2">Transfer Method</label>
            <select
              name="transferMethod"
              value={formData.transferMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="FPS">FPS (1-2 hours)</option>
              <option value="CHAPS">CHAPS (2-4 hours)</option>
              <option value="SWIFT">SWIFT (1-3 business days)</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <input
              type="text"
              name="description"
              placeholder="e.g., Monthly deposit"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Continue
            </button>
          </div>
        </form>
      )}

      {step === 'confirm' && selectedAccount && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">
                {formData.currency} {parseFloat(formData.amount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bank Account:</span>
              <span className="font-semibold">{selectedAccount.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transfer Method:</span>
              <span className="font-semibold">{formData.transferMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Time:</span>
              <span className="font-semibold">
                {formData.transferMethod === 'FPS'
                  ? '1-2 hours'
                  : formData.transferMethod === 'CHAPS'
                    ? '2-4 hours'
                    : '1-3 business days'}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <p className="font-semibold mb-2">Important:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Your deposit will be processed shortly</li>
              <li>You will receive a confirmation email</li>
              <li>Funds will be credited to your account</li>
            </ul>
          </div>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep('form')}
              className="flex-1 px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Deposit'}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">✓</div>
          <p className="text-lg font-semibold text-green-600">Deposit Request Submitted!</p>
          <p className="text-gray-600 mt-2">Your deposit request has been submitted successfully.</p>
          <p className="text-sm text-gray-500 mt-4">You will receive a confirmation email shortly.</p>
        </div>
      )}
    </div>
  );
}

