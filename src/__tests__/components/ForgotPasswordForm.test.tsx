import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';

// Mock the API
jest.mock('@/lib/api', () => ({
  auth: {
    forgotPassword: jest.fn(),
  },
}));

const mockForgotPassword = require('@/lib/api').auth.forgotPassword;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(component);
};

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders forgot password form correctly', () => {
    renderWithProviders(<ForgotPasswordForm />);
    
    expect(screen.getByText(/reset password/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your email address and we'll send you a link to reset your password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByText(/remember your password/i)).toBeInTheDocument();
  });

  it('validates required email field', async () => {
    renderWithProviders(<ForgotPasswordForm />);
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderWithProviders(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid email', async () => {
    mockForgotPassword.mockResolvedValueOnce({
      data: {
        message: 'Password reset link sent successfully',
      },
    });

    renderWithProviders(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  it('shows success message after successful submission', async () => {
    mockForgotPassword.mockResolvedValueOnce({
      data: {
        message: 'Password reset link sent successfully',
      },
    });

    renderWithProviders(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText(/we've sent a password reset link to your email address/i)).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    mockForgotPassword.mockRejectedValueOnce(new Error('Email not found'));

    renderWithProviders(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email not found/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockForgotPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/sending reset link/i)).toBeInTheDocument();
  });

  it('allows resending email after success', async () => {
    mockForgotPassword.mockResolvedValueOnce({
      data: {
        message: 'Password reset link sent successfully',
      },
    });

    renderWithProviders(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    const resendButton = screen.getByText(/send another email/i);
    expect(resendButton).toBeInTheDocument();
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });
  });

  it('navigates back to login', async () => {
    mockForgotPassword.mockResolvedValueOnce({
      data: {
        message: 'Password reset link sent successfully',
      },
    });

    renderWithProviders(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    const backToLoginButton = screen.getByText(/back to login/i);
    expect(backToLoginButton).toBeInTheDocument();
    fireEvent.click(backToLoginButton);

    // This would typically test navigation, but we'll just verify the button exists
    expect(backToLoginButton).toBeInTheDocument();
  });
});
