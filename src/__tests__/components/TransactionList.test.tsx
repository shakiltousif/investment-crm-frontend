import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TransactionList from '@/components/TransactionList';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the API
jest.mock('@/lib/api', () => ({
  transaction: {
    getTransactions: jest.fn(),
    exportTransactions: jest.fn(),
  },
}));

const mockGetTransactions = require('@/lib/api').transaction.getTransactions;
const mockExportTransactions = require('@/lib/api').transaction.exportTransactions;

const mockTransactions = [
  {
    id: '1',
    type: 'BUY',
    amount: 2250,
    currency: 'USD',
    status: 'COMPLETED',
    description: 'Bought Netflix Inc.',
    transactionDate: '2025-10-22T10:00:00Z',
    completedAt: '2025-10-22T10:01:00Z',
    investment: {
      id: '1',
      name: 'Netflix Inc.',
      symbol: 'NFLX',
    },
  },
  {
    id: '2',
    type: 'SELL',
    amount: -445.5,
    currency: 'USD',
    status: 'COMPLETED',
    description: 'Sold Netflix Inc.',
    transactionDate: '2025-10-22T11:00:00Z',
    completedAt: '2025-10-22T11:01:00Z',
    investment: {
      id: '1',
      name: 'Netflix Inc.',
      symbol: 'NFLX',
    },
  },
  {
    id: '3',
    type: 'DEPOSIT',
    amount: 5000,
    currency: 'USD',
    status: 'COMPLETED',
    description: 'Bank deposit',
    transactionDate: '2025-10-21T09:00:00Z',
    completedAt: '2025-10-21T09:01:00Z',
    investment: null,
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('TransactionList', () => {
  const defaultProps = {
    transactions: mockTransactions,
    onRefresh: jest.fn(),
    onExport: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all transactions correctly', () => {
    renderWithProviders(<TransactionList {...defaultProps} />);
    
    expect(screen.getByText('Netflix Inc.')).toBeInTheDocument();
    expect(screen.getByText('NFLX')).toBeInTheDocument();
    expect(screen.getByText('Bought Netflix Inc.')).toBeInTheDocument();
    expect(screen.getByText('Sold Netflix Inc.')).toBeInTheDocument();
    expect(screen.getByText('Bank deposit')).toBeInTheDocument();
  });

  it('displays transaction details correctly', () => {
    renderWithProviders(<TransactionList {...defaultProps} />);
    
    // Check BUY transaction
    expect(screen.getByText('USD $2,250')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('BUY')).toBeInTheDocument();
    
    // Check SELL transaction
    expect(screen.getByText('USD $-445.50')).toBeInTheDocument();
    expect(screen.getByText('SELL')).toBeInTheDocument();
    
    // Check DEPOSIT transaction
    expect(screen.getByText('USD $5,000')).toBeInTheDocument();
    expect(screen.getByText('DEPOSIT')).toBeInTheDocument();
  });

  it('shows transaction dates correctly', () => {
    renderWithProviders(<TransactionList {...defaultProps} />);
    
    expect(screen.getByText('22/10/2025')).toBeInTheDocument();
    expect(screen.getByText('21/10/2025')).toBeInTheDocument();
  });

  it('renders filters correctly', () => {
    renderWithProviders(<TransactionList {...defaultProps} />);
    
    expect(screen.getByText('Filter Transactions')).toBeInTheDocument();
    expect(screen.getByLabelText(/transaction type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/from date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('filters transactions by type', async () => {
    renderWithProviders(<TransactionList {...defaultProps} />);
    
    const typeSelect = screen.getByLabelText(/transaction type/i);
    fireEvent.change(typeSelect, { target: { value: 'BUY' } });
    
    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText('Bought Netflix Inc.')).toBeInTheDocument();
      expect(screen.queryByText('Sold Netflix Inc.')).not.toBeInTheDocument();
      expect(screen.queryByText('Bank deposit')).not.toBeInTheDocument();
    });
  });

  it('filters transactions by status', async () => {
    renderWithProviders(<TransactionList {...defaultProps} />);
    
    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });
    
    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getAllByText('COMPLETED')).toHaveLength(3);
    });
  });

  it('filters transactions by date range', async () => {
    renderWithProviders(<TransactionList {...defaultProps} />);
    
    const fromDateInput = screen.getByLabelText(/from date/i);
    const toDateInput = screen.getByLabelText(/to date/i);
    
    fireEvent.change(fromDateInput, { target: { value: '2025-10-22' } });
    fireEvent.change(toDateInput, { target: { value: '2025-10-22' } });
    
    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getAllByText('22/10/2025')).toHaveLength(2);
      expect(screen.queryByText('21/10/2025')).not.toBeInTheDocument();
    });
  });

  it('clears filters correctly', async () => {
    renderWithProviders(<TransactionList {...defaultProps} />);
    
    // Apply a filter first
    const typeSelect = screen.getByLabelText(/transaction type/i);
    fireEvent.change(typeSelect, { target: { value: 'BUY' } });
    
    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.queryByText('Sold Netflix Inc.')).not.toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('Bought Netflix Inc.')).toBeInTheDocument();
      expect(screen.getByText('Sold Netflix Inc.')).toBeInTheDocument();
      expect(screen.getByText('Bank deposit')).toBeInTheDocument();
    });
  });

  it('exports transactions successfully', async () => {
    mockExportTransactions.mockResolvedValueOnce({
      data: 'csv,data,here',
    });

    renderWithProviders(<TransactionList {...defaultProps} />);
    
    const exportButton = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockExportTransactions).toHaveBeenCalled();
      expect(defaultProps.onExport).toHaveBeenCalled();
    });
  });

  it('handles export error', async () => {
    mockExportTransactions.mockRejectedValueOnce(new Error('Export failed'));

    renderWithProviders(<TransactionList {...defaultProps} />);
    
    const exportButton = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText(/export failed/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during export', async () => {
    mockExportTransactions.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<TransactionList {...defaultProps} />);
    
    const exportButton = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportButton);

    expect(exportButton).toBeDisabled();
    expect(screen.getByText(/exporting transactions/i)).toBeInTheDocument();
  });

  it('handles empty transactions array', () => {
    const emptyProps = {
      ...defaultProps,
      transactions: [],
    };
    
    renderWithProviders(<TransactionList {...emptyProps} />);
    
    expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
  });

  it('shows pagination when there are many transactions', () => {
    const manyTransactions = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      type: 'BUY',
      amount: 1000,
      currency: 'USD',
      status: 'COMPLETED',
      description: `Transaction ${i + 1}`,
      transactionDate: '2025-10-22T10:00:00Z',
      completedAt: '2025-10-22T10:01:00Z',
      investment: {
        id: `${i + 1}`,
        name: `Investment ${i + 1}`,
        symbol: `SYM${i + 1}`,
      },
    }));

    const manyProps = {
      ...defaultProps,
      transactions: manyTransactions,
    };
    
    renderWithProviders(<TransactionList {...manyProps} />);
    
    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/total: 25/i)).toBeInTheDocument();
  });

  it('navigates between pages', async () => {
    const manyTransactions = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      type: 'BUY',
      amount: 1000,
      currency: 'USD',
      status: 'COMPLETED',
      description: `Transaction ${i + 1}`,
      transactionDate: '2025-10-22T10:00:00Z',
      completedAt: '2025-10-22T10:01:00Z',
      investment: {
        id: `${i + 1}`,
        name: `Investment ${i + 1}`,
        symbol: `SYM${i + 1}`,
      },
    }));

    const manyProps = {
      ...defaultProps,
      transactions: manyTransactions,
    };
    
    renderWithProviders(<TransactionList {...manyProps} />);
    
    const nextButton = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
    });
  });

  it('formats currency correctly', () => {
    renderWithProviders(<TransactionList {...defaultProps} />);
    
    expect(screen.getByText('USD $2,250')).toBeInTheDocument();
    expect(screen.getByText('USD $-445.50')).toBeInTheDocument();
    expect(screen.getByText('USD $5,000')).toBeInTheDocument();
  });

  it('shows correct transaction type styling', () => {
    renderWithProviders(<TransactionList {...defaultProps} />);
    
    const buyBadges = screen.getAllByText('BUY');
    const sellBadges = screen.getAllByText('SELL');
    const depositBadges = screen.getAllByText('DEPOSIT');
    
    expect(buyBadges).toHaveLength(1);
    expect(sellBadges).toHaveLength(1);
    expect(depositBadges).toHaveLength(1);
  });

  it('shows correct status styling', () => {
    renderWithProviders(<TransactionList {...defaultProps} />);
    
    const completedBadges = screen.getAllByText('COMPLETED');
    expect(completedBadges).toHaveLength(3);
  });

  it('handles transactions without investments', () => {
    renderWithProviders(<TransactionList {...defaultProps} />);
    
    // DEPOSIT transaction should not show investment details
    expect(screen.getByText('Bank deposit')).toBeInTheDocument();
    expect(screen.queryByText('Investment:')).not.toBeInTheDocument();
  });

  it('refreshes transactions when refresh button is clicked', () => {
    renderWithProviders(<TransactionList {...defaultProps} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    expect(defaultProps.onRefresh).toHaveBeenCalled();
  });
});
