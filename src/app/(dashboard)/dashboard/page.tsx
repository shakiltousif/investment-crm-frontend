'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface DashboardData {
  portfolioValue: number;
  totalInvested: number;
  totalGain: number;
  gainPercentage: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    date: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        // For now, we'll use mock data since the backend endpoint isn't fully implemented
        setData({
          portfolioValue: 50000,
          totalInvested: 45000,
          totalGain: 5000,
          gainPercentage: 11.11,
          recentTransactions: [
            { id: '1', type: 'BUY', amount: 1000, date: '2025-10-15' },
            { id: '2', type: 'DEPOSIT', amount: 5000, date: '2025-10-14' },
            { id: '3', type: 'DIVIDEND', amount: 250, date: '2025-10-13' },
          ],
        });
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium mb-2">Portfolio Value</p>
          <p className="text-3xl font-bold text-gray-900">${data?.portfolioValue.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium mb-2">Total Invested</p>
          <p className="text-3xl font-bold text-gray-900">${data?.totalInvested.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium mb-2">Total Gain</p>
          <p className="text-3xl font-bold text-green-600">${data?.totalGain.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium mb-2">Gain Percentage</p>
          <p className="text-3xl font-bold text-green-600">{data?.gainPercentage.toFixed(2)}%</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{transaction.type}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">${transaction.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-600">{transaction.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

