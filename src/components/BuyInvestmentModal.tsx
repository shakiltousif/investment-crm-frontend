'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Investment {
  id: string;
  name: string;
  symbol?: string;
  currentPrice: number;
  type: string;
}

interface Portfolio {
  id: string;
  name: string;
}

interface BuyInvestmentModalProps {
  investment: Investment;
  portfolios: Portfolio[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BuyInvestmentModal({
  investment,
  portfolios,
  isOpen,
  onClose,
  onSuccess,
}: BuyInvestmentModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>(portfolios[0]?.id || '');
  
  // Update selected portfolio when portfolios change
  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolio) {
      setSelectedPortfolio(portfolios[0].id);
    }
  }, [portfolios, selectedPortfolio]);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'preview' | 'confirm'>('input');

  useEffect(() => {
    if (selectedPortfolio && quantity > 0 && investment?.id) {
      fetchPreview();
    }
  }, [quantity, selectedPortfolio, investment?.id]);

  const fetchPreview = async () => {
    try {
      setError(null);
      console.log('Fetching preview for:', { investmentId: investment.id, quantity, portfolioId: selectedPortfolio });
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/buy/preview`,
        {
          investmentId: investment.id,
          quantity,
          portfolioId: selectedPortfolio,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        },
      );
      
      console.log('Preview response:', response.data);
      setPreview(response.data.data || response.data);
    } catch (err: any) {
      console.error('Preview fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch preview');
    }
  };

  const handleBuy = async () => {
    try {
      setLoading(true);
      setError(null);

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/buy`,
        {
          investmentId: investment.id,
          quantity,
          portfolioId: selectedPortfolio,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        },
      );

      setStep('confirm');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to buy investment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Buy Investment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {step === 'input' && (
            <>
              {/* Investment Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Investment</p>
                <p className="font-semibold text-lg">{investment.name}</p>
                {investment.symbol && <p className="text-sm text-gray-500">{investment.symbol}</p>}
                <p className="text-sm text-gray-600 mt-2">
                  Current Price: ${parseFloat(investment.currentPrice.toString()).toFixed(2)}
                </p>
              </div>

              {/* Portfolio Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Portfolio</label>
                {portfolios.length === 0 ? (
                  <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
                    No portfolios available. Please create a portfolio first.
                  </div>
                ) : (
                  <select
                    value={selectedPortfolio}
                    onChange={(e) => setSelectedPortfolio(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {portfolios.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Preview Summary */}
              {preview && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Cost:</span>
                    <span className="font-semibold">
                      ${parseFloat(preview.totalCost.toString()).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fee (1%):</span>
                    <span className="font-semibold">
                      ${parseFloat(preview.estimatedFee.toString()).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold text-lg">
                      ${parseFloat(preview.totalAmount.toString()).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Manual Calculation when preview fails */}
              {!preview && !error && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Cost:</span>
                    <span className="font-semibold">
                      ${(quantity * parseFloat(investment.currentPrice.toString())).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fee (1%):</span>
                    <span className="font-semibold">
                      ${(quantity * parseFloat(investment.currentPrice.toString()) * 0.01).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold text-lg">
                      ${(quantity * parseFloat(investment.currentPrice.toString()) * 1.01).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
                  <p className="font-semibold">Preview Error:</p>
                  <p>{error}</p>
                  <p className="mt-2 text-xs">Using manual calculation above.</p>
                </div>
              )}
            </>
          )}

          {step === 'preview' && (
            <>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Investment:</span>
                  <span className="font-semibold">{investment.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-semibold">{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span className="font-semibold">
                    ${parseFloat(investment.currentPrice.toString()).toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold text-lg">
                    ${(quantity * parseFloat(investment.currentPrice.toString()) * 1.01).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                <p className="font-semibold mb-1">Terms & Conditions</p>
                <p className="text-gray-700">
                  By clicking Confirm, you agree to purchase this investment at the current market
                  price. A 1% transaction fee will be applied.
                </p>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✓</div>
              <p className="text-lg font-semibold text-green-600">Purchase Successful!</p>
              <p className="text-gray-600 mt-2">Your investment has been added to your portfolio.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          {step === 'input' && (
            <button
              onClick={() => setStep('preview')}
              disabled={portfolios.length === 0 || !selectedPortfolio || quantity <= 0}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review
            </button>
          )}
          {step === 'preview' && (
            <button
              onClick={handleBuy}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Purchase'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

