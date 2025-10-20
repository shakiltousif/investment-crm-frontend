'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

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

interface BankAccountListProps {
  onEdit?: (account: BankAccount) => void;
  onDelete?: (accountId: string) => void;
  onRefresh?: () => void;
}

export default function BankAccountList({
  onEdit,
  onDelete,
  onRefresh,
}: BankAccountListProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/bank-accounts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setAccounts(response.data.data);
    } catch (err) {
      setError('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/bank-accounts/${accountId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchAccounts();
      onDelete?.(accountId);
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/bank-accounts/${accountId}/set-primary`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchAccounts();
    } catch (err) {
      setError('Failed to set primary account');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No bank accounts yet</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Add First Account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{account.bankName}</h3>
              <p className="text-gray-600 text-sm">{account.accountHolderName}</p>
            </div>
            <div className="flex gap-2">
              {account.isPrimary && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Primary
                </span>
              )}
              {account.isVerified && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Verified
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-600 text-sm">Account Number</p>
              <p className="text-gray-900 font-medium">
                ****{account.accountNumber.slice(-4)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Account Type</p>
              <p className="text-gray-900 font-medium">{account.accountType}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Balance</p>
              <p className="text-gray-900 font-medium">
                {account.currency} ${account.balance.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Currency</p>
              <p className="text-gray-900 font-medium">{account.currency}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {!account.isPrimary && (
              <button
                onClick={() => handleSetPrimary(account.id)}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition"
              >
                Set Primary
              </button>
            )}
            <button
              onClick={() => onEdit?.(account)}
              className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(account.id)}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

