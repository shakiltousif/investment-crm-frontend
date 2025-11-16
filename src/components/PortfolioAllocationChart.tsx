'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface AllocationData {
  investmentId: string;
  name: string;
  symbol: string;
  type: string;
  value: number;
  percentage: number;
}

interface PortfolioAllocationChartProps {
  portfolioId: string;
}

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

export default function PortfolioAllocationChart({ portfolioId }: PortfolioAllocationChartProps) {
  const [allocation, setAllocation] = useState<AllocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllocation();
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

  const fetchAllocation = async () => {
    try {
      setLoading(true);
      const response = await api.analytics.getPortfolioAllocation();
      const data = response.data.data || response.data || [];
      
      // Handle nested structure (portfolios with investments array)
      // or flat structure (array of investments)
      let investments: any[] = [];
      
      if (Array.isArray(data)) {
        // Check if first item has 'investments' property (nested structure)
        if (data.length > 0 && data[0].investments && Array.isArray(data[0].investments)) {
          // Flatten: extract all investments from all portfolios
          investments = data.flatMap((portfolio: any) => 
            (portfolio.investments || []).map((inv: any) => ({
              investmentId: inv.investmentId || inv.id,
              name: inv.name,
              symbol: inv.symbol || '',
              type: inv.type,
              value: toNumber(inv.value),
              percentage: toNumber(inv.percentage),
            }))
          );
        } else {
          // Flat structure - already an array of investments
          investments = data.map((item: any) => ({
            investmentId: item.investmentId || item.id,
            name: item.name,
            symbol: item.symbol || '',
            type: item.type,
            value: toNumber(item.value),
            percentage: toNumber(item.percentage),
          }));
        }
      }
      
      // Recalculate percentages to ensure they add up to 100%
      const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);
      const processed = investments.map((inv) => ({
        ...inv,
        percentage: totalValue > 0 ? (inv.value / totalValue) * 100 : 0,
      }));
      
      setAllocation(processed);
      setError(null);
    } catch (err) {
      setError('Failed to load allocation data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading allocation data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-secondary mb-2">{error}</p>
        <button
          onClick={fetchAllocation}
          className="text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (allocation.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600 mb-4">No allocation data available</p>
        <p className="text-sm text-gray-500 mb-4">Start investing to see your portfolio allocation</p>
        <button
          onClick={fetchAllocation}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
        >
          Refresh Data
        </button>
      </div>
    );
  }

  // Calculate pie chart segments
  const total = allocation.reduce((sum, item) => {
    const value = typeof item.value === 'number' ? item.value : parseFloat(String(item.value)) || 0;
    return sum + value;
  }, 0);
  
  // Recalculate percentages to ensure they sum to exactly 100%
  const normalizedAllocation = allocation.map((item) => {
    const value = typeof item.value === 'number' ? item.value : parseFloat(String(item.value)) || 0;
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return { ...item, value, percentage };
  });
  
  // Verify percentages sum to 100% (with small tolerance for floating point)
  const sumPercentage = normalizedAllocation.reduce((sum, item) => sum + item.percentage, 0);
  if (Math.abs(sumPercentage - 100) > 0.01 && total > 0) {
    console.warn(`Portfolio allocation percentages sum to ${sumPercentage.toFixed(2)}%, normalizing to 100%`);
  }
  
  let currentAngle = 0;
  const segments = normalizedAllocation.map((item, index) => {
    const percentage = item.percentage;
    const sliceAngle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = 100 + 80 * Math.cos(startRad);
    const y1 = 100 + 80 * Math.sin(startRad);
    const x2 = 100 + 80 * Math.cos(endRad);
    const y2 = 100 + 80 * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;
    const pathData = [
      `M 100 100`,
      `L ${x1} ${y1}`,
      `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    return {
      ...item,
      pathData,
      color: COLORS[index % COLORS.length],
    };
  });

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">Portfolio Allocation</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="flex justify-center">
          <svg width="250" height="250" viewBox="0 0 200 200">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={segment.pathData}
                fill={segment.color}
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {segments.map((item, index) => (
            <div key={item.investmentId || `segment-${index}`} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.symbol || item.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">
                  £{item.value.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Total Summary */}
      {total > 0 && (
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-sm text-gray-600">Total Portfolio Value</p>
          <p className="text-xl font-bold text-primary">£{total.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {normalizedAllocation.reduce((sum, item) => sum + item.percentage, 0).toFixed(1)}% allocated
          </p>
        </div>
      )}

      {/* Summary by Type */}
      {total > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-4">By Investment Type</h3>
          <div className="grid grid-cols-2 gap-4">
            {Array.from(new Set(normalizedAllocation.map((a) => a.type))).map((type, typeIndex) => {
              const typeTotal = normalizedAllocation
                .filter((a) => a.type === type)
                .reduce((sum, item) => sum + item.value, 0);
              const typePercentage = total > 0 ? (typeTotal / total) * 100 : 0;

              return (
                <div key={`type-${type}-${typeIndex}`} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">{type}</p>
                  <p className="font-semibold">£{typeTotal.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{typePercentage.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchAllocation}
        className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
      >
        Refresh Data
      </button>
    </div>
  );
}

