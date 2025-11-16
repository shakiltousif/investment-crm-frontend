'use client';

import React from 'react';

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

interface BankAccountListProps {
  bankAccounts: BankAccount[];
  onEdit?: (account: BankAccount) => void;
  onDelete?: (accountId: string) => void;
  onVerify?: (accountId: string) => void;
  onSetPrimary?: (accountId: string) => void;
  onRefresh?: () => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
}

export default function BankAccountList({
  bankAccounts,
  onEdit,
  onDelete,
  onVerify,
  onSetPrimary,
  onRefresh,
  pagination,
}: BankAccountListProps) {
  const displayAccounts = pagination
    ? bankAccounts.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize)
    : bankAccounts;
  if (bankAccounts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bank accounts found</h3>
        <p className="text-gray-600">Add your first bank account to start managing your finances.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayAccounts.map((account) => (
        <div
          key={account.id}
          className={`bg-white rounded-lg shadow p-6 border-l-4 ${
            account.isPrimary ? 'border-green-500' : 'border-primary'
          }`}
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
              {account.isVerified ? (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Verified
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  Pending Verification
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
              <p className="text-gray-600 text-sm">Currency</p>
              <p className="text-gray-900 font-medium">{account.currency}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {!account.isPrimary && onSetPrimary && (
              <button
                onClick={() => onSetPrimary(account.id)}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition"
              >
                Set Primary
              </button>
            )}
            {!account.isVerified && onVerify && (
              <button
                onClick={() => onVerify(account.id)}
                className="px-3 py-1 text-sm bg-primary/10 text-primary rounded hover:bg-primary/20 transition"
              >
                Verify Account
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(account)}
                className="px-3 py-1 text-sm bg-primary/10 text-primary rounded hover:bg-primary/20 transition"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(account.id)}
                className="px-3 py-1 text-sm bg-secondary/10 text-secondary rounded hover:bg-secondary/20 transition"
              >
                Delete
              </button>
            )}
          </div>

          {account.verifiedAt && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Verified on: {new Date(account.verifiedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Pagination */}
      {pagination && bankAccounts.length > pagination.pageSize && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} accounts
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Items per page:</label>
              <select
                value={pagination.pageSize}
                onChange={(e) => {
                  pagination.onPageSizeChange(Number(e.target.value));
                  pagination.onPageChange(1);
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
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
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