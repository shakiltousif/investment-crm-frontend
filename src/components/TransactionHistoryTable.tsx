'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  transactionDate: string;
  investment?: {
    name: string;
    symbol?: string;
  };
  bankAccount?: {
    accountNumber: string;
    bankName: string;
  };
}

interface TransactionHistoryTableProps {
  transactions?: Transaction[];
  loading?: boolean;
  error?: string;
  portfolioId?: string;
  onRefresh?: () => void;
}

export default function TransactionHistoryTable({
  transactions = [],
  loading = false,
  error = null,
  portfolioId,
  onRefresh,
}: TransactionHistoryTableProps) {
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1,
  });

  // Calculate pagination from transactions data
  useEffect(() => {
    if (transactions.length > 0) {
      setPagination({
        total: transactions.length,
        pages: Math.ceil(transactions.length / 20),
        currentPage: 1,
      });
    }
  }, [transactions]);


  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Status', 'Description'];
    const rows = transactions.map((t) => [
      new Date(t.transactionDate).toLocaleDateString(),
      t.type,
      `£${t.amount}`,
      t.status,
      t.description,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-secondary/10 text-secondary';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BUY':
      case 'DEPOSIT':
        return 'text-green-600';
      case 'SELL':
      case 'WITHDRAWAL':
        return 'text-secondary';
      default:
        return 'text-gray-600';
    }
  };

  if (loading && transactions.length === 0) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && <div className="bg-secondary/10 text-secondary p-4 rounded-lg">{error}</div>}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-primary text-white border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-right text-sm font-semibold uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">
                  {new Date(transaction.transactionDate).toLocaleDateString()}
                </td>
                <td className={`px-6 py-4 text-sm font-semibold ${getTypeColor(transaction.type)}`}>
                  {transaction.type}
                </td>
                <td className="px-6 py-4 text-sm">{transaction.description}</td>
                <td className="px-6 py-4 text-right font-medium">
                  {transaction.type === 'SELL' || transaction.type === 'WITHDRAWAL' ? '-' : '+'}£{parseFloat(transaction.amount.toString()).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">No transactions found</div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Page {pagination.currentPage} of {pagination.pages} (Total: {pagination.total})
        </div>
        <div className="space-x-2">
          <button
            disabled={pagination.currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={pagination.currentPage === pagination.pages}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

