'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import DepositForm from '@/components/DepositForm';

interface Deposit {
  id: string;
  amount: number;
  currency: string;
  bankAccountId: string;
  bankAccountName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description?: string;
  transactionDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

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

export default function DepositsPage() {
  const { isAuthenticated } = useAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchDeposits();
      fetchBankAccounts();
    }
  }, [isAuthenticated, filters]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.deposits.getAll(params);
      setDeposits(response.data.data || response.data);
    } catch (err: any) {
      console.error('Deposits fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await api.bankAccounts.getAll();
      setBankAccounts(response.data);
    } catch (err: any) {
      console.error('Bank accounts fetch error:', err);
    }
  };

  const handleCreateDeposit = () => {
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchDeposits();
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  const handleCancelDeposit = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this deposit?')) {
      return;
    }

    try {
      await api.deposits.cancel(id);
      await fetchDeposits();
    } catch (err: any) {
      console.error('Cancel deposit error:', err);
      setError(err.response?.data?.message || 'Failed to cancel deposit');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deposits...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Deposits</h1>
        <button
          onClick={handleCreateDeposit}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          New Deposit
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchDeposits}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Deposit</h2>
          <DepositForm
            bankAccounts={bankAccounts}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Deposits List */}
      {deposits.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deposits found</h3>
          <p className="text-gray-600 mb-4">Create your first deposit to start funding your account.</p>
          <button
            onClick={handleCreateDeposit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Create Deposit
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Bank Account</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Description</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">
                        {deposit.currency} ${deposit.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{deposit.bankAccountName}</div>
                        <div className="text-sm text-gray-500">ID: {deposit.bankAccountId}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}>
                        {deposit.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-gray-900">
                          {new Date(deposit.transactionDate).toLocaleDateString()}
                        </div>
                        {deposit.completedAt && (
                          <div className="text-sm text-gray-500">
                            Completed: {new Date(deposit.completedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-900">
                        {deposit.description || 'No description'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        {(deposit.status === 'PENDING' || deposit.status === 'PROCESSING') && (
                          <button
                            onClick={() => handleCancelDeposit(deposit.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                        <button className="text-indigo-600 hover:text-indigo-800 text-sm">
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
