import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterForm from '@/components/RegisterForm';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the API
jest.mock('@/lib/api', () => ({
  auth: {
    register: jest.fn(),
  },
}));

const mockRegister = require('@/lib/api').auth.register;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields correctly', () => {
    renderWithProviders(<RegisterForm />);
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<RegisterForm />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderWithProviders(<RegisterForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('validates password strength', async () => {
    renderWithProviders(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    renderWithProviders(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123!' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    mockRegister.mockResolvedValueOnce({
      data: {
        data: {
          user: mockUser,
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
        },
      },
    });

    renderWithProviders(<RegisterForm />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+1234567890' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'SecurePass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'SecurePass123!' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        password: 'SecurePass123!',
      });
    });
  });

  it('handles registration error', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Email already exists'));

    renderWithProviders(<RegisterForm />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+1234567890' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'SecurePass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'SecurePass123!' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<RegisterForm />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+1234567890' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'SecurePass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'SecurePass123!' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
  });
});
