'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  };
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
          <Home className="h-4 w-4" />
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="h-4 w-4" />
              {item.href ? (
                <a
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Header Content */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {badge && (
              <Badge variant={badge.variant || 'secondary'}>
                {badge.text}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground text-lg">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized page headers for common use cases
export function DashboardHeader({ 
  userName,
  actions 
}: { 
  userName?: string; 
  actions?: React.ReactNode; 
}) {
  return (
    <PageHeader
      title="Dashboard"
      description={userName ? `Welcome back, ${userName}` : undefined}
      actions={actions}
    />
  );
}

export function InvestmentHeader({ 
  actions 
}: { 
  actions?: React.ReactNode; 
}) {
  return (
    <PageHeader
      title="Investments"
      description="Manage your investment portfolio"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Investments' }
      ]}
      actions={actions}
    />
  );
}

export function PortfolioHeader({ 
  actions 
}: { 
  actions?: React.ReactNode; 
}) {
  return (
    <PageHeader
      title="Portfolio"
      description="View and manage your portfolio allocation"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Portfolio' }
      ]}
      actions={actions}
    />
  );
}

export function TransactionHeader({ 
  actions 
}: { 
  actions?: React.ReactNode; 
}) {
  return (
    <PageHeader
      title="Transactions"
      description="View your transaction history"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Transactions' }
      ]}
      actions={actions}
    />
  );
}

export function AnalyticsHeader({ 
  actions 
}: { 
  actions?: React.ReactNode; 
}) {
  return (
    <PageHeader
      title="Analytics"
      description="Detailed performance analytics and insights"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Analytics' }
      ]}
      actions={actions}
    />
  );
}



