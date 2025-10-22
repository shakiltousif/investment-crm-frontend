'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Investment {
  id: string;
  name: string;
  symbol?: string;
  currentPrice: number;
  quantity: number;
  purchasePrice: number;
  type: string;
}

interface SellInvestmentModalProps {
  investment: Investment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SellInvestmentModal({
  investment,
  isOpen,
  onClose,
  onSuccess,
}: SellInvestmentModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'preview' | 'confirm'>('input');

  useEffect(() => {
    if (quantity > 0 && quantity <= investment.quantity) {
      fetchPreview();
    }
  }, [quantity]);

  const fetchPreview = async () => {
    try {
      setError(null);
      console.log('Fetching sell preview for:', { investmentId: investment.id, quantity });
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/sell/preview`,
        {
          investmentId: investment.id,
          quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        },
      );
      
      console.log('Sell preview response:', response.data);
      setPreview(response.data.data || response.data);
    } catch (err: any) {
      console.error('Sell preview fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch preview');
      
      // Create a mock preview for demo purposes when API fails
      const mockPreview = {
        unitPrice: investment.currentPrice,
        totalProceeds: investment.currentPrice * quantity,
        estimatedFee: investment.currentPrice * quantity * 0.01,
        netProceeds: investment.currentPrice * quantity * 0.99,
        gainLoss: (investment.currentPrice - investment.purchasePrice) * quantity,
        gainLossPercentage: ((investment.currentPrice - investment.purchasePrice) / investment.purchasePrice) * 100,
      };
      setPreview(mockPreview);
    }
  };

  const handleSell = async () => {
    try {
      setLoading(true);
      setError(null);

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/sell`,
        {
          investmentId: investment.id,
          quantity,
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
      setError(err.response?.data?.message || 'Failed to sell investment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const maxQuantity = investment?.quantity || 0;
  const isValidQuantity = quantity > 0 && quantity <= maxQuantity;
  
  // Show error if investment data is missing
  if (!investment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Sell Investment</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
          <div className="px-6 py-4">
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              Investment data not available. Please try again.
            </div>
          </div>
          <div className="border-t px-6 py-4 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Sell Investment</h2>
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
                <p className="text-sm text-gray-600">
                  Available: {parseFloat(investment.quantity.toString()).toFixed(4)} units
                </p>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quantity to Sell (Max: {parseFloat(maxQuantity.toString()).toFixed(4)})
                </label>
                <input
                  type="number"
                  min="0"
                  max={maxQuantity}
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                {!isValidQuantity && quantity > 0 && (
                  <p className="text-red-600 text-sm mt-1">Quantity exceeds available amount</p>
                )}
              </div>

              {/* Preview Summary */}
              {preview && isValidQuantity && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Proceeds:</span>
                    <span className="font-semibold">
                      ${parseFloat(preview.totalProceeds.toString()).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fee (1%):</span>
                    <span className="font-semibold">
                      -${parseFloat(preview.estimatedFee.toString()).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-medium">Net Proceeds:</span>
                    <span className="font-bold text-lg">
                      ${parseFloat(preview.netProceeds.toString()).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Gain/Loss:</span>
                      <span
                        className={`font-semibold ${
                          preview.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {preview.gainLoss >= 0 ? '+' : ''}${parseFloat(preview.gainLoss.toString()).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Return %:</span>
                      <span
                        className={`font-semibold ${
                          preview.gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {preview.gainLossPercentage >= 0 ? '+' : ''}
                        {parseFloat(preview.gainLossPercentage.toString()).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
            </>
          )}

          {step === 'preview' && preview && (
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
                    ${parseFloat(preview.unitPrice.toString()).toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-medium">Net Proceeds:</span>
                  <span className="font-bold text-lg">
                    ${parseFloat(preview.netProceeds.toString()).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Gain/Loss:</span>
                  <span
                    className={`font-bold ${
                      preview.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {preview.gainLoss >= 0 ? '+' : ''}${parseFloat(preview.gainLoss.toString()).toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✓</div>
              <p className="text-lg font-semibold text-green-600">Sale Successful!</p>
              <p className="text-gray-600 mt-2">Your investment has been sold successfully.</p>
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
              disabled={!isValidQuantity}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Review
            </button>
          )}
          {step === 'preview' && (
            <button
              onClick={handleSell}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Sale'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

