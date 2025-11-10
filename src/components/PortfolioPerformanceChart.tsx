'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface PerformanceData {
  portfolioId: string;
  portfolioName: string;
  totalValue?: number | string | { toString: () => string };
  totalInvested?: number | string | { toString: () => string };
  totalGain?: number | string | { toString: () => string };
  gainPercentage?: number | string | { toString: () => string };
  dayChange?: number | string | { toString: () => string };
  dayChangePercentage?: number | string | { toString: () => string };
  weekChange?: number | string | { toString: () => string };
  monthChange?: number | string | { toString: () => string };
  yearChange?: number | string | { toString: () => string };
}

interface PortfolioPerformanceChartProps {
  portfolioId: string;
}

interface ProcessedPerformanceData {
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

export default function PortfolioPerformanceChart({ portfolioId }: PortfolioPerformanceChartProps) {
  const [performance, setPerformance] = useState<ProcessedPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchPerformance();
  }, [portfolioId]);

  // Helper function to safely convert Decimal or number to number
  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    if (typeof value === 'object' && 'toString' in value) {
      return parseFloat(value.toString()) || 0;
    }
    return 0;
  };

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const response = await api.analytics.getPortfolioPerformance({ portfolioId });
      const data = response.data.data || response.data;
      
      // Convert all Decimal values to numbers
      if (data) {
        const processed: ProcessedPerformanceData = {
          portfolioId: data.portfolioId || '',
          portfolioName: data.portfolioName || '',
          totalValue: toNumber(data.totalValue),
          totalInvested: toNumber(data.totalInvested),
          totalGain: toNumber(data.totalGain),
          gainPercentage: toNumber(data.gainPercentage),
          dayChange: toNumber(data.dayChange),
          dayChangePercentage: toNumber(data.dayChangePercentage),
          weekChange: toNumber(data.weekChange),
          monthChange: toNumber(data.monthChange),
          yearChange: toNumber(data.yearChange),
        };
        setPerformance(processed);
      } else {
        setPerformance(null);
      }
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
    return <div className="bg-white rounded-lg shadow p-6 text-secondary">{error}</div>;
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
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold">{performance.portfolioName}</h2>
          <p className="text-gray-600 text-sm mt-1">Portfolio Performance</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['day', 'week', 'month', 'year'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                timeframe === tf
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Total Value */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/20 p-4 rounded-lg">
          <p className="text-gray-600 text-sm mb-1">Total Value</p>
          <p className="text-2xl font-bold text-primary">
            £{performance.totalValue.toFixed(2)}
          </p>
        </div>

        {/* Total Invested */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
          <p className="text-gray-600 text-sm mb-1">Total Invested</p>
          <p className="text-2xl font-bold text-gray-700">
            £{performance.totalInvested.toFixed(2)}
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
              performance.totalGain >= 0 ? 'text-green-600' : 'text-secondary'
            }`}
          >
            £{performance.totalGain.toFixed(2)}
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
              performance.gainPercentage >= 0 ? 'text-green-600' : 'text-secondary'
            }`}
          >
            {performance.gainPercentage.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Period Change */}
      <div className="border-t pt-4 mt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-gray-600 text-sm font-medium">
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Change
          </span>
          <div className="text-left sm:text-right">
            <p
              className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-secondary'}`}
            >
              {isPositive ? '+' : ''}£{changeValue.toFixed(2)}
            </p>
            <p
              className={`text-sm ${isPositive ? 'text-green-600' : 'text-secondary'}`}
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

