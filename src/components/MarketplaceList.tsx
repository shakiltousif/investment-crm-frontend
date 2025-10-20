'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Investment {
  id: string;
  name: string;
  symbol?: string;
  type: string;
  currentPrice: number;
  gainPercentage: number;
  totalValue: number;
}

interface MarketplaceListProps {
  onSelectInvestment?: (investment: Investment) => void;
  onBuy?: (investment: Investment) => void;
}

export default function MarketplaceList({ onSelectInvestment, onBuy }: MarketplaceListProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    search: '',
    sortBy: 'name',
    limit: 20,
    offset: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1,
  });

  useEffect(() => {
    fetchInvestments();
  }, [filters]);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);
      params.append('sortBy', filters.sortBy);
      params.append('limit', filters.limit.toString());
      params.append('offset', filters.offset.toString());

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace?${params}`,
      );

      setInvestments(response.data.data.data);
      setPagination({
        total: response.data.data.pagination.total,
        pages: response.data.data.pagination.pages,
        currentPage: Math.floor(filters.offset / filters.limit) + 1,
      });
    } catch (err) {
      setError('Failed to fetch investments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset to first page
    }));
  };

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.pages) {
      setFilters((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.currentPage > 1) {
      setFilters((prev) => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit),
      }));
    }
  };

  if (loading && investments.length === 0) {
    return <div className="text-center py-8">Loading investments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="font-semibold text-lg">Filters</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Investment Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Types</option>
              <option value="STOCK">Stock</option>
              <option value="BOND">Bond</option>
              <option value="TERM_DEPOSIT">Term Deposit</option>
              <option value="MUTUAL_FUND">Mutual Fund</option>
              <option value="ETF">ETF</option>
              <option value="CRYPTOCURRENCY">Cryptocurrency</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name or symbol..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="return">Return</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}

      {/* Investments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Price</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Return %</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((investment) => (
              <tr key={investment.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{investment.name}</p>
                    {investment.symbol && <p className="text-sm text-gray-500">{investment.symbol}</p>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{investment.type}</td>
                <td className="px-6 py-4 text-right font-medium">
                  ${parseFloat(investment.currentPrice.toString()).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`font-medium ${
                      investment.gainPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {investment.gainPercentage >= 0 ? '+' : ''}
                    {parseFloat(investment.gainPercentage.toString()).toFixed(2)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-center space-x-2">
                  <button
                    onClick={() => onSelectInvestment?.(investment)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onBuy?.(investment)}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Buy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {investments.length === 0 && (
          <div className="text-center py-8 text-gray-500">No investments found</div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Page {pagination.currentPage} of {pagination.pages} (Total: {pagination.total})
        </div>
        <div className="space-x-2">
          <button
            onClick={handlePrevPage}
            disabled={pagination.currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={pagination.currentPage === pagination.pages}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

