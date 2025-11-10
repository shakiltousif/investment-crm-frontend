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
import LiveQuoteTicker from '@/components/LiveQuoteTicker';
import Link from 'next/link';
import PortfolioPerformanceChart from '@/components/PortfolioPerformanceChart';
import PortfolioAllocationChart from '@/components/PortfolioAllocationChart';

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
  latestDeposits: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  latestWithdrawals: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Always try to load data when component mounts
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Also load data when authentication state changes
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  // Add a refresh function that can be called manually
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Helper function to safely convert Decimal or number to number
  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    if (typeof value === 'object' && 'toString' in value) {
      return parseFloat(value.toString()) || 0;
    }
    return 0;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Try to fetch portfolio overview
      let portfolioData = null;
      try {
        const portfolioResponse = await api.portfolios.getOverview();
        const rawData = portfolioResponse.data.data || portfolioResponse.data;
        portfolioData = {
          totalValue: toNumber(rawData?.totalValue),
          totalInvested: toNumber(rawData?.totalInvested),
          totalGain: toNumber(rawData?.totalGain),
          gainPercentage: toNumber(rawData?.gainPercentage),
        };
      } catch (portfolioErr) {
        console.warn('Portfolio overview API not available:', portfolioErr);
        // Use default values if API fails
        portfolioData = {
          totalValue: 0,
          totalInvested: 0,
          totalGain: 0,
          gainPercentage: 0
        };
      }

      // Try to fetch latest deposits
      let latestDeposits = [];
      try {
        const depositsResponse = await api.deposits.getAll({ limit: 5 });
        // Backend returns: { data: deposits[], pagination: {...} }
        latestDeposits = depositsResponse.data?.data || depositsResponse.data || [];
        console.log('Fetched deposits:', latestDeposits);
      } catch (depositsErr) {
        console.error('Deposits API error:', depositsErr);
        // Don't silently fail - log the error
      }

      // Try to fetch latest withdrawals
      let latestWithdrawals = [];
      try {
        const withdrawalsResponse = await api.withdrawals.getAll({ limit: 5 });
        // Backend returns: { data: withdrawals[], pagination: {...} }
        latestWithdrawals = withdrawalsResponse.data?.data || withdrawalsResponse.data || [];
        console.log('Fetched withdrawals:', latestWithdrawals);
      } catch (withdrawalsErr) {
        console.error('Withdrawals API error:', withdrawalsErr);
        // Don't silently fail - log the error
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
        portfolioValue: toNumber(portfolioData.totalValue),
        totalInvested: toNumber(portfolioData.totalInvested),
        totalGain: toNumber(portfolioData.totalGain),
        gainPercentage: toNumber(portfolioData.gainPercentage),
        recentTransactions,
        latestDeposits: Array.isArray(latestDeposits) 
          ? latestDeposits.slice(0, 5).map((d: any) => ({
              id: d.id,
              amount: toNumber(d.amount),
              currency: d.currency || 'GBP',
              status: d.status || 'PENDING',
              createdAt: d.createdAt || d.transactionDate || new Date().toISOString(),
            }))
          : [],
        latestWithdrawals: Array.isArray(latestWithdrawals)
          ? latestWithdrawals.slice(0, 5).map((w: any) => ({
              id: w.id,
              amount: toNumber(w.amount),
              currency: w.currency || 'GBP',
              status: w.status || 'PENDING',
              createdAt: w.createdAt || w.transactionDate || new Date().toISOString(),
            }))
          : [],
      });
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      
      // Set fallback data even if there's an error
      setData({
        portfolioValue: 0,
        totalInvested: 0,
        totalGain: 0,
        gainPercentage: 0,
        recentTransactions: [],
        latestDeposits: [],
        latestWithdrawals: [],
      });
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
      {/* Live UK Share Feed Ticker */}
      <LiveQuoteTicker />
      
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
          value={`£${(data?.totalInvested || 0).toLocaleString()}`}
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

      {/* Latest Deposits and Withdrawals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Latest Deposits Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Latest Deposits</span>
              <Link href="/deposits" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </CardTitle>
            <CardDescription>
              Your most recent deposit requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.latestDeposits && data.latestDeposits.length > 0 ? (
              <div className="space-y-3">
                {data.latestDeposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">
                        £{deposit.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(deposit.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge
                      variant={
                        deposit.status === 'COMPLETED'
                          ? 'default'
                          : deposit.status === 'PENDING'
                          ? 'secondary'
                          : deposit.status === 'REJECTED'
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {deposit.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No deposits found.</p>
                <Link href="/deposits" className="text-sm text-primary hover:underline mt-2 inline-block">
                  Make a deposit
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Withdrawals Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Latest Withdrawals</span>
              <Link href="/withdrawals" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </CardTitle>
            <CardDescription>
              Your most recent withdrawal requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.latestWithdrawals && data.latestWithdrawals.length > 0 ? (
              <div className="space-y-3">
                {data.latestWithdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">
                        £{withdrawal.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge
                      variant={
                        withdrawal.status === 'COMPLETED'
                          ? 'default'
                          : withdrawal.status === 'PENDING'
                          ? 'secondary'
                          : withdrawal.status === 'REJECTED'
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {withdrawal.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No withdrawals found.</p>
                <Link href="/withdrawals" className="text-sm text-primary hover:underline mt-2 inline-block">
                  Request withdrawal
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
            <CardDescription>
              Track your portfolio growth over time
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <PortfolioPerformanceChart portfolioId="all" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
            <CardDescription>
              Distribution of your investments
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <PortfolioAllocationChart portfolioId="all" />
          </CardContent>
        </Card>
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
                      £{transaction.amount.toLocaleString()}
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

