import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BankAccountForm from '@/components/BankAccountForm';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the API
jest.mock('@/lib/api', () => ({
  bankAccount: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    verify: jest.fn(),
  },
}));

const mockCreateBankAccount = require('@/lib/api').bankAccount.create;
const mockUpdateBankAccount = require('@/lib/api').bankAccount.update;
const mockDeleteBankAccount = require('@/lib/api').bankAccount.delete;
const mockVerifyBankAccount = require('@/lib/api').bankAccount.verify;

const mockBankAccount = {
  id: '1',
  accountHolderName: 'John Doe',
  accountNumber: '1234567890',
  bankName: 'Test Bank',
  bankCode: 'TB',
  accountType: 'SAVINGS',
  currency: 'USD',
  balance: 5000,
  isVerified: true,
  verifiedAt: '2025-10-22T00:00:00Z',
  isPrimary: true,
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

describe('BankAccountForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form when no bank account provided', () => {
    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    expect(screen.getByText('Add Bank Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/account holder name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bank name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sort code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/balance/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders edit form when bank account provided', () => {
    const editProps = {
      ...defaultProps,
      bankAccount: mockBankAccount,
    };
    
    renderWithProviders(<BankAccountForm {...editProps} />);
    
    expect(screen.getByText('Edit Bank Account')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Bank')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TB')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update account/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/account holder name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/account number is required/i)).toBeInTheDocument();
      expect(screen.getByText(/bank name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/sort code is required/i)).toBeInTheDocument();
    });
  });

  it('validates account number format', async () => {
    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    const accountNumberInput = screen.getByLabelText(/account number/i);
    fireEvent.change(accountNumberInput, { target: { value: '123' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/account number must be at least 8 digits/i)).toBeInTheDocument();
    });
  });

  it('validates balance format', async () => {
    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    const balanceInput = screen.getByLabelText(/balance/i);
    fireEvent.change(balanceInput, { target: { value: 'invalid' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/balance must be a valid number/i)).toBeInTheDocument();
    });
  });

  it('validates positive balance', async () => {
    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    const balanceInput = screen.getByLabelText(/balance/i);
    fireEvent.change(balanceInput, { target: { value: '-100' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/balance must be positive/i)).toBeInTheDocument();
    });
  });

  it('creates bank account successfully', async () => {
    mockCreateBankAccount.mockResolvedValueOnce({
      data: {
        bankAccount: {
          id: '1',
          accountHolderName: 'Jane Doe',
          accountNumber: '9876543210',
          bankName: 'New Bank',
          bankCode: 'NB',
          accountType: 'CHECKING',
          currency: 'USD',
          balance: 1000,
          isVerified: false,
          isPrimary: false,
        },
      },
    });

    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/account holder name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/account number/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByLabelText(/bank name/i), { target: { value: 'New Bank' } });
    fireEvent.change(screen.getByLabelText(/sort code/i), { target: { value: 'NB' } });
    fireEvent.change(screen.getByLabelText(/account type/i), { target: { value: 'CHECKING' } });
    fireEvent.change(screen.getByLabelText(/currency/i), { target: { value: 'USD' } });
    fireEvent.change(screen.getByLabelText(/balance/i), { target: { value: '1000' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateBankAccount).toHaveBeenCalledWith({
        accountHolderName: 'Jane Doe',
        accountNumber: '9876543210',
        bankName: 'New Bank',
        bankCode: 'NB',
        accountType: 'CHECKING',
        currency: 'USD',
        balance: 1000,
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('updates bank account successfully', async () => {
    mockUpdateBankAccount.mockResolvedValueOnce({
      data: {
        bankAccount: {
          ...mockBankAccount,
          accountHolderName: 'Updated Name',
        },
      },
    });

    const editProps = {
      ...defaultProps,
      bankAccount: mockBankAccount,
    };

    renderWithProviders(<BankAccountForm {...editProps} />);
    
    // Update the name
    fireEvent.change(screen.getByLabelText(/account holder name/i), { target: { value: 'Updated Name' } });
    
    const submitButton = screen.getByRole('button', { name: /update account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateBankAccount).toHaveBeenCalledWith('1', {
        accountHolderName: 'Updated Name',
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        bankCode: 'TB',
        accountType: 'SAVINGS',
        currency: 'USD',
        balance: 5000,
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('handles creation error', async () => {
    mockCreateBankAccount.mockRejectedValueOnce(new Error('Account number already exists'));

    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/account holder name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/account number/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByLabelText(/bank name/i), { target: { value: 'New Bank' } });
    fireEvent.change(screen.getByLabelText(/sort code/i), { target: { value: 'NB' } });
    fireEvent.change(screen.getByLabelText(/account type/i), { target: { value: 'CHECKING' } });
    fireEvent.change(screen.getByLabelText(/currency/i), { target: { value: 'USD' } });
    fireEvent.change(screen.getByLabelText(/balance/i), { target: { value: '1000' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/account number already exists/i)).toBeInTheDocument();
    });
  });

  it('handles update error', async () => {
    mockUpdateBankAccount.mockRejectedValueOnce(new Error('Update failed'));

    const editProps = {
      ...defaultProps,
      bankAccount: mockBankAccount,
    };

    renderWithProviders(<BankAccountForm {...editProps} />);
    
    const submitButton = screen.getByRole('button', { name: /update account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/update failed/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockCreateBankAccount.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/account holder name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/account number/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByLabelText(/bank name/i), { target: { value: 'New Bank' } });
    fireEvent.change(screen.getByLabelText(/sort code/i), { target: { value: 'NB' } });
    fireEvent.change(screen.getByLabelText(/account type/i), { target: { value: 'CHECKING' } });
    fireEvent.change(screen.getByLabelText(/currency/i), { target: { value: 'USD' } });
    fireEvent.change(screen.getByLabelText(/balance/i), { target: { value: '1000' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', () => {
    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes modal when X button is clicked', () => {
    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    const closedProps = {
      ...defaultProps,
      isOpen: false,
    };
    
    renderWithProviders(<BankAccountForm {...closedProps} />);
    
    expect(screen.queryByText('Add Bank Account')).not.toBeInTheDocument();
  });

  it('shows account type options', () => {
    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    const accountTypeSelect = screen.getByLabelText(/account type/i);
    fireEvent.click(accountTypeSelect);
    
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.getByText('Checking')).toBeInTheDocument();
  });

  it('shows currency options', () => {
    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.click(currencySelect);
    
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText('GBP')).toBeInTheDocument();
  });

  it('validates account holder name length', async () => {
    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/account holder name/i);
    fireEvent.change(nameInput, { target: { value: 'A' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/account holder name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('validates sort code format', async () => {
    renderWithProviders(<BankAccountForm {...defaultProps} />);
    
    const sortCodeInput = screen.getByLabelText(/sort code/i);
    fireEvent.change(sortCodeInput, { target: { value: '123' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/sort code must be 2-4 characters/i)).toBeInTheDocument();
    });
  });

  it('shows verification status for existing accounts', () => {
    const editProps = {
      ...defaultProps,
      bankAccount: mockBankAccount,
    };

    renderWithProviders(<BankAccountForm {...editProps} />);
    
    if (mockBankAccount.isVerified) {
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
    }
  });

  it('shows primary account status for existing accounts', () => {
    const editProps = {
      ...defaultProps,
      bankAccount: mockBankAccount,
    };

    renderWithProviders(<BankAccountForm {...editProps} />);
    
    if (mockBankAccount.isPrimary) {
      expect(screen.getByText(/primary account/i)).toBeInTheDocument();
    }
  });
});
