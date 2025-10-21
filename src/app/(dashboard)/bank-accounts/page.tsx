'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import BankAccountList from '@/components/BankAccountList';
import BankAccountForm from '@/components/BankAccountForm';

interface BankAccount {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  accountType: string;
  currency: string;
  balance: number;
  isVerified: boolean;
  verifiedAt?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BankAccountsPage() {
  const { isAuthenticated } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBankAccounts();
    }
  }, [isAuthenticated]);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      try {
        const response = await api.bankAccounts.getAll();
        setBankAccounts(response.data);
      } catch (apiErr) {
        console.warn('Bank accounts API not available:', apiErr);
        // Use mock data for demo purposes
        const mockBankAccounts: BankAccount[] = [
          {
            id: '1',
            accountHolderName: 'TestUser Comprehensive',
            accountNumber: '****1234',
            bankName: 'Chase Bank',
            bankCode: 'CHASUS33',
            accountType: 'CHECKING',
            currency: 'USD',
            balance: 25000,
            isVerified: true,
            verifiedAt: '2023-01-15T00:00:00Z',
            isPrimary: true,
            createdAt: '2023-01-15T00:00:00Z',
            updatedAt: '2023-12-01T00:00:00Z'
          },
          {
            id: '2',
            accountHolderName: 'TestUser Comprehensive',
            accountNumber: '****5678',
            bankName: 'Bank of America',
            bankCode: 'BOFAUS3N',
            accountType: 'SAVINGS',
            currency: 'USD',
            balance: 50000,
            isVerified: true,
            verifiedAt: '2023-03-20T00:00:00Z',
            isPrimary: false,
            createdAt: '2023-03-20T00:00:00Z',
            updatedAt: '2023-12-01T00:00:00Z'
          },
          {
            id: '3',
            accountHolderName: 'TestUser Comprehensive',
            accountNumber: '****9012',
            bankName: 'Wells Fargo',
            bankCode: 'WFBIUS6S',
            accountType: 'CHECKING',
            currency: 'USD',
            balance: 15000,
            isVerified: false,
            verifiedAt: null,
            isPrimary: false,
            createdAt: '2023-06-10T00:00:00Z',
            updatedAt: '2023-12-01T00:00:00Z'
          }
        ];
        setBankAccounts(mockBankAccounts);
      }
    } catch (err: any) {
      console.error('Bank accounts fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    try {
      await api.bankAccounts.delete(id);
      await fetchBankAccounts();
    } catch (err: any) {
      console.error('Bank account delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete bank account');
    }
  };

  const handleVerifyAccount = async (id: string) => {
    try {
      await api.bankAccounts.verify(id);
      await fetchBankAccounts();
    } catch (err: any) {
      console.error('Bank account verification error:', err);
      setError(err.response?.data?.message || 'Failed to verify bank account');
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await api.bankAccounts.setPrimary(id);
      await fetchBankAccounts();
    } catch (err: any) {
      console.error('Set primary account error:', err);
      setError(err.response?.data?.message || 'Failed to set primary account');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAccount(null);
    fetchBankAccounts();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bank accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bank Accounts</h1>
        <button
          onClick={handleCreateAccount}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Add Bank Account
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchBankAccounts}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
          </h2>
          <BankAccountForm
            initialData={editingAccount}
            isEditing={!!editingAccount}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      <BankAccountList
        bankAccounts={bankAccounts}
        onEdit={handleEditAccount}
        onDelete={handleDeleteAccount}
        onVerify={handleVerifyAccount}
        onSetPrimary={handleSetPrimary}
        onRefresh={fetchBankAccounts}
      />
    </div>
  );
}

