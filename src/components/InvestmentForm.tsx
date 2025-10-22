'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Form, FormField, SelectField } from '@/components/ui/Form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Percent } from 'lucide-react';
import axios from 'axios';

interface InvestmentFormProps {
  portfolioId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
  isEditing?: boolean;
  className?: string;
}

const INVESTMENT_TYPES = [
  { value: 'STOCK', label: 'Stock' },
  { value: 'BOND', label: 'Bond' },
  { value: 'TERM_DEPOSIT', label: 'Term Deposit' },
  { value: 'PRIVATE_EQUITY', label: 'Private Equity' },
  { value: 'MUTUAL_FUND', label: 'Mutual Fund' },
  { value: 'ETF', label: 'ETF' },
  { value: 'CRYPTOCURRENCY', label: 'Cryptocurrency' },
  { value: 'OTHER', label: 'Other' },
];

const investmentSchema = z.object({
  portfolioId: z.string(),
  type: z.string().min(1, 'Investment type is required'),
  name: z.string().min(1, 'Investment name is required'),
  symbol: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  purchasePrice: z.number().min(0.01, 'Purchase price must be greater than 0'),
  currentPrice: z.number().min(0.01, 'Current price must be greater than 0'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  maturityDate: z.string().optional(),
  interestRate: z.number().optional(),
});

export default function InvestmentForm({
  portfolioId,
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
  className,
}: InvestmentFormProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [gainLoss, setGainLoss] = useState(0);
  const [gainPercentage, setGainPercentage] = useState(0);

  const defaultValues = {
    portfolioId,
    type: initialData?.type || 'STOCK',
    name: initialData?.name || '',
    symbol: initialData?.symbol || '',
    quantity: initialData?.quantity || 0,
    purchasePrice: initialData?.purchasePrice || 0,
    currentPrice: initialData?.currentPrice || 0,
    purchaseDate: initialData?.purchaseDate?.split('T')[0] || '',
    maturityDate: initialData?.maturityDate?.split('T')[0] || '',
    interestRate: initialData?.interestRate || 0,
  };

  const calculateValues = (quantity: number, purchasePrice: number, currentPrice: number) => {
    const invested = quantity * purchasePrice;
    const value = quantity * currentPrice;
    const gain = value - invested;
    const percentage = invested > 0 ? (gain / invested) * 100 : 0;
    
    setTotalInvested(invested);
    setTotalValue(value);
    setGainLoss(gain);
    setGainPercentage(percentage);
  };

  const handleSubmit = async (data: z.infer<typeof investmentSchema>) => {
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/investments/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/investments`;

      const method = isEditing ? 'PUT' : 'POST';

      await axios({
        method,
        url,
        data: {
          ...data,
          interestRate: data.interestRate || undefined,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      onSuccess?.();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to save investment');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEditing ? 'Edit Investment' : 'Add New Investment'}
          </CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update your investment details below.' 
              : 'Fill in the details to add a new investment to your portfolio.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form
            schema={investmentSchema}
            onSubmit={handleSubmit}
            defaultValues={defaultValues}
            loading={loading}
            className="space-y-6"
          >
            {/* Investment Type and Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Investment Type"
                name="type"
                options={INVESTMENT_TYPES}
                required
                control={undefined as any}
              />
              
              <FormField
                label="Investment Name"
                name="name"
                type="text"
                placeholder="Apple Inc."
                required
                control={undefined as any}
              />
            </div>

            {/* Symbol */}
            <FormField
              label="Symbol (Optional)"
              name="symbol"
              type="text"
              placeholder="AAPL"
              control={undefined as any}
            />

            {/* Quantity, Purchase Price, Current Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Quantity"
                name="quantity"
                type="number"
                placeholder="100"
                required
                step={0.01}
                control={undefined as any}
              />
              
              <FormField
                label="Purchase Price"
                name="purchasePrice"
                type="number"
                placeholder="150.00"
                required
                step={0.01}
                control={undefined as any}
              />
              
              <FormField
                label="Current Price"
                name="currentPrice"
                type="number"
                placeholder="175.00"
                required
                step={0.01}
                control={undefined as any}
              />
            </div>

            {/* Investment Summary */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Total Invested
                    </div>
                    <div className="text-2xl font-bold">
                      ${totalInvested.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Current Value
                    </div>
                    <div className="text-2xl font-bold">
                      ${totalValue.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {(totalInvested > 0 || totalValue > 0) && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {gainLoss >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span className="text-sm text-muted-foreground">Gain/Loss</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={gainLoss >= 0 ? 'success' : 'destructive'}
                        >
                          {gainLoss >= 0 ? '+' : ''}${gainLoss.toLocaleString()}
                        </Badge>
                        <Badge 
                          variant={gainPercentage >= 0 ? 'success' : 'destructive'}
                        >
                          {gainPercentage >= 0 ? '+' : ''}{Number(gainPercentage).toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Purchase Date"
                name="purchaseDate"
                type="date"
                required
                control={undefined as any}
              />
              
              <FormField
                label="Maturity Date (Optional)"
                name="maturityDate"
                type="date"
                control={undefined as any}
              />
            </div>

            {/* Interest Rate */}
            <FormField
              label="Interest Rate (Optional)"
              name="interestRate"
              type="number"
              placeholder="5.5"
              step={0.01}
              control={undefined as any}
            />

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Saving...' : isEditing ? 'Update Investment' : 'Create Investment'}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

