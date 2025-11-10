'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import WithdrawalForm from '@/components/WithdrawalForm';

interface Withdrawal {
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

export default function WithdrawalsPage() {
  const { isAuthenticated } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [withdrawalDetails, setWithdrawalDetails] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchWithdrawals();
      fetchBankAccounts();
    }
  }, [isAuthenticated, filters]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.withdrawals.getAll(params);
      setWithdrawals(response.data.data || response.data);
    } catch (err: any) {
      console.error('Withdrawals fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load withdrawals');
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

  const handleCreateWithdrawal = () => {
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchWithdrawals();
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  const handleCancelWithdrawal = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this withdrawal?')) {
      return;
    }

    try {
      await api.withdrawals.cancel(id);
      await fetchWithdrawals();
    } catch (err: any) {
      console.error('Cancel withdrawal error:', err);
      setError(err.response?.data?.message || 'Failed to cancel withdrawal');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewDetails = async (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    setWithdrawalDetails(null);

    try {
      const response = await api.withdrawals.getById(withdrawal.id);
      setWithdrawalDetails(response.data.data || response.data);
    } catch (err: any) {
      console.error('Failed to fetch withdrawal details:', err);
      setError(err.response?.data?.message || 'Failed to load withdrawal details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedWithdrawal(null);
    setWithdrawalDetails(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'PROCESSING':
        return 'text-primary bg-primary/10';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'FAILED':
        return 'text-secondary bg-secondary/10';
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Withdrawals</h1>
        <button
          onClick={handleCreateWithdrawal}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          New Withdrawal
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchWithdrawals}
            className="mt-2 px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90"
          >
            Retry
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Withdrawal</h2>
          <WithdrawalForm
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Withdrawals List */}
      {withdrawals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No withdrawals found</h3>
          <p className="text-gray-600 mb-4">Create your first withdrawal to transfer funds to your bank account.</p>
          <button
            onClick={handleCreateWithdrawal}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Create Withdrawal
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
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">
                        £{withdrawal.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{withdrawal.bankAccountName}</div>
                        <div className="text-sm text-gray-500">ID: {withdrawal.bankAccountId}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-gray-900">
                          {new Date(withdrawal.transactionDate).toLocaleDateString()}
                        </div>
                        {withdrawal.completedAt && (
                          <div className="text-sm text-gray-500">
                            Completed: {new Date(withdrawal.completedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-900">
                        {withdrawal.description || 'No description'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        {(withdrawal.status === 'PENDING' || withdrawal.status === 'PROCESSING') && (
                          <button
                            onClick={() => handleCancelWithdrawal(withdrawal.id)}
                            className="text-secondary hover:text-secondary/80 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetails(withdrawal)}
                          className="text-primary hover:text-primary/80 text-sm"
                        >
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

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Withdrawal Details</h2>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {detailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : withdrawalDetails ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                      <p className="text-lg font-semibold text-gray-900">
                        £{Number(withdrawalDetails.amount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(withdrawalDetails.status)}`}>
                        {withdrawalDetails.status}
                      </span>
                    </div>
                  </div>

                  {withdrawalDetails.bankAccount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                      <p className="text-gray-900">
                        {withdrawalDetails.bankAccount.bankName} - ****{withdrawalDetails.bankAccount.accountNumber?.slice(-4) || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">Account Type: {withdrawalDetails.bankAccount.accountType}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date</label>
                      <p className="text-gray-900">
                        {new Date(withdrawalDetails.transactionDate || withdrawalDetails.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {withdrawalDetails.completedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Completed At</label>
                        <p className="text-gray-900">
                          {new Date(withdrawalDetails.completedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {withdrawalDetails.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-gray-900">{withdrawalDetails.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                      <p className="text-gray-900">
                        {new Date(withdrawalDetails.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                      <p className="text-gray-900">
                        {new Date(withdrawalDetails.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">Failed to load withdrawal details</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCloseDetails}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
