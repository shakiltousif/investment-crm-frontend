import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import DepositForm from '../components/DepositForm';
import { useToastHelpers } from '../components/ui/Toast';
import { api } from '../lib/api';

// Mock the toast helpers
vi.mock('../components/ui/Toast', () => ({
  useToastHelpers: vi.fn(),
}));

// Mock the API client
vi.mock('../lib/api', () => ({
  api: {
    deposits: {
      create: vi.fn(),
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
  FormField: ({ label, name, required, type }: any) => (
    <div>
      <label htmlFor={name}>
        {label}
        {required && <span>*</span>}
      </label>
      <input 
        id={name} 
        name={name} 
        type={type || 'text'}
        data-testid={name} 
      />
    </div>
  ),
  SelectField: ({ label, name, required, options }: any) => (
    <div>
      <label htmlFor={name}>
        {label}
        {required && <span>*</span>}
      </label>
      <select id={name} name={name} data-testid={name}>
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

const mockToastHelpers = {
  success: vi.fn(),
  error: vi.fn(),
};

const mockBankAccounts = [
  {
    id: 'account-1',
    accountHolderName: 'John Doe',
    accountNumber: '1234567890',
    bankName: 'Test Bank',
    accountType: 'Savings',
    currency: 'USD',
    balance: 10000,
    isVerified: true,
    isPrimary: true,
  },
  {
    id: 'account-2',
    accountHolderName: 'John Doe',
    accountNumber: '0987654321',
    bankName: 'Another Bank',
    accountType: 'Checking',
    currency: 'USD',
    balance: 5000,
    isVerified: true,
    isPrimary: false,
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('DepositForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToastHelpers as any).mockReturnValue(mockToastHelpers);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields correctly', () => {
    renderWithRouter(
      <DepositForm
        bankAccounts={mockBankAccounts}
        onSuccess={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Bank Account')).toBeInTheDocument();
    expect(screen.getByText('Transfer Method')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByTestId('amount')).toBeInTheDocument();
    expect(screen.getByTestId('bankAccountId')).toBeInTheDocument();
    expect(screen.getByTestId('transferMethod')).toBeInTheDocument();
    expect(screen.getByTestId('description')).toBeInTheDocument();
  });

  it('should render bank account options correctly', () => {
    renderWithRouter(
      <DepositForm
        bankAccounts={mockBankAccounts}
        onSuccess={() => {}}
        onCancel={() => {}}
      />
    );

    const select = screen.getByTestId('bankAccountId');
    const options = select.querySelectorAll('option');
    
    expect(options).toHaveLength(3); // 2 accounts + 1 placeholder
    expect(options[1]).toHaveTextContent('Test Bank - ****7890 (USD)');
    expect(options[2]).toHaveTextContent('Another Bank - ****4321 (USD)');
  });

  it('should render transfer method options correctly', () => {
    renderWithRouter(
      <DepositForm
        bankAccounts={mockBankAccounts}
        onSuccess={() => {}}
        onCancel={() => {}}
      />
    );

    const select = screen.getByTestId('transferMethod');
    const options = select.querySelectorAll('option');
    
    expect(options).toHaveLength(4); // 3 methods + 1 placeholder
    expect(options[1]).toHaveTextContent('FPS (1-2 hours)');
    expect(options[2]).toHaveTextContent('CHAPS (2-4 hours)');
    expect(options[3]).toHaveTextContent('SWIFT (1-3 business days)');
  });

  it('should call onSuccess after successful deposit creation', async () => {
    const mockOnSuccess = vi.fn();
    const mockDepositData = {
      amount: 1000,
      currency: 'USD',
      bankAccountId: 'account-1',
      transferMethod: 'FPS',
      description: 'Test deposit',
    };

    (api.deposits.create as any).mockResolvedValue({ data: mockDepositData });

    renderWithRouter(
      <DepositForm
        bankAccounts={mockBankAccounts}
        onSuccess={mockOnSuccess}
        onCancel={() => {}}
      />
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(api.deposits.create).toHaveBeenCalledWith(mockDepositData);
      expect(mockToastHelpers.success).toHaveBeenCalledWith('Deposit request submitted successfully');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', async () => {
    const mockOnSuccess = vi.fn();
    const mockError = {
      response: {
        data: {
          message: 'Deposit creation failed',
        },
      },
    };

    (api.deposits.create as any).mockRejectedValue(mockError);

    renderWithRouter(
      <DepositForm
        bankAccounts={mockBankAccounts}
        onSuccess={mockOnSuccess}
        onCancel={() => {}}
      />
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToastHelpers.error).toHaveBeenCalledWith(
        'Failed to create deposit request',
        'Deposit creation failed'
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should handle generic errors', async () => {
    const mockOnSuccess = vi.fn();
    const mockError = new Error('Network error');

    (api.deposits.create as any).mockRejectedValue(mockError);

    renderWithRouter(
      <DepositForm
        bankAccounts={mockBankAccounts}
        onSuccess={mockOnSuccess}
        onCancel={() => {}}
      />
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToastHelpers.error).toHaveBeenCalledWith(
        'Failed to create deposit request',
        'An unexpected error occurred'
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    const mockOnCancel = vi.fn();

    renderWithRouter(
      <DepositForm
        bankAccounts={mockBankAccounts}
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
      <DepositForm
        bankAccounts={mockBankAccounts}
        onSuccess={() => {}}
        onCancel={() => {}}
      />
    );

    const requiredIndicators = screen.getAllByText('*');
    expect(requiredIndicators).toHaveLength(3); // Amount, Bank Account, Transfer Method
  });

  it('should set default values correctly', () => {
    renderWithRouter(
      <DepositForm
        bankAccounts={mockBankAccounts}
        onSuccess={() => {}}
        onCancel={() => {}}
      />
    );

    const amountInput = screen.getByTestId('amount');
    const transferMethodSelect = screen.getByTestId('transferMethod');

    expect(amountInput).toHaveAttribute('type', 'number');
    expect(transferMethodSelect).toHaveValue('FPS');
  });

  it('should handle empty bank accounts list', () => {
    renderWithRouter(
      <DepositForm
        bankAccounts={[]}
        onSuccess={() => {}}
        onCancel={() => {}}
      />
    );

    const select = screen.getByTestId('bankAccountId');
    const options = select.querySelectorAll('option');
    
    expect(options).toHaveLength(1); // Only placeholder
    expect(options[0]).toHaveTextContent('Select an account');
  });

  it('should handle bank accounts with different currencies', () => {
    const multiCurrencyAccounts = [
      {
        id: 'account-1',
        accountHolderName: 'John Doe',
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        accountType: 'Savings',
        currency: 'USD',
        balance: 10000,
        isVerified: true,
        isPrimary: true,
      },
      {
        id: 'account-2',
        accountHolderName: 'John Doe',
        accountNumber: '0987654321',
        bankName: 'Another Bank',
        accountType: 'Checking',
        currency: 'EUR',
        balance: 5000,
        isVerified: true,
        isPrimary: false,
      },
    ];

    renderWithRouter(
      <DepositForm
        bankAccounts={multiCurrencyAccounts}
        onSuccess={() => {}}
        onCancel={() => {}}
      />
    );

    const select = screen.getByTestId('bankAccountId');
    const options = select.querySelectorAll('option');
    
    expect(options[1]).toHaveTextContent('Test Bank - ****7890 (USD)');
    expect(options[2]).toHaveTextContent('Another Bank - ****4321 (EUR)');
  });
});
