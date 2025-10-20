'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface InvestmentFormProps {
  portfolioId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
  isEditing?: boolean;
}

const INVESTMENT_TYPES = [
  'STOCK',
  'BOND',
  'TERM_DEPOSIT',
  'PRIVATE_EQUITY',
  'MUTUAL_FUND',
  'ETF',
  'CRYPTOCURRENCY',
  'OTHER',
];

export default function InvestmentForm({
  portfolioId,
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
}: InvestmentFormProps) {
  const [formData, setFormData] = useState({
    portfolioId,
    type: initialData?.type || 'STOCK',
    name: initialData?.name || '',
    symbol: initialData?.symbol || '',
    quantity: initialData?.quantity || '',
    purchasePrice: initialData?.purchasePrice || '',
    currentPrice: initialData?.currentPrice || '',
    purchaseDate: initialData?.purchaseDate?.split('T')[0] || '',
    maturityDate: initialData?.maturityDate?.split('T')[0] || '',
    interestRate: initialData?.interestRate || '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);

  useEffect(() => {
    const invested = parseFloat(formData.quantity || 0) * parseFloat(formData.purchasePrice || 0);
    const value = parseFloat(formData.quantity || 0) * parseFloat(formData.currentPrice || 0);
    setTotalInvested(invested);
    setTotalValue(value);
  }, [formData.quantity, formData.purchasePrice, formData.currentPrice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/investments/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/investments`;

      const method = isEditing ? 'PUT' : 'POST';

      await axios({
        method,
        url,
        data: {
          ...formData,
          quantity: parseFloat(formData.quantity),
          purchasePrice: parseFloat(formData.purchasePrice),
          currentPrice: parseFloat(formData.currentPrice),
          interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      onSuccess?.();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to save investment');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Investment Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {INVESTMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Investment Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Apple Inc."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Symbol (Optional)
        </label>
        <input
          type="text"
          name="symbol"
          value={formData.symbol}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="AAPL"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purchase Price
          </label>
          <input
            type="number"
            name="purchasePrice"
            value={formData.purchasePrice}
            onChange={handleChange}
            required
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="150.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Price
          </label>
          <input
            type="number"
            name="currentPrice"
            value={formData.currentPrice}
            onChange={handleChange}
            required
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="175.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-gray-600 text-sm">Total Invested</p>
          <p className="text-lg font-bold text-gray-900">${totalInvested.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Current Value</p>
          <p className="text-lg font-bold text-gray-900">${totalValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purchase Date
          </label>
          <input
            type="date"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maturity Date (Optional)
          </label>
          <input
            type="date"
            name="maturityDate"
            value={formData.maturityDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Interest Rate (Optional)
        </label>
        <input
          type="number"
          name="interestRate"
          value={formData.interestRate}
          onChange={handleChange}
          step="0.01"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="5.5"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Investment' : 'Create Investment'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

