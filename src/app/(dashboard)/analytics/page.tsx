'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import PortfolioPerformanceChart from '@/components/PortfolioPerformanceChart';
import PortfolioAllocationChart from '@/components/PortfolioAllocationChart';

interface AnalyticsData {
  portfolioPerformance: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }>;
  };
  portfolioAllocation: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
    }>;
  };
  investmentPerformance: Array<{
    name: string;
    value: number;
    change: number;
    changePercentage: number;
  }>;
  transactionStats: {
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalInvestments: number;
    averageTransactionAmount: number;
  };
  dashboardMetrics: {
    totalPortfolioValue: number;
    totalInvested: number;
    totalGain: number;
    gainPercentage: number;
    monthlyReturn: number;
    yearlyReturn: number;
  };
}

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('1Y');
  const [selectedPortfolio, setSelectedPortfolio] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalyticsData();
    }
  }, [isAuthenticated, timeRange, selectedPortfolio]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {
        timeRange,
      };
      
      if (selectedPortfolio) {
        params.portfolioId = selectedPortfolio;
      }

      // Fetch all analytics data in parallel
      const [
        portfolioPerformanceResponse,
        portfolioAllocationResponse,
        investmentPerformanceResponse,
        transactionStatsResponse,
        dashboardDataResponse,
      ] = await Promise.all([
        api.analytics.getPortfolioPerformance(params),
        api.analytics.getPortfolioAllocation(),
        api.analytics.getInvestmentPerformance(params),
        api.analytics.getTransactionStats(params),
        api.analytics.getDashboardData(),
      ]);

      setAnalyticsData({
        portfolioPerformance: portfolioPerformanceResponse.data,
        portfolioAllocation: portfolioAllocationResponse.data,
        investmentPerformance: investmentPerformanceResponse.data,
        transactionStats: transactionStatsResponse.data,
        dashboardMetrics: dashboardDataResponse.data,
      });
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange);
  };

  const handlePortfolioChange = (portfolioId: string) => {
    setSelectedPortfolio(portfolioId);
  };

  const exportAnalytics = () => {
    if (!analyticsData) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Portfolio Value', analyticsData.dashboardMetrics.totalPortfolioValue],
      ['Total Invested', analyticsData.dashboardMetrics.totalInvested],
      ['Total Gain', analyticsData.dashboardMetrics.totalGain],
      ['Gain Percentage', analyticsData.dashboardMetrics.gainPercentage],
      ['Monthly Return', analyticsData.dashboardMetrics.monthlyReturn],
      ['Yearly Return', analyticsData.dashboardMetrics.yearlyReturn],
      ['Total Transactions', analyticsData.transactionStats.totalTransactions],
      ['Total Deposits', analyticsData.transactionStats.totalDeposits],
      ['Total Withdrawals', analyticsData.transactionStats.totalWithdrawals],
      ['Total Investments', analyticsData.transactionStats.totalInvestments],
      ['Average Transaction Amount', analyticsData.transactionStats.averageTransactionAmount],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-4">
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="1M">Last Month</option>
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months</option>
            <option value="1Y">Last Year</option>
            <option value="2Y">Last 2 Years</option>
            <option value="5Y">Last 5 Years</option>
          </select>
          <button
            onClick={exportAnalytics}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Export Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchAnalyticsData}
            className="mt-2 px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90"
          >
            Retry
          </button>
        </div>
      )}

      {analyticsData && (
        <>
          {/* Dashboard Metrics */}
          <AnalyticsDashboard
            metrics={analyticsData.dashboardMetrics}
            transactionStats={analyticsData.transactionStats}
          />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Portfolio Performance Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Portfolio Performance</h2>
              <PortfolioPerformanceChart portfolioId="all" />
            </div>

            {/* Portfolio Allocation Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Portfolio Allocation</h2>
              <PortfolioAllocationChart portfolioId="all" />
            </div>
          </div>

          {/* Investment Performance Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Investment Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Investment</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Current Value</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Change</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Change %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analyticsData.investmentPerformance.map((investment, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">{investment.name}</td>
                      <td className="py-4 px-6 text-gray-900">£{investment.value.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <span className={`font-medium ${investment.change >= 0 ? 'text-green-600' : 'text-secondary'}`}>
                          £{investment.change.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`font-medium ${investment.changePercentage >= 0 ? 'text-green-600' : 'text-secondary'}`}>
                          {investment.changePercentage >= 0 ? '+' : ''}{investment.changePercentage.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
