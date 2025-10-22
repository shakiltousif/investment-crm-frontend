import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PortfolioForm from '@/components/PortfolioForm';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the API
jest.mock('@/lib/api', () => ({
  portfolio: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const mockCreatePortfolio = require('@/lib/api').portfolio.create;
const mockUpdatePortfolio = require('@/lib/api').portfolio.update;

const mockPortfolio = {
  id: '1',
  name: 'Test Portfolio',
  description: 'A test portfolio',
  totalValue: 10000,
  totalInvested: 9000,
  totalGain: 1000,
  gainPercentage: 11.11,
  isActive: true,
  createdAt: '2025-10-22T00:00:00Z',
  updatedAt: '2025-10-22T00:00:00Z',
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

describe('PortfolioForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form when no portfolio provided', () => {
    renderWithProviders(<PortfolioForm {...defaultProps} />);
    
    expect(screen.getByText('Create Portfolio')).toBeInTheDocument();
    expect(screen.getByLabelText(/portfolio name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total invested/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total gain/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gain percentage/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create portfolio/i })).toBeInTheDocument();
  });

  it('renders edit form when portfolio provided', () => {
    const editProps = {
      ...defaultProps,
      portfolio: mockPortfolio,
    };
    
    renderWithProviders(<PortfolioForm {...editProps} />);
    
    expect(screen.getByText('Edit Portfolio')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Portfolio')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A test portfolio')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('9000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('11.11')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update portfolio/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<PortfolioForm {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /create portfolio/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/portfolio name is required/i)).toBeInTheDocument();
    });
  });

  it('validates numeric fields', async () => {
    renderWithProviders(<PortfolioForm {...defaultProps} />);
    
    const totalValueInput = screen.getByLabelText(/total value/i);
    fireEvent.change(totalValueInput, { target: { value: 'invalid' } });
    
    const submitButton = screen.getByRole('button', { name: /create portfolio/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/total value must be a valid number/i)).toBeInTheDocument();
    });
  });

  it('validates positive values', async () => {
    renderWithProviders(<PortfolioForm {...defaultProps} />);
    
    const totalValueInput = screen.getByLabelText(/total value/i);
    fireEvent.change(totalValueInput, { target: { value: '-100' } });
    
    const submitButton = screen.getByRole('button', { name: /create portfolio/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/total value must be positive/i)).toBeInTheDocument();
    });
  });

  it('creates portfolio successfully', async () => {
    mockCreatePortfolio.mockResolvedValueOnce({
      data: {
        portfolio: {
          id: '1',
          name: 'New Portfolio',
          description: 'A new portfolio',
          totalValue: 5000,
          totalInvested: 4500,
          totalGain: 500,
          gainPercentage: 11.11,
        },
      },
    });

    renderWithProviders(<PortfolioForm {...defaultProps} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/portfolio name/i), { target: { value: 'New Portfolio' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A new portfolio' } });
    fireEvent.change(screen.getByLabelText(/total value/i), { target: { value: '5000' } });
    fireEvent.change(screen.getByLabelText(/total invested/i), { target: { value: '4500' } });
    fireEvent.change(screen.getByLabelText(/total gain/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/gain percentage/i), { target: { value: '11.11' } });
    
    const submitButton = screen.getByRole('button', { name: /create portfolio/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreatePortfolio).toHaveBeenCalledWith({
        name: 'New Portfolio',
        description: 'A new portfolio',
        totalValue: 5000,
        totalInvested: 4500,
        totalGain: 500,
        gainPercentage: 11.11,
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('updates portfolio successfully', async () => {
    mockUpdatePortfolio.mockResolvedValueOnce({
      data: {
        portfolio: {
          ...mockPortfolio,
          name: 'Updated Portfolio',
        },
      },
    });

    const editProps = {
      ...defaultProps,
      portfolio: mockPortfolio,
    };

    renderWithProviders(<PortfolioForm {...editProps} />);
    
    // Update the name
    fireEvent.change(screen.getByLabelText(/portfolio name/i), { target: { value: 'Updated Portfolio' } });
    
    const submitButton = screen.getByRole('button', { name: /update portfolio/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdatePortfolio).toHaveBeenCalledWith('1', {
        name: 'Updated Portfolio',
        description: 'A test portfolio',
        totalValue: 10000,
        totalInvested: 9000,
        totalGain: 1000,
        gainPercentage: 11.11,
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('handles creation error', async () => {
    mockCreatePortfolio.mockRejectedValueOnce(new Error('Creation failed'));

    renderWithProviders(<PortfolioForm {...defaultProps} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/portfolio name/i), { target: { value: 'New Portfolio' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A new portfolio' } });
    fireEvent.change(screen.getByLabelText(/total value/i), { target: { value: '5000' } });
    fireEvent.change(screen.getByLabelText(/total invested/i), { target: { value: '4500' } });
    fireEvent.change(screen.getByLabelText(/total gain/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/gain percentage/i), { target: { value: '11.11' } });
    
    const submitButton = screen.getByRole('button', { name: /create portfolio/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/creation failed/i)).toBeInTheDocument();
    });
  });

  it('handles update error', async () => {
    mockUpdatePortfolio.mockRejectedValueOnce(new Error('Update failed'));

    const editProps = {
      ...defaultProps,
      portfolio: mockPortfolio,
    };

    renderWithProviders(<PortfolioForm {...editProps} />);
    
    const submitButton = screen.getByRole('button', { name: /update portfolio/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/update failed/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockCreatePortfolio.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<PortfolioForm {...defaultProps} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/portfolio name/i), { target: { value: 'New Portfolio' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A new portfolio' } });
    fireEvent.change(screen.getByLabelText(/total value/i), { target: { value: '5000' } });
    fireEvent.change(screen.getByLabelText(/total invested/i), { target: { value: '4500' } });
    fireEvent.change(screen.getByLabelText(/total gain/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/gain percentage/i), { target: { value: '11.11' } });
    
    const submitButton = screen.getByRole('button', { name: /create portfolio/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating portfolio/i)).toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', () => {
    renderWithProviders(<PortfolioForm {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes modal when X button is clicked', () => {
    renderWithProviders(<PortfolioForm {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    const closedProps = {
      ...defaultProps,
      isOpen: false,
    };
    
    renderWithProviders(<PortfolioForm {...closedProps} />);
    
    expect(screen.queryByText('Create Portfolio')).not.toBeInTheDocument();
  });

  it('validates gain percentage calculation', async () => {
    renderWithProviders(<PortfolioForm {...defaultProps} />);
    
    // Set values that don't match the gain percentage
    fireEvent.change(screen.getByLabelText(/total invested/i), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/total gain/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/gain percentage/i), { target: { value: '20' } });
    
    const submitButton = screen.getByRole('button', { name: /create portfolio/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/gain percentage does not match calculated value/i)).toBeInTheDocument();
    });
  });

  it('validates total value calculation', async () => {
    renderWithProviders(<PortfolioForm {...defaultProps} />);
    
    // Set values that don't match total value
    fireEvent.change(screen.getByLabelText(/total invested/i), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/total gain/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/total value/i), { target: { value: '1500' } });
    
    const submitButton = screen.getByRole('button', { name: /create portfolio/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/total value must equal total invested plus total gain/i)).toBeInTheDocument();
    });
  });
});