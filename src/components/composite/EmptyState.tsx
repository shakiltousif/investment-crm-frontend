'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Package, 
  TrendingUp, 
  CreditCard, 
  BarChart3, 
  Users, 
  Settings,
  FileText,
  Search,
  AlertCircle
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
  };

  const iconSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <Card className={cn("text-center", className)}>
      <CardContent className={cn(sizeClasses[size])}>
        {icon && (
          <div className={cn(
            "mx-auto mb-4 flex items-center justify-center rounded-full bg-muted/50",
            iconSizeClasses[size]
          )}>
            <div className={cn("text-muted-foreground", iconSizeClasses[size])}>
              {icon}
            </div>
          </div>
        )}
        
        <h3 className={cn(
          "font-medium text-foreground mb-2",
          size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-xl' : 'text-lg'
        )}>
          {title}
        </h3>
        
        {description && (
          <p className={cn(
            "text-muted-foreground mb-6 max-w-sm mx-auto",
            size === 'sm' ? 'text-sm' : 'text-base'
          )}>
            {description}
          </p>
        )}
        
        {(action || secondaryAction) && (
          <div className="flex gap-3 justify-center">
            {action && (
              <Button 
                onClick={action.onClick}
                variant={action.variant || 'default'}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button 
                onClick={secondaryAction.onClick}
                variant={secondaryAction.variant || 'outline'}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Predefined empty states for common use cases
export function NoInvestmentsEmptyState({ 
  onBrowseMarketplace 
}: { 
  onBrowseMarketplace?: () => void; 
}) {
  return (
    <EmptyState
      icon={<TrendingUp />}
      title="No investments found"
      description="Start building your portfolio by exploring our marketplace and making your first investment."
      action={onBrowseMarketplace ? {
        label: "Browse Marketplace",
        onClick: onBrowseMarketplace,
      } : undefined}
    />
  );
}

export function NoTransactionsEmptyState({ 
  onMakeTransaction 
}: { 
  onMakeTransaction?: () => void; 
}) {
  return (
    <EmptyState
      icon={<CreditCard />}
      title="No transactions yet"
      description="Your transaction history will appear here once you start making deposits, withdrawals, or investments."
      action={onMakeTransaction ? {
        label: "Make Transaction",
        onClick: onMakeTransaction,
      } : undefined}
    />
  );
}

export function NoPortfolioEmptyState({ 
  onCreatePortfolio 
}: { 
  onCreatePortfolio?: () => void; 
}) {
  return (
    <EmptyState
      icon={<BarChart3 />}
      title="No portfolio found"
      description="Create your first portfolio to start tracking your investments and performance."
      action={onCreatePortfolio ? {
        label: "Create Portfolio",
        onClick: onCreatePortfolio,
      } : undefined}
    />
  );
}

export function NoAnalyticsEmptyState({ 
  onViewDashboard 
}: { 
  onViewDashboard?: () => void; 
}) {
  return (
    <EmptyState
      icon={<BarChart3 />}
      title="No analytics data"
      description="Analytics will be available once you have some investment activity and transaction history."
      action={onViewDashboard ? {
        label: "View Dashboard",
        onClick: onViewDashboard,
      } : undefined}
    />
  );
}

export function NoBankAccountsEmptyState({ 
  onAddAccount 
}: { 
  onAddAccount?: () => void; 
}) {
  return (
    <EmptyState
      icon={<CreditCard />}
      title="No bank accounts"
      description="Add a bank account to enable deposits and withdrawals for your investment activities."
      action={onAddAccount ? {
        label: "Add Bank Account",
        onClick: onAddAccount,
      } : undefined}
    />
  );
}

export function NoSearchResultsEmptyState({ 
  onClearSearch 
}: { 
  onClearSearch?: () => void; 
}) {
  return (
    <EmptyState
      icon={<Search />}
      title="No results found"
      description="Try adjusting your search criteria or filters to find what you're looking for."
      action={onClearSearch ? {
        label: "Clear Search",
        onClick: onClearSearch,
        variant: 'outline',
      } : undefined}
    />
  );
}

export function ErrorEmptyState({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry?: () => void; 
}) {
  return (
    <EmptyState
      icon={<AlertCircle />}
      title="Something went wrong"
      description={error}
      action={onRetry ? {
        label: "Try Again",
        onClick: onRetry,
      } : undefined}
    />
  );
}

export function ComingSoonEmptyState({ 
  feature 
}: { 
  feature: string; 
}) {
  return (
    <EmptyState
      icon={<Settings />}
      title={`${feature} Coming Soon`}
      description="This feature is currently under development and will be available in a future update."
    />
  );
}
