'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period?: string;
  };
  icon?: LucideIcon;
  description?: string;
  className?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  className,
  loading = false,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!change) return null;
    
    switch (change.type) {
      case 'increase':
        return <TrendingUp className="h-4 w-4" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4" />;
      case 'neutral':
        return <Minus className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!change) return '';
    
    switch (change.type) {
      case 'increase':
        return 'text-success';
      case 'decrease':
        return 'text-destructive';
      case 'neutral':
        return 'text-muted-foreground';
      default:
        return '';
    }
  };

  const getTrendBadgeVariant = () => {
    if (!change) return 'secondary';
    
    switch (change.type) {
      case 'increase':
        return 'success';
      case 'decrease':
        return 'destructive';
      case 'neutral':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 w-24 bg-muted rounded"></div>
          </CardTitle>
          {Icon && <div className="h-4 w-4 bg-muted rounded"></div>}
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-muted rounded mb-2"></div>
          <div className="h-3 w-16 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {change && (
          <div className="flex items-center mt-2">
            <Badge 
              variant={getTrendBadgeVariant()} 
              className="text-xs"
            >
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={cn(getTrendColor())}>
                  {change.value > 0 ? '+' : ''}{change.value}%
                </span>
              </div>
            </Badge>
            {change.period && (
              <span className="text-xs text-muted-foreground ml-2">
                {change.period}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized stat cards for common use cases
export function PortfolioValueCard({ 
  value, 
  change, 
  loading = false 
}: { 
  value: number; 
  change?: { value: number; type: 'increase' | 'decrease' | 'neutral' }; 
  loading?: boolean; 
}) {
  return (
    <StatCard
      title="Portfolio Value"
      value={`$${value.toLocaleString()}`}
      change={change}
      icon={TrendingUp}
      loading={loading}
    />
  );
}

export function TotalGainCard({ 
  value, 
  change, 
  loading = false 
}: { 
  value: number; 
  change?: { value: number; type: 'increase' | 'decrease' | 'neutral' }; 
  loading?: boolean; 
}) {
  return (
    <StatCard
      title="Total Gain/Loss"
      value={`$${value.toLocaleString()}`}
      change={change}
      icon={value >= 0 ? TrendingUp : TrendingDown}
      loading={loading}
      className={cn(
        value >= 0 
          ? "border-success/20 bg-success/5" 
          : "border-destructive/20 bg-destructive/5"
      )}
    />
  );
}

export function TransactionCountCard({ 
  count, 
  period = "This Month",
  loading = false 
}: { 
  count: number; 
  period?: string; 
  loading?: boolean; 
}) {
  return (
    <StatCard
      title="Transactions"
      value={count.toLocaleString()}
      description={period}
      loading={loading}
    />
  );
}



