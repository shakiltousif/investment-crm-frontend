'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

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

  const fetchAllocation = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/portfolio/${portfolioId}/allocation`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      setAllocation(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load allocation data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6">Loading...</div>;
  }

  if (error || allocation.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
        {error || 'No allocation data available'}
      </div>
    );
  }

  // Calculate pie chart segments
  const total = allocation.reduce((sum, item) => sum + parseFloat(item.value.toString()), 0);
  let currentAngle = 0;
  const segments = allocation.map((item, index) => {
    const percentage = parseFloat(item.percentage.toString());
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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Portfolio Allocation</h2>

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
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">
                  ${parseFloat(item.value.toString()).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary by Type */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="font-semibold mb-4">By Investment Type</h3>
        <div className="grid grid-cols-2 gap-4">
          {Array.from(new Set(allocation.map((a) => a.type))).map((type) => {
            const typeTotal = allocation
              .filter((a) => a.type === type)
              .reduce((sum, item) => sum + parseFloat(item.value.toString()), 0);
            const typePercentage = (typeTotal / total) * 100;

            return (
              <div key={type} className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">{type}</p>
                <p className="font-semibold">${typeTotal.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{typePercentage.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
      </div>

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

