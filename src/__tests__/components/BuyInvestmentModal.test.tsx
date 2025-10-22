import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BuyInvestmentModal from '@/components/BuyInvestmentModal';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the API
jest.mock('@/lib/api', () => ({
  investment: {
    buyPreview: jest.fn(),
    buy: jest.fn(),
  },
}));

const mockBuyPreview = require('@/lib/api').investment.buyPreview;
const mockBuy = require('@/lib/api').investment.buy;

const mockInvestment = {
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
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('BuyInvestmentModal', () => {
  const defaultProps = {
    investment: mockInvestment,
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    expect(screen.getByText('Buy Investment')).toBeInTheDocument();
    expect(screen.getByText('Netflix Inc. (NFLX)')).toBeInTheDocument();
    expect(screen.getByText('Leading streaming entertainment service')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const closedProps = {
      ...defaultProps,
      isOpen: false,
    };
    
    renderWithProviders(<BuyInvestmentModal {...closedProps} />);
    
    expect(screen.queryByText('Buy Investment')).not.toBeInTheDocument();
  });

  it('displays investment details correctly', () => {
    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    expect(screen.getByText('Current Price: USD $450')).toBeInTheDocument();
    expect(screen.getByText('Minimum Investment: USD $100')).toBeInTheDocument();
    expect(screen.getByText('Maximum Investment: USD $50,000')).toBeInTheDocument();
    expect(screen.getByText('Expected Return: 10.50%')).toBeInTheDocument();
  });

  it('renders quantity input field', () => {
    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    expect(quantityInput).toBeInTheDocument();
    expect(quantityInput).toHaveValue(1);
  });

  it('validates minimum quantity', async () => {
    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '0' } });
    
    const reviewButton = screen.getByText('Review Purchase');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText(/quantity must be at least 1/i)).toBeInTheDocument();
    });
  });

  it('validates maximum quantity', async () => {
    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '1000' } });
    
    const reviewButton = screen.getByText('Review Purchase');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText(/quantity exceeds maximum investment/i)).toBeInTheDocument();
    });
  });

  it('calculates total cost correctly', () => {
    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '5' } });
    
    expect(screen.getByText('Total Cost: USD $2,250')).toBeInTheDocument();
  });

  it('fetches buy preview when quantity changes', async () => {
    mockBuyPreview.mockResolvedValueOnce({
      data: {
        totalCost: 2250,
        fee: 22.5,
        totalAmount: 2272.5,
      },
    });

    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '5' } });

    await waitFor(() => {
      expect(mockBuyPreview).toHaveBeenCalledWith({
        investmentId: '1',
        quantity: 5,
      });
    });
  });

  it('shows preview details when available', async () => {
    mockBuyPreview.mockResolvedValueOnce({
      data: {
        totalCost: 2250,
        fee: 22.5,
        totalAmount: 2272.5,
      },
    });

    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '5' } });

    await waitFor(() => {
      expect(screen.getByText('Fee (1%): USD $22.50')).toBeInTheDocument();
      expect(screen.getByText('Total Amount: USD $2,272.50')).toBeInTheDocument();
    });
  });

  it('handles preview error gracefully', async () => {
    mockBuyPreview.mockRejectedValueOnce(new Error('Preview failed'));

    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '5' } });

    await waitFor(() => {
      expect(screen.getByText('Preview Error: Failed to fetch preview')).toBeInTheDocument();
      expect(screen.getByText('Using manual calculation above.')).toBeInTheDocument();
    });
  });

  it('proceeds to review step', async () => {
    mockBuyPreview.mockResolvedValueOnce({
      data: {
        totalCost: 2250,
        fee: 22.5,
        totalAmount: 2272.5,
      },
    });

    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '5' } });
    
    const reviewButton = screen.getByText('Review Purchase');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Review Your Purchase')).toBeInTheDocument();
      expect(screen.getByText('Netflix Inc. (NFLX)')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 5')).toBeInTheDocument();
      expect(screen.getByText('Price per Share: USD $450')).toBeInTheDocument();
      expect(screen.getByText('Total Cost: USD $2,250')).toBeInTheDocument();
      expect(screen.getByText('Fee (1%): USD $22.50')).toBeInTheDocument();
      expect(screen.getByText('Total Amount: USD $2,272.50')).toBeInTheDocument();
    });
  });

  it('completes purchase successfully', async () => {
    mockBuyPreview.mockResolvedValueOnce({
      data: {
        totalCost: 2250,
        fee: 22.5,
        totalAmount: 2272.5,
      },
    });

    mockBuy.mockResolvedValueOnce({
      data: {
        transaction: {
          id: 'tx-123',
          amount: 2272.5,
          status: 'COMPLETED',
        },
      },
    });

    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '5' } });
    
    const reviewButton = screen.getByText('Review Purchase');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Review Your Purchase')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Confirm Purchase');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockBuy).toHaveBeenCalledWith({
        investmentId: '1',
        quantity: 5,
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('handles purchase error', async () => {
    mockBuyPreview.mockResolvedValueOnce({
      data: {
        totalCost: 2250,
        fee: 22.5,
        totalAmount: 2272.5,
      },
    });

    mockBuy.mockRejectedValueOnce(new Error('Insufficient funds'));

    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '5' } });
    
    const reviewButton = screen.getByText('Review Purchase');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Review Your Purchase')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Confirm Purchase');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Purchase failed: Insufficient funds')).toBeInTheDocument();
    });
  });

  it('closes modal when cancel button is clicked', () => {
    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes modal when X button is clicked', () => {
    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows loading state during purchase', async () => {
    mockBuyPreview.mockResolvedValueOnce({
      data: {
        totalCost: 2250,
        fee: 22.5,
        totalAmount: 2272.5,
      },
    });

    mockBuy.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<BuyInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '5' } });
    
    const reviewButton = screen.getByText('Review Purchase');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Review Your Purchase')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Confirm Purchase');
    fireEvent.click(confirmButton);

    expect(confirmButton).toBeDisabled();
    expect(screen.getByText('Processing Purchase...')).toBeInTheDocument();
  });
});
