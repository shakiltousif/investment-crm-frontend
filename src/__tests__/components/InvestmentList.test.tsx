import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import InvestmentList from '../components/InvestmentList';
import { api } from '../lib/api';

// Mock the API client
vi.mock('../lib/api', () => ({
  api: {
    investments: {
      buy: vi.fn(),
      sell: vi.fn(),
    },
  },
}));

// Mock the modal components
vi.mock('../components/BuyInvestmentModal', () => ({
  default: ({ isOpen, onClose, onSuccess }: any) => (
    isOpen ? (
      <div data-testid="buy-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Buy</button>
      </div>
    ) : null
  ),
}));

vi.mock('../components/SellInvestmentModal', () => ({
  default: ({ isOpen, onClose, onSuccess }: any) => (
    isOpen ? (
      <div data-testid="sell-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Sell</button>
      </div>
    ) : null
  ),
}));

const mockInvestments = [
  {
    id: 'investment-1',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    type: 'STOCK',
    quantity: 10,
    purchasePrice: 150,
    currentPrice: 160,
    totalValue: 1600,
    totalInvested: 1500,
    totalGain: 100,
    gainPercentage: 6.67,
    purchaseDate: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'investment-2',
    name: 'Microsoft Corp.',
    symbol: 'MSFT',
    type: 'STOCK',
    quantity: 5,
    purchasePrice: 200,
    currentPrice: 180,
    totalValue: 900,
    totalInvested: 1000,
    totalGain: -100,
    gainPercentage: -10,
    purchaseDate: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('InvestmentList', () => {
  const mockOnBuy = vi.fn();
  const mockOnSell = vi.fn();
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render investment list correctly', () => {
    renderWithRouter(
      <InvestmentList
        investments={mockInvestments}
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('Microsoft Corp.')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
  });

  it('should display investment details correctly', () => {
    renderWithRouter(
      <InvestmentList
        investments={mockInvestments}
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
      />
    );

    // Check Apple investment details
    expect(screen.getByText('$160.00')).toBeInTheDocument(); // Current price
    expect(screen.getByText('10')).toBeInTheDocument(); // Quantity
    expect(screen.getByText('$1,600.00')).toBeInTheDocument(); // Total value
    expect(screen.getByText('+6.67%')).toBeInTheDocument(); // Gain percentage

    // Check Microsoft investment details
    expect(screen.getByText('$180.00')).toBeInTheDocument(); // Current price
    expect(screen.getByText('5')).toBeInTheDocument(); // Quantity
    expect(screen.getByText('$900.00')).toBeInTheDocument(); // Total value
    expect(screen.getByText('-10.00%')).toBeInTheDocument(); // Loss percentage
  });

  it('should show positive gain in green', () => {
    renderWithRouter(
      <InvestmentList
        investments={[mockInvestments[0]]} // Apple with positive gain
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
      />
    );

    const gainElement = screen.getByText('+6.67%');
    expect(gainElement).toHaveClass('text-green-600');
  });

  it('should show negative gain in red', () => {
    renderWithRouter(
      <InvestmentList
        investments={[mockInvestments[1]]} // Microsoft with negative gain
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
      />
    );

    const lossElement = screen.getByText('-10.00%');
    expect(lossElement).toHaveClass('text-red-600');
  });

  it('should call onBuy when buy button is clicked', () => {
    renderWithRouter(
      <InvestmentList
        investments={mockInvestments}
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
      />
    );

    const buyButtons = screen.getAllByText('Buy');
    fireEvent.click(buyButtons[0]);

    expect(mockOnBuy).toHaveBeenCalledWith(mockInvestments[0]);
  });

  it('should call onSell when sell button is clicked', () => {
    renderWithRouter(
      <InvestmentList
        investments={mockInvestments}
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
      />
    );

    const sellButtons = screen.getAllByText('Sell');
    fireEvent.click(sellButtons[0]);

    expect(mockOnSell).toHaveBeenCalledWith(mockInvestments[0]);
  });

  it('should call onRefresh when refresh button is clicked', () => {
    renderWithRouter(
      <InvestmentList
        investments={mockInvestments}
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
      />
    );

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('should display empty state when no investments', () => {
    renderWithRouter(
      <InvestmentList
        investments={[]}
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('No investments found')).toBeInTheDocument();
    expect(screen.getByText('Start by creating a portfolio and making your first investment.')).toBeInTheDocument();
  });

  it('should format currency values correctly', () => {
    renderWithRouter(
      <InvestmentList
        investments={mockInvestments}
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
      />
    );

    // Check that currency values are formatted with commas and 2 decimal places
    expect(screen.getByText('$1,600.00')).toBeInTheDocument();
    expect(screen.getByText('$900.00')).toBeInTheDocument();
  });

  it('should format percentage values correctly', () => {
    renderWithRouter(
      <InvestmentList
        investments={mockInvestments}
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
      />
    );

    // Check that percentages are formatted with 2 decimal places and + or - sign
    expect(screen.getByText('+6.67%')).toBeInTheDocument();
    expect(screen.getByText('-10.00%')).toBeInTheDocument();
  });

  it('should display investment type correctly', () => {
    renderWithRouter(
      <InvestmentList
        investments={mockInvestments}
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getAllByText('STOCK')).toHaveLength(2);
  });

  it('should display purchase date correctly', () => {
    renderWithRouter(
      <InvestmentList
        investments={mockInvestments}
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
      />
    );

    // Check that dates are formatted correctly
    expect(screen.getAllByText('1/1/2024')).toHaveLength(2);
  });

  it('should handle loading state', () => {
    renderWithRouter(
      <InvestmentList
        investments={mockInvestments}
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
        loading={true}
      />
    );

    // The component should still render investments even when loading
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    renderWithRouter(
      <InvestmentList
        investments={mockInvestments}
        onBuy={mockOnBuy}
        onSell={mockOnSell}
        onRefresh={mockOnRefresh}
        error="Failed to load investments"
      />
    );

    // The component should still render investments even when there's an error
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
  });
});
