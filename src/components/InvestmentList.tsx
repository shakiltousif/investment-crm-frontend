'use client';

import React from 'react';
import { api } from '@/lib/api';
import { InvestmentTable } from '@/components/composite/DataTable';
import { NoInvestmentsEmptyState } from '@/components/composite/EmptyState';
import { CardSkeleton } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

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

interface InvestmentListProps {
  investments: Investment[];
  onBuy?: (investment: Investment) => void;
  onSell?: (investment: Investment) => void;
  onRefresh?: () => void;
  loading?: boolean;
  className?: string;
}

export default function InvestmentList({
  investments,
  onBuy,
  onSell,
  onRefresh,
  loading = false,
  className,
}: InvestmentListProps) {
  const handleEdit = async (investment: Investment) => {
    // Edit functionality would be implemented here
    console.log('Edit investment:', investment);
  };

  const handleDelete = async (investmentId: string) => {
    if (!confirm('Are you sure you want to delete this investment?')) {
      return;
    }

    try {
      await api.investments.delete(investmentId);
      onRefresh?.();
    } catch (err: any) {
      console.error('Investment delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete investment');
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Type', 'Symbol', 'Quantity', 'Purchase Price', 'Current Price', 'Total Value', 'Total Gain', 'Gain %', 'Purchase Date', 'Portfolio'],
      ...investments.map(inv => [
        inv.name,
        inv.type,
        inv.symbol || '',
        inv.quantity.toString(),
        inv.purchasePrice.toString(),
        inv.currentPrice.toString(),
        inv.totalValue.toString(),
        inv.totalGain.toString(),
        inv.gainPercentage.toString(),
        inv.purchaseDate,
        inv.portfolioName
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'investments.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <NoInvestmentsEmptyState 
          onBrowseMarketplace={onBuy ? () => onBuy({} as Investment) : undefined}
        />
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <InvestmentTable
        investments={investments}
        onBuy={onBuy}
        onSell={onSell}
        onEdit={handleEdit}
        onDelete={(investment) => handleDelete(investment.id)}
        loading={loading}
      />
    </div>
  );
}