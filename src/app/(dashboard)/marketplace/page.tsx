'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import MarketplaceList from '@/components/MarketplaceList';
import BuyInvestmentModal from '@/components/BuyInvestmentModal';

interface MarketplaceInvestment {
  id: string;
  name: string;
  type: string;
  symbol?: string;
  description?: string;
  currentPrice: number;
  minimumInvestment: number;
  maximumInvestment?: number;
  currency: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedReturn?: number;
  maturityDate?: string;
  isAvailable: boolean;
  category: string;
  issuer: string;
  createdAt: string;
}

export default function MarketplacePage() {
  const { isAuthenticated } = useAuth();
  const [investments, setInvestments] = useState<MarketplaceInvestment[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<MarketplaceInvestment | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    riskLevel: '',
    category: '',
    search: '',
    minPrice: '',
    maxPrice: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchMarketplaceInvestments();
      fetchPortfolios();
    }
  }, [isAuthenticated, filters]);

  const fetchMarketplaceInvestments = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      
      if (filters.type) params.type = filters.type;
      if (filters.riskLevel) params.riskLevel = filters.riskLevel;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;

      const response = await api.marketplace.getAvailable(params);
      setInvestments(response.data);
    } catch (err: any) {
      console.error('Marketplace fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load marketplace investments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolios = async () => {
    try {
      const response = await api.portfolios.getAll();
      setPortfolios(response.data);
    } catch (err: any) {
      console.error('Portfolios fetch error:', err);
    }
  };

  const handleBuyInvestment = (investment: MarketplaceInvestment) => {
    setSelectedInvestment(investment);
    setShowBuyModal(true);
  };

  const handleModalClose = () => {
    setShowBuyModal(false);
    setSelectedInvestment(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchMarketplaceInvestments();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      riskLevel: '',
      category: '',
      search: '',
      minPrice: '',
      maxPrice: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Investment Marketplace</h1>
        <p className="text-gray-600 mt-2">
          Discover and invest in a wide range of investment opportunities
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchMarketplaceInvestments}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filter Investments</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Clear Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Investment Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Types</option>
              <option value="STOCK">Stock</option>
              <option value="BOND">Bond</option>
              <option value="TERM_DEPOSIT">Term Deposit</option>
              <option value="PRIVATE_EQUITY">Private Equity</option>
              <option value="MUTUAL_FUND">Mutual Fund</option>
              <option value="ETF">ETF</option>
              <option value="CRYPTOCURRENCY">Cryptocurrency</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Level
            </label>
            <select
              value={filters.riskLevel}
              onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Categories</option>
              <option value="EQUITY">Equity</option>
              <option value="FIXED_INCOME">Fixed Income</option>
              <option value="COMMODITIES">Commodities</option>
              <option value="REAL_ESTATE">Real Estate</option>
              <option value="ALTERNATIVES">Alternatives</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by name or symbol..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              placeholder="Minimum price"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              placeholder="Maximum price"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      <MarketplaceList
        investments={investments}
        onBuy={handleBuyInvestment}
        onRefresh={fetchMarketplaceInvestments}
      />

      {/* Buy Investment Modal */}
      {showBuyModal && selectedInvestment && (
        <BuyInvestmentModal
          investment={selectedInvestment}
          portfolios={portfolios}
          isOpen={showBuyModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
