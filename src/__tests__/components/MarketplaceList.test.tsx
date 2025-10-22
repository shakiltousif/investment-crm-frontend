import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MarketplaceList from '@/components/MarketplaceList';
import { AuthProvider } from '@/contexts/AuthContext';

const mockInvestments = [
  {
    id: '1',
    name: 'Netflix Inc.',
    symbol: 'NFLX',
    description: 'Leading streaming entertainment service',
    currentPrice: 450,
    minimumInvestment: 100,
    maximumInvestment: 50000,
    currency: 'USD',
    riskLevel: 'MEDIUM',
    expectedReturn: 10.5,
    isAvailable: true,
    category: 'Entertainment',
    issuer: 'Netflix Corporation',
    createdAt: '2025-10-22T00:00:00Z',
  },
  {
    id: '2',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    description: 'Technology company focused on consumer electronics',
    currentPrice: 175.5,
    minimumInvestment: 100,
    maximumInvestment: 100000,
    currency: 'USD',
    riskLevel: 'MEDIUM',
    expectedReturn: 8.5,
    isAvailable: true,
    category: 'Technology',
    issuer: 'Apple Inc.',
    createdAt: '2025-10-22T00:00:00Z',
  },
  {
    id: '3',
    name: 'Bitcoin',
    symbol: 'BTC-USD',
    description: 'The world\'s first cryptocurrency',
    currentPrice: 65000,
    minimumInvestment: 100,
    maximumInvestment: 1000000,
    currency: 'USD',
    riskLevel: 'HIGH',
    expectedReturn: 15.0,
    isAvailable: false,
    category: 'Cryptocurrency',
    issuer: 'Bitcoin Network',
    createdAt: '2025-10-22T00:00:00Z',
  },
];

const mockLiveQuotes = new Map([
  ['NFLX', { price: 455, change: 5, changePercent: 1.11 }],
  ['AAPL', { price: 180, change: 4.5, changePercent: 2.56 }],
]);

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('MarketplaceList', () => {
  const defaultProps = {
    investments: mockInvestments,
    onBuy: jest.fn(),
    onEdit: jest.fn(),
    onDetails: jest.fn(),
    onRefresh: jest.fn(),
    liveQuotes: mockLiveQuotes,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all investments correctly', () => {
    renderWithProviders(<MarketplaceList {...defaultProps} />);
    
    expect(screen.getByText('Netflix Inc.')).toBeInTheDocument();
    expect(screen.getByText('NFLX')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('BTC-USD')).toBeInTheDocument();
  });

  it('displays investment details correctly', () => {
    renderWithProviders(<MarketplaceList {...defaultProps} />);
    
    // Check Netflix details
    expect(screen.getByText('USD $450')).toBeInTheDocument();
    expect(screen.getByText('USD $100')).toBeInTheDocument();
    expect(screen.getByText('USD $50,000')).toBeInTheDocument();
    expect(screen.getByText('10.50%')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM Risk')).toBeInTheDocument();
    expect(screen.getByText('STOCK')).toBeInTheDocument();
  });

  it('shows live price changes when available', () => {
    renderWithProviders(<MarketplaceList {...defaultProps} />);
    
    // Netflix should show live price change
    expect(screen.getByText('+5.00 (1.11%)')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    
    // Apple should show live price change
    expect(screen.getByText('+4.50 (2.56%)')).toBeInTheDocument();
  });

  it('handles investments without live quotes', () => {
    const propsWithoutLiveQuotes = {
      ...defaultProps,
      liveQuotes: new Map(),
    };
    
    renderWithProviders(<MarketplaceList {...propsWithoutLiveQuotes} />);
    
    // Should not show live price changes
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('calls onBuy when Invest Now button is clicked', () => {
    renderWithProviders(<MarketplaceList {...defaultProps} />);
    
    const investButtons = screen.getAllByText('Invest Now');
    fireEvent.click(investButtons[0]); // Click Netflix Invest Now button
    
    expect(defaultProps.onBuy).toHaveBeenCalledWith(mockInvestments[0]);
  });

  it('calls onEdit when Edit button is clicked', () => {
    renderWithProviders(<MarketplaceList {...defaultProps} />);
    
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]); // Click Netflix Edit button
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockInvestments[0]);
  });

  it('calls onDetails when Details button is clicked', () => {
    renderWithProviders(<MarketplaceList {...defaultProps} />);
    
    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]); // Click Netflix Details button
    
    expect(defaultProps.onDetails).toHaveBeenCalledWith(mockInvestments[0]);
  });

  it('disables Invest Now button for unavailable investments', () => {
    renderWithProviders(<MarketplaceList {...defaultProps} />);
    
    const unavailableButtons = screen.getAllByText('Not Available');
    expect(unavailableButtons[0]).toBeDisabled();
  });

  it('shows correct risk level styling', () => {
    renderWithProviders(<MarketplaceList {...defaultProps} />);
    
    // Check for risk level badges
    expect(screen.getAllByText('MEDIUM Risk')).toHaveLength(2);
    expect(screen.getByText('HIGH Risk')).toBeInTheDocument();
  });

  it('shows correct investment type styling', () => {
    renderWithProviders(<MarketplaceList {...defaultProps} />);
    
    // Check for investment type badges
    expect(screen.getAllByText('STOCK')).toHaveLength(2);
    expect(screen.getByText('CRYPTOCURRENCY')).toBeInTheDocument();
  });

  it('displays category and creation date', () => {
    renderWithProviders(<MarketplaceList {...defaultProps} />);
    
    expect(screen.getByText('Category: Entertainment')).toBeInTheDocument();
    expect(screen.getByText('Category: Technology')).toBeInTheDocument();
    expect(screen.getByText('Category: Cryptocurrency')).toBeInTheDocument();
    expect(screen.getAllByText('Added: 22/10/2025')).toHaveLength(3);
  });

  it('handles empty investments array', () => {
    const emptyProps = {
      ...defaultProps,
      investments: [],
    };
    
    renderWithProviders(<MarketplaceList {...emptyProps} />);
    
    expect(screen.queryByText('Netflix Inc.')).not.toBeInTheDocument();
    expect(screen.queryByText('Apple Inc.')).not.toBeInTheDocument();
  });

  it('handles missing optional props', () => {
    const minimalProps = {
      investments: mockInvestments,
    };
    
    renderWithProviders(<MarketplaceList {...minimalProps} />);
    
    // Should still render investments
    expect(screen.getByText('Netflix Inc.')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    renderWithProviders(<MarketplaceList {...defaultProps} />);
    
    // Check currency formatting
    expect(screen.getByText('USD $450')).toBeInTheDocument();
    expect(screen.getByText('USD $175.5')).toBeInTheDocument();
    expect(screen.getByText('USD $65,000')).toBeInTheDocument();
  });

  it('formats percentages correctly', () => {
    renderWithProviders(<MarketplaceList {...defaultProps} />);
    
    // Check percentage formatting
    expect(screen.getByText('10.50%')).toBeInTheDocument();
    expect(screen.getByText('8.50%')).toBeInTheDocument();
    expect(screen.getByText('15.00%')).toBeInTheDocument();
  });

  it('shows correct availability status', () => {
    renderWithProviders(<MarketplaceList {...defaultProps} />);
    
    // Available investments should have Invest Now button
    const investButtons = screen.getAllByText('Invest Now');
    expect(investButtons).toHaveLength(2);
    
    // Unavailable investments should have Not Available button
    const unavailableButtons = screen.getAllByText('Not Available');
    expect(unavailableButtons).toHaveLength(1);
  });
});
