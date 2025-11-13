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
  error = undefined,
  portfolioId,
  onRefresh,
}: TransactionHistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Calculate pagination from transactions data
  const total = transactions.length;
  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);


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
            {paginatedTransactions.map((transaction) => (
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
      {transactions.length > 0 && (
        <div className="flex justify-between items-center px-6 py-4 border-t">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, total)} of {total} results
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

