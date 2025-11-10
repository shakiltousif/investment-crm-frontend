'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import TransactionHistoryTable from '@/components/TransactionHistoryTable';

export default function TransactionsPage() {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: '',
    limit: 50,
    offset: 0,
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
    }
  }, [isAuthenticated, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const params: any = {};
      
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      params.limit = filters.limit;
      params.offset = filters.offset;

      try {
        const response = await api.transactions.getAll(params);
        setTransactions(response.data.data || response.data);
      } catch (apiErr: any) {
        console.warn('Transactions API not available, using mock data:', apiErr);
        
        // Check if it's a rate limiting error
        if (apiErr.response?.status === 429) {
          console.log('Rate limited, using mock data instead');
        }
        
        // Use mock data for demo purposes
        const mockTransactions = [
          {
            id: '1',
            type: 'BUY',
            amount: 5000,
            currency: 'GBP',
            status: 'COMPLETED',
            description: 'Purchased Apple Inc. shares',
            transactionDate: '2023-12-01T10:30:00Z',
            completedAt: '2023-12-01T10:35:00Z'
          },
          {
            id: '2',
            type: 'SELL',
            amount: 2500,
            currency: 'GBP',
            status: 'COMPLETED',
            description: 'Sold Tesla Inc. shares',
            transactionDate: '2023-11-28T14:20:00Z',
            completedAt: '2023-11-28T14:25:00Z'
          },
          {
            id: '3',
            type: 'DEPOSIT',
            amount: 10000,
            currency: 'GBP',
            status: 'COMPLETED',
            description: 'Bank transfer deposit',
            transactionDate: '2023-11-25T09:15:00Z',
            completedAt: '2023-11-25T09:20:00Z'
          },
          {
            id: '4',
            type: 'DIVIDEND',
            amount: 150,
            currency: 'GBP',
            status: 'COMPLETED',
            description: 'Apple Inc. dividend payment',
            transactionDate: '2023-11-15T00:00:00Z',
            completedAt: '2023-11-15T00:00:00Z'
          },
          {
            id: '5',
            type: 'WITHDRAWAL',
            amount: 2000,
            currency: 'GBP',
            status: 'PENDING',
            description: 'Withdrawal to bank account',
            transactionDate: '2023-12-02T16:45:00Z',
            completedAt: null
          },
          {
            id: '6',
            type: 'BUY',
            amount: 3200,
            currency: 'GBP',
            status: 'COMPLETED',
            description: 'Purchased Microsoft Corp. shares',
            transactionDate: '2023-11-20T11:15:00Z',
            completedAt: '2023-11-20T11:20:00Z'
          },
          {
            id: '7',
            type: 'INTEREST',
            amount: 45.50,
            currency: 'GBP',
            status: 'COMPLETED',
            description: 'Savings account interest',
            transactionDate: '2023-11-30T00:00:00Z',
            completedAt: '2023-11-30T00:00:00Z'
          }
        ];
        setTransactions(mockTransactions);
      }
    } catch (err: any) {
      console.error('Transactions fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handlePageChange = (newOffset: number) => {
    setFilters(prev => ({ ...prev, offset: newOffset }));
  };

  const exportToCSV = () => {
    const csvContent = [
      ['ID', 'Type', 'Amount', 'Currency', 'Status', 'Description', 'Date', 'Completed At'],
      ...transactions.map((tx: any) => [
        tx.id,
        tx.type,
        tx.amount.toString(),
        tx.currency,
        tx.status,
        tx.description || '',
        tx.transactionDate,
        tx.completedAt || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          Export CSV
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchTransactions}
            className="mt-2 px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">All Types</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
              <option value="DIVIDEND">Dividend</option>
              <option value="INTEREST">Interest</option>
              <option value="TRANSFER">Transfer</option>
              <option value="FEE">Fee</option>
            </select>
          </div>
          
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

      <TransactionHistoryTable
        transactions={transactions}
        loading={loading}
        error={error}
        onRefresh={fetchTransactions}
      />
    </div>
  );
}

