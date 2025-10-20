'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Investment {
  id: string;
  name: string;
  type: string;
  symbol?: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  gainPercentage: number;
  purchaseDate: string;
}

interface InvestmentListProps {
  portfolioId?: string;
  onEdit?: (investment: Investment) => void;
  onDelete?: (investmentId: string) => void;
}

export default function InvestmentList({
  portfolioId,
  onEdit,
  onDelete,
}: InvestmentListProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvestments();
  }, [portfolioId]);

  const fetchInvestments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const url = portfolioId
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/investments?portfolioId=${portfolioId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/investments`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvestments(response.data.data);
    } catch (err) {
      setError('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (investmentId: string) => {
    if (!confirm('Are you sure you want to delete this investment?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/investments/${investmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchInvestments();
      onDelete?.(investmentId);
    } catch (err) {
      setError('Failed to delete investment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading investments...</p>
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

  if (investments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No investments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {investments.map((investment) => {
        const gainColor = investment.totalGain >= 0 ? 'text-green-600' : 'text-red-600';
        const gainBgColor = investment.totalGain >= 0 ? 'bg-green-50' : 'bg-red-50';

        return (
          <div
            key={investment.id}
            className={`rounded-lg shadow p-6 border-l-4 border-indigo-600 ${gainBgColor}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{investment.name}</h3>
                <p className="text-gray-600 text-sm">
                  {investment.type}
                  {investment.symbol && ` • ${investment.symbol}`}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${gainColor}`}>
                  {investment.totalGain >= 0 ? '+' : ''}${investment.totalGain.toLocaleString()}
                </p>
                <p className={`text-sm ${gainColor}`}>
                  {investment.gainPercentage >= 0 ? '+' : ''}
                  {investment.gainPercentage.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-gray-600 text-sm">Quantity</p>
                <p className="text-gray-900 font-medium">{investment.quantity}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Purchase Price</p>
                <p className="text-gray-900 font-medium">${investment.purchasePrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Current Price</p>
                <p className="text-gray-900 font-medium">${investment.currentPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Value</p>
                <p className="text-gray-900 font-medium">${investment.totalValue.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-white rounded">
              <div>
                <p className="text-gray-600 text-sm">Total Invested</p>
                <p className="text-gray-900 font-medium">${investment.totalInvested.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Purchase Date</p>
                <p className="text-gray-900 font-medium">
                  {new Date(investment.purchaseDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit?.(investment)}
                className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(investment.id)}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

