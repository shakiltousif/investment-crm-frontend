'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Download, 
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  exportable?: boolean;
  onExport?: () => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  searchable = true,
  searchPlaceholder = "Search...",
  onSearch,
  exportable = false,
  onExport,
  pagination,
  loading = false,
  emptyMessage = "No data available",
  className,
  actions,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  const renderCell = (column: Column<T>, row: T) => {
    const keyString = String(column.key);
    const value = keyString.includes('.') 
      ? keyString.split('.').reduce((obj, key) => obj?.[key], row)
      : row[column.key as keyof T];

    if (column.render) {
      return column.render(value, row);
    }

    // Default rendering
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }

    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    if (typeof value === 'string' && value.includes('http')) {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Link
        </a>
      );
    }

    return String(value || '');
  };

  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                {columns.map((_, colIndex) => (
                  <div 
                    key={colIndex} 
                    className="h-4 bg-muted rounded animate-pulse flex-1"
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {/* Header */}
      {(title || searchable || exportable || actions) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            {title && <CardTitle>{title}</CardTitle>}
            <div className="flex items-center gap-2">
              {actions}
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              )}
              {exportable && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-primary text-white">
                    {columns.map((column) => (
                      <th
                        key={String(column.key)}
                        className={cn(
                          "px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider",
                          column.sortable && "cursor-pointer hover:bg-primary/80",
                          column.className
                        )}
                        style={{ width: column.width }}
                        onClick={() => column.sortable && handleSort(String(column.key))}
                      >
                        <div className="flex items-center gap-2">
                          {column.label}
                          {column.sortable && getSortIcon(String(column.key))}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr 
                      key={index} 
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className={cn(
                            "px-4 py-3 text-sm",
                            column.className
                          )}
                        >
                          {renderCell(column, row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Items per page:</label>
                    <select
                      value={pagination.pageSize}
                      onChange={(e) => {
                        pagination.onPageSizeChange(Number(e.target.value));
                        pagination.onPageChange(1);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pagination.onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pagination.onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized data tables for common use cases
export function InvestmentTable({ 
  investments, 
  onBuy, 
  onSell, 
  onDelete,
  loading = false,
  pagination,
}: {
  investments: any[];
  onBuy?: (investment: any) => void;
  onSell?: (investment: any) => void;
  onDelete?: (investment: any) => void;
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
}) {
  const columns: Column<any>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          {row.symbol && (
            <div className="text-sm text-muted-foreground">{row.symbol}</div>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <Badge variant="secondary">
          {value.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      key: 'currentPrice',
      label: 'Current Price',
      sortable: true,
      render: (value) => `£${value.toLocaleString()}`,
    },
    {
      key: 'totalValue',
      label: 'Total Value',
      sortable: true,
      render: (value) => `£${value.toLocaleString()}`,
    },
    {
      key: 'totalGain',
      label: 'Gain/Loss',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col">
          <span className={cn(
            "font-medium",
            value >= 0 ? "text-success" : "text-destructive"
          )}>
            £{value.toLocaleString()}
          </span>
          <span className={cn(
            "text-sm",
            row.gainPercentage >= 0 ? "text-success" : "text-destructive"
          )}>
            {Number(row.gainPercentage).toFixed(2)}%
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        if (!value) return null;
        const statusColors: Record<string, string> = {
          PENDING: 'bg-yellow-100 text-yellow-800',
          ACTIVE: 'bg-green-100 text-green-800',
          CANCELLED: 'bg-red-100 text-red-800',
          COMPLETED: 'bg-blue-100 text-blue-800',
          MATURED: 'bg-gray-100 text-gray-800',
        };
        return (
          <Badge className={statusColors[value] || 'bg-gray-100 text-gray-800'}>
            {value}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const isActive = row.status === 'ACTIVE' || !row.status;
        return (
          <div className="flex gap-2">
            {onBuy && isActive && (
              <Button size="sm" variant="outline" onClick={() => onBuy(row)}>
                Buy More
              </Button>
            )}
            {onSell && isActive && (
              <Button size="sm" variant="outline" onClick={() => onSell(row)}>
                Sell
              </Button>
            )}
            {onDelete && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onDelete(row)}
                className="text-destructive hover:text-destructive"
              >
                Delete
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      data={investments}
      columns={columns}
      title="Your Investments"
      searchable
      exportable
      loading={loading}
      emptyMessage="No investments found. Start by buying your first investment from the marketplace."
      pagination={pagination}
    />
  );
}



