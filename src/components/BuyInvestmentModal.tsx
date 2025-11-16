'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Investment {
  id: string;
  name: string;
  symbol?: string;
  currentPrice: number;
  type: string;
  minimumInvestment?: number;
  maximumInvestment?: number;
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
  const router = useRouter();
  // Start with empty string so user can type immediately
  const [amount, setAmount] = useState<string>('');
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

  // Convert amount string to number for calculations
  const getAmountAsNumber = (): number => {
    if (amount === '' || amount === null || amount === undefined) return 0;
    const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return isNaN(num) ? 0 : num;
  };

  // For amount-based investments, quantity is simply 1 (the amount is the investment value)
  // The backend will handle the actual quantity calculation if needed
  const calculateQuantity = (investmentAmount: number): number => {
    // For fixed investments like bonds, use amount directly as quantity
    // This allows buying any amount without price-based calculation
    if (investment?.type === 'BOND' || investment?.type === 'CORPORATE_BOND' || investment?.type === 'TERM_DEPOSIT' || investment?.type === 'FIXED_RATE_DEPOSIT') {
      return 1; // Quantity is 1, amount is the investment value
    }
    // For stocks and other price-based investments, calculate quantity if price exists
    if (investment?.currentPrice && investment.currentPrice > 0) {
      return investmentAmount / investment.currentPrice;
    }
    return 1; // Default to 1 if no price
  };

  // Get calculated quantity
  const amountNumber = getAmountAsNumber();
  const quantity = calculateQuantity(amountNumber);

  useEffect(() => {
    if (selectedPortfolio && amountNumber > 0 && investment?.id) {
      fetchPreview();
    }
  }, [amountNumber, selectedPortfolio, investment?.id]);

  const fetchPreview = async () => {
    try {
      setError(null);
      const calculatedQuantity = calculateQuantity(amountNumber);
      console.log('Fetching preview for:', { investmentId: investment.id, quantity: calculatedQuantity, portfolioId: selectedPortfolio });
      
      const response = await api.marketplace.buyPreview({
        investmentId: investment.id,
        amount: amountNumber,
        portfolioId: selectedPortfolio,
      });
      
      console.log('Preview response:', response.data);
      // Backend returns the preview directly, not wrapped in data
      const previewData = response.data.data || response.data;
      // Convert Decimal values to numbers if needed
      setPreview({
        ...previewData,
        totalCost: typeof previewData.totalCost === 'object' ? Number(previewData.totalCost) : previewData.totalCost,
        estimatedFee: typeof previewData.estimatedFee === 'object' ? Number(previewData.estimatedFee) : previewData.estimatedFee,
        totalAmount: typeof previewData.totalAmount === 'object' ? Number(previewData.totalAmount) : previewData.totalAmount,
        unitPrice: typeof previewData.unitPrice === 'object' ? Number(previewData.unitPrice) : previewData.unitPrice,
      });
    } catch (err: any) {
      console.error('Preview fetch error:', err);
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Unable to connect to server. Please ensure the backend is running on http://localhost:3001');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to fetch preview');
      }
    }
  };

  const handleBuy = async () => {
    try {
      setLoading(true);
      setError(null);
      const calculatedQuantity = calculateQuantity(amountNumber);

      await api.marketplace.buy({
        investmentId: investment.id,
        amount: amountNumber,
        portfolioId: selectedPortfolio,
      });

      setStep('confirm');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        // Redirect to investments page after successful purchase
        router.push('/investments');
      }, 2000);
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Unable to connect to server. Please ensure the backend is running on http://localhost:3001');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to buy investment');
      }
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
                  Minimum Investment: £{investment.minimumInvestment ? parseFloat(investment.minimumInvestment.toString()).toFixed(2) : '0.00'}
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

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  min={investment.minimumInvestment || 0}
                  max={investment.maximumInvestment || undefined}
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                  }}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                {investment.minimumInvestment && (
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum: £{investment.minimumInvestment.toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {investment.maximumInvestment 
                    ? `Maximum: £${investment.maximumInvestment.toLocaleString()}`
                    : 'Maximum: Unlimited'}
                </p>
                {amountNumber > 0 && quantity > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    Quantity: {quantity.toFixed(4)} units
                  </p>
                )}
              </div>

              {/* Preview Summary */}
              {preview && amountNumber > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Investment Amount:</span>
                    <span className="font-semibold">
                      £{amountNumber.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fee (0.1%):</span>
                    <span className="font-semibold">
                      £{(amountNumber * 0.001).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold text-lg">
                      £{(amountNumber + (amountNumber * 0.001)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Manual Calculation when preview fails */}
              {!preview && !error && amountNumber > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Investment Amount:</span>
                    <span className="font-semibold">
                      £{amountNumber.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fee (0.1%):</span>
                    <span className="font-semibold">
                      £{(amountNumber * 0.001).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold text-lg">
                      £{(amountNumber + (amountNumber * 0.001)).toFixed(2)}
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
                  <span>Amount:</span>
                  <span className="font-semibold">£{amountNumber.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fee (0.1%):</span>
                  <span className="font-semibold">
                    £{(amountNumber * 0.001).toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold text-lg">
                    £{(amountNumber + (amountNumber * 0.001)).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                <p className="font-semibold mb-1">Terms & Conditions</p>
                <p className="text-gray-700">
                  By clicking Confirm, you agree to purchase this investment at the current market
                  price. A 0.1% transaction fee will be applied.
                </p>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✓</div>
              <p className="text-lg font-semibold text-yellow-600">Investment Request Submitted!</p>
              <p className="text-gray-600 mt-2">Your investment request has been submitted and is pending admin approval.</p>
              <p className="text-gray-500 text-sm mt-2">You will be notified once it has been reviewed.</p>
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
              disabled={Boolean(
                portfolios.length === 0 || 
                !selectedPortfolio || 
                amountNumber <= 0 ||
                (investment.minimumInvestment && amountNumber < investment.minimumInvestment) ||
                (investment.maximumInvestment && amountNumber > investment.maximumInvestment)
              )}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {loading ? 'Processing...' : 'Send for Review'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

