'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface ProductCalculatorProps {
  product: {
    id: string;
    type: string;
    name: string;
    interestRate?: number;
    couponRate?: number;
    lockPeriodMonths?: number;
    payoutFrequency?: string;
  };
  onClose?: () => void;
}

export default function ProductCalculator({ product, onClose }: ProductCalculatorProps) {
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [balance, setBalance] = useState('');
  const [days, setDays] = useState('30');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculate = async () => {
    try {
      setLoading(true);
      setError('');
      setResult(null);

      if (product.type === 'CORPORATE_BOND') {
        const amount = parseFloat(investmentAmount);
        if (isNaN(amount) || amount <= 0) {
          setError('Please enter a valid investment amount');
          return;
        }
        const response = await api.investmentProducts.getBondPayoutSchedule(product.id, amount);
        setResult(response.data.data);
      } else if (product.type === 'HIGH_INTEREST_SAVINGS') {
        const bal = parseFloat(balance);
        const daysNum = parseInt(days);
        if (isNaN(bal) || bal <= 0) {
          setError('Please enter a valid balance');
          return;
        }
        if (isNaN(daysNum) || daysNum <= 0) {
          setError('Please enter valid number of days');
          return;
        }
        const response = await api.investmentProducts.getSavingsInterest(product.id, bal, daysNum);
        setResult(response.data.data);
      } else if (product.type === 'FIXED_RATE_DEPOSIT') {
        const amount = parseFloat(investmentAmount);
        if (isNaN(amount) || amount <= 0) {
          setError('Please enter a valid investment amount');
          return;
        }
        const response = await api.investmentProducts.getFixedDepositMaturity(product.id, amount);
        setResult(response.data.data);
      }
    } catch (err: any) {
      console.error('Calculation error:', err);
      setError(err.response?.data?.message || 'Failed to calculate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Calculator</CardTitle>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {product.type === 'CORPORATE_BOND' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Enter amount"
              />
            </div>
            {product.couponRate && (
              <div className="text-sm text-gray-600">
                <p>Coupon Rate: <span className="font-semibold">{product.couponRate}%</span></p>
                <p>Payout Frequency: <span className="font-semibold">{product.payoutFrequency || 'ANNUAL'}</span></p>
              </div>
            )}
          </>
        )}

        {product.type === 'HIGH_INTEREST_SAVINGS' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Balance
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Enter balance"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Days
              </label>
              <input
                type="number"
                min="1"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="30"
              />
            </div>
            {product.interestRate && (
              <div className="text-sm text-gray-600">
                <p>Interest Rate: <span className="font-semibold">{product.interestRate}%</span></p>
              </div>
            )}
          </>
        )}

        {product.type === 'FIXED_RATE_DEPOSIT' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Enter amount"
              />
            </div>
            {product.interestRate && product.lockPeriodMonths && (
              <div className="text-sm text-gray-600 space-y-1">
                <p>Interest Rate: <span className="font-semibold">{product.interestRate}%</span></p>
                <p>Lock Period: <span className="font-semibold">{product.lockPeriodMonths} months</span></p>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={calculate}
          disabled={loading || (!investmentAmount && !balance)}
          className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-3">
            {product.type === 'CORPORATE_BOND' && result.schedule && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Payout Schedule</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Frequency:</span>
                    <span className="font-semibold ml-2">{result.frequency}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Payout Amount:</span>
                    <span className="font-semibold ml-2">£{result.payoutAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Payouts:</span>
                    <span className="font-semibold ml-2">{result.totalPayouts}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Interest:</span>
                    <span className="font-semibold ml-2">£{result.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Maturity Date:</span>
                    <span className="font-semibold">{new Date(result.maturityDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </>
            )}

            {product.type === 'HIGH_INTEREST_SAVINGS' && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Interest Calculation</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Balance:</span>
                    <span className="font-semibold ml-2">£{result.balance.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Interest Rate:</span>
                    <span className="font-semibold ml-2">{result.interestRate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Days:</span>
                    <span className="font-semibold ml-2">{result.days}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Interest Earned:</span>
                    <span className="font-semibold ml-2 text-green-600">£{result.interest.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">New Balance:</span>
                    <span className="font-bold text-lg text-green-600">£{result.newBalance.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            {product.type === 'FIXED_RATE_DEPOSIT' && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Maturity Calculation</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Investment:</span>
                    <span className="font-semibold ml-2">£{result.investmentAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Interest Rate:</span>
                    <span className="font-semibold ml-2">{result.interestRate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Lock Period:</span>
                    <span className="font-semibold ml-2">{result.lockPeriodMonths} months</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Interest:</span>
                    <span className="font-semibold ml-2 text-green-600">£{result.totalInterest.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Maturity Amount:</span>
                    <span className="font-bold text-lg text-green-600">£{result.maturityAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Maturity Date:</span>
                    <span className="font-semibold">{new Date(result.maturityDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

