'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface PortfolioSummary {
  totalPortfolios: number;
  totalPortfolioValue: number;
  totalInvested: number;
  totalGain: number;
  gainPercentage: number;
  portfolios: Array<{
    id: string;
    name: string;
    description: string;
    investmentCount: number;
  }>;
}

interface TransactionStats {
  totalTransactions: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  totalBuys: number;
  totalSells: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [summaryRes, statsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/summary`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/transactions/statistics`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ]);

      setSummary(summaryRes.data.data);
      setStats(statsRes.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      {summary && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Portfolio Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Portfolios */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Total Portfolios</p>
              <p className="text-3xl font-bold text-blue-600">{summary.totalPortfolios}</p>
            </div>

            {/* Total Value */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Total Value</p>
              <p className="text-3xl font-bold text-purple-600">
                ${parseFloat(summary.totalPortfolioValue.toString()).toFixed(2)}
              </p>
            </div>

            {/* Total Invested */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Total Invested</p>
              <p className="text-3xl font-bold text-gray-700">
                ${parseFloat(summary.totalInvested.toString()).toFixed(2)}
              </p>
            </div>

            {/* Total Gain */}
            <div
              className={`bg-gradient-to-br p-4 rounded-lg ${
                summary.totalGain >= 0
                  ? 'from-green-50 to-green-100'
                  : 'from-red-50 to-red-100'
              }`}
            >
              <p className="text-gray-600 text-sm mb-2">Total Gain/Loss</p>
              <p
                className={`text-3xl font-bold ${
                  summary.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${parseFloat(summary.totalGain.toString()).toFixed(2)}
              </p>
              <p
                className={`text-sm mt-1 ${
                  summary.gainPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {summary.gainPercentage.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Portfolios List */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Your Portfolios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.portfolios.map((portfolio) => (
                <div key={portfolio.id} className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold">{portfolio.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{portfolio.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {portfolio.investmentCount} investments
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Statistics */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Transaction Statistics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Transactions */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Total Transactions</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.totalTransactions}</p>
            </div>

            {/* Total Buys */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Total Buys</p>
              <p className="text-3xl font-bold text-green-600">
                ${parseFloat(stats.totalBuys.toString()).toFixed(2)}
              </p>
            </div>

            {/* Total Sells */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Total Sells</p>
              <p className="text-3xl font-bold text-orange-600">
                ${parseFloat(stats.totalSells.toString()).toFixed(2)}
              </p>
            </div>

            {/* Total Deposits */}
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Total Deposits</p>
              <p className="text-3xl font-bold text-cyan-600">
                ${parseFloat(stats.totalDeposits.toString()).toFixed(2)}
              </p>
            </div>
          </div>

          {/* By Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-4">By Transaction Type</h3>
              <div className="space-y-2">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <span className="text-sm font-medium">{type}</span>
                    <span className="text-sm font-bold text-blue-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Status */}
            <div>
              <h3 className="font-semibold mb-4">By Status</h3>
              <div className="space-y-2">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <span className="text-sm font-medium">{status}</span>
                    <span className="text-sm font-bold text-blue-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchAnalytics}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        Refresh Analytics
      </button>
    </div>
  );
}

