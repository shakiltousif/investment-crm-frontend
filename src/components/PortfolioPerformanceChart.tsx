'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface PerformanceData {
  portfolioId: string;
  portfolioName: string;
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  gainPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  weekChange: number;
  monthChange: number;
  yearChange: number;
}

interface PortfolioPerformanceChartProps {
  portfolioId: string;
}

export default function PortfolioPerformanceChart({ portfolioId }: PortfolioPerformanceChartProps) {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchPerformance();
  }, [portfolioId]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/portfolio/${portfolioId}/performance`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      setPerformance(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load performance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6">Loading...</div>;
  }

  if (error || !performance) {
    return <div className="bg-white rounded-lg shadow p-6 text-red-600">{error}</div>;
  }

  const getChangeValue = () => {
    switch (timeframe) {
      case 'day':
        return performance.dayChange;
      case 'week':
        return performance.weekChange;
      case 'month':
        return performance.monthChange;
      case 'year':
        return performance.yearChange;
      default:
        return 0;
    }
  };

  const getChangePercentage = () => {
    switch (timeframe) {
      case 'day':
        return performance.dayChangePercentage;
      case 'week':
        return performance.weekChange;
      case 'month':
        return performance.monthChange;
      case 'year':
        return performance.yearChange;
      default:
        return 0;
    }
  };

  const changeValue = getChangeValue();
  const isPositive = changeValue >= 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">{performance.portfolioName}</h2>
          <p className="text-gray-600 text-sm mt-1">Portfolio Performance</p>
        </div>
        <div className="flex gap-2">
          {(['day', 'week', 'month', 'year'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                timeframe === tf
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Value */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <p className="text-gray-600 text-sm mb-1">Total Value</p>
          <p className="text-2xl font-bold text-blue-600">
            ${parseFloat(performance.totalValue.toString()).toFixed(2)}
          </p>
        </div>

        {/* Total Invested */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
          <p className="text-gray-600 text-sm mb-1">Total Invested</p>
          <p className="text-2xl font-bold text-gray-700">
            ${parseFloat(performance.totalInvested.toString()).toFixed(2)}
          </p>
        </div>

        {/* Total Gain */}
        <div
          className={`bg-gradient-to-br p-4 rounded-lg ${
            performance.totalGain >= 0
              ? 'from-green-50 to-green-100'
              : 'from-red-50 to-red-100'
          }`}
        >
          <p className="text-gray-600 text-sm mb-1">Total Gain/Loss</p>
          <p
            className={`text-2xl font-bold ${
              performance.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            ${parseFloat(performance.totalGain.toString()).toFixed(2)}
          </p>
        </div>

        {/* Gain Percentage */}
        <div
          className={`bg-gradient-to-br p-4 rounded-lg ${
            performance.gainPercentage >= 0
              ? 'from-green-50 to-green-100'
              : 'from-red-50 to-red-100'
          }`}
        >
          <p className="text-gray-600 text-sm mb-1">Return %</p>
          <p
            className={`text-2xl font-bold ${
              performance.gainPercentage >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {Number(performance.gainPercentage).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Period Change */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Change
          </span>
          <div className="text-right">
            <p
              className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
            >
              {isPositive ? '+' : ''}${changeValue.toFixed(2)}
            </p>
            <p
              className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}
            >
              {isPositive ? '+' : ''}{getChangePercentage().toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchPerformance}
        className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
      >
        Refresh Data
      </button>
    </div>
  );
}

