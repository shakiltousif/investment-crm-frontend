'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvestmentApplicationModalProps {
  investment: {
    id: string;
    name: string;
    type: string;
    currentPrice: number;
    minimumInvestment: number;
    maximumInvestment?: number;
    currency: string;
    applicationDeadline?: string;
    ipoStatus?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InvestmentApplicationModal({
  investment,
  isOpen,
  onClose,
  onSuccess,
}: InvestmentApplicationModalProps) {
  const [requestedAmount, setRequestedAmount] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  useEffect(() => {
    if (isOpen) {
      setRequestedAmount('');
      setRequestedQuantity('');
      setNotes('');
      setError('');
      setStep('form');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const amount = parseFloat(requestedAmount);
      if (isNaN(amount) || amount < investment.minimumInvestment) {
        setError(`Minimum investment is £${investment.minimumInvestment.toLocaleString()}`);
        return;
      }

      if (investment.maximumInvestment && amount > investment.maximumInvestment) {
        setError(`Maximum investment is £${investment.maximumInvestment.toLocaleString()}`);
        return;
      }

      const data: any = {
        marketplaceItemId: investment.id,
        requestedAmount: amount,
        notes: notes || undefined,
      };

      if (requestedQuantity) {
        const qty = parseFloat(requestedQuantity);
        if (!isNaN(qty) && qty > 0) {
          data.requestedQuantity = qty;
        }
      }

      await api.investmentProducts.createApplication(data);
      setStep('confirm');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Application submission error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 'confirm' ? 'Application Submitted' : 'Apply for Investment'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {step === 'confirm' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Application Submitted Successfully!</h3>
              <p className="text-gray-600">
                Your application has been received and is under review. You will be notified once a decision is made.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{investment.name}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{investment.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price per unit:</span>
                    <span className="font-medium">
                      £{investment.currentPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minimum investment:</span>
                    <span className="font-medium">
                      £{investment.minimumInvestment.toLocaleString()}
                    </span>
                  </div>
                  {investment.maximumInvestment && (
                    <div className="flex justify-between">
                      <span>Maximum investment:</span>
                      <span className="font-medium">
                        £{investment.maximumInvestment.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {investment.applicationDeadline && (
                    <div className="flex justify-between">
                      <span>Application deadline:</span>
                      <span className="font-medium text-orange-600">
                        {new Date(investment.applicationDeadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {investment.ipoStatus && (
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-medium ${
                        investment.ipoStatus === 'OPEN' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {investment.ipoStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Amount ({investment.currency}) *
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min={investment.minimumInvestment}
                    max={investment.maximumInvestment}
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={`Min: £${investment.minimumInvestment.toLocaleString()}`}
                  />
                  {requestedAmount && (
                    <p className="mt-1 text-sm text-gray-500">
                      {investment.type === 'IPO' && investment.currentPrice > 0 && (
                        <>Approx. {Math.floor(parseFloat(requestedAmount) / investment.currentPrice)} units</>
                      )}
                    </p>
                  )}
                </div>

                {investment.type === 'IPO' && (
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Requested Quantity (optional)
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      step="0.0001"
                      min="0"
                      value={requestedQuantity}
                      onChange={(e) => setRequestedQuantity(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter quantity if known"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Any additional information or preferences..."
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !requestedAmount}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </Button>
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

