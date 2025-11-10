'use client';

import React from 'react';

interface DashboardMetrics {
  totalPortfolioValue: number;
  totalInvested: number;
  totalGain: number;
  gainPercentage: number;
  monthlyReturn: number;
  yearlyReturn: number;
}

interface TransactionStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalInvestments: number;
  averageTransactionAmount: number;
}

interface AnalyticsDashboardProps {
  metrics: DashboardMetrics;
  transactionStats: TransactionStats;
}

export default function AnalyticsDashboard({ metrics, transactionStats }: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Portfolio Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Portfolio Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Total Portfolio Value */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/20 p-4 rounded-lg">
            <p className="text-gray-600 text-sm mb-2">Total Portfolio Value</p>
                  <p className="text-3xl font-bold text-primary">
                    £{(metrics.totalPortfolioValue || 0).toLocaleString()}
                  </p>
          </div>

          {/* Total Invested */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm mb-2">Total Invested</p>
                  <p className="text-3xl font-bold text-purple-600">
                    £{(metrics.totalInvested || 0).toLocaleString()}
                  </p>
          </div>

          {/* Total Gain/Loss */}
          <div
            className={`bg-gradient-to-br p-4 rounded-lg ${
              metrics.totalGain >= 0
                ? 'from-green-50 to-green-100'
                : 'from-red-50 to-red-100'
            }`}
          >
            <p className="text-gray-600 text-sm mb-2">Total Gain/Loss</p>
                  <p
                    className={`text-3xl font-bold ${
                      (metrics.totalGain || 0) >= 0 ? 'text-green-600' : 'text-secondary'
                    }`}
                  >
                    £{(metrics.totalGain || 0).toLocaleString()}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      (metrics.gainPercentage || 0) >= 0 ? 'text-green-600' : 'text-secondary'
                    }`}
                  >
                    {(metrics.gainPercentage || 0) >= 0 ? '+' : ''}{(metrics.gainPercentage || 0).toFixed(2)}%
                  </p>
          </div>

          {/* Monthly Return */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/20 p-4 rounded-lg">
            <p className="text-gray-600 text-sm mb-2">Monthly Return</p>
                  <p
                    className={`text-2xl font-bold ${
                      (metrics.monthlyReturn || 0) >= 0 ? 'text-green-600' : 'text-secondary'
                    }`}
                  >
                    {(metrics.monthlyReturn || 0) >= 0 ? '+' : ''}{(metrics.monthlyReturn || 0).toFixed(2)}%
                  </p>
          </div>

          {/* Yearly Return */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm mb-2">Yearly Return</p>
                  <p
                    className={`text-2xl font-bold ${
                      (metrics.yearlyReturn || 0) >= 0 ? 'text-green-600' : 'text-secondary'
                    }`}
                  >
                    {(metrics.yearlyReturn || 0) >= 0 ? '+' : ''}{(metrics.yearlyReturn || 0).toFixed(2)}%
                  </p>
          </div>

          {/* Average Transaction */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm mb-2">Avg Transaction</p>
                  <p className="text-2xl font-bold text-orange-600">
                    £{(transactionStats.averageTransactionAmount || 0).toLocaleString()}
                  </p>
          </div>
        </div>
      </div>

      {/* Transaction Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Transaction Statistics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Transactions */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm mb-2">Total Transactions</p>
                  <p className="text-3xl font-bold text-gray-700">
                    {(transactionStats.totalTransactions || 0).toLocaleString()}
                  </p>
          </div>

          {/* Total Deposits */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm mb-2">Total Deposits</p>
                  <p className="text-3xl font-bold text-green-600">
                    £{(transactionStats.totalDeposits || 0).toLocaleString()}
                  </p>
          </div>

          {/* Total Withdrawals */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm mb-2">Total Withdrawals</p>
                  <p className="text-3xl font-bold text-secondary">
                    £{(transactionStats.totalWithdrawals || 0).toLocaleString()}
                  </p>
          </div>

          {/* Total Investments */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/20 p-4 rounded-lg">
            <p className="text-gray-600 text-sm mb-2">Total Investments</p>
                  <p className="text-3xl font-bold text-primary">
                    £{(transactionStats.totalInvestments || 0).toLocaleString()}
                  </p>
          </div>
        </div>
      </div>
    </div>
  );
}

