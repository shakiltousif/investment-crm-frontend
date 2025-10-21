import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PortfolioForm from '../components/PortfolioForm';
import { useToastHelpers } from '../components/ui/Toast';
import { api } from '../lib/api';

// Mock the toast helpers
vi.mock('../components/ui/Toast', () => ({
  useToastHelpers: vi.fn(),
}));

// Mock the API client
vi.mock('../lib/api', () => ({
  api: {
    portfolios: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock the form components
vi.mock('../components/ui/Form', () => ({
  Form: ({ children, onSubmit, defaultValues }: any) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(defaultValues); }}>
      {children}
    </form>
  ),
  FormField: ({ label, name, required }: any) => (
    <div>
      <label htmlFor={name}>
        {label}
        {required && <span>*</span>}
      </label>
      <input id={name} name={name} data-testid={name} />
    </div>
  ),
}));

const mockToastHelpers = {
  success: vi.fn(),
  error: vi.fn(),
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PortfolioForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToastHelpers as any).mockReturnValue(mockToastHelpers);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields correctly', () => {
    renderWithRouter(
      <PortfolioForm
        onSuccess={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Portfolio Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByTestId('name')).toBeInTheDocument();
    expect(screen.getByTestId('description')).toBeInTheDocument();
  });

  it('should call onSuccess after successful creation', async () => {
    const mockOnSuccess = vi.fn();
    const mockPortfolioData = {
      name: 'Test Portfolio',
      description: 'Test Description',
    };

    (api.portfolios.create as any).mockResolvedValue({ data: mockPortfolioData });

    renderWithRouter(
      <PortfolioForm
        onSuccess={mockOnSuccess}
        onCancel={() => {}}
      />
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(api.portfolios.create).toHaveBeenCalledWith(mockPortfolioData);
      expect(mockToastHelpers.success).toHaveBeenCalledWith('Portfolio created successfully');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should call onSuccess after successful update', async () => {
    const mockOnSuccess = vi.fn();
    const mockInitialData = {
      id: 'portfolio-1',
      name: 'Existing Portfolio',
      description: 'Existing Description',
    };
    const mockUpdatedData = {
      name: 'Updated Portfolio',
      description: 'Updated Description',
    };

    (api.portfolios.update as any).mockResolvedValue({ data: mockUpdatedData });

    renderWithRouter(
      <PortfolioForm
        onSuccess={mockOnSuccess}
        onCancel={() => {}}
        initialData={mockInitialData}
        isEditing={true}
      />
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(api.portfolios.update).toHaveBeenCalledWith(mockInitialData.id, mockUpdatedData);
      expect(mockToastHelpers.success).toHaveBeenCalledWith('Portfolio updated successfully');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', async () => {
    const mockOnSuccess = vi.fn();
    const mockError = {
      response: {
        data: {
          message: 'Portfolio creation failed',
        },
      },
    };

    (api.portfolios.create as any).mockRejectedValue(mockError);

    renderWithRouter(
      <PortfolioForm
        onSuccess={mockOnSuccess}
        onCancel={() => {}}
      />
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToastHelpers.error).toHaveBeenCalledWith(
        'Failed to save portfolio',
        'Portfolio creation failed'
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should handle generic errors', async () => {
    const mockOnSuccess = vi.fn();
    const mockError = new Error('Network error');

    (api.portfolios.create as any).mockRejectedValue(mockError);

    renderWithRouter(
      <PortfolioForm
        onSuccess={mockOnSuccess}
        onCancel={() => {}}
      />
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToastHelpers.error).toHaveBeenCalledWith(
        'Failed to save portfolio',
        'An unexpected error occurred'
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    const mockOnCancel = vi.fn();

    renderWithRouter(
      <PortfolioForm
        onSuccess={() => {}}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show required field indicators', () => {
    renderWithRouter(
      <PortfolioForm
        onSuccess={() => {}}
        onCancel={() => {}}
      />
    );

    const requiredIndicators = screen.getAllByText('*');
    expect(requiredIndicators).toHaveLength(1); // Only name field is required
  });
});
