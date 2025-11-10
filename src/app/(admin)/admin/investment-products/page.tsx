'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

type ProductType = 'bond' | 'savings' | 'ipo' | 'fixed-deposit';

export default function InvestmentProductsPage() {
  const [activeTab, setActiveTab] = useState<ProductType>('bond');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bond form state
  const [bondForm, setBondForm] = useState({
    name: '',
    symbol: '',
    description: '',
    currentPrice: '',
    minimumInvestment: '',
    maximumInvestment: '',
    currency: 'GBP',
    riskLevel: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    expectedReturn: '',
    issuer: '',
    maturityDate: '',
    couponRate: '',
    payoutFrequency: 'QUARTERLY' as 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
    nextPayoutDate: '',
  });

  // Savings form state
  const [savingsForm, setSavingsForm] = useState({
    name: '',
    description: '',
    minimumInvestment: '',
    maximumInvestment: '',
    currency: 'GBP',
    riskLevel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH',
    interestRate: '',
    issuer: '',
  });

  // IPO form state
  const [ipoForm, setIpoForm] = useState({
    name: '',
    symbol: '',
    description: '',
    currentPrice: '',
    minimumInvestment: '',
    maximumInvestment: '',
    currency: 'GBP',
    riskLevel: 'HIGH' as 'LOW' | 'MEDIUM' | 'HIGH',
    issuer: '',
    applicationDeadline: '',
    allocationDate: '',
  });

  // Fixed Deposit form state
  const [fixedDepositForm, setFixedDepositForm] = useState({
    name: '',
    description: '',
    minimumInvestment: '',
    maximumInvestment: '',
    currency: 'GBP',
    riskLevel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH',
    interestRate: '',
    lockPeriodMonths: '',
    earlyWithdrawalPenalty: '',
    issuer: '',
  });

  const resetForm = (type: ProductType) => {
    setError('');
    setSuccess('');
    if (type === 'bond') {
      setBondForm({
        name: '',
        symbol: '',
        description: '',
        currentPrice: '',
        minimumInvestment: '',
        maximumInvestment: '',
        currency: 'GBP',
        riskLevel: 'MEDIUM',
        expectedReturn: '',
        issuer: '',
        maturityDate: '',
        couponRate: '',
        payoutFrequency: 'QUARTERLY',
        nextPayoutDate: '',
      });
    } else if (type === 'savings') {
      setSavingsForm({
        name: '',
        description: '',
        minimumInvestment: '',
        maximumInvestment: '',
        currency: 'GBP',
        riskLevel: 'LOW',
        interestRate: '',
        issuer: '',
      });
    } else if (type === 'ipo') {
      setIpoForm({
        name: '',
        symbol: '',
        description: '',
        currentPrice: '',
        minimumInvestment: '',
        maximumInvestment: '',
        currency: 'GBP',
        riskLevel: 'HIGH',
        issuer: '',
        applicationDeadline: '',
        allocationDate: '',
      });
    } else if (type === 'fixed-deposit') {
      setFixedDepositForm({
        name: '',
        description: '',
        minimumInvestment: '',
        maximumInvestment: '',
        currency: 'GBP',
        riskLevel: 'LOW',
        interestRate: '',
        lockPeriodMonths: '',
        earlyWithdrawalPenalty: '',
        issuer: '',
      });
    }
  };

  const handleBondSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = {
        name: bondForm.name,
        symbol: bondForm.symbol || undefined,
        description: bondForm.description || undefined,
        currentPrice: parseFloat(bondForm.currentPrice),
        minimumInvestment: parseFloat(bondForm.minimumInvestment),
        maximumInvestment: bondForm.maximumInvestment ? parseFloat(bondForm.maximumInvestment) : undefined,
        currency: bondForm.currency,
        riskLevel: bondForm.riskLevel,
        expectedReturn: bondForm.expectedReturn ? parseFloat(bondForm.expectedReturn) : undefined,
        issuer: bondForm.issuer,
        maturityDate: new Date(bondForm.maturityDate).toISOString(),
        couponRate: parseFloat(bondForm.couponRate),
        payoutFrequency: bondForm.payoutFrequency,
        nextPayoutDate: bondForm.nextPayoutDate ? new Date(bondForm.nextPayoutDate).toISOString() : undefined,
      };

      await api.investmentProducts.createBond(data);
      setSuccess('Corporate Bond created successfully!');
      setTimeout(() => {
        resetForm('bond');
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Failed to create bond:', err);
      setError(err.response?.data?.message || 'Failed to create corporate bond');
    } finally {
      setLoading(false);
    }
  };

  const handleSavingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = {
        name: savingsForm.name,
        description: savingsForm.description || undefined,
        minimumInvestment: parseFloat(savingsForm.minimumInvestment),
        maximumInvestment: savingsForm.maximumInvestment ? parseFloat(savingsForm.maximumInvestment) : undefined,
        currency: savingsForm.currency,
        riskLevel: savingsForm.riskLevel,
        interestRate: parseFloat(savingsForm.interestRate),
        issuer: savingsForm.issuer,
      };

      await api.investmentProducts.createSavings(data);
      setSuccess('High Interest Savings Account created successfully!');
      setTimeout(() => {
        resetForm('savings');
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Failed to create savings:', err);
      setError(err.response?.data?.message || 'Failed to create savings account');
    } finally {
      setLoading(false);
    }
  };

  const handleIPOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = {
        name: ipoForm.name,
        symbol: ipoForm.symbol,
        description: ipoForm.description || undefined,
        currentPrice: parseFloat(ipoForm.currentPrice),
        minimumInvestment: parseFloat(ipoForm.minimumInvestment),
        maximumInvestment: ipoForm.maximumInvestment ? parseFloat(ipoForm.maximumInvestment) : undefined,
        currency: ipoForm.currency,
        riskLevel: ipoForm.riskLevel,
        issuer: ipoForm.issuer,
        applicationDeadline: new Date(ipoForm.applicationDeadline).toISOString(),
        allocationDate: ipoForm.allocationDate ? new Date(ipoForm.allocationDate).toISOString() : undefined,
      };

      await api.investmentProducts.createIPO(data);
      setSuccess('IPO product created successfully!');
      setTimeout(() => {
        resetForm('ipo');
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Failed to create IPO:', err);
      setError(err.response?.data?.message || 'Failed to create IPO');
    } finally {
      setLoading(false);
    }
  };

  const handleFixedDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = {
        name: fixedDepositForm.name,
        description: fixedDepositForm.description || undefined,
        minimumInvestment: parseFloat(fixedDepositForm.minimumInvestment),
        maximumInvestment: fixedDepositForm.maximumInvestment ? parseFloat(fixedDepositForm.maximumInvestment) : undefined,
        currency: fixedDepositForm.currency,
        riskLevel: fixedDepositForm.riskLevel,
        interestRate: parseFloat(fixedDepositForm.interestRate),
        lockPeriodMonths: parseInt(fixedDepositForm.lockPeriodMonths),
        earlyWithdrawalPenalty: fixedDepositForm.earlyWithdrawalPenalty ? parseFloat(fixedDepositForm.earlyWithdrawalPenalty) : undefined,
        issuer: fixedDepositForm.issuer,
      };

      await api.investmentProducts.createFixedDeposit(data);
      setSuccess('Fixed Rate Deposit created successfully!');
      setTimeout(() => {
        resetForm('fixed-deposit');
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Failed to create fixed deposit:', err);
      setError(err.response?.data?.message || 'Failed to create fixed deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Investment Products</h1>
        <p className="text-gray-600 mt-2">Create and manage investment products for the marketplace</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <XCircle className="h-5 w-5 text-secondary" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-2 border-b">
          <button
            type="button"
            onClick={() => setActiveTab('bond')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'bond'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Corporate Bond
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('savings')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'savings'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Savings Account
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ipo')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'ipo'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            IPO
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fixed-deposit')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'fixed-deposit'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Fixed Deposit
          </button>
        </div>

        {/* Corporate Bond Form */}
        {activeTab === 'bond' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Corporate Bond</CardTitle>
              <CardDescription>Add a new corporate bond product to the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBondSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={bondForm.name}
                      onChange={(e) => setBondForm({ ...bondForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Corporate Bond Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                    <input
                      type="text"
                      value={bondForm.symbol}
                      onChange={(e) => setBondForm({ ...bondForm, symbol: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="BOND001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={bondForm.description}
                    onChange={(e) => setBondForm({ ...bondForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Product description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={bondForm.currentPrice}
                      onChange={(e) => setBondForm({ ...bondForm, currentPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="100.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Investment *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={bondForm.minimumInvestment}
                      onChange={(e) => setBondForm({ ...bondForm, minimumInvestment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="1000.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Investment</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bondForm.maximumInvestment}
                      onChange={(e) => setBondForm({ ...bondForm, maximumInvestment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="100000.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                    <select
                      value={bondForm.currency}
                      onChange={(e) => setBondForm({ ...bondForm, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level *</label>
                    <select
                      value={bondForm.riskLevel}
                      onChange={(e) => setBondForm({ ...bondForm, riskLevel: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bondForm.expectedReturn}
                      onChange={(e) => setBondForm({ ...bondForm, expectedReturn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="5.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issuer *</label>
                    <input
                      type="text"
                      required
                      value={bondForm.issuer}
                      onChange={(e) => setBondForm({ ...bondForm, issuer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maturity Date *</label>
                    <input
                      type="date"
                      required
                      value={bondForm.maturityDate}
                      onChange={(e) => setBondForm({ ...bondForm, maturityDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Rate (%) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={bondForm.couponRate}
                      onChange={(e) => setBondForm({ ...bondForm, couponRate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="4.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payout Frequency *</label>
                    <select
                      value={bondForm.payoutFrequency}
                      onChange={(e) => setBondForm({ ...bondForm, payoutFrequency: e.target.value as 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="ANNUAL">Annual</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Payout Date</label>
                  <input
                    type="datetime-local"
                    value={bondForm.nextPayoutDate}
                    onChange={(e) => setBondForm({ ...bondForm, nextPayoutDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
                    {loading ? 'Creating...' : 'Create Bond'}
                  </Button>
                  <Button type="button" onClick={() => resetForm('bond')} variant="outline" className="flex-1">
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Savings Account Form */}
        {activeTab === 'savings' && (
          <Card>
            <CardHeader>
              <CardTitle>Create High Interest Savings Account</CardTitle>
              <CardDescription>Add a new savings account product to the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavingsSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={savingsForm.name}
                    onChange={(e) => setSavingsForm({ ...savingsForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Savings Account Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={savingsForm.description}
                    onChange={(e) => setSavingsForm({ ...savingsForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Product description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Investment *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={savingsForm.minimumInvestment}
                      onChange={(e) => setSavingsForm({ ...savingsForm, minimumInvestment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="100.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Investment</label>
                    <input
                      type="number"
                      step="0.01"
                      value={savingsForm.maximumInvestment}
                      onChange={(e) => setSavingsForm({ ...savingsForm, maximumInvestment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="1000000.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={savingsForm.interestRate}
                      onChange={(e) => setSavingsForm({ ...savingsForm, interestRate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="3.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                    <select
                      value={savingsForm.currency}
                      onChange={(e) => setSavingsForm({ ...savingsForm, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level *</label>
                    <select
                      value={savingsForm.riskLevel}
                      onChange={(e) => setSavingsForm({ ...savingsForm, riskLevel: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issuer *</label>
                    <input
                      type="text"
                      required
                      value={savingsForm.issuer}
                      onChange={(e) => setSavingsForm({ ...savingsForm, issuer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Bank Name"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
                    {loading ? 'Creating...' : 'Create Savings Account'}
                  </Button>
                  <Button type="button" onClick={() => resetForm('savings')} variant="outline" className="flex-1">
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* IPO Form */}
        {activeTab === 'ipo' && (
          <Card>
            <CardHeader>
              <CardTitle>Create IPO Product</CardTitle>
              <CardDescription>Add a new IPO product to the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIPOSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={ipoForm.name}
                      onChange={(e) => setIpoForm({ ...ipoForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Company Name IPO"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Symbol *</label>
                    <input
                      type="text"
                      required
                      value={ipoForm.symbol}
                      onChange={(e) => setIpoForm({ ...ipoForm, symbol: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="COMP"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={ipoForm.description}
                    onChange={(e) => setIpoForm({ ...ipoForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Product description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={ipoForm.currentPrice}
                      onChange={(e) => setIpoForm({ ...ipoForm, currentPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="10.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Investment *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={ipoForm.minimumInvestment}
                      onChange={(e) => setIpoForm({ ...ipoForm, minimumInvestment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="1000.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Investment</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ipoForm.maximumInvestment}
                      onChange={(e) => setIpoForm({ ...ipoForm, maximumInvestment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="100000.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                    <select
                      value={ipoForm.currency}
                      onChange={(e) => setIpoForm({ ...ipoForm, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level *</label>
                    <select
                      value={ipoForm.riskLevel}
                      onChange={(e) => setIpoForm({ ...ipoForm, riskLevel: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issuer *</label>
                    <input
                      type="text"
                      required
                      value={ipoForm.issuer}
                      onChange={(e) => setIpoForm({ ...ipoForm, issuer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Company Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline *</label>
                    <input
                      type="datetime-local"
                      required
                      value={ipoForm.applicationDeadline}
                      onChange={(e) => setIpoForm({ ...ipoForm, applicationDeadline: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allocation Date</label>
                    <input
                      type="datetime-local"
                      value={ipoForm.allocationDate}
                      onChange={(e) => setIpoForm({ ...ipoForm, allocationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
                    {loading ? 'Creating...' : 'Create IPO'}
                  </Button>
                  <Button type="button" onClick={() => resetForm('ipo')} variant="outline" className="flex-1">
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Fixed Deposit Form */}
        {activeTab === 'fixed-deposit' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Fixed Rate Deposit</CardTitle>
              <CardDescription>Add a new fixed rate deposit product to the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFixedDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={fixedDepositForm.name}
                    onChange={(e) => setFixedDepositForm({ ...fixedDepositForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Fixed Deposit Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={fixedDepositForm.description}
                    onChange={(e) => setFixedDepositForm({ ...fixedDepositForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Product description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Investment *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={fixedDepositForm.minimumInvestment}
                      onChange={(e) => setFixedDepositForm({ ...fixedDepositForm, minimumInvestment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="1000.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Investment</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fixedDepositForm.maximumInvestment}
                      onChange={(e) => setFixedDepositForm({ ...fixedDepositForm, maximumInvestment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="1000000.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={fixedDepositForm.interestRate}
                      onChange={(e) => setFixedDepositForm({ ...fixedDepositForm, interestRate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="4.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lock Period (Months) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={fixedDepositForm.lockPeriodMonths}
                      onChange={(e) => setFixedDepositForm({ ...fixedDepositForm, lockPeriodMonths: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Early Withdrawal Penalty (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={fixedDepositForm.earlyWithdrawalPenalty}
                      onChange={(e) => setFixedDepositForm({ ...fixedDepositForm, earlyWithdrawalPenalty: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="2.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                    <select
                      value={fixedDepositForm.currency}
                      onChange={(e) => setFixedDepositForm({ ...fixedDepositForm, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level *</label>
                    <select
                      value={fixedDepositForm.riskLevel}
                      onChange={(e) => setFixedDepositForm({ ...fixedDepositForm, riskLevel: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issuer *</label>
                    <input
                      type="text"
                      required
                      value={fixedDepositForm.issuer}
                      onChange={(e) => setFixedDepositForm({ ...fixedDepositForm, issuer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Bank Name"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
                    {loading ? 'Creating...' : 'Create Fixed Deposit'}
                  </Button>
                  <Button type="button" onClick={() => resetForm('fixed-deposit')} variant="outline" className="flex-1">
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

