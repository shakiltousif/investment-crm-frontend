'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import InvestmentList from '@/components/InvestmentList';
import MarketplaceList from '@/components/MarketplaceList';
import BuyInvestmentModal from '@/components/BuyInvestmentModal';
import SellInvestmentModal from '@/components/SellInvestmentModal';

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
  portfolioId: string;
  portfolioName: string;
}

export default function InvestmentsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [marketplaceInvestments, setMarketplaceInvestments] = useState<any[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [filters, setFilters] = useState({
    portfolioId: '',
    type: '',
    search: '',
  });
  const [showingMarketplace, setShowingMarketplace] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvestments();
      fetchPortfolios();
      fetchMarketplaceInvestments();
    }
  }, [isAuthenticated, filters]);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      
      if (filters.portfolioId) params.portfolioId = filters.portfolioId;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;

      try {
        const response = await api.investments.getAll(params);
        const userInvestments = response.data || [];
        setInvestments(userInvestments);
        
        // If user has no investments, automatically show marketplace
        if (userInvestments.length === 0) {
          setShowingMarketplace(true);
        } else {
          setShowingMarketplace(false);
        }
      } catch (apiErr) {
        console.warn('Investments API not available:', apiErr);
        setInvestments([]);
        // If no investments, show marketplace
        setShowingMarketplace(true);
      }
    } catch (err: any) {
      console.error('Investments fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load investments');
      setInvestments([]);
      setShowingMarketplace(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketplaceInvestments = async () => {
    try {
      const response = await api.marketplace.getAvailable({});
      const marketplaceData = response.data?.data || response.data || [];
      setMarketplaceInvestments(Array.isArray(marketplaceData) ? marketplaceData : []);
    } catch (err: any) {
      console.warn('Marketplace API not available:', err);
      setMarketplaceInvestments([]);
    }
  };

  const fetchPortfolios = async () => {
    try {
      const response = await api.portfolios.getAll();
      setPortfolios(response.data);
    } catch (err: any) {
      console.warn('Portfolios API not available:', err);
      // Use mock data for demo purposes
      const mockPortfolios = [
        { id: '1', name: 'Growth Portfolio' },
        { id: '2', name: 'Tech Portfolio' },
        { id: '3', name: 'Conservative Portfolio' }
      ];
      setPortfolios(mockPortfolios);
    }
  };

  const handleBuyInvestment = (investment: Investment) => {
    if (investment.id) {
      // If it's a real investment, open the buy modal
      setSelectedInvestment(investment);
      setShowBuyModal(true);
    } else {
      // If it's the empty object from "Browse Marketplace", navigate to marketplace
      router.push('/marketplace');
    }
  };

  const handleSellInvestment = (investment: Investment) => {
    setSelectedInvestment(investment);
    setShowSellModal(true);
  };

  const handleBrowseMarketplace = () => {
    router.push('/marketplace');
  };

  const handleModalClose = () => {
    setShowBuyModal(false);
    setShowSellModal(false);
    setSelectedInvestment(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchInvestments();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading investments...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Investments</h1>
        <button
          onClick={handleBrowseMarketplace}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          Browse Marketplace
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchInvestments}
            className="mt-2 px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portfolio
            </label>
            <select
              value={filters.portfolioId}
              onChange={(e) => handleFilterChange('portfolioId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Portfolios</option>
              {portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
          </div>
          
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
              <option value="MUTUAL_FUND">Mutual Fund</option>
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
        </div>
      </div>

      {showingMarketplace && investments.length === 0 ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Available Investments</h2>
            <button
              onClick={() => {
                setShowingMarketplace(false);
                fetchInvestments();
              }}
              className="text-sm text-primary hover:text-primary/80"
            >
              View My Investments
            </button>
          </div>
          <MarketplaceList
            investments={marketplaceInvestments}
            onBuy={(investment) => {
              router.push('/marketplace');
            }}
            onDetails={(investment) => {
              router.push('/marketplace');
            }}
            onRefresh={fetchMarketplaceInvestments}
            userInvestments={investments}
          />
        </div>
      ) : (
        <InvestmentList
          investments={investments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
          onBuy={handleBuyInvestment}
          onSell={handleSellInvestment}
          onRefresh={fetchInvestments}
          pagination={{
            page: currentPage,
            pageSize: itemsPerPage,
            total: investments.length,
            onPageChange: setCurrentPage,
            onPageSizeChange: (size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            },
          }}
        />
      )}

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

      {/* Sell Investment Modal */}
      {showSellModal && selectedInvestment && (
        <SellInvestmentModal
          investment={selectedInvestment}
          isOpen={showSellModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

