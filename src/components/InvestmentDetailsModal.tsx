'use client';

import React from 'react';
import { X } from 'lucide-react';

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

interface InvestmentDetailsModalProps {
  investment: MarketplaceInvestment | null;
  isOpen: boolean;
  onClose: () => void;
  liveQuotes?: Map<string, any>;
}

export default function InvestmentDetailsModal({
  investment,
  isOpen,
  onClose,
  liveQuotes = new Map(),
}: InvestmentDetailsModalProps) {
  if (!isOpen || !investment) return null;

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'text-green-600 bg-green-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'HIGH':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'STOCK':
        return 'text-blue-600 bg-blue-100';
      case 'BOND':
        return 'text-purple-600 bg-purple-100';
      case 'TERM_DEPOSIT':
        return 'text-green-600 bg-green-100';
      case 'PRIVATE_EQUITY':
        return 'text-orange-600 bg-orange-100';
      case 'MUTUAL_FUND':
        return 'text-indigo-600 bg-indigo-100';
      case 'ETF':
        return 'text-cyan-600 bg-cyan-100';
      case 'CRYPTOCURRENCY':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Investment Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{investment.name}</h3>
                {investment.symbol && (
                  <p className="text-lg text-gray-600 mb-1">{investment.symbol}</p>
                )}
                <p className="text-gray-500">{investment.issuer}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(investment.type)}`}>
                  {investment.type.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(investment.riskLevel)}`}>
                  {investment.riskLevel} Risk
                </span>
              </div>
            </div>

            {investment.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700">{investment.description}</p>
              </div>
            )}
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Financial Information</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Price:</span>
                  <div className="text-right">
                    <span className="font-semibold text-lg">
                      {investment.currency} ${Number(investment.currentPrice).toLocaleString()}
                    </span>
                    {investment.symbol && liveQuotes.has(investment.symbol) && (
                      <div className="text-sm">
                        <span className={`${liveQuotes.get(investment.symbol).change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                  <span className="text-gray-600">Minimum Investment:</span>
                  <span className="font-medium">
                    {investment.currency} ${Number(investment.minimumInvestment).toLocaleString()}
                  </span>
                </div>
                
                {investment.maximumInvestment && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maximum Investment:</span>
                    <span className="font-medium">
                      {investment.currency} ${Number(investment.maximumInvestment).toLocaleString()}
                    </span>
                  </div>
                )}
                
                {investment.expectedReturn && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Return:</span>
                    <span className="font-medium text-green-600">
                      {Number(investment.expectedReturn).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Investment Details</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{investment.type.replace('_', ' ')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Risk Level:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(investment.riskLevel)}`}>
                    {investment.riskLevel} Risk
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{investment.category}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Currency:</span>
                  <span className="font-medium">{investment.currency}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    investment.isAvailable 
                      ? 'text-green-600 bg-green-100' 
                      : 'text-red-600 bg-red-100'
                  }`}>
                    {investment.isAvailable ? 'Available' : 'Not Available'}
                  </span>
                </div>
                
                {investment.maturityDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maturity Date:</span>
                    <span className="font-medium">
                      {new Date(investment.maturityDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Added:</span>
                  <span className="font-medium">
                    {new Date(investment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-yellow-800 mb-2">Risk Information</h4>
            <p className="text-yellow-700 text-sm">
              {investment.riskLevel === 'LOW' && 'Low risk investments typically offer stable returns with minimal volatility. Suitable for conservative investors.'}
              {investment.riskLevel === 'MEDIUM' && 'Medium risk investments offer moderate returns with some volatility. Suitable for balanced investors seeking growth with manageable risk.'}
              {investment.riskLevel === 'HIGH' && 'High risk investments offer potentially high returns but with significant volatility. Suitable for aggressive investors who can tolerate substantial risk.'}
            </p>
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Important Disclaimer</h4>
            <p className="text-gray-600 text-sm">
              This information is for educational purposes only and should not be considered as financial advice. 
              Past performance does not guarantee future results. Please consult with a qualified financial advisor 
              before making any investment decisions. All investments carry risk, and you may lose some or all of your invested capital.
            </p>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
