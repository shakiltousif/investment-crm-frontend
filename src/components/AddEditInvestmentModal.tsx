'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface MarketplaceItem {
  id?: string;
  name: string;
  type: string;
  symbol?: string;
  description?: string;
  currentPrice: number;
  minimumInvestment: number;
  maximumInvestment?: number;
  currency: string;
  riskLevel: string;
  expectedReturn?: number;
  category?: string;
  issuer?: string;
  maturityDate?: string;
  isAvailable: boolean;
}

interface AddEditInvestmentModalProps {
  item?: MarketplaceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddEditInvestmentModal({
  item,
  isOpen,
  onClose,
  onSuccess,
}: AddEditInvestmentModalProps) {
  const [formData, setFormData] = useState<MarketplaceItem>({
    name: '',
    type: 'STOCK',
    symbol: '',
    description: '',
    currentPrice: 0,
    minimumInvestment: 0,
    maximumInvestment: 0,
    currency: 'GBP',
    riskLevel: 'MEDIUM',
    expectedReturn: 0,
    category: '',
    issuer: '',
    maturityDate: '',
    isAvailable: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);

  const isEdit = !!item?.id;

  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id,
        name: item.name,
        type: item.type,
        symbol: item.symbol || '',
        description: item.description || '',
        currentPrice: item.currentPrice,
        minimumInvestment: item.minimumInvestment,
        maximumInvestment: item.maximumInvestment || 0,
        currency: item.currency,
        riskLevel: item.riskLevel,
        expectedReturn: item.expectedReturn || 0,
        category: item.category || '',
        issuer: item.issuer || '',
        maturityDate: item.maturityDate || '',
        isAvailable: item.isAvailable,
      });
    } else {
      // Reset form for new item
      setFormData({
        name: '',
        type: 'STOCK',
        symbol: '',
        description: '',
        currentPrice: 0,
        minimumInvestment: 0,
        maximumInvestment: 0,
        currency: 'GBP',
        riskLevel: 'MEDIUM',
        expectedReturn: 0,
        category: '',
        issuer: '',
        maturityDate: '',
        isAvailable: true,
      });
    }
  }, [item, isOpen]);

  const handleInputChange = (field: keyof MarketplaceItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSymbolSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.quotes.searchSymbols(query);
      setSearchResults(response.data.data || []);
    } catch (err) {
      console.error('Symbol search error:', err);
      setSearchResults([]);
    }
  };

  const handleSymbolSelect = (symbol: string, name: string) => {
    setFormData(prev => ({ 
      ...prev, 
      symbol, 
      name: name || prev.name,
      issuer: name || prev.issuer 
    }));
    setShowSymbolSearch(false);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        maximumInvestment: formData.maximumInvestment || undefined,
        expectedReturn: formData.expectedReturn || undefined,
        maturityDate: formData.maturityDate || undefined,
      };

      if (isEdit) {
        await api.marketplace.updateItem(item!.id!, submitData);
      } else {
        await api.marketplace.createItem(submitData);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save investment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isEdit ? 'Edit Investment' : 'Add New Investment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Investment Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Symbol</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => {
                    handleInputChange('symbol', e.target.value);
                    handleSymbolSearch(e.target.value);
                    setShowSymbolSearch(e.target.value.length > 1);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., AAPL"
                />
                {showSymbolSearch && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleSymbolSelect(result.symbol, result.name)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="font-medium">{result.symbol}</div>
                        <div className="text-sm text-gray-600">{result.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="STOCK">Stock</option>
                <option value="BOND">Bond</option>
                <option value="TERM_DEPOSIT">Term Deposit</option>
                <option value="MUTUAL_FUND">Mutual Fund</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Risk Level *</label>
              <select
                value={formData.riskLevel}
                onChange={(e) => handleInputChange('riskLevel', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Currency *</label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
                <option value="JPY">JPY</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Technology, Healthcare"
              />
            </div>
          </div>

          {/* Pricing Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Price *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.currentPrice}
                onChange={(e) => handleInputChange('currentPrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Minimum Investment *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.minimumInvestment}
                onChange={(e) => handleInputChange('minimumInvestment', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Maximum Investment</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.maximumInvestment}
                onChange={(e) => handleInputChange('maximumInvestment', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Expected Return (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.expectedReturn}
                onChange={(e) => handleInputChange('expectedReturn', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Maturity Date</label>
              <input
                type="date"
                value={formData.maturityDate}
                onChange={(e) => handleInputChange('maturityDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Issuer</label>
            <input
              type="text"
              value={formData.issuer}
              onChange={(e) => handleInputChange('issuer', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Apple Inc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Describe the investment..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isAvailable" className="text-sm font-medium">
              Available for investment
            </label>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Investment' : 'Add Investment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
