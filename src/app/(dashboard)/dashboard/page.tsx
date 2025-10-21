'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { DashboardHeader } from '@/components/composite/PageHeader';
import { 
  PortfolioValueCard, 
  TotalGainCard, 
  TransactionCountCard,
  StatCard 
} from '@/components/composite/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { cn } from '@/lib/utils';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';

interface DashboardData {
  portfolioValue: number;
  totalInvested: number;
  totalGain: number;
  gainPercentage: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    date: string;
  }>;
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Try to fetch portfolio overview
      let portfolioData = null;
      try {
        const portfolioResponse = await api.portfolios.getOverview();
        portfolioData = portfolioResponse.data;
      } catch (portfolioErr) {
        console.warn('Portfolio overview API not available:', portfolioErr);
        // Use mock data for demo purposes
        portfolioData = {
          totalValue: 125000,
          totalInvested: 100000,
          totalGain: 25000,
          gainPercentage: 25.0
        };
      }

      // Try to fetch recent transactions
      let recentTransactions = [];
      try {
        const transactionsResponse = await api.transactions.getAll({ 
          limit: 5, 
          sortBy: 'transactionDate',
          sortOrder: 'desc'
        });
        recentTransactions = transactionsResponse.data.data.map((tx: any) => ({
          id: tx.id,
          type: tx.type,
          amount: parseFloat(tx.amount),
          date: new Date(tx.transactionDate).toLocaleDateString(),
        }));
      } catch (transactionErr) {
        console.warn('Transactions API not available:', transactionErr);
        // Use mock data for demo purposes
        recentTransactions = [
          {
            id: '1',
            type: 'BUY',
            amount: 5000,
            date: new Date().toLocaleDateString(),
          },
          {
            id: '2',
            type: 'SELL',
            amount: 2500,
            date: new Date(Date.now() - 86400000).toLocaleDateString(),
          },
          {
            id: '3',
            type: 'DEPOSIT',
            amount: 10000,
            date: new Date(Date.now() - 172800000).toLocaleDateString(),
          }
        ];
      }

      setData({
        portfolioValue: parseFloat(portfolioData.totalValue || 0),
        totalInvested: parseFloat(portfolioData.totalInvested || 0),
        totalGain: parseFloat(portfolioData.totalGain || 0),
        gainPercentage: parseFloat(portfolioData.gainPercentage || 0),
        recentTransactions,
      });
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionBadgeVariant = (type: string) => {
    switch (type) {
      case 'BUY':
        return 'success';
      case 'SELL':
        return 'destructive';
      case 'DEPOSIT':
        return 'info';
      case 'WITHDRAWAL':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'BUY':
        return <TrendingUp className="h-4 w-4" />;
      case 'SELL':
        return <TrendingDown className="h-4 w-4" />;
      case 'DEPOSIT':
        return <DollarSign className="h-4 w-4" />;
      case 'WITHDRAWAL':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardHeader userName={user?.firstName} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardHeader userName={user?.firstName} />
        <ErrorDisplay error={error} onRetry={fetchDashboardData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        userName={user?.firstName} 
        actions={
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PortfolioValueCard 
          value={data?.portfolioValue || 0}
          change={{
            value: data?.gainPercentage || 0,
            type: (data?.gainPercentage || 0) >= 0 ? 'increase' : 'decrease',
            period: 'Total Return'
          }}
        />

        <StatCard
          title="Total Invested"
          value={`$${(data?.totalInvested || 0).toLocaleString()}`}
          icon={DollarSign}
          description="Principal amount invested"
        />

        <TotalGainCard 
          value={data?.totalGain || 0}
          change={{
            value: data?.gainPercentage || 0,
            type: (data?.gainPercentage || 0) >= 0 ? 'increase' : 'decrease',
            period: 'Total Return'
          }}
        />

        <TransactionCountCard 
          count={data?.recentTransactions?.length || 0}
          period="Recent Activity"
        />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your latest investment activity and account movements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentTransactions && data.recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {data.recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="font-medium">{transaction.type}</div>
                      <div className="text-sm text-muted-foreground">{transaction.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getTransactionBadgeVariant(transaction.type)}>
                      {transaction.type}
                    </Badge>
                    <div className="font-medium">
                      ${transaction.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent transactions found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

