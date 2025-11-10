'use client';

import React from 'react';

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

interface MarketplaceListProps {
  investments: MarketplaceInvestment[];
  onBuy?: (investment: MarketplaceInvestment) => void;
  onApply?: (investment: MarketplaceInvestment) => void;
  onEdit?: (investment: MarketplaceInvestment) => void;
  onDetails?: (investment: MarketplaceInvestment) => void;
  onRefresh?: () => void;
  liveQuotes?: Map<string, any>;
}

export default function MarketplaceList({
  investments,
  onBuy,
  onApply,
  onEdit,
  onDetails,
  onRefresh,
  liveQuotes = new Map(),
}: MarketplaceListProps) {
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'text-green-600 bg-green-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'HIGH':
        return 'text-secondary bg-secondary/10';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'STOCK':
        return 'text-primary bg-primary/10';
      case 'BOND':
      case 'CORPORATE_BOND':
        return 'text-purple-600 bg-purple-100';
      case 'TERM_DEPOSIT':
      case 'FIXED_RATE_DEPOSIT':
        return 'text-green-600 bg-green-100';
      case 'HIGH_INTEREST_SAVINGS':
        return 'text-emerald-600 bg-emerald-100';
      case 'IPO':
        return 'text-orange-600 bg-orange-100';
      case 'PRIVATE_EQUITY':
        return 'text-orange-600 bg-orange-100';
      case 'MUTUAL_FUND':
        return 'text-primary bg-primary/10';
      case 'ETF':
        return 'text-cyan-600 bg-cyan-100';
      case 'CRYPTOCURRENCY':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const isApplicationBased = (type: string) => {
    return type === 'IPO';
  };

  if (investments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No investments available</h3>
        <p className="text-gray-600 mb-4">Check back later for new investment opportunities.</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {investments.map((investment) => (
        <div
          key={investment.id}
          className={`bg-white rounded-lg shadow p-6 border-l-4 ${
            investment.isAvailable ? 'border-green-500' : 'border-gray-300'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{investment.name}</h3>
              {investment.symbol && (
                <p className="text-sm text-gray-600 mb-2">{investment.symbol}</p>
              )}
              <p className="text-sm text-gray-500">{investment.issuer}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(investment.type)}`}>
                {investment.type.replace('_', ' ')}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(investment.riskLevel)}`}>
                {investment.riskLevel} Risk
              </span>
            </div>
          </div>

          {investment.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{investment.description}</p>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Current Price:</span>
              <div className="text-right">
                <span className="font-medium">
                  £{Number(investment.currentPrice).toLocaleString()}
                </span>
                {investment.symbol && liveQuotes.has(investment.symbol) && (
                  <div className="text-xs">
                    <span className={`${liveQuotes.get(investment.symbol).change >= 0 ? 'text-green-600' : 'text-secondary'}`}>
                      {liveQuotes.get(investment.symbol).change >= 0 ? '+' : ''}
                      {liveQuotes.get(investment.symbol).change.toFixed(2)} 
                      ({liveQuotes.get(investment.symbol).changePercent.toFixed(2)}%)
                    </span>
                    <span className="text-gray-500 ml-1">Live</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Min Investment:</span>
              <span className="font-medium">
                £{Number(investment.minimumInvestment).toLocaleString()}
              </span>
            </div>
            
            {investment.maximumInvestment && (
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Max Investment:</span>
                <span className="font-medium">
                  £{Number(investment.maximumInvestment).toLocaleString()}
                </span>
              </div>
            )}
            
            {investment.expectedReturn && (
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Expected Return:</span>
                <span className="font-medium text-green-600">
                  {Number(investment.expectedReturn).toFixed(2)}%
                </span>
              </div>
            )}
            
            {investment.maturityDate && (
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Maturity Date:</span>
                <span className="font-medium">
                  {new Date(investment.maturityDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {investment.isAvailable ? (
              <>
                <button
                  onClick={() => onBuy?.(investment)}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  Invest Now
                </button>
                <button 
                  onClick={() => onEdit?.(investment)}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDetails?.(investment)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Details
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  disabled
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                >
                  Not Available
                </button>
                <button 
                  onClick={() => onEdit?.(investment)}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Category: {investment.category}</span>
              <span>Added: {new Date(investment.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}