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
}

export default function BankAccountList({
  bankAccounts,
  onEdit,
  onDelete,
  onVerify,
  onSetPrimary,
  onRefresh,
}: BankAccountListProps) {
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
      {bankAccounts.map((account) => (
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
              <p className="text-gray-600 text-sm">Balance</p>
              <p className="text-gray-900 font-medium">
                £{account.balance.toLocaleString()}
              </p>
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
    </div>
  );
}