import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SellInvestmentModal from '@/components/SellInvestmentModal';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the API
jest.mock('@/lib/api', () => ({
  investment: {
    sellPreview: jest.fn(),
    sell: jest.fn(),
  },
}));

const mockSellPreview = require('@/lib/api').investment.sellPreview;
const mockSell = require('@/lib/api').investment.sell;

const mockInvestment = {
  id: '1',
  name: 'Netflix Inc.',
  symbol: 'NFLX',
  quantity: 5,
  purchasePrice: 400,
  currentPrice: 450,
  totalValue: 2250,
  totalGain: 250,
  gainPercentage: 12.5,
  purchaseDate: '2025-01-01T00:00:00Z',
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

describe('SellInvestmentModal', () => {
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
    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    expect(screen.getByText('Sell Investment')).toBeInTheDocument();
    expect(screen.getByText('Netflix Inc. (NFLX)')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const closedProps = {
      ...defaultProps,
      isOpen: false,
    };
    
    renderWithProviders(<SellInvestmentModal {...closedProps} />);
    
    expect(screen.queryByText('Sell Investment')).not.toBeInTheDocument();
  });

  it('displays investment details correctly', () => {
    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    expect(screen.getByText('Current Price: USD $450')).toBeInTheDocument();
    expect(screen.getByText('Available: 5.0000 units')).toBeInTheDocument();
    expect(screen.getByText('Purchase Price: USD $400')).toBeInTheDocument();
    expect(screen.getByText('Total Gain: USD $250 (12.50%)')).toBeInTheDocument();
  });

  it('renders quantity input field with default value', () => {
    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity to sell/i);
    expect(quantityInput).toBeInTheDocument();
    expect(quantityInput).toHaveValue(1);
  });

  it('validates minimum quantity', async () => {
    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity to sell/i);
    fireEvent.change(quantityInput, { target: { value: '0' } });
    
    const reviewButton = screen.getByText('Review Sale');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText(/quantity must be at least 1/i)).toBeInTheDocument();
    });
  });

  it('validates maximum quantity', async () => {
    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity to sell/i);
    fireEvent.change(quantityInput, { target: { value: '10' } });
    
    const reviewButton = screen.getByText('Review Sale');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText(/quantity exceeds available units/i)).toBeInTheDocument();
    });
  });

  it('calculates proceeds correctly', () => {
    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity to sell/i);
    fireEvent.change(quantityInput, { target: { value: '2' } });
    
    expect(screen.getByText('Total Proceeds: USD $900')).toBeInTheDocument();
  });

  it('fetches sell preview when quantity changes', async () => {
    mockSellPreview.mockResolvedValueOnce({
      data: {
        proceeds: 900,
        fee: 9,
        netProceeds: 891,
        gainLoss: 100,
        returnPercent: 12.5,
      },
    });

    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity to sell/i);
    fireEvent.change(quantityInput, { target: { value: '2' } });

    await waitFor(() => {
      expect(mockSellPreview).toHaveBeenCalledWith({
        investmentId: '1',
        quantity: 2,
      });
    });
  });

  it('shows preview details when available', async () => {
    mockSellPreview.mockResolvedValueOnce({
      data: {
        proceeds: 900,
        fee: 9,
        netProceeds: 891,
        gainLoss: 100,
        returnPercent: 12.5,
      },
    });

    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity to sell/i);
    fireEvent.change(quantityInput, { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText('Fee (1%): -USD $9.00')).toBeInTheDocument();
      expect(screen.getByText('Net Proceeds: USD $891.00')).toBeInTheDocument();
      expect(screen.getByText('Gain/Loss: USD $100.00')).toBeInTheDocument();
      expect(screen.getByText('Return %: 12.50%')).toBeInTheDocument();
    });
  });

  it('handles preview error gracefully', async () => {
    mockSellPreview.mockRejectedValueOnce(new Error('Preview failed'));

    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity to sell/i);
    fireEvent.change(quantityInput, { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText('Preview Error: Failed to fetch preview')).toBeInTheDocument();
      expect(screen.getByText('Using manual calculation above.')).toBeInTheDocument();
    });
  });

  it('proceeds to review step', async () => {
    mockSellPreview.mockResolvedValueOnce({
      data: {
        proceeds: 900,
        fee: 9,
        netProceeds: 891,
        gainLoss: 100,
        returnPercent: 12.5,
      },
    });

    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity to sell/i);
    fireEvent.change(quantityInput, { target: { value: '2' } });
    
    const reviewButton = screen.getByText('Review Sale');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Review Your Sale')).toBeInTheDocument();
      expect(screen.getByText('Netflix Inc. (NFLX)')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
      expect(screen.getByText('Price per Share: USD $450')).toBeInTheDocument();
      expect(screen.getByText('Total Proceeds: USD $900')).toBeInTheDocument();
      expect(screen.getByText('Fee (1%): -USD $9.00')).toBeInTheDocument();
      expect(screen.getByText('Net Proceeds: USD $891.00')).toBeInTheDocument();
    });
  });

  it('completes sale successfully', async () => {
    mockSellPreview.mockResolvedValueOnce({
      data: {
        proceeds: 900,
        fee: 9,
        netProceeds: 891,
        gainLoss: 100,
        returnPercent: 12.5,
      },
    });

    mockSell.mockResolvedValueOnce({
      data: {
        transaction: {
          id: 'tx-123',
          amount: 891,
          status: 'COMPLETED',
        },
      },
    });

    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity to sell/i);
    fireEvent.change(quantityInput, { target: { value: '2' } });
    
    const reviewButton = screen.getByText('Review Sale');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Review Your Sale')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Confirm Sale');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockSell).toHaveBeenCalledWith({
        investmentId: '1',
        quantity: 2,
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('handles sale error', async () => {
    mockSellPreview.mockResolvedValueOnce({
      data: {
        proceeds: 900,
        fee: 9,
        netProceeds: 891,
        gainLoss: 100,
        returnPercent: 12.5,
      },
    });

    mockSell.mockRejectedValueOnce(new Error('Sale failed'));

    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity to sell/i);
    fireEvent.change(quantityInput, { target: { value: '2' } });
    
    const reviewButton = screen.getByText('Review Sale');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Review Your Sale')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Confirm Sale');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Sale failed: Sale failed')).toBeInTheDocument();
    });
  });

  it('closes modal when cancel button is clicked', () => {
    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes modal when X button is clicked', () => {
    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows loading state during sale', async () => {
    mockSellPreview.mockResolvedValueOnce({
      data: {
        proceeds: 900,
        fee: 9,
        netProceeds: 891,
        gainLoss: 100,
        returnPercent: 12.5,
      },
    });

    mockSell.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<SellInvestmentModal {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity to sell/i);
    fireEvent.change(quantityInput, { target: { value: '2' } });
    
    const reviewButton = screen.getByText('Review Sale');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Review Your Sale')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Confirm Sale');
    fireEvent.click(confirmButton);

    expect(confirmButton).toBeDisabled();
    expect(screen.getByText('Processing Sale...')).toBeInTheDocument();
  });

  it('shows loss correctly', () => {
    const lossInvestment = {
      ...mockInvestment,
      purchasePrice: 500,
      currentPrice: 450,
      totalGain: -250,
      gainPercentage: -12.5,
    };

    const lossProps = {
      ...defaultProps,
      investment: lossInvestment,
    };

    renderWithProviders(<SellInvestmentModal {...lossProps} />);
    
    expect(screen.getByText('Total Loss: USD $250 (-12.50%)')).toBeInTheDocument();
  });
});
